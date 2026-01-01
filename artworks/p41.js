/**
 * Practice 41: Replication of Sol LeWitt wall drawing installation
 * Name: Unknown
 * Date: Unknown
 * 
 * Code by Jace Yang
 */

// ===================
// CONFIGURATION
// ===================

const SQUARE_SIZE = 300;
const RECT_WIDTH = SQUARE_SIZE * 2;  // Left rectangle is 2x wider
const GAP = 0;
const MARGIN = 40;

const CANVAS_WIDTH = MARGIN * 2 + RECT_WIDTH + SQUARE_SIZE + GAP;
const CANVAS_HEIGHT = MARGIN * 2 + SQUARE_SIZE;

// Colors
const ORANGE = '#FE6637';
const BLUE = '#7889FE';
const BLACK = '#000000';
const WHITE = '#FFFFFD';
const BACKGROUND_COLOR = '#f5f3f0';

// Circle ring settings
const RING_DIAMETER = SQUARE_SIZE * 0.85;  // Bigger ring
const RING_WEIGHT = SQUARE_SIZE * 0.06;  // Thinner ring

// Cross settings
const CROSS_WIDTH = SQUARE_SIZE * 0.08;  // Cross thickness
const CROSS_LENGTH = SQUARE_SIZE * Math.sqrt(2) * 0.85;  // Cross length with margin from corners

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
  
  // Left square position
  const leftX = MARGIN;
  const leftY = MARGIN;
  
  // Right square position
  const rightX = MARGIN + RECT_WIDTH + GAP;
  const rightY = MARGIN;
  
  // Draw left rectangle (orange with blue circle ring)
  drawLeftSquare(leftX, leftY);
  
  // Draw right square (black with white cross)
  drawRightSquare(rightX, rightY);
}

// ===================
// LEFT SQUARE
// ===================

function drawLeftSquare(x, y) {
  // Orange background rectangle (2x width)
  noStroke();
  fill(ORANGE);
  rect(x, y, RECT_WIDTH, SQUARE_SIZE);
  
  // Blue circle ring (centered in rectangle)
  const centerX = x + RECT_WIDTH / 2;
  const centerY = y + SQUARE_SIZE / 2;
  
  noFill();
  stroke(BLUE);
  strokeWeight(RING_WEIGHT);
  ellipse(centerX, centerY, RING_DIAMETER, RING_DIAMETER);
}

// ===================
// RIGHT SQUARE
// ===================

function drawRightSquare(x, y) {
  // Black background
  noStroke();
  fill(BLACK);
  rect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  
  // White diagonal cross (centered)
  const centerX = x + SQUARE_SIZE / 2;
  const centerY = y + SQUARE_SIZE / 2;
  
  fill(WHITE);
  noStroke();
  
  // Rotate coordinate system 45 degrees around center
  push();
  translate(centerX, centerY);
  rotate(PI / 4);  // 45 degrees
  
  // Draw cross bars (now diagonal after rotation)
  rectMode(CENTER);
  rect(0, 0, CROSS_WIDTH, CROSS_LENGTH);
  rect(0, 0, CROSS_LENGTH, CROSS_WIDTH);
  
  pop();
  rectMode(CORNER);
}

