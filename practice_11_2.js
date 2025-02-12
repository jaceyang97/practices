/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 9:38
 *
 * Practice 11: Repetition - Curved Lines - Part 2 - Continuation of Practice 9
 * Code by Jace Yang
 */

const config = {
    canvasSize: 400,
    outerSquare: { x: 50, y: 50, size: 300 },
    innerSquare: { x: 80, y: 80, size: 240 },
    numLines: 40,
    xStep: 6,
    noise: {
        scale: 0.05,
        amplitude: 40,
        variationOffset: 0.1
    },
    displacement: {
        exponentX: 1,
        exponentY: 1
    },
    line: {
        variations: 10,
        baseAlpha: 100,
        variationAlpha: 100,
        positionJitter: 0.5
    }
};

function setup() {
    createCanvas(config.canvasSize, config.canvasSize);
    drawSquare();
    drawThinSquare();
    drawSmoothCurves();
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

/* Change in this function:
 * - Displacement (P10): normX/Y exponents shape curve profile
 * - Variations (P11_1): Layered lines with jitter + coordinated noise
 */

function drawSmoothCurves() {
    const {x: xStart, y: yStart, size} = config.innerSquare;
    const spacing = config.innerSquare.size / (config.numLines + 1);
    
    noFill();
    strokeWeight(1);

    for (let lineIdx = 1; lineIdx <= config.numLines; lineIdx++) {
        const baseY = yStart + spacing * lineIdx;
        const noiseSeed = lineIdx * 1000;  // Distinct pattern per line

        for (let variation = 0; variation < config.line.variations; variation++) {
            stroke(0, variation === 0 ? config.line.baseAlpha : config.line.variationAlpha);
            const y = baseY + random(-config.line.positionJitter, config.line.positionJitter);
            
            beginShape();
            for (let x = xStart; x <= xStart + size; x += config.xStep) {
                const normX = (x - xStart) / size;
                const normY = (y - yStart) / size;
                const displacement = Math.pow(normX, config.displacement.exponentX) * 
                                   Math.pow(normY, config.displacement.exponentY);
                
                const noiseVal = noise(
                    x * config.noise.scale,
                    y * config.noise.scale + noiseSeed + (variation * config.noise.variationOffset)
                );
                
                const verticalOffset = map(noiseVal, 0, 1, -1, 1) * 
                                    config.noise.amplitude * 
                                    displacement;
                
                curveVertex(x, y + verticalOffset);
            }
            endShape();
        }
    }
}