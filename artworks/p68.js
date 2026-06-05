/**
 * Practice 68 — Milan Dobeš, "Central Gravity" (1965, serigraph on paper)
 *
 * A faithful recreation of Dobeš's op-art print: a 10×10 grid of circles on a
 * periwinkle ground inside a thin cream border. Each circle is split by a
 * DIAMETER into a black half and a cream half. The split is RADIAL — the
 * dividing diameter of every circle points at one common GRAVITY POINT — and
 * the black half always sits a quarter-turn CLOCKWISE of that radial line.
 * That single rule turns the whole field into one slow clockwise pinwheel: the
 * "gravity" the title names.
 *
 * The gravity point is NOT the center of the sheet. It is the center of cell
 * (col 5, row 4) — half a cell up and to the right of the geometric center —
 * so the swirl is subtly off-axis, pulling the eye up-and-right. (Getting this
 * one point wrong makes the spokes drift out of alignment and the field read as
 * disorganized; about THIS point the level/vertical splits lock onto whole
 * grid rows and columns, exactly as in the print.)
 *
 * At the singularity the figure and ground INVERT. A 3×3 knot of nine circles
 * around the gravity cell is set on a BLACK ground (a filled black box), and
 * the eight outer knot circles take the periwinkle BLUE as their "dark" half
 * (cream + blue, no black) so the knot reads as a light cluster on dark — the
 * opposite of the black-on-blue field around it. The lone gravity circle keeps
 * a black half (cream top, black bottom). The gravity cell itself stays blue,
 * making a small blue square around that circle; a thin black "box ring" frames
 * the whole 3×3 knot.
 *
 * Measured from photographs of the original (high-res + a clean scan), not
 * guessed: grid origin/pitch from the blue corner-gaps; the gravity point by
 * least-squares fit of all 91 outer split lines (lands on cell (5,4), angular
 * residual ~0.4°); the knot, box ring and blue inner square cell-by-cell;
 * palette = median fills.
 *
 * The tiles stay FLAT — no bevels, no per-circle shading. Physical feel is ONE
 * unifying surface pass at the end: a faint paper tooth, soft tonal drift, and
 * a little ink mottle.  Click to re-roll the paper surface (composition fixed).
 *
 * Code by Jace Yang
 */

const W = 1000;
const H = 1000; // the original sheet is square

// Measured median fills.
const COL = {
  cream: [248, 232, 221],
  blue:  [132, 148, 181],
  black: [12, 10, 18],
};

// Layout (fractional, measured from the original).
const BORDER = 0.013 * W;        // warm cream margin (matches the print's ~1.3%)
const F0     = BORDER;           // field origin
const FW     = W - 2 * BORDER;   // field extent
const CELL   = FW / 10;          // 10×10 grid
const R      = 0.49 * CELL;      // circle radius (circles nearly touch)

// The gravity point: center of cell (col 5, row 4) — the whole pinwheel, outer
// field AND knot, radiates from here (NOT the geometric sheet center).
const GCOL = 5, GROW = 4;
const GX = F0 + (GCOL + 0.5) * CELL;
const GY = F0 + (GROW + 0.5) * CELL;

// The 3×3 knot of cells around the gravity cell (cols 4–6, rows 3–5).
const CORE = { i0: 4, i1: 6, j0: 3, j1: 5 };
const inCore = (i, j) => i >= CORE.i0 && i <= CORE.i1 && j >= CORE.j0 && j <= CORE.j1;

// Surface parameters (kept subtle — a clean screenprint on smooth paper).
const P = {
  driftAmp: 0.055, // large-scale tonal drift (photographed-print lighting)
  mottleAmp: 0.035, // mid-scale ink/paper unevenness
  grainAmp: 0.040, // fine paper tooth
};

let textureSeed = 7;

function setup() {
  createCanvas(W, H);
  pixelDensity(1); // keep pixels[] 1:1 with W*H for the surface pass
  angleMode(RADIANS);
  noLoop();
}

