/**
 * Practice 42: Replication of Sol LeWitt's Wall Drawing #821
 * 
 * "A black square divided horizontally and vertically into four equal parts,
 * each with a different direction of alternating flat and glossy bands"
 * 
 * Original artwork: 1997, Acrylic paint, 144 × 144 in.
 * The work comprises a grid of horizontal, vertical, and opposing diagonal lines,
 * which were LeWitt's most fundamental geometric and linear building blocks.
 * 
 * Source: Art Institute of Chicago
 * https://www.artic.edu/artworks/186392/wall-drawing-821-a-black-square-divided-horizontally-and-vertically-into-four-equal-parts-each-with-a-different-direction-of-alternating-flat-and-glossy-bands
 * 
 * Code by Jace Yang
 */

// ===================
// CONFIGURATION
// ===================

const SQUARE_SIZE = 600;
const MARGIN = 40;
const BORDER_WIDTH = SQUARE_SIZE / 17;

const CANVAS_SIZE = MARGIN * 2 + SQUARE_SIZE;

// Colors (simulating flat vs glossy with slightly different blacks)
const BACKGROUND_COLOR = '#f5f3f0';
const FLAT_BLACK = '#1A1613';   // Lighter/matte black (background of quadrants)
const GLOSSY_BLACK = '#0E0D0B'; // Darker/glossy black (lines)

// ===================
// SETUP
// ===================

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  pixelDensity(2);
  noLoop();
}

// ===================
// MAIN DRAW
// ===================

function draw() {
  background(BACKGROUND_COLOR);
  
  const x = MARGIN;
  const y = MARGIN;
  const half = SQUARE_SIZE / 2;
  
  // 1. Draw base square (flat black)
  noStroke();
  fill(FLAT_BLACK);
  rect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  
  // 2. Draw frame and dividers (glossy black)
  drawFrame(x, y);
  drawDividers(x, y, half);
  
  // 3. Set up line drawing style
  stroke(GLOSSY_BLACK);
  strokeWeight(BORDER_WIDTH);
  strokeCap(SQUARE);
  noFill();
  
  // 4. Draw lines in each quadrant
  drawVerticalLines(x, y, half);                    // Top-left: vertical
  drawHorizontalLines(x + half, y, half);           // Top-right: horizontal
  
  // Use clipping for diagonal lines (they extend to borders)
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  drawingContext.clip();
  
  drawDiagonalLines(x, y + half, half, '/');        // Bottom-left: forward slash
  drawDiagonalLines(x + half, y + half, half, '\\'); // Bottom-right: backslash
  
  drawingContext.restore();
}

// ===================
// FRAME & DIVIDERS
// ===================

function drawFrame(x, y) {
  fill(GLOSSY_BLACK);
  noStroke();
  rect(x, y, SQUARE_SIZE, BORDER_WIDTH);                           // Top
  rect(x, y + SQUARE_SIZE - BORDER_WIDTH, SQUARE_SIZE, BORDER_WIDTH); // Bottom
  rect(x, y, BORDER_WIDTH, SQUARE_SIZE);                           // Left
  rect(x + SQUARE_SIZE - BORDER_WIDTH, y, BORDER_WIDTH, SQUARE_SIZE); // Right
}

function drawDividers(x, y, half) {
  stroke(GLOSSY_BLACK);
  strokeWeight(BORDER_WIDTH);
  strokeCap(SQUARE);
  line(x + half, y, x + half, y + SQUARE_SIZE); // Vertical center
  line(x, y + half, x + SQUARE_SIZE, y + half); // Horizontal center
}

// ===================
// QUADRANT LINES
// ===================

function drawVerticalLines(qx, qy, size) {
  // 3 vertical lines in quadrant, equal spacing = line width
  const startX = qx + BORDER_WIDTH;
  for (let i = 0; i < 3; i++) {
    const lx = startX + (1.5 + i * 2) * BORDER_WIDTH;
    line(lx, qy, lx, qy + size);
  }
}

function drawHorizontalLines(qx, qy, size) {
  // 3 horizontal lines in quadrant, equal spacing = line width
  const startY = qy + BORDER_WIDTH;
  for (let i = 0; i < 3; i++) {
    const ly = startY + (1.5 + i * 2) * BORDER_WIDTH;
    line(qx, ly, qx + size, ly);
  }
}

function drawDiagonalLines(qx, qy, size, direction) {
  // 4 diagonal lines, equal spacing = line width
  // direction: '/' (bottom-left to top-right) or '\' (top-left to bottom-right)
  
  const isForward = direction === '/';
  
  // Usable area (accounting for borders and center divider width)
  const usable = {
    left:   qx + (isForward ? BORDER_WIDTH : BORDER_WIDTH / 2),
    right:  qx + size - (isForward ? BORDER_WIDTH / 2 : BORDER_WIDTH),
    top:    qy + BORDER_WIDTH / 2,
    bottom: qy + size - BORDER_WIDTH
  };
  
  // Draw boundaries (extend to edges for overlap with borders)
  const draw = {
    left:   qx,
    right:  qx + size,
    top:    qy,
    bottom: qy + size
  };
  
  // Calculate line positions using parametric equations
  // For '/': x + y = c (constant)
  // For '\': x - y = d (constant)
  
  let minParam, maxParam;
  if (isForward) {
    minParam = usable.left + usable.top;
    maxParam = usable.right + usable.bottom;
  } else {
    minParam = usable.left - usable.bottom;
    maxParam = usable.right - usable.top;
  }
  
  const range = maxParam - minParam;
  const needed = 9 * BORDER_WIDTH * sqrt(2); // 4 lines + 5 spaces
  const start = minParam + (range - needed) / 2;
  
  for (let i = 0; i < 4; i++) {
    const param = start + (1.5 + i * 2) * BORDER_WIDTH * sqrt(2);
    const [x1, y1, x2, y2] = getDiagonalEndpoints(param, draw, isForward);
    line(x1, y1, x2, y2);
  }
}

function getDiagonalEndpoints(param, bounds, isForward) {
  let x1, y1, x2, y2;
  
  if (isForward) {
    // For '/' lines: x + y = param
    // Start: left edge or bottom edge
    const leftY = param - bounds.left;
    if (leftY >= bounds.top && leftY <= bounds.bottom) {
      x1 = bounds.left;
      y1 = leftY;
    } else {
      x1 = param - bounds.bottom;
      y1 = bounds.bottom;
    }
    // End: top edge or right edge
    const topX = param - bounds.top;
    if (topX >= bounds.left && topX <= bounds.right) {
      x2 = topX;
      y2 = bounds.top;
    } else {
      x2 = bounds.right;
      y2 = param - bounds.right;
    }
  } else {
    // For '\' lines: x - y = param
    // Start: top edge or left edge
    const topX = param + bounds.top;
    if (topX >= bounds.left && topX <= bounds.right) {
      x1 = topX;
      y1 = bounds.top;
    } else {
      x1 = bounds.left;
      y1 = bounds.left - param;
    }
    // End: bottom edge or right edge
    const bottomX = param + bounds.bottom;
    if (bottomX >= bounds.left && bottomX <= bounds.right) {
      x2 = bottomX;
      y2 = bounds.bottom;
    } else {
      x2 = bounds.right;
      y2 = bounds.right - param;
    }
  }
  
  return [x1, y1, x2, y2];
}
