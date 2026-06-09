/**
 * Practice 71 — Anton Stankowski, "Equal and Unequal" (1951, linocut on paper)
 *
 * Four horizontal bands of black bars printed from cut linoleum, stamped onto
 * warm cream paper. Read the piece as a rule and a single exception — that is
 * literally its title. The RULE: every bar is "equal" — a narrow upright block,
 * each leaning the SAME way (a steady ~12° backslash), each a rotated rectangle
 * standing like a leaning book so its FOOT is cut square to the block (the
 * bottom edge runs parallel to the top, slanted with the lean — not flat). The
 * bars in a band stand on a common shelf, their tops left ragged at whatever
 * height the block reached. Forty-nine obey. The EXCEPTION: one bar, near the
 * middle, is "unequal" — it is RED, and it alone leans the other way (~10°), so
 * it crosses its black neighbour in a quiet scissor. One deviation in a field
 * of agreement; the whole composition is built to make that single tilt sing.
 *
 * Everything was measured off a photograph of the original print (1446×1824):
 * the four bands and their shelf-lines; every bar's foot-position, width, top
 * height and lean (connected components + PCA: black bars +12°±2°, the red one
 * −10°); the row-end wedges; the ink/paper/red colours by median.
 *
 * The bars are flat — no bevels, no edge-lighting, and the cut edges are CRISP
 * (1px anti-aliased, not fuzzy). The only "depth" is the ink itself: a relief
 * print's coverage, dense and rich in the body, fading at the ink-starved top
 * and breaking into fine bare-paper "snow" — bimodal flecks whose density
 * tracks the local tone (dark = pure-solid, light = floral), exactly how a
 * hand-pulled lino block transfers. Over the whole sheet sits ONE unifying
 * surface — faint paper tooth,
 * a broad tonal drift, a whisper of cooling toward the mount — never per bar.
 *
 * Click to re-pull the print: the ink grain re-rolls, the layout never moves.
 *
 * Code by Jace Yang
 */

// Grain. The original's ink is BIMODAL — each spot is either dense ink or a
// bright bare-paper fleck (almost no mid-grey) — and CRUCIALLY the flecks
// follow the local tone: dark zones print pure-solid, only the lighter zones
// (the ink-starved tops, cloudy patches, and some whole bars) go floral. So
// the speckle DENSITY S is a field — near 0 in the solid darks, high in the
// light zones — not a uniform dusting. Measured off the original: ~16% of the
// bar area is dead-solid, ~60% floral, median speck-density ≈ 0.2.
const GRAIN = {
  bodyS:     0.004, // baseline fleck density in the solid body (≈ pure ink)
  topS:      0.16,  // extra flecks toward the ink-starved top...
  topSpan:   0.26,  // ...ramping in over the top 26% of the bar
  cloudS:    0.24,  // floral-patch strength (only on floral-type bars)
  cloudBias: -0.10, // cloud threshold for a patch to go floral
  gate:      0.55,  // bars with floral-roll below this print solid; above, floral
  gslope:    2.5,   // how sharply a bar tips from solid to floral
  inkCov:    0.97,  // coverage of a dense ink spot
  speckCov:  0.16,  // coverage of a bright bare-paper fleck
};

const SCALE = 0.9;                       // render at 0.9× the 1446×1824 original
const W = Math.round(1446 * SCALE);      // 1301
const H = Math.round(1824 * SCALE);      // 1642

// Measured median colours.
const COL = {
  paper: [231, 227, 210], // warm cream sheet
  ink:   [ 63,  59,  48], // dense relief-print black (warm grey-brown)
  red:   [190,  46,  43], // the one "unequal" bar
};

// Per-band shelf-line (original px) the bars stand on, and the bars themselves.
// Each bar: [footCenterX, headCenterX, topY, footWidth, headWidth, isRed].
// footCenterX > headCenterX ⇒ leans right (top to the left); the lone red bar
// is the reverse. Bars are rotated rectangles: top & bottom edges run parallel,
// perpendicular to the lean (the "leaning book" foot).
const BASELINES = [483, 892, 1311, 1725];
const BANDS = [
  [ // band 1
    [142,123,280,51,10,0],[244,172,95,63,63,0],[346,278,124,58,57,0],
    [457,392,129,58,55,0],[577,516,145,62,62,0],[674,603,80,64,60,0],
    [798,724,88,66,66,0],[905,851,195,65,62,0],[1020,961,178,60,58,0],
    [1109,1030,63,60,57,0],[1197,1148,212,57,58,0],[1292,1223,104,62,63,0],
    [1324,1305,110,7,43,0],
  ],
  [ // band 2
    [180,144,667,62,51,0],[279,210,537,63,60,0],[391,315,499,63,59,0],
    [503,437,523,61,59,0],[597,551,615,58,60,0],[706,634,499,64,61,0],
    [823,760,556,60,54,0],[926,855,508,61,62,0],[1031,977,582,62,63,0],
    [1117,1052,505,62,60,0],[1228,1156,507,61,62,0],[1318,1276,551,24,55,0],
  ],
  [ // band 3 — contains the red bar
    [152,125,1018,62,10,0],[267,219,1026,62,58,0],[362,294,933,64,64,0],
    [489,420,936,66,66,0],[596,528,939,66,64,0],[715,665,1023,60,59,0],
    [823,767,958,61,56,0],[892,944,955,60,58,1],[1047,1003,1026,61,61,0],
    [1145,1085,944,66,67,0],[1247,1184,946,59,56,0],[1324,1293,974,11,59,0],
  ],
  [ // band 4
    [150,127,1475,56,8,0],[260,200,1385,59,57,0],[366,306,1384,64,59,0],
    [473,416,1414,59,57,0],[576,512,1369,60,59,0],[682,622,1402,61,59,0],
    [778,727,1422,60,59,0],[886,824,1381,59,56,0],[972,921,1418,59,57,0],
    [1072,1021,1424,65,63,0],[1178,1135,1474,61,58,0],[1290,1229,1376,62,60,0],
    [1325,1306,1374,8,46,0],
  ],
];

