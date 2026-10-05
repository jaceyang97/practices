/**
 * Title: Tribute to Agnes Martin: Starlight
 * Practice 84 — after Starlight (1963).
 * Watercolor and ink on paper, 11¾ × 10½ in. Christie's lot 5147496.
 * https://www.christies.com/en/lot/lot-5147496
 *
 * The source reproduction is an almost-square, full-bleed crop; this canvas
 * follows that photographed appearance, not the documented sheet proportions.
 * All blue pigment, paper tooth and interrupted ink marks are procedural.
 * No source image, sampled texture or per-mark tracing coordinates are loaded.
 * Click / R: another seeded surface. S: save the complete native-resolution PNG.
 */

const STARLIGHT = {
  width: 2240,
  height: 2258,
  seed: 1963,
  columns: 32,
  rows: 22,
  blue: [91, 117, 168],
};

let starlightCanvas;
let starlightSeed = STARLIGHT.seed;
let starlightRandom;
let starlightFields;
let starlightColumns;
let starlightRows;
let starlightInkContext;

function setup() {
  window.__ARTWORK_READY__ = false;
  pixelDensity(1);
  const sheet = document.createElement('canvas');
  sheet.getContext('2d', { willReadFrequently: true });
  starlightCanvas = createCanvas(STARLIGHT.width, STARLIGHT.height, P2D, sheet);
  (document.querySelector('main') || document.body).appendChild(sheet);
  sheet.setAttribute('role', 'img');
  sheet.tabIndex = 0;
  sheet.setAttribute('aria-label', 'Tribute to Agnes Martin: Starlight. A granular periwinkle blue watercolor field with interrupted charcoal ink crosses and short vertical dashes. Click or press R for a new surface; S saves a full-resolution PNG.');
  sheet.title = 'Tribute to Agnes Martin: Starlight · 1963 · Click / R: regenerate · S: save';
  fitStarlight();
  noLoop();
}

function draw() {
  window.__ARTWORK_READY__ = false;
  const started = performance.now();
  starlightRandom = starlightRng(starlightSeed);
  starlightFields = {
    tone: starlightField(15, 16),
    drag: starlightField(44, 130),
    tooth: starlightField(500, 620),
  };
  starlightColumns = Array.from({ length: STARLIGHT.columns + 1 }, (_, c) =>
    c * (width - 7) / STARLIGHT.columns + 3 + (c ? (starlightRandom() - 0.5) * 9 : 0));
  starlightRows = Array.from({ length: STARLIGHT.rows + 1 }, (_, r) =>
    r * height / STARLIGHT.rows - 2 + 10 * Math.sin(r / STARLIGHT.rows * Math.PI * 0.68) +
    (r ? (starlightRandom() - 0.5) * 5 : 0));
  starlightGround();
  starlightPigment();
  starlightLattice();
  starlightTooth();
  window.agnesStudy = {
    seed: starlightSeed,
    renderMs: Math.round(performance.now() - started),
    regenerate: (seed = starlightSeed + 1) => {
      starlightSeed = Number(seed) >>> 0;
      redraw();
    },
  };
  window.__ARTWORK_READY__ = true;
}

function starlightRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function starlightField(nx, ny) {
  const values = new Float32Array((nx + 1) * (ny + 1));
  for (let i = 0; i < values.length; i++) values[i] = starlightRandom();
  return { nx, ny, values };
}

function starlightNoise(field, u, v) {
  const x = Math.min(0.999999, Math.max(0, u)) * field.nx;
  const y = Math.min(0.999999, Math.max(0, v)) * field.ny;
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const i = iy * (field.nx + 1) + ix;
  const a = field.values[i], b = field.values[i + 1];
  const c = field.values[i + field.nx + 1], d = field.values[i + field.nx + 2];
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function starlightGround() {
  loadPixels();
  for (let y = 0; y < height; y++) {
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const i = (y * width + x) * 4;
      const broad = starlightNoise(starlightFields.tone, u, v) - 0.5;
      const dragged = starlightNoise(starlightFields.drag, u, v) - 0.5;
      const tooth = starlightNoise(starlightFields.tooth, u, v) - 0.5;
      const grain = (starlightRandom() - 0.5) * 23;
      // The broad field is deliberately quiet. Colour changes are mostly
      // compact pigment fragments and short dragged brush marks below.
      const tone = broad * 5 + dragged * 5 + tooth * 33;
      const warm = u * 1.7 + v * 1.2;
      pixels[i] = STARLIGHT.blue[0] + tone + grain + warm;
      pixels[i + 1] = STARLIGHT.blue[1] + tone * 0.96 + grain * 0.88 + warm * 0.3;
      pixels[i + 2] = STARLIGHT.blue[2] + tone * 0.83 + grain * 0.79 - warm * 1.8;
      pixels[i + 3] = 255;
    }
  }
  updatePixels();
}

