/**
 * Title: Tribute to Agnes Martin: The Islands
 * Practice 83 — after The Islands (1961), oil and graphite on canvas.
 * 72 × 72 inches / 182.9 × 182.9 cm. Reference: Pace Gallery.
 * https://www.pacegallery.com/artists/agnes-martin/
 *
 * The 64-column / 97-row arrangement, paired columns, warm ground and
 * inset white border are observations of the reproduction, not a survey
 * of the physical painting. This is the 1961 canvas, not Islands I–XII.
 * All marks are procedural; no reference pixels or image files are used.
 * Click / R: next seeded surface. S: save the native 2240 × 2240 canvas.
 */

const ISLANDS83 = { size: 2240, seed: 1961, pairs: 32, rows: 97 };
let islands83Seed = ISLANDS83.seed;
let islands83Canvas;
let islands83Random;
let islands83Fields;
let islands83ColumnOffsets;
let islands83RowOffsets;

function setup() {
  pixelDensity(1);
  const sheet = document.createElement('canvas');
  sheet.getContext('2d', { willReadFrequently: true });
  islands83Canvas = createCanvas(ISLANDS83.size, ISLANDS83.size, P2D, sheet);
  (document.querySelector('main') || document.body).appendChild(sheet);
  sheet.setAttribute('role', 'img');
  sheet.setAttribute('aria-label', 'Tribute to Agnes Martin: The Islands, 1961. A warm linen coloured canvas, a faint graphite grid, paired columns of small white paint touches and a thin white inset border. Click or press R for another surface; S saves the full resolution image.');
  sheet.tabIndex = 0;
  sheet.title = 'Tribute to Agnes Martin: The Islands · 1961 · Click / R: new surface · S: save';
  fitIslands83();
  noLoop();
}

function draw() {
  const started = performance.now();
  window.__ARTWORK_READY__ = false;
  islands83Random = islands83Rng(islands83Seed);
  islands83Fields = {
    brush: islands83Field(175, 24),
    warp: islands83Field(1120, 40),
    weft: islands83Field(80, 520),
    planes: islands83Field(16, 5),
    tooth: islands83Field(1120, 1120),
  };
  islands83ColumnOffsets = Array.from({ length: 64 }, () => (islands83Random() - 0.5) * 2.6);
  islands83RowOffsets = Array.from({ length: ISLANDS83.rows }, () => (islands83Random() - 0.5) * 2.1);
  islands83Ground();
  drawingContext.save();
  drawingContext.scale(width / 2000, height / 2000);
  islands83Drag();
  islands83Graphite();
  islands83White();
  islands83Border();
  islands83Rail();
  drawingContext.restore();
  islands83Tooth();
  window.agnesStudy = {
    seed: islands83Seed,
    renderMs: Math.round(performance.now() - started),
    regenerate: (seed = islands83Seed + 1) => { islands83Seed = seed >>> 0; redraw(); },
  };
  window.__ARTWORK_READY__ = true;
}

function islands83Rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function islands83Field(nx, ny) {
  const values = new Float32Array((nx + 1) * (ny + 1));
  for (let i = 0; i < values.length; i++) values[i] = islands83Random();
  return { nx, ny, values };
}

function islands83Noise(field, u, v) {
  const x = Math.max(0, Math.min(0.999999, u)) * field.nx;
  const y = Math.max(0, Math.min(0.999999, v)) * field.ny;
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const i = iy * (field.nx + 1) + ix;
  const a = field.values[i], b = field.values[i + 1];
  const c = field.values[i + field.nx + 1], d = field.values[i + field.nx + 2];
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function islands83Ground() {
  loadPixels();
  const s = width / 2000;
  for (let y = 0; y < height; y++) {
    const v = y / height, py = y / s;
    const crossThread = Math.sin(py * 2.01) * 1.8 + Math.sin(py * 0.79) * 0.8;
    for (let x = 0; x < width; x++) {
      const u = x / width, px = x / s;
      const i = (y * width + x) * 4;
      const brush = islands83Noise(islands83Fields.brush, u, v) - 0.5;
      const warp = islands83Noise(islands83Fields.warp, u, v) - 0.5;
      const weft = islands83Noise(islands83Fields.weft, u, v) - 0.5;
      const planes = islands83Noise(islands83Fields.planes, u, v) - 0.5;
      const tooth = islands83Noise(islands83Fields.tooth, u, v) - 0.5;
      const grain = (islands83Random() - 0.5) * 25;
      const longitudinal = Math.sin(px * 2.37 + Math.sin(py * 0.015) * 0.12) * 4.6;
      const falloff = -3.5 * Math.pow(Math.abs(u - 0.5) * 2, 2) + 1.2 * v;
      const glaze = Math.max(0, Math.min(1, (Math.min(px - 278, 1735 - px, py - 263, 1732 - py) + warp * 10) / 18)) * 7.4;
      const tone = brush * 5 + warp * 10 + weft * 8 + planes * 3 + tooth * 14 + longitudinal + crossThread + grain + falloff + glaze;
      pixels[i] = 191 + tone;
      pixels[i + 1] = 167 + tone * 0.96;
      pixels[i + 2] = 136 + tone * 0.91;
      pixels[i + 3] = 255;
    }
  }
  updatePixels();
}

function islands83Drag() {
  const ctx = drawingContext;
  // Small dragged deposits have finite edges and strongly vertical direction.
  for (let i = 0; i < 12500; i++) {
    const x = 29 + islands83Random() * 1943;
    const y = 28 + islands83Random() * 1940;
    const length = 3 + Math.pow(islands83Random(), 2) * 112;
    const light = islands83Random() > 0.47;
    ctx.strokeStyle = light ? 'rgba(242,224,192,0.075)' : 'rgba(83,71,49,0.085)';
    ctx.lineWidth = 0.25 + islands83Random() * 0.85;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (islands83Random() - 0.5) * 0.8, Math.min(1970, y + length)); ctx.stroke();
  }
  for (let i = 0; i < 6400; i++) {
    const x = 26 + islands83Random() * 1947, y = 26 + islands83Random() * 1948;
    ctx.fillStyle = 'rgba(62,49,31,0.13)';
    ctx.fillRect(x, y, 0.4 + islands83Random() * 0.9, 0.5 + islands83Random() * 1.6);
  }
}

