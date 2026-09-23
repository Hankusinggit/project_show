/* ==========================================================================
 * 发布器视图模板 —— 与浏览页完全解耦，由 JS 动态注入到 #pubLayer
 * 改发布器只需改这一段模板字符串，不影响浏览页 HTML
 * ========================================================================== */
const PUB_VIEW_HTML = `
  <div class="pub-clip">
  <div class="pub-col">
    <div class="pub-top">
      <button class="pub-cancel" onclick="cancelPublish()">取消</button>
      <span class="pub-title">写说说</span>
      <button class="pub-btn" id="pubBtn" onclick="doPublish()">发表</button>
    </div>

    <div class="pub-scroll">
      <div class="pub-card edit-card">
        <div class="editor is-empty" id="editor" contenteditable="true" data-ph="这一刻的想法…" spellcheck="false"></div>
        <div class="imgs" id="imgGrid"></div>
        <div class="media-area">
          <button class="photo-card" id="photoCardBtn" onclick="pickImages()" title="添加图片/视频">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="m6.5 17 4.2-4.6c.5-.5 1.2-.5 1.7 0l2 2.2m1.3-1.4 1.1-1.2c.5-.5 1.2-.5 1.7 0l1.7 1.9"/></svg>
            <span class="photo-cap">照片/视频</span>
          </button>
          <div class="quick-row">
            <button onclick="openSheet('at')">
              @好友
            </button>
            <button onclick="openSheet('topic')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 9h14M5 13h10M5 17h7"/></svg>
              添加标签
            </button>
            <button id="locEntry" onclick="openSheet('loc')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
              添加地点
            </button>
          </div>
        </div>
      </div>

      <div class="pub-card opts-card">
        <div class="opt" onclick="showSubpage('vis')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 15.2c1.5.7 2.6 2 3 4.8"/></svg>
          <span>谁可以看</span>
          <span class="opt-val" id="visLabel">所有人可见</span>
        </div>
        <div class="opt" onclick="showSubpage('settings')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.36.95A7 7 0 0 0 14 5.1L13.7 2.6h-3.4L10 5.1a7 7 0 0 0-2.5 1.44l-2.36-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .48.05.94.14 1.4l-2 1.55 2 3.46 2.36-.95A7 7 0 0 0 10 18.9l.3 2.5h3.4l.3-2.5a7 7 0 0 0 2.5-1.44l2.36.95 2-3.46-2-1.55c.09-.46.14-.92.14-1.4z"/></svg>
          <span>发表设置</span>
          <span class="opt-val" id="settingsLabel"></span>
          <span class="chev">›</span>
        </div>
      </div>

      <div class="sync-entries">
        <div class="sync-item" id="syncSig" onclick="toggleSync('signature')">
          <button class="sync-circle" aria-label="同步到个性签名">
            <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M21.395 15.035a40 40 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39 39 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673"/></svg>
          </button>
        </div>
        <div class="sync-item" id="syncMoments" onclick="toggleSync('moments')">
          <button class="sync-circle" aria-label="同步到微信朋友圈">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="m14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  </div>
`;

const EMO_PANEL_HTML = `
  <div class="emo-head"><span>表情</span><button onclick="toggleEmoji()">收起</button></div>
  <div class="emo-grid" id="emoGrid"></div>
`;

/* ==========================================================================
 * 发布器：开合 / 输入 / 富文本插入
 * ========================================================================== */
function openPublisher() {
  $('pubLayer').classList.add('open');
  restoreDraftIfAny();
  setTimeout(() => editor.focus(), 320);
}

function closePublisher() {
  $('pubLayer').classList.remove('open');
  closeEmoji();
}

function cancelPublish() {
  /* 有任何未落盘的内容都弹保存询问：文字 / 图片 / 发表设置任一非默认 */
  const hasSettingsChanged = pubSettings.scheduled || pubSettings.autoDelete || pubSettings.aiDeclare;
  if (getContentText() || state.images.length || hasSettingsChanged) {
    openDraftSheet();
  } else {
    closePublisher();
  }
}

