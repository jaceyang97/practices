/**
 * Practice 38: Folding Grid
 * Referencing John Walker, Six Grids, Five Folds. 2008.
 * 
 * Code by Jace Yang
 */

// ===================
// CONFIGURATION
// ===================

const CANVAS_SIZE = 900;
const GRID_COLS = 3;
const GRID_ROWS = 2;
const GRID_SIZE = 26;       // 26×26 grid
const MARGIN = 20;          // Margin around each grid

// Fold configuration for each grid (0-indexed)
// Format: [foldCol, foldRow] - fold line from (col, 0) to (0, row)
const FOLD_CONFIG = {
  0: null,          // Grid 1: No fold (pristine)
  1: [3, 7],        // Grid 2: Small fold
  2: [12, 8],       // Grid 3: Medium fold (wide)
  3: [14, 20],      // Grid 4: Medium fold (tall)
  4: [24, 18],      // Grid 5: Large fold
  5: [26, 26],      // Grid 6: Exact half (corner to corner)
};

// ===================
// SETUP & DRAW
// ===================

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  pixelDensity(2);
  noLoop();
}

function draw() {
  background(252, 250, 248);  // Warm paper color
  
  const gridW = width / GRID_COLS;
  const gridH = gridW;  // Keep grids square
  const topPadding = (height - gridH * GRID_ROWS) / 2;
  
  // Draw all 6 grids
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const gridIndex = row * GRID_COLS + col;
      const x = col * gridW;
      const y = topPadding + row * gridH;
      drawGrid(x, y, gridW, gridH, gridIndex);
    }
  }
}

// ===================
// GRID DRAWING
// ===================

function drawGrid(offsetX, offsetY, w, h, gridIndex) {
  const gridWidth = w - MARGIN * 2;
  const gridHeight = h - MARGIN * 2;
  const cellWidth = gridWidth / GRID_SIZE;
  const cellHeight = gridHeight / GRID_SIZE;
  
  // Get fold configuration for this grid
  const foldConfig = FOLD_CONFIG[gridIndex];
  const hasFold = foldConfig !== null;
  const foldCol = hasFold ? foldConfig[0] : 0;
  const foldRow = hasFold ? foldConfig[1] : 0;
  
  // Draw vertical lines
  for (let i = 0; i <= GRID_SIZE; i++) {
    const x = offsetX + MARGIN + i * cellWidth;
    const y1 = offsetY + MARGIN;
    const y2 = offsetY + h - MARGIN;
    
    if (hasFold && i <= foldCol) {
      // Line intersects fold - only draw portion below fold
      const intersectY = getFoldIntersectY(i, foldCol, foldRow, cellHeight, y1);
      if (intersectY !== null && intersectY < y2) {
        drawGraphiteLine(x, intersectY, x, y2, i, 0, gridIndex);
      }
    } else {
      drawGraphiteLine(x, y1, x, y2, i, 0, gridIndex);
    }
  }
  
  // Draw horizontal lines
  for (let j = 0; j <= GRID_SIZE; j++) {
    const x1 = offsetX + MARGIN;
    const x2 = offsetX + w - MARGIN;
    const y = offsetY + MARGIN + j * cellHeight;
    
    if (hasFold && j <= foldRow) {
      // Line intersects fold - only draw portion right of fold
      const intersectX = getFoldIntersectX(j, foldCol, foldRow, cellWidth, x1);
      if (intersectX !== null && intersectX < x2) {
        drawGraphiteLine(intersectX, y, x2, y, j, 100, gridIndex);
      }
    } else {
      drawGraphiteLine(x1, y, x2, y, j, 100, gridIndex);
    }
  }
  
  // Draw the folded corner with reflected lines
  if (hasFold) {
    drawFoldedCorner(offsetX, offsetY, cellWidth, cellHeight, foldCol, foldRow, gridIndex);
  }
}

// ===================
// FOLD GEOMETRY
// ===================

// Find where a vertical line at column `col` intersects the fold line
function getFoldIntersectY(col, foldCol, foldRow, cellHeight, topY) {
  if (col > foldCol) return null;
  // Fold line: from (foldCol, 0) to (0, foldRow)
  const rowAtCol = foldRow * (1 - col / foldCol);
  return topY + rowAtCol * cellHeight;
}

