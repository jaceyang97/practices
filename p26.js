/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Reference: https://codepen.io/AlisonGalindo/pen/QWVPBjB
 * Timer: 16:16
 *
 * Practice 26: Algorithms - Perlin Noise
 * Code by Jace Yang
 * 
 * This sketch creates a dynamic flow field visualization using Perlin noise.
 * It generates a grid of vectors whose directions and colors are determined by noise,
 * then uses particles to visualize the flow field.
 */

// Control parameters for Perlin noise and particle system
const noiseStep = 0.1;        // Controls the "granularity" of the noise pattern. Smaller values create smoother, more gradual changes
const zOffsetStep = 0.005;    // Controls how quickly the overall pattern evolves over time. Higher values = faster changes
const magnitudeStep = 0.0005; // Controls how quickly the force strengths change. Higher values create more dynamic force changes
const gridScale = 10;         // Defines the size of each flow field cell in pixels. Lower values = more detailed but slower performance
const particleCount = 500;    // Starting number of particles in the system

// Runtime variables
let xyNoiseOffset = 0;        // Tracks position in 2D noise space, used for pattern generation
let gridCols, gridRows;       // Dimensions of the flow field grid (calculated from canvas size and gridScale)
let zNoiseOffset = 0;         // Tracks position in 3rd dimension of noise space, used for pattern evolution
let fps;                      // Frames per second tracking (unused in current code)
let particles = [];           // Array holding all active particles
let flowVectors;             // Array storing force vectors for each grid cell
let flowColors;              // Array storing color values for each grid cell
let magnitudeNoiseOffset = 0; // Separate noise offset for force magnitude variation
let showField = false;        // Debug flag: when true, displays vector field instead of particles

class Particle {
  // Particle class represents individual particles that move through the flow field
  // Each particle has position, velocity, and acceleration vectors and leaves trails as it moves
  constructor() {
    // Initialize particle with random position and zero velocity/acceleration
    this.pos = createVector(random(width), random(height));  // Random starting position
    this.vel = createVector(0, 0);                          // Initial velocity (stationary)
    this.acc = createVector(0, 0);                          // Initial acceleration
    this.maxSpeed = 2;                                      // Maximum speed limit
    this.prevPos = this.pos.copy();                        // Previous position for trail drawing
  }