/* 「是否保存草稿」底部弹层：保存 / 不保存 / 取消 */
function openDraftSheet() {
  const s = $('sheet');
  s.innerHTML = '';

  const handle = document.createElement('div');
  handle.className = 'sh-handle';
  s.appendChild(handle);
  const title = document.createElement('div');
  title.className = 'sh-title';
  title.textContent = '是否保存草稿？';
  s.appendChild(title);

  const mk = (label, fn, variant) => {
    const btn = document.createElement('button');
    btn.className = 'sh-row' + (variant ? ' ' + variant : '');
    btn.innerHTML = '<div>' + label + '</div>';
    btn.onclick = fn;
    s.appendChild(btn);
  };
  const sep = () => { const s1 = document.createElement('div'); s1.className = 'sh-sep'; s.appendChild(s1); };

  mk('保存草稿', () => {
    /* 只有真正有内容时才能保存：文字、图片、AI 声明任一非空 */
    const hasContent = getContentText() || state.images.length > 0 || pubSettings.aiDeclare;
    if (!hasContent) {
      toast('没有内容可以保存');
      return;
    }
    saveDraft();
    resetEditor();
    closeSheet();
    closePublisher();
  });

  sep();

  mk('不保存', () => {
    clearDraft();
    resetEditor();
    closeSheet();
    closePublisher();
  }, 'danger');

  sep();

  mk('取消', () => {
    closeSheet();
  });

  $('mask').classList.add('show');
  $('sheetWrap').classList.add('show');
}

function resetEditor() {
  editor.innerHTML = '';
  editor.classList.add('is-empty');
  state.images = [];
  imgList.reset(state.images);   /* 数据接口：整表清空（自动重渲染） */
  state.visibility = 'public';
  state.location = null;
  imgEditing = false;
  pubSettings.scheduled = false;
  pubSettings.scheduledTime = null;
  pubSettings.autoDelete = false;
  pubSettings.aiDeclare = false;
  updateVisLabel();
  updateLocVal();
  refreshState();
  updateSettingsLabel();
}

function getContentText() {
  return editor.textContent.replace(/\u00a0/g, ' ').trim();
}

function refreshState() {
  const has = !!getContentText() || state.images.length > 0;
  /* 「发表」按钮始终保持蓝色，空内容时加 .dim 让文字变浅（与真机一致） */
  $('pubBtn').classList.toggle('dim', !has);
}

/* 发布器事件绑定（在视图注入后调用，因为依赖注入后的 DOM 元素） */
function initEditorEvents() {
  editor.addEventListener('input', () => {
    editor.classList.toggle('is-empty', !getContentText());
    refreshState();
  });

  editor.addEventListener('paste', e => {
    e.preventDefault();
    const t = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, t);
  });

  /* 图片九宫格：删除走角标，添加走照片卡 */
  $('imgGrid').addEventListener('click', e => {
    const del = e.target.closest('.del');
    if (!del) return;
    imgList.remove(+del.dataset.i);   /* 数据接口：删除（自动重渲染） */
    refreshState();
  });

  /* 列表数据驱动渲染：imgList 的一切变更（增/删/换位/拖拽会话）自动重渲染 */
  imgList.onChange(renderImages);
}

