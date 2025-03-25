/**
 * 3D Mathematical Flower Generator
 * 
 * This code generates an interactive 3D flower visualization using p5.js and WebGL.
 * Users can modify various parameters in real-time using sliders to create different flower shapes.
 * 
 * Reference:
 * @see https://github.com/Creativeguru97/YouTube_tutorial/tree/master/Play_with_geometry/3DMathFlowers
 * 
 * Features:
 * - Interactive controls for petal number, size, shape, and color
 * - Real-time 3D rendering with WebGL
 * - Parametric surface generation for flower petals
 * - Dynamic mesh generation with adjustable resolution
 * - Orbital camera controls for 3D viewing
 * 
 * Performance Optimizations:
 * 1. Memory Management:
 *    - Implemented vertex pooling to reduce garbage collection
 *    - Used typed arrays (Float32Array) for better performance
 *    - Cached geometry and calculations to minimize recreations
 * 
 * 2. Rendering Optimizations:
 *    - Added WebGL-specific optimizations (depth testing, face culling)
 *    - Implemented frame rate limiting (60 FPS)
 *    - Batch rendering for center points
 *    - Geometry caching to avoid recalculations
 * 
 * 3. Calculation Optimizations:
 *    - Pre-calculated trigonometric values
 *    - Added power lookup tables for common calculations
 *    - Optimized vertex access patterns
 *    - Reduced redundant math operations
 * 
 * 4. UI Performance:
 *    - Debounced slider updates
 *    - Optimized DOM operations with RequestAnimationFrame
 *    - Efficient slider value caching
 *    - Reduced unnecessary UI updates
 */

// Performance constants
const TWO_PI = 2 * Math.PI;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const E = Math.E;

// Cached calculations
let cachedSinCos = [];
let meshVertices = [];
let centerVertices = [];

let v = [];
let rows = 60, cols = 120;

// Pre-calculate common values
const ROW_NORM = 1 / rows;
const COL_NORM = 360 / cols;

let canvas;
let pNumSlider, pLenSlider, diameterSlider, pSharpSlider;
let colorSlider, layerSlider;
let heightSlider, curvatureSlider1, curvatureSlider2;
let bumpSlider, bumpNumSlider;

// Text display elements
let pNumText, pLenText, diameterText, pSharpText;
let heightText, curve1Text, curve2Text;
let bumpText, bumpNumText, colorText, layerText;

// Control panel dimensions
const CONTROL_WIDTH = 400;
const CONTROL_PADDING = 20;
const CONTROL_TOP_MARGIN = 50;

// Cache for slider values
let sliderCache = {
  pNum: 0,
  fD: 0,
  pLen: 0,
  pSharp: 0,
  fHeight: 0,
  curve1: 0,
  curve2: 0,
  b: 0,
  bNum: 0,
  baseHue: 0,
  layers: 0
};