function mousePressed() {
  // Re-roll only the paper surface; the composition is fixed.
  textureSeed = (textureSeed * 1103515245 + 12345) & 0x7fffffff;
  redraw();
}

function draw() {
  randomSeed(textureSeed);
  noiseSeed(textureSeed);

  paintGround();
  paintField();
  paintKnotGround(); // the inverted black box (with a blue gravity cell)
  paintCircles();
  paintBoxRing();
  applyPaperSurface();
}

// --- Cream sheet + periwinkle field ----------------------------------------
function paintGround() {
  background(COL.cream[0], COL.cream[1], COL.cream[2]);
}

function paintField() {
  noStroke();
  fill(COL.blue[0], COL.blue[1], COL.blue[2]);
  rect(F0, F0, FW, FW);
}

// --- Figure/ground inversion at the knot -----------------------------------
// The 3×3 knot sits on a BLACK box; the gravity cell itself keeps the ground
// blue, so a blue square rings the central circle. Drawn behind the circles.
function paintKnotGround() {
  noStroke();
  fill(COL.black[0], COL.black[1], COL.black[2]);
  rect(F0 + CORE.i0 * CELL, F0 + CORE.j0 * CELL, 3 * CELL, 3 * CELL);
  fill(COL.blue[0], COL.blue[1], COL.blue[2]);
  rect(F0 + GCOL * CELL, F0 + GROW * CELL, CELL, CELL);
}

// --- The 100 circles: one clockwise pinwheel about the gravity point --------
function paintCircles() {
  noStroke();
  for (let j = 0; j < 10; j++) {
    for (let i = 0; i < 10; i++) {
      const cx = F0 + (i + 0.5) * CELL;
      const cy = F0 + (j + 0.5) * CELL;

      // cream disk first; the coloured half is a 180° pie on top
      fill(COL.cream[0], COL.cream[1], COL.cream[2]);
      circle(cx, cy, 2 * R);

      let darkRGB, start, stop;
      if (i === GCOL && j === GROW) {
        // the singular gravity circle: black half on the bottom (horizontal split)
        darkRGB = COL.black;
        start = 0; stop = PI;
      } else {
        // radial split toward the gravity point; black half a quarter-turn CW.
        // arc(phi, phi+PI) is the half-disk centred on phi+90° (the dark side).
        const phi = Math.atan2(cy - GY, cx - GX);
        start = phi; stop = phi + PI;
        darkRGB = inCore(i, j) ? COL.blue : COL.black; // knot circles dissolve to blue
      }
      fill(darkRGB[0], darkRGB[1], darkRGB[2]);
      arc(cx, cy, 2 * R, 2 * R, start, stop, PIE);
    }
  }
}

// --- The thin black "box ring" around the 3×3 knot --------------------------
function paintBoxRing() {
  noFill();
  stroke(COL.black[0], COL.black[1], COL.black[2]);
  strokeWeight(0.0052 * W); // measured ~0.005·W
  rect(F0 + CORE.i0 * CELL, F0 + CORE.j0 * CELL, 3 * CELL, 3 * CELL);
}

// --- One unifying paper surface over the whole picture ----------------------
function applyPaperSurface() {
  const drift  = valueNoiseField(W, H, 0.55 * H, 1); // large tonal drift
  const mottle = valueNoiseField(W, H, 0.12 * H, 3); // ink/paper unevenness

  loadPixels();
  for (let y = 0; y < H; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x;
      let lum = 1;
      lum *= 1 + P.driftAmp * drift[i];
      lum *= 1 + P.mottleAmp * mottle[i];
      lum *= 1 + P.grainAmp * (random() - 0.5) * 2; // fine tooth (seeded)

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
// normalized to ~zero-mean unit-ish amplitude. Bilinearly upsampled.
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
  for (let k = 0; k < out.length; k++) out[k] /= tot;
  return out;
}