function placeCaretEnd() {
  const r = document.createRange();
  r.selectNodeContents(editor);
  r.collapse(false);
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

/* 在光标处插入 HTML（表情 / 话题 / @好友 共用） */
function insertHTML(html) {
  editor.focus();
  const sel = window.getSelection();
  if (!sel.rangeCount || !editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
    placeCaretEnd();
  }
  document.execCommand('insertHTML', false, html);
  editor.classList.remove('is-empty');
  refreshState();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ==========================================================================
 * 发布器：图片（事件绑定在 initEditorEvents 中，因为依赖注入后的 DOM）
 * ========================================================================== */

$('fileInput').addEventListener('change', async e => {
  const files = [...e.target.files];
  e.target.value = '';
  for (const f of files) {
    if (imgList.size >= 9) { toast('最多 9 张图啦'); break; }
    const dataUrl = await compressImage(f);
    if (dataUrl) imgList.add({ url: dataUrl, dataUrl });   /* 数据接口：追加（自动重渲染） */
  }
  refreshState();
});

/* 编辑态标记：长按图片后进入，显示删除按钮 */
let imgEditing = false;

/* 发布器图片九宫格的列表状态：数据与拖拽会话统一走 LazyListState 数据接口，
   底层数组与 state.images 保持同引用（草稿/发表/选图器读旧字段不受影响） */
const imgList = new LazyListState(state.images);

function renderImages() {
  const g = $('imgGrid');
  /* 保持编辑态 class */
  g.classList.toggle('editing', imgEditing);

  /* 有图时隐藏大方块入口（九宫格内有小方块），无图时显示 */
  const bigBtn = $('photoCardBtn');
  if (bigBtn) bigBtn.style.display = imgList.size > 0 ? 'none' : '';

  /* FLIP 动画：以数据项为 key 记录旧位置（跨重渲染追踪同一项） */
  const oldPos = new Map();
  g.querySelectorAll('.img-tile:not(.img-add-tile)').forEach(t => {
    if (t.__item) oldPos.set(t.__item, t.getBoundingClientRect());
  });

  g.innerHTML = '';
  imgList.items.forEach((img, i) => {
    const t = document.createElement('div');
    t.className = 'img-tile';
    t.dataset.idx = i;
    t.__item = img;
    /* 拖拽会话中：被拖项的格子渲染为空槽 */
    if (imgList.dragIndex === i) t.classList.add('drag-src');
    if (img.isVideo) {
      t.innerHTML = '<img src="' + img.url + '" alt="" draggable="false">' +
        '<span class="pk-play"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<span class="tile-dur">0:' + String(img.duration || 10).padStart(2, '0') + '</span>' +
        '<button class="del" data-i="' + i + '">×</button>';
    } else {
      t.innerHTML = '<img src="' + img.url + '" alt="" draggable="false"><button class="del" data-i="' + i + '">×</button>';
    }
    /* 点击图片 → 全屏预览（发布器模式，可删除）；拖拽/滑动后的点击被抑制 */
    t.querySelector('img').addEventListener('click', e => {
      e.stopPropagation();
      if (tileClickSuppressed) return;
      const urls = imgList.items.map(it => it.isVideo ? it.videoSrc : it.dataUrl);
      openViewer(urls, i, {
        onDelete: (removedIdx, remaining) => {
          imgList.remove(removedIdx);
          refreshState();
        }
      });
    });
    /* 右键 → 编辑态（桌面兜底） */
    t.addEventListener('contextmenu', e => { e.preventDefault(); enterImgEdit(); });
    /* Pointer 统一手势：长按 500ms → 编辑态 + 拖拽换位（触屏/鼠标通用） */
    t.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('.del')) return;
      startTileGesture(t, i, e.clientX, e.clientY);
    });
    g.appendChild(t);
  });

  /* 照片/视频小方块：有图且未满 9 张时追加在九宫格末尾（无图时由大方块入口负责） */
  if (imgList.size > 0 && imgList.size < 9) {
    const addTile = document.createElement('div');
    addTile.className = 'img-tile img-add-tile';
    addTile.innerHTML = '<button class="photo-card-inline" onclick="pickImages()">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="m6.5 17 4.2-4.6c.5-.5 1.2-.5 1.7 0l2 2.2m1.3-1.4 1.1-1.2c.5-.5 1.2-.5 1.7 0l1.7 1.9"/></svg>' +
      '<span class="photo-cap">照片/视频</span></button>';
    g.appendChild(addTile);
  }

  /* FLIP 回放：位置变化过的项从旧位置滑到新位置（换位时其他项让位动画） */
  g.querySelectorAll('.img-tile:not(.img-add-tile)').forEach(t => {
    const o = oldPos.get(t.__item);
    if (!o) return;
    const n = t.getBoundingClientRect();
    const dx = Math.round(o.left - n.left), dy = Math.round(o.top - n.top);
    if (!dx && !dy) return;
    t.style.transition = 'none';
    t.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    void t.offsetWidth;  /* 强制回流，让初始位移先生效 */
    t.style.transition = 'transform 0.18s cubic-bezier(0.25, 0.8, 0.25, 1)';
    t.style.transform = '';
    t.addEventListener('transitionend', () => { t.style.transition = ''; }, { once: true });
  });
}

