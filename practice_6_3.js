/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 6:58
 *
 * Practice 6: Displacement - Part 3
 * Code by Jace Yang
 */

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    drawHorizontalLines(19, 10, { exponentX: 0.9, exponentY: 1 });
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

// Remove the dots by simply commenting out the code that draws them.
function drawHorizontalLines(numLines, dotFluctuation, config = {}) {
    const { exponentX = 1, exponentY = 1 } = config;

    // Setup constants for the square.
    const xStart = 80;
    const yStart = 80;
    const size = 240;
    const spacing = size / (numLines + 1);
    const xMargin = size / numLines;
    const lineStart = xStart + xMargin;
    const lineEnd = xStart + size - xMargin;
    const dotsCount = numLines - 1;
    // Pre-compute the horizontal step between dots.
    const dotStep = (lineEnd - lineStart) / (dotsCount - 1);

    push();
    // Set drawing styles once.
    stroke(0);
    strokeWeight(1);
    noFill();

    // For each horizontal row:
    for (let i = 1; i <= numLines; i++) {
        let y = yStart + spacing * i;
        let prevDot = null; // Used to store the previous dot's coordinates.
        
        // For each dot in this row:
        for (let d = 0; d < dotsCount; d++) {
            let dotX = lineStart + d * dotStep;
            
            // Normalize x and y positions (0 to 1).
            let normX = (dotX - xStart) / size;
            let normY = (y - yStart) / size;
            
            // Compute the randomness factor using independent non-linear curves.
            // Alternative: averaging the factors, reducing the randomness.
            // let factor = (Math.pow(normX, exponentX) + Math.pow(normY, exponentY)) / 2;
            let factor = Math.pow(normX, exponentX) * Math.pow(normY, exponentY);
            
            // Calculate the vertical offset for the dot.
            let dotOffset = random(-dotFluctuation * factor, dotFluctuation * factor);
            let dotY = y + dotOffset;
            
            // If a previous dot exists, draw a line from it to the current dot.
            if (prevDot) {
                line(prevDot.x, prevDot.y, dotX, dotY);
            }
            
            // Update the previous dot.
            prevDot = { x: dotX, y: dotY };
        }
    }
    pop();
}