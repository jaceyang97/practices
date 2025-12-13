/**
 * Practice 39: Folding Grid
 * A 26×26 grid with graphite pencil-like lines.
 * Fold is implemented by reflecting pixels across a fold line.
 * 
 * Code by Jace Yang
 */

// ===================
// CONFIGURATION
// ===================

const CANVAS_SIZE = 600;
const GRID_SIZE = 26;
const MARGIN = 40;

// Set to store all rendered pixel coordinates
// Format: "x,y" -> { x, y, alpha }
let renderedPixels = new Map();

// ===================
// SETUP & DRAW
// ===================

function setup() {
  createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  pixelDensity(2);
  noLoop();
  // No smooth() - keep the graphite pencil texture
}

function draw() {
  background(252, 250, 248);
  renderedPixels.clear();
  
  const gridWidth = width - MARGIN * 2;
  const gridHeight = height - MARGIN * 2;
  const cellWidth = gridWidth / GRID_SIZE;
  const cellHeight = gridHeight / GRID_SIZE;
  
  // Draw the full grid first
  drawFullGrid(cellWidth, cellHeight);
  
  // Fold 1: Top-left corner fold
  // Line from (col 18, row 0) to (col 0, row 12)
  const fold1 = {
    x1: MARGIN + 18 * cellWidth,  // point on top edge
    y1: MARGIN,
    x2: MARGIN,                    // point on left edge
    y2: MARGIN + 12 * cellHeight
  };
  
  applyFold(fold1);
  
  // Fold 2: From 2/3 point of fold1 to right edge
  const t = 2/3;  // 2/3 along fold1 line
  const fold2StartX = fold1.x1 + (fold1.x2 - fold1.x1) * t;
  const fold2StartY = fold1.y1 + (fold1.y2 - fold1.y1) * t;
  
  // Point on right edge (row 10)
  const fold2 = {
    x1: fold2StartX,
    y1: fold2StartY,
    x2: width - MARGIN,  // right edge
    y2: MARGIN + 10 * cellHeight
  };
  
  applyFold(fold2);
  
  // Render all pixels from the set
  renderPixels();
}

// ===================
// GRID DRAWING
// ===================

function drawFullGrid(cellWidth, cellHeight) {
  // Draw vertical lines
  for (let i = 0; i <= GRID_SIZE; i++) {
    const x = MARGIN + i * cellWidth;
    addGraphiteLine(x, MARGIN, x, height - MARGIN, i, 0);
  }
  
  // Draw horizontal lines
  for (let j = 0; j <= GRID_SIZE; j++) {
    const y = MARGIN + j * cellHeight;
    addGraphiteLine(MARGIN, y, width - MARGIN, y, j, 100);
  }
}

// ===================
// FOLD OPERATION
// ===================

function applyFold(foldLine) {
  const { x1, y1, x2, y2 } = foldLine;
  
  const pixelsToRemove = [];
  const pixelsToAdd = [];
  
  // Check if this is a corner fold (top-left corner)
  const isCornerFold = (x2 === MARGIN && y1 === MARGIN);
  
  for (const [key, pixel] of renderedPixels) {
    const { x, y, alpha } = pixel;
    let shouldFold = false;
    
    if (isCornerFold) {
      // Corner fold: only fold pixels inside the triangle
      const cornerX = MARGIN;
      const cornerY = MARGIN;
      shouldFold = isPointInTriangle(x, y, x1, y1, x2, y2, cornerX, cornerY);
    } else {
      // General fold: fold pixels on one side of the line
      // For fold2, fold pixels that are above/left of the line
      const side = getSideOfLine(x, y, x1, y1, x2, y2);
      shouldFold = (side < 0);  // Negative means above/left
    }
    
    if (shouldFold) {
      // Pixel is in the fold area - reflect it
      const reflected = reflectPointAcrossLine(x, y, x1, y1, x2, y2);
      
      pixelsToRemove.push(key);
      // Store with higher precision
      const rx = round(reflected.x * 100) / 100;
      const ry = round(reflected.y * 100) / 100;
      pixelsToAdd.push({
        x: reflected.x,  // Keep float for rendering
        y: reflected.y,
        alpha: alpha,
        key: `${rx.toFixed(2)},${ry.toFixed(2)}`
      });
    }
  }
  
  // Remove old pixels
  for (const key of pixelsToRemove) {
    renderedPixels.delete(key);
  }
  
  // Add reflected pixels
  for (const pixel of pixelsToAdd) {
    const key = pixel.key;
    // If pixel already exists, keep the darker one (higher alpha)
    if (renderedPixels.has(key)) {
      const existing = renderedPixels.get(key);
      if (pixel.alpha > existing.alpha) {
        renderedPixels.set(key, { x: pixel.x, y: pixel.y, alpha: pixel.alpha });
      }
    } else {
      renderedPixels.set(key, { x: pixel.x, y: pixel.y, alpha: pixel.alpha });
    }
  }
}

// Check if point is inside triangle using barycentric coordinates
function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / d;
  const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / d;
  const c = 1 - a - b;
  
  return a >= 0 && b >= 0 && c >= 0;
}

// Determine which side of a line a point is on
// Returns negative if on left/above, positive if on right/below, 0 if on line
function getSideOfLine(px, py, x1, y1, x2, y2) {
  return (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1);
}

// Reflect a point across a line
function reflectPointAcrossLine(px, py, x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  dx /= len;
  dy /= len;
  
  const vx = px - x1;
  const vy = py - y1;
  const dot = vx * dx + vy * dy;
  
  const closestX = x1 + dot * dx;
  const closestY = y1 + dot * dy;
  
  return {
    x: 2 * closestX - px,
    y: 2 * closestY - py
  };
}

// ===================
// PIXEL RENDERING
// ===================

function addGraphiteLine(x1, y1, x2, y2, lineIndex, noiseOffset) {
  const totalLength = dist(x1, y1, x2, y2);
  const steps = floor(totalLength);
  
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = lerp(x1, x2, t);
      const y = lerp(y1, y2, t);
      
      const n = noise(
        lineIndex * 0.4 + noiseOffset,
        t * 2.5,
        pass * 5
      );
      
      let alpha = map(n, 0.2, 0.8, 60, 200);
      alpha = constrain(alpha, 60, 200);
      
      if (random() < 0.15) continue;
      
      if (alpha > 3) {
        // Store with higher precision (round to 0.01 for key, but keep float for rendering)
        const px = round(x * 100) / 100;
        const py = round(y * 100) / 100;
        const key = `${px.toFixed(2)},${py.toFixed(2)}`;
        
        // Store pixel with its alpha and precise coordinates
        if (renderedPixels.has(key)) {
          const existing = renderedPixels.get(key);
          if (alpha > existing.alpha) {
            renderedPixels.set(key, { x: x, y: y, alpha });
          }
        } else {
          renderedPixels.set(key, { x: x, y: y, alpha });
        }
      }
    }
  }
}

function renderPixels() {
  // Render with float coordinates for smooth folds, but keep graphite texture via alpha
  for (const [key, pixel] of renderedPixels) {
    stroke(35, 32, 28, pixel.alpha);
    strokeWeight(0.85);
    // Use float coordinates directly for smooth rendering
    point(pixel.x, pixel.y);
  }
}
