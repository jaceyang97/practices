/**
 * Practice 70 — Horacio García Rossi, "Brix" (1959, ink on paper)
 *
 * A faithful recreation of García Rossi's early op-art study: a 13×13 grid of
 * flat black discs on warm off-white paper, each disc cut clean across its
 * diameter by a single thin slit of bare paper. Nothing about the discs
 * changes from cell to cell — same size, same spacing — except the ANGLE of
 * that slit, and the angle is governed by one strict rule.
 *
 * The rule is concentric. Read the grid as a set of nested square rings, ring
 * 0 being the outer frame and ring 6 the single cell at the very centre. The
 * slit starts vertical on the frame and rotates a fixed 30° clockwise with
 * every ring you step inward:
 *
 *     ring 0  → 90°  (vertical)      ring 4  → 30°
 *     ring 1  → 120°                 ring 5  → 60°
 *     ring 2  → 150°                 ring 6  → 90°  (vertical — back home)
 *     ring 3  → 0°   (horizontal)
 *
 * Seven rings, seven 30° steps, so the centre cell comes full circle back to
 * the vertical it started from. Because the rotation is keyed to the square
 * ring and not to a radius or an angle-from-centre, the slits don't swirl —
 * they snap into nested square frames of one orientation each, and the eye
 * reads a slow shimmer of bands tilting through the field.
 *
 * Everything was measured off a photograph of the original: the 13×13 count
 * and lattice pitch (autocorrelation + per-disc centroids), the disc radius
 * and slit width (black/white run-lengths across vertical-slit discs), the
 * per-cell slit angle (PCA on the bare-paper pixels inside each disc — which
 * recovered the +30°-per-ring rule to within 2°), and the median ink/paper
 * colors. So each disc is the size and each slit the angle García Rossi cut.
 *
 * The discs and slits stay FLAT — no bevels, no edge highlights. The physical
 * feel of ink-on-paper lives in ONE unifying surface layer applied over the
 * whole picture, never per-disc:
 *   - fine paper tooth (grain);
 *   - a soft ink-density mottle so the black isn't a dead even field;
 *   - a broad tonal drift and a whisper of edge cooling toward the mount;
 *   - a hair of hand-jitter in each disc (±sub-pixel placement, ±1.5% radius
 *     and ±0.6° slit angle) so the lattice reads as drawn, not plotted.
 *
 * Click to re-roll the paper surface (the composition never changes).
 *
 * Code by Jace Yang
 */

const SCALE = 0.55;                       // render at 0.55× the 1856×1872 original
const W = Math.round(1856 * SCALE);       // 1021
const H = Math.round(1872 * SCALE);       // 1030

// --- grid, measured from the original (original-pixel space, then ×SCALE) ---
const N = 13;                             // 13×13 discs
const COL0 = 98.1;                        // centre of disc column 0
const ROW0 = 124.0;                       // centre of disc row 0
const PITCH = 136.7;                      // disc-to-disc pitch (px), x≈y
const DISC_R = 61.5;                      // disc radius (px)
const SLIT_W = 13.0;                      // bare-paper slit width (px)

// Measured median fill colors.
const COL = {
  paper: [231, 231, 227], // warm off-white paper / the bare-paper slits & gaps
  ink:   [ 14,  14,  14], // the black discs
};

// Surface parameters (calibrated against the original; see header).
const P = {
  mottleAmp: 0.028, // ink-density unevenness in the black + paper wash
  broadAmp:  0.013, // large-scale tonal drift across the sheet
  grainAmp:  0.018, // paper tooth
  edgeCool:  0.022, // faint cooling toward the mount
};

const COMPOSITION_SEED = 7;
let textureSeed = 5;

function setup() {
  createCanvas(W, H);
  pixelDensity(1); // keep pixels[] 1:1 with W*H for the surface pass
  noLoop();
}

function mousePressed() {
  textureSeed = (textureSeed * 1103515245 + 12345) & 0x7fffffff;
  redraw();
}

