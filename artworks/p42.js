/**
 * Practice 42: Four Quadrants with Directional Lines
 * A black square divided into four quadrants, each containing lines in different directions.
 * 
 * Code by Jace Yang
 */

// ===================
// CONFIGURATION
// ===================

const SQUARE_SIZE = 600;
const MARGIN = 40;

const CANVAS_SIZE = MARGIN * 2 + SQUARE_SIZE;
const CANVAS_WIDTH = CANVAS_SIZE;
const CANVAS_HEIGHT = CANVAS_SIZE;

// Colors
const BACKGROUND_COLOR = '#f5f3f0';
const SQUARE_COLOR = '#1A1613';  // Lighter black
const BORDER_COLOR = '#0E0D0B';  // Darker black

// Border settings
const BORDER_WIDTH = SQUARE_SIZE / 17;  // 1/17 of square width

// ===================
// SETUP & DRAW
// ===================

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  pixelDensity(2);
  noLoop();
}

function draw() {
  background(BACKGROUND_COLOR);
  
  const squareX = MARGIN;
  const squareY = MARGIN;
  
  // Draw the main square with lighter black
  noStroke();
  fill(SQUARE_COLOR);
  rect(squareX, squareY, SQUARE_SIZE, SQUARE_SIZE);
  
  // Draw inner border as 4 rectangles (simpler than stroked rect)
  fill(BORDER_COLOR);
  // Top border
  rect(squareX, squareY, SQUARE_SIZE, BORDER_WIDTH);
  // Bottom border
  rect(squareX, squareY + SQUARE_SIZE - BORDER_WIDTH, SQUARE_SIZE, BORDER_WIDTH);
  // Left border
  rect(squareX, squareY, BORDER_WIDTH, SQUARE_SIZE);
  // Right border
  rect(squareX + SQUARE_SIZE - BORDER_WIDTH, squareY, BORDER_WIDTH, SQUARE_SIZE);
  
  // Draw dividing lines (drawn after border so they overlap)
  stroke(BORDER_COLOR);
  strokeWeight(BORDER_WIDTH);
  strokeCap(SQUARE);
  noFill();
  
  // Vertical line
  line(squareX + SQUARE_SIZE / 2, squareY, squareX + SQUARE_SIZE / 2, squareY + SQUARE_SIZE);
  // Horizontal line
  line(squareX, squareY + SQUARE_SIZE / 2, squareX + SQUARE_SIZE, squareY + SQUARE_SIZE / 2);
  
  // Draw 3 vertical lines in top-left quadrant
  const quadrantSize = SQUARE_SIZE / 2;
  const topLeftX = squareX;
  const topLeftY = squareY;
  
  // Account for the left border - start drawing from after the border
  const usableStartX = topLeftX + BORDER_WIDTH;
  const usableEndX = topLeftX + quadrantSize; // This is the center dividing line
  const usableWidth = usableEndX - usableStartX; // Actual usable width
  
  // To have equal spacing between lines and equal line widths:
  // Each line is BORDER_WIDTH wide, each space is BORDER_WIDTH wide
  // Pattern: space | line | space | line | space | line | space
  // Total: 4 spaces + 3 lines = 7 * BORDER_WIDTH
  // Line centers are at: usableStartX + 1.5*BORDER_WIDTH, + 3.5*BORDER_WIDTH, + 5.5*BORDER_WIDTH
  for (let i = 0; i < 3; i++) {
    const lineX = usableStartX + (1.5 + i * 2) * BORDER_WIDTH;
    line(lineX, topLeftY, lineX, topLeftY + quadrantSize);
  }
  
  // Draw 3 horizontal lines in top-right quadrant
  const topRightX = squareX + quadrantSize;
  const topRightY = squareY;
  
  // Account for the top border - start drawing from after the border
  const usableStartY = topRightY + BORDER_WIDTH;
  const usableEndY = topRightY + quadrantSize; // This is the center dividing line
  const usableHeight = usableEndY - usableStartY; // Actual usable height
  
  // Same pattern as top-left but horizontal: equal spacing equals line width
  for (let i = 0; i < 3; i++) {
    const lineY = usableStartY + (1.5 + i * 2) * BORDER_WIDTH;
    line(topRightX, lineY, topRightX + quadrantSize, lineY);
  }
  
  // Draw 4 diagonal lines in bottom-left quadrant (forward slash / direction)
  // Lines go from lower-left to upper-right
  
  // Use clipping mask to keep lines within the main square
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(squareX, squareY, SQUARE_SIZE, SQUARE_SIZE);
  drawingContext.clip();
  
  // Usable area for spacing calculation (visible lighter area between dark borders/dividers)
  // Account for: left border width, bottom border width, and center divider widths
  const blUsableLeft = squareX + BORDER_WIDTH;
  const blUsableRight = squareX + quadrantSize - BORDER_WIDTH / 2;  // Center divider has width
  const blUsableTop = squareY + quadrantSize + BORDER_WIDTH / 2;    // Center divider has width
  const blUsableBottom = squareY + SQUARE_SIZE - BORDER_WIDTH;
  
  // Drawing boundaries (extend to borders so lines overlap them)
  const blDrawLeft = squareX;
  const blDrawRight = squareX + quadrantSize;
  const blDrawTop = squareY + quadrantSize;
  const blDrawBottom = squareY + SQUARE_SIZE;
  
  // For / diagonal lines, use x + y = c (constant along each line)
  // Range of c based on usable area
  const minC = blUsableLeft + blUsableTop;
  const maxC = blUsableRight + blUsableBottom;
  const rangeC = maxC - minC;
  
  // 4 lines + 5 spaces = 9 * BORDER_WIDTH perpendicular
  // In c-space: 9 * BORDER_WIDTH * sqrt(2)
  const neededC = 9 * BORDER_WIDTH * sqrt(2);
  const startC = minC + (rangeC - neededC) / 2;
  
  for (let i = 0; i < 4; i++) {
    // c value for this line (line centers at 1.5, 3.5, 5.5, 7.5 units from start)
    const c = startC + (1.5 + i * 2) * BORDER_WIDTH * sqrt(2);
    
    let x1, y1, x2, y2;
    
    // Start point: left edge or bottom edge (using draw boundaries)
    const leftY = c - blDrawLeft;
    if (leftY >= blDrawTop && leftY <= blDrawBottom) {
      x1 = blDrawLeft;
      y1 = leftY;
    } else {
      x1 = c - blDrawBottom;
      y1 = blDrawBottom;
    }
    
    // End point: top edge or right edge (using draw boundaries)
    const topX = c - blDrawTop;
    if (topX >= blDrawLeft && topX <= blDrawRight) {
      x2 = topX;
      y2 = blDrawTop;
    } else {
      x2 = blDrawRight;
      y2 = c - blDrawRight;
    }
    
    line(x1, y1, x2, y2);
  }
  
  // Draw 4 diagonal lines in bottom-right quadrant (backslash \ direction)
  // Lines go from upper-left to lower-right (opposite of bottom-left quadrant)
  
  // Usable area for spacing calculation (visible lighter area between dark borders/dividers)
  const brUsableLeft = squareX + quadrantSize + BORDER_WIDTH / 2;   // Center divider has width
  const brUsableRight = squareX + SQUARE_SIZE - BORDER_WIDTH;
  const brUsableTop = squareY + quadrantSize + BORDER_WIDTH / 2;    // Center divider has width
  const brUsableBottom = squareY + SQUARE_SIZE - BORDER_WIDTH;
  
  // Drawing boundaries (extend to borders so lines overlap them)
  const brDrawLeft = squareX + quadrantSize;
  const brDrawRight = squareX + SQUARE_SIZE;
  const brDrawTop = squareY + quadrantSize;
  const brDrawBottom = squareY + SQUARE_SIZE;
  
  // For \ diagonal lines, use x - y = d (constant along each line)
  // Range of d based on usable area corners
  // Top-right corner has max d, bottom-left corner has min d
  const minD = brUsableLeft - brUsableBottom;  // Bottom-left corner
  const maxD = brUsableRight - brUsableTop;    // Top-right corner
  const rangeD = maxD - minD;
  
  // 4 lines + 5 spaces = 9 * BORDER_WIDTH perpendicular
  // In d-space: 9 * BORDER_WIDTH * sqrt(2)
  const neededD = 9 * BORDER_WIDTH * sqrt(2);
  const startD = minD + (rangeD - neededD) / 2;
  
  for (let i = 0; i < 4; i++) {
    // d value for this line
    const d = startD + (1.5 + i * 2) * BORDER_WIDTH * sqrt(2);
    
    let x1, y1, x2, y2;
    
    // Start point: top edge or left edge
    // On top edge (y = brDrawTop): x = d + brDrawTop
    const topX = d + brDrawTop;
    if (topX >= brDrawLeft && topX <= brDrawRight) {
      x1 = topX;
      y1 = brDrawTop;
    } else {
      // Start from left edge: y = brDrawLeft - d
      x1 = brDrawLeft;
      y1 = brDrawLeft - d;
    }
    
    // End point: bottom edge or right edge
    // On bottom edge (y = brDrawBottom): x = d + brDrawBottom
    const bottomX = d + brDrawBottom;
    if (bottomX >= brDrawLeft && bottomX <= brDrawRight) {
      x2 = bottomX;
      y2 = brDrawBottom;
    } else {
      // End at right edge: y = brDrawRight - d
      x2 = brDrawRight;
      y2 = brDrawRight - d;
    }
    
    line(x1, y1, x2, y2);
  }
  
  // Restore drawing context (remove clipping mask)
  drawingContext.restore();
}

