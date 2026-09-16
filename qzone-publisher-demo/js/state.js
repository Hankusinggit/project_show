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
  };
  try { localStorage.setItem(LS_DRAFT, JSON.stringify(d)); } catch (e) {}
}
function clearDraft() { try { localStorage.removeItem(LS_DRAFT); } catch (e) {} }
