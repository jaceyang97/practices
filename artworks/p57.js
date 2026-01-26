/**
 * Practice 57: Order to Chaos
 * 
 * Inspired by Vera Molnár and Georg Nees' "Schotter"
 * 
 * A grid of shapes where perfect mathematical order gradually dissolves
 * into controlled chaos. Top-left: perfect alignment. Bottom-right: 
 * displaced, rotated, varied. The diagonal gradient creates elegant tension.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let parsedShapes = [];
let shapeInstances = [];

const svgFiles = [
  'anthropic_basic_shapes/triangle_nonsym_outline_sparse.svg',
  'anthropic_basic_shapes/triangle_nonsym_filled_sparse.svg',
  'anthropic_basic_shapes/square_sym_filled_sparse.svg',
  'anthropic_basic_shapes/dot_sym_outline_dense.svg',
  'anthropic_basic_shapes/line_nonsym_outline_dense.svg',
  'anthropic_basic_shapes/dot_sym_outline_sparse.svg',
  'anthropic_basic_shapes/square_sym_filled_dense.svg',
  'anthropic_basic_shapes/dot_nonsym_outline_dense.svg',
  'anthropic_basic_shapes/square_sym_filled_dense_2.svg',
  'anthropic_basic_shapes/square_nonsym_filled_dense.svg',
  'anthropic_basic_shapes/square_sym_filled_sparse_2.svg',
  'anthropic_basic_shapes/circle_nonsym_filled_sparse.svg',
  'anthropic_basic_shapes/square_sym_filled_dense_3.svg',
  'anthropic_basic_shapes/circle_sym_outline_dense.svg',
  'anthropic_basic_shapes/dot_nonsym_outline_sparse.svg',
  'anthropic_basic_shapes/dot_sym_outline_dense_2.svg',
  'anthropic_basic_shapes/line_nonsym_outline_dense_2.svg',
  'anthropic_basic_shapes/line_nonsym_outline_dense_3.svg',
  'anthropic_basic_shapes/circle_sym_filled_dense.svg',
  'anthropic_basic_shapes/circle_sym_filled_sparse.svg',
  'anthropic_basic_shapes/line_sym_outline_dense.svg',
  'anthropic_basic_shapes/circle_sym_filled_dense_2.svg',
  'anthropic_basic_shapes/dot_sym_outline_dense_3.svg'
];

// Minimal palette - mostly black, subtle accents
const colors = [
  '#000000', // Black (dominant)
  '#C84B31', // Muted red
  '#346751', // Deep teal
  '#E9D5A1'  // Warm cream
];

let colorsRgb = [];

// Grid parameters
const GRID_COLS = 12;
const GRID_ROWS = 12;
const BASE_SIZE = 55;
const MAX_JITTER = 25;           // Max position displacement
const MAX_ROTATION = Math.PI / 2; // Max rotation (90 degrees)
const MAX_SIZE_VAR = 0.35;        // Size varies by ±35%

function parseShapeName(filename) {
  const name = filename.split('/').pop().replace('.svg', '').replace(/_\d+$/, '');
  const parts = name.split('_');
  return {
    geometric: parts[0],
    symmetry: parts[1],
    fill: parts[2],
    density: parts[3]
  };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Calculate chaos factor based on position (0 = order, 1 = chaos)
function getChaosFactor(row, col) {
  // Diagonal gradient: top-left = 0, bottom-right = 1
  return (row + col) / (GRID_ROWS + GRID_COLS - 2);
}

// Generate the grid with order-to-chaos transition
function generateGrid() {
  const instances = [];
  const padding = 80;
  const cellWidth = (width - padding * 2) / GRID_COLS;
  const cellHeight = (height - padding * 2) / GRID_ROWS;
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      // Base position (perfect grid)
      const baseX = padding + col * cellWidth + cellWidth / 2;
      const baseY = padding + row * cellHeight + cellHeight / 2;
      
      // Chaos factor for this cell
      const chaos = getChaosFactor(row, col);
      
      // Apply chaos to position (jitter)
      const jitterX = random(-MAX_JITTER, MAX_JITTER) * chaos;
      const jitterY = random(-MAX_JITTER, MAX_JITTER) * chaos;
      const x = baseX + jitterX;
      const y = baseY + jitterY;
      
      // Apply chaos to rotation
      const rotation = random(-MAX_ROTATION, MAX_ROTATION) * chaos;
      
      // Apply chaos to size
      const sizeVariation = 1 + random(-MAX_SIZE_VAR, MAX_SIZE_VAR) * chaos;
      const size = BASE_SIZE * sizeVariation;
      
      // Color: mostly black, slight increase in color probability with chaos
      // Order = ~95% black, Chaos = ~80% black
      const colorProb = 0.05 + chaos * 0.15;
      const colorIndex = random() < colorProb ? floor(random(1, colors.length)) : 0;
      
      // Shape: in ordered area use same shape, in chaotic area vary
      // Use row-based shape in ordered zone, random in chaotic zone
      let shapeIndex;
      if (random() < chaos) {
        shapeIndex = floor(random(shapes.length));
      } else {
        // More ordered: shapes in same row tend to be similar
        shapeIndex = (row * 2 + floor(col / 4)) % shapes.length;
      }
      
      instances.push({
        x: x,
        y: y,
        size: size,
        rotation: rotation,
        shapeIndex: shapeIndex,
        colorIndex: colorIndex,
        chaos: chaos // Store for potential use
      });
    }
  }
  
  return instances;
}

// Draw a shape with rotation and color
function drawShape(instance) {
  const shapeImg = shapes[instance.shapeIndex];
  if (!shapeImg || shapeImg.width === 0) return;
  
  const rgb = colorsRgb[instance.colorIndex];
  
  // Scale to target size
  const scale = instance.size / max(shapeImg.width, shapeImg.height);
  const w = shapeImg.width * scale;
  const h = shapeImg.height * scale;
  
  // Create colored version
  const g = createGraphics(w, h);
  g.imageMode(CORNER);
  g.image(shapeImg, 0, 0, w, h);
  
  g.loadPixels();
  for (let i = 0; i < g.pixels.length; i += 4) {
    if (g.pixels[i + 3] > 0) {
      g.pixels[i] = rgb.r;
      g.pixels[i + 1] = rgb.g;
      g.pixels[i + 2] = rgb.b;
    }
  }
  g.updatePixels();
  
  // Draw with rotation
  push();
  translate(instance.x, instance.y);
  rotate(instance.rotation);
  imageMode(CENTER);
  image(g, 0, 0);
  pop();
  
  g.remove();
}

function preload() {
  for (let i = 0; i < svgFiles.length; i++) {
    shapes.push(loadImage(svgFiles[i]));
    parsedShapes.push(parseShapeName(svgFiles[i]));
  }
}

function setup() {
  createCanvas(1000, 1000);
  
  // Convert colors to RGB
  for (let i = 0; i < colors.length; i++) {
    colorsRgb.push(hexToRgb(colors[i]));
  }
  
  // Generate the order-to-chaos grid
  shapeInstances = generateGrid();
  
  noLoop();
}

function draw() {
  background(255);
  
  // Draw all shapes
  for (const instance of shapeInstances) {
    drawShape(instance);
  }
}
