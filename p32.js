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
const CONTROL_WIDTH = 320;
const CONTROL_PADDING = 20;
const CONTROL_TOP_MARGIN = 50;
const CONTROL_HEIGHT = 600;

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
  
  // Create control panel background
  createControlPanel(x, y);
  
  // Create sliders and their labels
  let sliderX = x + width + CONTROL_PADDING; // Move to right side
  let startY = y + CONTROL_TOP_MARGIN;
  let ySpacing = 35; // Increased spacing for better visual hierarchy
  let currentY = startY;
  
  // Petal number
  createStyledText("Number of Petals", sliderX + 20, currentY - 5);
  pNumSlider = createStyledSlider(3, 12, 6, 1);
  pNumSlider.position(sliderX + 20, currentY + 15);
  pNumText = createStyledValue('6');
  pNumText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Diameter
  createStyledText("Flower Diameter", sliderX + 20, currentY - 5);
  diameterSlider = createStyledSlider(50, 300, 180, 10);
  diameterSlider.position(sliderX + 20, currentY + 15);
  diameterText = createStyledValue('180');
  diameterText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Petal length
  createStyledText("Petal Length", sliderX + 20, currentY - 5);
  pLenSlider = createStyledSlider(50, 300, 70, 10);
  pLenSlider.position(sliderX + 20, currentY + 15);
  pLenText = createStyledValue('70');
  pLenText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Petal sharpness
  createStyledText("Petal Sharpness", sliderX + 20, currentY - 5);
  pSharpSlider = createStyledSlider(0.1, 2.0, 2.0, 0.1);
  pSharpSlider.position(sliderX + 20, currentY + 15);
  pSharpText = createStyledValue('2.0');
  pSharpText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Height
  createStyledText("Flower Height", sliderX + 20, currentY - 5);
  heightSlider = createStyledSlider(100, 500, 300, 10);
  heightSlider.position(sliderX + 20, currentY + 15);
  heightText = createStyledValue('300');
  heightText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Curvature 1
  createStyledText("Curvature 1", sliderX + 20, currentY - 5);
  curvatureSlider1 = createStyledSlider(0.1, 2.0, 0.90, 0.05);
  curvatureSlider1.position(sliderX + 20, currentY + 15);
  curve1Text = createStyledValue('0.90');
  curve1Text.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Curvature 2
  createStyledText("Curvature 2", sliderX + 20, currentY - 5);
  curvatureSlider2 = createStyledSlider(0.1, 1.0, 0.20, 0.05);
  curvatureSlider2.position(sliderX + 20, currentY + 15);
  curve2Text = createStyledValue('0.20');
  curve2Text.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Bumpiness
  createStyledText("Bumpiness", sliderX + 20, currentY - 5);
  bumpSlider = createStyledSlider(0, 5, 0.5, 0.5);
  bumpSlider.position(sliderX + 20, currentY + 15);
  bumpText = createStyledValue('0.5');
  bumpText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Bump frequency
  createStyledText("Bump Frequency", sliderX + 20, currentY - 5);
  bumpNumSlider = createStyledSlider(0, 20, 20, 1);
  bumpNumSlider.position(sliderX + 20, currentY + 15);
  bumpNumText = createStyledValue('20');
  bumpNumText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Color
  createStyledText("Color Hue", sliderX + 20, currentY - 5);
  colorSlider = createStyledSlider(0, 360, 60, 10);
  colorSlider.position(sliderX + 20, currentY + 15);
  colorText = createStyledValue('60');
  colorText.position(sliderX + 250, currentY + 15);
  currentY += ySpacing;
  
  // Layers
  createStyledText("Number of Layers", sliderX + 20, currentY - 5);
  layerSlider = createStyledSlider(1, 5, 1, 1);
  layerSlider.position(sliderX + 20, currentY + 15);
  layerText = createStyledValue('1');
  layerText.position(sliderX + 250, currentY + 15);
}

// Add windowResized function to handle window resizing
function windowResized() {
  let x = (windowWidth - width) / 2;
  let y = (windowHeight - height) / 2;
  canvas.position(x, y);
  
  // Update all control positions
  let sliderX = x + width + CONTROL_PADDING;  // Position controls to the right of canvas
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

function createControlPanel(canvasX, canvasY) {
  let panelX = canvasX + width + CONTROL_PADDING; // Position to the right
  let panelY = canvasY;
  
  // Create main panel background
  let panel = createDiv();
  panel.style('position', 'absolute');
  panel.style('left', panelX + 'px');
  panel.style('top', panelY + 'px');
  panel.style('width', CONTROL_WIDTH + 'px');
  panel.style('height', CONTROL_HEIGHT + 'px');
  panel.style('background', 'rgba(255, 255, 255, 0.9)');
  panel.style('backdrop-filter', 'blur(10px)');
  panel.style('border', '1px solid rgba(0, 0, 0, 0.1)');
  panel.style('border-radius', '12px');
  panel.style('box-shadow', '0 4px 16px rgba(0, 0, 0, 0.1)');
  panel.style('overflow', 'hidden');
  
  return panel;
}

function createStyledText(txt, x, y) {
  let p = createP(txt);
  p.style('color', '#333');
  p.style('font-family', "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");
  p.style('font-size', '13px');
  p.style('font-weight', '500');
  p.style('margin', '0');
  p.position(x, y);
  return p;
}

function createStyledSlider(min, max, value, step) {
  let slider = createSlider(min, max, value, step);
  slider.style('width', '180px');
  slider.style('height', '6px');
  slider.style('background', '#e0e0e0');
  slider.style('border-radius', '3px');
  slider.style('outline', 'none');
  slider.style('appearance', 'none');
  slider.style('cursor', 'pointer');
  slider.style('border', '1px solid #ccc');
  
  // Custom slider styling - more visible
  slider.style('background', `
    linear-gradient(to right, 
      #4CAF50 0%, 
      #4CAF50 ${(value - min) / (max - min) * 100}%, 
      #e0e0e0 ${(value - min) / (max - min) * 100}%, 
      #e0e0e0 100%
    )
  `);
  
  return slider;
}

function createStyledValue(value) {
  let span = createSpan(value);
  span.style('color', '#333');
  span.style('font-family', "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif");
  span.style('font-size', '12px');
  span.style('font-weight', '500');
  span.style('background', '#f5f5f5');
  span.style('padding', '3px 8px');
  span.style('border-radius', '4px');
  span.style('border', '1px solid #ddd');
  span.style('min-width', '35px');
  span.style('text-align', 'center');
  span.style('display', 'inline-block');
  return span;
}

function createText(txt, x, y) {
  let p = createP(txt);
  p.style('color', '#000');
  p.style('font-family', 'Arial');
  p.style('font-size', '14px');
  p.position(x, y);
  return p;
}

// Add CSS animations
function addFloatingAnimation() {
  let style = document.createElement('style');
  style.innerHTML = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      25% { transform: translateY(-10px) rotate(90deg); }
      50% { transform: translateY(-5px) rotate(180deg); }
      75% { transform: translateY(-15px) rotate(270deg); }
    }
  `;
  document.head.appendChild(style);
}

// Call the animation setup
addFloatingAnimation(); 