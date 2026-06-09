/**
 * Practice 72 — Sarilotto, untitled black-and-white optical serigraph (1978)
 *               serigraph (screenprint) on paper, edition 12/30
 *               (signed l.r. "Sarilotto 78"; l.l. "Serigrafia 12/30")
 *
 * A faithful recreation of a hard-edged op-art screenprint: a checkerboard of
 * leaning parallelograms whose horizontal pitch is warped by TWO vertical
 * "fold" lines. At each fold the columns compress to a stack of ever-thinner
 * slivers; away from a fold they fan back out to full width, so the whole
 * field reads as two pleats of an accordion seen flat.
 *
 * Everything was measured from a photograph of the original (1702x1668 px).
 * The column boundaries fall at half-integer values of a column-index phase,
 * and the pitch is warped by the folds. Two arches were fit and meet at the
 * central fold (x~1042):
 *   - The LEFT arch (left edge -> centre) follows a symmetric tanh law
 *     x = Xc + D*tanh(phi/s). It crams columns toward BOTH of its folds — the
 *     left edge and the centre — so it alone produces the fine slivers piling
 *     up at the left edge AND the dense woven slivers at the middle fold. Fit
 *     to all 16 of its boundaries (wide columns + slivers) to under 4 px.
 *   - The RIGHT arch follows the gentler arctan(exp) law
 *     x = seam + (2L/pi)*atan(exp(phi/K)) (seam x~978), fit to its wide
 *     columns to under 0.03 column.
 *   Only columns lying fully inside the plate are drawn, so both side edges
 *   cut cleanly with no half-clipped slivers.
 *   - Every cell is a parallelogram with VERTICAL left/right sides and a
 *     top/bottom edge that drops a constant ~42 px across the column,
 *     regardless of column width — so the slant ANGLE steepens toward the
 *     folds (the slivers lean almost vertical) while wide columns lean gently.
 *   - The slant sign alternates column to column (the chevron), and the
 *     colour is a checkerboard: a cell is inked when (column + row) is even.
 *   - Vertical pitch is 133.5 px/cell; the grid runs rows 1..11.
 *
 * The "screenprint on paper" surface is built procedurally and applied as ONE
 * unifying layer over the whole picture — never per-tile. The parallelograms
 * stay perfectly flat (no bevels, no edge highlights); the physicality lives
 * in a faint paper tooth, a soft broad tonal drift across the sheet, a whisper
 * of ink-density mottle in the blacks (the way a hand-pulled screen lays down
 * slightly uneven), a warm paper tone and a hair of edge cooling toward the
 * mount. The geometry is crisp; only the light and the paper breathe.
 *
 * Click to re-roll the surface (the composition never changes).
 *
 * Code by Jace Yang
 */

// ---- canvas: the original's 1702x1668 sheet, scaled down --------------------
const REF_W = 1702, REF_H = 1668;
const S = 1024 / REF_W;                 // ~0.6016
const W = Math.round(REF_W * S);        // 1024
const H = Math.round(REF_H * S);        // 1004

// ---- measured geometry (in REF px; scaled by S at draw time) ----------------
// Two arches, fit separately, meeting at the central fold. The LEFT arch obeys
// a symmetric tanh law x = Xc + D*tanh(phi/s): columns cram toward BOTH its
// folds (left edge AND centre), so it alone supplies the fine slivers at the
// left edge and the dense weave at the middle fold — fit to all 16 of its
// boundaries (wide columns + slivers) to under 4 px. The RIGHT arch is gentler
// and obeys the arctan(exp) law x = seam + (2L/pi)*atan(exp(phi/K)), fit to its
// wide columns to under 0.03 column. The two share the fold at x = Xc + D.
const LEFT  = { Xc: 609.25, D: 432.56, s: 3.414, coff: 0 };   // tanh arch
const RIGHT = { seam: 978.48, L: 906.52, K: 2.2611, coff: 1 }; // arctan arch
const MIDFOLD = LEFT.Xc + LEFT.D;   // 1041.8 — geometric fold the tanh arch vanishes at
// The two arches hand off a touch LEFT of the geometric fold, where the left
// arch's last clean sliver (x~1031) meets the right arch's first column
// (x~1029): this keeps the central slivers continuous instead of leaving a gap.
const SPLIT_X = 1030;
const XL_CLIP = 184;      // plate edges: only columns fully inside are drawn,
const XR_CLIP = 1496;     // so the edges cut cleanly with no partial slivers
const DY   = 42.0;        // constant vertical drop of an edge across a column
const PH   = 133.5;       // vertical cell pitch
const E0   = -45.5;       // y of the (notional) row-0 top edge at column centre
const RMIN = 1, RMAX = 11;
const MINW = 4.0;         // stop drawing slivers thinner than this (REF px)