function starlightPigment() {
  const ctx = drawingContext;
  // Uneven but bounded horizontal passes; no blur, clouds or radial halos.
  for (let i = 0; i < 270; i++) {
    const x = starlightRandom() * width - 80;
    const y = starlightRandom() * height;
    const w = 60 + starlightRandom() * 270;
    const h = 8 + starlightRandom() * 46;
    const light = starlightRandom() < 0.53;
    ctx.fillStyle = light ? `rgba(159,177,201,${0.015 + starlightRandom() * 0.042})` : `rgba(41,67,119,${0.012 + starlightRandom() * 0.04})`;
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) {
      const px = x + w * k / 10;
      const py = y + (starlightRandom() - 0.5) * 3;
      if (!k) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    for (let k = 10; k >= 0; k--) ctx.lineTo(x + w * k / 10, y + h + (starlightRandom() - 0.5) * 4);
    ctx.closePath(); ctx.fill();
  }
  // Horizontal pigment chatter is sharp at native size, with many short
  // irregular fragments rather than a single Gaussian noise overlay.
  for (let i = 0; i < 255000; i++) {
    const x = starlightRandom() * width, y = starlightRandom() * height;
    const light = starlightRandom() < 0.55;
    const opacity = 0.12 + starlightRandom() * 0.30;
    const w = 0.6 + starlightRandom() * 4.8, h = 0.5 + starlightRandom() * 1.6;
    ctx.fillStyle = light ? `rgba(165,179,191,${opacity})` : `rgba(35,65,121,${opacity})`;
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.3);
    ctx.lineTo(x + w * 0.35, y);
    ctx.lineTo(x + w, y + h * 0.3);
    ctx.lineTo(x + w * 0.82, y + h);
    ctx.lineTo(x + w * 0.18, y + h * 0.8);
    ctx.closePath(); ctx.fill();
  }
  // A sparse second scale of dry, dragged brush fragments gives the small
  // marks a direction, while avoiding foggy large-area modulation.
  for (let i = 0; i < 7300; i++) {
    const x = starlightRandom() * width, y = starlightRandom() * height;
    const w = 2 + starlightRandom() * 17;
    const h = 0.5 + starlightRandom() * 2.4;
    const light = starlightRandom() < 0.6;
    ctx.fillStyle = light ? `rgba(153,172,193,${0.06 + starlightRandom() * 0.12})` : `rgba(42,67,113,${0.06 + starlightRandom() * 0.12})`;
    ctx.fillRect(x, y, w, h);
  }
  // Some concentrated blue pigment is visibly darker, but stays much smaller
  // and less frequent than the lattice. These are not white gouache dots.
  for (let i = 0; i < 1500; i++) {
    const x = starlightRandom() * width, y = starlightRandom() * height;
    const r = 0.4 + starlightRandom() * 1.25;
    ctx.fillStyle = `rgba(32,56,92,${0.08 + starlightRandom() * 0.25})`;
    ctx.fillRect(x, y, r * 1.5, r);
  }
  // Occasional pale hairline scuffs suggest the sheet's physical surface.
  // Their placements are generated, not copied from photographed creases.
  for (let i = 0; i < 28; i++) {
    const x = starlightRandom() * width, y = starlightRandom() * height;
    const len = 12 + starlightRandom() * 70;
    ctx.strokeStyle = `rgba(179,184,191,${0.07 + starlightRandom() * 0.13})`;
    ctx.lineWidth = 0.7 + starlightRandom() * 0.8;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + len * 0.35, y - len * 0.45);
    ctx.lineTo(x + len * 0.6, y - len * 0.52);
    ctx.stroke();
  }
}

function starlightPoint(c, r) {
  const ci = Math.max(0, Math.min(STARLIGHT.columns, Math.round(c)));
  const ri = Math.max(0, Math.min(STARLIGHT.rows, Math.floor(r)));
  const fraction = r - Math.floor(r);
  const rowY = starlightRows[ri] + fraction * height / STARLIGHT.rows;
  return [
    starlightColumns[ci] + Math.sin(r * 0.24 + c * 1.7) * 2.3 + Math.sin(r * 0.73 + c) * 0.8,
    rowY + c / STARLIGHT.columns * 6 + Math.sin(c * 0.3 + r * 1.2) * 1.8,
  ];
}

