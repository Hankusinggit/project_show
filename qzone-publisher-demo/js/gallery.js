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

/* ---------- 双指缩放 / 平移 / 双击（只作用于当前页图片，机身与轨道不动） ---------- */
const vZoom = { scale: 1, x: 0, y: 0 };  // 当前页缩放状态（x/y 为屏幕像素平移）
const vPointers = new Map();             // 活动指针 {pointerId: {x, y}}
let vPinch = null;                       // 双指捏合起始快照
let vPan = null;                         // 单指平移起点（放大态）
let vLastTap = null;                     // 上次点按（双击检测）
let vTapTimer = null;                    // 单击延迟关闭（等双击窗口）

/* 禁用浏览器原生双指缩放（否则整个页面含手机外壳一起被缩放） */
['gesturestart', 'gesturechange', 'gestureend'].forEach(type =>
  document.addEventListener(type, e => e.preventDefault(), { passive: false })
);
document.addEventListener('touchmove', e => {
  if (e.touches.length >= 2) e.preventDefault();
}, { passive: false });

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
  vResetZoom(false);
  viewer().classList.add('show');
}

function closeViewer() {
  const v = viewer();
  if (!v.classList.contains('show')) return;
  viewerTrack().querySelectorAll('video').forEach(el => el.pause());
  clearTimeout(vTapTimer); vTapTimer = null;
  vResetZoom(false);
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
  vResetZoom(false);  /* 切页后新图不带上一页的缩放 */
  vUpdate();
}

/* ---------- 缩放实现 ---------- */

function vCurrentImg() {
  return viewerTrack().children[vIndex];
}

/* 把缩放状态应用到当前页图片 */
function vApplyZoom(animate) {
  const img = vCurrentImg();
  if (!img || img.tagName === 'VIDEO') return;
  img.style.transition = animate ? 'transform 0.25s ease' : 'none';
  img.style.transform =
    'translate(' + vZoom.x + 'px,' + vZoom.y + 'px) scale(' + vZoom.scale + ')';
}

/* 重置缩放（切页 / 删除 / 关闭时调用） */
function vResetZoom(animate) {
  vZoom.scale = 1; vZoom.x = 0; vZoom.y = 0;
  viewerTrack().querySelectorAll('img').forEach(el => {
    el.style.transition = animate ? 'transform 0.25s ease' : 'none';
    el.style.transform = '';
  });
}

/* 平移越界钳制：不让图片被拖出可视区 */
function vClampPan() {
  const img = vCurrentImg();
  if (!img) return;
  const maxX = (vZoom.scale - 1) * img.clientWidth / 2;
  const maxY = (vZoom.scale - 1) * img.clientHeight / 2;
  vZoom.x = Math.min(maxX, Math.max(-maxX, vZoom.x));
  vZoom.y = Math.min(maxY, Math.max(-maxY, vZoom.y));
}

/* 双击：1 ↔ 2.5 缩放切换（以双击点为中心） */
function vToggleZoom(cx, cy) {
  const img = vCurrentImg();
  if (!img || img.tagName === 'VIDEO') return;
  if (vZoom.scale > 1) {
    vZoom.scale = 1; vZoom.x = 0; vZoom.y = 0;
    vApplyZoom(true);
    return;
  }
  const r = img.getBoundingClientRect();  /* scale=1 时 rect 即布局位置 */
  const s = 2.5;
  vZoom.scale = s;
  vZoom.x = (cx - r.left) * (1 - s);      /* 保持双击点下的内容不动 */
  vZoom.y = (cy - r.top) * (1 - s);
  vClampPan();
  vApplyZoom(true);
}

