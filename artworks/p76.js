/**
 * Practice 76 — Elena Asins Rodríguez, "LAKH 22 VARZ" (1991, ink on paper)
 *
 * A faithful recreation of Asins' systematic sheet of 32 line-figures, ruled
 * in black ink on warm ivory paper. The figures sit on a 4-row × 8-column grid
 * and grow in complexity left-to-right, top-to-bottom — from a two-cube domino
 * in the top-left corner to dense seven/eight-cube clusters in the last row.
 *
 * Each figure is a constructivist arrangement of unit "cubes" drawn in an
 * OBLIQUE (cabinet) projection: the front face is an axis-aligned square (edge
 * ≈48 px in the 1400-px original) and depth recedes UP-RIGHT, foreshortened to
 * half an edge — a back-corner offset of (+24, −24) px. Asins does not draw a
 * full transparent wireframe; she keeps only the down-/left-facing faces of
 * each block and lets the figures read as solid relief, so the depth lines
 * sometimes run a full cell as a diagonal and sometimes only half.
 *
 * Because every figure is a hand-composed, one-off configuration (not a single
 * rule), the 32 figures were TRACED from the original rather than re-derived:
 * each figure's ink was decomposed into its horizontal / vertical / diagonal
 * line segments, snapped to the half-cell lattice (unit U = 23.9 px), merged
 * into maximal segments and stored below as integer lattice coordinates
 * (m, n) — m to the right, n downward — anchored at the figure's measured
 * origin in original-image pixels. Rendering maps those straight back through
 * the same projection. A side-by-side diff of the reconstruction against the
 * source matches every figure cell.
 *
 * Measured: paper median RGB ≈ (237,231,222); ink median ≈ (62,58,54), drawn a
 * touch darker for presence; line weight ≈ 2.5 px at 1400-px width; no plate
 * frame — plain sheet. (The original carries a faint pencil inscription along
 * the bottom edge — "LAMA 32 figuras · Madrid–Hamburg 1989 · Madrid 1991 ·
 * Elena Asins" — left out here so the sheet reads as pure drawing.)
 *
 * Tiles stay FLAT — no bevels or per-cube shading. The only surface layer is a
 * single unifying pass over the whole sheet: a gentle warm vignette (lighter at
 * the top, a shade deeper at the lower-left, as in the photographed original)
 * plus a fine paper grain. Lines are drawn ink-loose — a hair of wobble and
 * overshoot — so they read as ruled by hand, not vector-perfect. Fully static.
 *
 * Code by Jace Yang
 */

const ORIG_W = 1400, ORIG_H = 1124;
const SCALE = 0.95;
const W = Math.round(ORIG_W * SCALE);   // 1330
const H = Math.round(ORIG_H * SCALE);   // 1068

const PAPER = [237, 231, 222];
const INK   = [46, 43, 40];

const SEED = 22;                        // fixed → wobble + grain are stable
const toX = (x) => x * SCALE;
const toY = (y) => y * SCALE;

