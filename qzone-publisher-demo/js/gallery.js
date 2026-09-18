/* ==========================================================================
   Gallery 全屏媒体查看器
   对外接口：
     openViewer(urls, startIndex)              — feed 浏览模式（只看不删）
     openViewer(urls, startIndex, { onDelete }) — 发布器模式（可删除）
       onDelete(removedIndex, remainingUrls)    — 删除回调，调用方更新 state.images
   ========================================================================== */

const viewer = () => document.getElementById('viewer');
const viewerTrack = () => document.getElementById('viewerTrack');
const viewerCounter = () => document.getElementById('viewerCounter');

let vList = [];           // 当前媒体 URL 列表
let vIndex = 0;           // 当前索引
let vDragging = false;
let vDragStartX = 0;
let vDragDX = 0;
let vOnDelete = null;     // 删除回调（null = 浏览模式，不显示删除按钮）
let vDeleting = false;    // 删除过渡保护：动画期间冻结页码更新

function isVideoURL(url) {
  return /\.(mp4|mov|webm|m4v)$/i.test(url);
}

/* 打开查看器 */
function openViewer(urls, startIndex, options) {
  if (!urls || urls.length === 0) return;
  vList = [...urls];
  vIndex = Math.max(0, Math.min(startIndex || 0, urls.length - 1));
  vOnDelete = (options && options.onDelete) || null;
  vDeleting = false;

  const track = viewerTrack();
  track.innerHTML = '';
  vList.forEach(src => {
    if (isVideoURL(src)) {
      const v = document.createElement('video');
      v.src = src; v.controls = true; v.playsInline = true; v.preload = 'metadata';
      track.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.draggable = false;
      track.appendChild(img);
    }
  });

  /* 删除按钮：仅发布器模式显示 */
  const delBtn = document.getElementById('viewerDelete');
  if (delBtn) delBtn.style.display = vOnDelete ? '' : 'none';

  vUpdate();
  viewer().classList.add('show');
}

function closeViewer() {
  const v = viewer();
  if (!v.classList.contains('show')) return;
  viewerTrack().querySelectorAll('video').forEach(el => el.pause());
  v.classList.remove('show');
  vOnDelete = null;
}

function vUpdate() {
  if (vDeleting) return;  /* 删除过渡保护：动画期间不更新页码 */
  viewerTrack().style.transform = 'translateX(' + (-vIndex * 100) + '%)';
  viewerCounter().textContent = (vIndex + 1) + '/' + vList.length;
}

function vGo(index) {
  vIndex = Math.max(0, Math.min(index, vList.length - 1));
  vUpdate();
}

/* 删除当前图片 */
function vDeleteCurrent() {
  if (!vOnDelete || vList.length === 0) return;

  /* 确认弹窗 */
  const confirm = document.getElementById('viewerConfirm');
  confirm.style.display = '';

  document.getElementById('viewerConfirmOk').onclick = () => {
    confirm.style.display = 'none';
    doDelete();
  };
  document.getElementById('viewerConfirmCancel').onclick = () => {
    confirm.style.display = 'none';
  };
}

function doDelete() {
  const removedIndex = vIndex;
  vList.splice(removedIndex, 1);

  /* 空列表 → 关闭 */
  if (vList.length === 0) {
    vOnDelete(removedIndex, []);
    closeViewer();
    return;
  }

  /* 计算跳转目标：删最后一张跳上一张，否则保持当前索引（后面的图滑过来） */
  if (vIndex >= vList.length) vIndex = vList.length - 1;

  /* 删除过渡保护：先标记，等动画结束再解锁 */
  vDeleting = true;

  /* 重建 track 内容 */
  const track = viewerTrack();
  track.innerHTML = '';
  vList.forEach(src => {
    if (isVideoURL(src)) {
      const v = document.createElement('video');
      v.src = src; v.controls = true; v.playsInline = true; v.preload = 'metadata';
      track.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.draggable = false;
      track.appendChild(img);
    }
  });

  /* 通知调用方 */
  vOnDelete(removedIndex, [...vList]);

  /* 延迟解锁 + 更新位置（等 CSS transition 完成） */
  viewerCounter().textContent = (vIndex + 1) + '/' + vList.length;
  setTimeout(() => {
    vDeleting = false;
    vUpdate();
  }, 300);
}

/* ==========================================================================
 * 事件绑定
 * ========================================================================== */
(function setupViewer() {
  document.addEventListener('DOMContentLoaded', () => {
    const v = viewer();
    const track = viewerTrack();

    /* 返回按钮 / 点击背景关闭 */
    document.getElementById('viewerBack').addEventListener('click', closeViewer);
    v.addEventListener('click', e => {
      if (e.target === v || e.target === track) closeViewer();
    });

    /* 删除按钮 */
    document.getElementById('viewerDelete').addEventListener('click', e => {
      e.stopPropagation();
      vDeleteCurrent();
    });

    /* 键盘 */
    window.addEventListener('keydown', e => {
      if (!v.classList.contains('show')) return;
      if (e.key === 'Escape') closeViewer();
      if (e.key === 'ArrowLeft') vGo(vIndex - 1);
      if (e.key === 'ArrowRight') vGo(vIndex + 1);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (vOnDelete) vDeleteCurrent();
      }
    });

    /* 指针拖拽滑动 */
    track.addEventListener('pointerdown', e => {
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
