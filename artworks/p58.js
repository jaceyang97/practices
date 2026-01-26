/**
 * Practice 58: Shape Packing
 * 
 * Shapes fill the canvas without overlapping, creating organic density.
 * Larger shapes placed first, progressively smaller ones fill gaps.
 * 
 * Code by Jace Yang
 */

let shapes = [];
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

const colors = [
  '#000000',
  '#C84B31',
  '#346751',
  '#E9D5A1'
];

let colorsRgb = [];

// Packing parameters
const MIN_SIZE = 15;
const MAX_SIZE = 90;
const PADDING = 4;
const MAX_ATTEMPTS = 2000;

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Check if two circles overlap (using bounding circles for shapes)
function overlaps(x, y, r, instances) {
  for (const inst of instances) {
    const dx = x - inst.x;
    const dy = y - inst.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < r + inst.radius + PADDING) {
      return true;
    }
  }
  return false;
}

// Check if position is within canvas bounds
function inBounds(x, y, r) {
  const margin = 30;
  return x - r > margin && x + r < width - margin &&
         y - r > margin && y + r < height - margin;
}

// Generate packed shapes
function generatePacking() {
  const instances = [];
  
  // Try to place shapes, starting with larger sizes
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Size decreases as we place more shapes (larger first)
    const progress = attempt / MAX_ATTEMPTS;
    const sizeRange = MAX_SIZE - MIN_SIZE;
    const maxSizeNow = MAX_SIZE - progress * sizeRange * 0.7;
    const size = random(MIN_SIZE, maxSizeNow);
    const radius = size / 2;
    
    // Random position
    const x = random(radius + 30, width - radius - 30);
    const y = random(radius + 30, height - radius - 30);
    
    // Check if it fits
    if (!overlaps(x, y, radius, instances) && inBounds(x, y, radius)) {
      // Color: mostly black
      const colorIndex = random() < 0.12 ? floor(random(1, colors.length)) : 0;
      
      instances.push({
        x: x,
        y: y,
        size: size,
        radius: radius,
        rotation: random(TWO_PI),
        shapeIndex: floor(random(shapes.length)),
        colorIndex: colorIndex
      });
    }
  }
  
  return instances;
}

function drawShape(instance) {
  const shapeImg = shapes[instance.shapeIndex];
  if (!shapeImg || shapeImg.width === 0) return;
  
  const rgb = colorsRgb[instance.colorIndex];
  const scale = instance.size / max(shapeImg.width, shapeImg.height);
  const w = shapeImg.width * scale;
  const h = shapeImg.height * scale;
  
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
  }
}

function setup() {
  createCanvas(1000, 1000);
  
  for (let i = 0; i < colors.length; i++) {
    colorsRgb.push(hexToRgb(colors[i]));
  }
  
  shapeInstances = generatePacking();
  
  noLoop();
}

function draw() {
  background(255);
  
  // Draw smaller shapes first (they're at the end of array)
  // so larger shapes appear on top
  for (let i = shapeInstances.length - 1; i >= 0; i--) {
    drawShape(shapeInstances[i]);
  }
}
