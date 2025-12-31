/**
 * Practice 40: Vanish
 * A replication of Sol LeWitt's "Vanish" (1994)
 * A 7×5 grid of framed rectangular panels with black rectangles that progressively shrink.
 * Sequence: left-to-right, top-to-bottom
 * 
 * Code by Jace Yang
 */

// ===================
// CONFIGURATION
// ===================

const COLS = 7;
const ROWS = 5;
const TOTAL_PANELS = COLS * ROWS;  // 35 panels

// Frame aspect ratio 275:375
const FRAME_RATIO = 275 / 375;

// Base frame height (width derived from ratio)
const FRAME_HEIGHT = 150;
const FRAME_WIDTH = Math.round(FRAME_HEIGHT * FRAME_RATIO);  // ~110

// Inner rectangle ratios relative to frame
// At index 0: rect is 258/275 of frame width, 352/375 of frame height
const RECT_WIDTH_RATIO = 258 / 275;   // ~0.938
const RECT_HEIGHT_RATIO = 352 / 375;  // ~0.939

// Maximum inner rect dimensions
const MAX_RECT_WIDTH = FRAME_WIDTH * RECT_WIDTH_RATIO;
const MAX_RECT_HEIGHT = FRAME_HEIGHT * RECT_HEIGHT_RATIO;

// Height progression: at second-to-last panel, height is 118/352 of max
const MIN_HEIGHT_FACTOR = 118 / 352;  // ~0.335

const PANEL_MARGIN = 6;
const OUTER_MARGIN = 20;

// Calculate grid dimensions (actual artwork size)
const GRID_WIDTH = FRAME_WIDTH * COLS + PANEL_MARGIN * (COLS - 1);
const GRID_HEIGHT = FRAME_HEIGHT * ROWS + PANEL_MARGIN * (ROWS - 1);

// Make canvas square - use the larger dimension
const CANVAS_SIZE = Math.max(
  OUTER_MARGIN * 2 + GRID_WIDTH,
  OUTER_MARGIN * 2 + GRID_HEIGHT
);
const CANVAS_WIDTH = CANVAS_SIZE;
const CANVAS_HEIGHT = CANVAS_SIZE;

// Colors
const BACKGROUND_COLOR = '#f5f3f0';
const PANEL_BG_COLOR = '#E7E6E2';
const FRAME_COLOR = '#1a1a1a';
const RECT_COLOR = '#0d0d0d';

// ===================
// SETUP & DRAW
// ===================

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  pixelDensity(2);
  noLoop();
  noiseSeed(42);
}

function draw() {
  background(BACKGROUND_COLOR);
  
  // Center the grid within the square canvas
  const offsetX = (CANVAS_SIZE - GRID_WIDTH) / 2;
  const offsetY = (CANVAS_SIZE - GRID_HEIGHT) / 2;
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = offsetX + col * (FRAME_WIDTH + PANEL_MARGIN);
      const y = offsetY + row * (FRAME_HEIGHT + PANEL_MARGIN);
      
      // Sequential index: 0 to 34, left-to-right, top-to-bottom
      const index = row * COLS + col;
      
      drawPanel(x, y, index);
    }
  }
}

// ===================
// PANEL DRAWING
// ===================

function drawPanel(x, y, index) {
  const frameWeight = 2;
  
  // Draw panel background
  noStroke();
  fill(PANEL_BG_COLOR);
  rect(x, y, FRAME_WIDTH, FRAME_HEIGHT);
  
  // Draw frame - strict straight lines
  stroke(FRAME_COLOR);
  strokeWeight(frameWeight);
  noFill();
  rect(x + frameWeight/2, y + frameWeight/2, FRAME_WIDTH - frameWeight, FRAME_HEIGHT - frameWeight);
  
  // Get rectangle dimensions
  const dims = getRectDimensions(index);
  
  // Skip if no rectangle (last panel)
  if (dims.width <= 0 || dims.height <= 0) return;
  
  // Position: centered both horizontally and vertically
  const rectX = x + FRAME_WIDTH / 2 - dims.width / 2;
  const rectY = y + FRAME_HEIGHT / 2 - dims.height / 2;
  
  // Draw the black rectangle with slight hand-drawn feel
  noStroke();
  fill(RECT_COLOR);
  drawOrganicRect(rectX, rectY, dims.width, dims.height, index);
}

