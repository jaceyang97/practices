/**
 * Title: Tribute to Agnes Martin: The Lamp
 * Practice 81 — after The Lamp (1959), oil on canvas, 32 × 32 inches.
 * Source: https://www.christies.com/en/lot/lot-6438935
 *
 * Twenty-four warm ochre circles, hand-shaped and spaced across a thin black
 * oil field, within a painted ivory canvas border. Every mark is procedural;
 * no reference image, bitmap texture, or tracing is loaded at runtime.
 * Click / R changes the material seed; S saves the native 2240-square canvas.
 */

const LAMP = { size: 2240, seed: 1959 };
let lampSeed = LAMP.seed;
let lampCanvas;
let lampRandom;
let lampFields;
let lampCircles;

function setup() {
  pixelDensity(1);
  const surface = document.createElement('canvas');
  surface.getContext('2d', { willReadFrequently: true });
  lampCanvas = createCanvas(LAMP.size, LAMP.size, P2D, surface);
  (document.querySelector('main') || document.body).appendChild(surface);
  surface.setAttribute('role', 'img');
  surface.tabIndex = 0;
  surface.setAttribute('aria-label', 'Tribute to Agnes Martin: The Lamp — twenty-four warm ochre, irregular circles in six columns and four rows on a black oil-painted canvas, with an ivory border. Click or press R to regenerate the surface; S saves the image.');
  surface.title = 'Tribute to Agnes Martin: The Lamp · 1959 · Click / R: new surface · S: save';
  fitLamp();
  noLoop();
}

function draw() {
  window.__ARTWORK_READY__ = false;
  const started = performance.now();
  lampRandom = lampRng(lampSeed);
  lampFields = {
    broad: lampField(10, 10),
    film: lampField(28, 45),
    brush: lampField(10, 110),
    tooth: lampField(140, 160),
    fibre: lampField(680, 720),
    yarn: lampField(750, 750),
    border: lampField(20, 28),
  };
  lampCircles = lampCircleLayout();
  lampPaint();
  lampDryMarks();
  window.agnesStudy = {
    seed: lampSeed,
    renderMs: Math.round(performance.now() - started),
    regenerate: (seed = lampSeed + 1) => { lampSeed = Number(seed) >>> 0; redraw(); },
  };
  window.__ARTWORK_READY__ = true;
}

function lampRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function lampField(nx, ny) {
  const values = new Float32Array((nx + 1) * (ny + 1));
  for (let i = 0; i < values.length; i++) values[i] = lampRandom();
  return { nx, ny, values };
}

function lampNoise(field, u, v) {
  const x = Math.max(0, Math.min(0.999999, u)) * field.nx;
  const y = Math.max(0, Math.min(0.999999, v)) * field.ny;
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx *= fx * (3 - 2 * fx);
  fy *= fy * (3 - 2 * fy);
  const i = iy * (field.nx + 1) + ix;
  const a = field.values[i], b = field.values[i + 1];
  const c = field.values[i + field.nx + 1], d = field.values[i + field.nx + 2];
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function lampCircleLayout() {
  // Observed centres and relative sizes, expressed on a 1600-square study.
  // The rhythms remain fixed when the procedural oil surface is regenerated.
  const xs = [234, 443, 667, 894, 1135, 1360];
  const ys = [360, 665, 980, 1237];
  const offsets = [
    [0, 3, -4, -2, -8, 1],
    [0, -3, -4, -1, 2, 1],
    [-1, -1, 1, 5, 8, 8],
    [0, 0, 0, 4, 10, 5],
  ];
  const radii = [
    [49, 48, 47, 47, 52, 49],
    [49, 48, 50, 47, 51, 49],
    [48, 49, 48, 49, 50, 47],
    [48, 49, 50, 48, 48, 49],
  ];
  const squash = [[1.02, 1.03, 0.99, 0.98, 0.94, 1.01], [1.03, 1.03, 1.03, 1.00, 0.99, 1.00], [1.04, 1.00, 1.04, 0.96, 0.99, 1.02], [1.00, 1.01, 1.02, 1.00, 1.00, 0.98]];
  const circles = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 6; col++) {
    const phase = row * 0.83 + col * 1.71;
    circles.push({
      x: xs[col] * 1.4,
      y: (ys[row] + offsets[row][col]) * 1.4,
      radius: radii[row][col] * 1.4,
      squash: squash[row][col],
      phase,
      colour: (lampRandom() - 0.5) * 9,
      profile: Array.from({ length: 96 }, (_, k) =>
        Math.sin(k / 96 * Math.PI * 4 + phase) * 1.3 +
        Math.sin(k / 96 * Math.PI * 6 + phase) * 0.9 +
        Math.sin(k / 96 * Math.PI * 10 + phase * 0.7) * 0.50 +
        Math.sin(k / 96 * Math.PI * 18 + phase * 1.1) * 0.35 +
        (lampRandom() - 0.5) * 0.7),
    });
  }
  return circles;
}