function draw() {
  paintComposition();
  applyPaperSurface();
}

// ring index of cell (i,j): chessboard distance from the frame (0..6)
const ringOf = (i, j) => Math.min(i, j, N - 1 - i, N - 1 - j);

// slit angle for a ring: vertical on the frame, +30° clockwise each ring inward
const slitAngle = (ring) => ((90 + 30 * ring) % 180) * Math.PI / 180;

// --- the flat composition --------------------------------------------------
function paintComposition() {
  randomSeed(COMPOSITION_SEED); // geometry never moves on re-roll
  noiseSeed(COMPOSITION_SEED);

  background(COL.paper[0], COL.paper[1], COL.paper[2]);
  noStroke();

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const cx = (COL0 + j * PITCH) * SCALE + (random() - 0.5) * 0.8;
      const cy = (ROW0 + i * PITCH) * SCALE + (random() - 0.5) * 0.8;
      const r  = DISC_R * SCALE * (1 + (random() - 0.5) * 0.03);
      const th = slitAngle(ringOf(i, j)) + (random() - 0.5) * 0.021; // ±0.6°

      // flat black disc
      fill(COL.ink[0], COL.ink[1], COL.ink[2]);
      circle(cx, cy, 2 * r);

      // bare-paper slit: a paper-colored bar cut clean across the diameter,
      // long enough to reach both edges of the disc.
      push();
      translate(cx, cy);
      rotate(th);
      fill(COL.paper[0], COL.paper[1], COL.paper[2]);
      rectMode(CENTER);
      rect(0, 0, 2 * r + 2, SLIT_W * SCALE);
      pop();
    }
  }
}

// --- one unifying ink-on-paper surface -------------------------------------
function applyPaperSurface() {
  randomSeed(textureSeed);
  noiseSeed(textureSeed);

  const mottle = valueNoiseField(W, H, 0.10 * H, 3); // ink/paper density wash
  const broad  = valueNoiseField(W, H, 0.60 * H, 1); // sheet-wide tonal drift

  loadPixels();
  const cx0 = W / 2, cy0 = H / 2, maxD = Math.hypot(cx0, cy0);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const p = i * 4;

      let lum = 1 + P.mottleAmp * mottle[i];
      lum *= 1 + P.broadAmp * broad[i];
      lum *= 1 + P.grainAmp * (random() - 0.5) * 2;

      // faint cool edge: the sheet cools a touch toward the mount
      const d = Math.hypot(x - cx0, y - cy0) / maxD;
      const edge = 1 - P.edgeCool * Math.max(0, d - 0.7) / 0.3;

      pixels[p]     = clamp255(pixels[p]     * lum * edge);
      pixels[p + 1] = clamp255(pixels[p + 1] * lum * edge);
      pixels[p + 2] = clamp255(pixels[p + 2] * lum * edge * 1.01); // hair cooler
    }
  }
  updatePixels();
}

function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

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
    for (let k = 0; k < g.length; k++) g[k] = randomGaussian();
    for (let y = 0; y < h; y++) {
      const yy = y / c, y0 = Math.floor(yy), fy = yy - y0, y1 = Math.min(y0 + 1, gh - 1);
      for (let x = 0; x < w; x++) {
        const xx = x / c, x0 = Math.floor(xx), fx = xx - x0, x1 = Math.min(x0 + 1, gw - 1);
        const v00 = g[y0 * gw + x0], v01 = g[y0 * gw + x1];
        const v10 = g[y1 * gw + x0], v11 = g[y1 * gw + x1];
        out[y * w + x] += amp * (
          v00 * (1 - fx) * (1 - fy) + v01 * fx * (1 - fy) +
          v10 * (1 - fx) * fy       + v11 * fx * fy);
      }
    }
    tot += amp; amp *= 0.5;
  }
  for (let k = 0; k < out.length; k++) out[k] /= tot;
  return out;
}
