/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 11:07
 *
 * Practice 17: Shapes - Repitition (Animated)
 * Code by Jace Yang
 */

// Configuration parameters
const config = {
    canvasSize: 400,
    // Outer and inner squares (guides)
    outerSquare: { x: 50, y: 50, size: 300 },
    innerSquare: { x: 80, y: 80, size: 240 },
    // Circle parameters and curve drawing
    circle: {
        x: 200,
        y: 200,
        radius: 90
    },
    numDots: 15,               // Number of dots to place along the circle
    dotPerturbation: 20,       // Maximum initial radial displacement for each dot (in pixels)
    numCurves: 200,            // How many curve iterations to draw
    curvePerturbation: 2,    // Base amount to nudge each dot per frame (in pixels)
    curvePerturbationMultiplier: 2.0,  // Multiplier to amplify dot movement per frame
    strokeAlpha: 30,           // Stroke transparency for curves (0-255)
    strokeWeight: 1,           // Stroke weight for curves
};

let points = [];
let iteration = 0;

function setup() {
    createCanvas(config.canvasSize, config.canvasSize);
    // Draw the guide squares and background.
    drawSquare();
    drawThinSquare();
    
    // Initialize dots with a natural random radial offset.
    for (let i = 0; i < config.numDots; i++) {
        let angle = TWO_PI * i / config.numDots;
        let radialOffset = random(-config.dotPerturbation, config.dotPerturbation);
        let x = config.circle.x + (config.circle.radius + radialOffset) * cos(angle);
        let y = config.circle.y + (config.circle.radius + radialOffset) * sin(angle);
        points.push(createVector(x, y));
    }
}

function draw() {
    if (iteration < config.numCurves) {
        push();
        // Clip drawing to inner square.
        drawingContext.beginPath();
        drawingContext.rect(config.innerSquare.x, config.innerSquare.y, config.innerSquare.size, config.innerSquare.size);
        drawingContext.clip();
        
        noFill();
        stroke(0, config.strokeAlpha);
        strokeWeight(config.strokeWeight);
        
        // Draw the evolving closed curve using curveVertex().
        // For a closed Catmull-Rom curve, we add extra points (duplicate the end/start points).
        beginShape();
        // For a closed Catmull-Rom curve, duplicate the last point at the start.
        curveVertex(points[config.numDots - 1].x, points[config.numDots - 1].y);
        for (let i = 0; i < config.numDots; i++) {
            curveVertex(points[i].x, points[i].y);
        }
        // Duplicate the first point and optionally the second for a smooth closure.
        curveVertex(points[0].x, points[0].y);
        curveVertex(points[1].x, points[1].y);
        endShape();
        
        // Update each dot radially.
        for (let i = 0; i < config.numDots; i++) {
            let dx = points[i].x - config.circle.x;
            let dy = points[i].y - config.circle.y;
            let mag = sqrt(dx * dx + dy * dy) || 1;
            let ux = dx / mag;
            let uy = dy / mag;
            
            let radialOffset = random(
                -config.curvePerturbation * config.curvePerturbationMultiplier,
                config.curvePerturbation * config.curvePerturbationMultiplier
            );
            points[i].x += ux * radialOffset;
            points[i].y += uy * radialOffset;
        }
        pop(); // End clipping
        iteration++;
    } else {
        noLoop();
    }
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