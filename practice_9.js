/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018.
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 7:43
 * 
 * Practice 9: Curve - Bezier
 * Code by Jace Yang, Assisted by o3-mini
 */

// Global constants for drawing and interaction.
const DOT_SIZE = 4;           // Diameter of the control dot.
const HOVER_DISTANCE = 10;    // Pixel distance threshold for selecting a dot.

// Global array containing the control points (dots).
let dots = [
  { x: 120, y: 120 },
  { x: 120, y: 200 },
  { x: 250, y: 200 },
  { x: 250, y: 280 }
];

let isDragging = false;       // True when a dot is being dragged.
let selectedDot = null;       // The index of the currently dragged dot.

// Boundaries for the "thin square" where control points can be manipulated.
const THIN_SQUARE_X = 80;
const THIN_SQUARE_Y = 80;
const THIN_SQUARE_SIZE = 240;
const THIN_SQUARE_RIGHT = THIN_SQUARE_X + THIN_SQUARE_SIZE;
const THIN_SQUARE_BOTTOM = THIN_SQUARE_Y + THIN_SQUARE_SIZE;

// Variables related to the de Casteljau algorithm animation.
let animating = false;      // Flag indicating animation is in progress.
let animationStartTime = 0; // Timestamp for the animation start.
const animationDuration = 2000; // Duration in milliseconds (2 seconds).

// Array to accumulate the final Bézier curve points constructed over time.
let bezierPoints = [];

/**
 * p5.js setup function.
 * Initializes the canvas and creates the "GO" button.
 */
function setup() {
  createCanvas(400, 400);
  createGoButton(); // Setup the GO button to trigger the animation.
}

/**
 * Creates and styles the "GO" button.
 * Clicking the button triggers the animation of the curve construction.
 */
function createGoButton() {
  const goButton = createButton("GO");
  // Style the button to be a circular black button with centered white text.
  goButton.style('background-color', 'black');
  goButton.style('color', 'white');
  goButton.style('border', 'none');
  goButton.style('border-radius', '50%');
  goButton.style('width', '30px');
  goButton.style('height', '30px');
  goButton.style('font-size', '10px');
  goButton.style('display', 'flex');
  goButton.style('justify-content', 'center');
  goButton.style('align-items', 'center');

  // Position the button near the right edge of the canvas.
  goButton.position(370, 185);
  goButton.mousePressed(startAnimation);
}

/**
 * Called when the GO button is pressed.
 * Resets necessary variables and sets the animation flag to true.
 */
function startAnimation() {
  animating = true;
  animationStartTime = millis();
  // Clear any existing Bézier curve points.
  bezierPoints = [];
}

/**
 * p5.js draw function.
 * Called on every frame - draws all components including:
 * - The main square with shadows.
 * - The thin square boundary for interaction.
 * - The control polygon (dots and connecting lines).
 * - The de Casteljau algorithm animation (if active).
 * - The final accumulated Bézier curve.
 */
function draw() {
  background(255);
  drawSquare();
  drawThinSquare();
  drawFourDots();

  // Animate the de Casteljau algorithm if in progress.
  if (animating) {
    drawDeCasteljau();
  }

  // Draw the accumulated Bézier curve in red.
  drawBezierCurve();
}

/**
 * Draws the outer square with detailed shadow effects.
 * Uses push/pop to manage drawing state such as shadow offsets.
 */
function drawSquare() {
  push();
  stroke(0);
  strokeWeight(5);

  // Set shadow properties for depth effect.
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';

  // Draw left vertical line with shadow offset to the left.
  drawingContext.shadowOffsetX = -5;
  drawingContext.shadowOffsetY = 0;
  line(50, 50, 50, 350);

  // Draw bottom horizontal line with shadow offset downward.
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 5;
  line(50, 350, 350, 350);
  pop();

  // Draw the main square boundary.
  stroke(0);
  strokeWeight(10);
  noFill();
  rect(50, 50, 300, 300);
}

/**
 * Draws the thin square which defines the interactive region
 * for control points. The square is drawn with a thin stroke.
 */
function drawThinSquare() {
  push();
  stroke(0);
  strokeWeight(0.02);
  noFill();
  rect(THIN_SQUARE_X, THIN_SQUARE_Y, THIN_SQUARE_SIZE, THIN_SQUARE_SIZE);
  pop();
}

/**
 * Draws the control polygon (lines connecting the dots) and the control dots.
 * Each control dot is rendered as a ring surrounding a filled circle.
 */
function drawFourDots() {
  // Draw connecting lines between successive control points.
  stroke(0);
  strokeWeight(1);
  for (let i = 0; i < dots.length - 1; i++) {
    line(dots[i].x, dots[i].y, dots[i + 1].x, dots[i + 1].y);
  }

  // Define the visual gap for the ring.
  const gap = 2;
  const ringDiameter = DOT_SIZE + gap * 2;
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    // Draw an unfilled ring to highlight the dot.
    noFill();
    stroke(0);
    strokeWeight(1);
    ellipse(dot.x, dot.y, ringDiameter);
    // Draw the filled central dot.
    fill(0);
    noStroke();
    ellipse(dot.x, dot.y, DOT_SIZE);
  }
}

