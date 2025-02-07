/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 8:28
 *
 * Practice 8: Tiling - Curves
 * Code by Jace Yang
 */

let tileStep = 15; // Adjust this value to change pattern density (controls X/Y length)


function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    drawTilingLines(); // Now draws two arcs per cell
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

function drawTilingLines() {
    push();
    stroke(0);
    strokeWeight(0.5);
    noFill();
    
    const gridSize = 320 - 80;
    const tileCount = gridSize / tileStep;
    
    // If true, draw arcs in the top-left & bottom-right corners.
    // Otherwise, draw arcs in the top-right & bottom-left corners.
    const directions = Array.from({ length: tileCount }, () =>
        Array.from({ length: tileCount }, () => Math.random() >= 0.5)
    );
    
    const startX = 80;
    const startY = 80;
    
    // For each tile, we draw two quarter arcs.
    // The arc's full circle would have a diameter equal to tileStep (radius = tileStep/2).
    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            const tileX = startX + i * tileStep;
            const tileY = startY + j * tileStep;
            
            if (directions[i][j]) {
                // Option 1: draw arcs in the top-left and bottom-right corners.
                // Top-left arc: center at the tile's top-left (tileX, tileY).
                //   Draw the quarter that goes toward the cell's interior (to the right and down).
                arc(tileX, tileY, tileStep, tileStep, 0, HALF_PI);
                
                // Bottom-right arc: center at (tileX+tileStep, tileY+tileStep).
                //   Draw the quarter that goes toward the cell's interior (to the left and up).
                arc(tileX + tileStep, tileY + tileStep, tileStep, tileStep, PI, PI + HALF_PI);
            } else {
                // Option 2: draw arcs in the top-right and bottom-left corners.
                // Top-right arc: center at (tileX+tileStep, tileY).
                //   Draw the quarter that goes toward the cell's interior (down and left).
                arc(tileX + tileStep, tileY, tileStep, tileStep, HALF_PI, PI);
                
                // Bottom-left arc: center at (tileX, tileY+tileStep).
                //   Draw the quarter that goes toward the cell's interior (up and right).
                arc(tileX, tileY + tileStep, tileStep, tileStep, 3 * HALF_PI, TWO_PI);
            }
        }
    }
    pop();
}

