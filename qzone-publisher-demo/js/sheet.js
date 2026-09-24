/* ==========================================================================
 * 底部弹层：谁可以看 / 位置 / 话题 / @好友
 * ========================================================================== */
function openSheet(kind) {
  const s = $('sheet');
  s.innerHTML = '';

  const handle = document.createElement('div');
  handle.className = 'sh-handle';
  s.appendChild(handle);
  const title = document.createElement('div');
  title.className = 'sh-title';

  const row = (html, onclick) => {
    const d = document.createElement('button');
    d.className = 'sh-row';
    d.innerHTML = html;
    d.onclick = onclick;
    s.appendChild(d);
    return d;
  };

  if (kind === 'vis') {
    title.textContent = '谁可以看';
    DATA.visibilities.forEach(v => {
      row(
        '<div><div>' + v.label + '</div><div class="sh-sub">' + v.sub + '</div></div>' +
        '<span class="radio' + (state.visibility === v.id ? ' on' : '') + '"></span>',
        () => { state.visibility = v.id; updateVisLabel(); closeSheet(); }
      );
    });
  }

  if (kind === 'loc') {
    title.textContent = '所在位置';
    row('<span>📍 不显示位置</span>', () => { state.location = null; updateLocVal(); closeSheet(); });
    DATA.locations.forEach(l => {
      row('<span>📍 ' + l + '</span>', () => { state.location = l; updateLocVal(); closeSheet(); });
    });
  }

  if (kind === 'topic') {
    title.textContent = '插入话题';
    DATA.topics.forEach(t => {
      row('<span class="glyph" style="color:#0099FA;font-weight:700">#</span><span>' + t + '</span>',
        () => { insertHTML('<span class="tag" contenteditable="false">#' + escapeHtml(t) + '#</span>&nbsp;'); closeSheet(); });
    });
    const custom = document.createElement('div');
    custom.className = 'sh-custom';
    custom.innerHTML = '<input placeholder="自定义话题" maxlength="12"><button>插入</button>';
    custom.querySelector('button').onclick = () => {
      const v = custom.querySelector('input').value.trim();
      if (!v) return;
      insertHTML('<span class="tag" contenteditable="false">#' + escapeHtml(v) + '#</span>&nbsp;');
      closeSheet();
    };
    s.appendChild(custom);
  }

  /* @好友已升级为全屏「选择好友」子页面（publisher.js buildAtPage），此处不再处理 */

  if (kind === 'settings') {
    title.textContent = '发表设置';
    [
      { label: '允许他人评论', on: true },
      { label: '展示位置信息', on: true },
      { label: '公开发表时间', on: false },
    ].forEach(it => {
      const d = document.createElement('button');
      d.className = 'sh-row';
      const span = document.createElement('span');
      span.textContent = it.label;
      const sw = document.createElement('span');
      sw.className = 'switch' + (it.on ? ' on' : '');
      d.append(span, sw);
      d.onclick = () => sw.classList.toggle('on');
      s.appendChild(d);
    });
  }

  s.prepend(title);
  $('mask').classList.add('show');
  $('sheetWrap').classList.add('show');
}

function closeSheet() {
  $('mask').classList.remove('show');
  $('sheetWrap').classList.remove('show');
}