// ===================
// DIMENSION CALCULATION
// ===================

/**
 * Calculate inner rectangle dimensions based on sequential index.
 * 
 * Width: Linear decrease from MAX to 0 over indices 0-34
 *   width = MAX_RECT_WIDTH * (34 - index) / 34
 * 
 * Height: Linear decrease from MAX to MIN_HEIGHT_FACTOR*MAX over indices 0-33,
 *         then drops to 0 at index 34
 *   height = MAX_RECT_HEIGHT * (1 - (1 - MIN_HEIGHT_FACTOR) * index / 33)
 */
function getRectDimensions(index) {
  // Last panel (index 34) has no rectangle
  if (index >= TOTAL_PANELS - 1) {
    return { width: 0, height: 0 };
  }
  
  // Width: linear from max to 0 over all 35 panels
  // w(i) = maxW * (34 - i) / 34
  const widthFactor = (TOTAL_PANELS - 1 - index) / (TOTAL_PANELS - 1);
  const width = MAX_RECT_WIDTH * widthFactor;
  
  // Height: linear from max to (MIN_HEIGHT_FACTOR * max) over first 34 panels
  // h(i) = maxH * [1 - (1 - MIN_HEIGHT_FACTOR) * i / 33]
  const heightFactor = 1 - (1 - MIN_HEIGHT_FACTOR) * (index / (TOTAL_PANELS - 2));
  const height = MAX_RECT_HEIGHT * heightFactor;
  
  return { width, height };
}

// ===================
// ORGANIC DRAWING
// ===================

/**
 * Draw a rectangle with slight hand-drawn imperfections
 */
function drawOrganicRect(x, y, w, h, seed) {
  // For very small rectangles, just draw a simple rect
  if (w < 3 || h < 3) {
    rect(x, y, w, h);
    return;
  }
  
  // Subtle hand-drawn waviness - more rigid
  const waviness = min(w, h) * 0.012;  // ~1.2% of smallest dimension
  const segments = max(8, floor(min(w, h) / 4));  // Fewer segments for more rigid feel
  
  // Create unique seed for each rectangle using index, position, and size
  // This ensures each rectangle has a completely different hand-drawn pattern
  const uniqueSeed = seed * 17.3 + x * 0.07 + y * 0.11 + w * 0.13 + h * 0.19;
  
  // Different offsets for each edge to ensure uniqueness
  const topOffset = uniqueSeed * 0.5;
  const rightOffset = uniqueSeed * 0.7 + 500;
  const bottomOffset = uniqueSeed * 0.9 + 1000;
  const leftOffset = uniqueSeed * 1.1 + 1500;
  
  beginShape();
  
  // Top edge - subtle wobble
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const px = x + w * t;
    const wobble = (noise(topOffset + t * 3.0, px * 0.008) - 0.5) * waviness * 1.5;
    vertex(px, y + wobble);
  }
  
  // Right edge
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const py = y + h * t;
    const wobble = (noise(rightOffset + t * 3.0, py * 0.008) - 0.5) * waviness * 1.5;
    vertex(x + w + wobble, py);
  }
  
  // Bottom edge
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const px = x + w * t;
    const wobble = (noise(bottomOffset + t * 3.0, px * 0.008) - 0.5) * waviness * 1.5;
    vertex(px, y + h + wobble);
  }
  
  // Left edge
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const py = y + h * t;
    const wobble = (noise(leftOffset + t * 3.0, py * 0.008) - 0.5) * waviness * 1.5;
    vertex(x + wobble, py);
  }
  
  endShape(CLOSE);
}