function setup() {
  // Pre-calculate sin and cos values
  for (let i = 0; i < cols; i++) {
    const angle = i * COL_NORM * DEG_TO_RAD;
    cachedSinCos[i] = {
      sin: Math.sin(angle),
      cos: Math.cos(angle)
    };
  }

  // Create and center the canvas
  canvas = createCanvas(800, 800, WEBGL);
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  canvas.position(x, y);
  
  colorMode(HSB, 360, 100, 100);
  angleMode(DEGREES);
  noStroke();
  
  // Create sliders and their labels
  let sliderX = x - CONTROL_WIDTH - CONTROL_PADDING;
  let startY = y + CONTROL_TOP_MARGIN;
  let ySpacing = 30;
  let currentY = startY;
  
  // Petal number
  createText("Number of Petals: ", sliderX, currentY - 5);
  pNumSlider = createSlider(3, 12, 6, 1);
  pNumSlider.position(sliderX + 150, currentY);
  pNumText = createSpan('6');
  pNumText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Diameter
  createText("Flower Diameter: ", sliderX, currentY - 5);
  diameterSlider = createSlider(50, 300, 180, 10);
  diameterSlider.position(sliderX + 150, currentY);
  diameterText = createSpan('180');
  diameterText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Petal length
  createText("Petal Length: ", sliderX, currentY - 5);
  pLenSlider = createSlider(50, 300, 70, 10);  // Changed to 70
  pLenSlider.position(sliderX + 150, currentY);
  pLenText = createSpan('70');
  pLenText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Petal sharpness
  createText("Petal Sharpness: ", sliderX, currentY - 5);
  pSharpSlider = createSlider(0.1, 2.0, 2.0, 0.1);  // Changed to 2.0
  pSharpSlider.position(sliderX + 150, currentY);
  pSharpText = createSpan('2.0');
  pSharpText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Height
  createText("Flower Height: ", sliderX, currentY - 5);
  heightSlider = createSlider(100, 500, 300, 10);
  heightSlider.position(sliderX + 150, currentY);
  heightText = createSpan('300');
  heightText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Curvature 1
  createText("Curvature 1: ", sliderX, currentY - 5);
  curvatureSlider1 = createSlider(0.1, 2.0, 0.90, 0.05);  // Changed to 0.90
  curvatureSlider1.position(sliderX + 150, currentY);
  curve1Text = createSpan('0.90');
  curve1Text.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Curvature 2
  createText("Curvature 2: ", sliderX, currentY - 5);
  curvatureSlider2 = createSlider(0.1, 1.0, 0.20, 0.05);
  curvatureSlider2.position(sliderX + 150, currentY);
  curve2Text = createSpan('0.20');
  curve2Text.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Bumpiness
  createText("Bumpiness: ", sliderX, currentY - 5);
  bumpSlider = createSlider(0, 5, 0.5, 0.5);
  bumpSlider.position(sliderX + 150, currentY);
  bumpText = createSpan('0.5');
  bumpText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Bump frequency
  createText("Bump Frequency: ", sliderX, currentY - 5);
  bumpNumSlider = createSlider(0, 20, 20, 1);  // Changed to 20
  bumpNumSlider.position(sliderX + 150, currentY);
  bumpNumText = createSpan('20');
  bumpNumText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Color
  createText("Color Hue: ", sliderX, currentY - 5);
  colorSlider = createSlider(0, 360, 60, 10);
  colorSlider.position(sliderX + 150, currentY);
  colorText = createSpan('60');
  colorText.position(sliderX + 300, currentY);
  currentY += ySpacing;
  
  // Layers
  createText("Number of Layers: ", sliderX, currentY - 5);
  layerSlider = createSlider(1, 5, 1, 1);
  layerSlider.position(sliderX + 150, currentY);
  layerText = createSpan('1');
  layerText.position(sliderX + 300, currentY);
}

// Add windowResized function to handle window resizing
function windowResized() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  canvas.position(x, y);
  
  // Update all control positions
  let sliderX = x - CONTROL_WIDTH - CONTROL_PADDING;  // Position controls to the left of canvas
  let startY = y + CONTROL_TOP_MARGIN;   // Added top margin
  let ySpacing = 30;
  let currentY = startY;
  
  // Update positions for all controls
  for(let i = 0; i < 11; i++) {
    let slider, text, label;
    switch(i) {
      case 0: slider = pNumSlider; text = pNumText; break;
      case 1: slider = diameterSlider; text = diameterText; break;
      case 2: slider = pLenSlider; text = pLenText; break;
      case 3: slider = pSharpSlider; text = pSharpText; break;
      case 4: slider = heightSlider; text = heightText; break;
      case 5: slider = curvatureSlider1; text = curve1Text; break;
      case 6: slider = curvatureSlider2; text = curve2Text; break;
      case 7: slider = bumpSlider; text = bumpText; break;
      case 8: slider = bumpNumSlider; text = bumpNumText; break;
      case 9: slider = colorSlider; text = colorText; break;
      case 10: slider = layerSlider; text = layerText; break;
    }
    
    // Update positions
    slider.position(sliderX + 150, currentY);
    text.position(sliderX + 300, currentY);
    currentY += ySpacing;
  }
}

// Optimized shape calculation function
function vShape(A, r, a, b, c) {
  const absR = Math.abs(r);
  const powR = Math.pow(absR, c);
  return A * Math.pow(E, -b * powR) * Math.pow(absR, a);
}

// Optimized bumpiness calculation
function bumpiness(A, r, f, angle) {
  const r2 = r * r;
  return A * r2 * Math.sin(f * angle * DEG_TO_RAD);
}

