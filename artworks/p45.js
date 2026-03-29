/**
 * Practice 45: Display Anthropic Basic Shapes
 * 
 * Displays all SVG shapes from the anthropic_basic_shapes directory in a grid layout.
 * 
 * Code by Jace Yang
 */

let shapes = [];

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

function preload() {
  for (let i = 0; i < svgFiles.length; i++) {
    shapes.push(loadImage(svgFiles[i]));
  }
}

function setup() {
  createCanvas(1200, 800);
  noLoop();
}

function draw() {
  background(255);
  
  const cols = 6;
  const rows = Math.ceil(shapes.length / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  const shapeSize = min(cellWidth, cellHeight) * 0.8;
  
  for (let i = 0; i < shapes.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellWidth + cellWidth / 2;
    const y = row * cellHeight + cellHeight / 2;
    
    if (shapes[i] && shapes[i].width > 0) {
      const scale = shapeSize / max(shapes[i].width, shapes[i].height);
      imageMode(CENTER);
      image(shapes[i], x, y, shapes[i].width * scale, shapes[i].height * scale);
      
      // Display filename below the shape
      const filename = svgFiles[i].split('/').pop().replace('.svg', '');
      fill(0);
      textAlign(CENTER, TOP);
      textSize(10);
      text(filename, x, y + shapeSize / 2 + 5);
    }
  }
}
