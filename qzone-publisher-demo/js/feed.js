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
    /* 长图模式：只显首图 + 「长图」徽标，点击进竖向长图查看器 */
    if (p.longImage) {
      g.className = 'p-imgs single';
      const wrap = document.createElement('div');
      wrap.className = 'feed-longimg';
      const im = document.createElement('img');
      im.src = typeof list[0] === 'string' ? list[0] : (list[0].img || list[0]);
      wrap.appendChild(im);
      const badge = document.createElement('span');
      badge.className = 'longimg-badge';
      badge.textContent = '长图';
      wrap.appendChild(badge);
      wrap.style.cursor = 'zoom-in';
      const urls = list.map(x => typeof x === 'string' ? x : (x.img || x));
      wrap.addEventListener('click', () => openLongImageViewer(urls));
      g.appendChild(wrap);
      card.appendChild(g);
    } else {
    const solo = list.length === 1;
    const wide = solo && typeof list[0] === 'object' && list[0].wide;
    let gridClass = 'p-imgs';
    if (wide) gridClass += ' wide';
    else if (solo) gridClass += ' single';
    else if (list.length === 2) gridClass += ' cols-2';
    else if (list.length === 4) gridClass += ' cols-4';
    g.className = gridClass;

    /* 收集所有媒体 URL，传给 Gallery 查看器 */
    const mediaUrls = [];
    list.forEach(item => {
      if (typeof item === 'string') {
        mediaUrls.push(item);
        if (/\.(mp4|mov|webm|m4v)$/i.test(item)) {
          /* 视频：封面帧 + 播放按钮，点击进 Gallery 播放 */
          const isCover = typeof item === 'object';
          const wrap = document.createElement('div');
          wrap.className = 'feed-video';
          const poster = item; /* 已是封面/视频地址，Gallery 会识别 mp4 */
          const v = document.createElement('video');
          v.src = item;
          v.playsInline = true;
          v.preload = 'metadata';
          v.muted = true;
          wrap.appendChild(v);
          const play = document.createElement('span');
          play.className = 'pk-play';
          play.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
          wrap.appendChild(play);
          wrap.addEventListener('click', () => openViewer(mediaUrls, mediaUrls.indexOf(item)));
          g.appendChild(wrap);
        } else {
          const img = document.createElement('img');
          img.src = item;
          img.alt = '';
          img.style.cursor = 'zoom-in';
          img.addEventListener('click', () => openViewer(mediaUrls, mediaUrls.indexOf(item)));
          g.appendChild(img);
        }
      } else if (item.img) {
        mediaUrls.push(item.img);
        const im = document.createElement('img');
        im.src = item.img;
        im.alt = '';
        im.style.cursor = 'zoom-in';
        im.addEventListener('click', () => openViewer(mediaUrls, mediaUrls.indexOf(item.img)));
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
  const now = Date.now();
  const mine = loadPosts();
  /* 定时发表：scheduledAt 在未来的说说暂不展示，到点才出现 */
  const visible = [...mine, ...DATA.seedPosts].filter(p => !p.scheduledAt || p.scheduledAt <= now);
  visible.forEach(p => feed.appendChild(postCard(p)));
  scheduleFeedReveal();
}

/* 到点自动展示：为最早一条未到时的定时说说设置定时器，触发后重渲染
   （重渲染会再次调度下一条，无需手动刷新页面） */
let _revealTimer = null;
function scheduleFeedReveal() {
  if (_revealTimer) { clearTimeout(_revealTimer); _revealTimer = null; }
  const now = Date.now();
  const pending = loadPosts().filter(p => p.scheduledAt && p.scheduledAt > now);
  if (pending.length === 0) return;
  const earliest = Math.min(...pending.map(p => p.scheduledAt));
  _revealTimer = setTimeout(() => renderFeed(), earliest - now + 50);
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

/* ==========================================================================
 * 下拉刷新：在 feed 顶部下拉 → 出现转圈 → 松手刷新
 *   刷新动作 = renderFeed()，会展示到点的定时说说并更新相对时间
 * ========================================================================== */
(function setupPullRefresh() {
  const sc = $('screenScroll');
  const app = $('app');
  if (!sc || !app) return;

  /* 顶部刷新指示器（spinner 位于 app 顶端之上，下拉时随内容露出） */
  const ptr = document.createElement('div');
  ptr.className = 'ptr';
  ptr.innerHTML = '<div class="ptr-spinner"></div>';
  app.insertBefore(ptr, app.firstChild);
  const spinner = ptr.querySelector('.ptr-spinner');

  const THRESHOLD = 70, MAX = 120;
  let gestureActive = false, refreshing = false, pullStartY = null;
  let targetPull = 0, displayPull = 0, wheelPull = 0, rafId = null;

  function stopRaf() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }

  /* 读取当前视觉位移：CSS 回弹动画中途被打断时，用它无缝接管 */
  function currentTranslateY() {
    const t = getComputedStyle(app).transform;
    if (!t || t === 'none') return 0;
    const m = /matrix\(([^)]+)\)/.exec(t);
    return m ? (parseFloat(m[1].split(',')[5]) || 0) : 0;
  }

  /* 下拉跟手：rAF 插值（无 CSS 过渡），消除触控板 deltaY 抖动 */
  function startRaf() {
    if (rafId !== null) return;
    app.style.transition = 'none';
    const tick = () => {
      displayPull += (targetPull - displayPull) * 0.35;
      if (Math.abs(targetPull - displayPull) < 0.5) displayPull = targetPull;
      applyTransform(displayPull);
      if (displayPull !== targetPull) rafId = requestAnimationFrame(tick);
      else rafId = null;
    };
    rafId = requestAnimationFrame(tick);
  }
  function applyTransform(p) {
    app.style.transform = p > 0.5 ? 'translateY(' + p + 'px)' : '';
    if (!spinner.classList.contains('loading')) {
      spinner.style.opacity = Math.min(1, p / THRESHOLD);
      spinner.style.transform = 'rotate(' + (p * 4) + 'deg)';
    }
  }

  /* 回弹 / 归位：CSS 过渡（GPU 平滑、固定时长），避免 rAF 指数尾巴的卡顿感 */
  function animateTo(p, dur) {
    stopRaf();
    displayPull = targetPull = p;
    app.style.transition = 'transform ' + dur + 'ms cubic-bezier(0.22, 1, 0.36, 1)';
    app.style.transform = p > 0.5 ? 'translateY(' + p + 'px)' : '';
    if (!spinner.classList.contains('loading')) {
      spinner.style.transition = 'opacity ' + dur + 'ms ease';
      spinner.style.opacity = Math.min(1, p / THRESHOLD);
    }
  }

  /* 新手势开始：若正处于 CSS 回弹中，从当前视觉位置切回 rAF 跟手 */
  function beginInput() {
    if (app.style.transition && app.style.transition !== 'none') displayPull = currentTranslateY();
    app.style.transition = 'none';
    spinner.style.transition = 'none';
  }

  sc.addEventListener('pointerdown', e => {
    if (refreshing) return;
    gestureActive = true;
    beginInput();
    /* 按下时已在顶部 → 立即开始计量；否则等手势中途滑到顶再开始 */
    pullStartY = sc.scrollTop <= 0 ? e.clientY : null;
  });
  window.addEventListener('pointermove', e => {
    if (!gestureActive || refreshing) return;
    if (sc.scrollTop > 0) {                 /* 正常滚动区间：复位下拉 */
      if (pullStartY !== null) { pullStartY = null; wheelPull = 0; targetPull = 0; animateTo(0, 200); }
      return;
    }
    if (pullStartY === null) { pullStartY = e.clientY; beginInput(); }   /* 中途到顶 */
    const dy = e.clientY - pullStartY;
    const p = dy > 0 ? Math.min(MAX, dy * 0.5) : 0;
    /* 指针拖拽 1:1 跟手 */
    targetPull = displayPull = p;
    applyTransform(p);
  });
  window.addEventListener('pointerup', () => {
    if (!gestureActive) return;
    gestureActive = false;
    if (targetPull >= THRESHOLD) doRefresh();
    else animateTo(0, 280);                 /* 未过阈值：CSS 平滑回弹 */
  });
  window.addEventListener('pointercancel', () => { if (gestureActive) { gestureActive = false; animateTo(0, 280); } });

  /* 下拉过程中阻止原生滚动/回弹，让 translate 成为唯一位移 */
  sc.addEventListener('touchmove', e => {
    if (displayPull > 0 && sc.scrollTop <= 0) e.preventDefault();
  }, { passive: false });

  /* 桌面端（鼠标滚轮 / Mac 触控板）：到顶后继续上滚累计下拉，过阈值触发刷新 */
  sc.addEventListener('wheel', e => {
    if (refreshing) return;
    if (sc.scrollTop > 0) {                 /* 不在顶部：正常滚动，平滑收回残留下拉 */
      if (targetPull > 0) { wheelPull = 0; animateTo(0, 200); }
      return;
    }
    if (e.deltaY < 0) {                     /* 顶部继续上滚 = 下拉 */
      e.preventDefault();
      if (wheelPull === 0) beginInput();
      wheelPull = Math.min(MAX, wheelPull + (-e.deltaY) * 0.5);
      targetPull = wheelPull;
      startRaf();
      if (wheelPull >= THRESHOLD) { wheelPull = 0; doRefresh(); }
    } else if (wheelPull > 0 && e.deltaY > 0) {   /* 主动下滚：平滑收回 */
      e.preventDefault();
      wheelPull = Math.max(0, wheelPull - e.deltaY * 0.5);
      targetPull = wheelPull;
      startRaf();
    }
  }, { passive: false });

  function doRefresh() {
    refreshing = true;
    wheelPull = 0;
    spinner.classList.add('loading');
    spinner.style.opacity = 1;
    animateTo(56, 220);                     /* CSS 过渡移到 spinner 可见位置 */
    setTimeout(() => {
      renderFeed();                         /* 展示到点的定时说说 + 刷新相对时间 */
      refreshing = false;
      spinner.classList.remove('loading');
      animateTo(0, 300);                    /* CSS 平滑收起，不弹 toast */
    }, 600);
  }
})();

