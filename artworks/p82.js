/**
 * Title: Tribute to Agnes Martin: Untitled
 * Practice 82 — after Whitney accession 81.30, object 2125.
 * Pen and ink and graphite on paper.
 * https://whitney.org/collection/works/2125
 *
 * The photograph's near-square crop is retained; the museum documents an
 * irregular 12 × 9 3/8 inch sheet and an 8 × 8 inch image. Seven columns,
 * four transverse tiers and three nested borders are photograph observations.
 * Every pixel and mark is procedural; no image/texture is loaded or sampled.
 * Click / R varies the paper and ink surface; S saves the native-resolution PNG.
 */

const UNTITLED82 = {
  width: 2240,
  height: 2295,
  seed: 1960,
  sourceWidth: 1562,
  sourceHeight: 1600,
  paper: [244, 229, 206],
  ink: [82, 60, 30],
};

let untitled82Seed = UNTITLED82.seed;
let untitled82Canvas;
let untitled82Random;
let untitled82Geometry;
let untitled82Fields;
window.__ARTWORK_READY__ = false;

function setup() {
  pixelDensity(1);
  const sheet = document.createElement('canvas');
  sheet.getContext('2d', { willReadFrequently: true });
  untitled82Canvas = createCanvas(UNTITLED82.width, UNTITLED82.height, P2D, sheet);
  (document.querySelector('main') || document.body).appendChild(sheet);
  sheet.setAttribute('role', 'img');
  sheet.tabIndex = 0;
  sheet.setAttribute('aria-label', 'Tribute to Agnes Martin: Untitled, 1960 — seven narrow columns of fine brown-black horizontal rulings and graphite, enclosed by nested borders on warm ivory paper. Click or press R for another surface; S saves the full-resolution image.');
  sheet.title = 'Tribute to Agnes Martin: Untitled (1960) · Click / R: surface variation · S: save';
  fitUntitled82();
  noLoop();
}

function draw() {
  const started = performance.now();
  window.__ARTWORK_READY__ = false;
  untitled82Random = untitled82Rng(untitled82Seed);
  untitled82Geometry = untitled82Rng(19608130);
  untitled82Fields = [untitled82Field(21, 23), untitled82Field(96, 105)];
  untitled82Paper();
  drawingContext.save();
  drawingContext.scale(width / UNTITLED82.sourceWidth, height / UNTITLED82.sourceHeight);
  untitled82Graphite();
  untitled82Rulings();
  untitled82Borders();
  untitled82Fibres();
  drawingContext.restore();
  untitled82Tooth();
  window.agnesStudy = {
    seed: untitled82Seed,
    renderMs: Math.round(performance.now() - started),
    regenerate: (seed = untitled82Seed + 1) => { untitled82Seed = seed >>> 0; redraw(); },
  };
  window.__ARTWORK_READY__ = true;
}

function untitled82Rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function untitled82Field(nx, ny) {
  return { nx, ny, values: Float32Array.from({ length: (nx + 1) * (ny + 1) }, () => untitled82Random()) };
}

function untitled82FieldAt(field, u, v) {
  const x = Math.min(0.999999, Math.max(0, u)) * field.nx;
  const y = Math.min(0.999999, Math.max(0, v)) * field.ny;
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const i = iy * (field.nx + 1) + ix, vals = field.values;
  return (vals[i] * (1 - fx) + vals[i + 1] * fx) * (1 - fy)
    + (vals[i + field.nx + 1] * (1 - fx) + vals[i + field.nx + 2] * fx) * fy;
}

