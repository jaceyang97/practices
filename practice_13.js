/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 9:33
 *
 * Practice 13: Repetition - Curved Lines - Part 1
 * Code by Jace Yang
 */

// Configuration parameters.
const config = {
    canvasSize: 400,
    outerSquare: { x: 50, y: 50, size: 300 },
    innerSquare: { x: 80, y: 80, size: 240 },
    numLines: 300,            // Total curves to draw
    amplitude: 40,            // Max vertical deviation for middle points
    numPoints: 7,             // Control points per curve
    endpointVariation: 20,    // Max start/end point vertical variation
    lineAlpha: 30,            // Line transparency (0-255)
    linePerturbation: 4       // Offset variation between consecutive linesprevious line.
};

function setup() {
    createCanvas(config.canvasSize, config.canvasSize);
    drawSquare();
    // drawThinSquare();  // Disabled inner guide line
    drawSplineCurves();
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
    line(config.outerSquare.x, config.outerSquare.y, config.outerSquare.x, config.outerSquare.y + config.outerSquare.size);
    pop();

    push();
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 5;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    stroke(0);
    strokeWeight(5);
    line(config.outerSquare.x, config.outerSquare.y + config.outerSquare.size, config.outerSquare.x + config.outerSquare.size, config.outerSquare.y + config.outerSquare.size);
    pop();

    stroke(0);
    strokeWeight(10);
    noFill();
    rect(config.outerSquare.x, config.outerSquare.y, config.outerSquare.size, config.outerSquare.size);
}

function drawThinSquare() {
    push();
    stroke(0);
    strokeWeight(0.02);
    noFill();
    rect(config.innerSquare.x, config.innerSquare.y, config.innerSquare.size, config.innerSquare.size);
    pop();
}

function drawSplineCurves() {
    // Set pencil-like style.
    stroke(0, config.lineAlpha);
    strokeWeight(1);
    noFill();

    // Set clipping area to inner square
    push();
    drawingContext.beginPath();
    rect(
        config.innerSquare.x,
        config.innerSquare.y,
        config.innerSquare.size,
        config.innerSquare.size
    );
    drawingContext.clip();

    const midY = config.innerSquare.y + config.innerSquare.size / 2;
    const numPoints = config.numPoints;
    const xStep = config.innerSquare.size / (numPoints - 1);
    
    // Pre-calculate all x positions once
    const xPositions = Array.from({length: numPoints}, (_, i) => 
        config.innerSquare.x + xStep * i
    );

    // Offset arrays reused between iterations
    let offsets = new Array(numPoints).fill(0);
    let currentOffsets = new Array(numPoints).fill(0);

    // Pre-calculate endpoint constraints
    const minEndpoint = -config.endpointVariation;
    const maxEndpoint = config.endpointVariation;

    for (let j = 0; j < config.numLines; j++) {
        // Generate new offsets either from scratch or by perturbing previous
        if (j === 0) {
            offsets.forEach((_, i) => {
                offsets[i] = (i === 0 || i === numPoints - 1) 
                    ? Math.random() * (maxEndpoint - minEndpoint) + minEndpoint
                    : Math.random() * config.amplitude * 2 - config.amplitude;
            });
        } else {
            const perturbation = config.linePerturbation;
            offsets.forEach((_, i) => {
                let offset = currentOffsets[i] + (Math.random() * perturbation * 2 - perturbation);
                if (i === 0 || i === numPoints - 1) {
                    offset = Math.max(minEndpoint, Math.min(maxEndpoint, offset));
                }
                offsets[i] = offset;
            });
        }

        // Draw Catmull-Rom spline
        beginShape();
        // First control point (duplicated)
        curveVertex(xPositions[0], midY + offsets[0]);
        // Actual curve points
        xPositions.forEach((x, i) => curveVertex(x, midY + offsets[i]));
        // Last control point (duplicated)
        curveVertex(xPositions.at(-1), midY + offsets.at(-1));
        endShape();

        // Swap arrays instead of creating new ones for slight better performance
        [currentOffsets, offsets] = [offsets, currentOffsets];
    }

    pop();
}