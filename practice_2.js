/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 4:50
 *
 * Practice 2: Line - Diagonal
 * Code by Jace Yang
 */

function setup() {
  createCanvas(400, 400);
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

  // Draw a diagonal line from top left to bottom right.
  strokeWeight(1);
  line(80, 80, 320, 320);
}