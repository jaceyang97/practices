/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 6:37
 *
 * Practice 7: Displacement - Part 2
 * Code by Jace Yang
 */

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    drawHorizontalLines(9, 10);
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

// This is different from the previous practice.
// Here we draw dots first, then draw connecting segments between each consecutive dot to achieve the same effect.
function drawHorizontalLines(numLines, dotFluctuation) {
    let xStart = 80;
    let yStart = 80;
    let size = 240;

    let spacing = size / (numLines + 1);

    let xMargin = size / numLines;

    // Determine the starting and ending x-coordinates for the dots.
    let lineStart = xStart + xMargin;
    let lineEnd = xStart + size - xMargin;

    let dotsCount = numLines - 1;
    
    push();
    // For each horizontal row:
    for (let i = 1; i <= numLines; i++) {
        let y = yStart + spacing * i;
        let dots = [];
        
        // Compute each dot's coordinates.
        for (let d = 0; d < dotsCount; d++) {
            let dotX = lineStart + d * ((lineEnd - lineStart) / (dotsCount - 1));
            // Apply a random fluctuation to the y-coordinate
            let dotY = y + random(-dotFluctuation, dotFluctuation); 
            dots.push({ x: dotX, y: dotY });
        }

        // Draw the individual dots.
        fill(0);
        noStroke();
        let dotSize = 5;
        dots.forEach(dot => {
            ellipse(dot.x, dot.y, dotSize, dotSize);
        });

        // Draw connecting segments between each consecutive dot with strokeWeight(1).
        stroke(0);
        strokeWeight(1);
        noFill();
        for (let d = 0; d < dots.length - 1; d++) {
            line(dots[d].x, dots[d].y, dots[d + 1].x, dots[d + 1].y);
        }
    }
    pop();
}