function untitled82Paper() {
  loadPixels();
  for (let y = 0; y < height; y++) {
    const v = y / height, py = v * 1600;
    for (let x = 0; x < width; x++) {
      const u = x / width, px = u * 1562, i = (y * width + x) * 4;
      const top = 40 + 0.2 * Math.sin(px * 0.032), bottom = 1558 + 0.3 * Math.sin(px * 0.02);
      const left = 37 + 0.22 * Math.sin(py * 0.035), right = 1524 + 0.25 * Math.sin(py * 0.027);
      const distance = Math.min(px - left, right - px, py - top, bottom - py);
      let r, g, b;
      if (distance < 0) {
        const grain = (untitled82Random() - 0.5) * 0.7;
        r = g = b = 216 + grain;
      } else {
        const grain = (untitled82Random() - 0.5) * 8.0;
        const broad = (untitled82FieldAt(untitled82Fields[0], u, v) - 0.5) * 3.5;
        const tooth = (untitled82FieldAt(untitled82Fields[1], u, v) - 0.5) * 2.2;
        const edge = Math.max(0, 1 - distance / 80) * 4.2;
        const shade = grain + broad + tooth - edge - Math.max(0, (0.16 - v) / 0.16) * 1.9;
        r = UNTITLED82.paper[0] + shade;
        g = UNTITLED82.paper[1] + shade;
        b = UNTITLED82.paper[2] + shade * 0.85;
        // A fine, defined sheet edge, not a blurred shadow.
        if (distance < 0.65) { r -= 23; g -= 22; b -= 20; }
      }
      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
    }
  }
  updatePixels();
}

// A ruled ink stroke has variable pressure, a narrow warm absorption edge,
// and small uninked pores. The nib stays straight at the drawing's scale.
function untitled82Ink(points, weight, opacity = 0.94) {
  const ctx = drawingContext;
  const phase = untitled82Random() * 6.28;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.lineWidth = weight * 1.35;
  ctx.strokeStyle = 'rgba(118,93,57,0.12)'; ctx.stroke();
  const top = [], bottom = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i], prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1], len = Math.hypot(dx, dy) || 1;
    const pressure = weight * (0.45 + 0.075 * Math.sin(i * 0.31 + phase) + (untitled82Random() - 0.5) * 0.16);
    const nx = -dy / len * pressure, ny = dx / len * pressure;
    top.push([p[0] + nx, p[1] + ny]); bottom.push([p[0] - nx, p[1] - ny]);
  }
  const dark = untitled82Random() * 15;
  ctx.fillStyle = `rgba(${UNTITLED82.ink[0] + dark},${UNTITLED82.ink[1] + dark},${UNTITLED82.ink[2] + dark * 0.75},${opacity})`;
  ctx.beginPath();
  top.concat(bottom.reverse()).forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath(); ctx.fill();
  // A tiny dark deposit when the nib lands or leaves, only on some lines.
  if (untitled82Random() < 0.13) {
    const p = points[untitled82Random() < 0.54 ? 0 : points.length - 1];
    ctx.fillStyle = 'rgba(74,60,40,0.62)';
    ctx.beginPath(); ctx.ellipse(p[0], p[1], weight * 0.73, weight * 0.56, 0.4, 0, Math.PI * 2); ctx.fill();
  }
  if (points.length < 150 && untitled82Random() < 0.045) {
    const atStart = untitled82Random() < 0.55;
    const p = points[atStart ? 0 : points.length - 1];
    ctx.strokeStyle = 'rgba(69,55,32,0.77)'; ctx.lineWidth = weight * 0.57;
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    ctx.lineTo(p[0] - 1.0 - untitled82Random() * 2.3, p[1] + 0.9 + untitled82Random() * 2.9); ctx.stroke();
  }
}

function untitled82Line(x1, y1, x2, y2, weight, opacity = 0.94, wobble = 0.14) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.ceil(length / 1.8), points = [];
  const dx = x2 - x1, dy = y2 - y1, norm = length || 1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const drift = (untitled82Geometry() - 0.5) * wobble;
    points.push([x1 + dx * t - dy / norm * drift, y1 + dy * t + dx / norm * drift]);
  }
  untitled82Ink(points, weight, opacity);
}

