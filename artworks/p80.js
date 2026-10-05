/**
 * Title: Tribute to Agnes Martin: Summer
 * Practice 80 — Summer, after Agnes Martin (1964).
 * Watercolour, ink and gouache on paper; 9 1/4 × 9 1/4 in.
 * Collection Patricia L Lewy Gidwitz (LACMA's 2016 exhibition checklist).
 * https://www-images.lacma.org/s3fs-public/Agnes-Martin-exhibition-advisory-6.6.16_0.pdf
 *
 * All marks and material are procedural. No reference image is used at runtime.
 * The 47 × 35 rhythm and colours are observations of the supplied photograph,
 * not measurements of the physical work. The paper, transparent blue wash,
 * ruled ink and opaque white touches are built as separate material layers.
 * Click the painting or press R for another surface; S saves the full sheet.
 */

const SUMMER = {
  size: 2240,
  seed: 1964,
  columns: 47,
  rows: 35,
  paper: [232, 225, 206],
  blue: [23, 123, 181],
  wash: 1,
  ink: 1,
  dots: 1,
};

let summerSeed = SUMMER.seed;
let summerCanvas;
let summerRandom;
let fields;
let columnOffsets;
let rowOffsets;

function setup() {
  pixelDensity(1);
  // Keep the same CPU rasterizer from the first frame onward. Chrome can
  // otherwise switch after readbacks, changing translucent edge rounding.
  const sheet = document.createElement('canvas');
  sheet.getContext('2d', { willReadFrequently: true });
  summerCanvas = createCanvas(SUMMER.size, SUMMER.size, P2D, sheet);
  (document.querySelector('main') || document.body).appendChild(sheet);
  summerCanvas.elt.setAttribute('role', 'img');
  summerCanvas.elt.tabIndex = 0;
  summerCanvas.elt.setAttribute('aria-label', 'Tribute to Agnes Martin: Summer — blue watercolour, dark hand-ruled grid and small white gouache marks on ivory paper. Press R for a new surface; S to save.');
  summerCanvas.elt.title = 'Tribute to Agnes Martin: Summer · 1964 · Click / R: new surface · S: save';
  fitSummer();
  noLoop();
}

function draw() {
  const started = performance.now();
  window.__SUMMER_READY__ = false;
  summerRandom = summerRng(summerSeed);
  fields = {
    broad: summerField(12, 13),
    scuffs: summerField(65, 82),
    blooms: summerField(150, 155),
    fine: summerField(570, 570),
    strokes: summerField(18, 150),
    paper: summerField(32, 35),
    edge: summerField(50, 50),
  };
  columnOffsets = Array.from({ length: SUMMER.columns + 1 }, () => (summerRandom() - 0.5) * 3.2);
  rowOffsets = Array.from({ length: SUMMER.rows + 1 }, () => (summerRandom() - 0.5) * 3.6);
  summerGround();
  drawingContext.save();
  drawingContext.scale(width / 1600, height / 1600);
  summerBrushes();
  summerGrid();
  summerGouache();
  drawingContext.restore();
  summerTooth();
  window.__SUMMER_READY__ = true;
  window.summer80 = {
    seed: summerSeed,
    renderMs: Math.round(performance.now() - started),
    regenerate: (seed = summerSeed + 1) => { summerSeed = seed; redraw(); },
  };
}

function summerRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function summerField(nx, ny) {
  const values = new Float32Array((nx + 1) * (ny + 1));
  for (let i = 0; i < values.length; i++) values[i] = summerRandom();
  return { nx, ny, values };
}

