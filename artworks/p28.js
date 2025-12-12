/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 17:18
 *
 * Practice 28: Other Inputs - Mona Lisa - Part 2 - Recursion
 * Code by Jace Yang
 */

const config = {
  palette: {
    background: 255,
    border: 255
  },
  image: null,
  grid: {
    rows: 27,
    cols: 18
  },
  frame: {
    x: 50,
    y: 50,
    width: 0,
    height: 300
  },
  recursion: {
    maxLayers: 3,
    scaleFactor: 0.65,
    opacity: 0.85
  },
  borderWidth: 10,
  colorCache: {} // Cache for sampled colors to improve performance
};

function preload() {
  config.image = loadImage('mona_lisa.jpg');
}

function setup() {
  createCanvas(400, 400);
  
  if (config.image) {
    // Calculate frame width based on Mona Lisa's aspect ratio
    const monaLisaRatio = config.image.width / config.image.height;
    config.frame.width = config.frame.height * monaLisaRatio;
    config.frame.x = (width - config.frame.width) / 2;
  }
  
  drawRectangleFrame();
  displayImageAsRecursiveCircles();
}

function drawRectangleFrame() {
  background(config.palette.background);
  
  const fx = config.frame.x;
  const fy = config.frame.y;
  const fw = config.frame.width;
  const fh = config.frame.height;
  
  // Draw shadow for left edge
  push();
  setShadow(-5, 0);
  line(fx, fy, fx, fy + fh);
  pop();
  
  // Draw shadow for bottom edge
  push();
  setShadow(0, 5);
  line(fx, fy + fh, fx + fw, fy + fh);
  pop();
  
  // Draw frame
  noFill();
  strokeWeight(10);
  rect(fx, fy, fw, fh);
}

function setShadow(x, y) {
  drawingContext.shadowOffsetX = x;
  drawingContext.shadowOffsetY = y;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  stroke(0);
  strokeWeight(5);
}

function displayImageAsRecursiveCircles() {
  if (!config.image) return;
  
  // Calculate frame and content dimensions
  const frameX = config.frame.x;
  const frameY = config.frame.y;
  const frameWidth = config.frame.width;
  const frameHeight = config.frame.height;
  
  // Draw white border inside the frame
  fill(config.palette.border);
  noStroke();
  rect(frameX, frameY, frameWidth, frameHeight);
  
  // Calculate content area (inside the white border)
  const contentX = frameX + config.borderWidth;
  const contentY = frameY + config.borderWidth;
  const contentWidth = frameWidth - (config.borderWidth * 2);
  const contentHeight = frameHeight - (config.borderWidth * 2);
  
  const cellWidth = contentWidth / config.grid.cols;
  const cellHeight = contentHeight / config.grid.rows;
  const circleSize = min(cellWidth, cellHeight) * 1.5;
  
  // Calculate fixed gap between recursive circles
  const fixedGap = circleSize * 0.15; // 15% of the outer circle size
  
  // Load pixels once for faster sampling
  config.image.loadPixels();
  
  // Pre-calculate all positions and sampling coordinates
  const positions = [];
  const totalCells = config.grid.rows * config.grid.cols;
  
  for (let i = 0; i < totalCells; i++) {
    // Convert linear index to 2D grid coordinates
    const row = Math.floor(i / config.grid.cols);
    const col = i % config.grid.cols;
    
    // Map grid position to image sampling coordinates
    const sampleX = Math.floor(map(col, 0, config.grid.cols - 1, 0, config.image.width - 1));
    const sampleY = Math.floor(map(row, 0, config.grid.rows - 1, 0, config.image.height - 1));
    
    positions.push({
      x: contentX + (col * cellWidth) + (cellWidth / 2),
      y: contentY + (row * cellHeight) + (cellHeight / 2),
      sampleX,
      sampleY,
      random: Math.random() // For random z-ordering
    });
  }
  
  // Sort positions randomly to create varied layering effect
  positions.sort((a, b) => a.random - b.random);
  
  // Pre-calculate layer-specific values for performance
  const layerSizes = [];
  const layerAlphas = [];
  const strokeWeights = [];
  
  // Calculate sizes with consistent gaps between layers
  for (let layer = 0; layer < config.recursion.maxLayers; layer++) {
    if (layer === 0) {
      layerSizes[layer] = circleSize;
    } else {
      // Each inner circle is smaller by a fixed gap on each side (2 * fixedGap for diameter)
      layerSizes[layer] = layerSizes[layer - 1] - (2 * fixedGap);
    }
    
    // Calculate opacity and stroke weight for each layer
    layerAlphas[layer] = 255 * Math.pow(config.recursion.opacity, layer);
    strokeWeights[layer] = 0.5 + (0.5 * (config.recursion.maxLayers - layer) / config.recursion.maxLayers);
  }
  
  // Draw all circles in random order
  for (const pos of positions) {
    // Check if position is within content bounds before drawing
    const maxRadius = circleSize / 2;
    if (pos.x - maxRadius < contentX || pos.x + maxRadius > contentX + contentWidth ||
        pos.y - maxRadius < contentY || pos.y + maxRadius > contentY + contentHeight) {
      continue; // Skip circles that would extend outside content area
    }
    
    // Get base color (using cache for performance)
    const baseColor = getCachedColor(pos.sampleX, pos.sampleY);
    
    // Create darker stroke color (70% of base color brightness)
    const strokeR = red(baseColor) * 0.7;
    const strokeG = green(baseColor) * 0.7;
    const strokeB = blue(baseColor) * 0.7;
    
    // Draw all recursive layers for this position
    for (let layer = 0; layer < config.recursion.maxLayers; layer++) {
      // Skip if the circle size becomes too small
      if (layerSizes[layer] <= 0) continue;
      
      const alpha = layerAlphas[layer];
      
      fill(red(baseColor), green(baseColor), blue(baseColor), alpha);
      stroke(strokeR, strokeG, strokeB, alpha);
      strokeWeight(strokeWeights[layer]);
      ellipse(pos.x, pos.y, layerSizes[layer]);
    }
  }
}

function getCachedColor(x, y) {
  // Create a key for the cache
  const key = `${x},${y}`;
  
  // Return cached color if available
  if (config.colorCache[key]) {
    return config.colorCache[key];
  }
  
  // Otherwise sample and cache the color
  const c = sampleColorFromImage(x, y);
  config.colorCache[key] = c;
  return c;
}

function sampleColorFromImage(x, y) {
  // Sample a small area around the point for smoother colors
  const sampleRadius = 1;
  let r = 0, g = 0, b = 0;
  let sampleCount = 0;
  
  // Average the colors in a small area
  for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
    for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
      const sx = constrain(x + dx, 0, config.image.width - 1);
      const sy = constrain(y + dy, 0, config.image.height - 1);
      
      // Calculate the pixel index in the pixels array
      const index = (sy * config.image.width + sx) * 4;
      
      r += config.image.pixels[index];
      g += config.image.pixels[index + 1];
      b += config.image.pixels[index + 2];
      sampleCount++;
    }
  }
  
  // Calculate the average color
  r = r / sampleCount;
  g = g / sampleCount;
  b = b / sampleCount;
  
  return color(r, g, b);
}