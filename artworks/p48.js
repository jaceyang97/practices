/**
 * Practice 48: Shape Category Display
 * 
 * Displays shapes organized by category terms.
 * Select a category to see shapes grouped by their terms.
 * 
 * Code by Jace Yang
 */

// Category selection: 'geometric', 'symmetry', 'fill', or 'density'
let selectedCategory = 'geometric';

const geometricTerms = ['dot', 'square', 'circle', 'triangle', 'line'];
const symmetryTerms = ['sym', 'nonsym'];
const fillTerms = ['outline', 'filled'];
const densityTerms = ['sparse', 'dense'];

// Display labels for terms
const termLabels = {
  'dot': 'dot',
  'square': 'square',
  'circle': 'circle',
  'triangle': 'triangle',
  'line': 'line',
  'sym': 'centrosymmetric',
  'nonsym': 'non-centrosymmetric',
  'outline': 'outline',
  'filled': 'filled',
  'sparse': 'sparse',
  'dense': 'dense'
};

let shapes = [];

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

// Grouped shapes by term
let groupedShapes = {};

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

function getTermsForCategory(category) {
  switch (category) {
    case 'geometric': return geometricTerms;
    case 'symmetry': return symmetryTerms;
    case 'fill': return fillTerms;
    case 'density': return densityTerms;
    default: return [];
  }
}

function getShapeTermValue(filename, category) {
  const parsed = parseShapeName(filename);
  switch (category) {
    case 'geometric': return parsed.geometric;
    case 'symmetry': return parsed.symmetry;
    case 'fill': return parsed.fill;
    case 'density': return parsed.density;
    default: return null;
  }
}

function groupShapesByCategory() {
  groupedShapes = {};
  const terms = getTermsForCategory(selectedCategory);
  
  // Initialize groups
  for (const term of terms) {
    groupedShapes[term] = [];
  }
  
  // Group shapes by term
  for (let i = 0; i < svgFiles.length; i++) {
    const termValue = getShapeTermValue(svgFiles[i], selectedCategory);
    if (groupedShapes[termValue]) {
      groupedShapes[termValue].push(shapes[i]);
    }
  }
}

function preload() {
  for (let i = 0; i < svgFiles.length; i++) {
    shapes.push(loadImage(svgFiles[i]));
  }
}

function calculateCanvasSize() {
  const terms = getTermsForCategory(selectedCategory);
  const labelWidth = 160;
  const padding = 30;
  const shapeSize = 70;
  const spacing = shapeSize * 1.3;
  const shapesPerRow = 8; // Fixed shapes per row for consistent layout
  
  // Calculate width based on shapes per row
  const canvasWidth = labelWidth + padding * 2 + shapesPerRow * spacing;
  
  // Calculate height based on total visual rows needed
  let totalVisualRows = 0;
  for (const term of terms) {
    const shapesInTerm = (groupedShapes[term] || []).length;
    const rowsForTerm = max(1, ceil(shapesInTerm / shapesPerRow));
    totalVisualRows += rowsForTerm;
  }
  
  const rowHeight = shapeSize * 1.4;
  const canvasHeight = padding * 2 + totalVisualRows * rowHeight + 30; // 30 for bottom label
  
  return { width: canvasWidth, height: canvasHeight };
}

function setup() {
  groupShapesByCategory();
  const size = calculateCanvasSize();
  createCanvas(size.width, size.height);
  noLoop();
  
  // Listen for category changes from parent React component
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'setCategory') {
      selectedCategory = event.data.category;
      groupShapesByCategory();
      const newSize = calculateCanvasSize();
      resizeCanvas(newSize.width, newSize.height);
      redraw();
    }
  });
}

function draw() {
  background(255);
  
  const terms = getTermsForCategory(selectedCategory);
  const numTerms = terms.length;
  
  const labelWidth = 160;
  const padding = 30;
  const shapeSize = 70;
  const spacing = shapeSize * 1.3;
  const shapesPerRow = 8;
  const rowHeight = shapeSize * 1.4;
  
  // Calculate row counts for each term
  const termRowCounts = [];
  for (const term of terms) {
    const shapesInTerm = (groupedShapes[term] || []).length;
    const rowsForTerm = max(1, ceil(shapesInTerm / shapesPerRow));
    termRowCounts.push(rowsForTerm);
  }
  
  let currentY = padding;
  
  for (let termIndex = 0; termIndex < numTerms; termIndex++) {
    const term = terms[termIndex];
    const shapesInTerm = groupedShapes[term] || [];
    const rowsForThisTerm = termRowCounts[termIndex];
    const termHeight = rowsForThisTerm * rowHeight;
    
    // Draw label (vertically centered for this term's area)
    fill(0);
    textAlign(RIGHT, CENTER);
    textSize(14);
    text(termLabels[term] || term, labelWidth - 15, currentY + termHeight / 2);
    
    // Draw shapes in a grid within this term's area
    if (shapesInTerm.length > 0) {
      const startX = labelWidth + padding;
      
      for (let i = 0; i < shapesInTerm.length; i++) {
        const shape = shapesInTerm[i];
        const col = i % shapesPerRow;
        const row = floor(i / shapesPerRow);
        const x = startX + col * spacing + spacing / 2;
        const y = currentY + row * rowHeight + rowHeight / 2;
        
        if (shape && shape.width > 0) {
          const scale = shapeSize / max(shape.width, shape.height);
          imageMode(CENTER);
          image(shape, x, y, shape.width * scale, shape.height * scale);
        }
      }
    }
    
    currentY += termHeight;
  }
  
  // Display the selected category at the bottom
  fill(0);
  textAlign(CENTER, BOTTOM);
  textSize(14);
  text(selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1), width / 2, height - 10);
}