// Whole-sheet surface (applied once, over everything — never per bar).
const SURF = { mottleAmp: 0.022, broadAmp: 0.012, grainAmp: 0.014, edgeCool: 0.020 };

let textureSeed = 3;
let hashSeed = 3;   // stirs the per-pixel static hash (re-rolled on each pull)
let fGrain, fCloud; // ink-grain fields, rebuilt per pull

function setup() {
  createCanvas(W, H);
  pixelDensity(1); // keep pixels[] 1:1 with W*H
  noLoop();
}

function mousePressed() {
  textureSeed = (textureSeed * 1103515245 + 12345) & 0x7fffffff;
  redraw();
}

function draw() {
  randomSeed(textureSeed);
  noiseSeed(textureSeed);
  hashSeed = textureSeed;

  // ink-grain fields, unit-normalized so the tuned thresholds are scale-free
  fGrain = unitNorm(valueNoiseField(2.2, 2.2, 1));               // fine tooth (speck jitter)
  fCloud = unitNorm(valueNoiseField(40 * SCALE, 32 * SCALE, 2)); // broad density blooms

  background(COL.paper[0], COL.paper[1], COL.paper[2]);
  loadPixels();

  for (let b = 0; b < BANDS.length; b++) {
    const base = BASELINES[b] * SCALE;
    for (const bar of BANDS[b]) stampBar(bar, base);
  }

  applyPaperSurface();
  updatePixels();
}

// --- stamp one leaning-book bar (rotated rectangle, crisp edges) ------------
function stampBar(bar, base) {
  const [bcx, tcx, top, wb, wt, isRed] = bar;
  const Fx = bcx * SCALE, Fy = base;          // foot (bottom) centre
  const Gx = tcx * SCALE, Gy = top * SCALE;   // head (top) centre
  let axx = Gx - Fx, ayy = Gy - Fy;
  const L = Math.hypot(axx, ayy); axx /= L; ayy /= L; // axis unit, foot→head
  let px = ayy, py = -axx;                     // perpendicular (across the bar)
  if (px < 0) { px = -px; py = -py; }          // point it to the right
  const hwb = wb * SCALE / 2, hwt = wt * SCALE / 2;

  // bounding box of the four corners
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  for (const [cx, cy] of [
    [Fx - px * hwb, Fy - py * hwb], [Fx + px * hwb, Fy + py * hwb],
    [Gx + px * hwt, Gy + py * hwt], [Gx - px * hwt, Gy - py * hwt]]) {
    minx = Math.min(minx, cx); maxx = Math.max(maxx, cx);
    miny = Math.min(miny, cy); maxy = Math.max(maxy, cy);
  }
  const x0 = Math.max(0, Math.floor(minx)), x1 = Math.min(W - 1, Math.ceil(maxx));
  const y0 = Math.max(0, Math.floor(miny)), y1 = Math.min(H - 1, Math.ceil(maxy));
  const ink = isRed ? COL.red : COL.ink;
  const barFloral = random(); // this whole bar's overall floweriness (0..1)

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const rx = x - Fx, ry = y - Fy;
      const a = rx * axx + ry * ayy;            // 0 at foot .. L at head
      const tt = a / L;
      if (tt < -0.03 || tt > 1.03) continue;
      const b = rx * px + ry * py;              // across-bar offset
      const ttc = tt < 0 ? 0 : tt > 1 ? 1 : tt;
      const hw = hwb + (hwt - hwb) * ttc;
      const side = clamp01(hw - Math.abs(b) + 0.5);   // crisp 1px side edge
      const end  = clamp01(Math.min(a, L - a) + 0.5); // crisp foot / head edge
      const geom = side * end;
      if (geom <= 0.003) continue;

      const i = y * W + x;
      const t = 1 - ttc;                        // 0 top .. 1 bottom
      let cov = isRed ? (0.95 + 0.04 * fGrain[i]) : inkDensity(t, x, y, i, barFloral);
      cov = (cov < 0 ? 0 : cov > 1 ? 1 : cov) * geom;
      if (cov <= 0) continue;

      const p = i * 4;
      pixels[p]     = pixels[p]     * (1 - cov) + ink[0] * cov;
      pixels[p + 1] = pixels[p + 1] * (1 - cov) + ink[1] * cov;
      pixels[p + 2] = pixels[p + 2] * (1 - cov) + ink[2] * cov;
    }
  }
}