function enterImgEdit() {
  if (imgEditing) return;
  imgEditing = true;
  $('imgGrid').classList.add('editing');
}

/* ==========================================================================
 * 九宫格拖拽排序 —— 数据驱动（LazyListState）
 * 手势层只负责识别长按与跟手浮层（avatar）；换位全部通过数据接口完成：
 *   长按 500ms → imgList.beginDrag(i)     源格变空槽
 *   跨格移动  → imgList.move(drag, target) 列表实时重排（FLIP 让位动画）
 *   松手      → imgList.endDrag()          空槽落位
 * ========================================================================== */
let tileGesture = null;           /* 进行中的手势 */
let tileClickSuppressed = false;  /* 拖拽/滑动后抑制随之而来的 click（防误开预览） */

/* 静态几何计算落点格索引：不读 DOM 实时矩形 —— FLIP 让位动画中矩形
   处于中间态，按实时矩形找最近格会来回误判（自激抖动）。
   网格 3 列固定，格子几何与动画无关，直接按坐标换算 */
function tileIndexFromPoint(x, y) {
  const grid = $('imgGrid');
  const g = grid.getBoundingClientRect();
  const cols = 3;
  const rows = Math.ceil(imgList.size / cols);
  if (rows === 0) return -1;
  const cw = g.width / cols, ch = g.height / rows;
  const col = Math.floor((x - g.left) / cw);
  const row = Math.floor((y - g.top) / ch);
  /* 网格内：直接换算；略越界（半格容差）：钳制到边缘格；远离：无效 */
  if (col >= 0 && col < cols && row >= 0 && row < rows) {
    return Math.min(imgList.size - 1, row * cols + col);
  }
  if (x >= g.left - 40 && x <= g.right + 40 && y >= g.top - 40 && y <= g.bottom + 40) {
    const c = Math.min(cols - 1, Math.max(0, col));
    const r = Math.min(rows - 1, Math.max(0, row));
    return Math.min(imgList.size - 1, r * cols + c);
  }
  return -1;
}

function startTileGesture(tile, idx, x, y) {
  if (tileGesture) return;  /* 已有手势进行中（多指），忽略 */
  tileGesture = {
    tile, idx, startX: x, startY: y,
    longTimer: null, dragging: false, moved: false,
    avatar: null, grabDX: 0, grabDY: 0
  };
  tileGesture.longTimer = setTimeout(() => {
    enterImgEdit();
    beginTileDrag(tileGesture);
  }, 500);
  window.addEventListener('pointermove', onTilePointerMove);
  window.addEventListener('pointerup', onTilePointerUp);
  window.addEventListener('pointercancel', onTilePointerCancel);
}

/* 长按成立：克隆源格做跟手 avatar（放大 1.1 倍 + 阴影），
   再通过数据接口进入拖拽会话 → 空槽渲染（顺序不能反，克隆要在重渲染前） */
function beginTileDrag(g) {
  g.dragging = true;
  const r = g.tile.getBoundingClientRect();
  g.grabDX = g.startX - r.left;
  g.grabDY = g.startY - r.top;
  const avatar = g.tile.cloneNode(true);
  avatar.classList.add('drag-ghost');
  /* 基础位置固定在源格，跟手位移走 transform（合成层，不触发布局重排） */
  avatar.style.cssText += 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;' +
    'width:' + r.width + 'px;height:' + r.height + 'px;z-index:999;pointer-events:none;will-change:transform;';
  document.body.appendChild(avatar);
  g.avatar = avatar;
  document.body.classList.add('tile-dragging');
  imgList.beginDrag(g.idx);   /* 数据接口：进入拖拽会话 */
}

