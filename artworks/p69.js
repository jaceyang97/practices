/**
 * Practice 69 — Julio Le Parc, "Double Progression" (1959,
 *                                watercolor on cardboard)
 *
 * A faithful recreation of Le Parc's early concrete-art study: a 16×16
 * grid of cream tiles, each holding a single black disc, where the disc
 * radius follows a DOUBLE progression outward from the centre — it grows
 * small → medium → large over the first three concentric square rings,
 * then shrinks back down ring by ring to a pinpoint at the very middle.
 *
 * The cream tiles sit on a blue-grey grout lattice, but the grout WIDTH runs
 * the same double progression as the discs: a hairline at the outer ring,
 * widening to its thickest in the big-disc band (ring 2), then closing back
 * to a hairline at the centre where the tiles nearly touch. So the middle and
 * the outer frame both read as open cream — not from any wash, but simply
 * because the negative space runs out there. The lattice is hand-ruled with
 * straight sides, but the spacing is irregular — whole columns and rows come
 * out a little wider or narrower, so some squares are bigger, some smaller.
 *
 * Every measurement was taken from a photograph of the original: the grid
 * pitch, the eight per-ring disc radii (connected-component bounding boxes),
 * the per-ring grout width (marched cream→grout from each cell), and the
 * median fill colors. So each disc is the size Le Parc painted it, and the
 * negative space breathes the way his does.
 *
 * The "watercolor on cardboard" surface is built procedurally and applied
 * as ONE unifying layer over the whole picture — never per-tile. The tiles
 * and discs stay flat (no bevels, no edge highlights); the physicality
 * lives in:
 *   - a soft pigment mottle (the dominant tonal unevenness of a hand-laid
 *     wash drying unevenly on board);
 *   - watercolor granulation that settles a little heavier in the blue-grey
 *     grout, the way real pigment pools in a wash;
 *   - fine cardboard tooth (grain);
 *   - a broad tonal drift across the board, and a whisper of edge cooling
 *     where the cardboard meets the mount.
 *   - a hair of hand-jitter in each disc (±sub-pixel placement, ±2.5%
 *     radius) so the lattice reads as painted, not plotted.
 *
 * Click to re-roll the watercolor surface (the composition never changes).
 *
 * Code by Jace Yang
 */

const SCALE = 2;                 // render at 2× the 500px original
const BASE = 500;
const W = BASE * SCALE;          // 1000
const H = 511 * SCALE;           // 1022 — matches the original's 500:511 board

// --- grid, measured from the original (in 500px space) ---------------------
const N = 16;
const COL0 = 21.9, ROW0 = 22.0;          // centre of tile (0,0)
const PITCH_X = (478.1 - 21.9) / 15;     // 30.41
const PITCH_Y = (488.8 - 22.0) / 15;     // 31.12
// Per-ring disc radii (ring k = chessboard distance from the frame), the
// "double progression": up over rings 0→2, then down 2→7. Measured in px.
const RING_R = [2.50, 5.36, 7.74, 6.53, 5.35, 3.85, 2.48, 1.69];

// Per-ring grout gap between adjacent tiles (px, measured from the blue-grey
// run-widths in the original). The negative space tracks the SAME double
// progression as the discs: a hairline at the outer ring, widest in the
// big-disc band (ring 2, where the tiles shrink almost to the disc and the
// blue-grey dominates), then narrowing back toward the centre where the tiles
// nearly close up. This — not a wash — is why the middle reads cream.
const GROUT = [2.0, 5.0, 9.5, 7.0, 5.5, 3.5, 2.5, 2.0];

// Measured median fill colors.
const COL = {
  paper:    [235, 221, 198], // bare cardboard around the grid
  cream:    [241, 229, 206], // the tiles
  bluegrey: [140, 144, 150], // the grout lattice
  black:    [ 27,  29,  27], // the discs
};

// Surface parameters (calibrated against the original; see header).
const P = {
  mottleAmp:  0.050, // soft pigment-wash unevenness (dominant)
  washAmp:    0.030, // mid-scale wash streaks
  broadAmp:   0.028, // large-scale tonal drift across the board
  grainAmp:   0.016, // cardboard tooth
  granuleAmp: 0.045, // extra granulation in the blue-grey grout
  hueDrift:   0.020, // subtle warm/cool pigment drift
};

const COMPOSITION_SEED = 11;
let textureSeed = 3;

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
  applyWatercolorSurface();
}

// ring index of cell (i,j): chessboard distance from the frame
const ringOf = (i, j) => Math.min(i, j, N - 1 - i, N - 1 - j);

// --- the grid: straight rails, irregular spacing ---------------------------
// The lattice is a set of shared RAILS — the vertical and horizontal cell-
// boundary lines — every one perfectly straight. The only hand-made variation
// is in their SPACING: each rail is nudged by a value that varies smoothly
// with its index, so whole columns and rows come out a little wider or
// narrower (some squares bigger, some smaller), while every side stays a clean
// straight line. Adjacent tiles share a rail exactly, so the grout lattice is
// a true ruled grid — just not a uniform one.
const RAIL_AMP = 1.8 * SCALE;   // coherent column/row spacing variation (px)

