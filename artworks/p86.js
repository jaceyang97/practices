/**
 * Title: Tribute to Agnes Martin: Untitled #6
 * Practice 86 — after Untitled #6 (2003), catalogue raisonne 2003.008.
 * Acrylic and graphite on canvas, 60 x 60 in. (152.4 x 152.4 cm.).
 * https://www.christies.com/en/lot/lot-6509419
 *
 * Four pale-blue bands and three double-height whitish intervals, observed
 * from the auction reproduction. All colour, canvas tooth, pigment and
 * pencil marks are generated; no image or sampled texture loads at runtime.
 * Click / R changes the material seed. S saves the native 2240-square PNG.
 */

const MARTIN86 = {
  size: 2240,
  seed: 2003008,
  // Six observed boundaries; these stay fixed when the surface regenerates.
  rules: [0.102, 0.302, 0.403, 0.603, 0.705, 0.904],
  blue: [[211, 224, 242], [222, 232, 247], [222, 233, 247], [214, 227, 245]],
  white: [[234, 241, 249], [235, 242, 250], [230, 238, 249]],
};

let martin86Canvas, martin86Seed = MARTIN86.seed, martin86Random;
let martin86Fields;

window.__ARTWORK_READY__ = false;

function setup() {
  pixelDensity(1);
  const sheet = document.createElement('canvas');
  sheet.getContext('2d', { willReadFrequently: true });
  martin86Canvas = createCanvas(MARTIN86.size, MARTIN86.size, P2D, sheet);
  (document.querySelector('main') || document.body).appendChild(sheet);
  sheet.setAttribute('role', 'img');
  sheet.setAttribute('aria-label', 'Tribute to Agnes Martin: Untitled #6 — four pale blue painted bands, three broad whitish intervals and fine graphite rules. Click or press R for a new surface; S saves a PNG.');
  sheet.tabIndex = 0;
  sheet.title = 'Tribute to Agnes Martin: Untitled #6 · 2003 · Click / R: new surface · S: save';
  fitMartin86();
  noLoop();
}

function draw() {
  const started = performance.now();
  window.__ARTWORK_READY__ = false;
  martin86Random = martin86Rng(martin86Seed);
  martin86Fields = {
    strokes: martin86Field(84, 18),
    bristles: martin86Field(700, 95),
    pigment: martin86Field(610, 590),
    faint: martin86Field(40, 32),
  };
  martin86Paint();
  martin86Drag();
  martin86Graphite();
  window.agnesStudy = {
    seed: martin86Seed,
    renderMs: Math.round(performance.now() - started),
    regenerate: (seed = martin86Seed + 1) => {
      martin86Seed = Number(seed) >>> 0;
      window.__ARTWORK_READY__ = false;
      redraw();
    },
  };
  window.__ARTWORK_READY__ = true;
}

function martin86Rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function martin86Field(nx, ny) {
  const values = new Float32Array((nx + 1) * (ny + 1));
  for (let i = 0; i < values.length; i++) values[i] = martin86Random();
  return { nx, ny, values };
}

