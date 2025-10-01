/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 17:26
 *
 * Practice 29: Other Inputs - Mona Lisa - Part 3 - Lego Blocks
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
    opacity: 0.95
  },
  borderWidth: 10,
  colorCache: {}
};

function preload() {
  config.image = loadImage('mona_lisa.jpg');
}

function setup() {
  createCanvas(400, 400);
  
  if (config.image) {
    const monaLisaRatio = config.image.width / config.image.height;
    config.frame.width = config.frame.height * monaLisaRatio;
    config.frame.x = (width - config.frame.width) / 2;
  }
  
  drawRectangleFrame();
  displayImageAsRecursiveSquares();
}

function drawRectangleFrame() {
  background(config.palette.background);
  
  const fx = config.frame.x;
  const fy = config.frame.y;
  const fw = config.frame.width;
  const fh = config.frame.height;
  
  push();
  setShadow(-5, 0);
  line(fx, fy, fx, fy + fh);
  pop();
  
  push();
  setShadow(0, 5);
  line(fx, fy + fh, fx + fw, fy + fh);
  pop();
  
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

function displayImageAsRecursiveSquares() {
  if (!config.image) return;
  
  const frameX = config.frame.x;
  const frameY = config.frame.y;
  const frameWidth = config.frame.width;
  const frameHeight = config.frame.height;
  
  fill(config.palette.border);
  noStroke();
  rect(frameX, frameY, frameWidth, frameHeight);
  
  const contentX = frameX + config.borderWidth;
  const contentY = frameY + config.borderWidth;
  const contentWidth = frameWidth - (config.borderWidth * 2);
  const contentHeight = frameHeight - (config.borderWidth * 2);
  
  const cellWidth = contentWidth / config.grid.cols;
  const cellHeight = contentHeight / config.grid.rows;
  
  config.image.loadPixels();
  
  // Draw squares in grid order (no randomization, no overlapping)
  for (let row = 0; row < config.grid.rows; row++) {
    for (let col = 0; col < config.grid.cols; col++) {
      const x = contentX + (col * cellWidth);
      const y = contentY + (row * cellHeight);
      
      // Check if square is within content bounds
      if (x < contentX || x + cellWidth > contentX + contentWidth ||
          y < contentY || y + cellHeight > contentY + contentHeight) {
        continue; // Skip squares that would extend outside content area
      }
      
      const sampleX = Math.floor(map(col, 0, config.grid.cols - 1, 0, config.image.width - 1));
      const sampleY = Math.floor(map(row, 0, config.grid.rows - 1, 0, config.image.height - 1));
      
      const baseColor = getCachedColor(sampleX, sampleY);
      
      const strokeR = red(baseColor) * 0.8;
      const strokeG = green(baseColor) * 0.8;
      const strokeB = blue(baseColor) * 0.8;
      
      drawRecursiveSquare(x, y, cellWidth, cellHeight, baseColor, 
                         color(strokeR, strokeG, strokeB), 0);
    }
  }
}

function drawRecursiveSquare(x, y, width, height, fillColor, strokeColor, layer) {
  if (layer >= config.recursion.maxLayers) return;
  
  const alpha = 255 * Math.pow(config.recursion.opacity, layer);
  
  push();
  fill(red(fillColor), green(fillColor), blue(fillColor), alpha);
  stroke(red(strokeColor), green(strokeColor), blue(strokeColor), alpha);
  strokeWeight(1);
  
  rect(x, y, width, height);
  
  const padding = min(width, height) * 0.2;
  const innerX = x + padding;
  const innerY = y + padding;
  const innerWidth = width - (padding * 2);
  const innerHeight = height - (padding * 2);
  
  if (layer === 0) {
    const studSize = min(width, height) * 0.15;
    const studRows = 2;
    const studCols = Math.floor(width / height * 2);
    
    for (let sr = 0; sr < studRows; sr++) {
      for (let sc = 0; sc < studCols; sc++) {
        const studX = x + (sc + 0.5) * (width / studCols) - (studSize / 2);
        const studY = y + (sr + 0.5) * (height / studRows) - (studSize / 2);
        
        push();
        fill(red(fillColor) * 0.9, green(fillColor) * 0.9, blue(fillColor) * 0.9);
        stroke(red(strokeColor), green(strokeColor), blue(strokeColor));
        strokeWeight(0.5);
        ellipse(studX, studY, studSize);
        pop();
      }
    }
  }
  
  pop();
  
  if (innerWidth > 0 && innerHeight > 0) {
    drawRecursiveSquare(innerX, innerY, innerWidth, innerHeight, fillColor, strokeColor, layer + 1);
  }
}

function getCachedColor(x, y) {
  const key = `${x},${y}`;
  
  if (config.colorCache[key]) {
    return config.colorCache[key];
  }
  
  const c = sampleColorFromImage(x, y);
  config.colorCache[key] = c;
  return c;
}

function sampleColorFromImage(x, y) {
  const sampleRadius = 1;
  let r = 0, g = 0, b = 0;
  let sampleCount = 0;
  
  for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
    for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
      const sx = constrain(x + dx, 0, config.image.width - 1);
      const sy = constrain(y + dy, 0, config.image.height - 1);
      
      const index = (sy * config.image.width + sx) * 4;
      
      r += config.image.pixels[index];
      g += config.image.pixels[index + 1];
      b += config.image.pixels[index + 2];
      sampleCount++;
    }
  }
  
  r = r / sampleCount;
  g = g / sampleCount;
  b = b / sampleCount;
  
  return color(r, g, b);
}