// --- ink coverage for a black bar: bimodal "snow", density tracks local tone -
// Each spot is decided ink-or-paper by comparing a per-pixel hash against the
// local ink-probability, which is high in the dense body and falls toward the
// ink-starved top. That gives sharp bimodal flecks (few mid-greys), like the
// original relief print, instead of a smooth grey wash.
function inkDensity(t, x, y, i, barFloral) {
  // local fleck density S: solid (≈0) by default. A bar is "solid-type" or
  // "floral-type" by its floral-roll (cloudGain); floral bars grow paper-flecks
  // in their lighter cloud patches and toward the ink-starved top.
  const cloudGain = clamp01((barFloral - GRAIN.gate) * GRAIN.gslope);
  let S = GRAIN.bodyS
        + GRAIN.topS * (1 - clamp01(t / GRAIN.topSpan))            // ink-starved top
        + GRAIN.cloudS * cloudGain * Math.max(0, fCloud[i] + GRAIN.cloudBias);
  S = clamp01(S);
  if (hash01(x, y) < S) {
    return clamp01(GRAIN.speckCov + 0.05 * (fGrain[i] + 1)); // bright bare-paper fleck
  }
  return clamp01(GRAIN.inkCov + 0.02 * fGrain[i]);          // dense ink spot
}

// Deterministic per-pixel hash in [0,1), stirred by the texture seed so each
// re-pull re-rolls the static (cheap integer hash, no allocation).
function hash01(x, y) {
  let h = (x * 374761393 + y * 668265263 + hashSeed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Rescale a field to zero mean / unit standard deviation, so grain thresholds
// are independent of the noise field's raw amplitude.
function unitNorm(f) {
  let m = 0; for (let k = 0; k < f.length; k++) m += f[k]; m /= f.length;
  let v = 0; for (let k = 0; k < f.length; k++) { const d = f[k] - m; v += d * d; }
  const s = Math.sqrt(v / f.length) || 1;
  for (let k = 0; k < f.length; k++) f[k] = (f[k] - m) / s;
  return f;
}

// --- one unifying paper surface, over the whole sheet ----------------------
function applyPaperSurface() {
  const mott = valueNoiseField(0.10 * H, 0.10 * H, 3);
  const broad = valueNoiseField(0.60 * H, 0.60 * H, 1);
  const cx0 = W / 2, cy0 = H / 2, maxD = Math.hypot(cx0, cy0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, p = i * 4;
      let lum = 1 + SURF.mottleAmp * mott[i];
      lum *= 1 + SURF.broadAmp * broad[i];
      lum *= 1 + SURF.grainAmp * (random() - 0.5) * 2;
      const d = Math.hypot(x - cx0, y - cy0) / maxD;
      const edge = 1 - SURF.edgeCool * Math.max(0, d - 0.7) / 0.3;
      pixels[p]     = clamp255(pixels[p]     * lum * edge);
      pixels[p + 1] = clamp255(pixels[p + 1] * lum * edge);
      pixels[p + 2] = clamp255(pixels[p + 2] * lum * edge * 1.01);
    }
  }
}

function clamp255(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

// Smooth value noise on an (cellX × cellY) grid, summed over octaves and
// normalized to roughly zero-mean unit amplitude. Bilinearly upsampled.
function valueNoiseField(cellX, cellY, octaves) {
  const out = new Float32Array(W * H);
  let amp = 1, tot = 0;
  for (let o = 0; o < octaves; o++) {
    const cx = Math.max(2, Math.floor(cellX / (1 << o)));
    const cy = Math.max(2, Math.floor(cellY / (1 << o)));
    const gw = Math.floor(W / cx) + 2, gh = Math.floor(H / cy) + 2;
    const g = new Float32Array(gw * gh);
    for (let k = 0; k < g.length; k++) g[k] = randomGaussian();
    for (let y = 0; y < H; y++) {
      const yy = y / cy, gy0 = Math.floor(yy), fy = yy - gy0, gy1 = Math.min(gy0 + 1, gh - 1);
      for (let x = 0; x < W; x++) {
        const xx = x / cx, gx0 = Math.floor(xx), fx = xx - gx0, gx1 = Math.min(gx0 + 1, gw - 1);
        const v00 = g[gy0 * gw + gx0], v01 = g[gy0 * gw + gx1];
        const v10 = g[gy1 * gw + gx0], v11 = g[gy1 * gw + gx1];
        out[y * W + x] += amp * (
          v00 * (1 - fx) * (1 - fy) + v01 * fx * (1 - fy) +
          v10 * (1 - fx) * fy       + v11 * fx * fy);
      }
    }
    tot += amp; amp *= 0.5;
  }
  for (let k = 0; k < out.length; k++) out[k] /= tot;
  return out;
}