const railOffset = (idx, salt) => (noise(idx * 0.55 + salt) - 0.5) * 2 * RAIL_AMP;

let VB = [], HB = []; // rail positions (canvas px), boundaries 0..N

function buildRails() {
  VB = []; HB = [];
  for (let j = 0; j <= N; j++)
    VB[j] = (COL0 + (j - 0.5) * PITCH_X) * SCALE + railOffset(j, 0);
  for (let i = 0; i <= N; i++)
    HB[i] = (ROW0 + (i - 0.5) * PITCH_Y) * SCALE + railOffset(i, 31.7);
}

// --- the flat composition --------------------------------------------------
function paintComposition() {
  randomSeed(COMPOSITION_SEED); // fixed: geometry never moves on re-roll
  noiseSeed(COMPOSITION_SEED);
  noStroke();
  buildRails();

  background(COL.paper[0], COL.paper[1], COL.paper[2]);

  // Blue-grey grout field, ONE flat pure colour (no gradient). It extends a
  // touch BEYOND the outer tiles so the outermost cells get a grout line on
  // their outer side too — the thin blue-grey border frame that rings the
  // whole grid in the original, just inside the bare-cardboard margin.
  const g0 = GROUT[0] * SCALE, BORDER = 2.0 * SCALE; // border-frame thickness (px)
  const fL = VB[0] + g0 / 2 - BORDER, fR = VB[N] - g0 / 2 + BORDER;
  const fT = HB[0] + g0 / 2 - BORDER, fB = HB[N] - g0 / 2 + BORDER;
  fill(COL.bluegrey[0], COL.bluegrey[1], COL.bluegrey[2]);
  rect(fL, fT, fR - fL, fB - fT);

  // Cream tiles: plain axis-aligned rectangles filling each cell minus half
  // the ring's grout on every side. Straight sides; the cell edges come from
  // the shared rails, so the grout lattice is a clean ruled grid. Where the
  // grout is a hairline the tiles nearly touch — that, not a wash, is what
  // opens the cream centre.
  fill(COL.cream[0], COL.cream[1], COL.cream[2]);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const g = GROUT[ringOf(i, j)] * SCALE / 2;
      rect(VB[j] + g, HB[i] + g, VB[j + 1] - VB[j] - 2 * g, HB[i + 1] - HB[i] - 2 * g);
    }
  }

  // Black discs, double progression, centred in each cell.
  fill(COL.black[0], COL.black[1], COL.black[2]);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const k = ringOf(i, j);
      const r = RING_R[k] * SCALE * (1 + (random() - 0.5) * 0.05);
      circle((VB[j] + VB[j + 1]) / 2, (HB[i] + HB[i + 1]) / 2, 2 * r);
    }
  }
}

// --- one unifying watercolor-on-cardboard surface --------------------------
function applyWatercolorSurface() {
  randomSeed(textureSeed);
  noiseSeed(textureSeed);

  const mottle = valueNoiseField(W, H, 0.16 * H, 3); // soft pigment wash
  const wash   = valueNoiseField(W, H, 0.06 * H, 2); // finer wash streaks
  const broad  = valueNoiseField(W, H, 0.60 * H, 1); // board-wide drift
  const hue    = valueNoiseField(W, H, 0.30 * H, 1); // warm/cool pigment drift
  const gran   = valueNoiseField(W, H, 0.012 * H, 2); // fine granulation

  loadPixels();
  const cx0 = W / 2, cy0 = H / 2, maxD = Math.hypot(cx0, cy0);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const p = i * 4;

      let lum = 1 + P.mottleAmp * mottle[i];
      lum *= 1 + P.washAmp * wash[i];
      lum *= 1 + P.broadAmp * broad[i];
      lum *= 1 + P.grainAmp * (random() - 0.5) * 2;

      // Granulation: pigment settles heavier in the blue-grey grout, where
      // watercolor really does pool and granulate against bare board.
      const isGrout = pixels[p + 2] > pixels[p] + 2 && pixels[p] > 110 && pixels[p] < 175;
      if (isGrout) lum *= 1 + P.granuleAmp * gran[i];

      // Whisper of cool edge: the board cools faintly toward the mount.
      const d = Math.hypot(x - cx0, y - cy0) / maxD;
      const edge = 1 - 0.05 * Math.max(0, d - 0.72) / 0.28;

      const warm = 1 + P.hueDrift * hue[i];   // >1 warmer, <1 cooler
      pixels[p]     = clamp255(pixels[p]     * lum * edge * warm);
      pixels[p + 1] = clamp255(pixels[p + 1] * lum * edge);
      pixels[p + 2] = clamp255(pixels[p + 2] * lum * edge / warm);
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
