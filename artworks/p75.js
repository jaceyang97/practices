/**
 * Practice 75 — Marcello Morandini, "34" (1968, acrylic on wood)
 *
 * An 8×8 grid of square cells on a white panel. Each cell is divided into a
 * 2×2 pane of small square tiles, and on each of the four tiles a black bar is
 * painted that fills it from one edge — LEFT on the top-left tile, TOP on the
 * top-right, RIGHT on the bottom-right, BOTTOM on the bottom-left. The four
 * bars therefore pinwheel (90° rotational symmetry) and the white that's left
 * over reads as a rotating cross at the cell's centre.
 *
 * The whole picture is a progression. A single fill fraction f (the share of
 * each tile painted black) grows from 0 in the top-left cell to 1 in the
 * bottom-right. The growth is ANISOTROPIC: a step DOWN adds far more black than
 * a step RIGHT — measured off the original the row weighs ~4.6× the column —
 * so the field darkens as a slanted ramp rather than a clean diagonal. The top
 * row is bare white panes; the bottom row runs from a fat white pinwheel on the
 * left to a SOLID black square at the bottom-right corner, where f reaches 1
 * and the four bars merge with no seam left. The 64 fill fractions are taken
 * straight from the panel (FILL below) so the small irregularities of the real
 * progression survive.
 *
 * Each cell is four quadrant tiles that meet at the centre; a bar grows from
 * each tile's OUTER edge toward the centre, so what's left over is a rotating
 * white pinwheel that closes as f → 1. A wide white channel separates
 * neighbouring cells; inside a cell the four tiles read as a 2×2 pane drawn by
 * a translucent groove-shadow that's crisp on the white cells and fades out as
 * the tiles go black (just as the joints photograph light vs. dark). Tiles stay
 * FLAT — no bevels, no per-tile shading. The only physical layer is one
 * unifying pass over the whole image: a soft vignette and a faint paint/board
 * grain, to sit the flat geometry on a real, evenly-lit panel. Static.
 *
 * Code by Jace Yang
 */

const W = 1000;
const H = 1000;

// --- panel layout ----------------------------------------------------------
const N = 8;                 // 8×8 cells
const MARGIN = 64;           // white border around the grid
const GRID = W - 2 * MARGIN; // grid span
const CELL = GRID / N;       // cell pitch
// A WIDE white channel separates neighbouring cells (~7% of a cell).
const GAP_OUT = 10.5;

// --- measured tonal palette ------------------------------------------------
const MOUNT = [198, 203, 208]; // soft neutral surround / mount
const GROUND = [236, 240, 243]; // white ground: the panel + every gap
const WHITE = [236, 240, 243]; // white acrylic tile
const BLACK = [ 38,  41,  46]; // black acrylic bar
const GROOVE = [ 40,  43,  50]; // shadow in the tile grooves (drawn translucent)

// Fill fraction per cell — share of each tile painted black, measured straight
// off the panel (by the width of the black bar in each quadrant, which is what
// sets the thickness of the leftover white pinwheel). 0 = white pane, 1 = solid
// black. The vertical progression is STEEP: the row darkens ~7× faster than the
// column, so by the bottom row even the left edge is nearly black (f≈0.87) and
// the bottom-right reaches 1, its four bars merging seamlessly.
const FILL = [
  [0.00, 0.00, 0.00, 0.00, 0.00, 0.01, 0.02, 0.03],
  [0.03, 0.04, 0.04, 0.05, 0.05, 0.06, 0.07, 0.08],
  [0.12, 0.12, 0.12, 0.13, 0.15, 0.16, 0.18, 0.19],
  [0.26, 0.26, 0.27, 0.28, 0.30, 0.33, 0.36, 0.40],
  [0.43, 0.44, 0.45, 0.47, 0.49, 0.53, 0.56, 0.58],
  [0.60, 0.62, 0.64, 0.66, 0.68, 0.70, 0.72, 0.74],
  [0.73, 0.77, 0.78, 0.79, 0.81, 0.83, 0.85, 0.87],
  [0.87, 0.89, 0.91, 0.92, 0.94, 0.96, 0.98, 1.00],
];

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  noLoop();
}

