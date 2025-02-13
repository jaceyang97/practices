/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 10:14
 *
 * Practice 15: Shapes - Tiling
 * Code by Jace Yang
 */

let tileStep = 20;

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

/**
 * drawTilingShapes() iterates over a grid (defined by tileStep and starting coordinates)
 * and randomly picks a shape (circle, square, or triangle) for each tile.
 * The actual drawing for each shape is handled by separate functions:
 * drawCircleShape, drawSquareShape, and drawTriangleShape.
 */
function drawTilingShapes() {
    push();
    noFill();
    stroke(0);
    strokeWeight(0.5);
    
    // Pre-calculate grid dimensions
    const gridSize = 320 - 80;
    const tileCount = gridSize / tileStep;
    
    const startX = 80;
    const startY = 80;
    const stepPlus = tileStep;
    
    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            // Calculate the top left corner of the current tile
            const x = startX + i * stepPlus;
            const y = startY + j * stepPlus;
            
            // Find the center of the tile
            const cx = x + stepPlus / 2;
            const cy = y + stepPlus / 2;
            
            // Randomly choose a shape type and call the corresponding function
            const r = Math.random();
            if (r < 1 / 3) {
                drawCircleShape(cx, cy, stepPlus * 0.70);
            } else if (r < 2 / 3) {
                drawSquareShape(cx, cy);
            } else {
                drawTriangleShape(cx, cy);
            }
        }
    }
    pop();
}


function drawCircleShape(cx, cy, shapeSize) {
    push();
    fill(0);
    ellipse(cx, cy, shapeSize, shapeSize);
    pop();
}

function drawSquareShape(cx, cy) {
    push();
    // Use CORNER mode so that rect() starts drawing at the top left corner of each small square.
    rectMode(CORNER);
    noStroke();
    fill(0);

    // Each tile has a side length of tileStep.
    // The tile's top-left corner is computed using the tile's center (cx, cy):
    const halfTile = tileStep / 2;
    const tileLeft = cx - halfTile;
    const tileTop = cy - halfTile;

    // The tile can be divided into 4 squares of size (tileStep/2) each.
    // There are two diagonal pairs:
    // Diagonal 1: Top-left and Bottom-right squares.
    // Diagonal 2: Top-right and Bottom-left squares.
    if (Math.random() < 0.5) {
        // Fill Diagonal pair 1: Top-left & Bottom-right.
        rect(tileLeft, tileTop, halfTile, halfTile); // Top-left square.
        rect(cx, cy, halfTile, halfTile);            // Bottom-right square.
    } else {
        // Fill Diagonal pair 2: Top-right & Bottom-left.
        rect(cx, tileTop, halfTile, halfTile);       // Top-right square.
        rect(tileLeft, cy, halfTile, halfTile);        // Bottom-left square.
    }
    pop();
}

function drawTriangleShape(cx, cy) {
    // Use full tile (grid cell) corners based on the global tileStep.
    // Since cx,cy is the center of the tile, the tile corners are:
    // Top-left: (cx - tileStep/2, cy - tileStep/2)
    // Top-right: (cx + tileStep/2, cy - tileStep/2)
    // Bottom-right: (cx + tileStep/2, cy + tileStep/2)
    // Bottom-left: (cx - tileStep/2, cy + tileStep/2)
    const half = tileStep / 2;
    const corners = [
        { x: cx - half, y: cy - half },  // Top-left
        { x: cx + half, y: cy - half },  // Top-right
        { x: cx + half, y: cy + half },  // Bottom-right
        { x: cx - half, y: cy + half }   // Bottom-left
    ];
    
    // Shuffle the corners array to get a random order
    corners.sort(() => Math.random() - 0.5);
    
    // Select three corners for the triangle
    const p1 = corners[0];
    const p2 = corners[1];
    const p3 = corners[2];
    
    push();
    noStroke();
    fill(0);
    triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    pop();
}