// 32 traced figures: x,y = origin in ORIGINAL px; s = flat [m0,n0,m1,n1,...] in half-cell lattice units
const U = 23.9; // half-cell lattice unit, original px
const FIGS = [
  {x:81,y:183,s:[1,1,1,3,0,4,1,3,2,2,3,1,2,0,2,4,0,2,4,2,4,2,5,1,3,1,5,1,0,2,0,4,4,0,4,2,0,2,1,1,0,4,2,4,2,0,4,0]},
  {x:249,y:160,s:[1,0,1,4,0,3,1,2,0,1,0,5,1,2,5,2,0,5,1,4,5,0,5,2,3,0,3,4,1,4,3,4,0,1,1,0,3,0,5,0]},
  {x:417,y:135,s:[1,1,1,5,0,4,0,6,0,6,2,4,2,0,2,4,0,6,2,6,1,5,3,5,0,4,2,2,2,2,4,2,2,6,3,5,2,4,4,4,4,2,4,4,1,1,2,0]},
  {x:560,y:113,s:[0,5,0,7,2,1,2,5,1,6,3,6,0,5,1,4,2,3,3,2,3,2,5,2,1,4,1,6,2,1,3,0,3,0,3,4,0,7,3,4,5,2,5,4,3,4,5,4,2,5,4,5,3,6,4,5]},
  {x:725,y:185,s:[1,1,1,3,0,4,3,1,2,0,2,4,0,2,4,2,0,0,2,0,3,1,5,1,1,3,3,3,0,0,0,4,2,4,3,3,4,2,5,1,0,2,2,0,0,4,2,4]},
  {x:892,y:162,s:[1,0,1,4,0,3,1,2,2,1,3,0,0,1,0,5,1,2,3,2,0,5,3,2,1,0,3,0,2,1,2,3,3,4,4,3,3,0,3,4,1,4,3,4,0,1,1,0,2,3,4,3]},
  {x:1035,y:138,s:[1,1,1,5,0,4,0,6,0,6,1,5,2,4,3,3,2,0,2,6,0,6,2,6,0,4,2,2,2,2,4,2,4,0,4,4,0,4,4,4,3,3,5,3,4,4,5,3,1,1,2,0,2,0,4,0]},
  {x:1202,y:114,s:[1,2,1,6,0,3,0,7,0,3,1,2,2,1,3,0,3,0,3,6,2,1,2,5,1,6,3,6,0,5,3,2,3,2,5,2,2,1,4,1,5,2,5,4,4,1,4,3,1,4,5,4,0,7,2,5,2,3,4,3]},
  {x:80,y:415,s:[1,0,5,0,1,0,1,4,0,3,3,0,0,3,0,5,2,1,2,5,0,5,2,5,1,2,5,2,0,5,4,1,2,1,4,1,0,3,4,3,3,4,4,3,5,0,5,2,3,0,3,2,1,4,3,4]},
  {x:247,y:391,s:[0,2,0,6,0,6,3,3,4,2,5,1,0,4,3,1,3,3,3,5,2,0,2,4,0,6,2,6,1,5,3,5,0,2,4,2,1,3,1,5,1,3,5,3,3,1,5,1,2,6,3,5,4,4,5,3,4,0,4,2,0,4,4,4,2,0,4,0]},
  {x:415,y:367,s:[3,0,5,0,1,0,1,6,0,1,0,7,0,3,1,2,2,3,2,5,1,6,3,6,6,5,6,7,4,3,4,5,1,2,5,2,0,5,1,4,2,3,3,2,5,0,5,2,0,7,3,4,3,0,3,4,1,4,3,4,0,1,1,0,2,5,4,5,2,3,4,3,3,6,4,5]},
  {x:535,y:343,s:[1,8,4,5,3,0,3,8,2,1,2,7,1,6,5,6,4,3,4,5,1,8,3,8,4,3,6,3,3,2,5,2,2,5,6,5,2,3,3,2,0,1,0,3,1,6,1,8,5,6,6,5,1,6,3,4,2,1,3,0,5,2,5,4,3,4,5,4,6,3,6,5]},
  {x:725,y:319,s:[0,5,0,9,3,0,3,8,2,1,2,7,1,6,3,6,2,9,3,8,0,5,1,4,2,3,3,2,1,8,3,8,3,2,5,2,1,4,1,8,2,1,3,0,0,7,3,4,5,2,5,4,3,4,5,4,2,5,4,5,0,9,1,8,2,7,4,5,0,9,2,9]},
  {x:892,y:392,s:[1,1,1,5,0,0,0,6,0,6,3,3,4,2,5,1,6,0,6,2,6,4,6,6,0,4,3,1,2,0,2,6,0,6,2,6,1,5,3,5,0,2,4,2,0,0,2,0,1,3,3,3,3,1,5,1,0,4,4,4,4,2,4,4,1,1,2,0,3,5,4,4]},
  {x:1035,y:368,s:[1,0,1,6,0,1,0,3,0,5,0,7,0,3,1,2,2,1,3,0,3,0,3,6,2,1,2,5,1,6,3,6,1,2,5,2,0,5,3,2,1,0,3,0,4,5,5,4,5,2,5,4,0,7,1,6,2,5,4,3,1,4,5,4,0,1,1,0,2,5,4,5,2,3,4,3]},
  {x:1202,y:342,s:[1,1,1,7,0,4,0,8,0,8,1,7,4,4,5,3,0,6,1,5,2,4,3,3,2,0,2,8,0,6,4,6,4,0,4,6,0,4,2,2,2,2,4,2,0,8,2,8,1,7,3,7,0,4,4,4,2,8,3,7,3,3,5,3,1,1,2,0,2,0,4,0]},
  {x:77,y:578,s:[3,0,5,0,1,2,1,8,0,3,1,2,2,1,3,0,0,9,2,7,0,3,0,5,0,7,0,9,3,0,3,8,2,1,2,7,1,6,5,6,0,5,3,2,1,8,3,8,2,7,4,7,3,2,5,2,5,0,5,6,1,4,5,4,3,8,4,7,0,7,2,5]},
  {x:246,y:602,s:[1,1,1,3,1,5,1,7,2,8,3,7,4,6,5,5,0,4,3,1,0,8,1,7,2,6,3,5,3,1,3,7,2,0,2,6,0,6,4,6,0,6,1,5,2,4,3,3,4,2,4,6,1,5,5,5,0,2,4,2,0,8,2,8,1,7,3,7,1,3,3,3,0,2,0,4,0,6,0,8,0,4,4,4,1,1,2,0]},
  {x:413,y:602,s:[0,6,3,3,4,2,5,1,2,8,3,7,4,6,5,5,1,3,3,1,0,8,3,5,4,4,5,3,3,3,3,7,2,0,2,6,0,6,4,6,6,4,6,8,1,5,5,5,0,2,4,2,0,8,2,8,1,7,3,7,1,3,1,7,1,3,5,3,3,1,5,1,0,2,0,4,0,6,0,8,4,0,4,2,0,4,4,4,2,0,4,0]},
  {x:557,y:602,s:[1,1,1,7,0,4,0,8,0,6,3,3,4,6,5,5,0,8,3,5,4,4,5,3,3,1,3,5,2,0,2,8,0,6,4,6,0,4,2,2,3,1,4,0,2,2,4,2,0,8,2,8,1,1,5,1,1,3,5,3,5,1,5,5,4,0,4,2,3,5,5,5,0,4,4,4,1,1,2,0,2,0,4,0]},
  {x:724,y:579,s:[3,0,5,0,1,2,1,8,0,3,0,9,0,3,1,2,2,1,3,0,3,0,3,8,2,1,2,7,1,6,3,6,2,9,3,8,0,7,2,7,1,8,3,8,0,5,3,2,4,1,5,0,3,2,5,2,2,1,4,1,0,7,1,6,2,5,4,3,5,0,5,2,1,4,3,4,2,3,4,3,0,9,1,8,2,7,3,6,0,9,2,9]},
  {x:891,y:603,s:[1,1,1,7,0,2,0,8,0,6,3,3,4,2,5,1,0,4,3,1,0,8,2,6,3,5,4,4,2,0,2,8,4,2,4,6,1,5,3,5,6,6,6,8,0,2,4,2,0,8,2,8,1,7,3,7,3,1,5,1,1,3,3,3,2,6,4,6,3,7,4,6,0,4,4,4,1,1,2,0]},
  {x:1035,y:578,s:[1,2,1,8,0,3,1,2,2,1,3,0,0,3,4,3,3,0,3,8,2,1,2,5,1,6,5,6,1,2,5,2,1,8,3,8,2,7,4,7,1,4,3,2,0,9,1,8,2,7,3,6,4,5,5,4,0,7,1,6,2,5,4,3,0,7,0,9,1,4,5,4,5,2,5,6,2,5,4,5,4,7,5,6]},
  {x:1201,y:603,s:[2,0,4,0,1,1,1,7,0,2,0,8,0,4,1,3,2,2,4,0,0,8,1,7,0,6,1,5,4,2,5,1,2,0,2,6,0,6,4,6,4,0,4,6,1,5,3,5,0,2,4,2,0,8,2,8,1,1,5,1,1,7,3,7,0,4,4,4,2,8,3,7,0,2,2,0,2,6,3,5]},
  {x:76,y:834,s:[3,0,5,0,1,2,1,8,0,3,3,0,0,9,2,7,3,6,4,5,3,0,3,6,2,1,2,5,1,6,5,6,1,2,5,2,1,8,3,8,2,7,4,7,1,4,3,2,4,1,5,0,0,3,2,3,2,1,4,1,5,0,5,6,1,4,5,4,0,7,0,9,3,8,4,7,2,5,4,5,0,7,2,5]},
  {x:244,y:833,s:[2,1,2,5,1,6,5,6,2,9,3,8,4,7,5,6,0,5,4,5,0,7,4,7,4,1,4,5,1,2,3,2,1,8,3,8,0,5,1,4,2,3,4,1,0,9,1,8,2,7,3,6,4,5,5,4,1,2,3,0,2,1,4,1,1,6,1,8,3,0,3,4,0,7,1,6,2,5,3,4,1,4,5,4,0,7,0,9,2,3,4,3,0,9,2,9]},
  {x:412,y:834,s:[3,0,5,0,1,2,1,8,6,7,6,9,0,3,0,9,0,3,1,2,2,1,3,0,0,9,2,7,3,6,4,5,2,3,2,7,1,6,3,6,0,5,4,5,0,7,4,7,0,5,2,3,4,1,5,0,1,8,3,8,3,2,5,2,0,3,4,3,2,1,4,1,5,0,5,4,0,7,2,5,3,4,4,3,3,0,3,4,1,4,5,4,3,8,4,7]},
  {x:532,y:833,s:[1,5,4,2,2,2,3,1,1,7,5,7,3,1,3,5,1,9,2,8,3,7,4,6,5,5,6,4,2,2,2,8,1,7,4,4,5,3,6,2,4,2,4,6,2,4,6,4,1,5,5,5,2,2,6,2,1,7,1,9,0,0,0,4,2,6,6,6,5,7,6,6,3,3,5,3]},
  {x:723,y:833,s:[1,2,1,8,0,3,0,9,0,3,1,2,2,1,3,0,2,1,2,5,1,6,3,6,4,1,4,5,1,2,3,2,0,5,3,2,2,1,4,1,0,3,4,3,0,7,4,3,3,0,3,4,1,4,3,4,2,5,4,5,0,9,1,8,3,6,4,5]},
  {x:890,y:833,s:[3,0,5,0,1,2,1,8,6,3,6,5,6,7,6,9,0,3,0,9,2,1,2,7,0,5,4,5,0,7,2,7,1,2,5,2,1,4,4,1,0,9,1,8,4,5,5,4,1,2,2,1,0,3,4,3,2,1,4,1,5,0,5,4,0,7,3,4,4,3,5,2,3,0,3,4,3,4,5,4]},
  {x:1010,y:835,s:[1,5,2,4,3,3,4,2,5,1,6,0,3,1,3,5,2,2,2,8,4,0,4,6,1,5,3,5,1,3,2,2,3,1,4,0,2,2,4,2,1,7,3,7,1,3,1,5,1,7,1,9,3,1,5,1,1,3,3,3,0,0,0,4,2,6,4,6,1,9,2,8,3,7,4,6,2,4,4,4,4,0,6,0,1,7,2,6,3,5,4,4]},
  {x:1200,y:858,s:[1,1,1,3,1,5,1,7,0,2,0,8,0,6,2,4,3,3,4,2,0,8,1,7,2,0,2,6,0,6,2,6,1,5,3,5,1,3,2,2,0,2,4,2,1,1,3,1,1,3,3,3,4,0,4,4,0,4,4,4,1,1,2,0,2,0,4,0,3,1,4,0,3,5,4,4]},
];
function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  noLoop();
}

