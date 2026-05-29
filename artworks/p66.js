/**
 * Practice 66 — Cathedral Unit-Distance Glass
 *
 * p64 (Cathedral Glass, god-ray volumetric light) × p65 (Unit-Distance Field).
 *
 * The planar point set from p65,
 *
 *     z = (a + bi) + (c + di)·ρ ,   a,b,c,d ∈ {−k..k},  ρ = e^{iθ},
 *
 * and its unit-distance edges are no longer drawn as a wire graph. The edges
 * subdivide the plane, and every region they enclose becomes one piece of
 * coloured glass. The whole medallion is then lit with p64's real 3D god-ray
 * post-process — the same volumetric shafts of light, the same switchable
 * weight function w(t), the same movable sun.
 *
 * The pattern is PRESERVED, never melded. Earlier this piece fused sub-minimum
 * shards into their neighbours ("melded") to hide a flaw in the arrangement;
 * that destroyed the generated figure. The real flaw was that the planar
 * subdivision did not split COLLINEAR overlapping segments — at degenerate
 * angles like θ=60° (Dense Core) the lattice stacks many unit edges along the
 * same lines, and without splitting them the half-edge walk shattered into
 * tens of thousands of spurious slivers. Here collinear overlaps are split
 * correctly, so the arrangement is clean and every genuine cell survives as
 * its own pane. No region is merged away.
 *
 * Colour is a smooth radial × angular wash over p64's medieval palette (gold
 * boss → ruby/azure body → deep-blue rim), so even a very dense field reads as
 * coherent rose-window petals rather than per-cell noise, with a faint per-cell
 * value jitter for the hand-cut look.
 *
 * Code by Jace Yang
 */

function setup() { noCanvas(); kickoff(); }
function draw() {}
function windowResized() {}

