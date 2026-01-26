/**
 * Practice 60: Concentric Ripples
 * 
 * Shapes radiate outward from center points in expanding rings,
 * creating a ripple-like pattern across the canvas.
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

// Deep indigo palette
const colors = [
  '#1A1A2E', // Deep navy
  '#E94560', // Coral pink
  '#0F3460', // Dark blue
  '#F5E6CA'  // Warm ivory
];

let colorsRgb = [];

// Ripple parameters
const NUM_CENTERS = 1;          // Single center for clear concentric pattern
const RING_SPACING = 55;        // Tighter rings
const SHAPES_PER_RING_BASE = 12; // More shapes = denser rings
const BASE_SIZE = 30;

let centers = [];

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Generate ripple centers
function generateCenters() {
  const pts = [];
  
  // Single center - slightly off-center for visual interest
  const offsetX = random(-80, 80);
  const offsetY = random(-80, 80);
  pts.push({ 
    x: width / 2 + offsetX, 
    y: height / 2 + offsetY 
  });
  
  return pts;
}

// Generate shapes radiating from centers
function generateRipples() {
  const instances = [];
  
  for (const center of centers) {
    // Calculate max radius based on distance to canvas edge
    const maxRadius = max(
      dist(center.x, center.y, 0, 0),
      dist(center.x, center.y, width, 0),
      dist(center.x, center.y, 0, height),
      dist(center.x, center.y, width, height)
    );
    
    // Generate rings
    let ringIndex = 0;
    for (let radius = RING_SPACING; radius < maxRadius; radius += RING_SPACING) {
      // Each ring gets its own shape - makes rings visually distinct
      const ringShapeIndex = floor(random(shapes.length));
      
      // Alternating color pattern: every 3rd ring gets accent color
      let ringColorIndex = 0;
      if (ringIndex % 3 === 1) {
        ringColorIndex = 1; // Coral pink
      } else if (ringIndex % 5 === 0 && ringIndex > 0) {
        ringColorIndex = 2; // Dark blue
      }
      
      // More shapes in outer rings (circumference increases)
      const shapesInRing = floor(SHAPES_PER_RING_BASE + ringIndex * 2);
      const angleStep = TWO_PI / shapesInRing;
      
      // Offset alternating rings for visual interest
      const ringOffset = (ringIndex % 2) * (angleStep / 2);
      
      // Consistent size for entire ring (no random variation)
      const sizeFactor = map(radius, RING_SPACING, maxRadius, 1.3, 0.5);
      const ringSize = BASE_SIZE * sizeFactor;
      
      for (let i = 0; i < shapesInRing; i++) {
        const angle = i * angleStep + ringOffset;
        const x = center.x + cos(angle) * radius;
        const y = center.y + sin(angle) * radius;
        
        // Skip if outside canvas
        if (x < -20 || x > width + 20 || y < -20 || y > height + 20) continue;
        
        // Rotation: shapes point outward from center
        const rotation = angle + Math.PI / 2;
        
        instances.push({
          x,
          y,
          size: ringSize,
          rotation,
          shapeIndex: ringShapeIndex,
          colorIndex: ringColorIndex,
          ringIndex,
          radius
        });
      }
      
      ringIndex++;
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
  
  centers = generateCenters();
  shapeInstances = generateRipples();
  
  // Sort by radius so inner shapes draw on top of outer
  shapeInstances.sort((a, b) => b.radius - a.radius);
  
  noLoop();
}

function draw() {
  background(255);
  
  for (const instance of shapeInstances) {
    drawShape(instance);
  }
}
