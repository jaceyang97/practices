/**
 * Practice 73 — Victor Vasarely, "Symphonie Inachevée" (Unfinished Symphony,
 *                                 1966, ink and gouache on paper)
 *
 * A faithful recreation of Vasarely's deliberately-incomplete sheet. The work
 * is a 45°-tilted DIAMOND LATTICE drawn in loose ink inside a thin pencil
 * frame. Most cells are left as bare outline — Vasarely's note read "Finish
 * the coloring with your children." Only SIX diamonds, threaded along a
 * stepped diagonal spine, are painted in gouache; each holds a nested motif in
 * a second colour.
 *
 * The lattice is two perpendicular families of diagonal lines (x+y = const and
 * x−y = const), pitch ≈426 px in the 1884-px original — measured by projecting
 * the ink onto each diagonal (peaks every 425–427 px). That makes a grid of
 * diamonds with a full diagonal of one pitch. Cells are indexed (p,q) by which
 * line-interval they fall in. The sheet is bounded by a THIN pencil frame —
 * the outer diamonds' apexes just touch it — and the main diagonal is ruled
 * corner-to-corner, so a short solid ink segment crosses the empty corner
 * triangle between the outermost diamonds and the frame at top-left and at
 * bottom-right (through the signature corner).
 *
 * The painted spine, measured by clustering the colour blobs and snapping each
 * to its cell, is a zig-zag:
 *     (2,5) (2,4) (3,3) (3,2) (2,1) (2,0)
 * and the nested motif cycles square → circle → diamond, twice:
 *     violet/red-SQUARE · blue/green-CIRCLE · green/yellow-DIAMOND ·
 *     red/violet-SQUARE · green/blue-CIRCLE · yellow/green-DIAMOND.
 * Each cell's inner colour is the OUTER colour of the cell three steps along —
 * the six hues rotate through both rings. Palette = median gouache fills;
 * inscribed circle ø and square side both ≈0.49·diagonal, inner diamond
 * ≈0.57·diagonal (centre-line scans of the blobs). The "unfinished" half keeps
 * the same alphabet in bare ink: one big circle (≈0.93 of the inscribed
 * circle, floating clear of the cell's sides); FOUR large freehand
 * rhombi (side ≈ 0.53·pitch) pinwheeling around the central lattice crossing,
 * each leaning at its own angle, their tips nearly meeting at the centre; a
 * large inscribed triangle in the top-centre cell, apex pointing down to the
 * cell's bottom corner — its right side lies on ONE LONG STROKE that runs on
 * past the apex and doubles as the top rhombus's lower-right edge (Vasarely's
 * shared-stroke "permutation" trick); and half-cuts — some empty diamonds
 * carry a vertical diagonal, others a horizontal cutting line. All sixteen
 * rhombus corners and the triangle's three were traced from the original
 * (PCA line fits of the off-lattice ink, corners = line intersections).
 *
 * Everything is drawn HAND-LOOSE — wobbled edges, slightly rounded corners,
 * a little overshoot — because the original is a working drawing, not a print.
 * Tiles stay FLAT: no bevels. Rendered clean on warm off-white paper, fully
 * static (no surface texture, no interaction).
 *
 * Code by Jace Yang
 */

const W = 1000;
const H = 1000;

// --- measured gouache palette (median fills) -------------------------------
const C = {
  red:    [216, 68, 52],
  violet: [ 84, 68, 144],
  blue:   [ 70, 124, 184],
  greenB: [116, 188, 80],   // bright "grass" green
  greenD: [ 72, 156, 100],  // deep "emerald" green
  yellow: [250, 232, 96],
  ink:    [60, 58, 64],     // loose ink line (measured grey ~[74,72,78], drawn darker)
  paper:  [250, 249, 241],
};

// --- lattice, measured in the 1884×1734 original ---------------------------
const A = [751, 1178, 1605, 2032, 2459, 2886];          // x+y line family
const B = [-1235, -809, -383, 43, 469, 895, 1321];      // x−y line family
const HH_O = 213.4;                                     // cell half-diagonal (orig px)
const FRAME_O = { l: 185, t: 145, r: 1675, b: 1629 };   // pencil frame (orig px)

// affine map original → canvas (frame inset by margin M)
const M = 70;
const S = (W - 2 * M) / (FRAME_O.r - FRAME_O.l);
const toX = (x) => (x - FRAME_O.l) * S + M;
const toY = (y) => (y - FRAME_O.t) * S + M;
const HH = HH_O * S;                                    // cell half-diagonal (canvas)

