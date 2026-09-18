/* ==========================================================================
 * 选图器：全屏子页面（全部/视频/照片 Tab + 网格多选 + 拍摄/相册底部栏）
 * 对外接口：openPicker() — 打开；完成回写 state.images 并返回发布器
 * ========================================================================== */

const pickerSelection = new Map();
let pickerTab = 'all';   // 'all' | 'video' | 'photo'
let pickerMode = 'album'; // 'camera' | 'album'（底部栏切换）
const PICKER_MAX = 9;

function openPicker() {
  let sub = document.getElementById('pickerPage');
  if (!sub) {
    sub = document.createElement('div');
    sub.className = 'pub-subpage picker-page';
    sub.id = 'pickerPage';
    document.querySelector('.pub-layer').appendChild(sub);
  }
  syncSelectionFromState();
  sub.innerHTML = buildPickerPage();
  bindPickerEvents(sub);
  requestAnimationFrame(() => sub.classList.add('show'));
}

function closePicker() {
  /* 有选中内容时自动完成（对齐真机：✕ = 确认选择并返回） */
  if (pickerSelection.size > 0) finishPick();
  const sub = document.getElementById('pickerPage');
  if (sub) sub.classList.remove('show');
}

function syncSelectionFromState() {
  pickerSelection.clear();
  state.images.forEach(it => {
    const url = it.isVideo ? it.videoSrc : it.dataUrl;
    if (url) pickerSelection.set(url, pickerSelection.size + 1);
  });
}

function getGridData() {
  if (pickerTab === 'video') return PICKER_VIDEOS.map(v => ({ src: v.src, video: true, cover: v.cover, duration: v.duration }));
  if (pickerTab === 'photo') return PICKER_PHOTOS.map(src => ({ src }));
  /* all: 视频和照片交错混排（每 10 张照片插 1 个视频） */
  const vids = PICKER_VIDEOS.map(v => ({ src: v.src, video: true, cover: v.cover, duration: v.duration }));
  const photos = PICKER_PHOTOS.map(src => ({ src }));
  const mixed = [];
  let vi = 0, pi = 0;
  while (pi < photos.length || vi < vids.length) {
    for (let k = 0; k < 10 && pi < photos.length; k++) mixed.push(photos[pi++]);
    if (vi < vids.length) mixed.push(vids[vi++]);
  }
  return mixed;
}

function buildPickerPage() {
  const count = pickerSelection.size;
  return `
    <div class="pk-topbar">
      <button class="pk-album-name">最近照片 <span class="pk-arrow-down">▾</span></button>
      <button class="pk-close" id="pkClose">✕</button>
    </div>
    <div class="pk-tabs">
      <button class="pk-tab${pickerTab === 'all' ? ' on' : ''}" data-tab="all">全部</button>
      <button class="pk-tab${pickerTab === 'video' ? ' on' : ''}" data-tab="video">视频</button>
      <button class="pk-tab${pickerTab === 'photo' ? ' on' : ''}" data-tab="photo">照片</button>
    </div>
    <div class="pk-body" id="pkBody">${buildGridHTML()}</div>
    <div class="pk-bottom">
      <button class="pk-mode-btn${pickerMode === 'camera' ? ' on' : ''}" data-mode="camera">拍摄</button>
      <button class="pk-mode-btn${pickerMode === 'album' ? ' on' : ''}" data-mode="album">相册</button>
    </div>
  `;
}

function buildGridHTML() {
  const data = getGridData();
  return data.map(item => {
    const on = pickerSelection.has(item.src);
    const order = on ? pickerSelection.get(item.src) : '';
    if (item.video) {
      return `
        <div class="pk-cell" data-src="${item.src}">
          <img src="${item.cover}" alt="" draggable="false">
          <span class="pk-play"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></span>
          <span class="pk-dur">0:${String(item.duration).padStart(2, '0')}</span>
          <span class="pk-check${on ? ' on' : ''}">${order}</span>
        </div>`;
    }
    return `
      <div class="pk-cell" data-src="${item.src}">
        <img src="${item.src}" alt="" draggable="false" loading="lazy">
        <span class="pk-check${on ? ' on' : ''}">${order}</span>
      </div>`;
  }).join('');
}

function refreshPicker() {
  const sub = document.getElementById('pickerPage');
  if (!sub) return;
  document.getElementById('pkBody').innerHTML = buildGridHTML();
}

function bindPickerEvents(sub) {
  /* ✕ 关闭 */
  sub.querySelector('#pkClose').addEventListener('click', () => closePicker());
  /* Tab 切换 */
  sub.querySelectorAll('.pk-tab').forEach(t => {
    t.addEventListener('click', () => {
      pickerTab = t.dataset.tab;
      sub.querySelectorAll('.pk-tab').forEach(x => x.classList.toggle('on', x === t));
      refreshPicker();
    });
  });
  /* 底部模式切换 */
  sub.querySelectorAll('.pk-mode-btn').forEach(b => {
    b.addEventListener('click', () => {
      pickerMode = b.dataset.mode;
      sub.querySelectorAll('.pk-mode-btn').forEach(x => x.classList.toggle('on', x === b));
      if (pickerMode === 'camera') {
        const input = document.getElementById('cameraInput');
        if (input) { input.value = ''; input.click(); }
      }
    });
  });
  /* 网格点击（委托） */
  document.getElementById('pkBody').addEventListener('click', e => {
    const cell = e.target.closest('.pk-cell');
    if (!cell) return;
    const src = cell.dataset.src;
    if (pickerSelection.has(src)) {
      const removed = pickerSelection.get(src);
      pickerSelection.delete(src);
      for (const [k, v] of pickerSelection) {
        if (v > removed) pickerSelection.set(k, v - 1);
      }
    } else {
      if (pickerSelection.size >= PICKER_MAX) {
        toast('最多选择 ' + PICKER_MAX + ' 个');
        return;
      }
      pickerSelection.set(src, pickerSelection.size + 1);
    }
    refreshPicker();
  });
}

function finishPick() {
  if (pickerSelection.size === 0) return;
  const entries = [...pickerSelection.entries()].sort((a, b) => a[1] - b[1]).map(([url]) => url);
  const items = entries.map(url => {
    if (/\.mp4$/i.test(url)) {
      const v = PICKER_VIDEOS.find(x => x.src === url);
      return { url: v.cover, dataUrl: v.cover, isVideo: true, videoSrc: url, duration: v.duration };
    }
    return { url, dataUrl: url };
  });
  state.images = items;
  renderImages();
  refreshState();
  closePicker();
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('cameraInput');
  if (!input) return;
  input.addEventListener('change', async () => {
    const f = input.files && input.files[0];
    if (!f) return;
    const dataUrl = await compressImage(f);
    if (!dataUrl) return;
    state.images.push({ url: dataUrl, dataUrl });
    renderImages();
    refreshState();
    closePicker();
    toast('拍照已添加 📷');
  });
});
