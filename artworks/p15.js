/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 10:14
 *
 * Practice 15: Shapes - Tiling
 * Code by Jace Yang
 */
let tileStep = 20; // Decrease to have a "noise" effect

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    drawTilingShapes();
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

/*
 * Iterates over a grid to randomly draw a circle, a square (diagonal pattern), or a triangle.
 */
function drawTilingShapes() {
    push();
    noFill();
    stroke(0);
    strokeWeight(0.5);
    
    const gridSize = 320 - 80; // Inner square dimensions
    const tileCount = gridSize / tileStep;
    const startX = 80;
    const startY = 80;
    
    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            const x = startX + i * tileStep;
            const y = startY + j * tileStep;
            const cx = x + tileStep / 2;
            const cy = y + tileStep / 2;
            const r = Math.random();
            const shapeFuncs = [
                () => drawCircleShape(cx, cy, tileStep * 0.70),
                () => drawSquareShape(cx, cy),
                () => drawTriangleShape(cx, cy)
            ];
            shapeFuncs[Math.floor(Math.random() * shapeFuncs.length)](); // Generates a random index to call the function
        }
    }
    pop();
}

/*
 * Draws a circle shape.
 */
function drawCircleShape(cx, cy, shapeSize) {
    push();
    fill(0);
    ellipse(cx, cy, shapeSize, shapeSize);
    pop();
}

/*
 * Divide the tile into 4 squares and randomly fill a diagonal pair.
 */
function drawSquareShape(cx, cy) {
    push();
    rectMode(CORNER);
    noStroke();
    fill(0);
    
    const halfTile = tileStep / 2;
    const tileLeft = cx - halfTile;
    const tileTop = cy - halfTile;
    
    if (Math.random() < 0.5) {
        rect(tileLeft, tileTop, halfTile, halfTile); // Top-left
        rect(cx, cy, halfTile, halfTile);            // Bottom-right
    } else {
        rect(cx, tileTop, halfTile, halfTile);       // Top-right
        rect(tileLeft, cy, halfTile, halfTile);        // Bottom-left
    }
    pop();
}

/*
 * Use full tile corners and randomly pick three to form a triangle.
 */
function drawTriangleShape(cx, cy) {
    const half = tileStep / 2;
    const corners = [
        { x: cx - half, y: cy - half },
        { x: cx + half, y: cy - half },
        { x: cx + half, y: cy + half },
        { x: cx - half, y: cy + half }
    ];
    
    // Shuffle and select three corners
    corners.sort(() => Math.random() - 0.5);
    const [p1, p2, p3] = corners;
    
    push();
    noStroke();
    fill(0);
    triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    pop();
}

