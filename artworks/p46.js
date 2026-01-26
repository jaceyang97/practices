/**
 * Practice 46: Shape with Colors
 * 
 * Randomly selects a basic shape and displays it in different colors in a 3x3 grid.
 * 
 * Code by Jace Yang
 */

let shapes = [];
let selectedShape;
let selectedShapeIndex;

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
  '#000000', // Black (top left)
  '#528FCC', // Soft blue
  '#728058', // Olive green
  '#AB5C76', // Dusty rose
  '#B2D1C7', // Seafoam mint
  '#C8C7D6', // Lavender gray
  '#EBC7C7'  // Blush pink
];

function preload() {
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
  noLoop();
  
  // Randomly select a shape
  selectedShapeIndex = floor(random(shapes.length));
  selectedShape = shapes[selectedShapeIndex];
}

function draw() {
  background(255);
  
  const cols = 3;
  const rows = 3;
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const shapeSize = min(cellWidth, cellHeight) * 0.85;
  
  // Color arrangement: top row all black, bottom 2 rows use the 6 other colors
  const colorOrder = [
    colors[0], // Black - Row 1, col 1
    colors[0], // Black - Row 1, col 2
    colors[0], // Black - Row 1, col 3
    colors[1], // Soft blue - Row 2, col 1
    colors[2], // Olive green - Row 2, col 2
    colors[3], // Dusty rose - Row 2, col 3
    colors[4], // Seafoam mint - Row 3, col 1
    colors[5], // Lavender gray - Row 3, col 2
    colors[6]  // Blush pink - Row 3, col 3
  ];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;
      const color = colorOrder[index];
      
      if (selectedShape && selectedShape.width > 0) {
        const scale = shapeSize / max(selectedShape.width, selectedShape.height);
        const w = selectedShape.width * scale;
        const h = selectedShape.height * scale;
        
        // Create a graphics buffer to colorize the shape
        const g = createGraphics(w, h);
        g.imageMode(CENTER);
        
        // Draw the shape first
        g.image(selectedShape, w/2, h/2, w, h);
        
        // Use the shape as a mask and fill with color
        g.loadPixels();
        const rgb = hexToRgb(color);
        for (let i = 0; i < g.pixels.length; i += 4) {
          if (g.pixels[i + 3] > 0) { // If pixel is not transparent
            g.pixels[i] = rgb.r;     // R
            g.pixels[i + 1] = rgb.g; // G
            g.pixels[i + 2] = rgb.b; // B
            // Keep original alpha
          }
        }
        g.updatePixels();
        
        imageMode(CENTER);
        image(g, x, y);
        g.remove(); // Clean up to prevent memory leak
      }
    }
  }
}
