/**
 * Generative Art exercise inspired by Tim Holman's Generative Art Speedrun talk (CSSConf Australia 2018).
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Code by Jace Yang.
 */

// Create a square canvas (400x400)
function setup() {
  createCanvas(400, 400);
  background(255);

  // Draw a square with a margin (top-left at 50,50; size 300x300)
  stroke(0);
  strokeWeight(2);
  noFill();
  rect(50, 50, 300, 300);

  // Draw a short horizontal line at the center of the square.
  // The square's center is at (200, 200), so we draw a line from (180,200) to (220,200)
  line(180, 200, 220, 200);
}