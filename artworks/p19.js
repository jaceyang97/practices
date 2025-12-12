/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 12:23
 *
 * Practice 19: Recursion - Part 2 - Triangle with Displacement
 * Unfinished, need to add layers that displace a little bit each time
 * Code by Jace Yang
 */

const CONFIG = {
    shadow: {
      offsetX: -5,
      offsetY: 5,
      blur: 10,
      color: 'rgba(0, 0, 0, 0.5)'
    },
    strokeWeights: {
      main: 10,
      shadow: 5,
      thin: 0.25
    },
    gridStart: 80,         // Starting position for tiling grid
    gridSize: 240,         // Size of the tiling grid area
    recursion: {
      steps: 3,            // Number of recursion steps to subdivide the triangle
      stroke: 'black',     // Stroke color for recursive triangles
      strokeWeight: 0.5,    // Stroke weight setting for the recursive triangles
      displacement: 8       // Add displacement range (in pixels)
    }
  };
  
function setup() {
    createCanvas(400, 400);
    drawBaseComposition();
    drawRecursiveTriangles();
}
  
function drawBaseComposition() {
    background(255);
    drawShadowedFrame();
    drawThinSquare();
}

function drawShadowedFrame() {
    drawShadowedLine(50, 50, 50, 350, CONFIG.shadow.offsetX, 0);
    drawShadowedLine(50, 350, 350, 350, 0, CONFIG.shadow.offsetY);
    strokeWeight(CONFIG.strokeWeights.main);
    rect(50, 50, 300, 300);
}
  
function drawShadowedLine(x1, y1, x2, y2, offsetX, offsetY) {
    push();
    drawingContext.shadowOffsetX = offsetX;
    drawingContext.shadowOffsetY = offsetY;
    drawingContext.shadowBlur = CONFIG.shadow.blur;
    drawingContext.shadowColor = CONFIG.shadow.color;
    strokeWeight(CONFIG.strokeWeights.shadow);
    line(x1, y1, x2, y2);
    pop();
}

function drawThinSquare() {
    push();
    strokeWeight(CONFIG.strokeWeights.thin);
    rect(80, 80, 240, 240);
    pop();
}

/* 
  Recursive Equilateral Triangle Drawing
  -----------------------------------------
  The following functions create a fractal-like structure.
  
  drawRecursiveTriangles() initializes the process by defining a large equilateral
  triangle. The triangle is defined with its base from (50,350) to (350,350) and its top
  vertex computed using the equilateral triangle height formula: height = (sqrt(3)/2)*side.
  
  recursiveTriangles() draws the current triangle and, if the recursion depth is still above 0,
  divides the current triangle into four smaller equilateral triangles by computing the midpoints
  on each side.
  
  The helper function midpoint() returns the midpoint between two points.
*/

function drawRecursiveTriangles() {
    push();
    noFill();
    stroke(CONFIG.recursion.stroke);
    strokeWeight(CONFIG.recursion.strokeWeight);
    
    const side = 200; // Increased side length for bigger triangle
    const height = (Math.sqrt(3) / 2) * side;
    const center = { x: width/2, y: height/2 + 100 }; // Center aligned with grid
    
    // Calculate initial vertices based on center and side length
    const A = { x: center.x, y: center.y - height/2 };          // Top vertex
    const B = { x: center.x - side/2, y: center.y + height/2 }; // Bottom left
    const C = { x: center.x + side/2, y: center.y + height/2 }; // Bottom right
    
    recursiveTriangles(A, B, C, CONFIG.recursion.steps);
    pop();
}

// recursiveTriangles() draws an equilateral triangle and subdivides it further if needed.
function recursiveTriangles(A, B, C, depth) {
    if (depth === 0) {
        triangle(A.x, A.y, B.x, B.y, C.x, C.y);
        return;
    }

    const jitter = () => random(-CONFIG.recursion.displacement, CONFIG.recursion.displacement);
    
    // Jitter original corners first
    const A_jitter = { x: A.x + jitter(), y: A.y + jitter() };
    const B_jitter = { x: B.x + jitter(), y: B.y + jitter() };
    const C_jitter = { x: C.x + jitter(), y: C.y + jitter() };

    // Calculate midpoints FROM JITTERED VERTICES (but don't jitter midpoints themselves)
    const AB_mid = midpoint(A_jitter, B_jitter);
    const BC_mid = midpoint(B_jitter, C_jitter);
    const CA_mid = midpoint(C_jitter, A_jitter);

    // Recursive calls with shared midpoints
    recursiveTriangles(A, AB_mid, CA_mid, depth - 1);  // Top triangle
    recursiveTriangles(AB_mid, B, BC_mid, depth - 1);  // Left triangle
    recursiveTriangles(CA_mid, BC_mid, C, depth - 1);  // Right triangle
}

// Helper function to compute the midpoint between two points
function midpoint(P, Q) {
    return {
        x: (P.x + Q.x) / 2,
        y: (P.y + Q.y) / 2
    };
}