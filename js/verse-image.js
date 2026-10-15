// Makes a share-ready picture (1080×1350) of a Daily Bread verse over a cross background.
// Backgrounds change from verse to verse (and on "Change background"), always with a cross:
// your cover photo in different crops and colour moods, plus painted cross-on-a-hill skies.

const W = 1080;
const H = 1350;

// Your cover photo in eight clearly different moods: crop, mirror, zoom and colour.
const PHOTO_LOOKS = [
  { src: 'img/share-cross.jpg' },
  { src: 'img/share-cross.jpg', filter: 'sepia(.45) saturate(1.5) brightness(1.08)', overlay: ['rgba(255, 160, 60, .22)', 'soft-light'] },
  { src: 'img/share-cross-2.jpg', flip: true, filter: 'hue-rotate(-25deg) saturate(1.45)', overlay: ['rgba(235, 100, 150, .30)', 'soft-light'] },
  { src: 'img/share-cross.jpg', zoom: 1.25, filter: 'brightness(.8) saturate(.75) hue-rotate(12deg)', overlay: ['rgba(40, 80, 190, .45)', 'multiply'] },
  { src: 'img/share-cross-2.jpg', filter: 'grayscale(1) contrast(1.15) brightness(1.05)', overlay: ['rgba(227, 196, 142, .25)', 'color'] },
  { src: 'img/share-cross.jpg', flip: true, zoom: 1.12, filter: 'saturate(1.6) contrast(1.08)', overlay: ['rgba(255, 120, 40, .18)', 'overlay'] },
  { src: 'img/share-cross-2.jpg', zoom: 1.3, filter: 'hue-rotate(160deg) saturate(.9) brightness(.95)', overlay: ['rgba(20, 140, 130, .25)', 'soft-light'] },
  { src: 'img/share-cross.jpg', filter: 'hue-rotate(-45deg) saturate(1.3) brightness(.92)', overlay: ['rgba(120, 60, 170, .35)', 'soft-light'] }
];
const SKIES = [
  { name: 'dawn',     top: '#1d2a4a', mid: '#c46b4e', low: '#f6c879', sun: 'rgba(255, 214, 140, .95)', hills: ['#3a2c45', '#2a2034', '#160f1d'], stars: false },
  { name: 'golden',   top: '#2a3550', mid: '#b98542', low: '#f3d38a', sun: 'rgba(255, 236, 170, .95)', hills: ['#4a3b2c', '#30261d', '#17120d'], stars: false },
  { name: 'night',    top: '#05070f', mid: '#13203f', low: '#38507e', sun: 'rgba(190, 210, 255, .55)', hills: ['#141c33', '#0d1324', '#060912'], stars: true },
  { name: 'twilight', top: '#140f2b', mid: '#5a3a78', low: '#e08a7a', sun: 'rgba(255, 190, 170, .85)', hills: ['#2d2140', '#1d152c', '#0d0a15'], stars: true }
];
export const BACKGROUND_COUNT = PHOTO_LOOKS.length + SKIES.length;

const cache = new Map();
function loadImage(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }));
  }
  return cache.get(src);
}

// Small repeatable random numbers, so a verse always gets the same painted sky for the same choice.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

async function drawPhoto(ctx, index) {
  const look = PHOTO_LOOKS[index];
  const img = await loadImage(look.src);
  const z = look.zoom || 1;
  ctx.save();
  if (look.filter && 'filter' in ctx) ctx.filter = look.filter;
  if (look.flip) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  // Zoom towards the cross, which sits a little above the middle.
  const dw = W * z, dh = H * z;
  ctx.drawImage(img, (W - dw) / 2, (H * 0.42) * (1 - z), dw, dh);
  ctx.restore();
  if (look.overlay) {
    ctx.save();
    ctx.globalCompositeOperation = look.overlay[1];
    ctx.fillStyle = look.overlay[0];
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

function drawSky(ctx, sky, seed) {
  const r = rng(seed);
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  g.addColorStop(0, sky.top);
  g.addColorStop(0.62, sky.mid);
  g.addColorStop(1, sky.low);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  if (sky.stars) {
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.7})`;
      const s = r() * 2.2 + 0.4;
      ctx.beginPath(); ctx.arc(r() * W, r() * H * 0.5, s, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Light behind the cross
  const cx = W * (0.42 + r() * 0.16);
  const cy = H * 0.46;
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.75);
  glow.addColorStop(0, sky.sun);
  glow.addColorStop(0.25, sky.sun.replace(/[\d.]+\)$/, '0.35)'));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Soft rays
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.4;
    const len = H * (0.6 + r() * 0.5);
    const wdt = 0.02 + r() * 0.05;
    ctx.fillStyle = `rgba(255, 230, 190, ${0.03 + r() * 0.05})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a - wdt) * len, cy + Math.sin(a - wdt) * len);
    ctx.lineTo(cx + Math.cos(a + wdt) * len, cy + Math.sin(a + wdt) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Layered hills, far to near, with the cross on the nearest peak
  const ridge = (base, amp, color, haze) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, H);
    const f1 = 1 + r() * 2, f2 = 3 + r() * 4, p1 = r() * 6, p2 = r() * 6;
    for (let x = 0; x <= W; x += 8) {
      const y = base + Math.sin(x / W * Math.PI * f1 + p1) * amp + Math.sin(x / W * Math.PI * f2 + p2) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    if (haze) {
      const hz = ctx.createLinearGradient(0, base - amp, 0, base + amp * 2);
      hz.addColorStop(0, 'rgba(255,255,255,0)');
      hz.addColorStop(1, haze);
      ctx.fillStyle = hz;
      ctx.fillRect(0, base - amp, W, amp * 3);
    }
  };
  ridge(H * 0.56, 28, sky.hills[0], 'rgba(255,255,255,.06)');
  ridge(H * 0.62, 34, sky.hills[1], 'rgba(255,255,255,.04)');

  // Nearest hill: a peak under the cross
  ctx.fillStyle = sky.hills[2];
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.78);
  ctx.quadraticCurveTo(cx - W * 0.25, H * 0.66, cx, cy + 115);
  ctx.quadraticCurveTo(cx + W * 0.25, H * 0.64, W, H * 0.76);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // The cross
  ctx.fillStyle = sky.hills[2];
  ctx.shadowColor = sky.sun;
  ctx.shadowBlur = 40;
  const ch = 190, cw = 15, bar = 104;
  ctx.fillRect(cx - cw / 2, cy + 120 - ch, cw, ch);
  ctx.fillRect(cx - bar / 2, cy + 120 - ch + 44, bar, cw);
  ctx.shadowBlur = 0;
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  for (const para of String(text).split(/\n+/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
  }
  return lines;
}

