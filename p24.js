/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 14:50
 *
 * Practice 24: Colors - Silky Effects - Screensaver-esque - Continuation from P17
 * Code by Jace Yang
 */

// Configuration
const config = {
    canvasSize: 400,
    outerSquare: { x: 50, y: 50, size: 300 },
    innerSquare: { x: 80, y: 80, size: 240 },
    circles: [
        // #489CB6 converted to HSL: [194, 43, 50]
        { x: 80, y: 120, radius: 35, color: [194, 43, 50] },
        // #8CC4C4 converted to HSL: [180, 32, 66]
        { x: 80, y: 180, radius: 45, color: [180, 32, 66] },
        // #198874 converted to HSL: [169, 69, 32]
        { x: 80, y: 240, radius: 30, color: [169, 69, 32] },
    ],
    numDots: 25,              // Points per shape
    dotPerturbation: 5,       // Initial randomness in placement
    numCurves: 900,           // Iterations per shape
    curvePerturbation: 0.5,   // Radial perturbation per iteration
    curvePerturbationMultiplier: 1.1, // Multiplier for perturbation
    strokeAlpha: 30,          // Transparency (0-255)
    strokeWeight: 1,          // Curve stroke width
    iterationsPerFrame: 5,    // Drawing speed
};

// Drift offsets for each shape
const driftOffsets = [
    { x: 0.3, y: 0.05 },
    { x: 0.35, y: 0.02 },
    { x: 0.25, y: 0.025 }
];

let pointsArrays = []; // Arrays to hold shape points
let currentSet = 0;    // Active shape index
let shapeIteration = 0; // Iteration counter for current shape

function setup() {
    createCanvas(config.canvasSize, config.canvasSize);
    colorMode(HSL, 360, 100, 100, 255);
    
    background(255);
    drawSquare();
    drawThinSquare();
    
    // Initialize points for each circle
    config.circles.forEach(circle => {
        let shapePoints = [];
        for (let i = 0; i < config.numDots; i++) {
            let angle = TWO_PI * i / config.numDots;
            let radialOffset = random(-config.dotPerturbation, config.dotPerturbation);
            let x = circle.x + (circle.radius + radialOffset) * cos(angle);
            let y = circle.y + (circle.radius + radialOffset) * sin(angle);
            shapePoints.push(createVector(x, y));
        }
        pointsArrays.push(shapePoints);
    });
}

function draw() {
    for (let it = 0; it < config.iterationsPerFrame; it++) {
        if (currentSet >= config.circles.length) {
            noLoop();
            return;
        }

        push();
        // Clip to inner square
        drawingContext.beginPath();
        drawingContext.rect(
            config.innerSquare.x,
            config.innerSquare.y,
            config.innerSquare.size,
            config.innerSquare.size
        );
        drawingContext.clip();

        noFill();
        strokeWeight(config.strokeWeight);

        // Draw the current shape curve
        let currentPoints = pointsArrays[currentSet];
        stroke(...config.circles[currentSet].color, config.strokeAlpha);
        beginShape();
        curveVertex(currentPoints[config.numDots - 1].x, currentPoints[config.numDots - 1].y);
        for (let i = 0; i < config.numDots; i++) {
            curveVertex(currentPoints[i].x, currentPoints[i].y);
        }
        curveVertex(currentPoints[0].x, currentPoints[0].y);
        curveVertex(currentPoints[1].x, currentPoints[1].y);
        endShape();

        // Update points with drift and perturbation
        const circle = config.circles[currentSet];
        const drift = driftOffsets[currentSet];
        for (let i = 0; i < config.numDots; i++) {
            let dx = currentPoints[i].x - circle.x;
            let dy = currentPoints[i].y - circle.y;
            let mag = sqrt(dx * dx + dy * dy) || 1;
            let ux = dx / mag;
            let uy = dy / mag;
            let radialOffset = random(
                -config.curvePerturbation * config.curvePerturbationMultiplier,
                config.curvePerturbation * config.curvePerturbationMultiplier
            );
            currentPoints[i].x += ux * radialOffset + drift.x;
            currentPoints[i].y += uy * radialOffset + drift.y;
        }
        pop();

        shapeIteration++;
        if (shapeIteration >= config.numCurves) {
            currentSet++;
            shapeIteration = 0;
        }
    }
}

function drawSquare() {
    push();
    drawingContext.shadowOffsetX = -5;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    stroke(0);
    strokeWeight(5);
    line(
        config.outerSquare.x, 
        config.outerSquare.y, 
        config.outerSquare.x, 
        config.outerSquare.y + config.outerSquare.size
    );
    pop();
    
    push();
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 5;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    stroke(0);
    strokeWeight(5);
    line(
        config.outerSquare.x, 
        config.outerSquare.y + config.outerSquare.size, 
        config.outerSquare.x + config.outerSquare.size, 
        config.outerSquare.y + config.outerSquare.size
    );
    pop();
    
    stroke(0);
    strokeWeight(10);
    noFill();
    rect(
        config.outerSquare.x, 
        config.outerSquare.y, 
        config.outerSquare.size, 
        config.outerSquare.size
    );
}

function drawThinSquare() {
    push();
    stroke(0);
    strokeWeight(0.02);
    fill(0);
    rect(
        config.innerSquare.x, 
        config.innerSquare.y, 
        config.innerSquare.size, 
        config.innerSquare.size
    );
    pop();
}