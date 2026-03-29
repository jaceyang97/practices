/**
 * Practice 56: Scale and Overlap
 * 
 * A static composition with dramatic scale variation - shapes range from
 * tiny (15px) to huge (400px). Shapes cluster together and can overlap.
 * Large anchor shapes establish weight, smaller shapes fill the gaps.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let parsedShapes = [];
let shapeInstances = [];
let clusterCenters = [];

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

// Simple color palette - mostly black with accents
const colors = [
  '#000000', // Black (majority)
  '#E85D45', // Warm accent (coral red)
  '#3A7CA5', // Cool accent (blue)
  '#F2C14E'  // Gold accent
];

let colorsRgb = [];

// Parse shape name
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

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Generate cluster centers
function generateClusterCenters(count) {
  const centers = [];
  const margin = 150;
  
  for (let i = 0; i < count; i++) {
    centers.push({
      x: random(margin, width - margin),
      y: random(margin, height - margin),
      radius: random(150, 300) // How far shapes spread from center
    });
  }
  
  return centers;
}

// Get position near a cluster center
function getClusteredPosition(cluster, spread) {
  const angle = random(TWO_PI);
  const dist = random(spread);
  return {
    x: cluster.x + cos(angle) * dist,
    y: cluster.y + sin(angle) * dist
  };
}

// Place anchor shapes (large, 250-400px) - at cluster centers
function placeAnchorShapes() {
  const instances = [];
  
  for (let i = 0; i < clusterCenters.length; i++) {
    const cluster = clusterCenters[i];
    const size = random(250, 400);
    
    // Anchor at cluster center with slight offset
    const x = cluster.x + random(-30, 30);
    const y = cluster.y + random(-30, 30);
    
    // 70% black, 30% colored for anchors
    const colorIndex = random() < 0.7 ? 0 : floor(random(1, colors.length));
    
    instances.push({
      x: x,
      y: y,
      size: size,
      shapeIndex: floor(random(shapes.length)),
      colorIndex: colorIndex,
      rotation: random(TWO_PI),
      layer: 0
    });
  }
  
  return instances;
}

// Place medium shapes (60-150px) - clustered around centers
function placeMediumShapes(countPerCluster) {
  const instances = [];
  
  for (const cluster of clusterCenters) {
    for (let i = 0; i < countPerCluster; i++) {
      const pos = getClusteredPosition(cluster, cluster.radius * 0.8);
      const size = random(60, 150);
      
      // 75% black, 25% colored
      const colorIndex = random() < 0.75 ? 0 : floor(random(1, colors.length));
      
      instances.push({
        x: pos.x,
        y: pos.y,
        size: size,
        shapeIndex: floor(random(shapes.length)),
        colorIndex: colorIndex,
        rotation: random(TWO_PI),
        layer: 1
      });
    }
  }
  
  return instances;
}

// Place small shapes (12-45px) - denser clustering
function placeSmallShapes(countPerCluster) {
  const instances = [];
  
  for (const cluster of clusterCenters) {
    for (let i = 0; i < countPerCluster; i++) {
      const pos = getClusteredPosition(cluster, cluster.radius);
      const size = random(12, 45);
      
      // 80% black, 20% colored
      const colorIndex = random() < 0.8 ? 0 : floor(random(1, colors.length));
      
      instances.push({
        x: pos.x,
        y: pos.y,
        size: size,
        shapeIndex: floor(random(shapes.length)),
        colorIndex: colorIndex,
        rotation: random(TWO_PI),
        layer: 2
      });
    }
  }
  
  return instances;
}

// Place tiny scattered shapes (8-20px) - some random, some near clusters
function placeTinyShapes(count) {
  const instances = [];
  
  for (let i = 0; i < count; i++) {
    let x, y;
    
    // 60% near clusters, 40% random fill
    if (random() < 0.6) {
      const cluster = random(clusterCenters);
      const pos = getClusteredPosition(cluster, cluster.radius * 1.3);
      x = pos.x;
      y = pos.y;
    } else {
      x = random(width);
      y = random(height);
    }
    
    const size = random(8, 20);
    
    // 85% black, 15% colored
    const colorIndex = random() < 0.85 ? 0 : floor(random(1, colors.length));
    
    instances.push({
      x: x,
      y: y,
      size: size,
      shapeIndex: floor(random(shapes.length)),
      colorIndex: colorIndex,
      rotation: random(TWO_PI),
      layer: 3
    });
  }
  
  return instances;
}

// Draw a shape at given position with color and rotation
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
  
  // Generate 5-7 cluster centers
  clusterCenters = generateClusterCenters(floor(random(5, 8)));
  
  // Generate shapes in layers
  // Layer 0: Anchor shapes (large) - one per cluster
  const anchors = placeAnchorShapes();
  shapeInstances.push(...anchors);
  
  // Layer 1: Medium shapes - clustered
  const mediums = placeMediumShapes(8); // 8 per cluster
  shapeInstances.push(...mediums);
  
  // Layer 2: Small shapes - clustered
  const smalls = placeSmallShapes(15); // 15 per cluster
  shapeInstances.push(...smalls);
  
  // Layer 3: Tiny shapes - mixed clustering and random
  const tinys = placeTinyShapes(80);
  shapeInstances.push(...tinys);
  
  // Sort by layer so we draw back to front
  shapeInstances.sort((a, b) => a.layer - b.layer);
  
  noLoop();
}

function draw() {
  background(255);
  
  // Draw all shapes (sorted by layer, back to front)
  for (const instance of shapeInstances) {
    drawShape(instance);
  }
}
