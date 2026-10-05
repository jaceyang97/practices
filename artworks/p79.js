/**
 * Title: Tribute to Vera Molnár: Ascension
 * Practice 79 — Vera Molnár, "Ascension" (1984, plotter drawing on paper)
 *
 * A band of red squares — 29 across, 12 down — laid on a lattice, sheared so the
 * whole block leans UPWARD to the right (the "ascension"), then flexed by a slow
 * flowing field so the rows behave like water. Molnár built these on a plotter
 * from a short program: a strict grid given a measured dose of désordre.
 *
 * The désordre here is a WAVE, not random scatter. The rows ride a water surface
 * — a superposition of three travelling sine waves — so each row is a wavy line
 * rather than a ruled one. Neighbouring rows sit a fixed phase apart, so as you
 * move across the sheet they drift in and out of step: where they pull apart the
 * paper opens into a flowing "river", where they close the translucent squares
 * OVERLAP and, drawn in MULTIPLY, stack into dark oxblood. The wave amplitude is
 * centre-weighted, so the surface is glassy and tight along the left & right edges
 * and churns most through the middle — that is where the rivers bloom widest and
 * the dark core gathers, thinning to calm at the sides. A gentle horizontal flow
 * plus a hair of per-square wobble and rotation keeps the columns off any true
 * vertical, so the block reads as a hand-fed band, not a ruled parallelogram.
 *
 * Structure (on the 1200×690 sheet):
 *   • lattice: 29 columns × 12 rows, ~39 px column pitch, 35 px row pitch, edge ~29 px.
 *   • shear: each square lifts by 0.11·x — top-right highest, bottom-left lowest.
 *   • waves: 3 travelling sines summed (amplitudes 12/7/8 px; vertical wavenumbers
 *     ~1.05/0.6/1.55 rad·row⁻¹ → ~2 river/overlap cycles down the 12 rows; 0.6–2.4
 *     horizontal cycles across the sheet), scaled by a centre-weighted envelope.
 *     A weaker horizontal flow (±6 px) tilts the columns off vertical.
 *
 * Ink is subtractive: squares are MULTIPLY over warm paper, so a lone square is
 * coral red (~197,71,58) and every overlap multiplies down toward oxblood — the
 * darkening is the real geometry of stacked ink, never per-tile shading. Squares
 * stay FLAT. The one unifying surface pass is a faint warm vignette + fine paper
 * grain. Signed "vera molnar 84" on the original; left off here so the sheet reads
 * as pure drawing. Static — no animation.
 *
 * Code by Jace Yang
 */

const ORIG_W = 1200, ORIG_H = 690;
const SCALE = 1.0;
const W = Math.round(ORIG_W * SCALE);
const H = Math.round(ORIG_H * SCALE);

const PAPER = [238, 235, 227];
// INK is a MULTIPLY colour: a single square = PAPER * (INK/255) ≈ (197,71,58);
// overlapping squares multiply again and darken toward oxblood.
const INK = [211, 74, 64];

// --- lattice (original px) --------------------------------------------------
const C = 29, R = 12;          // columns, rows  (as marked on the reference)
const X0 = 48, PX = 39;        // left origin, horizontal pitch
const Y0 = 172;                // top origin (row 0 baseline)
const SQ = 29;                 // square edge
const SLOPE = 0.11;            // vertical shear — rows ascend to the right

// --- wave surface (the désordre) -------------------------------------------
// The rows ride a water surface: a superposition of travelling sine waves. Each
// row is a wavy line, and where two neighbouring rows' waves DIVERGE the paper
// opens into a pale river; where they CONVERGE the translucent squares OVERLAP
// and print dark. The amplitude is centre-weighted, so the surface is glassy and
// tight at the left/right edges and churns most through the middle — that is
// where the rivers bloom and the dark core gathers.
const FIELD_W = (C - 1) * PX;
const PY = 35;                 // base row spacing; the waves open/close it
const TAU = Math.PI * 2;       // p5's TWO_PI isn't defined yet at load time
// travelling waves: A px amplitude, KX rad/px (horizontal), KY rad/row (vertical
// wavenumber → how fast neighbouring rows fall out of phase), PH phase.
const WAVES = [
  { A: 12, KX: TAU * 1.15 / FIELD_W, KY: 1.05, PH: -1.40 },
  { A: 7,  KX: TAU * 2.40 / FIELD_W, KY: 0.60, PH:  2.05 },
  { A: 8,  KX: TAU * 0.60 / FIELD_W, KY: 1.55, PH:  4.10 },
];
const AMP_H = 6;               // gentle horizontal flow (columns off-vertical)