  update() {
    // Updates particle physics:
    // 1. Add acceleration to velocity
    // 2. Limit velocity to maxSpeed
    // 3. Add velocity to position
    // 4. Reset acceleration (forces are accumulated each frame)
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  applyForce(force) {
    // Adds a force vector to the particle's acceleration
    // Forces accumulate each frame until cleared in update()
    this.acc.add(force);
  }

  show(colorMap) {
    // Draws the particle trail by creating a line from previous to current position
    strokeWeight(1);
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    this.updatePrev();
  }

  inverseConstrain(pos, key, f, t) {
    // Helper method for edge wrapping
    // When particle goes beyond canvas bounds, wrap it to the opposite side
    // Parameters:
    // - pos: position vector
    // - key: 'x' or 'y' coordinate
    // - f: from value (minimum boundary)
    // - t: to value (maximum boundary)
    if (pos[key] < f) {
      pos[key] = t;
      this.updatePrev();
    }
    if (pos[key] > t) {
      pos[key] = f;
      this.updatePrev();
    }
  }

  updatePrev() {
    // Updates the previous position to current position
    // Called after drawing trail or wrapping edges
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
  }

  edges() {
    // Handles edge wrapping for both x and y coordinates
    // When particle goes off-screen, it appears on the opposite side
    this.inverseConstrain(this.pos, 'x', 0, width);
    this.inverseConstrain(this.pos, 'y', 0, height);
  }

  follow(flowVectors, colorMap) {
    // Updates particle based on flow field forces
    // 1. Converts particle position to flow field grid coordinates
    // 2. Gets corresponding force vector from flow field
    // 3. Applies force to particle
    // 4. Updates particle color based on color map
    let x = floor(this.pos.x / gridScale);
    let y = floor(this.pos.y / gridScale);
    let index = x + y * gridCols;
    let force = flowVectors[index];
    this.applyForce(force);
    let colorData = colorMap[index];
    if (colorData) {
      stroke(color(colorData[0], colorData[1], colorData[2]));
    }
  }
}

function setup() {
  // Initialize the canvas and create the initial particle system
  // Sets up the grid for the flow field based on gridScale
  createCanvas(400, 400);
  pixelDensity(1);
  gridCols = Math.floor(width / gridScale);
  gridRows = Math.floor(height / gridScale);
  background(0);

  for (let i = 0; i < particleCount; i++) {
    particles[i] = new Particle();
  }

  flowVectors = new Array(gridRows * gridCols);
  flowColors = new Array(gridRows * gridCols);
}

function draw() {
  // Main animation loop that controls the flow field visualization
  
  // Clear the background:
  // - Full clear if showing debug vector field
  // - Partial clear (alpha = 5) if showing particle trails, creating fade effect
  if (showField) {
    background(0);
  } else {
    background(color(0, 0, 0, 5));
  }

  // Generate flow field using Perlin noise
  // Iterate through each cell in the grid
  let yNoise = xyNoiseOffset;
  for (let y = 0; y < gridRows; y++) {
    let xNoise = xyNoiseOffset;
    for (let x = 0; x < gridCols; x++) {
      const index = x + y * gridCols;
      
      // Generate colors using 3D Perlin noise
      // Each color channel uses different noise space coordinates for variation
      const redValue = noise(xNoise, yNoise, zNoiseOffset) * 30;        // Red: subtle
      const greenValue = noise(xNoise + 100, yNoise + 100, zNoiseOffset) * 150;  // Green: medium
      const blueValue = noise(xNoise + 200, yNoise + 200, zNoiseOffset) * 255;   // Blue: dominant

      // Generate vector field using noise
      // Convert noise value to angle and create vector with varying magnitude
      const angle = noise(xNoise, yNoise, zNoiseOffset) * TWO_PI;
      const vector = p5.Vector.fromAngle(angle);
      const magnitude = map(noise(xNoise, yNoise, magnitudeNoiseOffset), 0, 8, -5, 5);

      // Set vector magnitude and store in flow field
      vector.setMag(magnitude);

      // Debug visualization of vector field
      if (showField) {
        push();
        stroke(0);
        translate(x * gridScale, y * gridScale);
        rotate(vector.heading());
        const endpoint = Math.abs(magnitude) * gridScale;
        line(0, 0, endpoint, 0);
        // Color code vectors based on direction (red = negative, green = positive)
        if (magnitude < 0) {
          stroke('red');
        } else {
          stroke('green');
        }
        line(endpoint - 60, 0, endpoint, 0);
        pop();
      }

      // Store vector and color data for particle system
      flowVectors[index] = vector;
      flowColors[index] = [redValue, greenValue, blueValue];
      xNoise += noiseStep;
    }
    yNoise += noiseStep;
  }

  // Update noise offsets for animation
  magnitudeNoiseOffset += magnitudeStep;  // Changes force magnitudes over time
  zNoiseOffset += zOffsetStep;            // Evolves overall pattern
  xyNoiseOffset -= magnitudeStep;         // Shifts pattern in xy plane

  // Particle system updates (only when not in debug mode)
  if (!showField) {
    // Update and display all particles
    particles.forEach(particle => {
      particle.follow(flowVectors, flowColors);  // Apply flow field forces
      particle.update();                         // Update physics
      particle.edges();                          // Handle edge wrapping
      particle.show();                           // Draw particle trail
    });

    // Dynamic particle population control
    // Randomly add particles if below maximum threshold
    if (random(10) > 5 && particles.length < 3500) {
      const rnd = Math.floor(noise(zNoiseOffset) * 30);
      for (let i = 0; i < rnd; i++) {
        particles.push(new Particle());
      }
    } 
    // Remove particles if above minimum threshold
    else if (particles.length > 3000) {
      const rnd = Math.floor(random(20));
      for (let i = 0; i < rnd; i++) {
        particles.shift();
      }
    }
  }
}