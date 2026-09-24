/* ==========================================================================
 * at-input.js —— @好友交互的三段核心算法（纯前端，无后端依赖）
 *
 * Ⅰ. 输入检测 AtDetect
 *    只在「新输入恰好一个字符且是 @」时触发选择器：
 *    新旧文本公共前缀长度定位插入点 + 尾段校验（next[p+1..] === prev[p..]），
 *    粘贴大段含 @ 的文本（长度差 > 1）不会误触发。
 *
 * Ⅱ. 整段删除 AtDelete
 *    退格落在「@昵称 」段内 → 整段删除而非逐字符：
 *    昵称按长度降序进入正则交替（长名优先，防「@小」吞掉「@小明」），
 *    前瞻断言 (?=\s|@|$) 保证昵称段完整（「@小」后面还跟着「明」时不算完整段）。
 *
 * Ⅲ. 同名分配 AtAssign
 *    同昵称好友按文本中出现顺序一一对应（第 k 次出现 → 第 k 个同名好友），
 *    队列耗尽兜底为纯文本插入，不崩溃。
 *
 * 集成层 AtInput：编辑器接线（input 检测 / beforeinput 拦截删除 /
 * 光标快照），对外提供 openSelector（按钮入口）与 insertMention（选人插入）。
 * ========================================================================== */

/* ---------- 基础工具 ---------- */

/* 正则元字符转义：昵称可能含 . ( ) 等，进交替分支前必须转义 */
function atEscapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* 新旧文本公共前缀长度：定位本次输入的插入点 */
function atCommonPrefixLen(a, b) {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

/* ---------- 文本坐标 <-> DOM 位置（contenteditable 删段的基础） ---------- */

/* 光标（node, offset）→ 编辑器全文的文本下标 */
function atTextOffsetOfPoint(root, node, offset) {
  const r = document.createRange();
  try {
    r.setStart(root, 0);
    r.setEnd(node, offset);
  } catch (e) { return -1; }
  return r.toString().length;
}

/* 编辑器全文的文本下标 → DOM 位置（落在某个文本节点内） */
function atDomPointFromTextOffset(root, target) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let acc = 0, n;
  while ((n = walker.nextNode())) {
    if (acc + n.data.length >= target) return { node: n, offset: Math.max(0, target - acc) };
    acc += n.data.length;
  }
  return { node: root, offset: root.childNodes.length };
}

/* ==========================================================================
 * Ⅰ. 输入检测
 * ========================================================================== */
const AtDetect = {
  _last: '',

  reset(text) { this._last = text; },

  /* 检测本次文本变化是否为「恰好新输入了一个 @」。
     命中返回该 @ 的文本下标（插入点），否则返回 -1 */
  detectAt(next) {
    const prev = this._last;
    this._last = next;
    /* 长度恰好 +1 才可能是单字符输入；粘贴/删除/替换直接排除 */
    if (next.length !== prev.length + 1) return -1;
    const p = atCommonPrefixLen(prev, next);
    /* 插入点后的剩余文本必须与旧文本尾段完全一致（确证单字符插入） */
    if (next[p] === '@' && next.slice(p + 1) === prev.slice(p)) return p;
    return -1;
  }
};

/* ==========================================================================
 * Ⅱ. 整段删除
 * ========================================================================== */
const AtDelete = {
  /* 构造段匹配正则源：@(?:长名|短名)(?=\\s|@|$)
     长度降序：让「@小明」先于「@小」被尝试匹配 */
  _source(names) {
    const uniq = [...new Set(names)].filter(Boolean).sort((a, b) => b.length - a.length);
    return uniq.length ? '@(?:' + uniq.map(atEscapeRe).join('|') + ')(?=\\s|@|$)' : null;
  },

  /* 尝试整段删除：光标前文本以「@昵称 + 可选尾随空格」结尾时，
     删除整段并把光标落回段首。命中返回 true（调用方需 preventDefault） */
  tryDeleteSegment(editor, names) {
    const src = this._source(names);
    if (!src) return false;
    const sel = window.getSelection();
    if (!sel.rangeCount || !sel.isCollapsed) return false;
    const r = sel.getRangeAt(0);
    if (!editor.contains(r.startContainer)) return false;

    const caret = atTextOffsetOfPoint(editor, r.startContainer, r.startOffset);
    if (caret < 0) return false;
    const before = editor.textContent.slice(0, caret);

    /* 尾部锚定匹配：段尾正好停在光标处，可一并吞掉一个尾随空格 */
    const m = new RegExp(src + '(\\s?)$').exec(before);
    if (!m) return false;

    const start = caret - m[0].length;
    const p1 = atDomPointFromTextOffset(editor, start);
    const p2 = atDomPointFromTextOffset(editor, caret);
    const del = document.createRange();
    del.setStart(p1.node, p1.offset);
    del.setEnd(p2.node, p2.offset);
    del.deleteContents();

    /* 光标落回删除起点 */
    del.collapse(true);
    sel.removeAllRanges();
    sel.addRange(del);
    return true;
  }
};

