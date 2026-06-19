/**
 * Practice 74 — Germaine Derbecq, "Multiple Painting (Series 14 No. 1)"
 *                                  (1969, acrylic on canvas)
 *
 * A square canvas read as a 2×2 checkerboard of quadrants, the backgrounds
 * alternating white / red / red / white. On each quadrant sits ONE large
 * square, tilted ~16° and painted in the opposite colour, so the squares run
 * red · white / white · red — a colour-inverted 4-up. Each square is INSCRIBED
 * in its quadrant: it touches all four sides of the quadrant box, so its two
 * OUTER corners poke out as tiny tips on the canvas border while its two INNER
 * corners land exactly ON the centre cross (x=0.5 or y=0.5). Adjacent inner
 * corners therefore meet ON the line — the top pair (TL red / TR white) meet at
 * (0.5, 0.375), the left pair (TL red / BL white) at (0.12, 0.5) — while the
 * remaining inner corners fall at different points along the cross, so the
 * middle spirals into a red/white PINWHEEL rather than a clean four-way cross.
 *
 * Geometry measured from the source (872² scan): the background switches colour
 * at the centre (x≈0.50, y≈0.50). Each square is a true ~0.40·canvas square; an
 * inner corner is the point-reflection of the matching border tip through the
 * quadrant centre, so it sits on the cross by construction. Column/row scans
 * across the centre pin every corner to within a couple of pixels. Coordinates
 * below are fractional canvas positions; border tips:
 *
 *   TL square (red)   tips: top(0.381,0)   left(0,0.126)
 *   TR square (white) tips: top(0.615,0)   right(1,0.120)
 *   BL square (white) tips: bottom(0.382,1) left(0,0.885)
 *   BR square (red)   tips: bottom(0.886,1) right(1,0.619)
 *
 * Palette = median fills (acrylic, hand-mixed, so red and white each drift a
 * little between square and ground). The whole picture is unified by ONE
 * surface layer — a fine canvas weave (period ≈18px), a low-frequency tonal
 * drift that brushes the reds lighter/darker, and a touch of grain — stronger
 * where the thin red lets the raw weave show through, faint on the opaque
 * white. Tiles stay FLAT: no bevels, no per-edge highlight. Edges carry only a
 * hair of hand wobble because the originals are brush-painted, not ruled.
 * Static (noLoop), no interaction.
 *
 * Code by Jace Yang
 */

const W = 1000;
const H = 1000;

// --- measured palette (median fills) ---------------------------------------
const SQ_RED   = [154, 21, 16];   // tilted red squares (deep brick)
const BG_RED   = [170, 28, 14];   // red quadrant grounds (a touch warmer/brighter)
const SQ_WHITE = [234, 233, 233]; // tilted white squares
const BG_WHITE = [237, 235, 230]; // white quadrant grounds (warm)

// --- the four tilted squares, fractional canvas corners --------------------
// each listed clockwise; inner corners sit exactly on the centre cross, and the
// two shared meeting points — TOP (0.5,0.375) and LEFT (0.12,0.5) — are reused
// verbatim so the squares touch with no gap and no overshoot.
const TOP_MEET  = [0.50, 0.375];   // TL.right  == TR.left
const LEFT_MEET = [0.12, 0.50];    // TL.bottom == BL.top
const SQUARES = [
  // TL red:   top tip · TOP_MEET · LEFT_MEET · left tip
  { pts: [[0.381, 0.000], TOP_MEET, LEFT_MEET, [0.000, 0.126]], col: SQ_RED },
  // TR white: top tip · right tip · bottom corner · TOP_MEET
  { pts: [[0.615, 0.000], [1.000, 0.120], [0.868, 0.500], TOP_MEET], col: SQ_WHITE },
  // BL white: LEFT_MEET · right corner · bottom tip · left tip
  { pts: [LEFT_MEET, [0.500, 0.625], [0.382, 1.000], [0.000, 0.885]], col: SQ_WHITE },
  // BR red:   top corner · right tip · bottom tip · left corner
  { pts: [[0.627, 0.500], [1.000, 0.619], [0.886, 1.000], [0.500, 0.871]], col: SQ_RED },
];

// background checkerboard split (measured centre)
const CX = 0.501, CY = 0.503;

const SEED = 74;

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  angleMode(RADIANS);
  noLoop();
}