function untitled82Graphite() {
  const ctx = drawingContext;
  ctx.lineWidth = 0.42; ctx.strokeStyle = 'rgba(109,101,82,0.34)';
  // Construction rails remain chiefly at the outside columns; most of the
  // inner pencil was erased. The ruled ink is a separate layer above it.
  for (const x of [180, 299, 1253, 1373]) {
    ctx.beginPath(); ctx.moveTo(x, 160); ctx.lineTo(x + 12, 1452); ctx.stroke();
  }
  for (const y of [158, 1453]) {
    ctx.beginPath(); ctx.moveTo(141, y); ctx.lineTo(1425, y + 0.8); ctx.stroke();
  }
  for (let j = 0; j < 750; j++) {
    const side = j % 4, rail = [180, 299, 1253, 1373][side];
    const y = 162 + untitled82Random() * 1290;
    const x = rail + (y - 160) / 1290 * 12 + (untitled82Random() - 0.5) * 4;
    ctx.strokeStyle = `rgba(106,97,76,${0.045 + untitled82Random() * 0.11})`;
    ctx.lineWidth = 0.35 + untitled82Random() * 0.43;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (untitled82Random() - 0.5) * 1.8, y + 1 + untitled82Random() * 7); ctx.stroke();
  }
}

function untitled82Rulings() {
  const centers = [241, 417, 596, 777, 954, 1136, 1314];
  const drifts = [15, 13, 14, 13, 11, 11, 10];
  const barCenters = [239, 418, 596, 777, 954, 1134, 1313];
  const barDrifts = [9, 9, 18, 11, 13, 12, 12];
  const tiers = [[165, 499], [515, 808], [825, 1137], [1153, 1448]];
  const counts = [[36, 36, 35, 35], [39, 33, 40, 35], [39, 33, 40, 35], [39, 33, 40, 35], [39, 33, 40, 35], [39, 33, 40, 35], [37, 34, 37, 35]];
  for (let col = 0; col < 7; col++) {
    const c = centers[col], drift = drifts[col];
    for (let tier = 0; tier < 4; tier++) {
      const count = counts[col][tier];
      const bounds = col === 0 ? [[165, 502], [507, 815], [823, 1139], [1147, 1442]][tier]
        : col === 6 ? [[161, 499], [511, 811], [824, 1145], [1157, 1448]][tier]
          : [tiers[tier][0] + col * 0.26, tiers[tier][1] + (tier === 0 ? 4 : 2) + col * 0.28];
      for (let row = 0; row < count; row++) {
        const t = row / (count - 1);
        // Small spacing drifts follow the ruler's changing pace. The first
        // tier begins denser in the middle columns, as in the photograph.
        const paced = t + (tier === 0 && col > 0 && col < 6 ? -0.021 : 0.003) * Math.sin(t * Math.PI * 2);
        const y = bounds[0] + (bounds[1] - bounds[0]) * paced + (untitled82Geometry() - 0.5) * 1.45;
        const middle = barCenters[col] + barDrifts[col] * (y - 160) / 1293;
        const half = 60 + (col === 4 ? 2 : 0) + (untitled82Geometry() - 0.5) * 2.2;
        const offLeft = (untitled82Geometry() - 0.5) * 6.8;
        const offRight = (untitled82Geometry() - 0.5) * 4.3;
        const slope = 0.38 + (untitled82Geometry() - 0.5) * 1.2;
        untitled82Line(middle - half + offLeft, y, middle + half + offRight, y + slope, 1.24 + untitled82Random() * 0.70, 0.95, 0.34);
      }
    }
    untitled82Line(c, 158 + col * 0.3, c + drift, 1456 + (col === 0 ? 4 : 0), 0.96 + (col === 0 ? 0.14 : 0), 0.95, 0.13);
  }
}

