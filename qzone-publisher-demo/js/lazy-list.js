/* ==========================================================================
 * LazyListState —— 可拖拽排序列表的数据状态接口
 *
 * 参考 Kuikly LazyListState / Compose ReorderableLazyListState 的设计：
 *   列表数据与拖拽会话状态收敛在一个 State 对象里，
 *   所有变更通过数据接口完成（增/删/换位/拖拽会话），
 *   UI 通过 onChange 订阅重渲染 —— UI 是数据的纯函数。
 *
 *   const list = new LazyListState();
 *   list.onChange(render);      // 订阅：数据变 → UI 变
 *   list.add(item);             // 增（尾部追加）
 *   list.remove(i);             // 删（按下标）
 *   list.move(from, to);        // 换位：核心接口，可独立于手势调用
 *   list.beginDrag(i);          // 拖拽会话：标记被拖项（渲染层画空槽）
 *   list.endDrag();             // 结束会话（空槽落位）
 *   list.reset(items);          // 整表替换（选图器回写 / 草稿恢复）
 *
 * 拖拽用法（手势层只做识别，换位全走数据接口）：
 *   list.beginDrag(i);                 // 长按
 *   list.move(list.dragIndex, j);      // 跨格时实时换位，列表即时重排
 *   list.endDrag();                    // 松手
 * ========================================================================== */
class LazyListState {
  constructor(items) {
    this.items = items || [];      /* 底层数组（与外部 state.images 保持同引用） */
    this.dragIndex = -1;           /* 拖拽会话：被拖项当前索引，-1 = 无拖拽 */
    this._listeners = [];
  }

  get size() { return this.items.length; }
  get(index) { return this.items[index]; }

  /* ---------- 数据操作（全部以 notify 收口） ---------- */

  add(item) {
    this.items.push(item);
    this._notify();
  }

  remove(index) {
    if (index < 0 || index >= this.size) return;
    this.items.splice(index, 1);
    if (this.dragIndex === index) this.dragIndex = -1;
    else if (this.dragIndex > index) this.dragIndex--;
    this._notify();
  }

  reset(items) {
    this.items = items || [];
    this.dragIndex = -1;
    this._notify();
  }

  /* ---------- 拖拽会话 ---------- */

  beginDrag(index) {
    if (index < 0 || index >= this.size) return;
    this.dragIndex = index;
    this._notify();
  }

  endDrag() {
    this.dragIndex = -1;
    this._notify();
  }

  /* 换位：先取出再插入。拖拽中每次调用即时生效（列表实时重排）；
     非法参数或原地换位静默忽略 */
  move(from, to) {
    if (from === to) return false;
    if (from < 0 || to < 0 || from >= this.size || to >= this.size) return false;
    const [item] = this.items.splice(from, 1);
    this.items.splice(to, 0, item);
    if (this.dragIndex === from) this.dragIndex = to;
    else if (this.dragIndex >= 0) {
      /* 被拖项索引随中间项位移修正 */
      if (from < this.dragIndex && to >= this.dragIndex) this.dragIndex--;
      else if (from > this.dragIndex && to <= this.dragIndex) this.dragIndex++;
    }
    this._notify();
    return true;
  }

  /* ---------- 订阅 ---------- */

  onChange(fn) { this._listeners.push(fn); }
  _notify() { this._listeners.forEach(f => f(this)); }
}
