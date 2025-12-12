/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 14:22
 *
 * Practice 22: Colors - Pipes - Part 1
 * Code by Jace Yang (modified for dynamic twisting)
 */

const NUM_LINES = 20; // Control the number of lines
const COLORS = [
    'hsl(207, 54%, 35%)',
    'hsl(344, 85%, 61%)',
    'hsl(42, 100%, 68%)',
    'hsl(164, 95%, 40%)',
    'hsl(30, 100%, 50%)'
];
const NUM_ITERATIONS = 16; // Control the number of twists
const NO_SWAP_PROBABILITY = 0.6; // Control the probability of straight segments

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
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
    const startY = 80;
    const endY = 320;
    const totalHeight = endY - startY;
    const spacing = 240 / (NUM_LINES - 1);
    const MOVE_DISTANCE = totalHeight / NUM_ITERATIONS;

    push();
    drawingContext.lineJoin = 'round';
    strokeWeight(3);
    
    // 1. Initialize position history with original indices
    let positionHistory = [Array.from({length: NUM_LINES}, (_, i) => i)];
    
    // 2. Precompute position swaps for all iterations
    for(let iter = 0; iter < NUM_ITERATIONS; iter++) {
        const newPositions = [...positionHistory[iter]];
        let i = 0;
        
        // Pairwise swapping with probability check
        while(i < NUM_LINES) {
            if(random() < NO_SWAP_PROBABILITY || i === NUM_LINES - 1) {
                i++; // No swap
            } else {
                [newPositions[i], newPositions[i + 1]] = [newPositions[i + 1], newPositions[i]];
                i += 2; // Skip swapped pair
            }
        }
        positionHistory.push(newPositions);
    }

    // 3. Draw continuous bezier curves for each original line
    for(let originalIdx = 0; originalIdx < NUM_LINES; originalIdx++) {
        beginShape();
        stroke(COLORS[originalIdx % COLORS.length]);
        
        for(let iter = 0; iter <= NUM_ITERATIONS; iter++) {
            const pos = positionHistory[iter].indexOf(originalIdx);
            const x = 80 + (pos * spacing);
            const y = startY + (iter * MOVE_DISTANCE);
            
            // Create smooth bezier curves between positions
            iter === 0 ? vertex(x, y) : bezierVertex(
                prevX, prevY + (MOVE_DISTANCE * 0.3), // Control point 1
                x, y - (MOVE_DISTANCE * 0.3),         // Control point 2
                x, y                                  // Current position
            );
            
            // Store previous position for next iteration
            [prevX, prevY] = [x, y];
        }
        endShape();
    }
    pop();
}