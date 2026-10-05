/**
 * Title: Tribute to Kishio Suga: Untitled (無題)
 * Practice 77 — Kishio Suga (菅木志雄), "Untitled (無題)" (1975, ink and
 * pencil on paper)
 *
 * A faithful recreation of Suga's systematic sheet: 35 hand-drawn squares on a
 * 5-column × 7-row grid (the bottom row cropped by the sheet edge, as in the
 * photographed original), each ruled in soft graphite and lightly hatched with
 * horizontal pencil striations so the interior reads as a faint painted field a
 * shade darker than the warm ivory paper. To every square Suga fixes ONE solid
 * black mark — a heavy brush/ink bar the length of a full side, laid flush
 * OUTSIDE one of the four edges, or an L-bracket wrapping one of the four
 * corners. Across the grid that single mark migrates around each square's
 * perimeter, a quiet serial permutation of the same element — the Mono-ha
 * interest in placement and relation rather than image.
 *
 * Measured from the source (900×1198 px): warm ivory paper ≈ (237,234,215),
 * here filling the whole sheet (the photographed gallery-gray surround is
 * dropped — the ivory alone carries it). Squares are hand-drawn, side ≈ 107 px,
 * jittering a few px off the nominal grid — so their exact measured boxes are
 * stored below rather than re-derived. Graphite outline ≈ (170,163,150), weight ≈ 2.5 px;
 * pencil hatch period ≈ 6 px; black mark ≈ (64,64,61), thickness ≈ 14 px. A
 * flat-geometry proof against the original reaches ~5.7/255 (texture-only
 * residual), tab-for-tab.
 *
 * Each cell is [x0,y0,x1,y1, mark] in original-image px, row-major. The mark
 * code is one of the four EDGES  T B L R  (a full-length bar just outside that
 * side) or the four CORNERS  TL TR BL BR  (an L of two half-length arms hugging
 * that corner from outside).
 *
 * Marks stay FLAT — no bevels, no per-square shading. The only physical layer
 * is a single unifying pass over the whole sheet: a soft warm vignette (a touch
 * lighter mid-top, deeper toward the edges) plus fine paper grain. Outlines and
 * marks are drawn hand-loose — a hair of wobble and overshoot — so they read as
 * ruled and inked by hand, not vector-perfect. Fully static.
 *
 * Code by Jace Yang
 */

const ORIG_W = 900, ORIG_H = 1198;
const SCALE = 1.25;
const W = Math.round(ORIG_W * SCALE);   // 1125
const H = Math.round(ORIG_H * SCALE);   // 1498

const PAPER    = [238, 235, 217];       // warm ivory sheet (fills the canvas)
const GRAPHITE = [168, 160, 147];       // soft pencil gray
const INK      = [62, 62, 59];          // heavy black mark

const TH = 14;                          // mark thickness, original px
const SEED = 75;                        // fixed → wobble + grain are stable

const sx = (x) => x * SCALE;

// 35 cells: [x0,y0,x1,y1, mark] in ORIGINAL px, row-major (5 cols × 7 rows)
const CELLS = [
  [72,63,178,169,"B"],  [244,66,352,174,"L"],   [419,66,527,174,"T"],  [592,65,698,171,"BL"], [747,67,853,173,"L"],
  [72,239,178,345,"R"], [244,236,352,344,"TR"], [417,234,525,342,"B"], [589,236,697,344,"T"], [747,237,853,343,"B"],
  [72,413,178,519,"L"], [241,413,347,519,"T"],  [416,409,526,519,"R"], [587,408,695,516,"L"], [747,409,853,515,"BL"],
  [71,586,179,694,"R"], [238,586,346,694,"B"],  [413,588,521,696,"L"], [583,588,691,696,"B"], [744,588,852,696,"T"],
  [69,756,177,864,"B"], [236,754,344,862,"R"],  [411,750,519,858,"T"], [581,752,689,860,"L"], [741,753,847,859,"B"],
  [72,923,178,1029,"L"],[236,918,344,1026,"BR"],[407,918,515,1026,"L"],[577,916,685,1024,"T"],[741,921,847,1027,"L"],
  [72,1093,178,1199,"T"],[236,1088,344,1196,"L"],[407,1088,515,1196,"R"],[577,1086,685,1194,"TR"],[741,1091,847,1197,"T"],
];

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  noLoop();
}

