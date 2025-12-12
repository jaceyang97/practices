/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 15:33
 *
 * Practice 25: Colors - Fractals
 * Code by Jace Yang
 */

 // I just realized that from p0 to p24, I've been using the same setup that creates a noticable distance between the black frame border and the actual canvas.

const config = {
  maxLayers: 4,          // Recursion depth (0 = center circle)
  baseRadius: 110,       // Initial circle radius
  palette: {
    thinSquare: 'hsl(195, 92%, 26%)',
    fractalLayers: [
      'hsla(45, 50%, 70%, 0.3)',   // Layer 0: Center yellow
      'hsla(55, 45%, 60%, 0.3)',   // Layer 1
      'hsla(65, 40%, 50%, 0.3)',   // Layer 2
      'hsla(75, 35%, 40%, 0.3)',   // Layer 3
      'hsla(85, 30%, 30%, 0.3)'    // Layer 4
    ]
  },
  layers: []             // Stores circles per layer
};

function setup() {
  createCanvas(400, 400);
  
  // Initialize layer storage
  config.layers = Array(config.maxLayers + 1).fill().map(() => []);
  
  // Generate fractal pattern
  collectCircleFractal(width/2, height/2, 0, config.baseRadius);
  
  // Draw elements in correct z-order
  drawSquareFrame();
  drawThinSquare();
  drawAllLayers();
}

function drawSquareFrame() {
  background(255);
  
  push();
  setShadow(-5, 0);
  line(50, 50, 50, 350);
  pop();
  
  push();
  setShadow(0, 5);
  line(50, 350, 350, 350);
  pop();
  
  noFill();
  strokeWeight(10);
  rect(50, 50, 300, 300);
}

function setShadow(x, y) {
  drawingContext.shadowOffsetX = x;
  drawingContext.shadowOffsetY = y;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  stroke(0);
  strokeWeight(5);
}

function drawThinSquare() {
  push();
  fill(config.palette.thinSquare);
  noStroke();
  rect(80, 80, 240, 240);
  pop();
}

function collectCircleFractal(x, y, layer, radius) {
  // Store current circle
  config.layers[layer].push({x, y, radius});
  
  // Base case: stop at max layers
  if (layer >= config.maxLayers) return;
  
  // Calculate child circle positions
  const angleStep = TWO_PI / 5;
  const childRadius = radius * 0.45;
  const offset = radius - childRadius;
  
  for(let i = 0; i < 5; i++) {
    const angle = angleStep * i - HALF_PI; // Rotate -90° to start at top
    const nx = x + cos(angle) * offset;
    const ny = y + sin(angle) * offset;
    collectCircleFractal(nx, ny, layer + 1, childRadius);
  }
}

function drawAllLayers() {
  // Draw from deepest layer to surface
  for(let layer = config.maxLayers; layer >= 0; layer--) {
    drawLayer(layer);
  }
}

function drawLayer(layer) {
  const color = config.palette.fractalLayers[layer];
  fill(color);
  noStroke();
  
  // Draw all circles in this layer
  config.layers[layer].forEach(circle => {
    ellipse(circle.x, circle.y, circle.radius * 2);
  });
}