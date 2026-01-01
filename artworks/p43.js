/**
 * Practice 43: Replication of Ad Reinhardt's "Abstract Painting, Blue" (1953)
 * 
 * Ad Reinhardt (1913-1967) was known for his monochromatic paintings featuring
 * barely perceptible variations in color. His blue paintings use subtle shifts
 * in deep blue tones arranged in geometric grids, requiring prolonged viewing
 * to perceive the underlying structure.
 * 
 * The composition is a 3×3 grid implied only through minute tonal differences:
 * - Top/bottom center: darkest blue (#0B2D91)
 * - Middle row (all three): medium blue (#16367B)
 * - Four corners: lightest blue (#233481)
 * - Creates a faint cross-like structure
 * 
 * Code by Jace Yang
 */

// ===================
// CONFIGURATION
// ===================

// Painting dimensions
const PAINTING_WIDTH = 500;
const PAINTING_HEIGHT = 600;

// Border
const BORDER_WIDTH = 6;
const BORDER_COLOR = [69, 73, 78];  // #45494E

// Content dimensions (painting + border)
const contentWidth = PAINTING_WIDTH + BORDER_WIDTH * 2;
const contentHeight = PAINTING_HEIGHT + BORDER_WIDTH * 2;

// Padding: equal on all sides
// Use a fixed padding amount for all sides
const PADDING = 30;  // Equal padding on all sides

// Canvas is square with equal padding on all sides
const CANVAS_WIDTH = contentHeight + PADDING * 2;
const CANVAS_HEIGHT = contentHeight + PADDING * 2;

// Grid
const COLS = 3;
const ROWS = 3;

// Colors (hex converted to RGB)
const COLOR_TOP_BOTTOM_CENTER = [11, 45, 145];   // #0B2D91 - darkest
const COLOR_MIDDLE_ROW = [22, 54, 123];          // #16367B - medium
const COLOR_CORNERS = [35, 52, 129];             // #233481 - lightest

// ===================
// SETUP
// ===================

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  pixelDensity(2);
  noLoop();
}

// ===================
// DRAW
// ===================

function draw() {
  // White canvas background
  background(255);
  
  // Calculate border rectangle position (centered with equal padding on all sides)
  const borderX = PADDING + (contentHeight - contentWidth) / 2;  // Center horizontally
  const borderY = PADDING;  // Padding on top
  const borderW = contentWidth;
  const borderH = contentHeight;
  
  // Draw border rectangle
  noStroke();
  fill(BORDER_COLOR);
  rect(borderX, borderY, borderW, borderH);
  
  // Offset for painting area (inside border)
  const offsetX = borderX + BORDER_WIDTH;
  const offsetY = borderY + BORDER_WIDTH;
  
  // Base painting background
  fill(COLOR_MIDDLE_ROW);
  rect(offsetX, offsetY, PAINTING_WIDTH, PAINTING_HEIGHT);
  
  const cellW = PAINTING_WIDTH / COLS;
  const cellH = PAINTING_HEIGHT / ROWS;
  
  // Define color for each cell in the 3x3 grid
  const grid = [
    // Row 0 (top)
    [COLOR_CORNERS, COLOR_TOP_BOTTOM_CENTER, COLOR_CORNERS],
    // Row 1 (middle)
    [COLOR_MIDDLE_ROW, COLOR_MIDDLE_ROW, COLOR_MIDDLE_ROW],
    // Row 2 (bottom)
    [COLOR_CORNERS, COLOR_TOP_BOTTOM_CENTER, COLOR_CORNERS],
  ];
  
  // Draw each cell with soft edges
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const color = grid[row][col];
      const x = offsetX + col * cellW;
      const y = offsetY + row * cellH;
      
      drawSoftCell(x, y, cellW, cellH, color);
    }
  }
  
  // Apply subtle blending between cells for seamless transitions
  applyBlending(offsetX, offsetY, PAINTING_WIDTH, PAINTING_HEIGHT);
}

// ===================
// SOFT CELL RENDERING
// ===================

function drawSoftCell(x, y, w, h, col) {
  const [r, g, b] = col;
  
  // Draw with feathered edges for soft transitions
  const feather = min(w, h) * 0.15;
  
  // Core rectangle (full opacity)
  fill(r, g, b);
  rect(x + feather, y + feather, w - feather * 2, h - feather * 2);
  
  // Feathered edges with graduated opacity
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const alpha = map(t, 0, 1, 200, 20);
    const offset = feather * t;
    
    fill(r, g, b, alpha);
    
    // Top edge
    rect(x + offset, y + offset, w - offset * 2, feather - offset);
    // Bottom edge
    rect(x + offset, y + h - feather, w - offset * 2, feather - offset);
    // Left edge
    rect(x + offset, y + feather, feather - offset, h - feather * 2);
    // Right edge
    rect(x + w - feather, y + feather, feather - offset, h - feather * 2);
  }
}

// ===================
// BLENDING
// ===================

function applyBlending(offsetX, offsetY, paintW, paintH) {
  loadPixels();
  
  const d = pixelDensity();
  const canvasW = width * d;
  const canvasH = height * d;
  
  // Calculate painting bounds in pixel coordinates
  const startX = offsetX * d;
  const startY = offsetY * d;
  const endX = (offsetX + paintW) * d;
  const endY = (offsetY + paintH) * d;
  
  const original = pixels.slice();
  const radius = 3;
  
  // Only blend within the painting area
  for (let y = startY + radius; y < endY - radius; y++) {
    for (let x = startX + radius; x < endX - radius; x++) {
      let r = 0, g = 0, b = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const idx = ((y + dy) * canvasW + (x + dx)) * 4;
          r += original[idx];
          g += original[idx + 1];
          b += original[idx + 2];
          count++;
        }
      }
      
      const idx = (y * canvasW + x) * 4;
      pixels[idx] = r / count;
      pixels[idx + 1] = g / count;
      pixels[idx + 2] = b / count;
    }
  }
  
  updatePixels();
}
