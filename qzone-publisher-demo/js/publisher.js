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
          <button class="photo-card" onclick="pickImages()" title="添加图片/视频">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="m6.5 17 4.2-4.6c.5-.5 1.2-.5 1.7 0l2 2.2m1.3-1.4 1.1-1.2c.5-.5 1.2-.5 1.7 0l1.7 1.9"/></svg>
            <span class="photo-cap">照片/视频</span>
          </button>
          <div class="quick-row">
            <button onclick="openSheet('at')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20.5c.8-3.5 3.6-5.5 7.5-5.5s6.7 2 7.5 5.5"/></svg>
              @好友
            </button>
            <button onclick="openSheet('topic')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 9h14M5 13h10M5 17h7"/></svg>
              添加标签
            </button>
            <button id="locEntry" onclick="openSheet('loc')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
              添加地点
            </button>
          </div>
        </div>
      </div>

      <div class="pub-card opts-card">
        <div class="opt" onclick="openSheet('vis')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 15.2c1.5.7 2.6 2 3 4.8"/></svg>
          <span>谁可以看</span>
          <span class="opt-val" id="visLabel">所有人可见</span>
        </div>
        <div class="opt" onclick="openSheet('settings')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.36.95A7 7 0 0 0 14 5.1L13.7 2.6h-3.4L10 5.1a7 7 0 0 0-2.5 1.44l-2.36-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .48.05.94.14 1.4l-2 1.55 2 3.46 2.36-.95A7 7 0 0 0 10 18.9l.3 2.5h3.4l.3-2.5a7 7 0 0 0 2.5-1.44l2.36.95 2-3.46-2-1.55c.09-.46.14-.92.14-1.4z"/></svg>
          <span>发表设置</span>
          <span class="chev">›</span>
        </div>
      </div>

      <div class="sync-entries">
        <div class="sync-item" id="syncSig" onclick="toggleSync('signature')">
          <button class="sync-circle" aria-label="同步到个性签名">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4.5 19.5 9.5 9 20H4v-5z"/><path d="m12.5 6.5 5 5"/></svg>
          </button>
          <span class="sync-label">个性签名</span>
        </div>
        <div class="sync-item" id="syncMoments" onclick="toggleSync('moments')">
          <button class="sync-circle" aria-label="同步到微信朋友圈">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17" opacity=".45"/><circle cx="12" cy="12" r="2.6"/></svg>
          </button>
          <span class="sync-label">朋友圈</span>
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
  if (getContentText() || state.images.length) {
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
  renderImages();
  updateVisLabel();
  updateLocVal();
  refreshState();
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

function renderImages() {
  const g = $('imgGrid');
  g.innerHTML = '';
  state.images.forEach((img, i) => {
    const t = document.createElement('div');
    t.className = 'img-tile';
    t.innerHTML = '<img src="' + img.url + '" alt=""><button class="del" data-i="' + i + '">×</button>';
    g.appendChild(t);
  });
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
    renderImages();
    updateVisLabel();
    updateLocVal();
    refreshState();
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
      images: state.images.map(i => i.dataUrl),
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
function pickImages() { $('fileInput').click(); }

/* 同步到个性签名 / 朋友圈：点击切换选中态 */
function toggleSync(which) {
  const item = $(which === 'signature' ? 'syncSig' : 'syncMoments');
  item.classList.toggle('on');
  const on = item.classList.contains('on');
  toast(on
    ? (which === 'signature' ? '将同步到个性签名 ✓（演示）' : '将同步到微信朋友圈 ✓（演示）')
    : '已取消同步');
}