function draw() {
  randomSeed(SEED);
  noiseSeed(SEED);

  drawGround();      // 2×2 colour checkerboard
  drawSquares();     // four tilted squares on top
  surface();         // one unifying weave + drift + grain layer
}

// --- 2×2 background checkerboard --------------------------------------------
function drawGround() {
  const cx = CX * W, cy = CY * H;
  noStroke();
  fill(BG_WHITE[0], BG_WHITE[1], BG_WHITE[2]); rect(0, 0, cx, cy);       // TL
  fill(BG_RED[0],   BG_RED[1],   BG_RED[2]);   rect(cx, 0, W - cx, cy);  // TR
  fill(BG_RED[0],   BG_RED[1],   BG_RED[2]);   rect(0, cy, cx, H - cy);  // BL
  fill(BG_WHITE[0], BG_WHITE[1], BG_WHITE[2]); rect(cx, cy, W - cx, H - cy); // BR
}

// --- the tilted squares, with a hair of hand wobble on each edge ------------
function drawSquares() {
  noStroke();
  for (const s of SQUARES) {
    fill(s.col[0], s.col[1], s.col[2]);
    beginShape();
    const p = s.pts;
    for (let i = 0; i < 4; i++) {
      const a = p[i], b = p[(i + 1) % 4];
      const ax = a[0] * W, ay = a[1] * H, bx = b[0] * W, by = b[1] * H;
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;     // edge normal
      const n = 7;
      for (let k = 0; k < n; k++) {            // walk the edge, jitter sideways
        const t = k / n;
        const bxk = ax + dx * t, byk = ay + dy * t;
        const env = Math.sin(Math.PI * t);     // no wobble at the corners
        const o = (noise(bxk * 0.02, byk * 0.02) - 0.5) * 2 * 1.4 * env;
        vertex(bxk + nx * o, byk + ny * o);
      }
    }
    endShape(CLOSE);
  }
}

// --- ONE surface layer over the whole picture -------------------------------
// Acrylic dragged over canvas reads as VERTICAL streaking: fine warp threads
// plus broad brush bands running down the picture, with a fainter horizontal
// weft. On top of that a low-frequency tonal drift brushes the reds lighter and
// darker, and a little grain rides over everything. All scaled up where the
// thin red lets the raw canvas show through, kept faint on the opaque white,
// and applied as an equal R/G/B delta so hue is preserved.
function surface() {
  loadPixels();
  const kV = TWO_PI / 9.0;        // fine vertical (warp) thread pitch
  const kH = TWO_PI / 16.0;       // horizontal (weft) thread pitch — fainter
  const d = pixelDensity();       // == 1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = 4 * (y * W * d * d + x * d);
      const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      const bright = (r + g + b) / 3;
      const t = constrain((180 - bright) / 150, 0, 1);   // ~0.78 red, 0 white

      // fine regular warp thread, kept faint — gives the canvas its crisp grain
      const ph = noise(x * 0.02, y * 0.02) * 2.5;
      const warp = Math.cos(x * kV + ph) * 0.6;

      // the dominant look: IRREGULAR vertical striation, two octaves of noise
      // stretched tall (fast in x, slow in y) so it reads as brush drag, not weave
      const fineV = (noise(x * 0.18, y * 0.02) - 0.5) * 2;   // fine threads ~5-6px
      const medV  = (noise(x * 0.05, y * 0.012) - 0.5) * 2;  // broad brush bands

      // a faint horizontal weft so the canvas still feels woven, never gridded
      const weft = Math.cos(y * kH + ph * 0.5) * 0.5;

      // broad tonal drift + fine grain
      const drift = (noise(x * 0.006 + 40, y * 0.006 + 40) - 0.5) * 2;
      const grain = (random() - 0.5) * 2;

      const delta = warp  * (0.9 + 1.0 * t)
                  + fineV * (1.0 + 2.2 * t)
                  + medV  * (1.2 + 2.8 * t)
                  + weft  * (0.4 + 0.7 * t)
                  + drift * (1.2 + 2.0 * t)
                  + grain * (0.9 + 0.7 * t);

      pixels[idx]     = constrain(r + delta, 0, 255);
      pixels[idx + 1] = constrain(g + delta, 0, 255);
      pixels[idx + 2] = constrain(b + delta, 0, 255);
    }
  }
  updatePixels();
}
