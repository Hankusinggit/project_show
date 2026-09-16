/* ==========================================================================
 * 动态页渲染
 * ========================================================================== */
function avatarEl(a, cls) {
  const d = document.createElement('div');
  d.className = 'avatar' + (cls ? ' ' + cls : '');
  if (a.img) {
    const im = document.createElement('img');
    im.src = a.img;
    im.alt = '';
    d.appendChild(im);
  } else {
    d.style.background = a.bg;
    d.textContent = a.emoji;
  }
  return d;
}

/* ==========================================================================
 * 评论区（始终展开）：预置评论 + 我的评论，平铺展示，底部有头像 + 输入框
 * ========================================================================== */
function renderComments(p) {
  const wrap = document.createElement('div');
  wrap.className = 'p-comments';

  /* 把预置评论和我写的评论合并，按"我写的在后" */
  const myCmts = state.myComments[p.id] || [];
  const preset = (p.commentList || []).map(c => ({ ...c, mine: false }));
  const mine = myCmts.map(c => ({ ...c, mine: true }));
  const all = preset.concat(mine);

  if (all.length > 0) {
    const list = document.createElement('div');
    list.className = 'p-comment-list';
    all.forEach(c => {
      const item = document.createElement('div');
      item.className = 'p-comment';
      /* 头像：Hank 用自身头像，其他用好友头像 */
      let av;
      if (c.mine || c.name === DATA.me.name) {
        av = avatarEl(DATA.me.avatar);
      } else {
        const f = DATA.friends.find(x => x.name === c.name);
        av = avatarEl(f ? f.avatar : DATA.friends[0].avatar);
      }
      const txt = document.createElement('div');
      txt.className = 'p-comment-text';
      const name = document.createElement('span');
      name.className = 'p-comment-name';
      name.textContent = c.name;
      const body = document.createTextNode(c.text);
      const tm = document.createElement('span');
      tm.className = 'p-comment-time';
      tm.textContent = c.time;
      txt.append(name, body, document.createElement('br'), tm);
      item.append(av, txt);
      list.appendChild(item);
    });
    wrap.appendChild(list);
  }

  /* 底部输入框：头像 + 输入框 + 发布按钮 */
  const input = document.createElement('div');
  input.className = 'p-comment-input';
  const myAva = avatarEl(DATA.me.avatar);
  const tf = document.createElement('input');
  tf.type = 'text';
  tf.placeholder = '说点什么吧...';
  tf.maxLength = 120;
  const btn = document.createElement('button');
  btn.textContent = '发送';
  btn.style.display = 'none';  /* 空内容时隐藏发送按钮 */
  tf.addEventListener('input', () => {
    btn.style.display = tf.value.trim().length > 0 ? 'inline-flex' : 'none';
  });
  btn.addEventListener('click', () => submitComment(p.id, tf));
  tf.addEventListener('keydown', e => {
    if (e.key === 'Enter' && tf.value.trim()) submitComment(p.id, tf);
  });
  input.append(myAva, tf, btn);
  wrap.appendChild(input);

  return wrap;
}

/* 提交评论：追加到 state.myComments，重渲染整个 feed */
function submitComment(postId, inputEl) {
  const text = inputEl.value.trim();
  if (!text) return;
  if (!state.myComments[postId]) state.myComments[postId] = [];
  state.myComments[postId].push({
    name: DATA.me.name,
    avatar: DATA.me.avatar,
    text,
    time: '刚刚',
  });
  inputEl.value = '';
  renderFeed();
}

