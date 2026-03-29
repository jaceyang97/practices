/**
 * Practice 59: Recursive Subdivision
 * 
 * Mondrian-inspired recursive splitting of the canvas.
 * Each region can split horizontally or vertically,
 * with shapes placed in the final subdivisions.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let regions = [];

const svgFiles = [
  '/anthropic_basic_shapes/triangle_nonsym_outline_sparse.svg',
  '/anthropic_basic_shapes/triangle_nonsym_filled_sparse.svg',
  '/anthropic_basic_shapes/square_sym_filled_sparse.svg',
  '/anthropic_basic_shapes/dot_sym_outline_dense.svg',
  '/anthropic_basic_shapes/line_nonsym_outline_dense.svg',
  '/anthropic_basic_shapes/dot_sym_outline_sparse.svg',
  '/anthropic_basic_shapes/square_sym_filled_dense.svg',
  '/anthropic_basic_shapes/dot_nonsym_outline_dense.svg',
  '/anthropic_basic_shapes/square_sym_filled_dense_2.svg',
  '/anthropic_basic_shapes/square_nonsym_filled_dense.svg',
  '/anthropic_basic_shapes/square_sym_filled_sparse_2.svg',
  '/anthropic_basic_shapes/circle_nonsym_filled_sparse.svg',
  '/anthropic_basic_shapes/square_sym_filled_dense_3.svg',
  '/anthropic_basic_shapes/circle_sym_outline_dense.svg',
  '/anthropic_basic_shapes/dot_nonsym_outline_sparse.svg',
  '/anthropic_basic_shapes/dot_sym_outline_dense_2.svg',
  '/anthropic_basic_shapes/line_nonsym_outline_dense_2.svg',
  '/anthropic_basic_shapes/line_nonsym_outline_dense_3.svg',
  '/anthropic_basic_shapes/circle_sym_filled_dense.svg',
  '/anthropic_basic_shapes/circle_sym_filled_sparse.svg',
  '/anthropic_basic_shapes/line_sym_outline_dense.svg',
  '/anthropic_basic_shapes/circle_sym_filled_dense_2.svg',
  '/anthropic_basic_shapes/dot_sym_outline_dense_3.svg'
];

// Earthy terracotta palette
const colors = [
  '#2D2D2D', // Charcoal
  '#D4A373', // Terracotta tan
  '#6B705C', // Olive sage
  '#E07A5F'  // Burnt sienna
];

let colorsRgb = [];

// Subdivision parameters
const MIN_SIZE = 80;
const MAX_DEPTH = 5;
const SPLIT_PROB = 0.85;
const GAP = 6;

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Recursive subdivision
function subdivide(x, y, w, h, depth) {
  // Stop conditions: too small, max depth, or random stop
  if (w < MIN_SIZE || h < MIN_SIZE || depth >= MAX_DEPTH || random() > SPLIT_PROB) {
    // This is a leaf region - add it
    regions.push({ x, y, w, h, depth });
    return;
  }
  
  // Decide split direction based on aspect ratio
  const splitHorizontal = w < h ? true : (h < w ? false : random() < 0.5);
  
  if (splitHorizontal) {
    // Split horizontally (top/bottom)
    const splitPoint = random(0.3, 0.7);
    const h1 = h * splitPoint - GAP / 2;
    const h2 = h * (1 - splitPoint) - GAP / 2;
    
    subdivide(x, y, w, h1, depth + 1);
    subdivide(x, y + h1 + GAP, w, h2, depth + 1);
  } else {
    // Split vertically (left/right)
    const splitPoint = random(0.3, 0.7);
    const w1 = w * splitPoint - GAP / 2;
    const w2 = w * (1 - splitPoint) - GAP / 2;
    
    subdivide(x, y, w1, h, depth + 1);
    subdivide(x + w1 + GAP, y, w2, h, depth + 1);
  }
}

function drawRegion(region) {
  const { x, y, w, h, depth } = region;
  
  // Some regions are empty (white space)
  if (random() < 0.15) return;
  
  // Color: mostly black, deeper regions slightly more likely to have color
  const colorProb = 0.08 + depth * 0.03;
  const colorIndex = random() < colorProb ? floor(random(1, colors.length)) : 0;
  const rgb = colorsRgb[colorIndex];
  
  // Pick a shape
  const shapeIndex = floor(random(shapes.length));
  const shapeImg = shapes[shapeIndex];
  if (!shapeImg || shapeImg.width === 0) return;
  
  // Size shape to fit region with padding
  const padding = 10;
  const maxSize = min(w, h) - padding * 2;
  if (maxSize < 20) return;
  
  const size = maxSize * random(0.6, 0.95);
  const scale = size / max(shapeImg.width, shapeImg.height);
  const sw = shapeImg.width * scale;
  const sh = shapeImg.height * scale;
  
  // Create colored version
  const g = createGraphics(sw, sh);
  g.imageMode(CORNER);
  g.image(shapeImg, 0, 0, sw, sh);
  
  g.loadPixels();
  for (let i = 0; i < g.pixels.length; i += 4) {
    if (g.pixels[i + 3] > 0) {
      g.pixels[i] = rgb.r;
      g.pixels[i + 1] = rgb.g;
      g.pixels[i + 2] = rgb.b;
    }
  }
  g.updatePixels();
  
  // Draw centered in region with slight offset
  const cx = x + w / 2 + random(-5, 5);
  const cy = y + h / 2 + random(-5, 5);
  const rotation = random() < 0.3 ? random(-0.2, 0.2) : 0;
  
  push();
  translate(cx, cy);
  rotate(rotation);
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
  
  // Start subdivision from full canvas with margin
  const margin = 40;
  subdivide(margin, margin, width - margin * 2, height - margin * 2, 0);
  
  noLoop();
}

function draw() {
  background(255);
  
  // Optional: draw region borders for Mondrian effect
  // stroke(230);
  // strokeWeight(1);
  // for (const r of regions) {
  //   noFill();
  //   rect(r.x, r.y, r.w, r.h);
  // }
  
  // Draw shapes in regions
  for (const region of regions) {
    drawRegion(region);
  }
}
