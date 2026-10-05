/**
 * Title: Tribute to Theo van Doesburg: Composition
 * Practice 78 — Theo van Doesburg, "Composition" (c. 1920s), screenprint on wove paper
 *   (a later serigraph edition — pencil-signed, numbered — of a van Doesburg
 *    Elementarist composition of nested rotated squares.)
 *
 * A square sheet. On a warm ivory ground two flat grey shapes lock into the
 * upper-left and FOUR solid-black squares — every one turned 45° to a perfect
 * diamond, all identically oriented — cascade down the main diagonal, each one
 * DOUBLE the size of the last. It is a single interlocking system: the black
 * diamonds' corners land exactly on the grey's edges.
 *
 * The grey (measured off the reference, fractional canvas coords) is exactly two
 * parts, themselves a doubling cascade:
 *   • CORNER  — a small square in the top-left corner        x[.026,.138] y[.038,.150]
 *   • REVERSE-L — a big square (2× the corner) at upper-right x[.251,.479] y[.036,.264]
 *                 + a bottom bar (4×2) sweeping back left     x[.023,.479] y[.260,.484]
 *
 * The four black diamonds (centre on the diagonal, radius = centre-to-corner,
 * as a fraction of width; each ~2× the previous):
 *   D1 c(.101,.112) r.0356 · D2 c(.177,.185) r.0729 · D3 c(.327,.334) r.1492 · D4 c(.632,.633) r.3023
 * and the tangencies that make the system click:
 *   D1's lower/right corners kiss the CORNER square's lower/right edges;
 *   D2's right corner meets the big square's left edge, its lower corner the bar's top;
 *   D3's right and lower corners land on the reverse-L's right and bottom edges;
 *   D4 rides free on the open paper of the lower-right, twice D3.
 *
 * Measured palette: paper ≈ (218,216,204) warm ivory; grey ≈ (190,192,191) neutral;
 * ink ≈ (32,32,33) dense screen black. The sheet's pencil marks — an edition
 * fraction at lower-left, a cursive signature at lower-right — are left OUT so the
 * page reads as pure printed geometry, like the other sheets in this gallery.
 *
 * Shapes stay FLAT — no bevels, no per-shape shading. The only physical layer is
 * one unifying pass over the whole sheet: a very gentle warm vignette, a faint
 * tonal drift, a fine wove grain, and a whisper of ink cloud in the blacks (the
 * screen-density mottle you can just see in the mid diamond). Fully static.
 *
 * Code by Jace Yang
 */

const W = 1000;
const H = 1000;                 // square canvas — the reference sheet is square

// --- measured palette ------------------------------------------------------
const PAPER = [220, 218, 205];  // warm ivory wove ground
const GREY  = [190, 192, 191];  // flat neutral grey
const INK   = [ 32,  32,  33];  // dense screen black

const SEED = 77;                // fixed → grain + drift are stable

// --- grey shapes: a corner square + a reverse-L (fractional canvas coords) --
const CORNER = { x0: 0.026, y0: 0.038, x1: 0.138, y1: 0.150 }; // top-left square (1u)
const L_SQ   = { x0: 0.251, y0: 0.036, x1: 0.479, y1: 0.264 }; // reverse-L: big square (2u)
const L_BAR  = { x0: 0.023, y0: 0.260, x1: 0.479, y1: 0.484 }; // reverse-L: bottom bar (4×2u)

// --- four black diamonds, all 45°, doubling down the diagonal ---------------
// c = centre (fraction of W,H); r = centre-to-corner radius (fraction of W)
const BLACKS = [
  { cx: 0.101, cy: 0.112, r: 0.0356 }, // D1 — on the corner square
  { cx: 0.177, cy: 0.185, r: 0.0729 }, // D2 — in the notch, tips on 3 grey edges
  { cx: 0.327, cy: 0.334, r: 0.1492 }, // D3 — right/bottom tips on the L's edges
  { cx: 0.632, cy: 0.633, r: 0.3023 }, // D4 — free on the open paper
];

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  noLoop();
}

function draw() {
  randomSeed(SEED);
  noiseSeed(SEED);
  noStroke();

  // 1 — ivory ground
  background(PAPER[0], PAPER[1], PAPER[2]);

  // 2 — the two flat grey shapes (corner square + reverse-L)
  fill(GREY[0], GREY[1], GREY[2]);
  rectFrac(CORNER);
  rectFrac(L_SQ);
  rectFrac(L_BAR);

  // 3 — the four solid black diamonds, small → large
  fill(INK[0], INK[1], INK[2]);
  for (const b of BLACKS) diamond(b.cx * W, b.cy * H, b.r * W);

  // 4 — single unifying surface pass (flat inks on a real sheet)
  surface();
}

// axis-aligned rectangle given fractional corners
function rectFrac(r) {
  rect(r.x0 * W, r.y0 * H, (r.x1 - r.x0) * W, (r.y1 - r.y0) * H);
}

// a perfect diamond (square turned 45°) of centre-to-corner radius r
function diamond(cx, cy, r) {
  beginShape();
  vertex(cx, cy - r); // top
  vertex(cx + r, cy); // right
  vertex(cx, cy + r); // bottom
  vertex(cx - r, cy); // left
  endShape(CLOSE);
}

// --- one unifying surface pass over the whole sheet ------------------------
// very gentle warm vignette + broad tonal drift + fine wove grain, with a
// whisper of ink cloud where it's dark (screen-density mottle).
function surface() {
  loadPixels();
  const cx = W * 0.44, cy = H * 0.44;          // light centred a touch high-left
  const maxd = Math.hypot(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = 4 * (y * W + x);
      const lum = pixels[i];

      // soft even vignette (the reference is fairly flatly lit)
      const dv = Math.hypot(x - cx, y - cy) / maxd;
      const vig = -10 * dv * dv;
      // broad tonal drift so the ground isn't mechanically even
      const drift = (noise(x * 0.0015, y * 0.0015) - 0.5) * 8;
      // fine wove grain
      const grain = (random() - 0.5) * 4.5
                  + (noise(x * 0.09, y * 0.09) - 0.5) * 5.5;
      // a whisper of ink cloud only where dark (screen mottle)
      const darkK = Math.max(0, 1 - lum / 110);
      const cloud = (noise(x * 0.010 + 40, y * 0.010 + 40) - 0.5) * 7 * darkK;

      const t = vig + drift + grain + cloud;
      pixels[i]     += t;
      pixels[i + 1] += t;
      pixels[i + 2] += t * 0.9; // keep the paper's warmth
    }
  }
  updatePixels();
}
