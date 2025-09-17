/**
 * Practice 35: Google's Calico Logo
 * Reference image: https://commons.wikimedia.org/wiki/File:Calico_Logo.png
 * 
 * Code by Jace Yang
 * 
 * Comments:
 * Had a delightful time puzzling out Jane Street's logo (p31.js), and Calico's looks similar.
 * No doubt there are other company logos out there that use similar concentric circle patterns.
 * The change is simple: add a 4th outer circle, adjust the gap position, and change the gap size.
 */

function setup() {
    // Create regular canvas
    createCanvas(450, 450);
    background(255);
    
    // Common settings
    noFill();
    stroke('#2A9F4A');
    strokeWeight(25);
    
    // Configuration
    let gap = 50;             // Distance between circle layers
    let gapSize = 30;         // Size of the gap in pixels
    
    // Position everything from center
    translate(width / 2, height / 2);
    
    // Draw four concentric circles with gaps at different positions
    drawCircleWithGap(0, 0, gap, 0, PI * gap / 2.25);  // 1st circle with medium gap
    drawCircleWithGap(0, 0, gap * 2, PI/3, gapSize);
    drawCircleWithGap(0, 0, gap * 3, 11*PI/6, gapSize * 1.5);
    drawCircleWithGap(0, 0, gap * 4, 4*PI/3, gapSize * 2);
    
}

function drawCircleWithGap(x, y, radius, gapPosition, gapSizePixels) {
    push();
    translate(x, y);
    
    // Calculate gap angle using inverse sine to maintain constant physical gap size
    let gapAngle = 2 * Math.asin(gapSizePixels / (2 * radius));
    
    // Set line cap to square for flat ends at the gap
    strokeCap(SQUARE);
    
    // Draw almost complete circle with a constant-sized gap
    arc(0, 0, radius * 2, radius * 2, gapPosition + gapAngle/2, gapPosition - gapAngle/2 + TWO_PI);
    
    pop();
}