// A little variable-width nib polygon keeps compact ragged edges and tapered
// ends. Every dash has its own pressure and small imperfections.
function starlightInk(x1, y1, x2, y2, weight) {
  const ctx = starlightInkContext;
  const dx = x2 - x1, dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length, ny = dx / length;
  const count = Math.max(4, Math.ceil(length / 3));
  const phase = starlightRandom() * Math.PI * 2;
  const points = [];
  const shade = 34 + starlightRandom() * 17;
  for (let k = 0; k <= count; k++) {
    const t = k / count;
    const taper = k === 0 || k === count ? 0.78 : 1;
    const pressure = (0.82 + 0.15 * Math.sin(t * 4 + phase) + starlightRandom() * 0.18) * taper;
    const jog = (starlightRandom() - 0.5) * 0.6;
    points.push([x1 + dx * t + nx * jog, y1 + dy * t + ny * jog, weight * pressure * 0.64]);
  }
  ctx.fillStyle = `rgba(${shade + 9},${shade + 10},${shade + 5},${0.94 + starlightRandom() * 0.05})`;
  ctx.beginPath();
  for (let k = 0; k < points.length; k++) {
    const p = points[k], x = p[0] + nx * p[2], y = p[1] + ny * p[2];
    if (!k) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  const last = points[points.length - 1];
  ctx.quadraticCurveTo(last[0] + dx / length * last[2], last[1] + dy / length * last[2],
    last[0] - nx * last[2], last[1] - ny * last[2]);
  for (let k = points.length - 2; k >= 0; k--) {
    const p = points[k]; ctx.lineTo(p[0] - nx * p[2], p[1] - ny * p[2]);
  }
  const first = points[0];
  ctx.quadraticCurveTo(first[0] - dx / length * first[2], first[1] - dy / length * first[2],
    first[0] + nx * first[2], first[1] + ny * first[2]);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(17,28,37,0.85)';
  ctx.lineWidth = 1.05;
  ctx.lineJoin = 'round';
  ctx.stroke();
  // Tiny tooth breaks catch light inside an otherwise concentrated stroke.
  ctx.fillStyle = 'rgba(132,146,166,0.40)';
  for (let i = 0; i < length / 3; i++) {
    const t = starlightRandom();
    ctx.fillRect(x1 + dx * t + nx * (starlightRandom() - 0.5) * weight,
      y1 + dy * t + ny * (starlightRandom() - 0.5) * weight, 0.55 + starlightRandom() * 0.9, 0.6);
  }
}

function starlightLattice() {
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  starlightInkContext = layer.getContext('2d', { willReadFrequently: true });
  const pitch = (width - 7) / STARLIGHT.columns;
  for (let r = 0; r < STARLIGHT.rows; r++) {
    for (let c = 0; c <= STARLIGHT.columns; c++) {
      const p = starlightPoint(c, r);
      const left = pitch * (0.34 + starlightRandom() * 0.17);
      const right = pitch * (0.36 + starlightRandom() * 0.18);
      const tilt = (starlightRandom() - 0.5) * 1.6;
      starlightInk(p[0] - left, p[1] - tilt, p[0] + right, p[1] + tilt,
        2.6 + starlightRandom() * 1.3);
      const length = 10 + starlightRandom() * 13;
      const balance = 0.25 + starlightRandom() * 0.55;
      starlightInk(p[0] + (starlightRandom() - 0.5) * 1.2, p[1] - length * balance,
        p[0] + (starlightRandom() - 0.5) * 1.5, p[1] + length * (1 - balance),
        2.7 + starlightRandom() * 1.6);
      for (let k = 1; k <= 3; k++) {
        const q = starlightPoint(c, r + k / 4);
        q[0] += (starlightRandom() - 0.5) * 4;
        q[1] += (starlightRandom() - 0.5) * 4;
        const short = 10 + starlightRandom() * 11;
        const skew = (starlightRandom() - 0.5) * 1.5;
        starlightInk(q[0] - skew, q[1] - short / 2, q[0] + skew, q[1] + short / 2,
          2.3 + starlightRandom() * 1.6);
      }
    }
  }
  // Paper tooth affects both stroke interiors and their compact perimeter.
  // A separate material layer lets sparse pinholes reveal the generated blue.
  const marks = starlightInkContext.getImageData(0, 0, width, height);
  for (let i = 0; i < marks.data.length; i += 4) {
    if (!marks.data[i + 3]) continue;
    const grain = (starlightRandom() - 0.5) * 22;
    marks.data[i] += grain;
    marks.data[i + 1] += grain;
    marks.data[i + 2] += grain;
    if (starlightRandom() < 0.02) marks.data[i + 3] *= 0.45;
  }
  starlightInkContext.putImageData(marks, 0, 0);
  drawingContext.drawImage(layer, 0, 0);
}

function starlightTooth() {
  loadPixels();
  for (let i = 0; i < pixels.length; i += 4) {
    const tooth = (starlightRandom() - 0.5) * 4;
    pixels[i] += tooth;
    pixels[i + 1] += tooth;
    pixels[i + 2] += tooth * 0.8;
  }
  updatePixels();
}

function fitStarlight() {
  const ratio = STARLIGHT.width / STARLIGHT.height;
  const h = Math.max(100, Math.min(window.innerHeight - 24, (window.innerWidth - 24) / ratio, 1100));
  starlightCanvas.elt.style.width = `${h * ratio}px`;
  starlightCanvas.elt.style.height = `${h}px`;
  starlightCanvas.elt.style.maxWidth = '100%';
  document.body.style.background = '#eeede8';
}

function windowResized() { fitStarlight(); }
function mousePressed(event) {
  if (event?.target !== starlightCanvas.elt) return;
  starlightSeed = (starlightSeed + 1) >>> 0;
  redraw();
}
function keyPressed() {
  if (key === 'r' || key === 'R') { starlightSeed = (starlightSeed + 1) >>> 0; redraw(); }
  if (key === 's' || key === 'S') saveCanvas(starlightCanvas, `starlight-${starlightSeed}`, 'png');
}
