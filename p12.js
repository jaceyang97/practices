/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 8:48
 *
 * Practice 12: Displacement - Joy Division Logo
 * Code by Jace Yang
 */

// Core configuration
const canvasSize = 400;
const outerSquare = { x: 50, y: 50, size: 300 };
const innerSquare = { x: 80, y: 80, size: 240 };
const numLines = 19; // Number of curves (lines) to draw.
const noiseAmplitude = 50; // Maximum vertical displacement via noise.

// Curve control parameters
const curveAdjustmentConfig = {
    centerExponent: 2.5  // Higher values = narrower/more intense center peaks
};

const noiseScale = 0.1; // Perlin noise smoothness (lower values yield smoother noise).
const xStep = 10; // Distance between sampled points along each curve.

function setup() {
    createCanvas(canvasSize, canvasSize);
    drawSquare();
    drawThinSquare();
    drawSmoothCurves();
}

function drawSquare() {
    background(255);

    // Shadowed vertical element
    push();
    drawingContext.shadowOffsetX = -5;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    strokeWeight(5);
    line(outerSquare.x, outerSquare.y, outerSquare.x, outerSquare.y + outerSquare.size);
    pop();

    // Shadowed horizontal element
    push();
    drawingContext.shadowOffsetY = 5;
    strokeWeight(5);
    line(outerSquare.x, outerSquare.y + outerSquare.size, 
         outerSquare.x + outerSquare.size, outerSquare.y + outerSquare.size);
    pop();

    // Main border structure
    strokeWeight(10);
    rect(outerSquare.x, outerSquare.y, outerSquare.size, outerSquare.size);
}

function drawThinSquare() {
    push();
    fill(0);
    rect(innerSquare.x, innerSquare.y, innerSquare.size, innerSquare.size);
    pop();
}

function drawSmoothCurves() {
    const {x, y, size} = innerSquare;
    const spacing = size / (numLines + 1);
    
    // Clip drawing operations to inner square bounds
    drawingContext.save();
    drawingContext.rect(x, y, size, size);
    drawingContext.clip();

    noStroke();
    fill(0);

    for (let i = 1; i <= numLines; i++) {
        if (i <= 2) continue; // Skip first 2 lines to create top margin
        const currentY = y + spacing * i;
        let pathPoints = []; // Stores curve points for white overlay
        
        beginShape();
        for (let px = x; px <= x + size; px += xStep) {
            // Normalized horizontal position (0-1 across inner square)
            const t = (px - x) / size;
            
            // Amplitude envelope - creates center-biased displacement
            // sine^N creates narrower peaks with higher exponents
            const amplitude = pow(sin(PI * t), curveAdjustmentConfig.centerExponent);
            
            // 2D noise sampling (position + line index offset)
            const noiseVal = noise(px * noiseScale, currentY * noiseScale + i);
            
            // Map noise to displacement range and apply amplitude envelope
            // Negative offset only (upward curves)
            let offset = map(noiseVal, 0, 1, -1, 1) * noiseAmplitude * amplitude;
            offset = offset > 0 ? 0 : offset; // Unidirectional displacement
            
            // Clamp Y position to inner square top boundary
            const curveY = Math.max(currentY + offset, y);
            
            pathPoints.push({x: px, y: curveY});
            curveVertex(px, curveY);
        }
        // Close shape to bottom of inner square
        vertex(x + size, y + size); // Lower-right
        vertex(x, y + size);       // Lower-left
        endShape(CLOSE);

        // Draw anti-aliased white highlight on curve ridge
        push();
        stroke(255);
        strokeWeight(1);
        beginShape();
        pathPoints.forEach(pt => curveVertex(pt.x, pt.y));
        endShape();
        pop();
    }
    drawingContext.restore(); // Remove clipping mask
}