/**
 * Implements the de Casteljau algorithm to visualize and compute
 * a single Bézier curve point corresponding to the current parameter t.
 * 
 * Technical Details:
 * - t is computed as the fraction of elapsed time over the entire animation duration.
 * - A copy of the initial control points is iteratively reduced by computing 
 *   linear interpolations between adjacent points.
 * - At each iteration/layer, the algorithm:
 *   a) Draws connecting lines between points in the current layer.
 *   b) Draws the points at the current layer.
 *   c) Computes the next layer by linearly interpolating with parameter t.
 * - When the layer reduces to a single point, that point is the computed 
 *   point on the Bézier curve for that t value.
 * - This final point is added to the curve accumulation array.
 */
function drawDeCasteljau() {
  // Determine the fraction t from 0 to 1 based on elapsed time.
  let t = (millis() - animationStartTime) / animationDuration;
  t = min(t, 1);
  
  // Begin with a clone of the initial control points.
  let currentLayer = dots.map(pt => ({ x: pt.x, y: pt.y }));
  let layerIndex = 0;
  
  // Iterate until a single point is obtained.
  while (currentLayer.length > 0) {
    // Compute a grayscale color that darkens with deeper layers.
    const gray = max(150 - layerIndex * 20, 0);
    
    // Draw the control polygon of the current layer if multiple points exist.
    if (currentLayer.length > 1) {
      stroke(gray);
      strokeWeight(1);
      for (let i = 0; i < currentLayer.length - 1; i++) {
        line(
          currentLayer[i].x, currentLayer[i].y,
          currentLayer[i + 1].x, currentLayer[i + 1].y
        );
      }
    }
    
    // Draw the points in the current layer.
    fill(gray);
    noStroke();
    for (const pt of currentLayer) {
      ellipse(pt.x, pt.y, DOT_SIZE + 2);
    }
    
    // Compute the next layer: each new point is a linear interpolation
    // between two adjacent points in the current layer using p5.js's lerp function.
    const nextLayer = [];
    for (let i = 0; i < currentLayer.length - 1; i++) {
      nextLayer.push({
        x: lerp(currentLayer[i].x, currentLayer[i + 1].x, t),
        y: lerp(currentLayer[i].y, currentLayer[i + 1].y, t)
      });
    }
    
    // If no further interpolation is possible, currentLayer holds the final Bézier point.
    if (nextLayer.length === 0) {
      fill(0);
      noStroke();
      ellipse(currentLayer[0].x, currentLayer[0].y, DOT_SIZE + 2);
      // Accumulate the computed Bézier point.
      bezierPoints.push(currentLayer[0]);
      break;
    }
    
    // Update the current layer for the next iteration.
    currentLayer = nextLayer;
    layerIndex++;
  }
  
  // Once t reaches 1, the animation is complete.
  if (t === 1) {
    animating = false;
  }
}

/**
 * Draws the final accumulated Bézier curve by connecting
 * all computed Bézier points with red line segments.
 */
function drawBezierCurve() {
  if (bezierPoints.length > 0) {
    noFill();
    stroke('red');
    strokeWeight(1);
    beginShape();
    for (const pt of bezierPoints) {
      vertex(pt.x, pt.y);
    }
    endShape();
  }
}

/**
 * p5.js mousePressed event handler.
 * Enables mouse interaction within the thin square.
 * - Checks if the click is near an existing control dot; if so,
 *   sets that point for dragging.
 * - If the click is in the interaction area but not near a dot,
 *   a new control point is added.
 */
function mousePressed() {
  // Only interact if within the designated thin square.
  if (
    mouseX < THIN_SQUARE_X ||
    mouseX > THIN_SQUARE_RIGHT ||
    mouseY < THIN_SQUARE_Y ||
    mouseY > THIN_SQUARE_BOTTOM
  ) {
    return;
  }
  
  // Iterate over control points to see if the mouse is close enough to drag one.
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    if (dist(mouseX, mouseY, dot.x, dot.y) < HOVER_DISTANCE) {
      isDragging = true;
      selectedDot = i;
      return; // Exit early once a dot is selected.
    }
  }
  
  // If no control dot was near the mouse click, add a new control point.
  dots.push({ x: mouseX, y: mouseY });
}

/**
 * p5.js mouseDragged event handler.
 * Updates the position of the selected control point,
 * constraining its movement within the thin square.
 */
function mouseDragged() {
  if (isDragging && selectedDot !== null) {
    dots[selectedDot].x = constrain(mouseX, THIN_SQUARE_X, THIN_SQUARE_RIGHT);
    dots[selectedDot].y = constrain(mouseY, THIN_SQUARE_Y, THIN_SQUARE_BOTTOM);
  }
}

/**
 * p5.js mouseReleased event handler.
 * Resets the dragging flags when the mouse is released.
 */
function mouseReleased() {
  isDragging = false;
  selectedDot = null;
}