function untitled82Borders() {
  // Unlike a printed frame, each edge is an independent ruler stroke with
  // visible overruns and slightly displaced intersections.
  untitled82Line(66, 76, 1497, 73, 1.27, 0.96);
  untitled82Line(70, 80, 68, 1527, 1.30, 0.96);
  untitled82Line(1493, 74, 1497, 1532, 1.26, 0.96);
  untitled82Line(66, 1526, 1503, 1529, 1.33, 0.96);
  untitled82Line(97, 124, 1465, 121, 1.17, 0.96);
  untitled82Line(99, 73, 101, 1529, 1.32, 0.97);
  untitled82Line(1461, 73, 1463, 1527, 1.07, 0.94);
  untitled82Line(100, 1483, 1470, 1492, 1.26, 0.96);
  untitled82Line(144, 159, 1429, 157, 1.47, 0.95);
  untitled82Line(143, 158, 142, 1452, 1.24, 0.96);
  untitled82Line(1427, 157, 1423, 1455, 1.22, 0.96);
  untitled82Line(142, 1452, 1426, 1455, 1.23, 0.96);
  // Three transverse tiers tilt independently; their unequal spacing is
  // retained instead of replacing the drawing with a perfect grid.
  untitled82Line(145, 503, 1429, 506, 1.12, 0.94);
  untitled82Line(139, 810, 1424, 826, 1.19, 0.94);
  untitled82Line(143, 1139, 1422, 1148, 1.17, 0.94);
  const ctx = drawingContext;
  for (const p of [[146, 160, 1.3, 5.0], [151, 160, 1.0, 3.8], [1422, 1453, 1.4, 2.0], [1387, 1450, 1.6, 4.4], [68, 1526, 1.1, 1.7]]) {
    ctx.fillStyle = 'rgba(66,53,30,0.88)';
    ctx.beginPath(); ctx.ellipse(p[0], p[1] + p[3] * 0.3, p[2], p[3] * 0.7, 0.13, 0, Math.PI * 2); ctx.fill();
  }
}

function untitled82Fibres() {
  const ctx = drawingContext;
  for (let i = 0; i < 3800; i++) {
    const x = 41 + untitled82Random() * 1479, y = 44 + untitled82Random() * 1510;
    const dark = untitled82Random() < 0.38;
    ctx.strokeStyle = dark ? `rgba(148,113,67,${0.035 + untitled82Random() * 0.07})` : 'rgba(255,250,231,0.20)';
    ctx.lineWidth = 0.25 + untitled82Random() * 0.28;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.5 + untitled82Random() * 2.7, y + (untitled82Random() - 0.5) * 1.1); ctx.stroke();
  }
  // Sparse, sharp paper inclusions and handling flecks.
  for (let i = 0; i < 150; i++) {
    const x = 46 + untitled82Random() * 1469, y = 48 + untitled82Random() * 1500;
    ctx.fillStyle = `rgba(151,116,73,${0.08 + untitled82Random() * 0.16})`;
    ctx.fillRect(x, y, 0.3 + untitled82Random() * 0.9, 0.35 + untitled82Random() * 1.1);
  }
}

function untitled82Tooth() {
  loadPixels();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] < 185 && untitled82Random() < 0.09) {
      const lift = 7 + untitled82Random() * 18;
      pixels[i] += lift; pixels[i + 1] += lift; pixels[i + 2] += lift * 0.85;
    }
  }
  updatePixels();
}

function fitUntitled82() {
  const w = Math.max(160, Math.min(window.innerWidth - 24, (window.innerHeight - 40) * UNTITLED82.width / UNTITLED82.height, 1100));
  untitled82Canvas.elt.style.width = `${w}px`;
  untitled82Canvas.elt.style.height = `${w * UNTITLED82.height / UNTITLED82.width}px`;
  document.body.style.background = '#d8d8d8';
}

function windowResized() { fitUntitled82(); }
function mousePressed(event) {
  if (event?.target !== untitled82Canvas.elt) return;
  untitled82Seed++; redraw();
}
function keyPressed() {
  if (key === 'r' || key === 'R') { untitled82Seed++; redraw(); }
  if (key === 's' || key === 'S') saveCanvas(untitled82Canvas, `agnes-martin-untitled-1960-${untitled82Seed}`, 'png');
}
