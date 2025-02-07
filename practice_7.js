/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Source: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference Timer: 7:43
 *
 * Practice 7: Curve - Bezier
 * Code by Jace Yang
 */

function setup() {
    createCanvas(400, 400);
    drawSquare();
    drawThinSquare();
    drawFourDots();
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

function drawFourDots() {
    push();
    
    // Draw the connecting lines first (so dots appear on top)
    stroke(0);
    strokeWeight(1);
    // Line from dot 1 to 2
    line(100, 100, 100, 180);
    // Line from dot 2 to 3
    line(100, 180, 200, 180);
    // Line from dot 3 to 4
    line(200, 180, 200, 280);
    
    // Draw the dots
    fill(0);
    noStroke();
    let dotSize = 5;

    // Dot 1: Near top-left corner
    ellipse(100, 100, dotSize);
    
    // Dot 2: Below dot 1
    ellipse(100, 180, dotSize);
    
    // Dot 3: Right of dot 2
    ellipse(200, 180, dotSize);
    
    // Dot 4: Below dot 3
    ellipse(200, 280, dotSize);
    
    pop();
}