function draw() {
  noStroke();

  // 1 — mount / surround
  background(MOUNT[0], MOUNT[1], MOUNT[2]);

  // 2 — the white panel ground. Every gap we leave (the wide inter-cell
  //     channels and the hairline tile seams) reads as this white.
  fill(GROUND[0], GROUND[1], GROUND[2]);
  rect(MARGIN - GAP_OUT, MARGIN - GAP_OUT,
       GRID + 2 * GAP_OUT, GRID + 2 * GAP_OUT);

  const go = GAP_OUT / 2; // half the wide inter-cell gap

  // 3 — tiles + pinwheel bars
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const x0 = MARGIN + c * CELL;
      const y0 = MARGIN + r * CELL;
      const a0 = x0 + go, b0 = y0 + go;          // pane box (inset by the gap)
      const a1 = x0 + CELL - go, b1 = y0 + CELL - go;
      const mx = x0 + CELL / 2, my = y0 + CELL / 2; // pane centre
      const f = FILL[r][c];                      // fraction of a tile painted black

      // Four quadrant tiles that MEET at the centre — no inner gap — so their
      // bars merge into solid black when f = 1. Each bar grows from the tile's
      // outer edge toward the centre; 'L','T','R','B' pinwheel clockwise from
      // the top-left tile, leaving a rotating white pinwheel that closes as f→1.
      const tiles = [
        [a0, b0, mx, my, 'L'], // top-left  → bar from left
        [mx, b0, a1, my, 'T'], // top-right → bar from top
        [a0, my, mx, b1, 'B'], // bottom-left → bar from bottom
        [mx, my, a1, b1, 'R'], // bottom-right → bar from right
      ];

      noStroke();
      if (f >= 0.995) {
        // fully merged: one seamless black square (the bottom-right corner)
        fill(BLACK[0], BLACK[1], BLACK[2]);
        rect(a0, b0, a1 - a0, b1 - b0);
      } else {
        for (const [tx0, ty0, tx1, ty1, side] of tiles) {
          const tw = tx1 - tx0, th = ty1 - ty0;
          fill(WHITE[0], WHITE[1], WHITE[2]);
          rect(tx0, ty0, tw, th); // white tile
          if (f > 0) {
            fill(BLACK[0], BLACK[1], BLACK[2]);
            if (side === 'L') rect(tx0, ty0, tw * f, th);
            else if (side === 'T') rect(tx0, ty0, tw, th * f);
            else if (side === 'R') rect(tx1 - tw * f, ty0, tw * f, th);
            else if (side === 'B') rect(tx0, ty1 - th * f, tw, th * f);
          }
        }
      }

      // the cell's 2×2 grid as a translucent groove-shadow. Its strength fades
      // with f, so it draws a crisp pane on the white cells but disappears as
      // the tiles go black — exactly how the joints photograph light vs. dark.
      const ga = 200 * (1 - f);
      if (ga > 4) {
        stroke(GROOVE[0], GROOVE[1], GROOVE[2], ga);
        strokeWeight(1.5);
        noFill();
        rect(a0, b0, a1 - a0, b1 - b0); // pane border
        line(mx, b0, mx, b1);           // vertical cross
        line(a0, my, a1, my);           // horizontal cross
      }
    }
  }

  // 4 — unifying surface pass over the whole picture (flat geometry, real panel)
  surface();
}

// Soft even-light vignette + faint board grain, applied once over everything.
function surface() {
  randomSeed(34);
  noiseSeed(34);
  loadPixels();
  const cx = W * 0.5;
  const cy = H * 0.46;            // light centred a touch high, as photographed
  const maxd = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = 4 * (y * W + x);
      // gentle radial vignette: subtract a little toward the corners
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy) / maxd;
      const vig = -10 * d * d;
      // fine grain — board/paint tooth, low amplitude, slightly coarser blotch
      const g = (random() - 0.5) * 7 +
                (noise(x * 0.03, y * 0.03) - 0.5) * 9;
      const dv = vig + g;
      pixels[i]     += dv;
      pixels[i + 1] += dv;
      pixels[i + 2] += dv;
    }
  }
  updatePixels();
}