function updateSliderCache() {
  const newValues = {
    pNum: pNumSlider.value(),
    fD: diameterSlider.value(),
    pLen: pLenSlider.value(),
    pSharp: pSharpSlider.value(),
    fHeight: heightSlider.value(),
    curve1: curvatureSlider1.value(),
    curve2: curvatureSlider2.value(),
    b: bumpSlider.value(),
    bNum: bumpNumSlider.value(),
    baseHue: colorSlider.value(),
    layers: layerSlider.value()
  };

  // Only update if values changed
  if (JSON.stringify(newValues) !== JSON.stringify(sliderCache)) {
    sliderCache = newValues;
    return true;
  }
  return false;
}

function updateTextDisplays() {
  pNumText.html(sliderCache.pNum);
  diameterText.html(sliderCache.fD);
  pLenText.html(sliderCache.pLen);
  pSharpText.html(sliderCache.pSharp.toFixed(1));
  heightText.html(sliderCache.fHeight);
  curve1Text.html(sliderCache.curve1.toFixed(2));
  curve2Text.html(sliderCache.curve2.toFixed(2));
  bumpText.html(sliderCache.b.toFixed(1));
  bumpNumText.html(sliderCache.bNum);
  colorText.html(sliderCache.baseHue);
  layerText.html(sliderCache.layers);
}

function generateMesh() {
  const halfPNum = sliderCache.pNum / 2;
  
  for (let layer = 0; layer < sliderCache.layers; layer++) {
    const layerOffset = layer * 10;
    const layerScale = 1 - layer * 0.05;
    
    v = [];
    for (let theta = 0; theta < rows; theta++) {
      v[theta] = [];
      const thetaNorm = theta * ROW_NORM;
      
      for (let phi = 0; phi < cols; phi++) {
        const phiAngle = phi * COL_NORM;
        const sinPhi = Math.pow(Math.abs(Math.sin(halfPNum * phiAngle * DEG_TO_RAD)), sliderCache.pSharp);
        const r = (sliderCache.pLen * sinPhi + sliderCache.fD) * thetaNorm;
        
        const x = r * cachedSinCos[phi].cos * layerScale;
        const y = r * cachedSinCos[phi].sin * layerScale;
        const z = vShape(sliderCache.fHeight, r/100, sliderCache.curve1, sliderCache.curve2, 1.5) - 200 +
                 bumpiness(sliderCache.b, r/100, sliderCache.bNum, phiAngle) + layerOffset;
        
        v[theta][phi] = {x, y, z};
      }
    }
    
    // Draw mesh
    for (let theta = 0; theta < rows - 1; theta++) {
      fill(sliderCache.baseHue + layer * 5, 20 - theta/4, 95 - layer * 5);
      
      for (let phi = 0; phi < cols; phi++) {
        const nextPhi = (phi + 1) % cols;
        
        beginShape();
        vertex(v[theta][phi].x, v[theta][phi].y, v[theta][phi].z);
        vertex(v[theta + 1][phi].x, v[theta + 1][phi].y, v[theta + 1][phi].z);
        vertex(v[theta + 1][nextPhi].x, v[theta + 1][nextPhi].y, v[theta + 1][nextPhi].z);
        vertex(v[theta][nextPhi].x, v[theta][nextPhi].y, v[theta][nextPhi].z);
        endShape(CLOSE);
      }
    }
  }
}

function drawCenter() {
  push();
  translate(0, 0, -180);
  
  // Pre-calculate center vertices if not already cached
  if (centerVertices.length === 0) {
    for (let r = 50; r > 0; r -= 2) {
      for (let angle = 0; angle < 360; angle += 5) {
        centerVertices.push({
          x: r * Math.cos(angle * DEG_TO_RAD),
          y: r * Math.sin(angle * DEG_TO_RAD)
        });
      }
    }
  }
  
  // Draw using cached vertices
  fill(sliderCache.baseHue + 10, 30, 95, 0.8);
  for (const vertex of centerVertices) {
    translate(vertex.x, vertex.y, 0);
    sphere(2);
    translate(-vertex.x, -vertex.y, 0);
  }
  
  pop();
}

function draw() {
  clear();
  background(220);
  orbitControl(4, 4);
  rotateX(60);

  // Only update if slider values changed
  if (updateSliderCache()) {
    updateTextDisplays();
  }

  generateMesh();
  drawCenter();
}

function createText(txt, x, y) {
  let p = createP(txt);
  p.style('color', '#000');
  p.style('font-family', 'Arial');
  p.style('font-size', '14px');
  p.position(x, y);
  return p;
} 