/* 点按检测：单击关闭（延迟等双击）、双击缩放；放大态单击不关闭 */
function vHandleTap(x, y) {
  const now = Date.now();
  const isDouble = vLastTap && now - vLastTap.t < 300 &&
                   Math.hypot(x - vLastTap.x, y - vLastTap.y) < 40;
  if (isDouble) {
    vLastTap = null;
    clearTimeout(vTapTimer); vTapTimer = null;
    vToggleZoom(x, y);
    return;
  }
  vLastTap = { t: now, x, y };
  if (vZoom.scale > 1) return;
  clearTimeout(vTapTimer);
  vTapTimer = setTimeout(() => { vTapTimer = null; closeViewer(); }, 300);
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

  /* 重建后清除缩放残留 */
  vResetZoom(false);

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

    /* 返回按钮 / 点击背景关闭（图片区域的单击关闭由指针逻辑统一处理，见 endPointer） */
    document.getElementById('viewerBack').addEventListener('click', closeViewer);
    v.addEventListener('click', e => {
      if (e.target === v) closeViewer();
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

    /* ===== 指针交互：双指捏合缩放 / 放大态单指平移 / 原有左右滑切 ===== */
    track.addEventListener('pointerdown', e => {
      if (e.target.tagName === 'VIDEO') return;
      track.setPointerCapture(e.pointerId);
      vPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (vPointers.size === 2) {
        /* 第二指按下 → 进入捏合；打断可能进行中的单指滑动 */
        if (vDragging) {
          vDragging = false;
          track.classList.remove('dragging');
          track.style.transform = 'translateX(' + (-vIndex * 100) + '%)';
        }
        const img = vCurrentImg();
        if (!img || img.tagName === 'VIDEO') return;
        const [a, b] = [...vPointers.values()];
        const r = img.getBoundingClientRect();
        vPinch = {
          dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,  /* 初始指距 */
          startScale: vZoom.scale,                       /* 捏合起始缩放（快照，防止连乘飞涨） */
          baseL: r.left - vZoom.x,   /* 元素布局左上角（去除当前平移，不含缩放影响） */
          baseT: r.top - vZoom.y
        };
      } else if (vPointers.size === 1) {
        if (vZoom.scale > 1) {
          /* 放大态：单指 = 平移图片（不切页） */
          vPan = { x: e.clientX, y: e.clientY, zx: vZoom.x, zy: vZoom.y };
        } else {
          vDragging = true;
          vDragStartX = e.clientX;
          vDragDX = 0;
          track.classList.add('dragging');
        }
      }
    });

    track.addEventListener('pointermove', e => {
      if (!vPointers.has(e.pointerId)) return;
      vPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      /* 双指捏合：只缩放当前页图片，机身/轨道/顶栏不动 */
      if (vPinch && vPointers.size === 2) {
        const [a, b] = [...vPointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const ns = Math.min(4, Math.max(1, vPinch.startScale * dist / vPinch.dist));
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        /* 锚点：保持双指中点下的内容不随缩放漂移 */
        const px = (cx - vPinch.baseL - vZoom.x) / vZoom.scale;
        const py = (cy - vPinch.baseT - vZoom.y) / vZoom.scale;
        vZoom.scale = ns;
        vZoom.x = cx - vPinch.baseL - ns * px;
        vZoom.y = cy - vPinch.baseT - ns * py;
        vClampPan();
        vApplyZoom(false);
        return;
      }

      /* 放大态单指平移 */
      if (vPan && vPointers.size === 1 && vZoom.scale > 1) {
        vZoom.x = vPan.zx + (e.clientX - vPan.x);
        vZoom.y = vPan.zy + (e.clientY - vPan.y);
        vClampPan();
        vApplyZoom(false);
        return;
      }

      /* 缩放为 1 时：原有左右滑切 */
      if (!vDragging) return;
      vDragDX = e.clientX - vDragStartX;
      const base = -vIndex * track.offsetWidth;
      track.style.transform = 'translateX(' + (base + vDragDX) + 'px)';
    });

    const endPointer = (e, cancelled) => {
      if (!vPointers.has(e.pointerId)) return;
      vPointers.delete(e.pointerId);

      /* 捏合结束 */
      if (vPinch) {
        if (vPointers.size < 2) {
          vPinch = null;
          if (vPointers.size === 1) {
            /* 剩一指 → 无缝转为平移 */
            const [p] = [...vPointers.values()];
            vPan = { x: p.x, y: p.y, zx: vZoom.x, zy: vZoom.y };
          }
        }
        return;
      }

      /* 平移结束（放大态：小幅移动视为点按，走双击检测） */
      if (vPan) {
        if (vPointers.size === 0) {
          const moved = Math.hypot(e.clientX - vPan.x, e.clientY - vPan.y);
          vPan = null;
          if (!cancelled && moved < 6) vHandleTap(e.clientX, e.clientY);
        }
        return;
      }

      /* 滑切结束（原有逻辑 + 点按检测） */
      if (!vDragging) return;
      vDragging = false;
      track.classList.remove('dragging');
      const threshold = track.offsetWidth * 0.22;
      if (vDragDX < -threshold) vGo(vIndex + 1);
      else if (vDragDX > threshold) vGo(vIndex - 1);
      else vUpdate();
      if (!cancelled && Math.abs(vDragDX) < 6) vHandleTap(e.clientX, e.clientY);
    };
    track.addEventListener('pointerup', e => endPointer(e, false));
    track.addEventListener('pointercancel', e => endPointer(e, true));

    /* 桌面端触控板双指捏合：Chrome 触发 ctrl+wheel 而非 touch 事件，需单独处理 */
    track.addEventListener('wheel', e => {
      if (!e.ctrlKey) return;
      if (!v.classList.contains('show')) return;
      e.preventDefault();  /* 拦截浏览器整页缩放（含手机外壳） */
      const img = vCurrentImg();
      if (!img || img.tagName === 'VIDEO') return;
      const r = img.getBoundingClientRect();
      const cx = e.clientX, cy = e.clientY;
      const ns = Math.min(4, Math.max(1, vZoom.scale * Math.exp(-e.deltaY * 0.01)));
      /* 锚点：保持光标下的内容不动（与双指捏合同一套数学） */
      const baseL = r.left - vZoom.x, baseT = r.top - vZoom.y;
      const px = (cx - r.left) / vZoom.scale;
      const py = (cy - r.top) / vZoom.scale;
      vZoom.scale = ns;
      vZoom.x = cx - baseL - ns * px;
      vZoom.y = cy - baseT - ns * py;
      vClampPan();
      vApplyZoom(false);
    }, { passive: false });
  });
})();
