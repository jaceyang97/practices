/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 17:10
 *
 * Practice 27: Other Inputs - Mona Lisa - Part 1 - Grid Colors
 * Code by Jace Yang
 */

const config = {
  palette: {
    background: 255
  },
  image: null,
  grid: {
    rows: 13,
    cols: 9
  },
  frame: {
    x: 50,
    y: 50,
    width: 0,
    height: 300
  }
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
  displayImageAsCircles();
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

function displayImageAsCircles() {
  if (!config.image) return;
  
  const frameX = config.frame.x;
  const frameY = config.frame.y;
  const frameWidth = config.frame.width;
  const frameHeight = config.frame.height;
  
  const margin = 20;
  const imgX = frameX + margin;
  const imgY = frameY + margin;
  const imgWidth = frameWidth - (margin * 2);
  const imgHeight = frameHeight - (margin * 2);
  
  const cellWidth = imgWidth / config.grid.cols;
  const cellHeight = imgHeight / config.grid.rows;
  const circleSize = min(cellWidth, cellHeight) * 0.95;
  
  config.image.loadPixels();
  
  for (let row = 0; row < config.grid.rows; row++) {
    for (let col = 0; col < config.grid.cols; col++) {
      // Calculate the position of the circle
      const x = imgX + (col * cellWidth) + (cellWidth / 2);
      const y = imgY + (row * cellHeight) + (cellHeight / 2);
      
      // Sample color from the corresponding position in the image
      const sampleX = map(col, 0, config.grid.cols - 1, 0, config.image.width - 1);
      const sampleY = map(row, 0, config.grid.rows - 1, 0, config.image.height - 1);
      const color = sampleColorFromImage(sampleX, sampleY);
      
      // Draw the circle
      fill(color);
      noStroke();
      ellipse(x, y, circleSize);
    }
  }
}

function sampleColorFromImage(x, y) {
  // Ensure coordinates are within image bounds
  x = constrain(x, 0, config.image.width - 1);
  y = constrain(y, 0, config.image.height - 1);
  
  const ix = floor(x);
  const iy = floor(y);
  
  // Calculate the pixel index in the pixels array
  const index = (iy * config.image.width + ix) * 4;
  
  const r = config.image.pixels[index];
  const g = config.image.pixels[index + 1];
  const b = config.image.pixels[index + 2];
  
  return color(r, g, b);
}