/**
 * Draws the picture and returns the canvas.
 * @param {{verse:string, reference:string, date:string}} bread
 * @param {number} choice  which background (0 … BACKGROUND_COUNT-1)
 */
export async function renderVerseImage(bread, choice) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const n = ((choice % BACKGROUND_COUNT) + BACKGROUND_COUNT) % BACKGROUND_COUNT;
  const photoCount = PHOTO_LOOKS.length;
  if (n < photoCount) await drawPhoto(ctx, n);
  else drawSky(ctx, SKIES[n - photoCount], n * 7919 + String(bread.verse).length);

  // Darken the lower part so the words are easy to read; the cross stays bright above.
  const shade = ctx.createLinearGradient(0, H * 0.42, 0, H);
  shade.addColorStop(0, 'rgba(8, 10, 20, 0)');
  shade.addColorStop(0.35, 'rgba(8, 10, 20, .62)');
  shade.addColorStop(1, 'rgba(8, 10, 20, .9)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  const top = ctx.createLinearGradient(0, 0, 0, 220);
  top.addColorStop(0, 'rgba(8, 10, 20, .55)');
  top.addColorStop(1, 'rgba(8, 10, 20, 0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 220);

  try { await document.fonts.load('600 48px "Noto Serif Ethiopic"'); } catch { /* use the phone's Ethiopic font */ }
  const ethiopic = '"Noto Serif Ethiopic", "Kefa", "Nyala", "Noto Sans Ethiopic", serif';
  const latin = '"Source Sans 3", "Helvetica Neue", Arial, sans-serif';

  // Header
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#E3C48E';
  ctx.font = `700 34px ${ethiopic}`;
  ctx.fillText('የዕለት እንጀራ · DAILY BREAD', W / 2, 92);

  // Verse: largest size that fits the space under the cross
  const boxTop = H * 0.53;
  const boxBottom = H - 210;
  const maxWidth = W - 150;
  let size = 56, lines = [], lineH = 0;
  for (; size >= 26; size -= 2) {
    ctx.font = `600 ${size}px ${ethiopic}`;
    lines = wrap(ctx, bread.verse, maxWidth);
    lineH = size * 1.62;
    if (lines.length * lineH <= boxBottom - boxTop) break;
  }
  ctx.fillStyle = '#FFF8EC';
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = 18;
  const total = lines.length * lineH;
  let y = boxTop + (boxBottom - boxTop - total) / 2 + size;
  for (const l of lines) { ctx.fillText(l, W / 2, y); y += lineH; }
  ctx.shadowBlur = 0;

  // Reference
  if (bread.reference) {
    ctx.fillStyle = '#E3C48E';
    ctx.font = `700 40px ${ethiopic}`;
    ctx.fillText(bread.reference, W / 2, H - 150);
  }

  // Footer
  ctx.fillStyle = 'rgba(255, 248, 236, .75)';
  ctx.font = `600 28px ${ethiopic}`;
  ctx.fillText('ለክብሩ · For His Glory', W / 2, H - 78);
  ctx.fillStyle = 'rgba(255, 248, 236, .55)';
  ctx.font = `500 26px ${latin}`;
  ctx.fillText('app.mintesinot.org', W / 2, H - 40);

  return canvas;
}

export function canvasToFile(canvas, name) {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(new File([b], name, { type: 'image/jpeg' })), 'image/jpeg', 0.9));
}