// motif sizes (canvas), from the colour-blob scans
const R_CIRC = 105 * S;     // inscribed colour circle radius (≈0.49·diag)
const SQ_HALF = 104 * S;    // colour square half-side
const ID_HALF = 122 * S;    // inner colour diamond half-diagonal (≈0.57·diag)

// the six painted cells: [p, q, outer, inner, motif]
const SPINE = [
  [2, 5, 'violet', 'red',    'square'],
  [2, 4, 'blue',   'greenB', 'circle'],
  [3, 3, 'greenD', 'yellow', 'diamond'],
  [3, 2, 'red',    'violet', 'square'],
  [2, 1, 'greenB', 'blue',   'circle'],
  [2, 0, 'yellow', 'greenD', 'diamond'],
];

const GEOM_SEED = 41;        // fixed → composition + wobble are stable

function setup() {
  createCanvas(W, H);
  pixelDensity(1);
  angleMode(RADIANS);
  noLoop();
}

function draw() {
  background(C.paper[0], C.paper[1], C.paper[2]);

  noiseSeed(GEOM_SEED);
  randomSeed(GEOM_SEED);

  drawFrame();          // thin pencil frame around the sheet
  drawLattice();        // complete diamond cells; their apexes touch the frame
  drawCellDiagonals();  // per-cell vertical & horizontal half-cuts
  drawOutlineMotifs();  // circle + triangle + the four freehand rhombi
  drawSpine();
}

// --- cell helpers ----------------------------------------------------------
function cellCenter(p, q) {
  const mA = (A[p] + A[p + 1]) / 2;
  const mB = (B[q] + B[q + 1]) / 2;
  return { x: toX((mA + mB) / 2), y: toY((mA - mB) / 2) };
}
function diamondPts(cx, cy, h) {
  return [[cx, cy - h], [cx + h, cy], [cx, cy + h], [cx - h, cy]];
}

// --- hand-loose primitives -------------------------------------------------
// a slightly wavy line: subdivide and push each interior point sideways by
// smooth noise, so strokes read as drawn-by-hand rather than ruled.
function wline(x1, y1, x2, y2, amp, n) {
  n = n || 5;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;       // unit normal
  beginShape();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const bx = x1 + dx * t, by = y1 + dy * t;
    const env = Math.sin(Math.PI * t);       // zero at the endpoints
    const o = (noise(bx * 0.01, by * 0.01, len) - 0.5) * 2 * amp * env;
    const px = bx + nx * o, py = by + ny * o;
    if (i === 0) curveVertex(px, py);
    curveVertex(px, py);
    if (i === n) curveVertex(px, py);
  }
  endShape();
}

// a hand-drawn polygon outline (and optional fill). The fill uses jittered
// straight vertices; the outline is wavy and slightly overshoots.
function wpoly(pts, amp, fillCol, strokeCol, sw) {
  if (fillCol) {
    noStroke();
    fill(fillCol[0], fillCol[1], fillCol[2]);
    beginShape();
    for (const [x, y] of pts) {
      const jx = (noise(x * 0.02, y * 0.02) - 0.5) * amp * 1.4;
      const jy = (noise(x * 0.02 + 9, y * 0.02 + 9) - 0.5) * amp * 1.4;
      vertex(x + jx, y + jy);
    }
    endShape(CLOSE);
  }
  if (strokeCol) {
    noFill();
    stroke(strokeCol[0], strokeCol[1], strokeCol[2]);
    strokeWeight(sw);
    strokeJoin(ROUND);
    strokeCap(ROUND);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      wline(a[0], a[1], b[0], b[1], amp, 5);
    }
  }
}

// a hand-drawn circle (wobbled radius)
function wcircle(cx, cy, r, fillCol, strokeCol, sw, amp) {
  const n = 40;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TWO_PI;
    const rr = r + (noise(Math.cos(a) * 1.3 + 5, Math.sin(a) * 1.3 + 5) - 0.5) * 2 * amp;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  if (fillCol) {
    noStroke();
    fill(fillCol[0], fillCol[1], fillCol[2]);
    beginShape();
    for (const [x, y] of pts) vertex(x, y);
    endShape(CLOSE);
  }
  if (strokeCol) {
    noFill();
    stroke(strokeCol[0], strokeCol[1], strokeCol[2]);
    strokeWeight(sw);
    beginShape();
    curveVertex(pts[n - 1][0], pts[n - 1][1]);
    for (const [x, y] of pts) curveVertex(x, y);
    curveVertex(pts[0][0], pts[0][1]);
    curveVertex(pts[1][0], pts[1][1]);
    endShape();
  }
}