function islands83Graphite() {
  const ctx = drawingContext;
  const left = 282, right = 1731, top = 267, bottom = 1727;
  const cycle = (1621 - 367) / 31;
  // Three vertical rules in each repeating module: two white touches, then
  // one empty cell. Touches sit near a rule, rather than floating at its centre.
  for (let pair = -2; pair < 34; pair++) {
    for (let rule = 0; rule < 3; rule++) {
      const col = pair * 2 + rule;
      const offset = rule < 2 && col >= 0 && col < 64 ? islands83ColumnOffsets[col] : (islands83Random() - 0.5) * 1.5;
      const x = 367 + cycle * pair + [5.3, 21.7, 34.0][rule] + offset;
      const pressure = (0.115 + islands83Random() * 0.12) * (1 - (x - left) / (right - left) * 0.23);
      const tip = top + (islands83Random() - 0.5) * 19;
      const end = bottom + (islands83Random() - 0.5) * 19;
      ctx.lineWidth = 0.75 + islands83Random() * 0.45;
      for (let k = 0; k < 12; k++) {
        ctx.strokeStyle = `rgba(70,66,56,${pressure * (0.65 + islands83Random() * 0.55)})`;
        ctx.beginPath();
        const y = tip + (end - tip) * k / 12;
        const y2 = tip + (end - tip) * (k + 1) / 12;
        ctx.moveTo(x + (islands83Random() - 0.5) * 0.6, y);
        ctx.lineTo(x + (islands83Random() - 0.5) * 0.6, y2); ctx.stroke();
      }
    }
  }
  for (let row = -6; row < 103; row++) {
    const offset = row >= 0 && row < 97 ? islands83RowOffsets[row] : (islands83Random() - 0.5) * 1.9;
    const y = 347 + 1300 * row / 96 + 6.3 + offset;
    const pressure = (0.12 + islands83Random() * 0.095) * (1 - (y - top) / (bottom - top) * 0.20);
    const tip = left + (islands83Random() - 0.5) * 18;
    const end = right + (islands83Random() - 0.5) * 17;
    ctx.lineWidth = 0.75 + islands83Random() * 0.45;
    for (let k = 0; k < 12; k++) {
      ctx.strokeStyle = `rgba(69,65,54,${pressure * (0.7 + islands83Random() * 0.5)})`;
      ctx.beginPath();
      const x = tip + (end - tip) * k / 12;
      const x2 = tip + (end - tip) * (k + 1) / 12;
      ctx.moveTo(x, y + (islands83Random() - 0.5) * 0.6);
      ctx.lineTo(x2, y + (islands83Random() - 0.5) * 0.6); ctx.stroke();
    }
  }
}

