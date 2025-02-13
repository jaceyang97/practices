/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 10:45
 *
 * Practice 16: Shapes - Rotated & Displaced
 * Code by Jace Yang
 */

// Config parameters
const config = {
    tileStep: 15,
    rotationCurve: 1.2, // 1 is linear
    displacementCurve: 1.2, // 1 is linear
    // Maximum rotation angle (in radians) a square can reach at the bottom of the grid.
    // Using Math.PI here to ensure the value is available before p5 constants.
    maxRotationAngle: Math.PI / 12
};

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    drawGrid();
}

function drawSquare() {
    background(255);

    push();
    // Left shadow line
    drawingContext.shadowOffsetX = -5;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    stroke(0);
    strokeWeight(5);
    line(50, 50, 50, 350);
    pop();

    push();
    // Bottom shadow line
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

/*
 * Draws the grid inside the inner thin square using individual squares.
 * Applies random rotation and horizontal displacement (which appear more toward the bottom)
 * with the maximum rotation controlled via config.maxRotationAngle.
 */
function drawGrid() {
    push();
    noFill();
    stroke(0);
    strokeWeight(0.5);
    
    const gridSize = 240; // Dimensions of the inner thin square
    const tileCount = gridSize / config.tileStep;
    const startX = 80;
    const startY = 80;
    
    // Loop from 1 to tileCount - 2 to skip the outer border squares.
    for (let i = 1; i < tileCount - 1; i++) {
        for (let j = 1; j < tileCount - 1; j++) {
            // Normalize the vertical position (t) from 0 (top) to 1 (bottom)
            let t = map(j, 1, tileCount - 2, 0, 1);
            
            // Apply configurable curves (exponents) to control how the effects increase
            let tRot = pow(t, config.rotationCurve);
            let tDisp = pow(t, config.displacementCurve);
            
            // Compute maximum rotation using the configurable maxRotationAngle
            let maxRot = tRot * config.maxRotationAngle;
            let angle = random(-maxRot, maxRot);
            
            // Compute maximum horizontal displacement
            let maxHorizOffset = tDisp * (config.tileStep / 2);
            let xOffset = random(-maxHorizOffset, maxHorizOffset);
            
            push();
            // Translate to the tile's center with additional horizontal offset
            translate(startX + i * config.tileStep + config.tileStep / 2 + xOffset, startY + j * config.tileStep + config.tileStep / 2);
            rotate(angle);
            // Draw the tile so that its center is at (0, 0)
            rect(-config.tileStep / 2, -config.tileStep / 2, config.tileStep, config.tileStep);
            pop();
        }
    }
    pop();
}