function uprightSquare(cx, cy, half) {
  return [[cx - half, cy - half], [cx + half, cy - half],
          [cx + half, cy + half], [cx - half, cy + half]];
}
function tiltedSquare(cx, cy, half, angDeg) {
  const a0 = (angDeg * Math.PI) / 180;
  const d = half * Math.SQRT2;
  const pts = [];
  for (const k of [0.25, 0.75, 1.25, 1.75]) {
    const a = a0 + k * Math.PI;
    pts.push([cx + d * Math.cos(a), cy + d * Math.sin(a)]);
  }
  return pts;
}

// --- the thin pencil frame ---------------------------------------------------
function drawFrame() {
  stroke(C.ink[0], C.ink[1], C.ink[2], 115);
  strokeWeight(0.9);
  noFill();
  const l = toX(FRAME_O.l), t = toY(FRAME_O.t), r = toX(FRAME_O.r), b = toY(FRAME_O.b);
  wline(l, t, r, t, 0.7, 6);
  wline(r, t, r, b, 0.7, 6);
  wline(r, b, l, b, 0.7, 6);
  wline(l, b, l, t, 0.7, 6);
}

// --- the diamond lattice = COMPLETE diamond cells ---------------------------
// Every cell whose centre sits inside the sheet is drawn as a full diamond;
// the outer cells' apexes just touch the pencil frame. Shared edges are
// de-duplicated so interior lines aren't doubled.
function compositionCells() {
  const cells = [];
  for (let p = 0; p < 5; p++) {
    for (let q = 0; q < 6; q++) {
      const mA = (A[p] + A[p + 1]) / 2, mB = (B[q] + B[q + 1]) / 2;
      const ox = (mA + mB) / 2, oy = (mA - mB) / 2;
      // keep the full diamonds (centre ~one half-diagonal inside the sheet);
      // the half-cells right at the edge are the valleys between apexes.
      if (ox > FRAME_O.l + 95 && ox < FRAME_O.r - 95 &&
          oy > FRAME_O.t + 95 && oy < FRAME_O.b - 95) cells.push([p, q]);
    }
  }
  return cells;
}
function edgeKey(a, b) {
  const r = (v) => Math.round(v / 3);
  const ka = r(a[0]) + ',' + r(a[1]), kb = r(b[0]) + ',' + r(b[1]);
  return ka < kb ? ka + '|' + kb : kb + '|' + ka;
}
function drawLattice() {
  stroke(C.ink[0], C.ink[1], C.ink[2], 200);
  strokeWeight(1.7);
  strokeJoin(ROUND);
  noFill();
  const seen = new Set();
  for (const [p, q] of compositionCells()) {
    const c = cellCenter(p, q);
    const v = diamondPts(c.x, c.y, HH);
    for (let i = 0; i < 4; i++) {
      const a = v[i], b = v[(i + 1) % 4];
      const k = edgeKey(a, b);
      if (seen.has(k)) continue;
      seen.add(k);
      wline(a[0], a[1], b[0], b[1], 1.3, 6);
    }
  }
  // the sheet's main diagonal is ruled corner-to-corner: solid segments cross
  // the empty corner triangles between the outermost diamonds and the frame
  // (top-left: frame corner → first lattice vertex; bottom-right: last lattice
  // vertex → frame corner, through the signature area)
  wline(toX(FRAME_O.l), toY(FRAME_O.t), toX(397), toY(354), 1.3, 5);
  wline(toX(1464.5), toY(1421.5), toX(FRAME_O.r), toY(FRAME_O.b), 1.3, 5);
}

// --- per-cell construction marks (Vasarely's permutation "alphabet") --------
// Different empty cells carry different sub-divisions: a vertical half-cut, a
// horizontal half-cut, or a small inscribed triangle. Cell indices are (p,q).
const VERT_DIAG = [[1, 1], [3, 4]];          // vertical diagonal (cells 11, 34)
const HORIZ_DIAG = [[0, 3], [3, 1], [4, 2]]; // horizontal cut (03 = up-right of circle, 31, 42)

function drawCellDiagonals() {
  stroke(C.ink[0], C.ink[1], C.ink[2], 195);
  strokeWeight(1.6);
  noFill();
  for (const [p, q] of VERT_DIAG) {
    const c = cellCenter(p, q);
    wline(c.x, c.y - HH, c.x, c.y + HH, 1.3, 6); // top vertex → bottom vertex
  }
  for (const [p, q] of HORIZ_DIAG) {
    const c = cellCenter(p, q);
    wline(c.x - HH, c.y, c.x + HH, c.y, 1.3, 6); // left vertex → right vertex
  }
}