const SEED = 4;                // fixed → waves + wobble + grain are stable

const sx = (x) => x * SCALE;
const sy = (y) => y * SCALE;

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  rectMode(CENTER);
  noLoop();
}

function draw() {
  randomSeed(SEED);
  noiseSeed(SEED);

  background(PAPER[0], PAPER[1], PAPER[2]);

  drawSquares();      // translucent ink in MULTIPLY → overlaps darken
  surfaceLayer();     // single unifying pass: warm vignette + paper grain
}

// wave amplitude envelope: centre-weighted across the width (glassy edges,
// churning middle) and a touch calmer at the very top/bottom rows so the band
// keeps a readable edge.
function waveEnv(x, j) {
  const u = (x - X0) / FIELD_W;
  const h = Math.exp(-Math.pow((u - 0.48) / 0.36, 2));
  const t = j / (R - 1);
  const v = 0.58 + 0.42 * Math.sin(Math.PI * t);
  return (0.12 + 0.88 * h) * v;
}

// vertical displacement of row j at x — the summed travelling-wave surface.
// Neighbouring rows sit KY radians apart in phase, so along x they drift in and
// out of step: apart → river, together → overlap.
function waveY(x, j) {
  const xr = x - X0;
  let d = 0;
  for (const w of WAVES) d += w.A * Math.sin(w.KX * xr + w.KY * j + w.PH);
  return d * waveEnv(x, j);
}

// gentle horizontal flow — pulls the columns off any true vertical
function flowX(x, y) {
  const m = noise(x * 0.0015 + 211.0, y * 0.0065 + 211.0);
  return (m - 0.5) * 2 * AMP_H;
}

function drawSquares() {
  blendMode(MULTIPLY);
  noStroke();
  for (let j = 0; j < R; j++) {
    for (let i = 0; i < C; i++) {
      const gx = i * PX;
      const xNom = X0 + gx;
      const yNom = Y0 + j * PY - SLOPE * gx + waveY(xNom, j);   // wave surface + shear

      const cx = xNom + flowX(xNom, yNom) + random(-1.4, 1.4);
      const cy = yNom + random(-1.0, 1.0);

      // subtle ink-density variation so the field isn't mechanically flat
      const d = random(-6, 7);
      fill(INK[0] + d, INK[1] + d, INK[2] + d);

      // a hair of rotation + size wobble → hand-fed, not vector-perfect
      const rot = radians(random(-2.2, 2.2));
      const s = SQ * random(0.94, 1.05);
      push();
      translate(sx(cx), sy(cy));
      rotate(rot);
      rect(0, 0, s * SCALE, s * SCALE);
      pop();
    }
  }
  blendMode(BLEND);
}

// --- one unifying surface pass over the whole sheet ------------------------
// faint warm vignette (lighter top, a shade deeper lower-left) + paper grain.
function surfaceLayer() {
  loadPixels();
  const cx = W * 0.34, cy = H * 0.56;
  const maxd = Math.hypot(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = 4 * (y * W + x);
      const lift = (1 - y / H) * 4.0;               // top a touch lighter
      const dd = Math.hypot(x - cx, y - cy) / maxd;
      const vig = -dd * dd * 16.0;                  // gentle corner fall-off
      const g = (noise(x * 0.45, y * 0.45) - 0.5) * 6.0
              + (noise(x * 0.06, y * 0.06) - 0.5) * 5.0;
      const t = lift + vig + g;
      pixels[idx]     += t;
      pixels[idx + 1] += t;
      pixels[idx + 2] += t * 0.92;                  // keep the warmth
    }
  }
  updatePixels();
}
