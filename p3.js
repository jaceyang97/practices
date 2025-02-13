/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 5:11
 *
 * Practice 3: Line - Random Diagonal
 * Code by Jace Yang
 */

// Note that we now encapsulate the square drawing in separate function.
function setup() {
  createCanvas(400, 400);
  drawSquare(); // Draw the square with its shadows and border just once.
}

function drawSquare() {
  background(255);

  push();
  drawingContext.shadowOffsetX = -5;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  stroke(0);
  strokeWeight(5);
  line(50, 50, 50, 350);
  pop();

  push();
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 5;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  stroke(0);
  strokeWeight(5);
  line(50, 350, 350, 350);
  pop();

  stroke(0);
  strokeWeight(10);
  noFill();
  rect(50, 50, 300, 300);
}

// This function runs automatically when the canvas is clicked.
function mouseClicked() {
    // Clear a larger area (75,75,250,250) to account for anti-aliasing artifacts.
    // The original 80,80,240,240 area left remnants due to sub-pixel line rendering.
  drawingContext.clearRect(75, 75, 250, 250);

  // Reset the stroke weight to 1 for a thin diagonal line; otherwise, the square's thicker stroke would carry over.
  strokeWeight(1);
  
  // Draw a random diagonal line.
  if (random(1) >= 0.5) {
    line(80, 80, 320, 320); // Top-left to bottom-right.
  } else {
    line(320, 80, 80, 320); // Top-right to bottom-left.
  }
}