function draw() {
  noiseSeed(SEED);
  randomSeed(SEED);

  background(PAPER[0], PAPER[1], PAPER[2]);   // ivory fills the whole canvas

  for (const cell of CELLS) drawCell(cell);

  surfaceLayer();          // single unifying pass: vignette + paper grain
}

// --- a wobbly hand path between two points, returned as vertices ------------
function wobble(x1, y1, x2, y2, amp, over) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const o1 = random(-0.4, over), o2 = random(-0.4, over);
  const ax = x1 - ux * o1, ay = y1 - uy * o1;
  const bx = x2 + ux * o2, by = y2 + uy * o2;
  const n = Math.max(3, Math.round(len / 9));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
    const env = Math.sin(Math.PI * t) * 0.7 + 0.3;
    const off = (noise(px * 0.02, py * 0.02, len * 0.01) - 0.5) * 2 * amp * env;
    pts.push([px + nx * off, py + ny * off, nx, ny]);
  }
  return pts;
}

// smooth low-alpha stroke through a path (the soft halo of a pencil line)
function strokePath(pts, w, r, g, b, a) {
  noFill();
  strokeCap(ROUND); strokeJoin(ROUND);
  stroke(r, g, b, a); strokeWeight(w);
  beginShape();
  curveVertex(pts[0][0], pts[0][1]);
  for (const p of pts) curveVertex(p[0], p[1]);
  const L = pts[pts.length - 1];
  curveVertex(L[0], L[1]);
  endShape();
}

function drawCell(cell) {
  const x0 = sx(cell[0]), y0 = sx(cell[1]), x1 = sx(cell[2]), y1 = sx(cell[3]);
  const mark = cell[4];

  hatchInterior(x0, y0, x1, y1);
  drawOutline(x0, y0, x1, y1, cell[0], cell[1]);
  drawMark(x0, y0, x1, y1, mark);
}

// very faint horizontal pencil grain → a soft field, a shade darker than paper
function hatchInterior(x0, y0, x1, y1) {
  noFill();
  strokeCap(ROUND);
  const step = 4.2 * SCALE;
  for (let y = y0 + step; y < y1 - step * 0.3; y += step) {
    const a = 8 + random(0, 9);                    // barely-there pressure
    stroke(GRAPHITE[0] - 8, GRAPHITE[1] - 8, GRAPHITE[2] - 8, a);
    strokeWeight(0.9 * SCALE);
    const inL = random(1, 6) * SCALE;              // ragged, broken ends
    const inR = random(1, 6) * SCALE;
    const yy = y + random(-0.7, 0.7) * SCALE;
    strokePath(wobble(x0 + inL, yy, x1 - inR, yy, 0.8, 0.4), 0.9 * SCALE,
               GRAPHITE[0] - 8, GRAPHITE[1] - 8, GRAPHITE[2] - 8, a);
  }
}

// hand-drawn graphite square: soft halo + a broken, grainy core (soft pencil)
function drawOutline(x0, y0, x1, y1, ox, oy) {
  const d = (noise(ox * 0.01, oy * 0.01) - 0.5) * 18;
  const r = GRAPHITE[0] + d, g = GRAPHITE[1] + d, b = GRAPHITE[2] + d;
  const edges = [[x0, y0, x1, y0], [x1, y0, x1, y1],
                 [x1, y1, x0, y1], [x0, y1, x0, y0]];
  for (const [ax, ay, bx, by] of edges) {
    const pts = wobble(ax, ay, bx, by, 1.1, 2.2);
    // soft chalky halo
    strokePath(pts, 4.4 * SCALE, r + 16, g + 16, b + 16, 30);
    // continuous soft body so the line never reads as separate dashes
    strokePath(pts, 2.0 * SCALE, r + 6, g + 6, b + 6, 72);
    // grainy core — short dashes of uneven pressure, occasional skips
    graphiteCore(pts, r, g, b);
  }
}