function lampRadius(circle, angle) {
  const q = (angle / (Math.PI * 2) + 1) % 1 * circle.profile.length;
  const i = Math.floor(q), f = q - i;
  return circle.radius + circle.profile[i] * (1 - f) + circle.profile[(i + 1) % circle.profile.length] * f;
}

function lampPaint() {
  loadPixels();
  const period = 3.1;
  const sx = new Float32Array(width), sy = new Float32Array(height);
  const tx = new Float32Array(width), ty = new Float32Array(height);
  const px = new Float32Array(width), py = new Float32Array(height);
  const cx = new Float32Array(width), cy = new Float32Array(height);
  for (let x = 0; x < width; x++) {
    const angle = (x / period + Math.sin(x * 0.033) * 0.025) * Math.PI * 2;
    sx[x] = Math.cos(angle); tx[x] = Math.sin(angle);
    const phase = Math.sin(x * 0.018) * 0.32 + Math.sin(x * 0.097) * 0.12;
    px[x] = Math.sin(phase); cx[x] = Math.cos(phase);
  }
  for (let y = 0; y < height; y++) {
    const angle = (y / period + Math.sin(y * 0.038) * 0.025) * Math.PI * 2;
    sy[y] = Math.cos(angle); ty[y] = Math.sin(angle);
    const phase = Math.sin(y * 0.023) * 0.32 + Math.sin(y * 0.087) * 0.12;
    py[y] = Math.sin(phase); cy[y] = Math.cos(phase);
  }
  const rows = [360, 665, 980, 1237].map(v => v * 1.4);
  for (let y = 0; y < height; y++) {
    const v = y / height;
    let row = -1;
    for (let n = 0; n < rows.length; n++) if (Math.abs(y - rows[n]) < 94) row = n;
    const left = 86 + Math.sin(v * 27) * 1.2 + Math.sin(v * 112) * 0.75;
    const right = 2150 + Math.sin(v * 17 + 1) * 1.4;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const i = (y * width + x) * 4;
      const broad = lampNoise(lampFields.broad, u, v) - 0.5;
      const film = lampNoise(lampFields.film, u, v) - 0.5;
      const brush = lampNoise(lampFields.brush, u, v) - 0.5;
      const tooth = lampNoise(lampFields.tooth, u, v) - 0.5;
      const fibre = lampNoise(lampFields.fibre, u, v) - 0.5;
      const grain = (lampRandom() - 0.5) * 10;
      // Interlaced yarn produces a definite microscopic surface. The exposed
      // ochre cloth shows more relief than the dark paint over the same weave.
      // Broad yarn knuckles alternate direction at crossings. Slight thread
      // drift and local yarn thickness interrupt a mechanically perfect grid.
      const crossing = (Math.floor(x / period) + Math.floor(y / period)) % 2;
      const yarn = lampNoise(lampFields.yarn, u, v) - 0.5;
      const warp = sx[x] * cy[y] - tx[x] * py[y] - tx[x] * yarn * 0.75;
      const weft = sy[y] * cx[x] - ty[y] * px[x] - ty[y] * fibre * 0.65;
      const roundedX = Math.pow(Math.max(0, Math.min(1, 0.5 + warp * 0.5)), crossing ? 0.7 : 2.0);
      const roundedY = Math.pow(Math.max(0, Math.min(1, 0.5 + weft * 0.5)), crossing ? 2.0 : 0.7);
      const weave = (roundedX * roundedY - 0.292) * (0.94 + yarn * 0.70);
      const top = 76 + u * 5 + Math.sin(u * 36) * 1.4;
      const bottom = 2167 - u * 3 + Math.sin(u * 46) * 1.5;
      const edge = Math.min(x - left, right - x, y - top, bottom - y) + tooth * 1.9;
      const cover = Math.max(0, Math.min(1, (edge + 1.5) / 2.8));
      const whiteTone = broad * 7 + film * 4 + tooth * 3 + grain * 0.38 + weave * 1.3;
      const age = Math.exp(-x / 160) * 13.6 + (1 - v) * (1 - v) * 11;
      let r = 254 - age + whiteTone, g = 253 - age + whiteTone, b = 248 - age + whiteTone;
      if (cover > 0) {
        const oil = broad * 3 + film * 3 + brush * 2 + tooth * 3 + fibre * 3;
        let dr = 39.0 + oil + grain * 1.40 + weave * 16;
        let dg = 38.0 + oil + grain * 1.40 + weave * 16;
        let db = 35.8 + oil + grain * 1.40 + weave * 16;
        if (row >= 0) {
          for (let c = 0; c < 6; c++) {
            const circle = lampCircles[row * 6 + c];
            const dx = x - circle.x, dy = (y - circle.y) / circle.squash;
            if (Math.abs(dx) > 86) continue;
            const dist = Math.hypot(dx, dy);
            const radius = lampRadius(circle, Math.atan2(dy, dx));
            const d = radius - dist + tooth * 1.0 + fibre * 1.1 + grain * 0.035;
            if (d < -9) continue;
            const rim = Math.max(0, 1 - Math.abs(d + 3.0) / 5.8) * 0.78;
            dr += (51 + weave * 8 - dr) * rim; dg += (56 + weave * 8 - dg) * rim; db += (54 + weave * 8 - db) * rim;
            const ochreCover = Math.max(0, Math.min(1, (d + 0.8) / 1.65));
            const wear = broad * 3 + film * 5 + brush * 2 + tooth * 14 + fibre * 8;
            const tan = circle.colour + wear + grain * 1.5 + weave * 46;
            dr += (138 + tan - dr) * ochreCover;
            dg += (119 + tan - dg) * ochreCover;
            db += (94 + tan - db) * ochreCover;
          }
        }
        r += (dr - r) * cover; g += (dg - g) * cover; b += (db - b) * cover;
      }
      pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255;
    }
  }
  updatePixels();
}