function onTilePointerMove(e) {
  const g = tileGesture;
  if (!g) return;
  /* 未进入拖拽：位移超阈值即判定滑动，取消长按（不误触发） */
  if (!g.dragging) {
    if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) >= 8) {
      clearTimeout(g.longTimer);
      g.moved = true;
    }
    return;
  }
  if (e.cancelable) e.preventDefault();
  /* avatar 跟手（transform 仅合成层；带上放大，避免覆盖 CSS 的 scale(1.1)） */
  g.avatar.style.transform = 'translate(' + (e.clientX - g.startX) + 'px,' + (e.clientY - g.startY) + 'px) scale(1.1)';
  /* 静态几何落点：跨格 → 数据接口实时换位，列表即时重排（其他项 FLIP 让位） */
  const to = tileIndexFromPoint(e.clientX, e.clientY);
  if (to >= 0) imgList.move(imgList.dragIndex, to);
}

function onTilePointerUp(e) { endTileGesture(e, false); }
function onTilePointerCancel(e) { endTileGesture(e, true); }

function endTileGesture(e, cancelled) {
  const g = tileGesture;
  if (!g) return;
  tileGesture = null;
  clearTimeout(g.longTimer);
  window.removeEventListener('pointermove', onTilePointerMove);
  window.removeEventListener('pointerup', onTilePointerUp);
  window.removeEventListener('pointercancel', onTilePointerCancel);

  /* 拖拽或滑动过后抑制 click（click 在 pointerup 后触发，防拖完误开预览） */
  if (g.dragging || g.moved) {
    tileClickSuppressed = true;
    setTimeout(() => { tileClickSuppressed = false; }, 100);
  }

  if (!g.dragging) return;
  /* 清理跟手浮层 */
  if (g.avatar) g.avatar.remove();
  document.body.classList.remove('tile-dragging');
  /* 系统打断：通过数据接口回退到起始位置 */
  if (cancelled && imgList.dragIndex >= 0 && imgList.dragIndex !== g.idx) {
    imgList.move(imgList.dragIndex, g.idx);
  }
  imgList.endDrag();   /* 数据接口：结束会话，空槽落位 */
}

