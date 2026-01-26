/**
 * Practice 49: Shape with 2x2 Block
 * 
 * Randomly selects a basic shape and displays it in a 3x3 grid.
 * The grid consists of one random 2x2 block and five 1x1 cells.
 * 
 * Code by Jace Yang
 */

// Category selection: 'geometric', 'symmetry', 'fill', or 'density'
let selectedCategory = 'geometric'; // Click buttons on canvas to change
let singleShapeMode = false; // When true, use same shape for entire grid

const geometricTerms = ['dot', 'square', 'circle', 'triangle', 'line'];
const symmetryTerms = ['sym', 'nonsym'];
const fillTerms = ['outline', 'filled'];
const densityTerms = ['sparse', 'dense'];

let shapes = [];
let filteredShapes = [];
let filteredSvgFiles = [];
let shapeAssignments; // Maps positions to which shape they use
let usedTerms = []; // Track which specific terms were used (e.g., "dot", "circle")

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

function shapeMatchesCategory(shapeName, category) {
  const parsed = parseShapeName(shapeName);
  
  switch (category) {
    case 'geometric':
      return geometricTerms.includes(parsed.geometric);
    case 'symmetry':
      return symmetryTerms.includes(parsed.symmetry);
    case 'fill':
      return fillTerms.includes(parsed.fill);
    case 'density':
      return densityTerms.includes(parsed.density);
    default:
      return true; // If category is invalid, show all
  }
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

function setupShapes() {
  // First, pick a random specific term from the selected category
  let selectedTerm;
  let terms;
  switch (selectedCategory) {
    case 'geometric':
      terms = geometricTerms;
      break;
    case 'symmetry':
      terms = symmetryTerms;
      break;
    case 'fill':
      terms = fillTerms;
      break;
    case 'density':
      terms = densityTerms;
      break;
  }
  selectedTerm = random(terms);
  usedTerms = [selectedTerm]; // Store the single term used
  
  // Filter shapes to only those matching the specific term
  filteredShapes = [];
  filteredSvgFiles = [];
  for (let i = 0; i < svgFiles.length; i++) {
    const parsed = parseShapeName(svgFiles[i]);
    let matches = false;
    switch (selectedCategory) {
      case 'geometric':
        matches = parsed.geometric === selectedTerm;
        break;
      case 'symmetry':
        matches = parsed.symmetry === selectedTerm;
        break;
      case 'fill':
        matches = parsed.fill === selectedTerm;
        break;
      case 'density':
        matches = parsed.density === selectedTerm;
        break;
    }
    if (matches) {
      filteredShapes.push(shapes[i]);
      filteredSvgFiles.push(svgFiles[i]);
    }
  }
  
  // Use filtered shapes for selection
  if (filteredShapes.length === 0) {
    console.error('No shapes match the selected term:', selectedTerm);
    return;
  }
  
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
  
  // Assign shapes to each position
  shapeAssignments = new Map();
  const singleShape = singleShapeMode ? random(filteredShapes) : null;
  for (let i = 0; i < allPositions.length; i++) {
    const pos = allPositions[i];
    const key = pos.type + '-' + pos.row + '-' + pos.col;
    const shapeToAssign = singleShapeMode ? singleShape : random(filteredShapes);
    shapeAssignments.set(key, shapeToAssign);
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
  noLoop(); // Only draw once, redraw on category change
  
  // Listen for messages from parent React component
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'setCategory') {
      selectedCategory = event.data.category;
      setupShapes();
      redraw();
    }
    if (event.data && event.data.type === 'setSingleShapeMode') {
      singleShapeMode = event.data.enabled;
      setupShapes();
      redraw();
    }
  });
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
