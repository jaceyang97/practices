/**
 * Practice 63 — Cathedral Glass
 *
 * A square stained-glass pane lit from CLOSE by a point sun fixed at a
 * short, constant distance behind the pane. Because the source is near,
 * rays from each cell DIVERGE in a fan — beams from edge cells angle
 * outward, beams from centre cells stay axial. The control pad simply
 * slides the light around on the plane PARALLEL to the pane (X,Y), with
 * Z held constant. Each cell is a glass tile: tinted colour or translucent
 * clear. Volumetric shafts use a tight bright core + wide soft halo for a
 * dust-lit cathedral feel.
 *
 * Code by Jace Yang
 */

function setup() { noCanvas(); kickoff(); }
function draw() {}
function windowResized() {}

async function kickoff() {
  document.documentElement.style.cssText = 'margin:0;padding:0;background:#000;';
  document.body.style.cssText =
    'margin:0;padding:0;background:#000;overflow:hidden;' +
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

  // ============================================================== Geometry
  const PANE_COLS = 15;
  const PANE_ROWS = 15;
  const CELL_W    = 1.0;
  const CELL_H    = 1.0;
  const PANE_W    = PANE_COLS * CELL_W;
  const PANE_H    = PANE_ROWS * CELL_H;
  const PANE_T    = 0.08;
  const FLOOR_Y   = -PANE_H / 2 - 1.6;
  const FLOOR_SIZE = 110;
  const CX = (PANE_COLS - 1) / 2;
  const CY = (PANE_ROWS - 1) / 2;
  const MAX_CELLS = PANE_COLS * PANE_ROWS;

  // ============================================================ Glass palette
  const C = {
    deepBlue:  '#15347a',
    blue:      '#2864c2',
    teal:      '#357d9a',
    ruby:      '#bd2236',
    crimson:   '#7d1b2c',
    amber:     '#d28a2a',
    gold:      '#eac35a',
    cream:     '#f1e2b6',
    green:     '#2a6f44',
    emerald:   '#3fa86a',
    purple:    '#6c2c8b',
    magenta:   '#a93478',
  };

  // ============================================================== Patterns
  //  Each function maps (col, row) to a hex colour for coloured glass, or
  //  `null` for clear (translucent white) glass. Every cell is glass — the
  //  pattern only decides whether the pane is tinted or clear.
  const PATTERNS = {
    'Crucifix':     crucifix,
    'Sunburst':     sunburst,
    'Compass Rose': compassRose,
  };

  function crucifix(c, r) {
    const dx = c - CX, dy = r - CY;
    const vBar = Math.abs(dx) <= 1;
    const hBarY = -2;
    const hBar = Math.abs(dy - hBarY) <= 1 && Math.abs(dx) <= 4;
    if (vBar && Math.abs(dy - hBarY) <= 1) return C.gold;
    if (vBar || hBar) return C.amber;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 7.6) return null;
    const stripe = (c + r) % 3;
    return [C.deepBlue, C.blue, C.deepBlue][stripe];
  }

  function sunburst(c, r) {
    const dx = c - CX, dy = r - CY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 7.6) return null;
    const angle = Math.atan2(dy, dx);
    if (dist < 1.4) return C.gold;
    if (dist < 2.4) return C.amber;
    const wedge = Math.floor(((angle + Math.PI) / (2*Math.PI)) * 16);
    const onRay = (wedge & 1) === 0;
    if (onRay) {
      if (dist < 5) return C.gold;
      return C.amber;
    }
    if (dist < 4) return C.crimson;
    if (dist < 6) return C.ruby;
    return C.deepBlue;
  }

  function compassRose(c, r) {
    const dx = c - CX, dy = r - CY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 7.6) return null;
    // Cardinal arms
    if (Math.abs(dx) <= 0.5 && Math.abs(dy) <= 6.6) return C.gold;
    if (Math.abs(dy) <= 0.5 && Math.abs(dx) <= 6.6) return C.gold;
    // Diagonal smaller arms
    if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.5 && dist < 4.5) return C.amber;
    if (dist < 1.4) return C.cream;
    // Background diamonds
    if (Math.floor(Math.abs(dx) + Math.abs(dy)) % 2 === 0) return C.deepBlue;
    return C.blue;
  }

  // ============================================================== Settings
  //  Light source lives on a plane PARALLEL to the glass at Z = -lightZ.
  //  Pad slides (lightX, lightY) within that plane; the distance slider
  //  controls lightZ separately. X/Y and Z are independent axes.
  const LIGHT_RANGE = 11;          // pad extent: ±LIGHT_RANGE in X and Y
  const LIGHT_Z_MIN = 2.5;         // closest the light can sit behind the pane
  const LIGHT_Z_MAX = 28;          // farthest

  const S = {
    pattern:       'Crucifix',
    mode:          'lighting',
    lightX:        0,              // light X on plane parallel to pane
    lightY:        8.0,            // light Y on plane parallel to pane (above centre)
    lightZ:        7.5,            // distance behind the pane
    glassOpacity:  0.96,
    beamIntensity: 1.30,
    beamWidth:     2.2,
    beamSoftness:  1.8,
  };

  // ================================================================ Scene
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(38, W()/H(), 0.1, 600);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // =============================================================== Floor
  const floorGeo = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.ShaderMaterial({
    uniforms: { uCells: { value: 45 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uCells;
      varying vec2 vUv;
      void main() {
        vec2 g = vUv * uCells;
        vec2 f = abs(fract(g - 0.5) - 0.5);
        vec2 d = fwidth(g);
        vec2 line = smoothstep(d * 0.0, d * 1.6, f);
        float edge = 1.0 - min(line.x, line.y);
        float distAlpha = smoothstep(0.55, 0.0, length(vUv - 0.5));
        gl_FragColor = vec4(vec3(edge * 0.18 * distAlpha), 1.0);
      }
    `,
  });
  floorMat.extensions = { derivatives: true };
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = FLOOR_Y;
  scene.add(floor);

  // ============================================================ Lead frame
  //  Real stained-glass cames are tin/lead — a cool silver tone reads as the
  //  metal grout between tiles and as the bright outer perimeter of the pane.
  const frameGeom = new THREE.BoxGeometry(PANE_W + 0.5, PANE_H + 0.5, PANE_T);
  const frameMat  = new THREE.MeshBasicMaterial({ color: 0xb6bcc6 });
  const paneFrame = new THREE.Mesh(frameGeom, frameMat);
  paneFrame.renderOrder = 1;
  scene.add(paneFrame);

  // ====================================================== Glass cells × 2
  //  Two InstancedMesh objects: one for COLOURED tiles (opaque-ish, vivid),
  //  one for CLEAR tiles (translucent white, mostly see-through). Real
  //  stained-glass windows are entirely glass — only some panes are tinted.
  // Two geometries — separate instance-color buffers per mesh
  function makeCellGeom() {
    const g = new THREE.BoxGeometry(CELL_W * 0.93, CELL_H * 0.93, PANE_T * 1.06);
    g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CELLS * 3), 3));
    return g;
  }

  //  Coloured glass: dead-flat solid colour. The reference look (clean tile
  //  + soft outer bloom + a strong volumetric beam below) only works when the
  //  tile itself stays uniform — any fresnel/edge highlight on the cell reads
  //  as a 3-D bevel and ruins the stained-glass illusion. All "glassiness"
  //  here comes from the surrounding lead came and the volumetric beam, not
  //  from per-tile shading.
  const colouredMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: S.glassOpacity } },
    vertexShader: `
      attribute vec3 aCol;
      varying vec3 vColor;
      void main() {
        vColor = aCol;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
  const colouredMesh = new THREE.InstancedMesh(makeCellGeom(), colouredMat, MAX_CELLS);
  colouredMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  colouredMesh.count = 0;
  colouredMesh.renderOrder = 2;
  colouredMesh.frustumCulled = false;
  scene.add(colouredMesh);

  //  Clear / unlit glass: opaque dark slab. The pane reads like the reference
  //  — a black grid of cells with a silver lead came showing through only in
  //  the inter-tile gaps + outer perimeter. Any "glow" near unlit cells comes
  //  from the additive volumetric beam haze of neighbouring lit cells, which
  //  is the right physics: light bleeding sideways through the glass plane.
  const clearMat = new THREE.MeshBasicMaterial({
    color: 0x07090c,
    transparent: false,
    depthWrite: true,
  });
  const clearGeom = new THREE.BoxGeometry(CELL_W * 0.93, CELL_H * 0.93, PANE_T * 1.06);
  const clearMesh = new THREE.InstancedMesh(clearGeom, clearMat, MAX_CELLS);
  clearMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  clearMesh.count = 0;
  clearMesh.renderOrder = 2;
  clearMesh.frustumCulled = false;
  scene.add(clearMesh);

  // ================================================================= Sun
  //  Sun sphere sits at the actual light position — a CLOSE point source
  //  on the plane parallel to the glass. Each glow layer is a sphere whose
  //  fragment uses dot(N, V) as a radial coordinate; powering down with
  //  different exponents gives a smooth exponential gradient stack rather
  //  than three flat concentric circles.
  const SUN_CORE_R     = 0.55;
  const SUN_CORONA_R   = 1.30;
  const SUN_GLOW_R     = 2.80;
  const SUN_BLOOM_R    = 5.40;

  function makeSunGlowMat(coreHex, edgeHex, sharp, intensity) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uCore:      { value: new THREE.Color(coreHex) },
        uEdge:      { value: new THREE.Color(edgeHex) },
        uSharp:     { value: sharp },
        uIntensity: { value: intensity },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uCore;
        uniform vec3 uEdge;
        uniform float uSharp;
        uniform float uIntensity;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewDir);
          float f = max(dot(N, V), 0.0);
          float g = pow(f, uSharp);
          vec3 col = mix(uEdge, uCore, g) * uIntensity * g;
          gl_FragColor = vec4(col, g * uIntensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }

  // Solid hot disc — the sun's actual photosphere
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_CORE_R, 40, 28),
    new THREE.MeshBasicMaterial({ color: 0xfffdf2 })
  );
  sunCore.renderOrder = 6;
  scene.add(sunCore);

  // Tight corona — bright warm-white halo wrapping the disc
  const sunCorona = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_CORONA_R, 40, 28),
    makeSunGlowMat(0xfff5d0, 0xffc864, 1.6, 1.35)
  );
  sunCorona.renderOrder = 7;
  scene.add(sunCorona);

  // Mid glow — amber spread
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_GLOW_R, 40, 28),
    makeSunGlowMat(0xffc878, 0xff8a30, 2.2, 0.65)
  );
  sunGlow.renderOrder = 8;
  scene.add(sunGlow);

  // Outer bloom — wide soft haze that fades to nothing
  const sunBloom = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_BLOOM_R, 40, 28),
    makeSunGlowMat(0xffa050, 0xff5020, 3.4, 0.26)
  );
  sunBloom.renderOrder = 9;
  scene.add(sunBloom);

  // ============================================================== Beams
  //  One per coloured cell. All beams share the SAME direction (parallel),
  //  giving a rigid sheared projection on the floor — not a fan.
  const PRE_LEN = 0.0;                  // pre-glass haze (0 = beam starts at glass)

  const beamMat = new THREE.ShaderMaterial({
    uniforms: {
      uIntensity: { value: S.beamIntensity },
      uSoftness:  { value: S.beamSoftness },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aTGlass;
      varying vec3 vColor;
      varying float vT;
      varying float vTGlass;
      varying vec2 vRad;
      void main() {
        vColor = aColor;
        vT = position.y;
        vTGlass = aTGlass;
        // Box geometry spans [-0.5, 0.5] in x and z; map to [-1, 1] for radial use
        vRad = vec2(position.x, position.z) * 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uIntensity;
      uniform float uSoftness;
      varying vec3 vColor;
      varying float vT;
      varying float vTGlass;
      varying vec2 vRad;
      void main() {
        //  Light leaving a stained tile is already the tile's colour — there
        //  is no white-on-glass moment. Any sun-white mix here saturates to
        //  pure white under additive blending and reads as a fake highlight
        //  wedge on the front face of the beam box. So: tinted colour only.
        vec3 col = vColor;

        //  Soft single-gaussian radial cross-section. One smooth bell, no
        //  bright "core" stack — that stack was what made each beam read as
        //  a hot spike at the glass and a long taper into the room. With one
        //  wide gaussian the shaft is uniformly diffuse and adjacent beams
        //  blend into a continuous wash of colour.
        float r = length(vRad);
        float radial = exp(-r * r * 1.7);

        //  Length-wise: smooth exponential decay along the shaft. Brightness
        //  is consistent across the beam — no on-glass peak. Softness slows
        //  the decay so longer shafts hold their tint.
        float dT = max(0.0, vT - vTGlass);
        float lengthFade = exp(-dT * 1.6 / max(0.3, uSoftness));

        float density = radial * lengthFade;
        float a = density * uIntensity * 0.34;
        //  Pure premultiplied tint — no white boost term. Density modulates
        //  saturation through alpha; colour channels never exceed vColor.
        gl_FragColor = vec4(col * a, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  function makeBeamGeom() {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    g.setAttribute('aColor',  new THREE.InstancedBufferAttribute(new Float32Array(MAX_CELLS * 3), 3));
    g.setAttribute('aTGlass', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CELLS), 1));
    return g;
  }
  const beamMesh = new THREE.InstancedMesh(makeBeamGeom(), beamMat, MAX_CELLS);
  beamMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  beamMesh.count = 0;
  beamMesh.renderOrder = 4;
  beamMesh.frustumCulled = false;
  scene.add(beamMesh);

  // ============================================================ Floor pools
  const poolGeom = new THREE.PlaneGeometry(1, 1);
  poolGeom.rotateX(-Math.PI / 2);
  poolGeom.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CELLS * 3), 3));
  const poolMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0.55 } },
    vertexShader: `
      attribute vec3 aColor;
      varying vec3 vColor;
      varying vec2 vUv;
      void main() {
        vColor = aColor;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying vec2 vUv;
      void main() {
        // Soft circular pool with gentle square hint — broader than the cell
        // so adjacent pools overlap into a continuous wash of colour.
        vec2 p = abs(vUv - 0.5) * 2.0;
        float sq  = max(p.x, p.y);
        float rd  = length(p);
        float m   = mix(rd, sq, 0.35);
        if (m > 1.0) discard;
        float a = pow(1.0 - m, 2.2) * uOpacity;
        gl_FragColor = vec4(vColor * (0.55 + a * 1.5) * a, a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const poolMesh = new THREE.InstancedMesh(poolGeom, poolMat, MAX_CELLS);
  poolMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  poolMesh.count = 0;
  poolMesh.renderOrder = 3;
  poolMesh.frustumCulled = false;
  scene.add(poolMesh);

  // =================================================== Pattern + light pass
  let cells = []; // [{col, row, color, clear}]

  function cellWorldPos(col, row) {
    return new THREE.Vector3((col - CX) * CELL_W, -(row - CY) * CELL_H, 0);
  }

  function buildPattern() {
    cells = [];
    const fn = PATTERNS[S.pattern];
    for (let r = 0; r < PANE_ROWS; r++) {
      for (let c = 0; c < PANE_COLS; c++) {
        const hex = fn(c, r);
        if (hex == null) {
          // Hex returned null — could be "outside pane shape" or "clear glass".
          // For simplicity, EVERY in-bounds position is glass; corners outside
          // a circular pattern fall back to clear. The pattern fn signals
          // "outside pane" by returning `false` (Lancet's arch top, etc).
          if (hex === false) continue;
          cells.push({ col: c, row: r, color: null, clear: true });
        } else {
          cells.push({ col: c, row: r, color: new THREE.Color(hex), clear: false });
        }
      }
    }
    updateCells();
    updateLight();
  }

  const _dummy = new THREE.Object3D();
  const _up = new THREE.Vector3(0, 1, 0);

  function updateCells() {
    const colArr = colouredMesh.geometry.getAttribute('aCol').array;
    let ci = 0, ki = 0;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const pos = cellWorldPos(cell.col, cell.row);
      _dummy.position.copy(pos);
      _dummy.quaternion.identity();
      _dummy.scale.set(1, 1, 1);
      _dummy.updateMatrix();
      if (cell.clear) {
        clearMesh.setMatrixAt(ki, _dummy.matrix);
        ki++;
      } else {
        colouredMesh.setMatrixAt(ci, _dummy.matrix);
        colArr[ci * 3]     = cell.color.r;
        colArr[ci * 3 + 1] = cell.color.g;
        colArr[ci * 3 + 2] = cell.color.b;
        ci++;
      }
    }
    colouredMesh.count = ci;
    clearMesh.count    = ki;
    colouredMesh.instanceMatrix.needsUpdate = true;
    colouredMesh.geometry.getAttribute('aCol').needsUpdate = true;
    clearMesh.instanceMatrix.needsUpdate    = true;
  }

  function getLightPos() {
    // Light lives on a plane PARALLEL to the glass pane at Z = -lightZ.
    // X/Y come from the control pad; Z comes from the distance slider.
    return new THREE.Vector3(S.lightX, S.lightY, -S.lightZ);
  }

  function updateLight() {
    const lightPos = getLightPos();

    // Sun visual sits at the actual light position (point source, close).
    sunCore.position.copy(lightPos);
    sunCorona.position.copy(lightPos);
    sunGlow.position.copy(lightPos);
    sunBloom.position.copy(lightPos);

    const bColor  = beamMesh.geometry.getAttribute('aColor').array;
    const bTGlass = beamMesh.geometry.getAttribute('aTGlass').array;
    const pColor  = poolMesh.geometry.getAttribute('aColor').array;

    let bi = 0, pi = 0;
    const tmpDir = new THREE.Vector3();
    const tmpQ   = new THREE.Quaternion();

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell.clear) continue; // only coloured cells cast beams

      const cellPos = cellWorldPos(cell.col, cell.row);

      // PER-CELL ray direction from the (close) point source through this
      // cell, continuing forward into the room. Cells off the optical axis
      // get angled-outward beams — that's the diverging fan visible in the
      // reference screenshots, which a parallel sun couldn't produce.
      tmpDir.subVectors(cellPos, lightPos).normalize();

      // Forward distance until the diverging ray hits the floor (if it does)
      let postLen, endPos;
      const FAR = 70;
      if (tmpDir.y < -0.001) {
        postLen = (FLOOR_Y - cellPos.y) / tmpDir.y;
        postLen = Math.min(postLen, FAR);
        endPos = new THREE.Vector3().copy(cellPos).addScaledVector(tmpDir, postLen);
      } else {
        postLen = FAR;
        endPos = new THREE.Vector3().copy(cellPos).addScaledVector(tmpDir, FAR);
      }
      const totalLen = Math.max(0.01, PRE_LEN + postLen);
      const tGlass = PRE_LEN / totalLen; // 0 when PRE_LEN=0: peak at beam start

      tmpQ.setFromUnitVectors(_up, tmpDir);

      // Beam starts PRE_LEN behind the cell (at the cell if PRE_LEN=0)
      const startPos = new THREE.Vector3().copy(cellPos).addScaledVector(tmpDir, -PRE_LEN);
      _dummy.position.copy(startPos);
      _dummy.quaternion.copy(tmpQ);
      _dummy.scale.set(S.beamWidth, totalLen, S.beamWidth);
      _dummy.updateMatrix();
      beamMesh.setMatrixAt(bi, _dummy.matrix);
      bColor[bi * 3]     = cell.color.r;
      bColor[bi * 3 + 1] = cell.color.g;
      bColor[bi * 3 + 2] = cell.color.b;
      bTGlass[bi]        = tGlass;
      bi++;

      // SQUARE floor pool, axis-aligned, same width as the cell. The pool
      // is offset by the diverging projection (each cell lands separately)
      // so the on-floor pattern naturally spreads outward from the centre.
      if (tmpDir.y < -0.001) {
        const poolSize = CELL_W * 2.1;
        _dummy.position.set(endPos.x, FLOOR_Y + 0.02, endPos.z);
        _dummy.quaternion.identity();
        _dummy.scale.set(poolSize, 1, poolSize);
        _dummy.updateMatrix();
        poolMesh.setMatrixAt(pi, _dummy.matrix);
        pColor[pi * 3]     = cell.color.r;
        pColor[pi * 3 + 1] = cell.color.g;
        pColor[pi * 3 + 2] = cell.color.b;
        pi++;
      }
    }

    beamMesh.count = bi;
    poolMesh.count = pi;
    beamMesh.instanceMatrix.needsUpdate = true;
    beamMesh.geometry.getAttribute('aColor').needsUpdate = true;
    beamMesh.geometry.getAttribute('aTGlass').needsUpdate = true;
    poolMesh.instanceMatrix.needsUpdate = true;
    poolMesh.geometry.getAttribute('aColor').needsUpdate = true;
  }

  // ===================================================== Camera + view modes
  const cam = {
    theta: 0, phi: 0.08, radius: 30,
    fromTheta: 0, fromPhi: 0.08, fromRadius: 30,
    toTheta:   0, toPhi:   0.08, toRadius:   30,
    t: 1,
  };
  const TRANSITION_S = 0.9;

  function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
  function lerp(a, b, k) { return a + (b - a) * k; }

  function viewingTarget()  { return { theta: 0,    phi: 0.03, radius: 27 }; }
  function lightingTarget() { return { theta: -0.85, phi: 0.32, radius: 95 }; }

  function applyMode(mode, animate = true) {
    S.mode = mode;
    cam.fromTheta = cam.theta; cam.fromPhi = cam.phi; cam.fromRadius = cam.radius;
    const t = (mode === 'viewing') ? viewingTarget() : lightingTarget();
    cam.toTheta = t.theta; cam.toPhi = t.phi; cam.toRadius = t.radius;
    if (animate) {
      cam.t = 0;
    } else {
      cam.t = 1; cam.theta = t.theta; cam.phi = t.phi; cam.radius = t.radius;
    }
  }

  // Orbit & zoom (lighting mode only)
  let dragging = false, lastX = 0, lastY = 0, activePtr = null;
  const canvasEl = renderer.domElement;
  canvasEl.style.touchAction = 'none';
  canvasEl.addEventListener('pointerdown', e => {
    if (S.mode !== 'lighting') return;
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    activePtr = e.pointerId;
    try { canvasEl.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvasEl.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== activePtr) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    cam.theta -= dx * 0.006;
    cam.phi   += dy * 0.006;
    cam.phi = Math.max(-1.45, Math.min(1.45, cam.phi));
    cam.t = 1;
  });
  function endDrag(e) {
    if (e.pointerId !== activePtr) return;
    dragging = false; activePtr = null;
    try { canvasEl.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  canvasEl.addEventListener('pointerup', endDrag);
  canvasEl.addEventListener('pointercancel', endDrag);
  canvasEl.addEventListener('wheel', e => {
    if (S.mode !== 'lighting') return;
    e.preventDefault();
    cam.radius *= 1 + e.deltaY * 0.0008;
    cam.radius = Math.max(12, Math.min(220, cam.radius));
    cam.t = 1;
  }, { passive: false });

  // ================================================================ UI panel
  injectStyles();
  const panel = buildPanel();
  document.body.appendChild(panel);

  function injectStyles() {
    const css = `
      .p63-panel{position:fixed;top:18px;right:18px;z-index:100;width:288px;
        background:rgba(14,15,20,0.78);backdrop-filter:blur(14px) saturate(120%);
        -webkit-backdrop-filter:blur(14px) saturate(120%);
        border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 16px 18px;
        color:#dadada;font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;
        user-select:none;box-shadow:0 18px 40px rgba(0,0,0,0.45);}
      .p63-title{font-size:10px;letter-spacing:0.24em;opacity:0.6;margin-bottom:14px;
        display:flex;align-items:center;gap:8px;}
      .p63-title::before{content:"";width:6px;height:6px;border-radius:50%;
        background:#ffd87a;box-shadow:0 0 8px #ffd87a;}
      .p63-section{margin-bottom:14px;}
      .p63-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px;}
      .p63-label{font-size:10px;letter-spacing:0.18em;opacity:0.55;}
      .p63-val{font-size:11px;color:#ffd87a;opacity:0.9;}
      .p63-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
      .p63-btn{padding:7px 6px;background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.06);border-radius:7px;color:#bdbdbd;
        cursor:pointer;font-size:10.5px;letter-spacing:0.04em;text-align:center;
        transition:background 0.18s, border-color 0.18s, color 0.18s;
        font-family:inherit;}
      .p63-btn:hover{background:rgba(255,255,255,0.085);border-color:rgba(255,255,255,0.18);color:#f0f0f0;}
      .p63-btn.active{background:linear-gradient(180deg,rgba(255,200,90,0.22),rgba(255,160,40,0.14));
        border-color:rgba(255,200,90,0.55);color:#ffd87a;}
      .p63-toggle{display:grid;grid-template-columns:1fr 1fr;gap:0;
        background:rgba(255,255,255,0.04);padding:3px;border-radius:9px;}
      .p63-toggle .p63-btn{border:none;background:transparent;border-radius:6px;padding:8px 6px;}
      .p63-toggle .p63-btn.active{background:rgba(100,170,255,0.20);color:#a0d4ff;
        box-shadow:0 1px 0 rgba(100,170,255,0.20) inset;}
      .p63-pad{position:relative;width:170px;height:170px;margin:6px auto 4px;
        border-radius:50%;cursor:crosshair;
        background:radial-gradient(circle at 50% 50%,
          rgba(255,210,120,0.10) 0%,
          rgba(255,180,60,0.04) 30%,
          rgba(30,30,40,0.5) 75%,
          rgba(15,15,20,0.8) 100%);
        border:1px solid rgba(255,255,255,0.10);
        box-shadow:0 2px 14px rgba(0,0,0,0.4) inset;}
      .p63-pad::after{content:"";position:absolute;inset:6px;border-radius:50%;
        border:1px dashed rgba(255,255,255,0.07);pointer-events:none;}
      .p63-pad-dot{position:absolute;width:18px;height:18px;border-radius:50%;
        background:radial-gradient(circle,#fff5d0 0%,#ffb340 60%,rgba(255,160,40,0) 100%);
        box-shadow:0 0 14px #ffc870;transform:translate(-50%,-50%);pointer-events:none;}
      .p63-pad-marker{position:absolute;font-size:9px;color:#888;letter-spacing:0.16em;
        pointer-events:none;}
      .p63-pad-marker.top{top:4px;left:50%;transform:translateX(-50%);}
      .p63-slider{width:100%;-webkit-appearance:none;appearance:none;background:transparent;
        height:20px;cursor:pointer;margin:2px 0;}
      .p63-slider::-webkit-slider-runnable-track{height:4px;background:rgba(255,255,255,0.10);
        border-radius:3px;}
      .p63-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
        width:14px;height:14px;border-radius:50%;background:#ffd87a;margin-top:-5px;
        cursor:grab;box-shadow:0 2px 8px rgba(0,0,0,0.5);transition:transform 0.1s;}
      .p63-slider::-webkit-slider-thumb:hover{transform:scale(1.15);}
      .p63-slider::-moz-range-track{height:4px;background:rgba(255,255,255,0.10);border-radius:3px;}
      .p63-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#ffd87a;
        border:none;cursor:grab;}
      .p63-hud{position:fixed;left:18px;top:14px;z-index:10;pointer-events:none;
        font-size:11px;letter-spacing:0.20em;line-height:1.5;color:#cfcfcf;}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const hud = document.createElement('div');
    hud.className = 'p63-hud';
    hud.textContent = 'STAINED GLASS · CATHEDRAL LIGHT';
    document.body.appendChild(hud);
  }

  function buildPanel() {
    const root = document.createElement('div');
    root.className = 'p63-panel';
    root.innerHTML = `
      <div class="p63-title">CATHEDRAL GLASS</div>

      <div class="p63-section">
        <div class="p63-row"><div class="p63-label">PATTERN</div></div>
        <div class="p63-grid" id="p63-patterns"></div>
      </div>

      <div class="p63-section">
        <div class="p63-row"><div class="p63-label">VIEW</div></div>
        <div class="p63-toggle">
          <button class="p63-btn p63-mode" data-mode="viewing">Viewing</button>
          <button class="p63-btn p63-mode" data-mode="lighting">Lighting</button>
        </div>
      </div>

      <div class="p63-section">
        <div class="p63-row">
          <div class="p63-label">LIGHT POSITION</div>
          <div class="p63-val" id="p63-sun-val">x 0.0 &middot; y 0.0</div>
        </div>
        <div class="p63-pad" id="p63-pad">
          <div class="p63-pad-marker top">UP</div>
          <div class="p63-pad-dot" id="p63-pad-dot"></div>
        </div>
      </div>

      <div class="p63-section">
        <div class="p63-row">
          <div class="p63-label">LIGHT DISTANCE</div>
          <div class="p63-val" id="p63-dist-val">7.5</div>
        </div>
        <input type="range" class="p63-slider" id="p63-dist" min="${LIGHT_Z_MIN}" max="${LIGHT_Z_MAX}" step="0.1" value="${S.lightZ}">
      </div>

      <div class="p63-section">
        <div class="p63-row">
          <div class="p63-label">GLASS OPACITY</div>
          <div class="p63-val" id="p63-glass-val">90%</div>
        </div>
        <input type="range" class="p63-slider" id="p63-glass" min="0.3" max="1.0" step="0.01" value="${S.glassOpacity}">
      </div>

      <div class="p63-section">
        <div class="p63-row">
          <div class="p63-label">LIGHT INTENSITY</div>
          <div class="p63-val" id="p63-light-val">85%</div>
        </div>
        <input type="range" class="p63-slider" id="p63-light" min="0" max="2.5" step="0.01" value="${S.beamIntensity}">
      </div>

      <div class="p63-section">
        <div class="p63-row">
          <div class="p63-label">SHAFT SOFTNESS</div>
          <div class="p63-val" id="p63-soft-val">1.0</div>
        </div>
        <input type="range" class="p63-slider" id="p63-soft" min="0.3" max="3.0" step="0.05" value="${S.beamSoftness}">
      </div>
    `;

    // Pattern grid
    const grid = root.querySelector('#p63-patterns');
    Object.keys(PATTERNS).forEach((name) => {
      const b = document.createElement('button');
      b.className = 'p63-btn' + (name === S.pattern ? ' active' : '');
      b.textContent = name;
      b.dataset.pat = name;
      b.addEventListener('click', () => {
        S.pattern = name;
        grid.querySelectorAll('.p63-btn').forEach(x => x.classList.toggle('active', x === b));
        buildPattern();
      });
      grid.appendChild(b);
    });

    // Mode toggle
    root.querySelectorAll('.p63-mode').forEach(b => {
      if (b.dataset.mode === S.mode) b.classList.add('active');
      b.addEventListener('click', () => {
        root.querySelectorAll('.p63-mode').forEach(x => x.classList.toggle('active', x === b));
        applyMode(b.dataset.mode, true);
      });
    });

    // Light-position pad — drag a dot inside a circle to set (lightX, lightY)
    // on the plane PARALLEL to the glass. Centre = light directly behind the
    // pane centre; top = light up; right = light right; etc. Z is fixed.
    const pad     = root.querySelector('#p63-pad');
    const padDot  = root.querySelector('#p63-pad-dot');
    const sunVal  = root.querySelector('#p63-sun-val');
    const padR    = 76;                          // logical radius (slightly inset)
    function refreshPad() {
      // Map (lightX, lightY) in world units to pad pixels.
      // Pad axes: +x → right, +y world → up (so y-pixel goes negative).
      const px = 85 + (S.lightX / LIGHT_RANGE) * padR;
      const py = 85 - (S.lightY / LIGHT_RANGE) * padR;
      padDot.style.left = px + 'px';
      padDot.style.top  = py + 'px';
      sunVal.innerHTML  = `x ${S.lightX.toFixed(1)} &middot; y ${S.lightY.toFixed(1)}`;
    }
    function padFromXY(clientX, clientY) {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      // Clamp to circular pad
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d > padR) { dx *= padR / d; dy *= padR / d; }
      S.lightX =  (dx / padR) * LIGHT_RANGE;
      S.lightY = -(dy / padR) * LIGHT_RANGE;   // screen-y is inverted
      refreshPad();
      updateLight();
    }
    let padDrag = false;
    pad.addEventListener('pointerdown', e => {
      padDrag = true;
      pad.setPointerCapture(e.pointerId);
      padFromXY(e.clientX, e.clientY);
    });
    pad.addEventListener('pointermove', e => {
      if (!padDrag) return;
      padFromXY(e.clientX, e.clientY);
    });
    pad.addEventListener('pointerup', e => {
      padDrag = false;
      try { pad.releasePointerCapture(e.pointerId); } catch (_) {}
    });
    refreshPad();

    // Sliders
    function bindSlider(inputId, valId, onChange, fmt) {
      const input = root.querySelector('#' + inputId);
      const valEl = root.querySelector('#' + valId);
      const tick = () => {
        const v = parseFloat(input.value);
        valEl.textContent = fmt(v);
        onChange(v);
      };
      input.addEventListener('input', tick);
      tick();
    }
    bindSlider('p63-dist', 'p63-dist-val',
      v => { S.lightZ = v; updateLight(); },
      v => v.toFixed(1));
    bindSlider('p63-glass', 'p63-glass-val',
      v => { S.glassOpacity = v; colouredMat.uniforms.uOpacity.value = v; },
      v => Math.round(v * 100) + '%');
    bindSlider('p63-light', 'p63-light-val',
      v => { S.beamIntensity = v; beamMat.uniforms.uIntensity.value = v; },
      v => Math.round(v * 100) + '%');
    bindSlider('p63-soft',  'p63-soft-val',
      v => { S.beamSoftness = v; beamMat.uniforms.uSoftness.value = v; },
      v => v.toFixed(2));

    return root;
  }

  // ================================================================ Loop
  buildPattern();
  applyMode(S.mode, false);

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
    camera.position.set(
      Math.sin(cam.theta) * cosPhi * cam.radius,
      Math.sin(cam.phi) * cam.radius,
      Math.cos(cam.theta) * cosPhi * cam.radius,
    );
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  // =============================================================== Resize
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
}
