/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 8:48
 *
 * Practice 10: Displacement - Joy Division Logo
 * Code by Jace Yang
 */

// Global configuration parameter
const canvasSize = 400;
const outerSquare = { x: 50, y: 50, size: 300 };
const innerSquare = { x: 80, y: 80, size: 240 };
const numLines = 17; // Number of curves (lines) to draw.
const noiseAmplitude = 80; // Maximum vertical displacement via noise.

// Simplified adjustment config
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
    // Fill the inner square with black.
    noStroke();
    fill(0);
    rect(innerSquare.x, innerSquare.y, innerSquare.size, innerSquare.size);
    pop();
}

// Draws smooth curves using Perlin noise for vertical displacement.
// Each curve's displacement is adjusted so that the middle section is more pronounced.
// We achieve this by computing an amplitude factor using a raised sine function.
function drawSmoothCurves() {
    const xStart = innerSquare.x;
    const yStart = innerSquare.y;
    const size = innerSquare.size;
    const spacing = size / (numLines + 1);
    
    // Set stroke to white for the curves.
    stroke(255);
    strokeWeight(1);
    noFill();

    // Draw each curve with noise-based displacement.
    for (let i = 1; i <= numLines; i++) {
        const y = yStart + spacing * i;
        const lineNoiseOffset = i;
        beginShape();
        for (let x = xStart; x <= xStart + size; x += xStep) {
            // Calculate normalized x position
            const normX = (x - xStart) / size;
            
            // Create a bell-curve shaped amplitude factor
            const amplitudeFactor = pow(sin(PI * normX), curveAdjustmentConfig.centerExponent);
            
            const noiseVal = noise(x * noiseScale, y * noiseScale + lineNoiseOffset);
            const noiseMapped = map(noiseVal, 0, 1, -1, 1);
            let verticalOffset = noiseMapped * noiseAmplitude * amplitudeFactor;
            
            // Ensure that the displacement is only upward.
            // If verticalOffset is positive it would displace downward, so set it to 0.
            if (verticalOffset > 0) verticalOffset = 0;
            
            curveVertex(x, y + verticalOffset);
        }
        endShape();
    }
}