// ---- measured colours -------------------------------------------------------
const COL = {
  paper: [244, 242, 236],  // warm off-white sheet (scan green-cast removed)
  ink:   [ 28,  28,  30],  // screenprint black
};

// ---- surface params (subtle: this is a crisp graphic, not a wash) -----------
const P = {
  grainAmp:  0.013,  // paper tooth
  driftAmp:  0.022,  // broad tonal drift across the sheet
  mottleAmp: 0.030,  // mid-scale paper/ink unevenness
  inkMottle: 0.035,  // extra density wobble inside the blacks
  hueDrift:  0.012,  // faint warm/cool pigment drift
  edgeCool:  0.045,  // cooling toward the mount
};

const COMPOSITION_SEED = 7;
let textureSeed = 5;

function setup() {
  createCanvas(W, H);
  pixelDensity(1);   // keep pixels[] 1:1 for the surface pass
  noLoop();
}

function mousePressed() {
  textureSeed = (textureSeed * 1103515245 + 12345) & 0x7fffffff;
  redraw();
}

function draw() {
  paintComposition();
  applyScreenprintSurface();
}

// phase-inverse: x of the boundary/centre at phase `phi` in each arch
function xLeft(phi)  { return LEFT.Xc + LEFT.D * Math.tanh(phi / LEFT.s); }
function xRight(phi) { return RIGHT.seam + (2 * RIGHT.L / Math.PI) * Math.atan(Math.exp(phi / RIGHT.K)); }

// ---- the flat composition ---------------------------------------------------
function paintComposition() {
  randomSeed(COMPOSITION_SEED);
  background(COL.paper[0], COL.paper[1], COL.paper[2]);
  noStroke();
  fill(COL.ink[0], COL.ink[1], COL.ink[2]);

  const arches = [
    { xfn: xLeft,  coff: LEFT.coff,  side: -1 },   // owns x < MIDFOLD
    { xfn: xRight, coff: RIGHT.coff, side: +1 },    // owns x > MIDFOLD
  ];
  for (const A of arches) {
    for (let c = -40; c <= 40; c++) {
      const cx = A.xfn(c);
      if (A.side < 0 && cx > SPLIT_X) continue;     // hand off just left of the fold
      if (A.side > 0 && cx < SPLIT_X) continue;     // so the central slivers stay joined

      const xL = A.xfn(c - 0.5), xR = A.xfn(c + 0.5);
      // draw only columns fully inside the plate -> clean edges, no clamped slivers
      if (xL < XL_CLIP || xR > XR_CLIP || xR - xL < MINW) continue;

      const cc = c + A.coff;
      const s = (cc & 1) ? 1 : -1;          // odd column leans down-right
      for (let r = RMIN; r <= RMAX; r++) {
        if (((cc + r) & 1) !== 0) continue;  // ink when (col + row) is even
        const yt = E0 + r * PH, yb = E0 + (r + 1) * PH;
        quad(
          xL * S, (yt - s * DY / 2) * S,
          xR * S, (yt + s * DY / 2) * S,
          xR * S, (yb + s * DY / 2) * S,
          xL * S, (yb - s * DY / 2) * S
        );
      }
    }
  }
}

// ---- one unifying screenprint-on-paper surface ------------------------------
function applyScreenprintSurface() {
  randomSeed(textureSeed);
  noiseSeed(textureSeed);

  const mottle = valueNoiseField(W, H, 0.14 * H, 3);
  const drift  = valueNoiseField(W, H, 0.62 * H, 1);
  const hue    = valueNoiseField(W, H, 0.30 * H, 1);
  const ink    = valueNoiseField(W, H, 0.05 * H, 2);

  loadPixels();
  const cx0 = W / 2, cy0 = H / 2, maxD = Math.hypot(cx0, cy0);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      const p = i * 4;

      let lum = 1 + P.mottleAmp * mottle[i];
      lum *= 1 + P.driftAmp * drift[i];
      lum *= 1 + P.grainAmp * (random() - 0.5) * 2;

      // screen ink lays down a touch unevenly inside the blacks
      const isInk = pixels[p] < 90 && pixels[p + 1] < 90 && pixels[p + 2] < 90;
      if (isInk) lum *= 1 + P.inkMottle * ink[i];

      // faint cool edge toward the mount
      const d = Math.hypot(x - cx0, y - cy0) / maxD;
      const edge = 1 - P.edgeCool * Math.max(0, d - 0.74) / 0.26;

      const warm = 1 + P.hueDrift * hue[i];
      pixels[p]     = clamp255(pixels[p]     * lum * edge * warm);
      pixels[p + 1] = clamp255(pixels[p + 1] * lum * edge);
      pixels[p + 2] = clamp255(pixels[p + 2] * lum * edge / warm);
    }
  }
  updatePixels();
}

function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

// Smooth value noise on a grid of spacing `cell`, summed over octaves and
// normalized to roughly zero-mean, bilinearly upsampled.
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
