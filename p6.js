/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 6:29
 *
 * Practice 6: Displacement - Part 1
 * Code by Jace Yang
 */

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    // Change the parameter to adjust how many horizontal lines are drawn inside the inner square
    drawHorizontalLines(9);
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

function drawThinSquare() {
    push();
    stroke(0);
    strokeWeight(0.02);
    noFill();
    rect(80, 80, 240, 240);
    pop();
}

// Draws equally spaced horizontal lines inside the inner square.
// The inner square is positioned at (80,80) with a size of 240x240.
// Each line will have left/right margins equal to 1 "part" (where the inner square is divided into numLines parts)
// For example, if numLines is 10 the drawn line spans 8 parts; if numLines is 6 the line spans 4 parts.
function drawHorizontalLines(numLines) {
    let xStart = 80;
    let yStart = 80;
    let size = 240;

    // Vertical spacing for the horizontal lines remains as before.
    let spacing = size / (numLines + 1);

    // Determine the horizontal "part" (segment) width.
    let xMargin = size / numLines;

    // The line should start after one part and end before the last part.
    let lineStart = xStart + xMargin;
    let lineEnd = xStart + size - xMargin;

    // Since the line spans (numLines - 2) parts, placing dots at each division 
    // (including both endpoints) results in (numLines - 2 + 1) dots.
    // This means: if numLines is 10 then there will be 9 dots; if numLines is 6 then 5 dots.
    let dotsCount = numLines - 1;

    push();
    stroke(0);
    strokeWeight(1);
    for (let i = 1; i <= numLines; i++) {
        let y = yStart + spacing * i;
        
        // Draw the horizontal line.
        line(lineStart, y, lineEnd, y);
        
        // Set styles for drawing the dots.
        let dotSize = 5; // Adjust this value to change dot size
        fill(0);
        noStroke();
        
        // Draw dots spaced equally along the line.
        for (let d = 0; d < dotsCount; d++) {
            // Compute each dot's x coordinate:
            // When d = 0 -> dotX is at lineStart; when d = dotsCount - 1 -> dotX is at lineEnd.
            let dotX = lineStart + d * ((lineEnd - lineStart) / (dotsCount - 1));
            ellipse(dotX, y, dotSize, dotSize);
        }
        
        // Reset styles for the next line
        noFill();
        stroke(0);
    }
    pop();
}