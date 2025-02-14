/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 12:51
 *
 * Practice 20: Recursion - Part 3 - Branching - Eye of Sauron
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
      thin: 0.1
    },
    gridStart: 80,         // Starting position for tiling grid
    gridSize: 240,         // Size of the tiling grid area
    branch: {
        initialLength: 20,
        angleRange: { min: 10, max: 20 },  // Random angle between 15-25 degrees
        lengthReduce: 0.9,  // Reduced from 0.7 to 0.85 for slower size reduction
        maxDepth: 7
    },
    branchStrokeWeights: [1.5, 1.3, 1.1, 0.9, 0.7, 0.5, 0.3, 0.1],  // Doubled all values
    centerCircle: {
        diameter: 30,
        treeCount: 30,       // Number of trees around the circle
        treeRadius: 10,      // Distance from center to tree bases
        positionJitter: 0.3  // Add this for position randomness (0-1)
    }
};
  
function setup() {
    createCanvas(400, 400);
    drawBaseComposition();
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

    // Clip the drawing to the square
    push();
    drawingContext.beginPath();
    rect(80, 80, 240, 240);
    drawingContext.clip();
    
    // Draw central black circle
    fill(0);
    noStroke();
    ellipse(width/2, height/2, CONFIG.centerCircle.diameter);
    
    // Draw surrounding trees
    const centerX = width/2;
    const centerY = height/2;
    stroke(0);
    for(let i = 0; i < CONFIG.centerCircle.treeCount; i++) {
        // Add random jitter to positions while maintaining overall distribution
        const jitteredIndex = i + random(-CONFIG.centerCircle.positionJitter, 
                                       CONFIG.centerCircle.positionJitter);
        
        const angle = map(jitteredIndex, 0, CONFIG.centerCircle.treeCount, 0, TWO_PI);
        const x = centerX + CONFIG.centerCircle.treeRadius * cos(angle);
        const y = centerY + CONFIG.centerCircle.treeRadius * sin(angle);
        
        const treeAngle = degrees(angle) - 90;
        
        drawBranch(x, y, treeAngle, CONFIG.branch.initialLength, 0);
    }
    pop();
}

function drawBranch(x, y, angle, length, depth) {
    if (depth > CONFIG.branch.maxDepth) return;
    
    push();
    translate(x, y);
    rotate(radians(angle));
    
    // Increased base multiplier for stroke weight
    strokeWeight(CONFIG.branchStrokeWeights[depth] * random(0.9, 1.1));
    line(0, 0, 0, -length * random(0.95, 1.05));
    
    if (length > 2) {
        // Dynamic angle reduction with randomness
        const angleReduction = depth * random(1.5, 2.5);
        const currentMin = max(CONFIG.branch.angleRange.min - angleReduction, 5);
        const currentMax = max(CONFIG.branch.angleRange.max - angleReduction, 10);
        
        // Vary branch angles asymmetrically
        const leftAngle = -random(currentMin, currentMax) * random(0.8, 1.2);
        const rightAngle = random(currentMin, currentMax) * random(0.8, 1.2);
        
        // Vary branch lengths independently
        const leftLengthFactor = CONFIG.branch.lengthReduce * random(0.8, 1.2);
        const rightLengthFactor = CONFIG.branch.lengthReduce * random(0.8, 1.2);
        
        // Sometimes skip a branch for organic feel (10% chance at depth > 3)
        if (depth < 3 || random() > 0.1) {
            drawBranch(0, -length, leftAngle, length * leftLengthFactor, depth + 1);
        }
        if (depth < 3 || random() > 0.1) {
            drawBranch(0, -length, rightAngle, length * rightLengthFactor, depth + 1);
        }
    }
    
    pop();
}