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
  state.visibility = 'public';
  state.location = null;
  imgEditing = false;
  pubSettings.scheduled = false;
  pubSettings.autoDelete = false;
  pubSettings.aiDeclare = false;
  renderImages();
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
    state.images.splice(+del.dataset.i, 1);
    renderImages();
    refreshState();
  });
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
    if (state.images.length >= 9) { toast('最多 9 张图啦'); break; }
    const dataUrl = await compressImage(f);
    if (dataUrl) state.images.push({ url: dataUrl, dataUrl });
  }
  renderImages();
  refreshState();
});

/* 编辑态标记：长按图片后进入，显示删除按钮 */
let imgEditing = false;

function renderImages() {
  const g = $('imgGrid');
  g.innerHTML = '';
  /* 保持编辑态 class */
  g.classList.toggle('editing', imgEditing);

  /* 有图时隐藏大方块入口（九宫格内有小方块），无图时显示 */
  const bigBtn = $('photoCardBtn');
  if (bigBtn) bigBtn.style.display = state.images.length > 0 ? 'none' : '';

  state.images.forEach((img, i) => {
    const t = document.createElement('div');
    t.className = 'img-tile';
    if (img.isVideo) {
      t.innerHTML = '<img src="' + img.url + '" alt="">' +
        '<span class="pk-play"><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<span class="tile-dur">0:' + String(img.duration || 10).padStart(2, '0') + '</span>' +
        '<button class="del" data-i="' + i + '">×</button>';
    } else {
      t.innerHTML = '<img src="' + img.url + '" alt=""><button class="del" data-i="' + i + '">×</button>';
    }
    /* 长按进入编辑态 */
    t.addEventListener('contextmenu', e => { e.preventDefault(); enterImgEdit(); });
    let longTimer = null;
    t.addEventListener('touchstart', () => { longTimer = setTimeout(enterImgEdit, 500); }, { passive: true });
    t.addEventListener('touchend', () => clearTimeout(longTimer));
    t.addEventListener('touchmove', () => clearTimeout(longTimer));
    g.appendChild(t);
  });

  /* 照片/视频小方块：有图且未满 9 张时追加在九宫格末尾（无图时由大方块入口负责） */
  if (state.images.length > 0 && state.images.length < 9) {
    const addTile = document.createElement('div');
    addTile.className = 'img-tile img-add-tile';
    addTile.innerHTML = '<button class="photo-card-inline" onclick="pickImages()">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="m6.5 17 4.2-4.6c.5-.5 1.2-.5 1.7 0l2 2.2m1.3-1.4 1.1-1.2c.5-.5 1.2-.5 1.7 0l1.7 1.9"/></svg>' +
      '<span class="photo-cap">照片/视频</span></button>';
    g.appendChild(addTile);
  }
}

function enterImgEdit() {
  if (imgEditing) return;
  imgEditing = true;
  $('imgGrid').classList.add('editing');
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
    state.visibility = d.visibility || 'public';
    state.location = d.location || null;
    /* AI 声明从草稿恢复（内容属性）；定时/自动删除不恢复，保持默认关 */
    if (d.aiDeclare) pubSettings.aiDeclare = true;
    renderImages();
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

  setTimeout(() => {
    const posts = loadPosts();
    posts.unshift({
      id: 'p' + Date.now(),
      mine: true,
      text: editor.innerHTML,
      images: state.images.map(i => i.isVideo ? i.videoSrc : i.dataUrl),
      visibility: state.visibility,
      location: state.location,
      time: Date.now(),
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
    toast('发表成功 🎉');
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
const pubSettings = { scheduled: false, autoDelete: false, aiDeclare: false };

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

/* 定时时间格式化（暂用当前时间+1小时占位，日期选择器在第三批实现） */
function formatScheduleTime() {
  const d = new Date(Date.now() + 3600e3);
  const p = n => String(n).padStart(2, '0');
  return p(d.getMonth() + 1) + '月' + p(d.getDate()) + '日 ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ' 发表';
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
  /* 第一张卡：定时发表 + 发表24小时自动删除（共享一张卡，中间分割线） */
  const card1 = `
    <div class="sub-group">
      <div class="sub-switch-row" data-key="scheduled">
        <svg class="sub-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
        <span class="label">定时发表</span>
        <span class="switch${pubSettings.scheduled ? ' on' : ''}"></span>
      </div>
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
    /* 发表设置：点击开关行 */
    const swRow = e.target.closest('.sub-switch-row[data-key]');
    if (swRow) {
      const key = swRow.dataset.key;
      pubSettings[key] = !pubSettings[key];
      const sw = swRow.querySelector('.switch');
      if (sw) sw.classList.toggle('on');
      updateSettingsLabel();   /* 实时刷新发表设置行右侧文案 */
      return;
    }
  });
});
