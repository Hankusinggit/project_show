/* ==========================================================================
 * 状态与存储
 * ========================================================================== */
const LS_DRAFT = 'qzone_demo_draft_v1';

const state = {
  images: [],            // { url, dataUrl }
  visibility: 'public',
  location: null,
  liked: new Set(),      // 本次会话点过赞的说说 id
  /* 我的评论：{ [postId]: [{name, avatar, text, time}] }，按发布顺序追加 */
  myComments: {},
};

const $ = id => document.getElementById(id);
/* editor 是发布器的 contenteditable 元素，在视图注入后赋值 */
let editor = null;

/* 已发布的说说存内存（刷新即消失，不再持久化到 localStorage） */
let _memPosts = [];
function loadPosts() {
  return _memPosts;
}
function savePosts(p) {
  _memPosts = p;
}
function loadDraft() {
  try { return JSON.parse(localStorage.getItem(LS_DRAFT)); } catch { return null; }
}
function saveDraft() {
  const d = {
    html: editor.innerHTML,
    images: state.images.map(i => i.dataUrl),
    visibility: state.visibility,
    location: state.location,
    /* AI 声明随草稿持久化（内容属性）；定时/自动删除是即时设置，不持久化 */
    aiDeclare: typeof pubSettings !== 'undefined' ? pubSettings.aiDeclare : false,
  };
  try { localStorage.setItem(LS_DRAFT, JSON.stringify(d)); } catch (e) {}
}
function clearDraft() { try { localStorage.removeItem(LS_DRAFT); } catch (e) {} }

/* ==========================================================================
 * 顶部信息 toast（白色胶囊 + 图标，顶部居中，对齐真机截图）
 *   type = 'info'    → 蓝色圆形 ⓘ（如"时光机不能回到过去"）
 *   type = 'success' → 绿色圆形 ✓（如"定时说说设置成功"）
 * ========================================================================== */
let _topToastEl = null, _topToastTimer = null;
function showTopToast(type, msg) {
  if (!_topToastEl) {
    _topToastEl = document.createElement('div');
    _topToastEl.className = 'top-toast';
    _topToastEl.innerHTML = '<span class="top-toast-ic"></span><span class="top-toast-tx"></span>';
    (document.querySelector('.phone-screen') || document.body).appendChild(_topToastEl);
  }
  const ic = _topToastEl.querySelector('.top-toast-ic');
  ic.className = 'top-toast-ic ' + type;
  ic.innerHTML = type === 'success'
    ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.5 10 18.5 20 6"/></svg>'
    : 'i';
  _topToastEl.querySelector('.top-toast-tx').textContent = msg;
  _topToastEl.classList.add('show');
  clearTimeout(_topToastTimer);
  _topToastTimer = setTimeout(() => _topToastEl.classList.remove('show'), 1800);
}
