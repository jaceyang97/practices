/**
 * Practice 54: 2x3 Grid of 4x4 Compositions with Variable Block Sizes
 * 
 * A 2-row by 3-column grid where each cell contains a 4x4 composition.
 * Each composition is randomly filled with a mix of 2x2 blocks and 1x1 cells.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let parsedShapes = [];
let compositions = [];

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
  '#000000', // Black
  '#528FCC', // Soft blue
  '#728058', // Olive green
  '#AB5C76', // Dusty rose
  '#B2D1C7', // Seafoam mint
  '#C8C7D6', // Lavender gray
  '#EBC7C7'  // Blush pink
];

let colorsRgb = [];

// Grid configuration
const GRID_ROWS = 2;
const GRID_COLS = 3;
const GRID_PADDING = 20;
const INNER_GRID_SIZE = 4; // 4x4 inner grid

let cellWidth, cellHeight;

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

// Check if a 2x2 block can be placed at (row, col)
function canPlace2x2(occupied, row, col) {
  if (row > INNER_GRID_SIZE - 2 || col > INNER_GRID_SIZE - 2) return false;
  
  return !occupied[row][col] && 
         !occupied[row][col + 1] && 
         !occupied[row + 1][col] && 
         !occupied[row + 1][col + 1];
}

// Mark cells as occupied for a 2x2 block
function mark2x2Occupied(occupied, row, col) {
  occupied[row][col] = true;
  occupied[row][col + 1] = true;
  occupied[row + 1][col] = true;
  occupied[row + 1][col + 1] = true;
}

// Generate random layout with mix of 2x2 blocks and 1x1 cells
function generateLayout() {
  // Initialize occupied grid
  const occupied = [];
  for (let r = 0; r < INNER_GRID_SIZE; r++) {
    occupied.push(new Array(INNER_GRID_SIZE).fill(false));
  }
  
  const positions = []; // {type: '2x2' or '1x1', row, col}
  
  // Randomly decide how many 2x2 blocks to try placing (0 to 4)
  const num2x2Attempts = floor(random(0, 5));
  
  // Get all possible 2x2 positions and shuffle them
  const possible2x2 = [];
  for (let r = 0; r < INNER_GRID_SIZE - 1; r++) {
    for (let c = 0; c < INNER_GRID_SIZE - 1; c++) {
      possible2x2.push({ row: r, col: c });
    }
  }
  // Shuffle
  for (let i = possible2x2.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [possible2x2[i], possible2x2[j]] = [possible2x2[j], possible2x2[i]];
  }
  
  // Try to place 2x2 blocks
  let placed2x2 = 0;
  for (const pos of possible2x2) {
    if (placed2x2 >= num2x2Attempts) break;
    
    if (canPlace2x2(occupied, pos.row, pos.col)) {
      mark2x2Occupied(occupied, pos.row, pos.col);
      positions.push({ type: '2x2', row: pos.row, col: pos.col });
      placed2x2++;
    }
  }
  
  // Fill remaining cells with 1x1
  for (let r = 0; r < INNER_GRID_SIZE; r++) {
    for (let c = 0; c < INNER_GRID_SIZE; c++) {
      if (!occupied[r][c]) {
        positions.push({ type: '1x1', row: r, col: c });
      }
    }
  }
  
  return positions;
}

// Generate a single 4x4 composition
function generateComposition(compositionSize) {
  const g = createGraphics(compositionSize, compositionSize);
  g.background(255);
  
  // Layout constants
  const padding = compositionSize * 0.05;
  const innerCellWidth = (compositionSize - padding * 2) / INNER_GRID_SIZE;
  const innerCellHeight = (compositionSize - padding * 2) / INNER_GRID_SIZE;
  const shapeSize1x1 = min(innerCellWidth, innerCellHeight) * 0.85;
  const shapeSize2x2 = min(innerCellWidth * 2, innerCellHeight * 2) * 0.925;
  
  // Generate random layout
  const layout = generateLayout();
  
  // Randomly select one position to be colored
  const coloredIndex = floor(random(layout.length));
  
  // Select color
  const colorIndex = floor(random(1, colors.length));
  const selectedColorRgb = colorsRgb[colorIndex];
  const blackRgb = colorsRgb[0];
  
  // Build render positions
  const allPositions = [];
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    
    if (item.type === '2x2') {
      allPositions.push({
        type: '2x2',
        size: shapeSize2x2,
        x: padding + item.col * innerCellWidth + innerCellWidth,
        y: padding + item.row * innerCellHeight + innerCellHeight,
        isColored: (i === coloredIndex)
      });
    } else {
      allPositions.push({
        type: '1x1',
        size: shapeSize1x1,
        x: padding + item.col * innerCellWidth + innerCellWidth / 2,
        y: padding + item.row * innerCellHeight + innerCellHeight / 2,
        isColored: (i === coloredIndex)
      });
    }
  }
  
  // Select shapes with balanced algorithm
  const selectedSet = new Set();
  const attrCounts = { geometric: {}, symmetry: {}, fill: {}, density: {} };
  const maxPerAttribute = ceil(allPositions.length / 2);
  
  for (let i = 0; i < allPositions.length; i++) {
    const pos = allPositions[i];
    
    const shapeIndex = selectBalancedShapeFast(selectedSet, attrCounts, selectedSet.size, maxPerAttribute);
    selectedSet.add(shapeIndex);
    addToAttrCounts(attrCounts, shapeIndex);
    
    const rgb = pos.isColored ? selectedColorRgb : blackRgb;
    drawColoredShape(g, shapes[shapeIndex], pos.x, pos.y, pos.size, rgb);
  }
  
  return g;
}

function preload() {
  for (let i = 0; i < svgFiles.length; i++) {
    shapes.push(loadImage(svgFiles[i]));
    parsedShapes.push(parseShapeName(svgFiles[i]));
  }
  
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
  
  imageMode(CENTER);
  for (const comp of compositions) {
    image(comp.buffer, comp.x, comp.y);
  }
  
  // Draw thin grid borders
  stroke(200);
  strokeWeight(1);
  
  for (let col = 0; col <= GRID_COLS; col++) {
    const x = GRID_PADDING + col * cellWidth;
    line(x, GRID_PADDING, x, height - GRID_PADDING);
  }
  
  for (let row = 0; row <= GRID_ROWS; row++) {
    const y = GRID_PADDING + row * cellHeight;
    line(GRID_PADDING, y, width - GRID_PADDING, y);
  }
}
