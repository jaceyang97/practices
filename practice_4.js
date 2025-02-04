/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 5:44
 *
 * Practice 4: Tiling - Diagonal
 * Code by Jace Yang
 */

let tileStep = 10; // Adjust this value to change pattern density (controls X/Y length)

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    drawTilingLines();
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
    
    // Pre-calculate grid dimensions
    const gridSize = 320 - 80;
    const tileCount = gridSize / tileStep;
    
    // Pre-generate all random decisions first
    const directions = Array.from({length: tileCount}, () => 
        Array.from({length: tileCount}, () => Math.random() >= 0.5)
    );
    
    // Batch calculations
    const startX = 80;
    const startY = 80;
    const stepPlus = tileStep;
    
    for(let i = 0; i < tileCount; i++) {
        for(let j = 0; j < tileCount; j++) {
            const x = startX + i * stepPlus;
            const y = startY + j * stepPlus;
            
            directions[i][j] 
                ? line(x, y, x + stepPlus, y + stepPlus)
                : line(x + stepPlus, y, x, y + stepPlus);
        }
    }
    pop();
}