// --- the freehand rhombi + triangle, traced corner-by-corner ----------------
// Coordinates are in original-scan space (same space as A/B/FRAME_O), from PCA
// line fits of the off-lattice ink; each corner is the intersection of its two
// fitted edges. The four rhombi pinwheel around the central lattice crossing.
// Each rhombus's LONG diagonal spans the full gap between two parallel
// lattice lines — its tips sit exactly ON the tilted squares' sides.
const QUADS = [
  [[585, 593], [752, 761], [639, 966], [479, 806]],     // left rhombus (tips on A1/A2)
  [[1006, 599], [1171, 764], [1062, 971], [901, 809]],  // right rhombus (tips on A2/A3)
  [[797, 867], [1005, 962], [836, 1129], [656, 1039]],  // bottom rhombus (tips on B2/B3)
];
// Top rhombus R→T→L→B, drawn OPEN: its lower-right edge (B→R) lies on the
// long shared stroke below, which closes the shape. Tips L/R on B3/B4.
const QTOP_OPEN = [[1008, 539], [805, 434], [643, 600], [849, 698]];
// Triangle in cell (1,4): apex B points down to the cell's bottom corner.
// Side B→C lies on the long stroke C→E (E = top rhombus's bottom corner).
const TRI_A = [934, 244];      // ON the cell's upper-left edge (A1), ~halfway
const TRI_B = [1008, 539];     // apex = top rhombus's right tip = stroke ∩ B4
const TRI_C = [1221, 326];     // ON the cell's upper-right edge (stroke ∩ B5)
const STROKE_END = [849, 698]; // one stroke C→B→E, three roles

// --- the bare-ink "unfinished" motifs --------------------------------------
function drawOutlineMotifs() {
  const ink = C.ink, sw = 1.9, amp = 1.7;
  stroke(ink[0], ink[1], ink[2]);
  strokeWeight(sw);
  noFill();
  // big circle (cell 0,2) — NOT inscribed: r ≈ 0.93 of the inscribed circle
  // (least-squares fit of the original's arc), floating just clear of the
  // cell's sides
  const c = cellCenter(0, 2);
  wcircle(c.x, c.y, 140 * S, null, ink, sw, 2.0);
  // the long shared stroke: triangle right side + top rhombus lower-right edge
  wline(toX(TRI_C[0]), toY(TRI_C[1]), toX(STROKE_END[0]), toY(STROKE_END[1]), amp, 9);
  // the rest of the triangle
  wline(toX(TRI_A[0]), toY(TRI_A[1]), toX(TRI_C[0]), toY(TRI_C[1]), amp, 5);
  wline(toX(TRI_A[0]), toY(TRI_A[1]), toX(TRI_B[0]), toY(TRI_B[1]), amp, 5);
  // top rhombus, open (the stroke closes it)
  for (let i = 0; i < QTOP_OPEN.length - 1; i++) {
    const [ax, ay] = QTOP_OPEN[i], [bx, by] = QTOP_OPEN[i + 1];
    wline(toX(ax), toY(ay), toX(bx), toY(by), amp, 5);
  }
  // the other three rhombi, closed
  for (const quad of QUADS) {
    wpoly(quad.map(([x, y]) => [toX(x), toY(y)]), amp, null, ink, sw);
  }
}

// --- the six painted diamonds ----------------------------------------------
function drawSpine() {
  for (const [p, q, outer, inner, motif] of SPINE) {
    const c = cellCenter(p, q);
    // outer diamond: gouache fill + heavy, slightly overshooting ink outline
    wpoly(diamondPts(c.x, c.y, HH), 2.2, C[outer], C.ink, 3.4);
    // nested motif in the second colour, thin ink outline
    if (motif === 'circle') {
      wcircle(c.x, c.y, R_CIRC, C[inner], C.ink, 2.2, 2.0);
    } else if (motif === 'square') {
      wpoly(uprightSquare(c.x, c.y, SQ_HALF), 2.0, C[inner], C.ink, 2.2);
    } else {
      // a smaller diamond, aligned with the cell (vertices up/down/left/right)
      wpoly(diamondPts(c.x, c.y, ID_HALF), 2.0, C[inner], C.ink, 2.2);
    }
  }
}

