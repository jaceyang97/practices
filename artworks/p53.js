/**
 * Practice 53: 2x3 Grid of Mini Compositions
 * 
 * A 2-row by 3-column grid where each cell contains a complete
 * 3x3 composition (with one 2x2 block and five 1x1 cells).
 * Total: 6 mini compositions.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let parsedShapes = []; // Pre-parsed shape attributes
let compositions = []; // Array of 6 pre-rendered composition buffers

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

// Pre-computed RGB values
let colorsRgb = [];

// Grid configuration
const GRID_ROWS = 2;
const GRID_COLS = 3;
const GRID_PADDING = 20;

// Layout info (computed in setup)
let cellWidth, cellHeight;

// Block position lookup tables
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

const blockPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

// Parse shape name once
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

// Diversity score calculation
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

// Check balance limits
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

// Update attribute counts incrementally
function addToAttrCounts(attrCounts, shapeIndex) {
  const parsed = parsedShapes[shapeIndex];
  attrCounts.geometric[parsed.geometric] = (attrCounts.geometric[parsed.geometric] || 0) + 1;
  attrCounts.symmetry[parsed.symmetry] = (attrCounts.symmetry[parsed.symmetry] || 0) + 1;
  attrCounts.fill[parsed.fill] = (attrCounts.fill[parsed.fill] || 0) + 1;
  attrCounts.density[parsed.density] = (attrCounts.density[parsed.density] || 0) + 1;
}

// Balanced shape selection
function selectBalancedShapeFast(selectedSet, attrCounts, totalSelected, maxPerAttribute) {
  const availableIndices = [];
  for (let i = 0; i < shapes.length; i++) {
    if (!selectedSet.has(i)) {
      availableIndices.push(i);
    }
  }
  
  if (availableIndices.length === 0) {
    return floor(random(shapes.length));
  }
  
  const balancedIndices = [];
  for (let i = 0; i < availableIndices.length; i++) {
    if (!wouldExceedLimitsFast(availableIndices[i], attrCounts, maxPerAttribute)) {
      balancedIndices.push(availableIndices[i]);
    }
  }
  
  const candidates = balancedIndices.length > 0 ? balancedIndices : availableIndices;
  
  const scores = new Array(candidates.length);
  let totalScore = 0;
  
  for (let i = 0; i < candidates.length; i++) {
    const score = calculateDiversityScoreFast(candidates[i], attrCounts, totalSelected) + 0.1;
    scores[i] = score;
    totalScore += score;
  }
  
  let r = random(totalScore);
  for (let i = 0; i < candidates.length; i++) {
    r -= scores[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

// Apply color to shape and draw it
function drawColoredShape(g, shapeImg, x, y, size, rgb) {
  const scale = size / max(shapeImg.width, shapeImg.height);
  const w = shapeImg.width * scale;
  const h = shapeImg.height * scale;
  
  // Create temp buffer for coloring
  const temp = createGraphics(w, h);
  temp.imageMode(CORNER);
  temp.image(shapeImg, 0, 0, w, h);
  
  temp.loadPixels();
  const pixels = temp.pixels;
  const len = pixels.length;
  for (let i = 0; i < len; i += 4) {
    if (pixels[i + 3] > 0) {
      pixels[i] = rgb.r;
      pixels[i + 1] = rgb.g;
      pixels[i + 2] = rgb.b;
    }
  }
  temp.updatePixels();
  
  g.imageMode(CENTER);
  g.image(temp, x, y);
  temp.remove();
}

// Generate a single 3x3 composition and return it as a graphics buffer
function generateComposition(compositionSize) {
  const g = createGraphics(compositionSize, compositionSize);
  g.background(255);
  
  // Choose random block position for this composition
  const blockPosition = random(blockPositions);
  const blockInfo = blockData[blockPosition];
  const firstCell = blockInfo.first;
  
  // Get individual cells (not in the 2x2 block)
  const individualCells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (!blockInfo.check(row, col)) {
        individualCells.push({ row, col });
      }
    }
  }
  
  // Layout constants for this mini composition
  const padding = compositionSize * 0.05;
  const cellWidth = (compositionSize - padding * 2) / 3;
  const cellHeight = (compositionSize - padding * 2) / 3;
  const shapeSize1x1 = min(cellWidth, cellHeight) * 0.85;
  const shapeSize2x2 = min(cellWidth * 2, cellHeight * 2) * 0.925;
  
  // Randomly select colored position
  let coloredPosition;
  if (random() < 0.5) {
    coloredPosition = 'block';
  } else {
    coloredPosition = random(individualCells);
  }
  
  // Select color
  const colorIndex = floor(random(1, colors.length));
  const selectedColorRgb = colorsRgb[colorIndex];
  const blackRgb = colorsRgb[0];
  
  // Build positions list
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
  
  // Select shapes with balanced algorithm
  const selectedSet = new Set();
  const attrCounts = { geometric: {}, symmetry: {}, fill: {}, density: {} };
  
  for (let i = 0; i < allPositions.length; i++) {
    const pos = allPositions[i];
    
    const shapeIndex = selectBalancedShapeFast(selectedSet, attrCounts, selectedSet.size, 3);
    selectedSet.add(shapeIndex);
    addToAttrCounts(attrCounts, shapeIndex);
    
    // Determine color
    let rgb;
    if (pos.type === 'block') {
      rgb = (coloredPosition === 'block') ? selectedColorRgb : blackRgb;
    } else {
      const isColored = coloredPosition !== 'block' && 
                       coloredPosition.row === pos.row && 
                       coloredPosition.col === pos.col;
      rgb = isColored ? selectedColorRgb : blackRgb;
    }
    
    // Draw shape to composition buffer
    drawColoredShape(g, shapes[shapeIndex], pos.x, pos.y, pos.size, rgb);
  }
  
  return g;
}

function preload() {
  // Load shapes and pre-parse attributes
  for (let i = 0; i < svgFiles.length; i++) {
    shapes.push(loadImage(svgFiles[i]));
    parsedShapes.push(parseShapeName(svgFiles[i]));
  }
  
  // Pre-convert colors to RGB
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
  createCanvas(900, 600);
  
  // Calculate size for each mini composition
  cellWidth = (width - GRID_PADDING * 2) / GRID_COLS;
  cellHeight = (height - GRID_PADDING * 2) / GRID_ROWS;
  const compositionSize = min(cellWidth, cellHeight) * 0.95;
  
  // Generate 6 compositions
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const comp = generateComposition(compositionSize);
      const x = GRID_PADDING + col * cellWidth + cellWidth / 2;
      const y = GRID_PADDING + row * cellHeight + cellHeight / 2;
      compositions.push({ buffer: comp, x, y });
    }
  }
  
  noLoop();
}

function draw() {
  background(255);
  
  // Draw all 6 compositions
  imageMode(CENTER);
  for (const comp of compositions) {
    image(comp.buffer, comp.x, comp.y);
  }
  
  // Draw thin grid borders
  stroke(200); // Light gray
  strokeWeight(1);
  
  // Vertical lines
  for (let col = 0; col <= GRID_COLS; col++) {
    const x = GRID_PADDING + col * cellWidth;
    line(x, GRID_PADDING, x, height - GRID_PADDING);
  }
  
  // Horizontal lines
  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = GRID_PADDING + row * cellHeight;
    line(GRID_PADDING, y, width - GRID_PADDING, y);
  }
}