// Find where a horizontal line at row `row` intersects the fold line
function getFoldIntersectX(row, foldCol, foldRow, cellWidth, leftX) {
  if (row > foldRow) return null;
  // Fold line: from (foldCol, 0) to (0, foldRow)
  const colAtRow = foldCol * (1 - row / foldRow);
  return leftX + colAtRow * cellWidth;
}

// Reflect a point across a line defined by two points
function reflectPointAcrossLine(px, py, lineX1, lineY1, lineX2, lineY2) {
  // Line direction (normalized)
  let dx = lineX2 - lineX1;
  let dy = lineY2 - lineY1;
  const len = sqrt(dx * dx + dy * dy);
  dx /= len;
  dy /= len;
  
  // Project point onto line
  const vx = px - lineX1;
  const vy = py - lineY1;
  const dot = vx * dx + vy * dy;
  
  // Closest point on line
  const closestX = lineX1 + dot * dx;
  const closestY = lineY1 + dot * dy;
  
  // Reflect: point → closest → reflected
  return {
    x: 2 * closestX - px,
    y: 2 * closestY - py
  };
}

// ===================
// FOLD RENDERING
// ===================

function drawFoldedCorner(offsetX, offsetY, cellWidth, cellHeight, foldCol, foldRow, gridIndex) {
  // Define fold line endpoints
  const foldTopX = offsetX + MARGIN + foldCol * cellWidth;
  const foldTopY = offsetY + MARGIN;
  const foldLeftX = offsetX + MARGIN;
  const foldLeftY = offsetY + MARGIN + foldRow * cellHeight;
  
  // Original corner and its reflection
  const cornerX = offsetX + MARGIN;
  const cornerY = offsetY + MARGIN;
  const reflected = reflectPointAcrossLine(cornerX, cornerY, foldTopX, foldTopY, foldLeftX, foldLeftY);
  
  // Clip drawing to the folded triangle
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.moveTo(foldTopX, foldTopY);
  drawingContext.lineTo(foldLeftX, foldLeftY);
  drawingContext.lineTo(reflected.x, reflected.y);
  drawingContext.closePath();
  drawingContext.clip();
  
  // Draw reflected vertical lines
  for (let i = 0; i <= foldCol; i++) {
    const x = offsetX + MARGIN + i * cellWidth;
    const y1 = offsetY + MARGIN;
    const y2 = offsetY + MARGIN + foldRow * cellHeight;
    
    const r1 = reflectPointAcrossLine(x, y1, foldTopX, foldTopY, foldLeftX, foldLeftY);
    const r2 = reflectPointAcrossLine(x, y2, foldTopX, foldTopY, foldLeftX, foldLeftY);
    drawGraphiteLine(r1.x, r1.y, r2.x, r2.y, i, 200, gridIndex);
  }
  
  // Draw reflected horizontal lines
  for (let j = 0; j <= foldRow; j++) {
    const x1 = offsetX + MARGIN;
    const x2 = offsetX + MARGIN + foldCol * cellWidth;
    const y = offsetY + MARGIN + j * cellHeight;
    
    const r1 = reflectPointAcrossLine(x1, y, foldTopX, foldTopY, foldLeftX, foldLeftY);
    const r2 = reflectPointAcrossLine(x2, y, foldTopX, foldTopY, foldLeftX, foldLeftY);
    drawGraphiteLine(r1.x, r1.y, r2.x, r2.y, j, 300, gridIndex);
  }
  
  drawingContext.restore();
  pop();
}

// ===================
// GRAPHITE LINE EFFECT
// ===================

function drawGraphiteLine(x1, y1, x2, y2, lineIndex, noiseOffset, gridIndex) {
  const totalLength = dist(x1, y1, x2, y2);
  const steps = floor(totalLength);  // One point per pixel
  
  // Layer multiple passes for graphite texture
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = lerp(x1, x2, t);
      const y = lerp(y1, y2, t);
      
      // Perlin noise for smooth pressure variation
      const n = noise(
        lineIndex * 0.4 + noiseOffset + gridIndex * 50,
        t * 2.5,
        pass * 5 + gridIndex * 10
      );
      
      // Map noise to alpha (darker/lighter sections)
      let alpha = map(n, 0.2, 0.8, 20, 160);
      alpha = constrain(alpha, 20, 160);
      
      // Random pixel skip (ink not transferring)
      if (random() < 0.15) continue;
      
      if (alpha > 3) {
        stroke(35, 32, 28, alpha);
        strokeWeight(0.85);
        point(x, y);
      }
    }
  }
}
