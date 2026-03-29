/**
 * Practice 50: Shape with 2x2 Block
 * 
 * Randomly selects a basic shape and displays it in a 3x3 grid.
 * The grid consists of one random 2x2 block and five 1x1 cells.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let shapeAssignments; // Maps positions to which shape they use

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

let blockPosition; // Position of the 2x2 block: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
let coloredPosition; // Which position gets the color: 'block' or a cell coordinate like {row: 0, col: 2}
let selectedColor; // The color for the colored shape (selected once)

function parseShapeName(filename) {
  // Remove path and extension, handle _2, _3 suffixes
  const name = filename.split('/').pop().replace('.svg', '').replace(/_\d+$/, '');
  const parts = name.split('_');
  return {
    geometric: parts[0],
    symmetry: parts[1],
    fill: parts[2],
    density: parts[3]
  };
}

function isIn2x2Block(row, col) {
  switch (blockPosition) {
    case 'top-left':
      return row < 2 && col < 2;
    case 'top-right':
      return row < 2 && col >= 1;
    case 'bottom-left':
      return row >= 1 && col < 2;
    case 'bottom-right':
      return row >= 1 && col >= 1;
    default:
      return false;
  }
}

function getFirstCellOfBlock() {
  switch (blockPosition) {
    case 'top-left':
      return {row: 0, col: 0};
    case 'top-right':
      return {row: 0, col: 1};
    case 'bottom-left':
      return {row: 1, col: 0};
    case 'bottom-right':
      return {row: 1, col: 1};
    default:
      return {row: 0, col: 0};
  }
}

// Calculate diversity score for a candidate shape given already selected shapes
function calculateDiversityScore(candidateIndex, selectedIndices) {
  if (selectedIndices.length === 0) return 1; // First shape, any is fine
  
  const candidateParsed = parseShapeName(svgFiles[candidateIndex]);
  
  // Count how many selected shapes share each attribute
  let sharedGeometric = 0;
  let sharedSymmetry = 0;
  let sharedFill = 0;
  let sharedDensity = 0;
  
  for (const idx of selectedIndices) {
    const selectedParsed = parseShapeName(svgFiles[idx]);
    if (selectedParsed.geometric === candidateParsed.geometric) sharedGeometric++;
    if (selectedParsed.symmetry === candidateParsed.symmetry) sharedSymmetry++;
    if (selectedParsed.fill === candidateParsed.fill) sharedFill++;
    if (selectedParsed.density === candidateParsed.density) sharedDensity++;
  }
  
  // Lower shared count = higher diversity score
  // We want to penalize shapes that share too many attributes
  const totalSelected = selectedIndices.length;
  
  // Calculate imbalance penalty - penalize if this shape would make a category too dominant
  // A shape is penalized more if it matches the majority in any category
  const geometricRatio = sharedGeometric / totalSelected;
  const symmetryRatio = sharedSymmetry / totalSelected;
  const fillRatio = sharedFill / totalSelected;
  const densityRatio = sharedDensity / totalSelected;
  
  // Score: prefer shapes that don't match the majority
  // Higher score = more diverse
  const score = (1 - geometricRatio) + (1 - symmetryRatio) + (1 - fillRatio) + (1 - densityRatio);
  
  return score;
}

// Count attribute values in selected shapes
function countAttributes(selectedIndices) {
  const counts = {
    geometric: {},
    symmetry: {},
    fill: {},
    density: {}
  };
  
  for (const idx of selectedIndices) {
    const parsed = parseShapeName(svgFiles[idx]);
    counts.geometric[parsed.geometric] = (counts.geometric[parsed.geometric] || 0) + 1;
    counts.symmetry[parsed.symmetry] = (counts.symmetry[parsed.symmetry] || 0) + 1;
    counts.fill[parsed.fill] = (counts.fill[parsed.fill] || 0) + 1;
    counts.density[parsed.density] = (counts.density[parsed.density] || 0) + 1;
  }
  
  return counts;
}

// Check if adding a candidate would exceed balance limits
function wouldExceedLimits(candidateIndex, selectedIndices, maxPerAttribute = 3) {
  const counts = countAttributes(selectedIndices);
  const candidateParsed = parseShapeName(svgFiles[candidateIndex]);
  
  // Check if adding this shape would exceed the limit for fill (most important for visual weight)
  if ((counts.fill[candidateParsed.fill] || 0) >= maxPerAttribute) {
    return true;
  }
  
  // Also check geometric to avoid too many of the same base shape
  if ((counts.geometric[candidateParsed.geometric] || 0) >= maxPerAttribute) {
    return true;
  }
  
  return false;
}

// Select shape with diversity-weighted randomness
function selectBalancedShape(selectedIndices) {
  // Get available indices (exclude already selected shapes)
  let availableIndices = [];
  for (let i = 0; i < shapes.length; i++) {
    if (!selectedIndices.includes(i)) {
      availableIndices.push(i);
    }
  }
  
  // Fallback if all shapes are used (shouldn't happen with 23 shapes and 6 positions)
  if (availableIndices.length === 0) {
    return floor(random(shapes.length));
  }
  
  // Filter out shapes that would exceed balance limits
  const balancedIndices = availableIndices.filter(i => !wouldExceedLimits(i, selectedIndices));
  
  // Use balanced indices if available, otherwise fall back to all available
  if (balancedIndices.length > 0) {
    availableIndices = balancedIndices;
  }
  
  const scores = [];
  let totalScore = 0;
  
  for (const i of availableIndices) {
    const score = calculateDiversityScore(i, selectedIndices);
    // Add small base to avoid zero probability
    const adjustedScore = score + 0.1;
    scores.push(adjustedScore);
    totalScore += adjustedScore;
  }
  
  // Weighted random selection from available shapes only
  let r = random(totalScore);
  for (let j = 0; j < availableIndices.length; j++) {
    r -= scores[j];
    if (r <= 0) return availableIndices[j];
  }
  return availableIndices[availableIndices.length - 1];
}

function setupShapes() {
  // Randomly select position for 2x2 block
  const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  blockPosition = random(positions);
  
  // Get all positions (block + 5 individual cells)
  const firstCell = getFirstCellOfBlock();
  const individualCells = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (!isIn2x2Block(row, col)) {
        individualCells.push({row, col});
      }
    }
  }
  
  // Create list of all positions
  const allPositions = [
    {type: 'block', row: firstCell.row, col: firstCell.col},
    ...individualCells.map(c => ({type: 'cell', row: c.row, col: c.col}))
  ];
  
  // Select shapes using balanced algorithm
  const selectedIndices = [];
  shapeAssignments = new Map();
  
  for (let i = 0; i < allPositions.length; i++) {
    const pos = allPositions[i];
    const key = pos.type + '-' + pos.row + '-' + pos.col;
    
    // Select a shape that maximizes diversity
    const shapeIndex = selectBalancedShape(selectedIndices);
    selectedIndices.push(shapeIndex);
    shapeAssignments.set(key, shapes[shapeIndex]);
  }
  
  // Randomly select which position gets the color
  if (random() < 0.5) {
    coloredPosition = 'block';
  } else {
    coloredPosition = random(individualCells);
  }
  
  // Select the color once (not in draw loop)
  selectedColor = colors[floor(random(1, colors.length))];
}

function preload() {
  // Load all shapes first
  for (let i = 0; i < svgFiles.length; i++) {
    shapes.push(loadImage(svgFiles[i]));
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function setup() {
  createCanvas(800, 800);
  setupShapes();
  noLoop();
}

function draw() {
  background(255);
  
  const padding = 40;
  const cols = 3;
  const rows = 3;
  const gridWidth = width - padding * 2;
  const gridHeight = height - padding * 2;
  const cellWidth = gridWidth / cols;
  const cellHeight = gridHeight / rows;
  const shapeSize1x1 = min(cellWidth, cellHeight) * 0.85;
  const shapeSize2x2 = min(cellWidth * 2, cellHeight * 2) * 0.925;
  
  // Draw grid cells - each cell gets a shape centered within it
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Calculate cell center
      const cellCenterX = padding + col * cellWidth + cellWidth / 2;
      const cellCenterY = padding + row * cellHeight + cellHeight / 2;
      
      if (isIn2x2Block(row, col)) {
        // For 2x2 block, only draw in the first cell (top-left of the block)
        const firstCell = getFirstCellOfBlock();
        if (row === firstCell.row && col === firstCell.col) {
          // Get the shape assigned to this block
          const shapeKey = 'block-' + firstCell.row + '-' + firstCell.col;
          const shapeToUse = shapeAssignments.get(shapeKey);
          
          // Determine if this block should be colored
          const isColored = coloredPosition === 'block';
          const color = isColored ? selectedColor : colors[0]; // Black if not colored
          
          if (shapeToUse && shapeToUse.width > 0) {
            const scale = shapeSize2x2 / max(shapeToUse.width, shapeToUse.height);
            const w = shapeToUse.width * scale;
            const h = shapeToUse.height * scale;
            
            const g = createGraphics(w, h);
            g.imageMode(CORNER);
            g.image(shapeToUse, 0, 0, w, h);
            
            g.loadPixels();
            const rgb = hexToRgb(color);
            for (let i = 0; i < g.pixels.length; i += 4) {
              if (g.pixels[i + 3] > 0) {
                g.pixels[i] = rgb.r;
                g.pixels[i + 1] = rgb.g;
                g.pixels[i + 2] = rgb.b;
              }
            }
            g.updatePixels();
            
            // Center the 2x2 block within its 2x2 cell area
            const blockCenterX = padding + firstCell.col * cellWidth + cellWidth;
            const blockCenterY = padding + firstCell.row * cellHeight + cellHeight;
            imageMode(CENTER);
            image(g, blockCenterX, blockCenterY);
            g.remove(); // Clean up to prevent memory leak
          }
        }
      } else {
        // Draw 1x1 cell shape centered within cell
        // Get the shape assigned to this cell
        const shapeKey = 'cell-' + row + '-' + col;
        const shapeToUse = shapeAssignments.get(shapeKey);
        
        // Determine if this cell should be colored
        const isColored = coloredPosition !== 'block' && 
                         coloredPosition.row === row && 
                         coloredPosition.col === col;
        const color = isColored ? selectedColor : colors[0]; // Black if not colored
        
        if (shapeToUse && shapeToUse.width > 0) {
          const scale = shapeSize1x1 / max(shapeToUse.width, shapeToUse.height);
          const w = shapeToUse.width * scale;
          const h = shapeToUse.height * scale;
          
          const g = createGraphics(w, h);
          g.imageMode(CORNER);
          g.image(shapeToUse, 0, 0, w, h);
          
          g.loadPixels();
          const rgb = hexToRgb(color);
          for (let i = 0; i < g.pixels.length; i += 4) {
            if (g.pixels[i + 3] > 0) {
              g.pixels[i] = rgb.r;
              g.pixels[i + 1] = rgb.g;
              g.pixels[i + 2] = rgb.b;
            }
          }
          g.updatePixels();
          
          // Center the shape within its cell
          imageMode(CENTER);
          image(g, cellCenterX, cellCenterY);
          g.remove(); // Clean up to prevent memory leak
        }
      }
    }
  }
  
}
