/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 8:38
 *
 * Practice 8: Curves - Displacement (Update to Practice 6: Displacement - Part 1)
 * Code by Jace Yang
 */

// Global configuration parameter
const canvasSize = 400;
const outerSquare = { x: 50, y: 50, size: 300 };
const innerSquare = { x: 80, y: 80, size: 240 };
const numLines = 40; // Number of curves (lines) to draw.
const noiseAmplitude = 30; // Maximum vertical displacement via noise.
const displacementConfig = { 
    exponentX: 1, // Horizontal displacement weighting.
    exponentY: 1    // Vertical displacement weighting.
};
const noiseScale = 0.1; // Perlin noise smoothness (lower values yield smoother noise).
const xStep = 8; // Distance between sampled points along each curve.

function setup() {
    createCanvas(canvasSize, canvasSize);
    drawSquare();
    drawThinSquare();
    drawSmoothCurves();
}

function drawSquare() {
    background(255);

    // Left vertical shadowed line
    push();
    drawingContext.shadowOffsetX = -5;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    stroke(0);
    strokeWeight(5);
    line(outerSquare.x, outerSquare.y, outerSquare.x, outerSquare.y + outerSquare.size);
    pop();

    // Bottom horizontal shadowed line
    push();
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 5;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
    stroke(0);
    strokeWeight(5);
    line(outerSquare.x, outerSquare.y + outerSquare.size, outerSquare.x + outerSquare.size, outerSquare.y + outerSquare.size);
    pop();

    // Outer square border
    stroke(0);
    strokeWeight(10);
    noFill();
    rect(outerSquare.x, outerSquare.y, outerSquare.size, outerSquare.size);
}

function drawThinSquare() {
    push();
    stroke(0);
    strokeWeight(0.02);
    noFill();
    rect(innerSquare.x, innerSquare.y, innerSquare.size, innerSquare.size);
    pop();
}

// Draws smooth curves using Perlin noise for vertical displacement.
function drawSmoothCurves() {
    
    const xStart = innerSquare.x;
    const yStart = innerSquare.y;
    const size = innerSquare.size;
    const spacing = size / (numLines + 1);
    
    stroke(0);
    strokeWeight(1);
    noFill();

    // Draw each curve with noise-based displacement.
    for (let i = 1; i <= numLines; i++) {
        const y = yStart + spacing * i;
        // Using 'i' as the noise offset, so adjacent lines have similar noise values.
        // Multiply if you need more variation.
        const lineNoiseOffset = i;
        beginShape();
        for (let x = xStart; x <= xStart + size; x += xStep) {
            const normX = (x - xStart) / size;
            const normY = (y - yStart) / size;
            // Weight the displacement based on x and y position using the parameters from displacementConfig.
            const displacementFactor = Math.pow(normX, displacementConfig.exponentX) * Math.pow(normY, displacementConfig.exponentY);
            // Use noiseScale for smooth noise variation instead of scale.
            const noiseVal = noise(x * noiseScale, y * noiseScale + lineNoiseOffset);
            // Map noise output from [0, 1] to [-1, 1] for symmetry.
            const noiseMapped = map(noiseVal, 0, 1, -1, 1);
            const verticalOffset = noiseMapped * noiseAmplitude * displacementFactor;
            curveVertex(x, y + verticalOffset);
        }
        endShape();
    }
}