/* ==========================================================================
 * WheelPicker —— 底部滚轮时间选择器（日期 / 时 / 分 三列）
 *
 * 交互对齐真机：
 *   - 底部弹层，顶栏「取消 / 确认」
 *   - 三列滚轮，CSS scroll-snap 原生滚动吸附（触屏/滚轮/触控板均可）
 *   - 选中项居中、加粗黑色；上下两条分隔线框出选中带
 *   - 日期列从当天起 N 天；确认时钳制到合法区间
 *
 * 对外接口：
 *   openWheelPicker({
 *     defaultTime,   // Date | timestamp，初始选中（缺省 now+1h）
 *     minTime,       // 合法下限（缺省 now）
 *     maxTime,       // 合法上限（缺省 now+10天）
 *     days,          // 日期列天数（缺省 11：今天起 10 天）
 *     onConfirm,     // (date: Date) => void  点确认
 *     onCancel       // () => void            点取消
 *   })
 * ========================================================================== */
const WHEEL_ITEM_H = 50;      /* 单行高度，scroll-snap 按此吸附 */
let _wheel = null;            /* DOM 引用缓存 */
let _wheelCb = null;          /* 本次回调 {onConfirm, onCancel} */
let _wheelMin = 0, _wheelMax = 0, _wheelDays = 11;
let _today0 = 0;              /* 打开时"今天 0 点"时间戳，校验用 */
let _clampTimer = null;       /* 滚动落定校验的防抖 */

function _wheelPad(n) { return String(n).padStart(2, '0'); }

/* 构建弹层 DOM（只建一次） */
function _wheelEnsure() {
  if (_wheel) return _wheel;
  const root = document.createElement('div');
  root.className = 'wheel-sheet';
  root.id = 'wheelSheet';
  root.innerHTML = `
    <div class="wheel-backdrop"></div>
    <div class="wheel-panel">
      <div class="wheel-bar">
        <button class="wheel-btn" id="wheelCancel">取消</button>
        <button class="wheel-btn wheel-ok" id="wheelConfirm">确认</button>
      </div>
      <div class="wheel-body">
        <div class="wheel-col" id="wheelDate"></div>
        <div class="wheel-col" id="wheelHour"></div>
        <div class="wheel-col" id="wheelMin"></div>
      </div>
    </div>`;
  document.querySelector('.pub-layer').appendChild(root);

  root.querySelector('#wheelCancel').addEventListener('click', () => closeWheelPicker(false));
  root.querySelector('#wheelConfirm').addEventListener('click', () => closeWheelPicker(true));

  /* 滚动时实时高亮居中项；落定后校验是否选到了过去 */
  ['wheelDate', 'wheelHour', 'wheelMin'].forEach(id => {
    const col = root.querySelector('#' + id);
    col.addEventListener('scroll', () => { _wheelMarkCenter(col); _scheduleClamp(); });
  });

  _wheel = {
    root,
    date: root.querySelector('#wheelDate'),
    hour: root.querySelector('#wheelHour'),
    min: root.querySelector('#wheelMin'),
  };
  return _wheel;
}

/* 高亮离中心最近的项 */
function _wheelMarkCenter(col) {
  const idx = Math.round(col.scrollTop / WHEEL_ITEM_H);
  [...col.children].forEach((it, i) => it.classList.toggle('on', i === idx));
}

/* 选到过去 → 蓝色 ⓘ 顶部 toast（复用全局组件） */
function _showWheelToast(msg) {
  showTopToast('info', msg);
}