function summerNoise(field, u, v) {
  const x = Math.max(0, Math.min(0.999999, u)) * field.nx;
  const y = Math.max(0, Math.min(0.999999, v)) * field.ny;
  const ix = Math.floor(x), iy = Math.floor(y);
  let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const index = iy * (field.nx + 1) + ix;
  const a = field.values[index], b = field.values[index + 1];
  const c = field.values[index + field.nx + 1], d = field.values[index + field.nx + 2];
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

function summerBounds(u, v) {
  return {
    left: 31 + 0.5 * Math.sin(v * 19) + 0.6 * Math.sin(v * 73),
    right: 1571 + 0.5 * Math.sin(v * 21 + 3) + 0.6 * Math.sin(v * 61),
    top: 47 + u * 12 + 1.3 * Math.sin(u * 32),
    bottom: 1566 - u * 11 + 2 * Math.sin(u * 22),
  };
}

function summerGround() {
  loadPixels();
  const s = width / 1600;
  for (let y = 0; y < height; y++) {
    const v = y / height, py = y / s;
    const left = 31 + 0.5 * Math.sin(v * 19) + 0.6 * Math.sin(v * 73);
    const right = 1571 + 0.5 * Math.sin(v * 21 + 3) + 0.6 * Math.sin(v * 61);
    for (let x = 0; x < width; x++) {
      const u = x / width, px = x / s;
      const i = (y * width + x) * 4;
      const grain = (summerRandom() - 0.5) * 23;
      const broad = summerNoise(fields.broad, u, v) - 0.5;
      const paper = summerNoise(fields.paper, u, v) - 0.5;
      const fine = summerNoise(fields.fine, u, v) - 0.5;
      const edge = (summerNoise(fields.edge, u, v) - 0.5) * 7 + fine * 3;
      const top = 47 + u * 12 + 1.3 * Math.sin(u * 32);
      const bottom = 1566 - u * 11 + 2 * Math.sin(u * 22);
      const distance = Math.min(px - left, right - px, py - top, bottom - py) + edge;
      const cover = Math.max(0, Math.min(1, (distance + 5) / 9));
      const paperTone = broad * 31 + paper * 14 + fine * 5 + grain;
      let r = SUMMER.paper[0] + paperTone;
      let g = SUMMER.paper[1] + paperTone;
      let b = SUMMER.paper[2] + paperTone * 0.86;
      if (cover > 0) {
        const bloom = summerNoise(fields.blooms, u, v) - 0.5;
        const stroke = summerNoise(fields.strokes, u, v) - 0.5;
        // Low-amplitude ground: the larger tonal changes come from bounded
        // translucent planes below, rather than blurred isotropic noise.
        const tone = (broad * 18 + bloom * 9 + stroke * 10) * SUMMER.wash;
        const light = 8 * (1 - u) + 4 * v;
        const pooling = Math.max(0, 1 - Math.abs(distance - 2) / 7) * 9;
        const br = SUMMER.blue[0] + tone * 1.35 + light + 3 - u * 6 + fine * 27 + grain - pooling;
        const bg = SUMMER.blue[1] + tone * 0.68 + light * 0.6 + 3.2 - u * 6.4 + fine * 22 + grain * 0.8 - pooling;
        const bb = SUMMER.blue[2] + tone * 0.50 + light * 0.4 + 4.6 - u * 9.2 + fine * 19 + grain * 0.7 - pooling;
        r += (br - r) * cover;
        g += (bg - g) * cover;
        b += (bb - b) * cover;
      }
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }
  updatePixels();
}

function summerPoint(col, row) {
  const u = col / SUMMER.columns, v = row / SUMMER.rows;
  const bounds = summerBounds(u, v);
  const column = Math.max(0, Math.min(SUMMER.columns, Math.round(col)));
  const line = Math.max(0, Math.min(SUMMER.rows, Math.round(row)));
  return [
    bounds.left + u * (bounds.right - bounds.left) + columnOffsets[column] + 0.35 * Math.sin(v * 13 + col * 0.8),
    bounds.top + v * (bounds.bottom - bounds.top) + rowOffsets[line] + 0.5 * Math.sin(u * 17 + row * 0.9),
  ];
}

// Bounded translucent planes and dragged, broken glazes. Their edges and
// directional scuffs give the blue a taut, sheet-like surface, without fog.
function summerBrushes() {
  const ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(38, 66, 1523, 1484);
  ctx.clip();
  // Thin overlapping planes: a small height step remains visible at each edge.
  for (let i = 0; i < 190; i++) {
    const x = 20 + summerRandom() * 1480, y = 45 + summerRandom() * 1520;
    const w = 70 + summerRandom() * 270, h = 18 + summerRandom() * 90;
    const light = summerRandom() < 0.65;
    ctx.fillStyle = light ? `rgba(142,177,207,${0.045 + summerRandom() * 0.25})` : `rgba(0,65,122,${0.07 + summerRandom() * 0.27})`;
    summerGlaze(x, y, w, h, 0.09);
  }
  for (let i = 0; i < 1120; i++) {
    const x = 22 + summerRandom() * 1515, y = 49 + summerRandom() * 1510;
    const w = 30 + summerRandom() * 190, h = 4 + summerRandom() * 34;
    const light = summerRandom() < 0.67;
    const alpha = 0.045 + summerRandom() * 0.20;
    ctx.fillStyle = light ? `rgba(141,176,201,${alpha})` : `rgba(0,77,134,${alpha * 1.05})`;
    summerGlaze(x, y, w, h, 0.22);
    // Unpainted pinholes and bristle tracks within a glaze, rather than a blur.
    ctx.fillStyle = light ? 'rgba(168,190,198,0.18)' : 'rgba(0,70,119,0.16)';
    for (let k = 0; k < 26; k++) {
      const dx = x + summerRandom() * w, dy = y + summerRandom() * h;
      ctx.fillRect(dx, dy, 0.7 + summerRandom() * 7, 0.5 + summerRandom() * 0.9);
    }
  }
  // Shallow, slanted scuffs catch light in narrow planes, not soft halos.
  for (let i = 0; i < 150; i++) {
    const x = 45 + summerRandom() * 1490, y = 64 + summerRandom() * 1460;
    const w = 8 + summerRandom() * 85, h = 0.6 + summerRandom() * 3.6;
    const rise = (summerRandom() - 0.5) * 9;
    ctx.fillStyle = `rgba(165,191,203,${0.06 + summerRandom() * 0.18})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + rise);
    ctx.lineTo(x + w * 0.84, y + rise + h);
    ctx.lineTo(x + w * 0.12, y + h);
    ctx.closePath();
    ctx.fill();
  }
  // Discrete, uneven fragments interrupt the broad planes at a much smaller
  // scale. They retain edges, so the texture reads as pigment/scuffs, not mist.
  for (let i = 0; i < 5200; i++) {
    const x = 38 + summerRandom() * 1515, y = 65 + summerRandom() * 1480;
    const w = 3 + summerRandom() * 19, h = 2 + summerRandom() * 10;
    const light = summerRandom() < 0.54;
    const alpha = 0.075 + summerNoise(fields.scuffs, x / 1600, y / 1600) * 0.20;
    ctx.fillStyle = light ? `rgba(117,161,198,${alpha})` : `rgba(0,82,137,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.3);
    ctx.lineTo(x + w * 0.35, y);
    ctx.lineTo(x + w, y + h * 0.25);
    ctx.lineTo(x + w * 0.82, y + h * 0.78);
    ctx.lineTo(x + w * 0.25, y + h);
    ctx.closePath();
    ctx.fill();
  }
  // Dark pools have a definite core and ragged perimeter; most remain blue.
  for (let i = 0; i < 92; i++) {
    const x = 45 + summerRandom() * 1500, y = 65 + summerRandom() * 1470;
    const radius = 1.5 + summerRandom() * 5;
    const alpha = 0.18 + summerRandom() * 0.48;
    ctx.fillStyle = `rgba(0,55,100,${alpha * 0.32})`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.15, radius * 1.35, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(0,55,100,${alpha})`;
    ctx.beginPath();
    for (let k = 0; k < 14; k++) {
      const theta = k / 14 * Math.PI * 2;
      const rr = radius * (0.86 + summerRandom() * 0.24);
      const dx = x + Math.cos(theta) * rr, dy = y + Math.sin(theta) * rr * 1.25;
      if (!k) ctx.moveTo(dx, dy); else ctx.lineTo(dx, dy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(127,167,186,0.18)';
    for (let k = 0; k < 13; k++) {
      ctx.fillRect(x + (summerRandom() - 0.5) * radius * 1.4, y + (summerRandom() - 0.5) * radius * 1.7, 0.7, 0.7);
    }
  }
  for (let i = 0; i < 55; i++) {
    const x = 45 + summerRandom() * 1500, y = 65 + summerRandom() * 1470;
    ctx.fillStyle = 'rgba(0,26,47,0.76)';
    ctx.fillRect(x, y, 0.6 + summerRandom() * 1.2, 0.7 + summerRandom() * 1.5);
  }
  ctx.restore();
}

function summerGlaze(x, y, w, h, roughness) {
  const ctx = drawingContext;
  ctx.beginPath();
  for (let k = 0; k <= 18; k++) {
    const dx = x + w * k / 18;
    const dy = y + (summerRandom() - 0.5) * h * roughness;
    if (!k) ctx.moveTo(dx, dy); else ctx.lineTo(dx, dy);
  }
  for (let k = 18; k >= 0; k--) ctx.lineTo(x + w * k / 18, y + h * (0.77 + summerRandom() * 0.23));
  ctx.closePath();
  ctx.fill();
}

function summerInkPath(points, weight, phase) {
  const ctx = drawingContext;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      const pressure = 0.88 + 0.14 * Math.sin(i * 0.36 + phase) + summerRandom() * 0.13;
      ctx.lineWidth = weight * pressure * (pass ? 1 : 1.42) * SUMMER.ink;
      ctx.strokeStyle = pass ? `rgba(0,20,40,${0.95 + summerRandom() * 0.04})` : 'rgba(0,42,70,0.17)';
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
  }
}

function summerGrid() {
  for (let col = 0; col <= SUMMER.columns; col++) {
    const points = [];
    for (let i = 0; i <= 240; i++) {
      const p = summerPoint(col, i / 240 * SUMMER.rows);
      p[0] += 0.30 * Math.sin(i * 0.55 + col * 1.9);
      points.push(p);
    }
    summerInkPath(points, 1.27 + summerRandom() * 0.23, col);
  }
  for (let row = 0; row <= SUMMER.rows; row++) {
    const points = [];
    const overrun = (summerRandom() - 0.5) * 0.32;
    for (let i = 0; i <= 300; i++) {
      const p = summerPoint(i / 300 * (SUMMER.columns + overrun) - overrun / 2, row);
      p[1] += 0.23 * Math.sin(i * 0.63 + row * 2.1);
      points.push(p);
    }
    summerInkPath(points, 2.10 + summerRandom() * 0.30, row + 80);
  }
}

// Each cell gets one dab, with individual pigment loss and a displaced blue core.
function summerGouache() {
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  const ctx = layer.getContext('2d', { willReadFrequently: true });
  ctx.scale(width / 1600, height / 1600);
  for (let row = 0; row < SUMMER.rows; row++) {
    for (let col = 0; col < SUMMER.columns; col++) {
      const u = (col + 0.5) / SUMMER.columns;
      const p = summerPoint(col + 0.5, row + 0.5);
      p[0] += (summerRandom() - 0.5) * 6;
      p[1] += (summerRandom() - 0.5) * 5;
      const radius = (2.3 + summerRandom() * 2.2) * (1.03 - u * 0.34) * SUMMER.dots;
      const opacity = 0.39 + summerRandom() * 0.30 + u * 0.19;
      const phase = summerRandom() * Math.PI * 2;
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(phase);
      ctx.fillStyle = `rgba(223,231,221,${opacity})`;
      ctx.beginPath();
      const round = summerRandom() > u * 0.95;
      const segments = round ? 20 : 5 + Math.floor(summerRandom() * 4);
      const squash = 0.80 + summerRandom() * 0.25;
      for (let k = 0; k < segments; k++) {
        const theta = k / segments * Math.PI * 2;
        const rr = radius * (round ? 0.88 + summerRandom() * 0.22 : 0.65 + summerRandom() * 0.5);
        const x = Math.cos(theta) * rr, y = Math.sin(theta) * rr * squash;
        if (!k) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      if (summerRandom() < 0.92 - u * 0.22) {
        // The actual blue surface shows through an incomplete ring, rather
        // than being covered by a flat blue disc.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = `rgba(0,0,0,${0.55 + summerRandom() * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(radius * 0.15, radius * 0.08, radius * 0.50, radius * 0.53, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.fillStyle = `rgba(239,236,211,${opacity * 0.44})`;
      for (let k = 0; k < 3; k++) {
        ctx.fillRect((summerRandom() - 0.5) * radius, (summerRandom() - 0.5) * radius, 0.6, 0.7);
      }
      ctx.restore();
    }
  }
  // Opaque white pigment has a coarse, broken edge and pinholes of its own.
  const image = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < image.data.length; i += 4) {
    if (!image.data[i]) continue;
    const tooth = 0.54 + summerRandom() * 0.74;
    image.data[i] *= summerRandom() < 0.045 ? 0.08 : tooth;
  }
  ctx.putImageData(image, 0, 0);
  drawingContext.drawImage(layer, 0, 0, 1600, 1600);
}

// A shared paper tooth also breaks up the opaque marks and the ruled ink.
function summerTooth() {
  loadPixels();
  for (let i = 0; i < pixels.length; i += 4) {
    const tooth = (summerRandom() - 0.5) * 8;
    const pore = summerRandom() < 0.035 ? (summerRandom() - 0.30) * 25 : 0;
    pixels[i] += tooth + pore;
    pixels[i + 1] += tooth + pore;
    pixels[i + 2] += tooth * 0.85 + pore;
  }
  updatePixels();
}

function fitSummer() {
  const side = Math.max(180, Math.min(window.innerWidth - 24, window.innerHeight - 80, 1100));
  summerCanvas.elt.style.width = `${side}px`;
  summerCanvas.elt.style.height = `${side}px`;
  document.body.style.background = '#eeede8';
}

function windowResized() { fitSummer(); }
function mousePressed(event) {
  if (event?.target !== summerCanvas.elt) return;
  summerSeed++;
  redraw();
}
function keyPressed() {
  if (key === 'r' || key === 'R') { summerSeed++; redraw(); }
  if (key === 's' || key === 'S') saveCanvas(summerCanvas, `summer-${summerSeed}`, 'png');
}