async function kickoff() {
  document.documentElement.style.cssText = 'margin:0;padding:0;background:#000;height:100%;';
  document.body.style.cssText =
    'margin:0;padding:0;background:#000;overflow:hidden;height:100vh;' +
    'font-family:ui-monospace,Menlo,Consolas,monospace;color:#fff;';
  await loadScript('https://unpkg.com/three@0.160.0/build/three.min.js');
  run();
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

function run() {
  const THREE = window.THREE;
  const DEG = Math.PI / 180;

  // ============================================================== Geometry
  //  Square panel, like p64. The medallion (the p65 field) is scaled to fit
  //  inside it; everything is measured in these world units.
  const PANE_W    = 13;
  const PANE_H    = 13;
  const PANE_T    = 0.30;
  const PANE_HALF = PANE_W / 2;
  const FILL      = 0.92;          // medallion fills this fraction of the half-pane

  // ============================================================ Glass jewels
  //  A real antique-glass jewel palette. Medieval windows draw from a small
  //  set of saturated pot-metal colours — Chartres cobalt, ruby/crimson,
  //  pot-yellow gold/amber, bottle greens, a little violet, and pale
  //  grisaille whites. The six colouring schemes below all draw from this set.
  const J = {
    cobalt: '#1a35a8', blue: '#2b54c6', azure: '#4a86d4', sky: '#86b6e8',
    ruby:   '#bb1a37', crimson: '#7c1124', rose: '#d44e74',
    gold:   '#f0c33c', amber: '#df9326', honey: '#ecb74e',
    emerald:'#1c8a50', green: '#3aa05c', moss: '#6f8a32', teal: '#1f8f8a',
    violet: '#5a2f9c', plum: '#7d40b0',
    cream:  '#f5ecc2', white: '#f1eee0', clear: '#dce8ee', ochre: '#9a6a26',
  };

  // ============================================================== Presets
  //  p65's parameter sets. `Dense Core` (θ=60°, k=3, windowed) is the default
  //  the user asked for — a dense disc of fine octagonal weave.
  const PRESETS = [
    { name: 'Dense Core', theta: 60, mag: 1, k: 3, dist: 1, tol: 0.006, win: true,  R: 4.0 },
    { name: 'ζ₈ Octagon', theta: 45, mag: 1, k: 2, dist: 1, tol: 0.006, win: false, R: 5   },
  ];

  // ================================================================ State
  const S = {
    presetIdx:   0,
    // generator (p65)
    theta: 60, mag: 1, k: 3, dist: 1, tol: 0.006, win: true, R: 4.0,
    coloring:    'Reims',   // symmetry-derived rose scheme (see COLORINGS)
    // god-ray (p64)
    variantIdx:  0,          // E1 LINEAR
    mode:        'viewing',
    lightX:      -4.0,
    lightY:       9.0,
    lightZ:       3.0,
    intensity:    1.5,
    K:            4.0,
    opacity:      1.0,       // glass piece opacity
    showLead:     true,      // unit-distance edges drawn as faint leading
    showGrid:     true,      // panel's square clear-glass grid
  };
  const LIGHT_RANGE = 12;
  const LIGHT_Z_MIN = 3.0;
  const LIGHT_Z_MAX = 22;

  function getLightPos() { return new THREE.Vector3(S.lightX, S.lightY, -S.lightZ); }

  // ====================================================== Graph generation
  //  (from p65) P = [x0,y0,…] math-plane points; E = [i0,j0,…] vertex pairs
  //  at the target unit distance. maxR auto-fits the medallion into the pane.
  let P = new Float64Array(0);
  let E = new Int32Array(0);
  let nPts = 0, nEdges = 0, maxR = 1;
  let faces = [];      // { poly:[[x,y]…], cx, cy }  (math-plane centroid)
  let unitSegs = [];   // [x0,y0,x1,y1] distinct unit edges (the leading)
  let nPanes = 0;
  let patternCell = 0.5;   // characteristic piece size (math units) → grid pitch

  function buildGraph() {
    const th = S.theta * DEG;
    const rRe = S.mag * Math.cos(th);
    const rIm = S.mag * Math.sin(th);
    const k = S.k;
    const R2 = S.R * S.R;
    const seen = new Map();
    const xs = [], ys = [];
    let mr = 0;
    for (let a = -k; a <= k; a++)
      for (let b = -k; b <= k; b++)
        for (let c = -k; c <= k; c++)
          for (let d = -k; d <= k; d++) {
            const px = a + (c * rRe - d * rIm);
            const py = b + (c * rIm + d * rRe);
            if (S.win && (px * px + py * py) > R2) continue;
            const key = Math.round(px * 1e6) + ',' + Math.round(py * 1e6);
            if (seen.has(key)) continue;
            seen.set(key, xs.length);
            xs.push(px); ys.push(py);
            const r = Math.hypot(px, py);
            if (r > mr) mr = r;
          }
    nPts = xs.length;
    P = new Float64Array(nPts * 2);
    for (let i = 0; i < nPts; i++) { P[2 * i] = xs[i]; P[2 * i + 1] = ys[i]; }
    maxR = mr > 1e-9 ? mr : 1;
    buildEdges();
  }

  function buildEdges() {
    const lo = Math.max(0, S.dist - S.tol);
    const hi = S.dist + S.tol;
    const lo2 = lo * lo, hi2 = hi * hi;
    const cell = Math.max(hi, 1e-4);
    const grid = new Map();
    for (let i = 0; i < nPts; i++) {
      const cx = Math.floor(P[2 * i] / cell);
      const cy = Math.floor(P[2 * i + 1] / cell);
      const key = cx * 73856093 ^ cy * 19349663;
      let arr = grid.get(key);
      if (!arr) { arr = []; grid.set(key, arr); }
      arr.push(i);
    }
    const out = [];
    for (let i = 0; i < nPts; i++) {
      const xi = P[2 * i], yi = P[2 * i + 1];
      const cx = Math.floor(xi / cell), cy = Math.floor(yi / cell);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          const arr = grid.get((cx + dx) * 73856093 ^ (cy + dy) * 19349663);
          if (!arr) continue;
          for (let t = 0; t < arr.length; t++) {
            const j = arr[t];
            if (j <= i) continue;
            const ddx = xi - P[2 * j], ddy = yi - P[2 * j + 1];
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 >= lo2 && d2 <= hi2) out.push(i, j);
          }
        }
    }
    E = Int32Array.from(out);
    nEdges = out.length / 2;
  }

  // ============================================== Planar arrangement faces
  //  Glass pieces are the bounded faces of the planar subdivision the unit
  //  edges induce. Two corrections over the naive walk make it clean:
  //   • transversal crossings split both segments (unit-distance graphs are
  //     not planar — ζ₈ is two overlapping grids);
  //   • COLLINEAR overlapping segments split each other at projected
  //     endpoints, so stacked duplicate edges along one line collapse into
  //     shared sub-edges after welding instead of spawning sliver faces.
  //  No melding: every bounded face becomes its own coloured pane.
  function buildFaces() {
    faces = []; unitSegs = []; nPanes = 0;
    if (nPts === 0 || nEdges === 0) return;

    // 1 — distinct undirected unit segments.
    const segs = [];
    const segSeen = new Set();
    for (let e = 0; e < E.length; e += 2) {
      const i = E[e], j = E[e + 1];
      const key = i < j ? i + '_' + j : j + '_' + i;
      if (segSeen.has(key)) continue;
      segSeen.add(key);
      segs.push([P[2 * i], P[2 * i + 1], P[2 * j], P[2 * j + 1]]);
    }
    unitSegs = segs;
    const SN = segs.length;
    const doSplit = SN <= 9000;

    // 2 — per-segment split parameters: transversal crossings + collinear
    //     overlaps, AABB-pruned.
    const EPS = 1e-7;
    const COLL = 1e-6;
    const splits = segs.map(() => []);
    if (doSplit) {
      const bb = segs.map(s => [
        Math.min(s[0], s[2]), Math.min(s[1], s[3]),
        Math.max(s[0], s[2]), Math.max(s[1], s[3]),
      ]);
      for (let a = 0; a < SN; a++) {
        const ax0 = segs[a][0], ay0 = segs[a][1];
        const dax = segs[a][2] - ax0, day = segs[a][3] - ay0;
        const la2 = dax * dax + day * day;
        for (let b = a + 1; b < SN; b++) {
          if (bb[a][0] > bb[b][2] + EPS || bb[b][0] > bb[a][2] + EPS ||
              bb[a][1] > bb[b][3] + EPS || bb[b][1] > bb[a][3] + EPS) continue;
          const bx0 = segs[b][0], by0 = segs[b][1];
          const dbx = segs[b][2] - bx0, dby = segs[b][3] - by0;
          const denom = dax * dby - day * dbx;
          if (Math.abs(denom) < 1e-9) {
            // Parallel. Split only if collinear (b's start on a's line).
            const cross0 = (bx0 - ax0) * day - (by0 - ay0) * dax;
            if (Math.abs(cross0) > COLL * Math.sqrt(la2)) continue;
            const tb0 = ((bx0 - ax0) * dax + (by0 - ay0) * day) / la2;
            const tb1 = ((segs[b][2] - ax0) * dax + (segs[b][3] - ay0) * day) / la2;
            if (tb0 > EPS && tb0 < 1 - EPS) splits[a].push(tb0);
            if (tb1 > EPS && tb1 < 1 - EPS) splits[a].push(tb1);
            const lb2 = dbx * dbx + dby * dby;
            const ta0 = ((ax0 - bx0) * dbx + (ay0 - by0) * dby) / lb2;
            const ta1 = ((segs[a][2] - bx0) * dbx + (segs[a][3] - by0) * dby) / lb2;
            if (ta0 > EPS && ta0 < 1 - EPS) splits[b].push(ta0);
            if (ta1 > EPS && ta1 < 1 - EPS) splits[b].push(ta1);
            continue;
          }
          const wx = bx0 - ax0, wy = by0 - ay0;
          const ta = (wx * dby - wy * dbx) / denom;
          const tb = (wx * day - wy * dax) / denom;
          if (ta < -EPS || ta > 1 + EPS || tb < -EPS || tb > 1 + EPS) continue;
          if (ta > EPS && ta < 1 - EPS) splits[a].push(ta);
          if (tb > EPS && tb < 1 - EPS) splits[b].push(tb);
        }
      }
    }

    // 3 — global vertex pool, snapped to a weld grid so near-coincident
    //     crossings collapse to one junction.
    const WELD = Math.max(1e-4, 0.02 * S.dist);
    const vmap = new Map();
    const VX = [], VY = [];
    function vid(x, y) {
      const qx = Math.round(x / WELD), qy = Math.round(y / WELD);
      const key = qx + ',' + qy;
      let id = vmap.get(key);
      if (id === undefined) { id = VX.length; vmap.set(key, id); VX.push(qx * WELD); VY.push(qy * WELD); }
      return id;
    }

    // 4 — cut each segment at its split params → planar sub-edges.
    const subEdges = [];
    const subSeen = new Set();
    for (let a = 0; a < SN; a++) {
      const x0 = segs[a][0], y0 = segs[a][1], x1 = segs[a][2], y1 = segs[a][3];
      const ts = splits[a]; ts.push(0, 1); ts.sort((p, q) => p - q);
      const ids = [];
      let prevId = -1;
      for (const t of ts) {
        if (t < -EPS || t > 1 + EPS) continue;
        const id = vid(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        if (id === prevId) continue;
        prevId = id;
        ids.push(id);
      }
      for (let p = 0; p + 1 < ids.length; p++) {
        const u = ids[p], v = ids[p + 1];
        if (u === v) continue;
        const ek = u < v ? u + '_' + v : v + '_' + u;
        if (subSeen.has(ek)) continue;
        subSeen.add(ek);
        subEdges.push([u, v]);
      }
    }
    const NV = VX.length;
    if (!subEdges.length) return;

    // 5 — half-edges + per-vertex CCW order.
    const heU = [], heV = [], heAng = [], heTwin = [], heNext = [];
    const outByV = Array.from({ length: NV }, () => []);
    function addHE(u, v) {
      const idx = heU.length;
      heU.push(u); heV.push(v);
      heAng.push(Math.atan2(VY[v] - VY[u], VX[v] - VX[u]));
      outByV[u].push(idx);
      return idx;
    }
    for (const [u, v] of subEdges) {
      const h1 = addHE(u, v), h2 = addHE(v, u);
      heTwin[h1] = h2; heTwin[h2] = h1;
    }
    for (let v = 0; v < NV; v++) outByV[v].sort((p, q) => heAng[p] - heAng[q]);
    const posInV = new Array(heU.length);
    for (let v = 0; v < NV; v++) {
      const arr = outByV[v];
      for (let p = 0; p < arr.length; p++) posInV[arr[p]] = p;
    }
    //  next(h): arriving at head v, turn as far clockwise as possible — keeps
    //  the face on the left, so bounded faces come out CCW (area > 0).
    for (let h = 0; h < heU.length; h++) {
      const v = heV[h], r = heTwin[h], arr = outByV[v];
      heNext[h] = arr[(posInV[r] - 1 + arr.length) % arr.length];
    }

    // 6 — walk faces. Bounded faces are CCW (area > 0); the lone CW face is
    //     the unbounded exterior.
    const NH = heU.length;
    const maxArea = maxR * maxR * 4;
    const visited = new Array(NH).fill(false);
    let count = 0, sumArea = 0;
    for (let h0 = 0; h0 < NH; h0++) {
      if (visited[h0]) continue;
      const cyc = [];
      let cur = h0, guard = 0;
      do { visited[cur] = true; cyc.push(cur); cur = heNext[cur]; } while (cur !== h0 && ++guard < NH + 4);
      let a2 = 0, cx = 0, cy = 0;
      const poly = [];
      for (let p = 0; p < cyc.length; p++) {
        const hp = cyc[p];
        const x = VX[heU[hp]], y = VY[heU[hp]];
        a2 += x * VY[heV[hp]] - VX[heV[hp]] * y;
        cx += x; cy += y; poly.push([x, y]);
      }
      const area = a2 / 2;
      if (area <= 1e-7 || area > maxArea) continue;   // exterior / degenerate
      const n = cyc.length || 1;
      faces.push({ poly, cx: cx / n, cy: cy / n });    // colour assigned at build time
      sumArea += area;
      count++;
    }
    nPanes = count;
    //  Characteristic piece size — used to scale the background grid so its
    //  cells track the pattern's granularity (tiny pieces → tiny grid).
    patternCell = count > 0 ? Math.sqrt(sumArea / count) : S.dist * 0.3;
  }

  // ============================================== Colour
  //  Studied from the Reims Grande Rose (panel b). The key is what it is NOT:
  //  not concentric rings of one colour (that reads as a target). It is a polar
  //  CHECKERBOARD — medallions sit on a grid of m angular spokes × radial rings,
  //  and red/blue ALTERNATE along BOTH axes, so no ring and no spoke is ever a
  //  single colour. A small gold rosette at the boss, green + dark accents at
  //  the rim. The alternation is keyed to the Erdős pattern's own symmetry order
  //  m (θ=60°→12 spokes, θ=45°→8, …), and richness within a colour family is
  //  taken from the symmetry-folded position so the weave repeats per petal.
  //
  //    Reims     — red/blue polar checkerboard, gold boss, green rim (panel b)
  //    Armature  — coarser, bolder medieval checkerboard (ruby/cobalt/gold)
  //    Pinwheel  — sheared spoke index → diagonal spiral weave through jewels
  //    Mosaic    — full jewel set keyed by folded position (rich repeating petals)
  //    Tiffany   — favrile organic flow (folded, still symmetric)
  //    Harlequin — high-variety jewels, folded to repeat per petal
  const COLORINGS = ['Reims', 'Armature', 'Pinwheel', 'Mosaic', 'Tiffany', 'Harlequin'];

  function fract(v) { return v - Math.floor(v); }
  function hash21(x, y) { return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const tl = hash21(xi, yi), tr = hash21(xi + 1, yi);
    const bl = hash21(xi, yi + 1), br = hash21(xi + 1, yi + 1);
    return mix(mix(tl, tr, u), mix(bl, br, u), v);
  }
  function fbm(x, y) {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; }
    return s;
  }
  function pick(arr, h) { return arr[Math.floor(fract(h) * arr.length) % arr.length]; }

  //  Detect the rotational symmetry order of the generated point set: the
  //  largest m (from a candidate list) for which rotating every interior point
  //  by 2π/m lands back on a point. Interior-only so a square (un-windowed)
  //  extent's clipped boundary doesn't hide the symmetry.
  let symOrder = 6;
  function detectSymmetry() {
    if (nPts < 8) return 4;
    const occ = new Set();
    for (let i = 0; i < nPts; i++) occ.add(Math.round(P[2*i]*1e4) + ',' + Math.round(P[2*i+1]*1e4));
    const rlim = 0.62 * maxR;
    const test = [];
    for (let i = 0; i < nPts; i++) if (Math.hypot(P[2*i], P[2*i+1]) <= rlim) test.push(i);
    if (test.length < 16) for (let i = 0; i < nPts; i++) test.push(i);
    for (const m of [24, 20, 16, 12, 10, 8, 6, 5, 4]) {
      const c = Math.cos(2*Math.PI/m), s = Math.sin(2*Math.PI/m);
      let hit = 0;
      for (const i of test) {
        const x = P[2*i], y = P[2*i+1];
        if (occ.has(Math.round((x*c - y*s)*1e4) + ',' + Math.round((x*s + y*c)*1e4))) hit++;
      }
      if (hit / test.length >= 0.9) return m;
    }
    return 4;
  }

  //  The colour symmetry order. The finite (a,b,c,d) box only preserves the
  //  4-fold (×i) and the ζ₈ 8-fold exactly — the higher ζ_n symmetry the eye
  //  reads in the interior is clipped at the box edge, so raw detection under-
  //  reports it. At a clean ζ_n angle we therefore take the design order
  //  lcm(n,4) (e.g. θ=60° → 12, θ=36° → 20); off the special angles we trust
  //  the honest detection (usually 4-fold from ×i alone).
  function patternSymmetry() {
    const q = 360 / S.theta;
    const n = Math.round(q);
    if (n < 2 || Math.abs(q - n) > 0.08) return detectSymmetry();
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    return Math.min(24, n * 4 / gcd(n, 4));
  }

  //  Fold a centroid into one dihedral fundamental wedge (rotation by 2π/m +
  //  mirror). Symmetric faces map to the same canonical (fx,fy), so colouring
  //  from it is automatically m-fold symmetric, like a rose window's petals.
  function foldCanon(cx, cy) {
    const wedge = 2 * Math.PI / symOrder;
    const r = Math.hypot(cx, cy);
    let a = Math.atan2(cy, cx);
    a -= wedge * Math.floor(a / wedge);          // into [0, wedge)
    if (a > wedge * 0.5) a = wedge - a;          // mirror fold
    return [r * Math.cos(a), r * Math.sin(a), r];
  }
  //  Symmetric cathedral-glass mottle (computed from canonical coords so it
  //  repeats identically in every petal).
  function streakF(fx, fy) {
    return (fbm(fx * 0.5 + 5, fy * 0.5 - 2) - 0.5) * 0.24
         + (hash21(fx * 3.7, fy * 2.3) - 0.5) * 0.12;
  }

  //  Jewel families for the red/blue weave, plus boss and rim accents.
  const REDS   = [J.ruby, J.crimson, J.rose];
  const BLUES  = [J.cobalt, J.blue, J.azure];
  const GOLDS  = [J.gold, J.honey, J.cream, J.amber];
  const GREENS = [J.emerald, J.green, J.teal, J.moss];
  const DARKS  = [J.violet, J.plum, J.cobalt, J.crimson];
  const JEWELS = [J.cobalt, J.blue, J.azure, J.ruby, J.crimson, J.rose, J.gold,
                  J.amber, J.emerald, J.green, J.teal, J.violet, J.plum, J.cream];
  const PINS   = [J.cobalt, J.ruby, J.gold, J.emerald, J.azure, J.crimson, J.amber, J.teal];
  const TIFFANY= [J.teal, J.emerald, J.green, J.honey, J.amber, J.azure, J.blue, J.violet];

  //  Polar address of a centroid: which angular spoke (of m = symOrder) and
  //  which radial ring it lands in. The checkerboard parity of (spoke+ring) is
  //  what breaks the concentric "target" look — colour alternates along both
  //  the ring and the spoke, exactly like the Reims medallions.
  function polar(cx, cy, rings) {
    const m = Math.max(4, symOrder);
    const ang = Math.atan2(cy, cx);
    const spoke = Math.floor(fract((ang + Math.PI) / (2 * Math.PI)) * m);
    const rn = Math.min(0.999, Math.hypot(cx, cy) / maxR);
    const ring = Math.floor(rn * rings);
    return { spoke, ring, rn };
  }

  //  cx,cy are math-plane centroids. Returns a THREE.Color (linear space).
  //  Richness within a colour family is keyed to the SYMMETRY-FOLDED position
  //  (fx,fy) so the weave repeats identically in every petal.
  function glassColor(cx, cy) {
    const [fx, fy] = foldCanon(cx, cy);
    let base;
    switch (S.coloring) {
      case 'Armature': {
        // coarse, bold medieval weave — few rings, pure ruby/cobalt + gold boss
        const { spoke, ring, rn } = polar(cx, cy, 4);
        if (rn < 0.14) base = pick(GOLDS, hash21(fx * 2.0, fy * 2.0));
        else base = pick((spoke + ring) & 1 ? REDS : BLUES, hash21(fx * 1.6, fy * 1.6));
        return nudge(new THREE.Color(base), streakF(fx, fy) * 0.7);
      }
      case 'Pinwheel': {
        // shear the spoke index by ring → diagonal spiral, cycling jewels
        const { spoke, ring, rn } = polar(cx, cy, 7);
        if (rn < 0.10) base = pick(GOLDS, hash21(fx, fy));
        else { const idx = ((spoke + ring) % PINS.length + PINS.length) % PINS.length; base = PINS[idx]; }
        return nudge(new THREE.Color(base), streakF(fx, fy));
      }
      case 'Mosaic':
        base = pick(JEWELS, hash21(fx * 2.3 + 1.1, fy * 2.9 - 0.7));
        break;
      case 'Tiffany': {
        const wx = fx + (fbm(fx * 0.35, fy * 0.35) - 0.5) * 5;
        const wy = fy + (fbm(fx * 0.35 + 9, fy * 0.35 + 9) - 0.5) * 5;
        const t = fbm(wx * 0.3, wy * 0.3) * (TIFFANY.length - 1);
        const i0 = Math.min(TIFFANY.length - 1, Math.floor(t)), i1 = Math.min(TIFFANY.length - 1, i0 + 1);
        return nudge(new THREE.Color(TIFFANY[i0]).lerp(new THREE.Color(TIFFANY[i1]), t - i0), streakF(fx, fy));
      }
      case 'Harlequin':
        base = pick(JEWELS, hash21(fx * 1.7 + 7, fy * 1.3 - 5));
        return nudge(new THREE.Color(base), streakF(fx, fy) * 1.2);
      case 'Reims':
      default: {
        // red/blue polar checkerboard, gold rosette boss, green+dark woven rim
        const NR = 7;
        const { spoke, ring, rn } = polar(cx, cy, NR);
        let fam;
        if (rn < 0.11)        fam = GOLDS;                                  // central boss
        else if (ring >= NR - 1) fam = (spoke & 1) ? GREENS : DARKS;        // woven rim
        else                  fam = (spoke + ring) & 1 ? REDS : BLUES;      // body weave
        base = pick(fam, hash21(fx * 2.6, fy * 2.2));
        break;
      }
    }
    return nudge(new THREE.Color(base), streakF(fx, fy));
  }

  //  Nudge value toward white (f>0) or black (f<0). THREE.Color from a hex
  //  string converts sRGB → linear working space, same as p64.
  function nudge(col, f) {
    const t = f > 0 ? 1 : 0, a = Math.min(0.85, Math.abs(f));
    col.r += (t - col.r) * a;
    col.g += (t - col.g) * a;
    col.b += (t - col.b) * a;
    return col;
  }

  // =============================================================== Layout
  injectStyles();
  const root = document.createElement('div');
  root.className = 'p66-root';
  document.body.appendChild(root);

  const sidebar = document.createElement('div');
  sidebar.className = 'p66-sidebar';
  root.appendChild(sidebar);
  sidebar.innerHTML = `
    <div class="p66-brand">
      <div class="p66-title">P66 · CATHEDRAL UNIT-DISTANCE GLASS</div>
      <div class="p66-sub">p65's unit-distance field as leaded glass,<br>lit by p64's volumetric god rays</div>
    </div>
    <div class="p66-ctrl">
      <div class="p66-block">
        <div class="p66-lbl">PATTERN PRESET</div>
        <div class="p66-presets" id="p66-presets"></div>
      </div>
      <div class="p66-block">
        <div class="p66-lbl">GENERATOR</div>
        <div class="p66-srow">
          <div class="p66-srow-lbl">ρ ANGLE θ <span id="p66-theta-v">60°</span></div>
          <input type="range" class="p66-slider" id="p66-theta" min="0" max="180" step="0.5" value="60">
        </div>
        <div class="p66-srow">
          <div class="p66-srow-lbl">EXTENT k <span id="p66-k-v">3</span></div>
          <input type="range" class="p66-slider" id="p66-k" min="1" max="3" step="1" value="3">
        </div>
        <div class="p66-toggle-row">
          <button class="p66-chip" id="p66-win">WINDOW ON</button>
          <input type="range" class="p66-slider p66-slider-inline" id="p66-R" min="1" max="8" step="0.1" value="4">
          <span class="p66-inline-v" id="p66-R-v">4.0</span>
        </div>
      </div>
      <div class="p66-block">
        <div class="p66-lbl">EQUATION · w(t)</div>
        <div class="p66-equations" id="p66-equations"></div>
      </div>
      <div class="p66-block">
        <div class="p66-lbl">VIEW</div>
        <div class="p66-toggle">
          <button class="p66-mode" data-mode="viewing">Viewing</button>
          <button class="p66-mode" data-mode="lighting">Lighting</button>
        </div>
      </div>
      <div class="p66-block">
        <div class="p66-lbl">GLASS COLORING</div>
        <div class="p66-chips" id="p66-colorings"></div>
        <div class="p66-chips" id="p66-toggles">
          <button class="p66-chip active" data-t="lead">Leading</button>
          <button class="p66-chip active" data-t="grid">Glass grid</button>
        </div>
      </div>
      <div class="p66-block">
        <div class="p66-lbl">SUN POSITION</div>
        <div class="p66-pad" id="p66-pad"><div class="p66-pad-dot" id="p66-pad-dot"></div></div>
      </div>
      <div class="p66-block p66-block-sliders">
        <div class="p66-srow">
          <div class="p66-srow-lbl">OPACITY <span id="p66-op-val">100%</span></div>
          <input type="range" class="p66-slider" id="p66-op" min="0.20" max="1.00" step="0.01" value="1">
        </div>
        <div class="p66-srow">
          <div class="p66-srow-lbl">DISTANCE <span id="p66-dist-val">3.0</span></div>
          <input type="range" class="p66-slider" id="p66-dist" min="${LIGHT_Z_MIN}" max="${LIGHT_Z_MAX}" step="0.1" value="${S.lightZ}">
        </div>
        <div class="p66-srow">
          <div class="p66-srow-lbl">INTENSITY <span id="p66-int-val">150%</span></div>
          <input type="range" class="p66-slider" id="p66-int" min="0" max="3" step="0.01" value="${S.intensity}">
        </div>
        <div class="p66-srow">
          <div class="p66-srow-lbl">KERNEL K <span id="p66-k-val">4.00</span></div>
          <input type="range" class="p66-slider" id="p66-k-kern" min="0.2" max="4.0" step="0.01" value="${S.K}">
        </div>
      </div>
      <div class="p66-readout" id="p66-readout"></div>
    </div>
  `;

  const stage = document.createElement('div');
  stage.className = 'p66-stage';
  root.appendChild(stage);

  const canvas = document.createElement('canvas');
  canvas.className = 'p66-canvas';
  stage.appendChild(canvas);

  // ====================================================== Common scene
  //  mainScene seeds the god rays (dark panel + coloured medallion + sun);
  //  overlayScene holds the chrome that must NOT seed rays (frame + leading),
  //  drawn on top of the composite — exactly p64's split.
  function buildCommonScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    renderer.autoClear = false;

    const mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0x000000);
    const overlayScene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
    camera.position.set(2.5, 6.0, 24);
    camera.lookAt(0, 0, 0);

    // Frame (square stone surround).
    const frameMat = new THREE.MeshBasicMaterial({ color: 0xb8c0d0 });
    const FRAME_T = 0.15, FRAME_D = 0.18;
    const fW = PANE_W + FRAME_T * 2, fH = PANE_H + FRAME_T * 2;
    const frame = new THREE.Group();
    const top   = new THREE.Mesh(new THREE.BoxGeometry(fW, FRAME_T, FRAME_D), frameMat);
    const bot   = top.clone();
    const left  = new THREE.Mesh(new THREE.BoxGeometry(FRAME_T, fH, FRAME_D), frameMat);
    const right = left.clone();
    top.position.y   =  PANE_H / 2 + FRAME_T / 2;
    bot.position.y   = -PANE_H / 2 - FRAME_T / 2;
    left.position.x  = -PANE_W / 2 - FRAME_T / 2;
    right.position.x =  PANE_W / 2 + FRAME_T / 2;
    frame.add(top, bot, left, right);
    frame.position.z = PANE_T * 0.5;
    overlayScene.add(frame);

    // Dark glass field behind the medallion (the "clear glass" panel). A touch
    // of blue so it reads as tinted glass rather than void where the medallion
    // doesn't reach.
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(PANE_W, PANE_H),
      new THREE.MeshBasicMaterial({ color: 0x0b1430 }));
    panel.position.z = 0;
    panel.renderOrder = 0;
    mainScene.add(panel);

    // Panel "clear glass" grid — a faint off-white lattice that FILLS ONLY the
    // empty space between the medallion and the pane, never over the coloured
    // pattern (overlaying it would wash the colours). We build an occupancy
    // mask of which grid cells the medallion covers, then emit a grid edge only
    // where both cells it borders are empty — so the lattice sits in the gap and
    // stops cleanly at the pattern. Pitch tracks the pattern's piece size.
    const gridGeom = new THREE.BufferGeometry();
    const gridLines = new THREE.LineSegments(gridGeom,
      new THREE.LineBasicMaterial({ color: 0xeef2f8, transparent: true, opacity: 0.18, depthWrite: false }));
    gridLines.frustumCulled = false;
    gridLines.position.z = PANE_T * 0.55;
    overlayScene.add(gridLines);

    function rebuildGrid() {
      const worldScale = (PANE_HALF * FILL) / maxR;
      const pitch = Math.max(0.06, Math.min(1.3, patternCell * worldScale));
      const ox = -PANE_W / 2, oy = -PANE_H / 2;
      const cols = Math.ceil(PANE_W / pitch), rows = Math.ceil(PANE_H / pitch);

      // 1 — mark cells the medallion covers (a face centroid lands in them).
      let occ = new Uint8Array(cols * rows);
      for (const f of faces) {
        const ci = Math.floor((f.cx * worldScale - ox) / pitch);
        const cj = Math.floor((f.cy * worldScale - oy) / pitch);
        if (ci >= 0 && ci < cols && cj >= 0 && cj < rows) occ[cj * cols + ci] = 1;
      }
      // 2 — dilate twice so pieces larger than a cell don't leave interior
      //     holes (which would let the grid poke through the pattern).
      for (let pass = 0; pass < 2; pass++) {
        const nxt = occ.slice();
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          if (occ[j * cols + i]) continue;
          if ((i > 0 && occ[j*cols+i-1]) || (i < cols-1 && occ[j*cols+i+1]) ||
              (j > 0 && occ[(j-1)*cols+i]) || (j < rows-1 && occ[(j+1)*cols+i])) nxt[j*cols+i] = 1;
        }
        occ = nxt;
      }
      const covered = (i, j) => (i >= 0 && i < cols && j >= 0 && j < rows) ? occ[j*cols+i] : 0;

      // 3 — emit a grid edge only between two empty cells (so the lattice fills
      //     the gap and never crosses the pattern).
      const pts = [];
      for (let i = 0; i <= cols; i++) {          // vertical edges
        const x = ox + i * pitch;
        for (let j = 0; j < rows; j++)
          if (!covered(i - 1, j) && !covered(i, j))
            pts.push(x, oy + j * pitch, 0, x, oy + (j + 1) * pitch, 0);
      }
      for (let j = 0; j <= rows; j++) {          // horizontal edges
        const y = oy + j * pitch;
        for (let i = 0; i < cols; i++)
          if (!covered(i, j - 1) && !covered(i, j))
            pts.push(ox + i * pitch, y, 0, ox + (i + 1) * pitch, y, 0);
      }
      gridGeom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      gridGeom.attributes.position.needsUpdate = true;
    }

    // Medallion — one merged mesh of all coloured face triangles. Rebuilt on
    // every parameter change. Flat vertex-coloured polygons facing the camera
    // seed the god rays just like p64's lit cells.
    const medGeom = new THREE.BufferGeometry();
    const medMat  = new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, opacity: S.opacity,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const medMesh = new THREE.Mesh(medGeom, medMat);
    medMesh.frustumCulled = false;
    medMesh.renderOrder = 2;
    medMesh.position.z = PANE_T * 0.5 + 0.02;
    mainScene.add(medMesh);

    // Leading — the unit-distance edges drawn as off-white came lines (like
    // the panel's glass borders), on the overlay so they show the pattern's
    // wire structure without seeding rays.
    const leadGeom = new THREE.BufferGeometry();
    const leadMat  = new THREE.LineBasicMaterial({
      color: 0xeef2f8, transparent: true, opacity: 0.5, depthWrite: false,
    });
    const leadLines = new THREE.LineSegments(leadGeom, leadMat);
    leadLines.position.z = PANE_T * 0.5 + 0.05;
    leadLines.frustumCulled = false;
    overlayScene.add(leadLines);

    //  Rebuilds positions AND colours. Colour is computed here (not stored on
    //  the face) so switching palette or coloring scheme is a cheap re-colour
    //  without re-extracting the arrangement.
    function rebuildMedallion() {
      const worldScale = (PANE_HALF * FILL) / maxR;
      const positions = [];
      const colors = [];
      for (const f of faces) {
        const poly = f.poly;
        const col = glassColor(f.cx, f.cy);
        const cx = f.cx * worldScale, cy = f.cy * worldScale;
        // triangle fan from the centroid (faces are convex / star-shaped)
        for (let i = 0; i < poly.length; i++) {
          const a = poly[i], b = poly[(i + 1) % poly.length];
          positions.push(cx, cy, 0,
            a[0] * worldScale, a[1] * worldScale, 0,
            b[0] * worldScale, b[1] * worldScale, 0);
          for (let t = 0; t < 3; t++) colors.push(col.r, col.g, col.b);
        }
      }
      medGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      medGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      medGeom.attributes.position.needsUpdate = true;
      medGeom.attributes.color.needsUpdate = true;

      const lp = [];
      for (const s of unitSegs) {
        lp.push(s[0] * worldScale, s[1] * worldScale, 0,
                s[2] * worldScale, s[3] * worldScale, 0);
      }
      leadGeom.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      leadGeom.attributes.position.needsUpdate = true;

      //  Dynamic leading opacity: dense patterns (small pieces, many came
      //  lines) wash white if drawn as strongly as a sparse one. Scale opacity
      //  with the piece size so a sparse panel (ζ₈ Octagon) keeps its crisp
      //  came while a very dense one (Dense Core) drops to a faint tracery.
      leadMat.opacity = Math.max(0.10, Math.min(0.52, 0.10 + (patternCell - 0.03) * 7));

      rebuildGrid();                  // keep the glass grid at the pattern's scale
    }

    function setOpacity(v) { medMat.opacity = v; }
    function setLeadVisible(v) { leadLines.visible = v; }
    function setGridVisible(v) { gridLines.visible = v; }

    // Sun (identical to p64).
    const sunGroup = new THREE.Group();
    const sunCore  = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0xfff5d0 }));
    const sunHalo  = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 14),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vN; varying vec3 vV;
          void main() {
            float f = max(dot(normalize(vN), normalize(vV)), 0.0);
            float g = pow(f, 2.5);
            gl_FragColor = vec4(vec3(1.0, 0.85, 0.45) * g, g * 0.9);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
    sunGroup.add(sunCore, sunHalo);
    mainScene.add(sunGroup);

    function updateSunPos(lightPos) { sunGroup.position.copy(lightPos); }

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }

    return {
      renderer, mainScene, overlayScene, camera, canvas,
      rebuildMedallion, updateSunPos, setOpacity, setLeadVisible, setGridVisible, resize,
    };
  }

  // ==================================================================
  //  GOD-RAY POST-PROCESS PASS  (verbatim from p64)
  // ==================================================================
  function setupGodRayPass(ctx, variants) {
    const { renderer, mainScene, overlayScene, camera, canvas } = ctx;

    let rt = new THREE.WebGLRenderTarget(
      Math.max(1, canvas.clientWidth || 1),
      Math.max(1, canvas.clientHeight || 1),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        type: THREE.UnsignedByteType,
      });

    const u = {
      uScene:       { value: rt.texture },
      uLightScreen: { value: new THREE.Vector2(0.5, 0.7) },
      uIntensity:   { value: S.intensity },
      uK:           { value: S.K },
      uSunVisible:  { value: 1.0 },
    };

    function makeMat(weightGLSL) {
      return new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uScene;
          uniform vec2 uLightScreen;
          uniform float uIntensity;
          uniform float uK;
          uniform float uSunVisible;
          varying vec2 vUv;

          float weight(float t, float K) {
            ${weightGLSL}
          }

          float hash21(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            vec3 base = texture2D(uScene, vUv).rgb;

            vec2 dir = uLightScreen - vUv;
            float dist = length(dir);
            if (dist < 0.0008 || uSunVisible < 0.5) {
              gl_FragColor = vec4(base, 1.0);
              return;
            }
            vec2 ndir = dir / dist;

            const int SAMPLES = 56;
            vec3 sum = vec3(0.0);
            float wSum = 0.0;

            float jitter = hash21(vUv * 1024.0) - 0.5;

            for (int i = 0; i < SAMPLES; i++) {
              float t  = clamp((float(i) + jitter) / float(SAMPLES), 0.0, 1.0);
              vec2  p  = vUv + ndir * (t * dist);
              vec3  c  = texture2D(uScene, p).rgb;
              float v = max(max(c.r, c.g), c.b);
              float m = min(min(c.r, c.g), c.b);
              float bright = max(v, (v - m) * 1.5);
              float mask = smoothstep(0.05, 0.40, bright);
              float w    = max(0.0, weight(t, uK));
              sum   += c * mask * w;
              wSum  += w;
            }
            sum /= max(wSum, 0.0001);
            sum *= uIntensity * 1.9;

            vec3 outc = base + sum;
            outc = outc / (1.0 + outc * 0.55);
            gl_FragColor = vec4(outc, 1.0);
          }
        `,
        depthTest: false,
        depthWrite: false,
      });
    }

    const materials = variants.map(v => makeMat(v.glsl));

    const blurScene  = new THREE.Scene();
    const blurCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const blurQuad   = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materials[0]);
    blurScene.add(blurQuad);

    function ensureRtSize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const tw = Math.max(1, Math.floor(w * dpr));
      const th = Math.max(1, Math.floor(h * dpr));
      if (rt.width !== tw || rt.height !== th) rt.setSize(tw, th);
    }

    return {
      setVariant(idx) {
        blurQuad.material = materials[Math.max(0, Math.min(materials.length - 1, idx))];
      },
      customRender() {
        ensureRtSize();

        renderer.setRenderTarget(rt);
        renderer.clear();
        renderer.render(mainScene, camera);
        renderer.setRenderTarget(null);

        const proj = getLightPos().clone().project(camera);
        const behind = proj.z > 1.0 || proj.z < -1.0;
        u.uSunVisible.value = behind ? 0.0 : 1.0;
        u.uLightScreen.value.set((proj.x + 1) * 0.5, (proj.y + 1) * 0.5);
        u.uIntensity.value = S.intensity;
        u.uK.value         = S.K;

        renderer.clear();
        renderer.render(blurScene, blurCamera);
        renderer.render(overlayScene, camera);
      },
    };
  }

  // ============================================================ Equations
  const E_VARIANTS = [
    { id: 'E1', name: 'LINEAR',      formula: 'w(t) = max(1 − K·t, 0)',  glsl: 'return max(0.0, 1.0 - K * t);' },
    { id: 'E2', name: 'POWER',       formula: 'w(t) = (1 − t)^(3·K)',     glsl: 'return pow(max(0.0, 1.0 - t), 3.0 * K);' },
    { id: 'E3', name: 'EXPONENTIAL', formula: 'w(t) = e^(−4·K·t)',        glsl: 'return exp(-4.0 * K * t);' },
  ];

  // ============================================================ Build pass
  const ctx  = buildCommonScene(canvas);
  const pass = setupGodRayPass(ctx, E_VARIANTS);
  pass.setVariant(S.variantIdx);

  function rebuildPattern() {
    buildGraph();
    symOrder = patternSymmetry();   // colour symmetry follows the pattern
    buildFaces();
    ctx.rebuildMedallion();
    updateReadout();
  }
  function applyLight() { ctx.updateSunPos(getLightPos()); }

  // ============================================================ Camera
  //  (verbatim from p64) viewing = locked front; lighting = orbit + zoom.
  const cam = {
    theta: 0,    phi: 0.05, radius: 24,
    fromTheta: 0, fromPhi: 0.05, fromRadius: 24,
    toTheta:   0, toPhi:   0.05, toRadius:   24,
    t: 1,
  };
  const TRANSITION_S = 0.9;
  function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
  function lerp(a, b, k)     { return a + (b - a) * k; }
  function viewingTarget()   { return { theta: 0,     phi: 0.05, radius: 24 }; }
  function lightingTarget()  { return { theta: -0.55, phi: 0.30, radius: 42 }; }

  function applyMode(mode, animate = true) {
    S.mode = mode;
    cam.fromTheta = cam.theta; cam.fromPhi = cam.phi; cam.fromRadius = cam.radius;
    const target = (mode === 'viewing') ? viewingTarget() : lightingTarget();
    cam.toTheta = target.theta; cam.toPhi = target.phi; cam.toRadius = target.radius;
    if (animate) { cam.t = 0; }
    else { cam.t = 1; cam.theta = target.theta; cam.phi = target.phi; cam.radius = target.radius; }
  }
  applyMode(S.mode, false);

  canvas.style.touchAction = 'none';
  let dragging = false, lastX = 0, lastY = 0, activePtr = null;
  canvas.addEventListener('pointerdown', e => {
    if (S.mode !== 'lighting') return;
    dragging = true; lastX = e.clientX; lastY = e.clientY; activePtr = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== activePtr) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    cam.theta -= dx * 0.006;
    cam.phi    = Math.max(-1.45, Math.min(1.45, cam.phi + dy * 0.006));
    cam.t = 1;
  });
  function endDrag(e) {
    if (e.pointerId !== activePtr) return;
    dragging = false; activePtr = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  canvas.addEventListener('pointerup',     endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', e => {
    if (S.mode !== 'lighting') return;
    e.preventDefault();
    cam.radius = Math.max(12, Math.min(220, cam.radius * (1 + e.deltaY * 0.0008)));
    cam.t = 1;
  }, { passive: false });

  // ============================================================ Controls
  const presetsEl = document.getElementById('p66-presets');
  PRESETS.forEach((p, idx) => {
    const b = document.createElement('button');
    b.className = 'p66-preset' + (idx === S.presetIdx ? ' active' : '');
    b.textContent = p.name;
    b.addEventListener('click', () => applyPreset(idx));
    presetsEl.appendChild(b);
  });
  function applyPreset(idx) {
    const p = PRESETS[idx];
    S.presetIdx = idx;
    S.theta = p.theta; S.mag = p.mag; S.k = p.k;
    S.dist = p.dist; S.tol = p.tol; S.win = p.win; S.R = p.R;
    presetsEl.querySelectorAll('.p66-preset').forEach((el, i) => el.classList.toggle('active', i === idx));
    syncGenerator();
    rebuildPattern();
  }
  function clearPreset() {
    S.presetIdx = -1;
    presetsEl.querySelectorAll('.p66-preset').forEach(el => el.classList.remove('active'));
  }

  // Generator sliders
  const thetaInput = document.getElementById('p66-theta');
  const thetaVal   = document.getElementById('p66-theta-v');
  thetaInput.addEventListener('input', () => {
    S.theta = parseFloat(thetaInput.value);
    thetaVal.textContent = S.theta + '°';
    clearPreset(); rebuildPattern();
  });
  const kInput = document.getElementById('p66-k');
  const kValG  = document.getElementById('p66-k-v');
  kInput.addEventListener('input', () => {
    S.k = parseInt(kInput.value, 10);
    kValG.textContent = String(S.k);
    clearPreset(); rebuildPattern();
  });
  const winChip = document.getElementById('p66-win');
  const rInput  = document.getElementById('p66-R');
  const rVal    = document.getElementById('p66-R-v');
  winChip.addEventListener('click', () => {
    S.win = !S.win; syncWinChip(); clearPreset(); rebuildPattern();
  });
  rInput.addEventListener('input', () => {
    S.R = parseFloat(rInput.value);
    rVal.textContent = S.R.toFixed(1);
    if (S.win) { clearPreset(); rebuildPattern(); }
  });
  function syncWinChip() {
    winChip.textContent = S.win ? 'WINDOW ON' : 'WINDOW OFF';
    winChip.classList.toggle('active', S.win);
  }
  function syncGenerator() {
    thetaInput.value = S.theta; thetaVal.textContent = S.theta + '°';
    kInput.value = S.k; kValG.textContent = String(S.k);
    rInput.value = S.R; rVal.textContent = S.R.toFixed(1);
    syncWinChip();
  }

  // Equation picker
  const eqEl = document.getElementById('p66-equations');
  E_VARIANTS.forEach((v, idx) => {
    const b = document.createElement('button');
    b.className = 'p66-eq' + (idx === S.variantIdx ? ' active' : '');
    b.innerHTML = `<span class="p66-eq-name">${v.id} · ${v.name}</span><span class="p66-eq-formula">${v.formula}</span>`;
    b.addEventListener('click', () => {
      S.variantIdx = idx;
      eqEl.querySelectorAll('.p66-eq').forEach(x => x.classList.toggle('active', x === b));
      pass.setVariant(idx);
    });
    eqEl.appendChild(b);
  });

  // View toggle
  sidebar.querySelectorAll('.p66-mode').forEach(b => {
    if (b.dataset.mode === S.mode) b.classList.add('active');
    b.addEventListener('click', () => {
      sidebar.querySelectorAll('.p66-mode').forEach(x => x.classList.toggle('active', x === b));
      applyMode(b.dataset.mode, true);
    });
  });

  // Coloring scheme picker — six real-glass looks, colour-only (no re-extract).
  const coloringsEl = document.getElementById('p66-colorings');
  COLORINGS.forEach(name => {
    const b = document.createElement('button');
    b.className = 'p66-chip p66-coloring' + (name === S.coloring ? ' active' : '');
    b.dataset.coloring = name; b.textContent = name;
    b.addEventListener('click', () => {
      S.coloring = name;
      coloringsEl.querySelectorAll('.p66-coloring').forEach(el => el.classList.toggle('active', el.dataset.coloring === name));
      ctx.rebuildMedallion();          // colour-only
    });
    coloringsEl.appendChild(b);
  });

  // Leading / glass-grid toggles
  document.querySelectorAll('#p66-toggles .p66-chip').forEach(b => {
    b.addEventListener('click', () => {
      const t = b.dataset.t;
      if (t === 'lead') { S.showLead = !S.showLead; b.classList.toggle('active', S.showLead); ctx.setLeadVisible(S.showLead); }
      if (t === 'grid') { S.showGrid = !S.showGrid; b.classList.toggle('active', S.showGrid); ctx.setGridVisible(S.showGrid); }
    });
  });

  // Sun pad
  const pad    = document.getElementById('p66-pad');
  const padDot = document.getElementById('p66-pad-dot');
  const PAD_R  = 72;
  function refreshPad() {
    const cs = getComputedStyle(pad);
    const padW = parseFloat(cs.width), padH = parseFloat(cs.height);
    padDot.style.left = (padW / 2 + (S.lightX / LIGHT_RANGE) * PAD_R) + 'px';
    padDot.style.top  = (padH / 2 - (S.lightY / LIGHT_RANGE) * PAD_R) + 'px';
  }
  function padFromClient(cx, cy) {
    const r = pad.getBoundingClientRect();
    let dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height / 2);
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d > PAD_R) { dx *= PAD_R / d; dy *= PAD_R / d; }
    S.lightX =  (dx / PAD_R) * LIGHT_RANGE;
    S.lightY = -(dy / PAD_R) * LIGHT_RANGE;
    refreshPad(); applyLight();
  }
  let padDrag = false;
  pad.addEventListener('pointerdown', e => { padDrag = true; pad.setPointerCapture(e.pointerId); padFromClient(e.clientX, e.clientY); });
  pad.addEventListener('pointermove', e => { if (padDrag) padFromClient(e.clientX, e.clientY); });
  pad.addEventListener('pointerup',   e => { padDrag = false; try { pad.releasePointerCapture(e.pointerId); } catch (_) {} });

  // God-ray sliders
  const opInput = document.getElementById('p66-op');
  const opVal   = document.getElementById('p66-op-val');
  opInput.addEventListener('input', () => {
    S.opacity = parseFloat(opInput.value);
    opVal.textContent = Math.round(S.opacity * 100) + '%';
    ctx.setOpacity(S.opacity);
  });
  const distInput = document.getElementById('p66-dist');
  const distVal   = document.getElementById('p66-dist-val');
  distInput.addEventListener('input', () => {
    S.lightZ = parseFloat(distInput.value);
    distVal.textContent = S.lightZ.toFixed(1);
    applyLight();
  });
  const intInput = document.getElementById('p66-int');
  const intVal   = document.getElementById('p66-int-val');
  intInput.addEventListener('input', () => {
    S.intensity = parseFloat(intInput.value);
    intVal.textContent = Math.round(S.intensity * 100) + '%';
  });
  const kkInput = document.getElementById('p66-k-kern');
  const kkVal   = document.getElementById('p66-k-val');
  kkInput.addEventListener('input', () => {
    S.K = parseFloat(kkInput.value);
    kkVal.textContent = S.K.toFixed(2);
  });

  // Readout
  function updateReadout() {
    const th = S.theta * DEG;
    const rRe = (S.mag * Math.cos(th)).toFixed(3);
    const rIm = (S.mag * Math.sin(th)).toFixed(3);
    const avg = nPts ? (2 * nEdges / nPts).toFixed(2) : '0';
    const el = document.getElementById('p66-readout');
    if (!el) return;
    el.innerHTML = `
      <div class="p66-ro-row"><span>points</span><b>${nPts}</b></div>
      <div class="p66-ro-row"><span>unit edges</span><b>${nEdges}</b></div>
      <div class="p66-ro-row"><span>glass panes</span><b>${nPanes}</b></div>
      <div class="p66-ro-row"><span>symmetry</span><b>${symOrder}-fold</b></div>
      <div class="p66-ro-row"><span>avg degree</span><b>${avg}</b></div>
      <div class="p66-ro-rho">ρ = ${rRe} ${rIm >= 0 ? '+' : '−'} ${Math.abs(rIm)}i</div>
    `;
  }

  // ================================================================ Boot
  applyPreset(0);
  applyLight();
  requestAnimationFrame(refreshPad);

  // =============================================================== Loop
  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (cam.t < 1) {
      cam.t = Math.min(1, cam.t + dt / TRANSITION_S);
      const k = easeInOutCubic(cam.t);
      cam.theta  = lerp(cam.fromTheta,  cam.toTheta,  k);
      cam.phi    = lerp(cam.fromPhi,    cam.toPhi,    k);
      cam.radius = lerp(cam.fromRadius, cam.toRadius, k);
    }
    const cosPhi = Math.cos(cam.phi);
    ctx.camera.position.set(
      Math.sin(cam.theta) * cosPhi * cam.radius,
      Math.sin(cam.phi)   * cam.radius,
      Math.cos(cam.theta) * cosPhi * cam.radius,
    );
    ctx.camera.lookAt(0, 0, 0);

    ctx.resize();
    pass.customRender();
  }
  requestAnimationFrame(tick);

  window.addEventListener('resize', refreshPad);

  // ============================================================ Styles
  function injectStyles() {
    const css = `
      .p66-root{position:fixed;inset:0;display:flex;flex-direction:row;
        background:#000;color:#dcdfe6;font:11px/1.45 ui-monospace,Menlo,Consolas,monospace;
        letter-spacing:0.04em;}

      .p66-sidebar{flex:0 0 290px;display:flex;flex-direction:column;gap:20px;
        padding:20px 18px 18px;overflow-y:auto;
        background:linear-gradient(180deg,#0a0c12 0%,#050608 100%);
        border-right:1px solid rgba(255,255,255,0.06);
        box-shadow:1px 0 0 rgba(255,255,255,0.02);}
      .p66-sidebar::-webkit-scrollbar{width:8px;}
      .p66-sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.10);border-radius:4px;}

      .p66-brand{display:flex;flex-direction:column;gap:4px;
        padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.06);}
      .p66-title{font-size:11.5px;letter-spacing:0.16em;color:#f3d68a;}
      .p66-sub{font-size:10px;letter-spacing:0.06em;color:#7a8090;line-height:1.5;}

      .p66-ctrl{display:flex;flex-direction:column;gap:18px;}
      .p66-block{display:flex;flex-direction:column;gap:8px;align-items:stretch;}
      .p66-lbl{font-size:9px;letter-spacing:0.20em;opacity:0.5;}

      .p66-presets{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
      .p66-preset{padding:7px 8px;background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#aab0c0;
        cursor:pointer;font:inherit;font-size:10px;letter-spacing:0.02em;text-align:left;
        transition:all 0.14s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .p66-preset:hover{background:rgba(243,196,64,0.12);color:#fff;}
      .p66-preset.active{background:rgba(243,196,64,0.20);
        border-color:rgba(243,196,64,0.55);color:#ffd87a;}

      .p66-srow{display:flex;flex-direction:column;gap:3px;}
      .p66-srow-lbl{font-size:9px;letter-spacing:0.12em;opacity:0.6;
        display:flex;justify-content:space-between;}
      .p66-srow-lbl span{color:#ffd87a;opacity:1;}

      .p66-equations{display:flex;flex-direction:column;gap:5px;}
      .p66-eq{display:flex;flex-direction:column;align-items:flex-start;gap:3px;
        padding:8px 10px;background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);border-radius:6px;
        color:#a8acb8;cursor:pointer;font:inherit;text-align:left;transition:all 0.15s;}
      .p66-eq:hover{background:rgba(255,255,255,0.10);color:#f0f0f0;}
      .p66-eq.active{background:rgba(255,200,90,0.18);
        border-color:rgba(255,200,90,0.55);color:#ffd87a;}
      .p66-eq-name{font-size:10px;letter-spacing:0.16em;font-weight:500;}
      .p66-eq-formula{font-size:10px;color:inherit;opacity:0.82;
        letter-spacing:0.02em;font-style:italic;
        font-family:"Cambria Math","Latin Modern Math",Georgia,serif;}

      .p66-toggle{display:grid;grid-template-columns:1fr 1fr;gap:0;
        background:rgba(255,255,255,0.04);padding:3px;border-radius:7px;
        border:1px solid rgba(255,255,255,0.06);}
      .p66-mode{border:none;background:transparent;color:#a8acb8;font:inherit;font-size:10px;
        letter-spacing:0.10em;padding:7px 8px;border-radius:5px;cursor:pointer;transition:all 0.15s;}
      .p66-mode:hover{color:#f0f0f0;}
      .p66-mode.active{background:rgba(100,170,255,0.22);color:#a0d4ff;
        box-shadow:0 1px 0 rgba(100,170,255,0.20) inset;}

      .p66-toggle-row{display:flex;align-items:center;gap:9px;}
      .p66-slider-inline{flex:1;}
      .p66-inline-v{font-size:10px;color:#ffd87a;min-width:30px;text-align:right;}

      .p66-chips{display:flex;flex-wrap:wrap;gap:5px;}
      .p66-chip{padding:6px 10px;background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.09);border-radius:5px;color:#aab0c0;
        cursor:pointer;font:inherit;font-size:10px;letter-spacing:0.06em;transition:all 0.14s;}
      .p66-chip:hover{background:rgba(243,196,64,0.12);color:#fff;}
      .p66-chip.active{background:rgba(243,196,64,0.20);
        border-color:rgba(243,196,64,0.55);color:#ffd87a;}

      .p66-pad{position:relative;width:160px;height:160px;border-radius:50%;
        cursor:crosshair;align-self:center;margin:2px 0;
        background:radial-gradient(circle at 50% 50%,
          rgba(255,210,120,0.10) 0%, rgba(255,180,60,0.04) 30%,
          rgba(28,30,40,0.6) 78%, rgba(10,12,18,0.9) 100%);
        border:1px solid rgba(255,255,255,0.10);
        box-shadow:0 2px 14px rgba(0,0,0,0.4) inset;}
      .p66-pad::after{content:"";position:absolute;inset:6px;border-radius:50%;
        border:1px dashed rgba(255,255,255,0.07);pointer-events:none;}
      .p66-pad-dot{position:absolute;width:16px;height:16px;border-radius:50%;
        background:radial-gradient(circle,#fff5d0 0%,#ffb340 60%,rgba(255,160,40,0) 100%);
        box-shadow:0 0 14px #ffc870;transform:translate(-50%,-50%);pointer-events:none;}

      .p66-block-sliders{gap:10px;}
      .p66-slider{width:100%;-webkit-appearance:none;appearance:none;background:transparent;
        height:14px;cursor:pointer;}
      .p66-slider::-webkit-slider-runnable-track{height:3px;background:rgba(255,255,255,0.10);border-radius:2px;}
      .p66-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:11px;height:11px;
        border-radius:50%;background:#ffd87a;margin-top:-4px;cursor:grab;box-shadow:0 1px 4px rgba(0,0,0,0.5);}
      .p66-slider::-moz-range-track{height:3px;background:rgba(255,255,255,0.10);border-radius:2px;}
      .p66-slider::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:#ffd87a;border:none;cursor:grab;}

      .p66-readout{margin-top:2px;padding:11px 12px;border-radius:8px;
        background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
        display:flex;flex-direction:column;gap:5px;}
      .p66-ro-row{display:flex;justify-content:space-between;font-size:10px;color:#8a92a6;}
      .p66-ro-row b{color:#ffe6ad;font-weight:600;}
      .p66-ro-rho{margin-top:3px;padding-top:7px;border-top:1px solid rgba(255,255,255,0.06);
        font-size:10px;color:#ffd87a;letter-spacing:0.02em;}

      .p66-stage{flex:1 1 auto;position:relative;background:#000;
        min-width:0;min-height:0;overflow:hidden;}
      .p66-canvas{display:block;width:100%;height:100%;}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
