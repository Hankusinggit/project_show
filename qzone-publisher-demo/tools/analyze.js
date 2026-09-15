#!/usr/bin/env node
// 截图分析工具：把 UI 截图量化成布局参数（色块图 / 色彩剖面 / 区域取色）
// 依赖: npm install sharp
// 用法:
//   node analyze.js grid   <图> [列数]                    全图布局色块图
//   node analyze.js cgrid  <图> <x%> <y%> <w%> <h%> [列]  区域放大色块图
//   node analyze.js vline  <图> <x%> <y1> <y2> <step>     垂直色彩剖面
//   node analyze.js hline  <图> <y%> <x1> <x2> <step>     水平色彩剖面
//   node analyze.js sample <图> <x%> <y%> <w%> <h%>       区域取色
//   node analyze.js colors <图>                            主色统计
// 坐标均为百分比，跨分辨率通用。
const path = require('path');
const sharp = require('sharp');

const mode = process.argv[2];
const file = process.argv[3];

const hex = (r, g, b) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

// 色块分类:
// . 纯白  : 浅灰  - 亮灰  + 中灰  x 深灰  # 近黑
// B 亮蓝  b 深蓝  Y 黄/橙  R 红/粉  G 绿  C 青  P 紫
function classify(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const sat = mx - mn;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (sat < 22) {
    if (lum >= 243) return '.';
    if (lum >= 225) return ':';
    if (lum >= 175) return '-';
    if (lum >= 120) return '+';
    if (lum >= 55) return 'x';
    return '#';
  }
  const rd = r - Math.max(g, b);
  const gd = g - Math.max(r, b);
  const bd = b - Math.max(r, g);
  if (bd > 0) return lum < 115 ? 'b' : 'B';
  if (rd > 0) return g > 110 ? 'Y' : 'R';
  if (gd > 0) return b > r ? 'C' : 'G';
  return 'P';
}

async function meta() { return sharp(file).metadata(); }

async function boxStats(m, xp, yp, wp, hp) {
  let left = Math.round((m.width * xp) / 100);
  let top = Math.round((m.height * yp) / 100);
  let width = Math.max(1, Math.round((m.width * wp) / 100));
  let height = Math.max(1, Math.round((m.height * hp) / 100));
  left = Math.max(0, Math.min(m.width - 2, left));
  top = Math.max(0, Math.min(m.height - 2, top));
  width = Math.min(width, m.width - left);
  height = Math.min(height, m.height - top);
  const buf = await sharp(file).extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
  let sr = 0, sg = 0, sb = 0, bestSat = -1, best = null, darkLum = 999, dark = null;
  for (let i = 0; i < buf.length; i += 3) {
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    sr += r; sg += g; sb += b;
    const s = Math.max(r, g, b) - Math.min(r, g, b);
    if (s > bestSat) { bestSat = s; best = [r, g, b]; }
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    if (l < darkLum) { darkLum = l; dark = [r, g, b]; }
  }
  const n = buf.length / 3;
  return {
    avg: hex(sr / n, sg / n, sb / n),
    sat: best ? hex(...best) : '-',
    satV: bestSat,
    dark: dark ? hex(...dark) : '-',
    darkL: Math.round(darkLum),
  };
}

async function line(isVert, at, from, to, step) {
  const m = await meta();
  console.log('\n### ' + (isVert ? 'VLINE' : 'HLINE') + ' ' + (isVert ? 'x' : 'y') + '=' + at + '% [' + from + '->' + to + ' step ' + step + '] ' + path.basename(file));
  const parts = [];
  for (let p = from; p <= to + 1e-9; p += step) {
    const box = 0.35;
    const st = isVert
      ? await boxStats(m, at - box / 2, p - box / 2, box, box)
      : await boxStats(m, p - box / 2, at - box / 2, box, box);
    parts.push((isVert ? 'y=' : 'x=') + p.toFixed(1) + ' ' + st.avg);
  }
  console.log(parts.join('  '));
}

async function gridOf(data, W, H, label) {
  let out = '\n### ' + label + ' ' + path.basename(file) + ' -> ' + W + 'x' + H + '\n';
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      row += classify(data[i], data[i + 1], data[i + 2]);
    }
    out += String(y).padStart(2, '0') + '|' + row + '\n';
  }
  console.log(out);
}

(async () => {
  if (!mode || !file) {
    console.error('用法见文件头部注释');
    process.exit(1);
  }
  const m = await meta();
  if (mode === 'grid') {
    const W = parseInt(process.argv[4], 10) || 34;
    const H = Math.max(1, Math.round((W * m.height) / m.width));
    const { data } = await sharp(file).resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    await gridOf(data, W, H, 'GRID ' + m.width + 'x' + m.height);
  } else if (mode === 'cgrid') {
    const [xp, yp, wp, hp] = [+process.argv[4], +process.argv[5], +process.argv[6], +process.argv[7]];
    const W = parseInt(process.argv[8], 10) || 68;
    const left = Math.round((m.width * xp) / 100), top = Math.round((m.height * yp) / 100);
    const width = Math.max(4, Math.round((m.width * wp) / 100)), height = Math.max(4, Math.round((m.height * hp) / 100));
    const img = sharp(await sharp(file).extract({ left, top, width, height }).removeAlpha().toBuffer());
    const cm = await img.metadata();
    const H = Math.max(1, Math.round((W * cm.height) / cm.width));
    const { data } = await img.resize(W, H, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    await gridOf(data, W, H, 'CGRID x=' + xp + ' y=' + yp + ' w=' + wp + ' h=' + hp);
  } else if (mode === 'colors') {
    const { data } = await sharp(file)
      .resize(200, Math.round((200 * m.height) / m.width), { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const all = {}, sat = {};
    const n = data.length / 3;
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = [r, g, b].map(v => Math.min(255, Math.round(v / 24) * 24)).join(',');
      all[key] = (all[key] || 0) + 1;
      if (Math.max(r, g, b) - Math.min(r, g, b) >= 45) sat[key] = (sat[key] || 0) + 1;
    }
    const fmt = ([k, c]) => hex(...k.split(',').map(Number)) + ' ' + (100 * c / n).toFixed(1) + '%';
    console.log('\n### COLORS ' + path.basename(file));
    console.log('全部主色:', Object.entries(all).sort((a, b) => b[1] - a[1]).slice(0, 12).map(fmt).join('  '));
    console.log('彩色主色:', Object.entries(sat).sort((a, b) => b[1] - a[1]).slice(0, 10).map(fmt).join('  '));
  } else if (mode === 'sample') {
    const s = await boxStats(m, +process.argv[4], +process.argv[5], +process.argv[6], +process.argv[7]);
    console.log('SAMPLE x=' + process.argv[4] + ' y=' + process.argv[5] +
      ' | avg=' + s.avg + ' 最饱和=' + s.sat + '(' + s.satV + ') 最深=' + s.dark + '(lum' + s.darkL + ')');
  } else if (mode === 'vline') {
    await line(true, +process.argv[4], +process.argv[5], +process.argv[6], +process.argv[7]);
  } else if (mode === 'hline') {
    await line(false, +process.argv[4], +process.argv[5], +process.argv[6], +process.argv[7]);
  } else {
    console.error('未知模式: ' + mode);
    process.exit(1);
  }
})().catch(e => { console.error(e); process.exit(1); });
