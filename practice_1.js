/**
 * Generative Art exercise (shown at 4:47 in Tim Holman's Speedrun talk, CSSConf Australia 2018).
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Code by Jace Yang.
 */

function setup() {
  // Create a canvas that is 400 pixels wide and 400 pixels tall.
  createCanvas(400, 400);

  // Set the background color of the canvas to white.
  // The value 255 represents white in grayscale.
  background(255);

  // --- Draw the left edge shadow only ---
  // Save the current drawing style and settings.
  push();
  // Set the horizontal offset for the shadow to -5 pixels.
  // This makes the shadow appear 5 pixels to the left.
  drawingContext.shadowOffsetX = -5;
  // Set the vertical offset for the shadow to 0 pixels (no shift up or down).
  drawingContext.shadowOffsetY = 0;
  // Set the blur level for the shadow to 10 pixels, creating a soft edge.
  drawingContext.shadowBlur = 10;
  // Define the shadow color as a semi-transparent black.
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  // Set the color to draw lines (stroke) to black.
  stroke(0);
  // Set the thickness of the line to 5 pixels.
  strokeWeight(5);
  // Draw a vertical line representing the left side of the square.
  // The line starts at (50, 50) and ends at (50, 350).
  line(50, 50, 50, 350);
  // Restore the previous drawing style and settings (removing the shadow effect for subsequent drawings).
  pop();

  // --- Draw the bottom edge shadow only ---
  // Save the current drawing settings again.
  push();
  // Set the horizontal offset for the shadow to 0 pixels (no left/right shift).
  drawingContext.shadowOffsetX = 0;
  // Set the vertical offset for the shadow to 5 pixels.
  // This makes the shadow appear 5 pixels below.
  drawingContext.shadowOffsetY = 5;
  // Keep the blur level consistent at 10 pixels.
  drawingContext.shadowBlur = 10;
  // Use the same shadow color (semi-transparent black).
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  // Set the line color to black.
  stroke(0);
  // Set the line thickness to 5 pixels.
  strokeWeight(5);
  // Draw a horizontal line representing the bottom side of the square.
  // This line starts at (50, 350) and ends at (350, 350).
  line(50, 350, 350, 350);
  // Restore the previous drawing settings.
  pop();

  // --- Draw the square border without any shadow ---
  // Set the stroke color for the square border to black.
  stroke(0);
  // Increase the thickness of the square border to 10 pixels.
  strokeWeight(10);
  // Disable filling the shape so only the outline is drawn.
  noFill();
  // Draw the square border.
  // The square starts at (50, 50) and is 300 pixels wide and 300 pixels tall.
  rect(50, 50, 300, 300);

  // --- Draw the shorter horizontal line across the center of the square ---
  // Reset the stroke weight to 1 pixel for a thinner line.
  strokeWeight(1);
  // Draw a horizontal line that is centered in the square.
  // The square spans from x = 50 to x = 350, a 300px width.
  // A centered 150px long line will start at x = 125 (50 + 75) and end at x = 275 (350 - 75) with a fixed y of 200.
  line(125, 200, 275, 200);
}