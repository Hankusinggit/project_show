/* ==========================================================================
   Gallery 全屏媒体查看器
   对外接口：openViewer(urls, startIndex)
   urls: 媒体 URL 数组（图片 .jpg/.png/.gif 或视频 .mp4/.mov/.webm）
   startIndex: 初始显示第几张（从 0 开始）
   ========================================================================== */

const viewer = () => document.getElementById('viewer');
const viewerTrack = () => document.getElementById('viewerTrack');
const viewerCounter = () => document.getElementById('viewerCounter');

let vList = [];        // 当前媒体 URL 列表
let vIndex = 0;        // 当前索引
let vDragging = false;
let vDragStartX = 0;
let vDragDX = 0;

/* 判断是否视频 */
function isVideoURL(url) {
  return /\.(mp4|mov|webm|m4v)$/i.test(url);
}

/* 打开查看器 */
function openViewer(urls, startIndex) {
  if (!urls || urls.length === 0) return;
  vList = urls;
  vIndex = Math.max(0, Math.min(startIndex || 0, urls.length - 1));

  const track = viewerTrack();
  track.innerHTML = '';
  urls.forEach(src => {
    if (isVideoURL(src)) {
      const v = document.createElement('video');
      v.src = src;
      v.controls = true;
      v.playsInline = true;
      v.preload = 'metadata';
      track.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.draggable = false;
      track.appendChild(img);
    }
  });

  vUpdate();
  viewer().classList.add('show');
}

/* 关闭查看器 */
function closeViewer() {
  const v = viewer();
  if (!v.classList.contains('show')) return;
  /* 暂停所有视频 */
  viewerTrack().querySelectorAll('video').forEach(el => el.pause());
  v.classList.remove('show');
}

/* 更新滑动位置 + 计数器 */
function vUpdate() {
  viewerTrack().style.transform = 'translateX(' + (-vIndex * 100) + '%)';
  viewerCounter().textContent = (vIndex + 1) + '/' + vList.length;
}

/* 切换到指定索引 */
function vGo(index) {
  vIndex = Math.max(0, Math.min(index, vList.length - 1));
  vUpdate();
}

/* ==========================================================================
 * 事件绑定（DOMContentLoaded 后执行）
 * ========================================================================== */
(function setupViewer() {
  document.addEventListener('DOMContentLoaded', () => {
    const v = viewer();
    const track = viewerTrack();

    /* 点击背景关闭 */
    v.addEventListener('click', e => {
      if (e.target === v || e.target === track) closeViewer();
    });

    /* 关闭按钮 */
    const closeBtn = document.getElementById('viewerClose');
    if (closeBtn) closeBtn.addEventListener('click', closeViewer);

    /* 键盘导航 */
    window.addEventListener('keydown', e => {
      if (!v.classList.contains('show')) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') vGo(vIndex - 1);
      if (e.key === 'ArrowRight') vGo(vIndex + 1);
    });

    /* 指针拖拽滑动 */
    track.addEventListener('pointerdown', e => {
      /* 视频区域不拦截（让原生控件工作） */
      if (e.target.tagName === 'VIDEO') return;
      vDragging = true;
      vDragStartX = e.clientX;
      vDragDX = 0;
      track.classList.add('dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', e => {
      if (!vDragging) return;
      vDragDX = e.clientX - vDragStartX;
      const base = -vIndex * track.offsetWidth;
      track.style.transform = 'translateX(' + (base + vDragDX) + 'px)';
    });

    const endDrag = () => {
      if (!vDragging) return;
      vDragging = false;
      track.classList.remove('dragging');
      const threshold = track.offsetWidth * 0.22;
      if (vDragDX < -threshold) vGo(vIndex + 1);
      else if (vDragDX > threshold) vGo(vIndex - 1);
      else vUpdate();
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
  });
})();
