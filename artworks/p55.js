/**
 * Practice 55: 3x3 Grid of 10x10 Compositions with 1x1, 2x2, 3x3 Blocks
 * 
 * A 3x3 outer grid where each cell contains a 10x10 composition.
 * Each composition is randomly filled with 1x1, 2x2, and 3x3 blocks.
 * Color gradient: top-left has 0% colored shapes, increasing toward bottom-right.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let parsedShapes = [];
let compositions = [];

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

// Chinese-inspired color palette (Yellow & Red)
const colors = [
  '#000000', // Black (base)
  '#DE2910', // Chinese Red (国旗红) - traditional flag red
  '#FFDE00', // Imperial Yellow (明黄) - emperor's yellow
  '#AA381E', // Chinese Cinnabar (朱砂) - deep vermillion
  '#FF7F00', // Tangerine (橙红) - orange-red
  '#8B0000', // Dark Red (暗红) - maroon
  '#FFD700'  // Golden Yellow (金黄) - gold
];

let colorsRgb = [];

// Grid configuration
const GRID_ROWS = 3;
const GRID_COLS = 3;
const GRID_PADDING = 20;
const INNER_GRID_SIZE = 10; // 10x10 inner grid

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
    // Allow reuse
    for (let i = 0; i < shapes.length; i++) {
      availableIndices.push(i);
    }
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

// Check if a block of given size can be placed at (row, col)
function canPlaceBlock(occupied, row, col, blockSize) {
  if (row > INNER_GRID_SIZE - blockSize || col > INNER_GRID_SIZE - blockSize) return false;
  
  for (let r = row; r < row + blockSize; r++) {
    for (let c = col; c < col + blockSize; c++) {
      if (occupied[r][c]) return false;
    }
  }
  return true;
}

// Mark cells as occupied for a block
function markBlockOccupied(occupied, row, col, blockSize) {
  for (let r = row; r < row + blockSize; r++) {
    for (let c = col; c < col + blockSize; c++) {
      occupied[r][c] = true;
    }
  }
}

// Generate random layout with mix of 1x1, 2x2, and 3x3 blocks
function generateLayout() {
  const occupied = [];
  for (let r = 0; r < INNER_GRID_SIZE; r++) {
    occupied.push(new Array(INNER_GRID_SIZE).fill(false));
  }
  
  const positions = [];
  
  // Randomly decide how many 3x3 blocks to try (0 to 3)
  const num3x3Attempts = floor(random(0, 4));
  
  // Randomly decide how many 2x2 blocks to try (0 to 8)
  const num2x2Attempts = floor(random(0, 9));
  
  // Get all possible 3x3 positions and shuffle
  const possible3x3 = [];
  for (let r = 0; r <= INNER_GRID_SIZE - 3; r++) {
    for (let c = 0; c <= INNER_GRID_SIZE - 3; c++) {
      possible3x3.push({ row: r, col: c });
    }
  }
  shuffleArray(possible3x3);
  
  // Try to place 3x3 blocks
  let placed3x3 = 0;
  for (const pos of possible3x3) {
    if (placed3x3 >= num3x3Attempts) break;
    
    if (canPlaceBlock(occupied, pos.row, pos.col, 3)) {
      markBlockOccupied(occupied, pos.row, pos.col, 3);
      positions.push({ type: '3x3', row: pos.row, col: pos.col });
      placed3x3++;
    }
  }
  
  // Get all possible 2x2 positions and shuffle
  const possible2x2 = [];
  for (let r = 0; r <= INNER_GRID_SIZE - 2; r++) {
    for (let c = 0; c <= INNER_GRID_SIZE - 2; c++) {
      possible2x2.push({ row: r, col: c });
    }
  }
  shuffleArray(possible2x2);
  
  // Try to place 2x2 blocks
  let placed2x2 = 0;
  for (const pos of possible2x2) {
    if (placed2x2 >= num2x2Attempts) break;
    
    if (canPlaceBlock(occupied, pos.row, pos.col, 2)) {
      markBlockOccupied(occupied, pos.row, pos.col, 2);
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

// Fisher-Yates shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Generate a single 10x10 composition with given color percentage and number of colors
function generateComposition(compositionSize, colorPercentage, numColors) {
  const g = createGraphics(compositionSize, compositionSize);
  g.background(255);
  
  // Layout constants
  const padding = compositionSize * 0.03;
  const innerCellWidth = (compositionSize - padding * 2) / INNER_GRID_SIZE;
  const innerCellHeight = (compositionSize - padding * 2) / INNER_GRID_SIZE;
  const shapeSize1x1 = min(innerCellWidth, innerCellHeight) * 0.85;
  const shapeSize2x2 = min(innerCellWidth * 2, innerCellHeight * 2) * 0.925;
  const shapeSize3x3 = min(innerCellWidth * 3, innerCellHeight * 3) * 0.95;
  
  // Generate random layout
  const layout = generateLayout();
  
  // Build pool of available colors (numColors from the non-black colors)
  // Shuffle and pick first numColors
  const availableColorIndices = [1, 2, 3, 4, 5, 6]; // indices 1-6 (non-black)
  shuffleArray(availableColorIndices);
  const colorPool = availableColorIndices.slice(0, numColors).map(i => colorsRgb[i]);
  const blackRgb = colorsRgb[0];
  
  // Build render positions
  const allPositions = [];
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    let size, x, y;
    
    if (item.type === '3x3') {
      size = shapeSize3x3;
      x = padding + item.col * innerCellWidth + innerCellWidth * 1.5;
      y = padding + item.row * innerCellHeight + innerCellHeight * 1.5;
    } else if (item.type === '2x2') {
      size = shapeSize2x2;
      x = padding + item.col * innerCellWidth + innerCellWidth;
      y = padding + item.row * innerCellHeight + innerCellHeight;
    } else {
      size = shapeSize1x1;
      x = padding + item.col * innerCellWidth + innerCellWidth / 2;
      y = padding + item.row * innerCellHeight + innerCellHeight / 2;
    }
    
    // Determine if this shape should be colored based on percentage
    const isColored = random() < colorPercentage;
    
    // If colored, pick a random color from the pool
    let colorRgb = blackRgb;
    if (isColored && colorPool.length > 0) {
      colorRgb = colorPool[floor(random(colorPool.length))];
    }
    
    allPositions.push({
      type: item.type,
      size: size,
      x: x,
      y: y,
      colorRgb: colorRgb
    });
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
    
    drawColoredShape(g, shapes[shapeIndex], pos.x, pos.y, pos.size, pos.colorRgb);
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
  createCanvas(900, 900);
  
  cellWidth = (width - GRID_PADDING * 2) / GRID_COLS;
  cellHeight = (height - GRID_PADDING * 2) / GRID_ROWS;
  const compositionSize = min(cellWidth, cellHeight) * 0.95;
  
  // Generate 9 compositions with strictly monotonic color percentage and increasing color variety
  // Grid 1-9 (left-to-right, top-to-bottom):
  //   colorPercentage: 0%, 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%, 100%
  //   numColors: 1, 1, 2, 2, 3, 4, 4, 5, 6
  let gridIndex = 0;
  const totalGrids = GRID_ROWS * GRID_COLS; // 9
  const maxColors = colors.length - 1; // 6 non-black colors
  
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      // Strictly monotonic color percentage: 0/8, 1/8, 2/8, ... 8/8
      const colorPercentage = gridIndex / (totalGrids - 1);
      
      // Number of colors increases: 1 -> 6 across the grid
      // Map gridIndex 0-8 to numColors 1-6
      const numColors = max(1, ceil((gridIndex + 1) / totalGrids * maxColors));
      
      const comp = generateComposition(compositionSize, colorPercentage, numColors);
      const x = GRID_PADDING + col * cellWidth + cellWidth / 2;
      const y = GRID_PADDING + row * cellHeight + cellHeight / 2;
      compositions.push({ buffer: comp, x, y });
      
      gridIndex++;
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
