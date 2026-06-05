/**
 * Practice 67 — Vera Molnár, "3 carrés noirs, 3 rectangles gris,
 *                              5 rectangles bleu" (1950, oil on canvas)
 *
 * A faithful recreation of Molnár's early hard-edge composition: eleven
 * flat fields — 3 black squares, 3 gray rectangles, 5 blue rectangles —
 * arranged in three horizontal registers over a warm cream ground.
 *
 * Geometry and colors were measured directly from a photograph of the
 * original (connected-component bounding boxes + median fill colors), so
 * every block sits where Molnár placed it, at the size she painted it.
 *
 * The "oil on canvas" surface is built procedurally and applied as ONE
 * unifying layer over the whole picture — never per-block. The blocks
 * stay flat (no bevels, no edge highlights); the physicality lives in:
 *   - a fine linen weave (period & amplitude measured from the original:
 *     ~0.0043·W, only ±3% luminance) whose prominence drifts across the
 *     cloth, exactly as woven canvas catches light unevenly;
 *   - low-frequency paint cloudiness — the dominant tonal variation, the
 *     soft unevenness of a hand-loaded brush over a primed ground;
 *   - canvas tooth (fine grain);
 *   - a hair of edge waver from a smooth displacement field, so the
 *     hard edges read as painted, not vector-drawn.
 *
 * Click to re-roll the paint surface (the composition never changes).
 *
 * Code by Jace Yang
 */

const W = 1000;
const H = 780; // 500:390 aspect of the original canvas

// Measured fill colors (median over each region of the original).
const COL = {
  cream: [244, 230, 197],
  black: [16, 15, 17],
  gray:  [101, 120, 136],
  blue:  [64, 138, 215],
};

// The eleven blocks, in fractional canvas coordinates [fx0, fy0, fx1, fy1],
// measured from the original photograph. Three registers, top to bottom.
const SHAPES = [
  // 3 carrés noirs
  { c: 'black', r: [0.044, 0.038, 0.300, 0.356] }, // top-left square
  { c: 'black', r: [0.612, 0.756, 0.758, 0.941] }, // bottom square
  { c: 'black', r: [0.798, 0.756, 0.946, 0.944] }, // bottom-right square
  // 3 rectangles gris
  { c: 'gray',  r: [0.328, 0.041, 0.756, 0.362] }, // top wide
  { c: 'gray',  r: [0.400, 0.397, 0.946, 0.718] }, // middle (widest)
  { c: 'gray',  r: [0.048, 0.751, 0.300, 0.944] }, // bottom-left
  // 5 rectangles bleu
  { c: 'blue',  r: [0.784, 0.044, 0.946, 0.362] }, // top-right
  { c: 'blue',  r: [0.048, 0.397, 0.198, 0.715] }, // middle-left
  { c: 'blue',  r: [0.226, 0.397, 0.374, 0.715] }, // middle
  { c: 'blue',  r: [0.338, 0.754, 0.436, 0.941] }, // bottom narrow
  { c: 'blue',  r: [0.474, 0.754, 0.572, 0.941] }, // bottom narrow
];

// Surface parameters (calibrated against the original; see header).
const P = {
  edgeWaverPx: 0.0010 * W,   // ~1px hand-painted waver
  edgeCell:    0.28 * H,     // displacement field smoothness
  threadPx:    0.0043 * W,   // linen thread period (measured ~2.1px @500w)
  weaveAmp:    0.030,        // ±3% luminance (measured)
  paintAmp:    0.055,        // mid-scale brush cloud
  broadAmp:    0.030,        // large-scale tonal drift across the canvas
  grainAmp:    0.015,        // canvas tooth
};

let textureSeed = 7;

function setup() {
  createCanvas(W, H);
  pixelDensity(1); // keep pixels[] 1:1 with W*H for the texture pass
  noLoop();
}

function mousePressed() {
  // Re-roll only the paint surface; the composition is fixed.
  textureSeed = (textureSeed * 1103515245 + 12345) & 0x7fffffff;
  redraw();
}

function draw() {
  randomSeed(textureSeed);
  noiseSeed(textureSeed);

  paintGround();
  paintBlocks();
  applyCanvasSurface();
}

// --- Warm cream ground -----------------------------------------------------
function paintGround() {
  background(COL.cream[0], COL.cream[1], COL.cream[2]);
}

// --- The eleven flat blocks, with a hair of hand-painted edge waver --------
function paintBlocks() {
  noStroke();
  for (const s of SHAPES) {
    fill(COL[s.c][0], COL[s.c][1], COL[s.c][2]);
    waveredRect(s.r[0] * W, s.r[1] * H, s.r[2] * W, s.r[3] * H);
  }
}