function lampDryMarks() {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath(); ctx.rect(90, 84, 2055, 2074); ctx.clip();
  // Scattered short dry-brush fibres. No large blurred clouds: slight paint
  // thickness changes have a definite, broken directional edge.
  for (let i = 0; i < 7000; i++) {
    const x = 91 + lampRandom() * 2052, y = 84 + lampRandom() * 2070;
    if (lampCircles.some(c => Math.hypot(x - c.x, y - c.y) < c.radius + 12)) continue;
    ctx.strokeStyle = `rgba(105,103,92,${0.035 + lampRandom() * 0.12})`;
    ctx.lineWidth = 0.5 + lampRandom() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + 2 + lampRandom() * 15, y + (lampRandom() - 0.5) * 2.4); ctx.stroke();
  }
  // Uneven pigment deposits follow the coarse cloth relief but keep their
  // own short edges, including scattered gaps of exposed lighter fibres.
  for (let i = 0; i < 23000; i++) {
    const x = 91 + lampRandom() * 2052, y = 84 + lampRandom() * 2070;
    const light = lampRandom() < 0.65;
    ctx.fillStyle = light ? `rgba(118,116,105,${0.06 + lampRandom() * 0.17})` : `rgba(8,9,8,${0.10 + lampRandom() * 0.23})`;
    if (lampCircles.some(c => Math.hypot(x - c.x, y - c.y) < c.radius + 10)) continue;
    const w = 0.6 + lampRandom() * 3.1, h = 0.5 + lampRandom() * 1.9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + 0.4);
    ctx.lineTo(x + w * 0.8, y + h); ctx.lineTo(x, y + h * 0.72); ctx.closePath(); ctx.fill();
  }
  for (let i = 0; i < 630; i++) {
    const x = 91 + lampRandom() * 2052, y = 84 + lampRandom() * 2070;
    if (lampCircles.some(c => Math.hypot(x - c.x, y - c.y) < c.radius + 8)) continue;
    ctx.fillStyle = `rgba(181,176,154,${0.26 + lampRandom() * 0.43})`;
    ctx.fillRect(x, y, 0.4 + lampRandom() * 1.7, 0.5 + lampRandom() * 1.5);
  }
  // A few longer paint scratches are individual physical traces, not noise
  // bands. They remain subordinate to the broad uninterrupted black field.
  for (let i = 0; i < 130; i++) {
    const x = 92 + lampRandom() * 2050, y = 87 + lampRandom() * 2063;
    if (lampCircles.some(c => Math.hypot(x - c.x, y - c.y) < c.radius + 55)) continue;
    const vertical = lampRandom() < 0.61, length = 6 + lampRandom() * 58;
    ctx.strokeStyle = `rgba(134,132,119,${0.035 + lampRandom() * 0.10})`;
    ctx.lineWidth = 0.40 + lampRandom() * 0.65;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (vertical ? (lampRandom() - 0.5) * 3 : length), y + (vertical ? length : (lampRandom() - 0.5) * 3)); ctx.stroke();
  }
  // Individual shallow deposits break the exposed yarn highlights within
  // the circles. They are sparse, sharp pigment marks, rather than halos.
  for (const circle of lampCircles) {
    for (let i = 0; i < 680; i++) {
      const x = circle.x + (lampRandom() - 0.5) * circle.radius * 1.94;
      const y = circle.y + (lampRandom() - 0.5) * circle.radius * 1.94 * circle.squash;
      if (Math.hypot(x - circle.x, (y - circle.y) / circle.squash) > circle.radius - 3) continue;
      const light = lampRandom() < 0.56;
      ctx.fillStyle = light ? `rgba(186,167,138,${0.12 + lampRandom() * 0.30})` : `rgba(86,74,53,${0.08 + lampRandom() * 0.19})`;
      ctx.fillRect(x, y, 0.4 + lampRandom() * 2.3, 0.4 + lampRandom() * 1.0);
    }
  }
  // Thin black paint drags at the inside of the left and bottom boundaries.
  // These keep a ragged, dry edge rather than making a photograph-like shadow.
  for (let i = 0; i < 310; i++) {
    const bottom = lampRandom() < 0.58;
    const x = bottom ? 92 + lampRandom() * 2048 : 87 + lampRandom() * 8;
    const y = bottom ? 2153 + lampRandom() * 13 : 85 + lampRandom() * 2068;
    ctx.strokeStyle = `rgba(96,101,97,${0.028 + lampRandom() * 0.11})`;
    ctx.lineWidth = 0.6 + lampRandom() * 1.6;
    const length = 9 + lampRandom() * 85;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + (bottom ? length : (lampRandom() - 0.5) * 2), y + (bottom ? (lampRandom() - 0.5) * 2 : length)); ctx.stroke();
  }
  ctx.restore();
}

function fitLamp() {
  const side = Math.max(160, Math.min(window.innerWidth - 24, window.innerHeight - 80, 1100));
  lampCanvas.elt.style.width = `${side}px`;
  lampCanvas.elt.style.height = `${side}px`;
  document.body.style.background = '#eeede8';
}

function windowResized() { fitLamp(); }
function mousePressed(event) {
  if (event?.target !== lampCanvas.elt) return;
  lampSeed++; redraw();
}
function keyPressed() {
  if (key === 'r' || key === 'R') { lampSeed++; redraw(); }
  if (key === 's' || key === 'S') saveCanvas(lampCanvas, `the-lamp-${lampSeed}`, 'png');
}