function martin86Noise(field, u, v) {
  const x = Math.max(0, Math.min(0.999999, u)) * field.nx;
  const y = Math.max(0, Math.min(0.999999, v)) * field.ny;
  const ix = x | 0, iy = y | 0;
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const k = iy * (field.nx + 1) + ix;
  const a = field.values[k], b = field.values[k + 1];
  const c = field.values[k + field.nx + 1], d = field.values[k + field.nx + 2];
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function martin86RuleY(index, x) {
  const u = x / MARTIN86.size;
  // Minute hand deviations, and the slightly rising photographed alignment.
  return MARTIN86.rules[index] * MARTIN86.size - u * 5.2
    + 0.34 * Math.sin(u * 29 + index * 2.1)
    + 0.19 * Math.sin(u * 123 + index * 3.7);
}

function martin86Band(x, y) {
  let band = 0;
  while (band < 6 && y > martin86RuleY(band, x)) band++;
  return band;
}

function martin86Paint() {
  loadPixels();
  const n = MARTIN86.size;
  const weaveX = new Float32Array(n), weaveY = new Float32Array(n);
  // Correlate individual grains only along a three-pixel vertical bristle.
  // This is a seeded micro-material field, not stored source-image pixels.
  const fibre = new Float32Array(n * (n + 2));
  for (let i = 0; i < fibre.length; i++) fibre[i] = martin86Random() - 0.5;
  for (let i = 0; i < n; i++) {
    weaveX[i] = Math.sin(i * 2.68) * 0.75 + Math.sin(i * 1.18) * 0.30;
    weaveY[i] = Math.sin(i * 2.36) * 0.60 + Math.sin(i * 1.11) * 0.30;
  }
  for (let y = 0; y < n; y++) {
    const v = y / n;
    for (let x = 0; x < n; x++) {
      const u = x / n, band = martin86Band(x, y), blue = band % 2 === 0;
      const base = blue ? MARTIN86.blue[band / 2] : MARTIN86.white[(band - 1) / 2];
      const vertical = martin86Noise(martin86Fields.strokes, u, v) - 0.5;
      const bristle = martin86Noise(martin86Fields.bristles, u, v) - 0.5;
      const pigment = martin86Noise(martin86Fields.pigment, u, v) - 0.5;
      const faint = martin86Noise(martin86Fields.faint, u, v) - 0.5;
      const fi = (y + 1) * n + x;
      const fibreGrain = (fibre[fi - n] * 0.6 + fibre[fi] + fibre[fi + n] * 0.6) * (blue ? 22 : 18);
      const speck = fibreGrain + (martin86Random() - 0.5) * 6;
      // At close range the weave has small diagonal ridges. An interlaced
      // high-frequency weave replaces the first pass's lumpy pigment field.
      const diagonal = Math.sin((x + y) * 2.19 + weaveX[x] * 0.19);
      const weave = (weaveX[x] + weaveY[y] + diagonal * 1.8) * 2.1;
      const tooth = pigment * 2 + weave + speck;
      const dragged = vertical * (blue ? 6.5 : 4.0) + bristle * 7 + faint * 1.0;
      // A lean coat exposes cool canvas. The small pigment contribution has
      // a strong blue component, while the fine tooth catches white light.
      const shade = tooth + dragged;
      let r = base[0] + shade;
      let g = base[1] + shade;
      let b = base[2] + shade * 0.65;
      const pore = martin86Random();
      if (pore < (blue ? 0.095 : 0.050)) {
        const amount = 8 + martin86Random() * 24;
        r -= amount; g -= amount * 0.92; b -= amount * 0.43;
      }
      // Sparse dry concentrations at the beginning of the upper brush pass.
      const upperLeft = Math.max(0, 1 - u / 0.11) * Math.max(0, 1 - v / 0.052);
      if (upperLeft > 0 && martin86Random() < upperLeft * 0.26) {
        const deposit = upperLeft * (10 + martin86Random() * 30);
        r -= deposit; g -= deposit * 0.7; b -= deposit * 0.26;
      }
      const k = (y * n + x) * 4;
      pixels[k] = r; pixels[k + 1] = g; pixels[k + 2] = b; pixels[k + 3] = 255;
    }
  }
  updatePixels();
}

// Broken, parallel bristle trails lie over the tooth, with definite short
// endpoints and imperfectly repeated widths. No blur or fog layer is used.
function martin86Drag() {
  const ctx = drawingContext;
  ctx.lineCap = 'butt';
  for (let i = 0; i < 27000; i++) {
    const x = martin86Random() * width, y = martin86Random() * height;
    const band = martin86Band(x, y), blue = band % 2 === 0;
    const length = 8 + martin86Random() * 110;
    const light = martin86Random() < 0.53;
    const alpha = (0.035 + martin86Random() * 0.12) * (blue ? 1 : 0.65);
    ctx.strokeStyle = light ? `rgba(250,251,253,${alpha})` : `rgba(132,173,222,${alpha})`;
    ctx.lineWidth = 0.30 + martin86Random() * 1.1;
    const end = Math.min(height, y + length);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (martin86Random() - 0.5) * 1.0, end);
    ctx.stroke();
  }
  // Small dry pigment islands break into individual bristles, never a disk.
  for (let i = 0; i < 180; i++) {
    const x = martin86Random() * width;
    const y = martin86Random() * height;
    if (martin86Band(x, y) % 2) continue;
    for (let j = 0; j < 7; j++) {
      const bx = x + (martin86Random() - 0.5) * 7;
      const by = y + (martin86Random() - 0.5) * 12;
      ctx.fillStyle = `rgba(97,140,194,${0.04 + martin86Random() * 0.12})`;
      ctx.fillRect(bx, by, 0.4 + martin86Random() * 1.2, 1 + martin86Random() * 4);
    }
  }
  // Local pigment gathering at the start of a vertical paint pass, rather
  // than uniform dark dots distributed throughout the entire painting.
  for (let i = 0; i < 30; i++) {
    const x = 25 + martin86Random() * 160, y = martin86Random() * 36;
    for (let j = 0; j < 6; j++) {
      ctx.fillStyle = `rgba(62,111,177,${0.12 + martin86Random() * 0.24})`;
      ctx.fillRect(x + martin86Random() * 4, y + martin86Random() * 8,
        0.45 + martin86Random() * 1.2, 1 + martin86Random() * 3.5);
    }
  }
}

function martin86Graphite() {
  const ctx = drawingContext;
  ctx.lineCap = 'round';
  for (let line = 0; line < 6; line++) {
    for (let x = 11; x < width - 12; x += 3.4) {
      const end = Math.min(width - 12, x + 3.45);
      const pressure = 0.65 + martin86Random() * 0.7;
      ctx.lineWidth = (0.79 + line * 0.014) * pressure;
      ctx.strokeStyle = `rgba(108,126,139,${(0.37 + martin86Random() * 0.13) * pressure})`;
      ctx.beginPath();
      ctx.moveTo(x, martin86RuleY(line, x));
      ctx.lineTo(end, martin86RuleY(line, end));
      ctx.stroke();
    }
  }
}

function fitMartin86() {
  const side = Math.max(160, Math.min(window.innerWidth - 24, window.innerHeight - 40, 1100));
  martin86Canvas.elt.style.width = `${side}px`;
  martin86Canvas.elt.style.height = `${side}px`;
  martin86Canvas.elt.style.display = 'block';
  document.body.style.background = '#f1f3f4';
}

function windowResized() { fitMartin86(); }
function mousePressed(event) {
  if (event?.target !== martin86Canvas.elt) return;
  martin86Seed = (martin86Seed + 1) >>> 0;
  window.__ARTWORK_READY__ = false;
  redraw();
}
function keyPressed() {
  if (key === 'r' || key === 'R') {
    martin86Seed = (martin86Seed + 1) >>> 0;
    window.__ARTWORK_READY__ = false;
    redraw();
  }
  if (key === 's' || key === 'S') saveCanvas(martin86Canvas, `untitled-6-2003-${martin86Seed}`, 'png');
}
