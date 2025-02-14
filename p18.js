/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 11:54
 *
 * Practice 18: Recursion - Tiling
 * Code by Jace Yang
 */

const CONFIG = {
  tileStep: 30,          // Grid cell size
  minRecursion: 3,       // Minimum nested squares per tile
  maxRecursion: 5,       // Maximum nested squares per tile
  sizeReduction: 0.70,   // Size multiplier for each recursion
  shadow: {
    offsetX: -5,
    offsetY: 5,
    blur: 10,
    color: 'rgba(0, 0, 0, 0.5)'
  },
  strokeWeights: {
    main: 10,
    shadow: 5,
    thin: 0.5
  },
  gridStart: 80,         // Starting position for tiling grid
  gridSize: 240          // Size of the tiling grid area
};

function setup() {
  createCanvas(400, 400);
  drawBaseComposition();
  drawTilingSquares();
}

function drawBaseComposition() {
  background(255);
  drawShadowedFrame();
  drawThinSquare();
}

function drawShadowedFrame() {
  // Vertical shadow line
  drawShadowedLine(50, 50, 50, 350, CONFIG.shadow.offsetX, 0);
  // Horizontal shadow line
  drawShadowedLine(50, 350, 350, 350, 0, CONFIG.shadow.offsetY);
  
  // Main square frame
  strokeWeight(CONFIG.strokeWeights.main);
  rect(50, 50, 300, 300);
}

function drawShadowedLine(x1, y1, x2, y2, offsetX, offsetY) {
  push();
  drawingContext.shadowOffsetX = offsetX;
  drawingContext.shadowOffsetY = offsetY;
  drawingContext.shadowBlur = CONFIG.shadow.blur;
  drawingContext.shadowColor = CONFIG.shadow.color;
  strokeWeight(CONFIG.strokeWeights.shadow);
  line(x1, y1, x2, y2);
  pop();
}

function drawThinSquare() {
  push();
  strokeWeight(CONFIG.strokeWeights.thin);
  rect(80, 80, 240, 240);
  pop();
}

/**
 * Recursively draws squares with directional displacement
 */
function drawRecursiveSquare(x, y, size, depth, maxDepth, dir) {
  let [dispX, dispY] = calculateDisplacement(size, depth, dir);
  
  strokeWeight(CONFIG.strokeWeights.thin);
  rect(x + dispX, y + dispY, size, size);

  if (depth < maxDepth) {
    const newSize = size * CONFIG.sizeReduction;
    const offset = (size - newSize) / 2;
    drawRecursiveSquare(
      x + dispX + offset,
      y + dispY + offset,
      newSize,
      depth + 1,
      maxDepth,
      dir
    );
  }
}

function calculateDisplacement(size, depth, [dx, dy]) {
  if (depth === 0) return [0, 0];
  
  const maxOffset = (size - size * CONFIG.sizeReduction) / 2;
  const displacement = random(1, Math.min(4, maxOffset));
  return [dx * displacement, dy * displacement];
}

function drawTilingSquares() {
  push();
  const tileCount = CONFIG.gridSize / CONFIG.tileStep;
  
  for (let i = 0; i < tileCount; i++) {
    for (let j = 0; j < tileCount; j++) {
      const x = CONFIG.gridStart + i * CONFIG.tileStep;
      const y = CONFIG.gridStart + j * CONFIG.tileStep;
      const recursion = floor(random(CONFIG.minRecursion, CONFIG.maxRecursion));
      const angle = random(TWO_PI);
      drawRecursiveSquare(x, y, CONFIG.tileStep, 0, recursion, [cos(angle), sin(angle)]);
    }
  }
  pop();
}