/* 滚动落定后校验：选到"当前时间之前" → 该列自动弹回当前时间 + toast */
function _scheduleClamp() {
  clearTimeout(_clampTimer);
  _clampTimer = setTimeout(_validateNow, 160);   /* 等 scroll-snap 稳定 */
}
function _validateNow() {
  const w = _wheel;
  if (!w) return;
  const now = new Date();
  const dayIdx = Math.round(w.date.scrollTop / WHEEL_ITEM_H);
  if (dayIdx !== 0) return;                       /* 未来某天：任意时间合法 */
  let hour = Math.round(w.hour.scrollTop / WHEEL_ITEM_H);
  let min = Math.round(w.min.scrollTop / WHEEL_ITEM_H);
  let violated = false;
  if (hour < now.getHours()) {                    /* 时选早了 → 时/分都回到当前 */
    hour = now.getHours(); min = now.getMinutes(); violated = true;
  } else if (hour === now.getHours() && min < now.getMinutes()) {  /* 同一时，分选早了 */
    min = now.getMinutes(); violated = true;
  }
  if (violated) {
    w.hour.scrollTop = hour * WHEEL_ITEM_H;
    w.min.scrollTop = min * WHEEL_ITEM_H;
    _wheelMarkCenter(w.hour);
    _wheelMarkCenter(w.min);
    _showWheelToast('时光机不能回到过去');
  }
}

function openWheelPicker(opts) {
  opts = opts || {};
  const w = _wheelEnsure();
  _wheelCb = { onConfirm: opts.onConfirm, onCancel: opts.onCancel };
  _wheelDays = opts.days || 11;

  const now = new Date();
  _wheelMin = opts.minTime != null ? opts.minTime : now.getTime();
  _wheelMax = opts.maxTime != null ? opts.maxTime : now.getTime() + (_wheelDays - 1) * 86400e3;

  /* 初始选中：defaultTime 钳制到合法区间 */
  const def = opts.defaultTime != null ? new Date(opts.defaultTime) : new Date(now.getTime() + 3600e3);
  const sel = new Date(Math.min(_wheelMax, Math.max(_wheelMin, def.getTime())));

  /* 日期列：今天起 N 天 */
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  _today0 = today0;
  w.date.innerHTML = '';
  for (let i = 0; i < _wheelDays; i++) {
    const d = new Date(today0 + i * 86400e3);
    const it = document.createElement('div');
    it.className = 'wheel-item';
    it.textContent = _wheelPad(d.getMonth() + 1) + '月' + _wheelPad(d.getDate()) + '日';
    w.date.appendChild(it);
  }
  /* 时 / 分列 */
  w.hour.innerHTML = '';
  for (let h = 0; h < 24; h++) {
    const it = document.createElement('div');
    it.className = 'wheel-item';
    it.textContent = _wheelPad(h);
    w.hour.appendChild(it);
  }
  w.min.innerHTML = '';
  for (let m = 0; m < 60; m++) {
    const it = document.createElement('div');
    it.className = 'wheel-item';
    it.textContent = _wheelPad(m);
    w.min.appendChild(it);
  }

  /* 显示后再定位滚轮：display:none 时无布局，scrollTop 赋值会被钳成 0，
     必须等 .show 生效、scrollHeight 就绪后再滚动到选中项 */
  const selDay0 = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate()).getTime();
  const dayIdx = Math.round((selDay0 - today0) / 86400e3);
  requestAnimationFrame(() => {
    w.root.classList.add('show');
    void w.date.offsetHeight;   /* 强制回流，确保 scrollHeight 已计算 */
    w.date.scrollTop = dayIdx * WHEEL_ITEM_H;
    w.hour.scrollTop = sel.getHours() * WHEEL_ITEM_H;
    w.min.scrollTop = sel.getMinutes() * WHEEL_ITEM_H;
    [w.date, w.hour, w.min].forEach(_wheelMarkCenter);
  });
}

function closeWheelPicker(confirm) {
  const w = _wheelEnsure();
  const cb = _wheelCb; _wheelCb = null;

  /* 必须在隐藏前读取 scrollTop —— display:none 会把它重置为 0 */
  let result = null;
  if (confirm) {
    const now = new Date();
    const dayIdx = Math.round(w.date.scrollTop / WHEEL_ITEM_H);
    const h = Math.round(w.hour.scrollTop / WHEEL_ITEM_H);
    const m = Math.round(w.min.scrollTop / WHEEL_ITEM_H);
    let d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayIdx, h, m, 0);
    /* 钳制到合法区间 */
    const t = Math.min(_wheelMax, Math.max(_wheelMin, d.getTime()));
    result = new Date(t);
  }

  w.root.classList.remove('show');
  if (result && cb && cb.onConfirm) cb.onConfirm(result);
  else if (cb && cb.onCancel) cb.onCancel();
}