function islands83White() {
  const ctx = drawingContext;
  const firstX = 367, lastPairX = 1621, firstY = 347, lastY = 1647;
  const offsets = islands83ColumnOffsets;
  const rows = islands83RowOffsets;
  for (let row = 0; row < ISLANDS83.rows; row++) {
    for (let col = 0; col < 64; col++) {
      const pair = Math.floor(col / 2);
      const x = firstX + (lastPairX - firstX) * pair / 31 + (col % 2) * 16.4 + offsets[col] + (islands83Random() - 0.5) * 1.25;
      const y = firstY + (lastY - firstY) * row / (ISLANDS83.rows - 1) + rows[row] + (islands83Random() - 0.5) * 1.3;
      const rx = 4.1 + islands83Random() * 1.7;
      const ry = 2.8 + islands83Random() * 0.85;
      const tone = islands83Random() * 8;
      ctx.fillStyle = `rgb(${232 + tone},${235 + tone * 0.7},${227 + tone * 0.7})`;
      const shapePower = 0.72 + islands83Random() * 0.30;
      const tilt = (islands83Random() - 0.5) * 0.20;
      ctx.beginPath();
      // One tiny loaded-brush touch, irregular at its rim rather than a disc.
      for (let j = 0; j < 14; j++) {
        const a = j / 14 * Math.PI * 2;
        const radius = 0.85 + islands83Random() * 0.28;
        const ca = Math.cos(a), sa = Math.sin(a);
        const bx = Math.sign(ca) * Math.pow(Math.abs(ca), shapePower) * rx * radius;
        const by = Math.sign(sa) * Math.pow(Math.abs(sa), shapePower) * ry * radius;
        const xx = x + bx * Math.cos(tilt) - by * Math.sin(tilt);
        const yy = y + bx * Math.sin(tilt) + by * Math.cos(tilt);
        if (!j) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(104,95,75,0.17)'; ctx.lineWidth = 0.42; ctx.stroke();
      if (islands83Random() < 0.24) {
        ctx.fillStyle = 'rgba(175,156,125,0.4)';
        ctx.fillRect(x - rx * 0.6 + islands83Random() * rx, y + (islands83Random() - 0.5) * ry, 0.5, 0.5 + islands83Random() * 1.1);
      }
    }
  }
}

function islands83Border() {
  const ctx = drawingContext;
  const corners = [[70,65],[1928,59],[1933,1928],[77,1937]];
  ctx.strokeStyle = 'rgba(240,240,227,0.98)'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  let previous;
  for (let edge = 0; edge < 4; edge++) {
    const a = corners[edge], b = corners[(edge + 1) % 4];
    for (let j = 0; j <= 150; j++) {
      const t = j / 150;
      const drift = edge === 0 ? 6 * Math.sin(t * Math.PI) : Math.sin(t * Math.PI * 4 + edge) * 1.1;
      const wobble = (islands83Random() - 0.5) * 1.25 + drift;
      const x = a[0] + (b[0] - a[0]) * t + (edge % 2 ? wobble : 0);
      const y = a[1] + (b[1] - a[1]) * t + (edge % 2 ? 0 : wobble);
      if (previous) {
        ctx.lineWidth = 4.35 + islands83Random() * 1.3;
        ctx.beginPath(); ctx.moveTo(previous[0],previous[1]); ctx.lineTo(x,y); ctx.stroke();
      }
      previous = [x,y];
    }
  }
  ctx.beginPath(); ctx.moveTo(previous[0],previous[1]); ctx.lineTo(corners[0][0],corners[0][1]); ctx.stroke();
  ctx.lineCap = 'butt';
}

function islands83Rail() {
  const ctx = drawingContext;
  // A narrow procedural support edge follows the photographed canvas perimeter.
  ctx.fillStyle = '#f5f3e9'; ctx.fillRect(0,0,2000,8); ctx.fillRect(0,0,9,2000);
  ctx.fillRect(1991,0,9,2000); ctx.fillRect(0,1985,2000,15);
  ctx.strokeStyle = '#6d513b'; ctx.lineWidth = 8.0;
  ctx.beginPath(); ctx.moveTo(16,18); ctx.lineTo(1988,11); ctx.lineTo(1990,1979); ctx.lineTo(25,1988); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = 'rgba(36,30,23,0.9)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(25,28); ctx.lineTo(1978,22); ctx.lineTo(1979,1970); ctx.lineTo(34,1979); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = 'rgba(130,101,81,0.7)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(14,13); ctx.lineTo(1991,8); ctx.lineTo(1994,1984); ctx.lineTo(24,1991); ctx.closePath(); ctx.stroke();
}

function islands83Tooth() {
  loadPixels();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const n = (islands83Random() - 0.5) * (pixels[i] > 219 && pixels[i + 1] > 219 ? 12 : 5.6);
      pixels[i] += n; pixels[i + 1] += n; pixels[i + 2] += n;
    }
  }
  updatePixels();
}

function fitIslands83() {
  const available = Math.max(1, Math.min(windowWidth, windowHeight));
  if (islands83Canvas) {
    islands83Canvas.elt.style.width = `${available}px`;
    islands83Canvas.elt.style.height = `${available}px`;
    islands83Canvas.elt.style.display = 'block';
  }
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
}
function windowResized() { fitIslands83(); }
function mousePressed() { if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) { islands83Seed++; redraw(); } }
function keyPressed() {
  if (key === 'r' || key === 'R') { islands83Seed++; redraw(); }
  if (key === 's' || key === 'S') saveCanvas(islands83Canvas, `tribute-agnes-martin-the-islands-${islands83Seed}`, 'png');
}