// A rectangle whose edges are displaced by a smooth 2D field, so the hard
// edges waver by ~1px the way brushed oil edges do. Corners stay coherent
// because every boundary point is displaced by the same field.
function waveredRect(x0, y0, x1, y1) {
  const amp = P.edgeWaverPx;
  const f = 1 / P.edgeCell; // noise frequency (per pixel)
  const dx = (x, y) => (noise(x * f, y * f) - 0.5) * 2 * amp;
  const dy = (x, y) => (noise(x * f + 53.1, y * f + 91.7) - 0.5) * 2 * amp;
  const step = 7; // subdivision along each edge

  beginShape();
  for (let x = x0; x < x1; x += step) vertex(x + dx(x, y0), y0 + dy(x, y0));
  for (let y = y0; y < y1; y += step) vertex(x1 + dx(x1, y), y + dy(x1, y));
  for (let x = x1; x > x0; x -= step) vertex(x + dx(x, y1), y1 + dy(x, y1));
  for (let y = y1; y > y0; y -= step) vertex(x0 + dx(x0, y), y + dy(x0, y));
  endShape(CLOSE);
}

// --- One unifying oil-on-canvas surface over the whole picture -------------
function applyCanvasSurface() {
  const paint = valueNoiseField(W, H, 0.12 * H, 3); // mid-scale brush cloud
  const broad = valueNoiseField(W, H, 0.55 * H, 1); // large-scale tonal drift
  const pWarp = valueNoiseField(W, H, 0.10 * H, 1); // warp-thread prominence
  const pWeft = valueNoiseField(W, H, 0.10 * H, 1); // weft-thread prominence
  // Thread wander: each thread set bends along its run, so the weave reads as
  // irregular cloth rather than a perfect lattice. Warp bends with y, weft x.
  const jx    = valueNoiseField(W, H, 0.05 * H, 2);
  const jy    = valueNoiseField(W, H, 0.05 * H, 2);

  const tw = P.threadPx;
  const k1 = TWO_PI / tw;
  const k2 = TWO_PI / (tw * 1.07); // weft on a slightly different gauge

  loadPixels();
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x;

      // Fine linen weave as two wandering thread sets (warp + weft), each
      // with its own irregular prominence — a crosshatch, not a dot lattice.
      const warp = Math.cos(k1 * x + jx[i] * 2.2);
      const weft = Math.cos(k2 * y + jy[i] * 2.2);
      const aWarp = 0.75 + 0.45 * pWarp[i];
      const aWeft = 0.75 + 0.45 * pWeft[i];
      const weave = (aWarp * warp + aWeft * weft) * 0.5; // ~[-1,1]

      let lum = 1 + P.weaveAmp * weave;
      lum *= 1 + P.paintAmp * paint[i];          // mid-scale brush cloud
      lum *= 1 + P.broadAmp * broad[i];          // large-scale tonal drift
      lum *= 1 + P.grainAmp * (random() - 0.5) * 2; // canvas tooth (seeded)

      const p = i * 4;
      pixels[p]     = clamp255(pixels[p] * lum);
      pixels[p + 1] = clamp255(pixels[p + 1] * lum);
      pixels[p + 2] = clamp255(pixels[p + 2] * lum);
    }
  }
  updatePixels();
}

function clamp255(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

// Smooth value noise on a grid of spacing `cell`, summed over octaves and
// normalized to roughly zero-mean unit-ish amplitude. Bilinearly upsampled.
function valueNoiseField(w, h, cell, octaves) {
  const out = new Float32Array(w * h);
  let amp = 1, tot = 0;
  for (let o = 0; o < octaves; o++) {
    const c = Math.max(2, Math.floor(cell / (1 << o)));
    const gw = Math.floor(w / c) + 2;
    const gh = Math.floor(h / c) + 2;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = randomGaussian();
    for (let y = 0; y < h; y++) {
      const yy = y / c;
      const y0 = Math.floor(yy);
      const fy = yy - y0;
      const y1 = Math.min(y0 + 1, gh - 1);
      for (let x = 0; x < w; x++) {
        const xx = x / c;
        const x0 = Math.floor(xx);
        const fx = xx - x0;
        const x1 = Math.min(x0 + 1, gw - 1);
        const v00 = g[y0 * gw + x0], v01 = g[y0 * gw + x1];
        const v10 = g[y1 * gw + x0], v11 = g[y1 * gw + x1];
        out[y * w + x] += amp * (
          v00 * (1 - fx) * (1 - fy) + v01 * fx * (1 - fy) +
          v10 * (1 - fx) * fy       + v11 * fx * fy);
      }
    }
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
