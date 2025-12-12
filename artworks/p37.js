/**
 * Practice 37: Dystrophin Poster Display
 * 
 * Simple image loading and display of the dystrophin poster artwork.
 * 
 * Code by Jace Yang
 */

let img;

function preload() {
  img = loadImage('dystrophin-poster.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  imageMode(CENTER);
}

function draw() {
  background(0);
  
  if (!img) {
    displayError();
    return;
  }
  
  // Calculate scaling to fit image in canvas while maintaining aspect ratio
  let aspectRatio = img.width / img.height;
  let canvasRatio = width / height;
  
  let displayWidth, displayHeight;
  
  if (aspectRatio > canvasRatio) {
    // Image is wider than canvas - fit to width
    displayWidth = width * 0.95;
    displayHeight = displayWidth / aspectRatio;
  } else {
    // Image is taller than canvas - fit to height
    displayHeight = height * 0.95;
    displayWidth = displayHeight * aspectRatio;
  }
  
  // Draw centered image
  image(img, width / 2, height / 2, displayWidth, displayHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function displayError() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text('Image not loaded', width / 2, height / 2);
}

