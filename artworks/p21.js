/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 14:07
 *
 * Practice 21: Colors - Continuation from Practice 15
 * Code by Jace Yang
 */

// Define a five-color HSL palette
const palette = [
    'hsl(217, 100%, 21%)',
    'hsl(212, 100%, 27%)',
    'hsl(209, 100%, 31%)',
    'hsl(47, 100%, 50%)',
    'hsl(50, 100%, 50%)'
];

let tileStep = 15;

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
 * Iterates over a grid to draw a colored backgorund for each tile,
 * then randomly draws a circle, a square (diagonal pattern), or a triangle within the tile.
 * For each tile, first a random color from the palette is selected as the tile's background.
 * Then, a second, different color is selected to fill the shape.
 */
function drawTilingShapes() {
    push();
    strokeWeight(0.5);

    const gridSize = 320 - 80; 
    const tileCount = gridSize / tileStep;
    const startX = 80;
    const startY = 80;

    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            const x = startX + i * tileStep;
            const y = startY + j * tileStep;
            const cx = x + tileStep / 2;
            const cy = y + tileStep / 2;

            // Select a random background color from the palette for the tile.
            const tileBgColor = palette[Math.floor(Math.random() * palette.length)];
            // Then select a random shape color from the palette,
            // ensuring that it is not the same as the tile background color.
            let shapeColor = palette[Math.floor(Math.random() * palette.length)];
            while (shapeColor === tileBgColor) {
                shapeColor = palette[Math.floor(Math.random() * palette.length)];
            }

            // Draw tile background
            push();
            noStroke();
            fill(tileBgColor);
            rect(x, y, tileStep, tileStep);
            pop();

            // Choose one shape (circle, square, or triangle) to draw within the tile,
            // using the shape color.
            const shapeFuncs = [
                () => drawCircleShape(cx, cy, tileStep * 0.70, shapeColor),
                () => drawSquareShape(cx, cy, shapeColor),
                () => drawTriangleShape(cx, cy, shapeColor)
            ];
            shapeFuncs[Math.floor(Math.random() * shapeFuncs.length)]();
        }
    }
    pop();
}

function drawCircleShape(cx, cy, shapeSize, tileColor) {
    push();
    noStroke();
    fill(tileColor);
    ellipse(cx, cy, shapeSize, shapeSize);
    pop();
}


function drawSquareShape(cx, cy, tileColor) {
    push();
    rectMode(CORNER);
    noStroke();
    fill(tileColor);
    
    const halfTile = tileStep / 2;
    const tileLeft = cx - halfTile;
    const tileTop = cy - halfTile;
    
    if (Math.random() < 0.5) {
        rect(tileLeft, tileTop, halfTile, halfTile);
        rect(cx, cy, halfTile, halfTile);
    } else {
        rect(cx, tileTop, halfTile, halfTile);
        rect(tileLeft, cy, halfTile, halfTile);
    }
    pop();
}


function drawTriangleShape(cx, cy, tileColor) {
    const half = tileStep / 2;
    const corners = [
        { x: cx - half, y: cy - half },
        { x: cx + half, y: cy - half },
        { x: cx + half, y: cy + half },
        { x: cx - half, y: cy + half }
    ];
    
    corners.sort(() => Math.random() - 0.5);
    const [p1, p2, p3] = corners;
    
    push();
    noStroke();
    fill(tileColor);
    triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    pop();
}