/* 选中的图压缩成 dataURL，便于 localStorage 持久化 */
function compressImage(file) {
  return new Promise(res => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 900;
      const s = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
}

/* ==========================================================================
 * 发布器：草稿
 * ========================================================================== */
function restoreDraftIfAny() {
  const d = loadDraft();
  if (!d) return;
  const hasText = d.html && d.html.replace(/<[^>]*>/g, '').trim().length > 0;
  const hasImages = d.images && d.images.length > 0;
  if (hasText || hasImages) {
    editor.innerHTML = d.html || '';
    editor.classList.toggle('is-empty', !getContentText());
    state.images = (d.images || []).map(u => ({ url: u, dataUrl: u }));
    imgList.reset(state.images);   /* 数据接口：整表恢复（自动重渲染） */
    state.visibility = d.visibility || 'public';
    state.location = d.location || null;
    /* AI 声明从草稿恢复（内容属性）；定时/自动删除不恢复，保持默认关 */
    if (d.aiDeclare) pubSettings.aiDeclare = true;
    updateVisLabel();
    updateLocVal();
    refreshState();
    updateSettingsLabel();
  }
  /* 恢复完成即清除：草稿是一次性的，下次进入是干净状态 */
  clearDraft();
}

/* ==========================================================================
 * 发表
 * ========================================================================== */
function doPublish() {
  const btn = $('pubBtn');
  if (btn.classList.contains('busy')) return;
  /* 空内容：按钮可点击但给提示（真机的交互：始终蓝色，点空内容给反馈） */
  if (!getContentText() && state.images.length === 0) {
    toast('写点什么再发吧 ✏️');
    return;
  }
  btn.classList.add('busy');
  btn.textContent = '发布中…';

  /* 防御：开关已开但未选时间（异常路径）→ 兜底 now+1h，避免被当成普通发表立即发出 */
  let schedTime = pubSettings.scheduledTime;
  if (pubSettings.scheduled && !schedTime) schedTime = Date.now() + 3600e3;
  const isScheduled = pubSettings.scheduled && schedTime;
  setTimeout(() => {
    const posts = loadPosts();
    posts.unshift({
      id: 'p' + Date.now(),
      mine: true,
      text: editor.innerHTML,
      images: state.images.map(i => i.isVideo ? i.videoSrc : i.dataUrl),
      visibility: state.visibility,
      location: state.location,
      /* 定时发表：展示时间=定时时间，并记录 scheduledAt 供 feed 到点前隐藏 */
      time: isScheduled ? schedTime : Date.now(),
      scheduledAt: isScheduled ? schedTime : null,
      likes: 0,
      comments: 0,
    });
    savePosts(posts);
    clearDraft();
    resetEditor();

    btn.classList.remove('busy');
    btn.textContent = '发表';
    closePublisher();
    renderFeed();
    /* 定时发表：绿色 ✓ 顶部 toast（对齐真机截图）；普通发表沿用深色 toast */
    if (isScheduled) showTopToast('success', '定时说说设置成功');
    else toast('发表成功 🎉');
    $('screenScroll').scrollTo({ top: 0, behavior: 'smooth' });
  }, 700);
}

function updateVisLabel() {
  const v = DATA.visibilities.find(x => x.id === state.visibility);
  $('visLabel').textContent = v ? v.label : '所有人可见';
}
function updateLocVal() {
  const el = $('locEntry');
  el.textContent = state.location || '添加地点';
  el.classList.toggle('set', !!state.location);
}

/* ==========================================================================
 * 表情面板
 * ========================================================================== */
function buildEmojiGrid() {
  const g = $('emoGrid');
  DATA.emojis.forEach(e => {
    const b = document.createElement('button');
    b.textContent = e;
    b.onclick = () => insertHTML(e);
    g.appendChild(b);
  });
}
function toggleEmoji(e) {
  if (e) e.stopPropagation();
  $('emoPanel').classList.toggle('open');
}
function closeEmoji() { $('emoPanel').classList.remove('open'); }

/* 「图片/视频」圆按钮 → 打开系统选图 */
function pickImages() { openPicker(); }

/* 同步到个性签名 / 朋友圈：点击切换选中态 */
function toggleSync(which) {
  const item = $(which === 'signature' ? 'syncSig' : 'syncMoments');
  item.classList.toggle('on');
  const on = item.classList.contains('on');
  toast(on
    ? (which === 'signature' ? '将同步到个性签名 ✓（演示）' : '将同步到微信朋友圈 ✓（演示）')
    : '已取消同步');
}

/* ==========================================================================
 * 全屏子页面：谁可以看 / 发表设置
 * ========================================================================== */

/* 子页面状态：发表设置开关（scheduled/autoDelete 不随草稿持久化，
   aiDeclare 是内容属性，随草稿保存/恢复——对齐真机设计） */
const pubSettings = { scheduled: false, autoDelete: false, aiDeclare: false, scheduledTime: null };

/* 发表设置行右侧文案动态拼接：
   - 只有定时开 → 显示具体时间
   - 定时 + 其他项同时开 → 时间简化为「定时发表」（防文案过长截断）
   - 其他项 → 直接拼名字 */
function updateSettingsLabel() {
  const el = $('settingsLabel');
  if (!el) return;
  const parts = [];
  const hasOther = pubSettings.autoDelete || pubSettings.aiDeclare;
  if (pubSettings.scheduled) {
    parts.push(hasOther ? '定时发表' : formatScheduleTime());
  }
  if (pubSettings.autoDelete) parts.push('自动删除');
  if (pubSettings.aiDeclare) parts.push('已声明');
  el.textContent = parts.join('/');
}

/* 定时时间格式化（真实值，来自滚轮选择器写入的 scheduledTime） */
function _scheduleParts() {
  const d = new Date(pubSettings.scheduledTime || Date.now() + 3600e3);
  const p = n => String(n).padStart(2, '0');
  return { y: d.getFullYear(), mo: p(d.getMonth() + 1), dd: p(d.getDate()), hh: p(d.getHours()), mm: p(d.getMinutes()) };
}
/* 发布器行右侧文案：「09月23日 17:52 发表」（不带年份） */
function formatScheduleTime() {
  const s = _scheduleParts();
  return s.mo + '月' + s.dd + '日 ' + s.hh + ':' + s.mm + ' 发表';
}
/* 发表设置页内回显：「2026年09月23日 17:52」（带年份） */
function formatScheduleTimeFull() {
  const s = _scheduleParts();
  return s.y + '年' + s.mo + '月' + s.dd + '日 ' + s.hh + ':' + s.mm;
}

function showSubpage(kind) {
  /* 如果子页面容器不存在，先创建 */
  let sub = document.getElementById('pubSubpage');
  if (!sub) {
    sub = document.createElement('div');
    sub.className = 'pub-subpage';
    sub.id = 'pubSubpage';
    document.querySelector('.pub-layer').appendChild(sub);
  }

  if (kind === 'vis') {
    sub.innerHTML = buildVisPage();
  } else if (kind === 'settings') {
    sub.innerHTML = buildSettingsPage();
  }

  /* 绑定返回箭头 */
  sub.querySelector('.sub-back').addEventListener('click', hideSubpage);

  /* 触发滑入动画 */
  requestAnimationFrame(() => sub.classList.add('show'));
}

function hideSubpage() {
  const sub = document.getElementById('pubSubpage');
  if (!sub) return;
  sub.classList.remove('show');
}

/* 谁可以看页面（按截图：标题「谁能看见」+ 完成按钮 + 5 个选项 + 部分好友/不给谁看 右侧带 chevron） */
function buildVisPage() {
  /* 5 个选项：前 3 个直接选中状态，后 2 个有 chevron 跳转到二级选择 */
  const items = [
    { id: 'public',  label: '所有人', check: true },
    { id: 'friends', label: 'QQ好友', check: false },
    { id: 'private', label: '私密',   check: false },
    { id: 'partial', label: '部分好友', check: false, chevron: true },
    { id: 'forbid',  label: '不给谁看', check: false, chevron: true },
  ];
  const rows = items.map(it => {
    const checked = state.visibility === it.id;
    return `
    <div class="sub-list-row${it.chevron ? ' has-chev' : ''}" data-id="${it.id}">
      ${checked ? '<svg class="sub-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12 10 17 19 7"/></svg>' : '<span class="sub-check-spacer"></span>'}
      <span class="sub-list-label">${it.label}</span>
      ${it.chevron ? '<span class="sub-chev">›</span>' : ''}
    </div>
  `;
  }).join('');

  return `
    <div class="pub-subhead">
      <button class="sub-back">‹</button>
      <h3>谁能看见</h3>
      <button class="sub-done">完成</button>
    </div>
    <div class="pub-subbody">
      <div class="sub-list">${rows}</div>
    </div>
  `;
}

/* 发表设置页面（按截图：定时发表+自动删除 在同一张卡里，
   AI 声明 独立一张卡，下面带灰色描述） */
function buildSettingsPage() {
  /* 第一张卡：定时发表 + 发表24小时自动删除（共享一张卡，中间分割线）
     定时开启时，开关下方回显所选时间（带年份，对齐真机截图） */
  const timeRow = pubSettings.scheduled
    ? '<div class="sub-time-row">' + formatScheduleTimeFull() + '</div>'
    : '';
  const card1 = `
    <div class="sub-group">
      <div class="sub-switch-row" data-key="scheduled">
        <svg class="sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
        <span class="label">定时发表</span>
        <span class="switch${pubSettings.scheduled ? ' on' : ''}"></span>
      </div>
      ${timeRow}
      <div class="sub-switch-row" data-key="autoDelete">
        <svg class="sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
        <span class="label">发表24小时后自动删除</span>
        <span class="switch${pubSettings.autoDelete ? ' on' : ''}"></span>
      </div>
    </div>
  `;

  /* 第二张卡：AI 声明（独立卡 + 下方描述） */
  const card2 = `
    <div class="sub-group">
      <div class="sub-switch-row" data-key="aiDeclare">
        <svg class="sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2l4 1.5 1 4 2-1 2 1 1-4 4-1.5v-2l-4-1.5-1-4-2 1-2-1-1 4z"/><path d="M16 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>
        <span class="label">声明内容含AI生成</span>
        <span class="switch${pubSettings.aiDeclare ? ' on' : ''}"></span>
      </div>
    </div>
    <div class="sub-desc">发表AI相关的内容，可进行自主声明，便于他人区分虚拟内容和真实内容。</div>
  `;

  return `
    <div class="pub-subhead">
      <button class="sub-back">‹</button>
      <h3>发表设置</h3>
    </div>
    <div class="pub-subbody">
      ${card1}
      ${card2}
    </div>
  `;
}

/* 子页面事件委托：点击选项行切换可见性 / 点击开关行切换设置 */
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', e => {
    /* 完成按钮：返回主页 */
    if (e.target.closest('.sub-done')) {
      hideSubpage();
      return;
    }
    /* 谁可以看：点击选项行 */
    const visRow = e.target.closest('.sub-list-row[data-id]');
    if (visRow) {
      state.visibility = visRow.dataset.id;
      updateVisLabel();
      hideSubpage();
      return;
    }
    /* 发表设置：点击时间回显行 → 重新唤起选择器修改时间 */
    if (e.target.closest('.sub-time-row')) {
      _openSchedulePicker(false);
      return;
    }
    /* 发表设置：点击开关行 */
    const swRow = e.target.closest('.sub-switch-row[data-key]');
    if (swRow) {
      const key = swRow.dataset.key;
      /* 定时发表特殊处理：先点亮开关再弹滚轮选择器（对齐真机截图流程） */
      if (key === 'scheduled') {
        _openSchedulePicker(!pubSettings.scheduled);
        return;
      }
      pubSettings[key] = !pubSettings[key];
      const sw = swRow.querySelector('.switch');
      if (sw) sw.classList.toggle('on');
      updateSettingsLabel();   /* 实时刷新发表设置行右侧文案 */
      return;
    }
  });
});

/* 唤起定时滚轮选择器：wasOff = 本次是否首次开启（取消时据此回退开关） */
function _openSchedulePicker(wasOff) {
  pubSettings.scheduled = true;   /* 开关先点亮 */
  _refreshSettingsPage();
  openWheelPicker({
    defaultTime: pubSettings.scheduledTime,
    minTime: Date.now() + 60e3,
    maxTime: Date.now() + 10 * 86400e3,
    onConfirm: d => {
      pubSettings.scheduledTime = d.getTime();
      pubSettings.scheduled = true;
      _refreshSettingsPage();
      updateSettingsLabel();
    },
    onCancel: () => {
      if (wasOff) pubSettings.scheduled = false;   /* 首次开启又取消 → 回退 */
      _refreshSettingsPage();
      updateSettingsLabel();
    }
  });
}

/* 重渲染发表设置子页面（开关/时间行变化后）并重绑返回按钮 */
function _refreshSettingsPage() {
  const sub = document.getElementById('pubSubpage');
  if (!sub) return;
  sub.innerHTML = buildSettingsPage();
  const back = sub.querySelector('.sub-back');
  if (back) back.addEventListener('click', hideSubpage);
}
