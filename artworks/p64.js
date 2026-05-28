/**
 * Practice 64 — God-Ray Weight Function
 *
 * Radial-blur god-ray post-process applied to the Cathedral Glass pane.
 * The weight function `w(t)` is selectable from the control pane —
 * three shapes share the same sampler, mask, and scene; only the
 * mathematical character of the falloff differs:
 *
 *     LINEAR   w(t) = max(1 − K·t, 0)
 *     POWER    w(t) = (1 − t)^(3·K)
 *     EXP      w(t) = e^(−4·K·t)
 *
 * t ∈ [0,1] runs from the fragment (t=0) toward the sun on screen (t=1).
 * K is a global "kernel" parameter the slider sweeps so each equation
 * can be tuned without changing its mathematical character.
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

  // ============================================================== Geometry
  const PANE_COLS = 13;
  const PANE_ROWS = 13;
  const CELL      = 1.0;
  const PANE_W    = PANE_COLS * CELL;
  const PANE_H    = PANE_ROWS * CELL;
  const PANE_T    = 0.30;
  const CX        = (PANE_COLS - 1) / 2;
  const CY        = (PANE_ROWS - 1) / 2;
  const MAX_CELLS = PANE_COLS * PANE_ROWS;

  // ============================================================ Glass palette
  const C = {
    deepBlue:  '#142a6a',
    blue:      '#2a64d8',
    teal:      '#377da4',
    gold:      '#f3c440',
    amber:     '#e08434',
    cream:     '#fbe9b6',
    ruby:      '#c8273a',
    crimson:   '#7a182a',
    purple:    '#5a2b9a',
  };

  // ============================================================== Patterns
  const PATTERNS = {
    'Crucifix':     crucifix,
    'Sunburst':     sunburst,
    'Compass Rose': compassRose,
  };

  function crucifix(c, r) {
    const dx = c - CX, dy = r - CY;
    const vBar  = Math.abs(dx) <= 1;
    const hBarY = -2;
    const hBar  = Math.abs(dy - hBarY) <= 1 && Math.abs(dx) <= 4;
    if (vBar && Math.abs(dy - hBarY) <= 1) return C.gold;
    if (vBar || hBar) return C.amber;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 6.6) return null;
    const stripe = (c + r) % 3;
    return [C.deepBlue, C.blue, C.deepBlue][stripe];
  }

  function sunburst(c, r) {
    const dx = c - CX, dy = r - CY;
    const dist  = Math.sqrt(dx*dx + dy*dy);
    if (dist > 6.6) return null;
    const angle = Math.atan2(dy, dx);
    if (dist < 1.2) return C.gold;
    if (dist < 2.1) return C.amber;
    const wedge = Math.floor(((angle + Math.PI) / (2*Math.PI)) * 14);
    const onRay = (wedge & 1) === 0;
    if (onRay) return dist < 4.5 ? C.gold : C.amber;
    if (dist < 3.8) return C.crimson;
    if (dist < 5.4) return C.ruby;
    return C.deepBlue;
  }

  function compassRose(c, r) {
    const dx = c - CX, dy = r - CY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 6.6) return null;
    if (Math.abs(dx) <= 0.5 && Math.abs(dy) <= 5.8) return C.gold;
    if (Math.abs(dy) <= 0.5 && Math.abs(dx) <= 5.8) return C.gold;
    if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.5 && dist < 4.0) return C.amber;
    if (dist < 1.2) return C.cream;
    if (Math.floor(Math.abs(dx) + Math.abs(dy)) % 2 === 0) return C.deepBlue;
    return C.blue;
  }

  // ================================================================ State
  //  K is the global kernel parameter every variant funnels through its
  //  weight function. K=1 is each variant's design default; smaller K
  //  softens the falloff, larger K sharpens it.
  const S = {
    pattern:     'Crucifix',
    variantIdx:  0,          // E1 LINEAR
    materialIdx: 1,          // 0 = FLAT (G1), 1 = FRESNEL (G4)
    mode:        'viewing',  // 'viewing' (front, locked) | 'lighting' (orbit + zoom)
    lightX:      -4.0,
    lightY:       9.0,
    lightZ:       3.0,
    intensity:    1.5,
    K:            4.0,
    opacity:      1.0,       // glass cell opacity
  };
  const LIGHT_RANGE = 12;
  const LIGHT_Z_MIN = 3.0;
  const LIGHT_Z_MAX = 22;

  function getLightPos() {
    return new THREE.Vector3(S.lightX, S.lightY, -S.lightZ);
  }
  function cellWorldPos(col, row) {
    return new THREE.Vector3((col - CX) * CELL, -(row - CY) * CELL, 0);
  }

  // ================================================================ Cells
  let cells = [];
  function buildPattern() {
    cells = [];
    const fn = PATTERNS[S.pattern];
    for (let r = 0; r < PANE_ROWS; r++) {
      for (let c = 0; c < PANE_COLS; c++) {
        const hex = fn(c, r);
        if (hex == null) {
          cells.push({ col: c, row: r, color: null, clear: true });
        } else {
          cells.push({ col: c, row: r, color: new THREE.Color(hex), clear: false });
        }
      }
    }
  }
  buildPattern();

  // =============================================================== Layout
  injectStyles();
  const root = document.createElement('div');
  root.className = 'p64-root';
  document.body.appendChild(root);

  const sidebar = document.createElement('div');
  sidebar.className = 'p64-sidebar';
  root.appendChild(sidebar);
  sidebar.innerHTML = `
    <div class="p64-brand">
      <div class="p64-title">P64 · GOD-RAY WEIGHT FUNCTION</div>
      <div class="p64-sub">switchable w(t) · radial-blur god rays · Cathedral Glass</div>
    </div>
    <div class="p64-ctrl">
      <div class="p64-block">
        <div class="p64-lbl">EQUATION</div>
        <div class="p64-equations" id="p64-equations"></div>
      </div>
      <div class="p64-block">
        <div class="p64-lbl">VIEW</div>
        <div class="p64-toggle">
          <button class="p64-mode" data-mode="viewing">Viewing</button>
          <button class="p64-mode" data-mode="lighting">Lighting</button>
        </div>
      </div>
      <div class="p64-block">
        <div class="p64-lbl">PATTERN</div>
        <div class="p64-patterns" id="p64-patterns"></div>
      </div>
      <div class="p64-block">
        <div class="p64-lbl">MATERIAL</div>
        <div class="p64-patterns" id="p64-materials"></div>
      </div>
      <div class="p64-block">
        <div class="p64-lbl">SUN POSITION</div>
        <div class="p64-pad" id="p64-pad"><div class="p64-pad-dot" id="p64-pad-dot"></div></div>
      </div>
      <div class="p64-block p64-block-sliders">
        <div class="p64-srow">
          <div class="p64-srow-lbl">OPACITY <span id="p64-op-val">100%</span></div>
          <input type="range" class="p64-slider" id="p64-op"
            min="0.20" max="1.00" step="0.01" value="${S.opacity}">
        </div>
        <div class="p64-srow">
          <div class="p64-srow-lbl">DISTANCE <span id="p64-dist-val">3.0</span></div>
          <input type="range" class="p64-slider" id="p64-dist"
            min="${LIGHT_Z_MIN}" max="${LIGHT_Z_MAX}" step="0.1" value="${S.lightZ}">
        </div>
        <div class="p64-srow">
          <div class="p64-srow-lbl">INTENSITY <span id="p64-int-val">150%</span></div>
          <input type="range" class="p64-slider" id="p64-int"
            min="0" max="3" step="0.01" value="${S.intensity}">
        </div>
        <div class="p64-srow">
          <div class="p64-srow-lbl">KERNEL K <span id="p64-k-val">4.00</span></div>
          <input type="range" class="p64-slider" id="p64-k"
            min="0.2" max="4.0" step="0.01" value="${S.K}">
        </div>
      </div>
    </div>
  `;

  const stage = document.createElement('div');
  stage.className = 'p64-stage';
  root.appendChild(stage);

  const canvas = document.createElement('canvas');
  canvas.className = 'p64-canvas';
  stage.appendChild(canvas);

  // ====================================================== Common scene
  //  Pane frame, inner grid lines, instanced coloured + clear cells, sun
  //  disc. Split into mainScene (god-ray sources) and overlayScene
  //  (chrome that must NOT seed god rays) — see Pass 1 / Pass 3 below.
  function buildCommonScene(canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    //  We manage clears manually so the overlay pass (frame + grid lines)
    //  can draw on top of the god-ray composite without wiping it.
    renderer.autoClear = false;

    //  mainScene holds everything that SHOULD seed god rays — the lit cells
    //  and the sun. overlayScene holds chrome that must NOT contribute to
    //  the radial blur (the bright outer frame and the inner grid lines)
    //  but still draws on top of the final composite.
    const mainScene = new THREE.Scene();
    mainScene.background = new THREE.Color(0x000000);
    const overlayScene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
    camera.position.set(2.5, 6.0, 24);
    camera.lookAt(0, -1, 0);

    // Frame
    const frameMat = new THREE.MeshBasicMaterial({ color: 0xb8c0d0 });
    const FRAME_T = 0.15, FRAME_D = 0.18;
    const fW = PANE_W + FRAME_T * 2, fH = PANE_H + FRAME_T * 2;
    const frame = new THREE.Group();
    const top   = new THREE.Mesh(new THREE.BoxGeometry(fW, FRAME_T, FRAME_D), frameMat);
    const bot   = top.clone();
    const left  = new THREE.Mesh(new THREE.BoxGeometry(FRAME_T, fH, FRAME_D), frameMat);
    const right = left.clone();
    top.position.y    =  PANE_H / 2 + FRAME_T / 2;
    bot.position.y    = -PANE_H / 2 - FRAME_T / 2;
    left.position.x   = -PANE_W / 2 - FRAME_T / 2;
    right.position.x  =  PANE_W / 2 + FRAME_T / 2;
    frame.add(top, bot, left, right);
    frame.position.z  = PANE_T * 0.5;
    overlayScene.add(frame);

    //  Inner grid lines. Soft off-white at low opacity so the cell grid
    //  reads on the dark clear-glass tiles without competing with the
    //  bright shafts. depthWrite:false keeps them from over-occluding the
    //  blurred composite below.
    const gridMat = new THREE.LineBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false,
    });
    const gridGeom = new THREE.BufferGeometry();
    const gPts = [];
    for (let i = 0; i <= PANE_COLS; i++) {
      const x = -PANE_W/2 + i * CELL;
      gPts.push(x, -PANE_H/2, PANE_T * 0.55, x, PANE_H/2, PANE_T * 0.55);
    }
    for (let i = 0; i <= PANE_ROWS; i++) {
      const y = -PANE_H/2 + i * CELL;
      gPts.push(-PANE_W/2, y, PANE_T * 0.55, PANE_W/2, y, PANE_T * 0.55);
    }
    gridGeom.setAttribute('position', new THREE.Float32BufferAttribute(gPts, 3));
    overlayScene.add(new THREE.LineSegments(gridGeom, gridMat));

    // Cells — two switchable glass materials (G1 FLAT, G4 FRESNEL),
    // picked from the p65 comparison. They share one opacity uniform;
    // colMesh.material is hot-swapped by setMaterial(idx).
    function makeCellGeom() {
      const g = new THREE.BoxGeometry(CELL * 0.92, CELL * 0.92, PANE_T);
      g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(MAX_CELLS * 3), 3));
      return g;
    }
    const cellUniforms = { uOpacity: { value: S.opacity } };
    const CELL_VTX = `
      attribute vec3 aCol;
      varying vec3 vColor;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vViewDir;
      void main() {
        vColor  = aCol;
        vNormal = normalize(normalMatrix * normal);
        vUv     = uv;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `;
    function makeCellMat(fragBody) {
      return new THREE.ShaderMaterial({
        uniforms: cellUniforms,
        vertexShader: CELL_VTX,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vColor;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vViewDir;
          void main() {
            float shade = 0.78 + 0.22 * abs(vNormal.z);
            ${fragBody}
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.FrontSide,
      });
    }
    //  G1 FLAT — solid tint × face shade.
    //  G4 FRESNEL — view-angle rim brightens grazing edges; alpha opens
    //  up at grazing angles so side faces read as glassier.
    const cellMats = [
      makeCellMat('gl_FragColor = vec4(vColor * shade, uOpacity);'),
      makeCellMat([
        'vec3 N = normalize(vNormal);',
        'vec3 V = normalize(vViewDir);',
        'float f = 1.0 - max(dot(N, V), 0.0);',
        'float fres = pow(f, 2.2);',
        'vec3 col = vColor * shade + vec3(0.55) * fres;',
        'float a = mix(uOpacity, min(1.0, uOpacity + 0.25), fres);',
        'gl_FragColor = vec4(col, a);',
      ].join('\n')),
    ];
    const clearMat  = new THREE.MeshBasicMaterial({ color: 0x05060a });
    const colMesh   = new THREE.InstancedMesh(makeCellGeom(), cellMats[S.materialIdx], MAX_CELLS);
    const clearMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(CELL * 0.92, CELL * 0.92, PANE_T), clearMat, MAX_CELLS);
    colMesh.count = 0; clearMesh.count = 0;
    colMesh.frustumCulled = false; clearMesh.frustumCulled = false;
    //  Opaque dark slabs first, translucent colour cells on top.
    clearMesh.renderOrder = 1;
    colMesh.renderOrder   = 2;
    mainScene.add(clearMesh, colMesh);

    function setMaterial(idx) {
      colMesh.material = cellMats[Math.max(0, Math.min(cellMats.length - 1, idx))];
    }
    function setOpacity(v) { cellUniforms.uOpacity.value = v; }

    // Sun
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

    function updateCellsCommon() {
      const colArr = colMesh.geometry.getAttribute('aCol').array;
      const dummy  = new THREE.Object3D();
      let ci = 0, ki = 0;
      for (const cell of cells) {
        const p = cellWorldPos(cell.col, cell.row);
        dummy.position.copy(p);
        dummy.quaternion.identity();
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        if (cell.clear) {
          clearMesh.setMatrixAt(ki, dummy.matrix);
          ki++;
        } else {
          colMesh.setMatrixAt(ci, dummy.matrix);
          colArr[ci*3]   = cell.color.r;
          colArr[ci*3+1] = cell.color.g;
          colArr[ci*3+2] = cell.color.b;
          ci++;
        }
      }
      colMesh.count   = ci;
      clearMesh.count = ki;
      colMesh.instanceMatrix.needsUpdate = true;
      clearMesh.instanceMatrix.needsUpdate = true;
      colMesh.geometry.getAttribute('aCol').needsUpdate = true;
    }

    function updateSunPos(lightPos) {
      sunGroup.position.copy(lightPos);
    }

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
      updateCellsCommon, updateSunPos, setMaterial, setOpacity, resize,
    };
  }

  // ==================================================================
  //  GOD-RAY POST-PROCESS PASS
  //
  //  Render scene → render target → fullscreen quad applies the radial
  //  blur. The fragment shader is the same across equations except for
  //  the inlined `weight(t, K)` function — the math snippet that defines
  //  each equation's character. One material is compiled per equation;
  //  setVariant(idx) swaps the blur quad's material at runtime.
  //
  //  Uniforms are SHARED across all materials by passing the same object
  //  to each ShaderMaterial constructor — so updating uK, uIntensity,
  //  etc. once propagates to whichever material is currently bound.
  //
  //  Composition: result = base + tonemap(sum/Σw * intensity * 1.9)
  //  where `tonemap` is x / (1 + 0.55·x), preventing clipping at bright
  //  sun.
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

    //  Shared uniforms — every per-equation material references THIS
    //  object, so a single .value mutation propagates to all of them.
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

          //  Equation-specific weight function. t ∈ [0,1] is the parameter
          //  along the line from the current fragment (t=0) toward the sun
          //  on screen (t=1). K is the global kernel parameter.
          float weight(float t, float K) {
            ${weightGLSL}
          }

          //  Cheap pseudo-random for jittering sample positions. Picked
          //  over p66's other anti-blockiness candidates: zero extra
          //  texture reads, no resolution penalty, breaks the regular
          //  alignment between fragment columns and source cells so the
          //  cell-width "fingers" downstream of the panel turn into fine
          //  noise instead of hard streaks.
          float hash21(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }

          void main() {
            vec3 base = texture2D(uScene, vUv).rgb;

            //  Vector from this fragment toward the sun on screen.
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

            //  Per-fragment t-offset in [-0.5/N, +0.5/N] — slides every
            //  fragment's sample grid by a different sub-step so adjacent
            //  fragments no longer step over the same cell boundaries in
            //  lock-step. The visible result is dithering noise instead
            //  of cell-width streaks.
            float jitter = hash21(vUv * 1024.0) - 0.5;

            for (int i = 0; i < SAMPLES; i++) {
              float t  = clamp((float(i) + jitter) / float(SAMPLES), 0.0, 1.0);
              vec2  p  = vUv + ndir * (t * dist);
              vec3  c  = texture2D(uScene, p).rgb;
              //  Bright-pass: CHROMA+VAL (picked over Rec.601 luma in p65's
              //  mask comparison). v is HSV value (max channel) so bright
              //  cells like gold pass strongly; v - m is chroma so dark
              //  saturated cells like deepBlue also pass even though their
              //  luma is tiny. max() takes whichever is stronger. Result:
              //  every coloured cell seeds rays, while clear/black tiles
              //  (v = m = 0) cleanly stay out.
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

            //  Reinhard-ish tonemap so the sun's white hot core doesn't
            //  block-clip into a hard disc.
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

        //  Pass 1 — render the GOD-RAY-SOURCE scene (cells + sun) into the
        //  render target. Frame and grid lines are deliberately excluded
        //  here so they don't seed the radial blur.
        renderer.setRenderTarget(rt);
        renderer.clear();
        renderer.render(mainScene, camera);
        renderer.setRenderTarget(null);

        //  Project sun position into NDC, then to UV. Clamp behind-camera
        //  case: if sun is behind the camera (projected z > 1 typically),
        //  god-ray pass would still try to blur toward a wrong point.
        //  Disable the pass and just render the base scene.
        const proj = getLightPos().clone().project(camera);
        const behind = proj.z > 1.0 || proj.z < -1.0;
        u.uSunVisible.value = behind ? 0.0 : 1.0;
        u.uLightScreen.value.set((proj.x + 1) * 0.5, (proj.y + 1) * 0.5);
        u.uIntensity.value = S.intensity;
        u.uK.value         = S.K;

        //  Pass 2 — god-ray blur to the canvas. Clear first since autoClear
        //  was disabled at renderer construction.
        renderer.clear();
        renderer.render(blurScene, blurCamera);

        //  Pass 3 — draw the frame and grid lines on top of the composite.
        //  No clear: we keep the blurred result and overlay the chrome.
        renderer.render(overlayScene, camera);
      },
    };
  }

  // ============================================================ Equations
  //  Each entry plugs ITS weight GLSL into the shared shader. The
  //  `formula` string is rendered onto the equation button so the math
  //  stays visible while you flip between shapes.
  const E_VARIANTS = [
    {
      id: 'E1', name: 'LINEAR',
      //  Classic crepuscular-rays weight. Constant decrease from 1 at
      //  the fragment to 0 at the sun. Broadest, softest shafts — least
      //  contrast between near-sun and far-from-sun samples.
      formula: 'w(t) = max(1 − K·t, 0)',
      glsl:    'return max(0.0, 1.0 - K * t);',
    },
    {
      id: 'E2', name: 'POWER',
      //  Polynomial falloff. K controls the exponent, so larger K
      //  produces narrower, more concentrated shafts near the sun.
      formula: 'w(t) = (1 − t)^(3·K)',
      glsl:    'return pow(max(0.0, 1.0 - t), 3.0 * K);',
    },
    {
      id: 'E3', name: 'EXPONENTIAL',
      //  Pure exponential decay — typical for atmospheric scattering
      //  (Beer-Lambert). Smooth transition from bright to dim with no
      //  hard knee.
      formula: 'w(t) = e^(−4·K·t)',
      glsl:    'return exp(-4.0 * K * t);',
    },
  ];

  // ============================================================ Build pass
  const ctx  = buildCommonScene(canvas);
  const pass = setupGodRayPass(ctx, E_VARIANTS);
  pass.setVariant(S.variantIdx);
  ctx.setMaterial(S.materialIdx);
  ctx.setOpacity(S.opacity);

  function applyCells() { ctx.updateCellsCommon(); }
  function applyLight() { ctx.updateSunPos(getLightPos()); }
  applyCells();
  applyLight();

  // ============================================================ Camera
  //  Spherical-coords camera, copied wholesale from p63. Two saved
  //  targets — `viewing` is locked front-on; `lighting` is a wider angled
  //  view that also enables pointer drag + wheel zoom. Mode changes
  //  interpolate over TRANSITION_S seconds with an ease-in-out cubic
  //  blend so the transition reads as a deliberate camera move rather
  //  than a snap.
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
    cam.fromTheta  = cam.theta;
    cam.fromPhi    = cam.phi;
    cam.fromRadius = cam.radius;
    const target = (mode === 'viewing') ? viewingTarget() : lightingTarget();
    cam.toTheta  = target.theta;
    cam.toPhi    = target.phi;
    cam.toRadius = target.radius;
    if (animate) {
      cam.t = 0;
    } else {
      cam.t = 1;
      cam.theta  = target.theta;
      cam.phi    = target.phi;
      cam.radius = target.radius;
    }
  }
  applyMode(S.mode, false);

  // ---- Pointer drag (orbit) & wheel (zoom) — lighting mode only ----
  canvas.style.touchAction = 'none';
  let dragging = false, lastX = 0, lastY = 0, activePtr = null;
  canvas.addEventListener('pointerdown', e => {
    if (S.mode !== 'lighting') return;
    dragging = true;
    lastX = e.clientX; lastY = e.clientY;
    activePtr = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging || e.pointerId !== activePtr) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    cam.theta -= dx * 0.006;
    cam.phi   += dy * 0.006;
    cam.phi    = Math.max(-1.45, Math.min(1.45, cam.phi));
    cam.t = 1;                            // halt any in-flight mode tween
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
    cam.radius *= 1 + e.deltaY * 0.0008;
    cam.radius  = Math.max(12, Math.min(220, cam.radius));
    cam.t = 1;
  }, { passive: false });

  // ============================================================ Controls
  //  View toggle — flips between locked front view and free-orbit view.
  sidebar.querySelectorAll('.p64-mode').forEach(b => {
    if (b.dataset.mode === S.mode) b.classList.add('active');
    b.addEventListener('click', () => {
      sidebar.querySelectorAll('.p64-mode').forEach(x => x.classList.toggle('active', x === b));
      applyMode(b.dataset.mode, true);
    });
  });

  //  Equation picker — 3 buttons, each showing its formula. Clicking
  //  swaps the active blur material via pass.setVariant.
  const eqEl = document.getElementById('p64-equations');
  E_VARIANTS.forEach((v, idx) => {
    const b = document.createElement('button');
    b.className = 'p64-eq' + (idx === S.variantIdx ? ' active' : '');
    b.innerHTML = `
      <span class="p64-eq-name">${v.id} · ${v.name}</span>
      <span class="p64-eq-formula">${v.formula}</span>
    `;
    b.addEventListener('click', () => {
      S.variantIdx = idx;
      eqEl.querySelectorAll('.p64-eq').forEach(x => x.classList.toggle('active', x === b));
      pass.setVariant(idx);
    });
    eqEl.appendChild(b);
  });

  const patEl = document.getElementById('p64-patterns');
  for (const name of Object.keys(PATTERNS)) {
    const b = document.createElement('button');
    b.className = 'p64-pat' + (name === S.pattern ? ' active' : '');
    b.textContent = name;
    b.addEventListener('click', () => {
      S.pattern = name;
      patEl.querySelectorAll('.p64-pat').forEach(x => x.classList.toggle('active', x === b));
      buildPattern();
      applyCells();
    });
    patEl.appendChild(b);
  }

  //  Material picker — the two glass shaders that survived p65 (G1 FLAT,
  //  G4 FRESNEL). Hot-swaps the cell mesh material.
  const MATERIALS = ['FLAT', 'FRESNEL'];
  const matEl = document.getElementById('p64-materials');
  MATERIALS.forEach((name, idx) => {
    const b = document.createElement('button');
    b.className = 'p64-pat' + (idx === S.materialIdx ? ' active' : '');
    b.textContent = name;
    b.addEventListener('click', () => {
      S.materialIdx = idx;
      matEl.querySelectorAll('.p64-pat').forEach(x => x.classList.toggle('active', x === b));
      ctx.setMaterial(idx);
    });
    matEl.appendChild(b);
  });

  const pad    = document.getElementById('p64-pad');
  const padDot = document.getElementById('p64-pad-dot');
  const PAD_R  = 72;
  function refreshPad() {
    const cs   = getComputedStyle(pad);
    const padW = parseFloat(cs.width);
    const padH = parseFloat(cs.height);
    const ox = padW / 2 + (S.lightX / LIGHT_RANGE) * PAD_R;
    const oy = padH / 2 - (S.lightY / LIGHT_RANGE) * PAD_R;
    padDot.style.left = ox + 'px';
    padDot.style.top  = oy + 'px';
  }
  function padFromClient(cx, cy) {
    const r = pad.getBoundingClientRect();
    let dx = cx - (r.left + r.width / 2);
    let dy = cy - (r.top + r.height / 2);
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d > PAD_R) { dx *= PAD_R / d; dy *= PAD_R / d; }
    S.lightX =  (dx / PAD_R) * LIGHT_RANGE;
    S.lightY = -(dy / PAD_R) * LIGHT_RANGE;
    refreshPad();
    applyLight();
  }
  let padDrag = false;
  pad.addEventListener('pointerdown', e => {
    padDrag = true;
    pad.setPointerCapture(e.pointerId);
    padFromClient(e.clientX, e.clientY);
  });
  pad.addEventListener('pointermove', e => { if (padDrag) padFromClient(e.clientX, e.clientY); });
  pad.addEventListener('pointerup',   e => {
    padDrag = false;
    try { pad.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  const opInput = document.getElementById('p64-op');
  const opVal   = document.getElementById('p64-op-val');
  opInput.addEventListener('input', () => {
    S.opacity = parseFloat(opInput.value);
    opVal.textContent = Math.round(S.opacity * 100) + '%';
    ctx.setOpacity(S.opacity);
  });
  const distInput = document.getElementById('p64-dist');
  const distVal   = document.getElementById('p64-dist-val');
  distInput.addEventListener('input', () => {
    S.lightZ = parseFloat(distInput.value);
    distVal.textContent = S.lightZ.toFixed(1);
    applyLight();
  });
  const intInput = document.getElementById('p64-int');
  const intVal   = document.getElementById('p64-int-val');
  intInput.addEventListener('input', () => {
    S.intensity = parseFloat(intInput.value);
    intVal.textContent = Math.round(S.intensity * 100) + '%';
  });
  const kInput = document.getElementById('p64-k');
  const kVal   = document.getElementById('p64-k-val');
  kInput.addEventListener('input', () => {
    S.K = parseFloat(kInput.value);
    kVal.textContent = S.K.toFixed(2);
  });

  requestAnimationFrame(refreshPad);

  // =============================================================== Loop
  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    //  Tween toward the active mode's camera target if a transition is
    //  in flight. Drag/wheel set cam.t = 1 so the tween immediately
    //  ends — manual input wins.
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

  // ============================================================ Styles
  function injectStyles() {
    const css = `
      /*  Root is now a horizontal flex row: fixed-width sidebar on the left,
       *  canvas stage taking the rest. min-width:0 on the stage is essential
       *  so the canvas can shrink below its intrinsic width when the window
       *  is narrow. */
      .p64-root{position:fixed;inset:0;display:flex;flex-direction:row;
        background:#000;color:#dcdfe6;font:11px/1.45 ui-monospace,Menlo,Consolas,monospace;
        letter-spacing:0.04em;}

      .p64-sidebar{flex:0 0 280px;display:flex;flex-direction:column;gap:20px;
        padding:20px 18px 18px;overflow-y:auto;
        background:linear-gradient(180deg,#0a0c12 0%,#050608 100%);
        border-right:1px solid rgba(255,255,255,0.06);
        box-shadow:1px 0 0 rgba(255,255,255,0.02);}

      .p64-brand{display:flex;flex-direction:column;gap:4px;
        padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.06);}
      .p64-title{font-size:12px;letter-spacing:0.24em;color:#f0f0f0;}
      .p64-sub{font-size:10px;letter-spacing:0.10em;color:#7a8090;line-height:1.5;}

      /*  Sidebar control stack — every section is full-width and lays its
       *  internals out vertically by default. Pattern is the one exception
       *  (small inline chips). */
      .p64-ctrl{display:flex;flex-direction:column;gap:18px;}
      .p64-block{display:flex;flex-direction:column;gap:7px;align-items:stretch;}
      .p64-lbl{font-size:9px;letter-spacing:0.20em;opacity:0.5;}

      /*  Equation picker: vertical stack inside the sidebar so each button
       *  has room for both name and formula on its own row. */
      .p64-equations{display:flex;flex-direction:column;gap:5px;}
      .p64-eq{display:flex;flex-direction:column;align-items:flex-start;gap:3px;
        padding:8px 10px;background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);border-radius:6px;
        color:#a8acb8;cursor:pointer;font:inherit;text-align:left;
        transition:all 0.15s;}
      .p64-eq:hover{background:rgba(255,255,255,0.10);color:#f0f0f0;}
      .p64-eq.active{background:rgba(255,200,90,0.18);
        border-color:rgba(255,200,90,0.55);color:#ffd87a;}
      .p64-eq-name{font-size:10px;letter-spacing:0.16em;font-weight:500;}
      .p64-eq-formula{font-size:10px;color:inherit;opacity:0.82;
        letter-spacing:0.02em;font-style:italic;
        font-family:"Cambria Math","Latin Modern Math",Georgia,serif;}

      /*  View toggle — segmented control. Visual cue is cool blue so the
       *  user reads it as "scene controls" vs the warm-amber EQUATION and
       *  PATTERN pickers above. */
      .p64-toggle{display:grid;grid-template-columns:1fr 1fr;gap:0;
        background:rgba(255,255,255,0.04);padding:3px;border-radius:7px;
        border:1px solid rgba(255,255,255,0.06);}
      .p64-mode{border:none;background:transparent;color:#a8acb8;
        font:inherit;font-size:10px;letter-spacing:0.10em;
        padding:7px 8px;border-radius:5px;cursor:pointer;
        transition:all 0.15s;}
      .p64-mode:hover{color:#f0f0f0;}
      .p64-mode.active{background:rgba(100,170,255,0.22);color:#a0d4ff;
        box-shadow:0 1px 0 rgba(100,170,255,0.20) inset;}

      /*  Pattern picker: horizontal chips, allowed to wrap if labels grow. */
      .p64-patterns{display:flex;flex-wrap:wrap;gap:4px;}
      .p64-pat{padding:5px 9px;background:rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.08);border-radius:5px;
        color:#a8acb8;cursor:pointer;font:inherit;font-size:10px;
        letter-spacing:0.10em;transition:all 0.15s;}
      .p64-pat:hover{background:rgba(255,255,255,0.10);color:#f0f0f0;}
      .p64-pat.active{background:rgba(255,200,90,0.18);
        border-color:rgba(255,200,90,0.5);color:#ffd87a;}

      /*  Sun position pad: centred within its sidebar block. */
      .p64-pad{position:relative;width:160px;height:160px;border-radius:50%;
        cursor:crosshair;align-self:center;margin:2px 0;
        background:radial-gradient(circle at 50% 50%,
          rgba(255,210,120,0.10) 0%,
          rgba(255,180,60,0.04)  30%,
          rgba(28,30,40,0.6)     78%,
          rgba(10,12,18,0.9)    100%);
        border:1px solid rgba(255,255,255,0.10);
        box-shadow:0 2px 14px rgba(0,0,0,0.4) inset;}
      .p64-pad::after{content:"";position:absolute;inset:6px;border-radius:50%;
        border:1px dashed rgba(255,255,255,0.07);pointer-events:none;}
      .p64-pad-dot{position:absolute;width:16px;height:16px;border-radius:50%;
        background:radial-gradient(circle,#fff5d0 0%,#ffb340 60%,rgba(255,160,40,0) 100%);
        box-shadow:0 0 14px #ffc870;transform:translate(-50%,-50%);pointer-events:none;}

      .p64-block-sliders{gap:10px;}
      .p64-srow{display:flex;flex-direction:column;gap:3px;}
      .p64-srow-lbl{font-size:9px;letter-spacing:0.14em;opacity:0.55;
        display:flex;justify-content:space-between;}
      .p64-srow-lbl span{color:#ffd87a;}
      .p64-slider{width:100%;-webkit-appearance:none;appearance:none;
        background:transparent;height:14px;cursor:pointer;}
      .p64-slider::-webkit-slider-runnable-track{height:3px;
        background:rgba(255,255,255,0.10);border-radius:2px;}
      .p64-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
        width:11px;height:11px;border-radius:50%;background:#ffd87a;
        margin-top:-4px;cursor:grab;box-shadow:0 1px 4px rgba(0,0,0,0.5);}
      .p64-slider::-moz-range-track{height:3px;background:rgba(255,255,255,0.10);border-radius:2px;}
      .p64-slider::-moz-range-thumb{width:11px;height:11px;border-radius:50%;
        background:#ffd87a;border:none;cursor:grab;}

      .p64-stage{flex:1 1 auto;position:relative;background:#000;
        min-width:0;min-height:0;overflow:hidden;}
      .p64-canvas{display:block;width:100%;height:100%;}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  window.addEventListener('resize', refreshPad);
}