/* ==========================================================================
 * Ⅲ. 同名分配
 * ========================================================================== */
const AtAssign = {
  /* 统计文本中完整「@昵称」段的出现次数（前瞻断言保证不数半个名字） */
  countOccurrences(text, name) {
    const re = new RegExp('@' + atEscapeRe(name) + '(?=\\s|@|$)', 'g');
    let n = 0;
    while (re.exec(text)) n++;
    return n;
  },

  /* 第 k 次出现对应的同名好友（按好友表顺序逐个消费）；耗尽返回 null */
  friendForOccurrence(friends, name, k) {
    return friends.filter(f => f.name === name)[k - 1] || null;
  }
};

/* ==========================================================================
 * 集成层：编辑器接线 + 对外接口
 * ========================================================================== */
const AtInput = {
  editor: null,
  getFriends: null,
  onOpen: null,
  pendingAtOffset: -1,   /* 输入触发的裸 @ 的文本下标；-1 = 按钮入口（无 @ 可吃） */
  savedCaret: null,      /* 光标快照：选人时编辑器失焦，插回原位用 */

  init(editor, getFriends, onOpen) {
    this.editor = editor;
    this.getFriends = getFriends;
    this.onOpen = onOpen;
    AtDetect.reset(editor.textContent);

    /* Ⅰ. 输入检测：新输入恰好一个 @ → 唤起选择器 */
    editor.addEventListener('input', () => {
      const off = AtDetect.detectAt(editor.textContent);
      if (off >= 0) this.openSelector(off);
    });

    /* Ⅱ. 整段删除：拦截退格，命中则整段删除并手动触发 input（刷新发布器状态） */
    editor.addEventListener('beforeinput', e => {
      if (e.inputType !== 'deleteContentBackward') return;
      const names = this.getFriends().map(f => f.name);
      if (AtDelete.tryDeleteSegment(editor, names)) {
        e.preventDefault();
        AtDetect.reset(editor.textContent);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    /* 光标快照：selectionchange 持续记录编辑器内的光标，失焦后仍可恢复 */
    document.addEventListener('selectionchange', () => {
      const s = window.getSelection();
      if (s.rangeCount && editor.contains(s.getRangeAt(0).startContainer)) {
        this.savedCaret = s.getRangeAt(0).cloneRange();
      }
    });
  },

  /* 打开选择器。atOffset：输入触发时传裸 @ 的下标；按钮入口不传（-1） */
  openSelector(atOffset) {
    this.pendingAtOffset = typeof atOffset === 'number' ? atOffset : -1;
    this.onOpen();
  },

  /* 选人后的插入入口（好友列表点击调用） */
  insertMention(friend) {
    const ed = this.editor;
    /* 恢复光标到打开选择器时的位置（点列表导致编辑器失焦） */
    if (this.savedCaret) {
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(this.savedCaret);
    }
    /* 输入触发：先吃掉刚打的那个裸 @，避免出现 @@昵称 */
    if (this.pendingAtOffset >= 0) {
      this._deleteTextRange(this.pendingAtOffset, this.pendingAtOffset + 1);
      this.pendingAtOffset = -1;
    }
    /* Ⅲ. 同名分配：本次是第几次出现 → 对应第几个同名好友；耗尽兜底纯文本 */
    const k = AtAssign.countOccurrences(ed.textContent, friend.name) + 1;
    const valid = !!AtAssign.friendForOccurrence(this.getFriends(), friend.name, k);
    /* 尾随空格用 NBSP：execCommand('insertHTML') 会丢弃末尾普通空格，
       导致后续文字贴住 tag、前瞻断言 (?=\s) 失效 */
    if (valid) {
      insertHTML('<span class="tag" contenteditable="false">@' + escapeHtml(friend.name) + '</span>&nbsp;');
    } else {
      insertHTML(escapeHtml('@' + friend.name + '\u00A0'));  /* 队列耗尽：纯文本兜底 */
    }
    AtDetect.reset(ed.textContent);   /* 插入后同步基线，防止误触发 */
  },

  /* 按文本下标删除区间，光标落回起点 */
  _deleteTextRange(start, end) {
    const ed = this.editor;
    const p1 = atDomPointFromTextOffset(ed, start);
    const p2 = atDomPointFromTextOffset(ed, end);
    const r = document.createRange();
    r.setStart(p1.node, p1.offset);
    r.setEnd(p2.node, p2.offset);
    r.deleteContents();
    r.collapse(true);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
};