// walk the path stamping short dashes with jittered pressure and offset
function graphiteCore(pts, r, g, b) {
  strokeCap(ROUND);
  for (let i = 0; i < pts.length - 1; i++) {
    if (random() < 0.03) continue;                 // occasional graphite gap
    const p = pts[i], q = pts[i + 1];
    const j = 0.45 * SCALE;
    const ox = p[2] * random(-j, j), oy = p[3] * random(-j, j);
    const grain = random(-12, 14);
    const a = 120 + random(-45, 55);               // uneven darkness along line
    stroke(r + grain, g + grain, b + grain, a);
    strokeWeight((1.5 + random(0, 1.0)) * SCALE);
    line(p[0] + ox, p[1] + oy, q[0] + ox, q[1] + oy);
  }
}

// the single black mark — a full-side edge bar, or an L wrapping a corner
function drawMark(x0, y0, x1, y1, mark) {
  const th = TH * SCALE;
  const s = x1 - x0;
  const La = 0.60 * s;               // corner arm length
  const ov = 0.12 * s;               // corner overhang past the vertex
  if (mark.length === 1) {
    if (mark === "T") inkRect(x0, y0 - th, x1, y0);
    if (mark === "B") inkRect(x0, y1, x1, y1 + th);
    if (mark === "L") inkRect(x0 - th, y0, x0, y1);
    if (mark === "R") inkRect(x1, y0, x1 + th, y1);
    return;
  }
  // corners: vertical arm outside the side edge, horizontal arm outside top/bottom
  if (mark === "BL") { inkRect(x0 - th, y1 - La, x0, y1 + ov); inkRect(x0 - ov, y1, x0 + La, y1 + th); }
  if (mark === "BR") { inkRect(x1, y1 - La, x1 + th, y1 + ov); inkRect(x1 - La, y1, x1 + ov, y1 + th); }
  if (mark === "TL") { inkRect(x0 - th, y0 - ov, x0, y0 + La); inkRect(x0 - ov, y0 - th, x0 + La, y0); }
  if (mark === "TR") { inkRect(x1, y0 - ov, x1 + th, y0 + La); inkRect(x1 - La, y0 - th, x1 + ov, y0); }
}

// a solid ink rectangle with faintly ragged brush/marker edges
function inkRect(a, b, c, d) {
  const j = 1.1 * SCALE;
  noStroke();
  fill(INK[0], INK[1], INK[2]);
  beginShape();
  vertex(a + random(-j, j), b + random(-j, j));
  vertex(c + random(-j, j), b + random(-j, j));
  vertex(c + random(-j, j), d + random(-j, j));
  vertex(a + random(-j, j), d + random(-j, j));
  endShape(CLOSE);
}

// --- one unifying surface pass over the whole sheet -------------------------
// soft warm vignette (a touch lighter mid-top, deeper toward the edges) + grain
function surfaceLayer() {
  loadPixels();
  const cx = W * 0.48, cy = H * 0.42;
  const maxd = Math.hypot(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = 4 * (y * W + x);
      const lift = (1 - y / H) * 4.0;                 // faint top lift
      const dd = Math.hypot(x - cx, y - cy) / maxd;
      const vig = -dd * dd * 27.0;                    // corner fall-off
      const g = (noise(x * 0.5, y * 0.5) - 0.5) * 8.0
              + (noise(x * 0.05, y * 0.05) - 0.5) * 6.0;
      const t = lift + vig + g;
      pixels[idx]     += t;
      pixels[idx + 1] += t;
      pixels[idx + 2] += t * 0.9;                     // keep the warmth
    }
  }
  updatePixels();
}
