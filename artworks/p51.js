/**
 * Practice 51: Shape with 2x2 Block (Optimized)
 * 
 * Randomly selects a basic shape and displays it in a 3x3 grid.
 * The grid consists of one random 2x2 block and five 1x1 cells.
 * 
 * OPTIMIZED: Pre-parsed attributes, Set lookups, incremental counting,
 * cached RGB, pre-rendered buffers, lookup tables.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let parsedShapes = []; // Pre-parsed shape attributes (optimization #1)
let shapeAssignments; // Maps positions to pre-rendered graphics buffers

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

const colors = [
  '#000000', // Black
  '#528FCC', // Soft blue
  '#728058', // Olive green
  '#AB5C76', // Dusty rose
  '#B2D1C7', // Seafoam mint
  '#C8C7D6', // Lavender gray
  '#EBC7C7'  // Blush pink
];

// Pre-computed RGB values (optimization #4)
let colorsRgb = [];

// Block position lookup tables (optimization #6)
const blockData = {
  'top-left': {
    check: (r, c) => r < 2 && c < 2,
    first: { row: 0, col: 0 }
  },
  'top-right': {
    check: (r, c) => r < 2 && c >= 1,
    first: { row: 0, col: 1 }
  },
  'bottom-left': {
    check: (r, c) => r >= 1 && c < 2,
    first: { row: 1, col: 0 }
  },
  'bottom-right': {
    check: (r, c) => r >= 1 && c >= 1,
    first: { row: 1, col: 1 }
  }
};

let blockPosition;
let coloredPosition;
let selectedColorRgb; // Store RGB directly instead of hex

// Parse shape name once (called only during preload)
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

// Fast lookup using pre-computed data (optimization #6)
function isIn2x2Block(row, col) {
  return blockData[blockPosition].check(row, col);
}

function getFirstCellOfBlock() {
  return blockData[blockPosition].first;
}

// Optimized diversity score using pre-parsed shapes and incremental counts (optimization #1, #3)
function calculateDiversityScoreFast(candidateIndex, attrCounts, totalSelected) {
  if (totalSelected === 0) return 1;
  
  const candidate = parsedShapes[candidateIndex];
  
  const sharedGeometric = attrCounts.geometric[candidate.geometric] || 0;
  const sharedSymmetry = attrCounts.symmetry[candidate.symmetry] || 0;
  const sharedFill = attrCounts.fill[candidate.fill] || 0;
  const sharedDensity = attrCounts.density[candidate.density] || 0;
  
  const geometricRatio = sharedGeometric / totalSelected;
  const symmetryRatio = sharedSymmetry / totalSelected;
  const fillRatio = sharedFill / totalSelected;
  const densityRatio = sharedDensity / totalSelected;
  
  return (1 - geometricRatio) + (1 - symmetryRatio) + (1 - fillRatio) + (1 - densityRatio);
}

// Check limits using pre-parsed shapes and running counts (optimization #1, #3)
function wouldExceedLimitsFast(candidateIndex, attrCounts, maxPerAttribute) {
  const candidate = parsedShapes[candidateIndex];
  
  if ((attrCounts.fill[candidate.fill] || 0) >= maxPerAttribute) {
    return true;
  }
  if ((attrCounts.geometric[candidate.geometric] || 0) >= maxPerAttribute) {
    return true;
  }
  return false;
}

// Update attribute counts incrementally (optimization #3)
function addToAttrCounts(attrCounts, shapeIndex) {
  const parsed = parsedShapes[shapeIndex];
  attrCounts.geometric[parsed.geometric] = (attrCounts.geometric[parsed.geometric] || 0) + 1;
  attrCounts.symmetry[parsed.symmetry] = (attrCounts.symmetry[parsed.symmetry] || 0) + 1;
  attrCounts.fill[parsed.fill] = (attrCounts.fill[parsed.fill] || 0) + 1;
  attrCounts.density[parsed.density] = (attrCounts.density[parsed.density] || 0) + 1;
}

// Optimized selection using Set and incremental counting (optimization #2, #3)
function selectBalancedShapeFast(selectedSet, attrCounts, totalSelected, maxPerAttribute) {
  // Build available indices using Set for O(1) lookup (optimization #2)
  const availableIndices = [];
  for (let i = 0; i < shapes.length; i++) {
    if (!selectedSet.has(i)) {
      availableIndices.push(i);
    }
  }
  
  if (availableIndices.length === 0) {
    return floor(random(shapes.length));
  }
  
  // Filter using pre-computed counts (no recounting needed)
  const balancedIndices = [];
  for (let i = 0; i < availableIndices.length; i++) {
    if (!wouldExceedLimitsFast(availableIndices[i], attrCounts, maxPerAttribute)) {
      balancedIndices.push(availableIndices[i]);
    }
  }
  
  const candidates = balancedIndices.length > 0 ? balancedIndices : availableIndices;
  
  // Calculate scores
  const scores = new Array(candidates.length);
  let totalScore = 0;
  
  for (let i = 0; i < candidates.length; i++) {
    const score = calculateDiversityScoreFast(candidates[i], attrCounts, totalSelected) + 0.1;
    scores[i] = score;
    totalScore += score;
  }
  
  // Weighted random selection
  let r = random(totalScore);
  for (let i = 0; i < candidates.length; i++) {
    r -= scores[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

// Create a colored graphics buffer for a shape (optimization #5 - moved from draw to setup)
function createColoredBuffer(shapeImg, targetSize, rgb) {
  const scale = targetSize / max(shapeImg.width, shapeImg.height);
  const w = shapeImg.width * scale;
  const h = shapeImg.height * scale;
  
  const g = createGraphics(w, h);
  g.imageMode(CORNER);
  g.image(shapeImg, 0, 0, w, h);
  
  g.loadPixels();
  const pixels = g.pixels;
  const len = pixels.length;
  for (let i = 0; i < len; i += 4) {
    if (pixels[i + 3] > 0) {
      pixels[i] = rgb.r;
      pixels[i + 1] = rgb.g;
      pixels[i + 2] = rgb.b;
    }
  }
  g.updatePixels();
  
  return g;
}

function setupShapes() {
  const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  blockPosition = random(positions);
  
  const firstCell = getFirstCellOfBlock();
  const individualCells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (!isIn2x2Block(row, col)) {
        individualCells.push({ row, col });
      }
    }
  }
  
  // Pre-compute layout constants
  const padding = 40;
  const cellWidth = (800 - padding * 2) / 3;
  const cellHeight = (800 - padding * 2) / 3;
  const shapeSize1x1 = min(cellWidth, cellHeight) * 0.85;
  const shapeSize2x2 = min(cellWidth * 2, cellHeight * 2) * 0.925;
  
  // Create position list with pre-computed render info
  const allPositions = [
    { 
      type: 'block', 
      row: firstCell.row, 
      col: firstCell.col,
      size: shapeSize2x2,
      x: padding + firstCell.col * cellWidth + cellWidth,
      y: padding + firstCell.row * cellHeight + cellHeight
    }
  ];
  
  for (const c of individualCells) {
    allPositions.push({
      type: 'cell',
      row: c.row,
      col: c.col,
      size: shapeSize1x1,
      x: padding + c.col * cellWidth + cellWidth / 2,
      y: padding + c.row * cellHeight + cellHeight / 2
    });
  }
  
  // Randomly select colored position
  if (random() < 0.5) {
    coloredPosition = 'block';
  } else {
    coloredPosition = random(individualCells);
  }
  
  // Select color and get its RGB
  const colorIndex = floor(random(1, colors.length));
  selectedColorRgb = colorsRgb[colorIndex];
  const blackRgb = colorsRgb[0];
  
  // Select shapes using optimized algorithm with Set and incremental counts
  const selectedSet = new Set(); // optimization #2
  const attrCounts = { geometric: {}, symmetry: {}, fill: {}, density: {} }; // optimization #3
  
  shapeAssignments = new Map();
  
  for (let i = 0; i < allPositions.length; i++) {
    const pos = allPositions[i];
    
    // Select shape
    const shapeIndex = selectBalancedShapeFast(selectedSet, attrCounts, selectedSet.size, 3);
    selectedSet.add(shapeIndex);
    addToAttrCounts(attrCounts, shapeIndex);
    
    // Determine color for this position
    let rgb;
    if (pos.type === 'block') {
      rgb = (coloredPosition === 'block') ? selectedColorRgb : blackRgb;
    } else {
      const isColored = coloredPosition !== 'block' && 
                       coloredPosition.row === pos.row && 
                       coloredPosition.col === pos.col;
      rgb = isColored ? selectedColorRgb : blackRgb;
    }
    
    // Pre-render the colored buffer (optimization #5)
    const buffer = createColoredBuffer(shapes[shapeIndex], pos.size, rgb);
    
    shapeAssignments.set(i, {
      buffer: buffer,
      x: pos.x,
      y: pos.y
    });
  }
}

function preload() {
  // Load shapes and pre-parse attributes (optimization #1)
  for (let i = 0; i < svgFiles.length; i++) {
    shapes.push(loadImage(svgFiles[i]));
    parsedShapes.push(parseShapeName(svgFiles[i]));
  }
  
  // Pre-convert colors to RGB (optimization #4)
  for (let i = 0; i < colors.length; i++) {
    const hex = colors[i];
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    colorsRgb.push({
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    });
  }
}

function setup() {
  createCanvas(800, 800);
  setupShapes();
  noLoop();
}

function draw() {
  background(255);
  
  // Simply blit pre-rendered buffers (optimization #5)
  imageMode(CENTER);
  for (let i = 0; i < shapeAssignments.size; i++) {
    const assignment = shapeAssignments.get(i);
    image(assignment.buffer, assignment.x, assignment.y);
  }
}