function draw() {
  noiseSeed(SEED);
  randomSeed(SEED);

  background(PAPER[0], PAPER[1], PAPER[2]);

  drawFigures();
  surfaceLayer();          // single unifying pass: vignette + paper grain
}

// --- ink-loose straight line: subtle wobble + a hair of overshoot ----------
function iline(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  // tiny end overshoot so corners cross like ruled ink
  const o1 = random(-0.6, 1.4), o2 = random(-0.6, 1.4);
  const ax = x1 - ux * o1, ay = y1 - uy * o1;
  const bx = x2 + ux * o2, by = y2 + uy * o2;
  const amp = 0.85;
  const n = Math.max(2, Math.round(len / 26));
  beginShape();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
    const env = Math.sin(Math.PI * t);
    const off = (noise(px * 0.018, py * 0.018, len * 0.01) - 0.5) * 2 * amp * env;
    const vx = px + nx * off, vy = py + ny * off;
    if (i === 0) curveVertex(vx, vy);
    curveVertex(vx, vy);
    if (i === n) curveVertex(vx, vy);
  }
  endShape();
}

function drawFigures() {
  const u = U * SCALE;
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  for (const f of FIGS) {
    const ox = toX(f.x), oy = toY(f.y);
    // ink colour drifts a hair per figure so the sheet isn't mechanically flat
    const d = (noise(f.x * 0.01, f.y * 0.01) - 0.5) * 10;
    stroke(INK[0] + d, INK[1] + d, INK[2] + d);
    strokeWeight(2.75 * SCALE);
    const s = f.s;
    for (let i = 0; i < s.length; i += 4) {
      const x1 = ox + s[i] * u,   y1 = oy + s[i + 1] * u;
      const x2 = ox + s[i + 2] * u, y2 = oy + s[i + 3] * u;
      iline(x1, y1, x2, y2);
    }
  }
}

// --- one unifying surface pass over the whole sheet ------------------------
// warm vignette (lighter top, a shade deeper lower-left) + fine paper grain.
function surfaceLayer() {
  loadPixels();
  const cx = W * 0.30, cy = H * 0.62;           // shading "low" toward lower-left
  const maxd = Math.hypot(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = 4 * (y * W + x);
      // vertical lift (top lighter) + soft corner fall-off toward lower-left
      const lift = (1 - y / H) * 6.0;
      const d = Math.hypot(x - cx, y - cy) / maxd;
      const vig = -d * d * 26.0;
      // fine grain
      const g = (noise(x * 0.45, y * 0.45) - 0.5) * 9.0
              + (noise(x * 0.06, y * 0.06) - 0.5) * 7.0;
      const t = lift + vig + g;
      pixels[idx]     += t;
      pixels[idx + 1] += t;
      pixels[idx + 2] += t * 0.92;               // keep the warmth
    }
  }
  updatePixels();
}