function postCard(p) {
  const card = document.createElement('div');
  card.className = 'post';

  /* 头部：头像 + 昵称 + ···（时间按真机样式放在卡片底部左侧） */
  const head = document.createElement('div');
  head.className = 'p-head';
  const author = p.mine ? DATA.me : DATA.friends.find(f => f.name === p.author) || DATA.friends[0];
  head.appendChild(avatarEl(author ? author.avatar : DATA.me.avatar));

  const meta = document.createElement('div');
  meta.className = 'p-meta';
  const name = document.createElement('div');
  name.className = 'p-name';
  name.textContent = p.mine ? DATA.me.name : p.author;
  meta.appendChild(name);

  const more = document.createElement('button');
  more.className = 'p-more';
  more.textContent = '···';
  more.onclick = () => toast('这条说说的更多操作是装饰 🤐');

  head.append(meta, more);
  card.appendChild(head);

  const body = document.createElement('div');
  body.className = 'p-body';
  body.innerHTML = p.text;          /* 内容里的 .tag 高亮原样保留 */
  card.appendChild(body);

  if (p.loc) {
    const loc = document.createElement('div');
    loc.className = 'p-loc';
    loc.textContent = '📍 ' + p.loc;
    card.appendChild(loc);
  }

  /* 配图统一：优先 p.images（发布器新发布），否则 p.ph（seedPosts 占位），不再看 mine */
  const list = (p.images && p.images.length) ? p.images : (p.ph || []);
  if (list.length) {
    const g = document.createElement('div');
    const solo = list.length === 1;
    const wide = solo && typeof list[0] === 'object' && list[0].wide;
    g.className = 'p-imgs' + (wide ? ' wide' : solo ? ' single' : '');
    list.forEach(item => {
      if (typeof item === 'string') {
        const img = document.createElement('img');
        img.src = item;
        img.alt = '';
        g.appendChild(img);
      } else if (item.img) {
        const im = document.createElement('img');
        im.src = item.img;
        im.alt = '';
        g.appendChild(im);
      } else {
        const d = document.createElement('div');
        d.className = 'ph-img';
        d.style.background = item.bg;
        d.textContent = item.emoji;
        g.appendChild(d);
      }
    });
    card.appendChild(g);
  }

  /* 赞过的好友预览条（含实时联动：已点赞时 Hank 头像出现在最前面） */
  const isLiked = state.liked.has(p.id);
  const allLikers = isLiked ? [DATA.me.name, ...(p.likers || [])] : (p.likers || []);
  if (allLikers.length > 0) {
    const lk = document.createElement('div');
    lk.className = 'p-likes';
    allLikers.slice(0, 3).forEach(n => {
      if (n === DATA.me.name) {
        lk.appendChild(avatarEl(DATA.me.avatar));
      } else {
        const f = DATA.friends.find(x => x.name === n);
        if (f) lk.appendChild(avatarEl(f.avatar));
      }
    });
    const s = document.createElement('span');
    s.textContent = allLikers.join('、') + ' 觉得很赞';
    lk.appendChild(s);
    card.appendChild(lk);
  }

  /* 评论总数（含我的评论）：决定底部"评论"按钮显示的数字 */
  const myCount = (state.myComments[p.id] || []).length;
  const totalComments = (p.commentList ? p.commentList.length : 0) + myCount;

  /* 底部：时间居左，赞/评论/转发居右（按真机样式） */
  const foot = document.createElement('div');
  foot.className = 'p-foot';
  const time = document.createElement('span');
  time.className = 'p-time';
  /* 时间统一显示：seedPosts 的字符串直接用，发布器新发布的时间戳走 fmtTime */
  const t = typeof p.time === 'string' ? p.time : fmtTime(p.time);
  time.textContent = t;

  const acts = document.createElement('div');
  acts.className = 'p-acts';
  const liked = state.liked.has(p.id);
  const likeCount = (p.likes || 0) + (liked ? 1 : 0);
  acts.innerHTML =
    '<button class="act like' + (liked ? ' liked' : '') + '" data-id="' + p.id + '">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (liked ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v10H4.5A1.5 1.5 0 0 1 3 18.5V11.5A1.5 1.5 0 0 1 4.5 10H7zm0 0 3.6-6.4c.3-.6 1-.9 1.7-.7l.6.2c.7.2 1.1 1 .9 1.7L12.8 9h4.9c1.3 0 2.3 1.2 2 2.5l-1.4 6.3c-.2 1.3-1.3 2.2-2.6 2.2H7"/></svg>' +
    '<span>' + (likeCount > 0 ? likeCount : '赞') + '</span></button>' +
    '<button class="act">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z"/></svg>' +
    '<span>' + (totalComments > 0 ? totalComments : '评论') + '</span></button>' +
    '<button class="act" onclick="toast(\'转发是装饰功能 🙈\')">' +
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M12 3v13m0-13L8 7m4-4 4 4"/></svg>' +
    '<span>转发</span></button>';

  foot.append(time, acts);
  card.appendChild(foot);

  /* 评论区：预置评论 + 我的评论，全部平铺展示（始终展开，不要点击） */
  card.appendChild(renderComments(p));

  return card;
}

function renderFeed() {
  const feed = $('feed');
  feed.innerHTML = '';
  const mine = loadPosts();
  [...mine, ...DATA.seedPosts].forEach(p => feed.appendChild(postCard(p)));
}

/* 事件委托处理点赞 */
$('feed').addEventListener('click', e => {
  const btn = e.target.closest('.act.like');
  if (!btn) return;
  const id = btn.dataset.id;
  if (state.liked.has(id)) state.liked.delete(id);
  else state.liked.add(id);
  renderFeed();
});

function fmtTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60e3) return '刚刚';
  if (diff < 3600e3) return Math.floor(diff / 60e3) + '分钟前';
  const d = new Date(ts), n = new Date();
  const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  if (d.toDateString() === n.toDateString()) return Math.floor(diff / 3600e3) + '小时前';
  const y = new Date(n - 86400e3);
  if (d.toDateString() === y.toDateString()) return '昨天 ' + hm;
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm;
}

