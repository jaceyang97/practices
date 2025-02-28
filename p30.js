/**
 * Generative Art exercise from Tim Holman's Speedrun talk, CSSConf Australia 2018
 * Reference: https://www.youtube.com/watch?v=4Se0_w0ISYk
 * Timer: 17:35
 *
 * Practice 30: Other Inputs - Audio
 * Code by Jace Yang
 */

let mic;
let fft;
let isAudioReady = false;
let amplificationFactor = 1.5;
let waveHistory = []; // Store previous wave data for fading effect
const historyLength = 8; // Number of previous frames to keep

function setup() {
  createCanvas(400, 400);
  
  // Initialize audio input
  if (typeof p5.AudioIn !== 'undefined') {
    mic = new p5.AudioIn();
    mic.start();
    
    // Increase FFT size for more detailed frequency analysis
    fft = new p5.FFT(0.8, 256);
    fft.setInput(mic);
    
    isAudioReady = true;
  } else {
    console.warn('Audio library not available. Make sure p5.sound.js is loaded.');
  }
  
  // Initialize wave history with empty arrays
  for (let i = 0; i < historyLength; i++) {
    waveHistory.push([]);
  }
  
  drawSquare();
}

function draw() {
  // Only redraw the thin square with audio waves
  if (isAudioReady) {
    // Clear the area for the thin square without clearing the whole canvas
    fill(255);
    noStroke();
    rect(79, 79, 242, 242);
    
    drawThinSquare();
    drawAudioWaves();
  }
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
  strokeWeight(0.25);
  noFill();
  rect(80, 80, 240, 240);
  pop();
}

function drawAudioWaves() {
  if (!isAudioReady) return;
  
  // Analyze the audio
  fft.analyze();
  
  push();
  // Create a clipping region for the thin square
  beginClip();
  rect(80, 80, 240, 240);
  endClip();
  
  // Display frequency spectrum
  const spectrum = fft.analyze();
  
  // Calculate center y position
  const centerY = 200;
  
  // Better distribute the spectrum across the width
  // Skip the very lowest frequencies which tend to dominate
  const startIndex = Math.floor(spectrum.length * 0.1); // Skip first 10% (lowest frequencies)
  const endIndex = Math.floor(spectrum.length * 0.8);   // Use up to 80% (avoid highest frequencies)
  
  // Calculate how many points to sample from the spectrum
  const numPoints = 240; // One point per pixel width
  
  // Create current wave data
  let currentWave = [];
  
  // Use logarithmic mapping to give more space to mid and high frequencies
  for (let i = 0; i < numPoints; i++) {
    // Use logarithmic mapping to spread frequencies more evenly
    // This gives more space to higher frequencies
    const t = i / (numPoints - 1); // Normalized position (0 to 1)
    
    // Apply logarithmic mapping - this expands the higher frequencies
    // Adjust the exponent (0.4) to control the distribution
    const logT = Math.pow(t, 0.4);
    
    // Map to spectrum index
    const spectrumIndex = Math.floor(map(logT, 0, 1, startIndex, endIndex));
    
    // Map x position within the thin square (80 to 320)
    const x = map(i, 0, numPoints - 1, 80, 320);
    
    // Get the spectrum value and apply some amplification
    let spectrumValue = spectrum[spectrumIndex];
    
    // Apply more moderate amplification to lower values
    if (spectrumValue < 50) {
      spectrumValue = spectrumValue * 1.5;
    } else {
      spectrumValue = spectrumValue * 1.2;
    }
    
    // Cap the value to avoid extreme heights
    spectrumValue = min(spectrumValue, 255);
    
    // Map spectrum height with reduced range
    const amplitude = map(spectrumValue, 0, 255, 0, 100 * amplificationFactor);
    
    currentWave.push({
      x: x,
      amplitude: amplitude,
      value: spectrumValue,
      frequency: t // Store normalized frequency position for color mapping
    });
  }
  
  // Add current wave to history and remove oldest
  waveHistory.unshift(currentWave);
  if (waveHistory.length > historyLength) {
    waveHistory.pop();
  }
  
  // Draw all waves in history with fading effect
  for (let h = 0; h < waveHistory.length; h++) {
    const wave = waveHistory[h];
    if (wave.length === 0) continue;
    
    // Calculate opacity based on age (newer = more opaque)
    const opacity = map(h, 0, waveHistory.length - 1, 255, 30);
    
    // Calculate stroke weight based on age (newer = thicker)
    const weight = map(h, 0, waveHistory.length - 1, 2, 0.5);
    
    strokeWeight(weight);
    
    // Draw each point in the wave
    for (let i = 0; i < wave.length; i++) {
      const point = wave[i];
      
      // Create grayscale color based on multiple factors
      // 1. Frequency (x position) - higher frequencies are lighter
      // 2. Amplitude - higher amplitudes are darker
      // 3. History - older waves are lighter
      
      // Base grayscale value from frequency (0-255)
      let grayscale = map(point.frequency, 0, 1, 20, 220);
      
      // Adjust based on amplitude (higher amplitude = darker)
      grayscale = constrain(grayscale - (point.amplitude * 0.5), 0, 255);
      
      // Adjust based on history (older = lighter)
      grayscale = constrain(grayscale + (h * 15), 0, 255);
      
      // Apply the grayscale color with appropriate opacity
      stroke(grayscale, opacity);
      
      // Draw vertical lines for each frequency band centered at centerY
      line(point.x, centerY - point.amplitude, point.x, centerY + point.amplitude);
      
      // Add some artistic elements - small dots at the ends of lines for newest wave
      if (h === 0 && point.amplitude > 10) {
        const dotSize = map(point.amplitude, 0, 100, 1, 3);
        noStroke();
        
        // Use inverted grayscale for dots to create contrast
        fill(255 - grayscale, opacity);
        ellipse(point.x, centerY - point.amplitude, dotSize);
        ellipse(point.x, centerY + point.amplitude, dotSize);
      }
    }
    
    // Add connecting lines between points for an artistic effect
    if (h === 0) {
      noFill();
      
      // Use a mid-gray for the connecting lines
      stroke(150, 100);
      strokeWeight(0.5);
      
      // Top curve
      beginShape();
      for (let i = 0; i < wave.length; i++) {
        const point = wave[i];
        vertex(point.x, centerY - point.amplitude);
      }
      endShape();
      
      // Bottom curve
      beginShape();
      for (let i = 0; i < wave.length; i++) {
        const point = wave[i];
        vertex(point.x, centerY + point.amplitude);
      }
      endShape();
    }
  }
  
  // Add some subtle background texture
  for (let i = 0; i < 100; i++) {
    const x = random(80, 320);
    const y = random(80, 320);
    const size = random(0.5, 1.5);
    const gray = random(200, 240);
    
    noStroke();
    fill(gray, 20); // Very transparent
    ellipse(x, y, size);
  }
  
  pop();
}

// Add a function to start audio when user interacts with the page
function mousePressed() {
  // p5.sound workaround for browsers that require user interaction
  if (typeof p5.AudioIn !== 'undefined' && !isAudioReady) {
    mic = new p5.AudioIn();
    mic.start();
    
    fft = new p5.FFT(0.8, 256);
    fft.setInput(mic);
    
    isAudioReady = true;
  }
}
  