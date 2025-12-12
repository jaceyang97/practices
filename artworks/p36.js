/**
 * Practice 36: Photo to Dots with Fire Effect
 * 
 * Multi-scale halftone rendering with:
 * - Adaptive thresholding (Otsu/percentile)
 * - Edge-aware flame orientation using Sobel gradients
 * - Gradient-magnitude-based shape selection
 * - Region-specific contrast for reflection areas
 * - Intensity-driven displacement for flame motion
 * 
 * Code by Jace Yang
 */

let img;
let dotImg;

// ========================================
// CONFIGURABLE PARAMETERS
// ========================================

// Multi-pass rendering
let enableMultiPass = true;
let coarseSpacing = 5;        // First pass: larger dots, establishes structure
let fineSpacing = 3;          // Second pass: smaller dots, adds detail

// Dot sizing
let maxRadius = 3;            // Maximum radius for flame dots
let maxBlackDotRadius = 3;    // Maximum radius for black halftone dots
let minDotRadius = 0.5;       // Minimum dot size threshold
let rotationAngle = 45;       // Base rotation for flame shapes (degrees)

// Adaptive thresholding
let useAdaptiveThreshold = true;
let thresholdMethod = 'percentile';  // 'otsu' or 'percentile'
let brightnessPercentile = 0.75;     // 0.75 = top 25% brightest become flames
let whiteThreshold = 160;            // Fallback if adaptive disabled

// Flame displacement (upward/rightward motion)
let maxUpwardDisplacement = 3;
let maxRightwardDisplacement = 3;

// Fire gradient bands (adaptive percentiles or fixed 0-1 range)
let useAdaptiveFireBands = true;
let whiteThreshold_fire = 0.8;      // Hottest (white)
let yellowWhiteThreshold = 0.6;     // Very hot (yellow-white)
let yellowThreshold = 0.4;          // Hot (yellow)
let redThreshold = 0.2;             // Cooler (red)

// Fire colors (RGBA)
let darkRed = [200, 20, 0];
let yellow = [255, 200, 0];
let yellowWhite = [255, 255, 200];
let white = [255, 255, 255];

// ========================================
// P5.JS LIFECYCLE
// ========================================

function preload() {
  img = loadImage('golden_pavilion.jpg');
}

function setup() {
  createCanvas(800, 600);
  background(220);
  
  if (!img) {
    displayError();
    return;
  }
  
  // Resize and process image
  resizeImageToFit();
  dotImg = createDotImage(img);
  
  // Display side-by-side comparison
  displayComparison();
}

function draw() {
  // Static display - no animation
}

// ========================================
// DISPLAY HELPERS
// ========================================

function resizeImageToFit() {
    let aspectRatio = img.width / img.height;
  let availableHeight = height - 40;
  let displayWidth = width / 2;
    let displayHeight = displayWidth / aspectRatio;
    
    if (displayHeight > availableHeight) {
      displayHeight = availableHeight;
      displayWidth = displayHeight * aspectRatio;
    }
    
    img.resize(displayWidth, displayHeight);
}

function displayComparison() {
  let availableHeight = height - 40;
  let displayHeight = img.height;
  let displayWidth = img.width;
  
  // Center images
    let imageY = (availableHeight - displayHeight) / 2;
  let leftImageX = (width / 2 - displayWidth) / 2;
  let rightImageX = width / 2 + (width / 2 - displayWidth) / 2;
    
  // Draw images
    image(img, leftImageX, imageY);
    image(dotImg, rightImageX, imageY);
    
  // Add labels
    fill(0);
    textAlign(CENTER);
    textSize(16);
  text('Original', width / 4, height - 15);
  text('Dots', 3 * width / 4, height - 15);
}
    
function displayError() {
    fill(100);
    textAlign(CENTER, CENTER);
    textSize(24);
  text('Image not loaded', width / 2, height / 2);
}

// ========================================
// MAIN IMAGE PROCESSING
// ========================================

function createDotImage(sourceImg) {
  let w = sourceImg.width;
  let h = sourceImg.height;
  let dotImage = createGraphics(w, h);
  
  dotImage.background(255);
  dotImage.noStroke();
  sourceImg.loadPixels();
  
  // Compute all thresholds and percentiles
  let thresholds = computeThresholds(sourceImg, w, h);
  
  // Render dot layers
  renderAllLayers(dotImage, sourceImg, w, h, thresholds);
  
  return dotImage;
}

function computeThresholds(sourceImg, w, h) {
  const REFLECTION_START = 0.8; // Bottom 20%
  
  // Initialize with defaults
  let thresholds = {
    white: whiteThreshold,
    fireBands: {
      white: whiteThreshold_fire,
      yellowWhite: yellowWhiteThreshold,
      yellow: yellowThreshold,
      red: redThreshold
    },
    clipping: {
      globalP10: 0,
      globalP90: 255,
      reflP10: 0,
      reflP90: 255
    }
  };
  
  if (!useAdaptiveThreshold && !useAdaptiveFireBands) {
    return thresholds;
  }
  
  // Collect brightness samples
  let samples = collectBrightnessSamples(sourceImg, w, h, REFLECTION_START);
  
  // Compute clipping percentiles
  thresholds.clipping = computeClippingPercentiles(samples);
  
  // Compute adaptive white threshold
  if (useAdaptiveThreshold) {
    thresholds.white = computeAdaptiveWhiteThreshold(samples.all);
    console.log(`Adaptive white threshold: ${thresholds.white.toFixed(2)}`);
  }
  
  // Compute adaptive fire bands
  if (useAdaptiveFireBands) {
    thresholds.fireBands = computeAdaptiveFireBands(samples.all, thresholds.white);
  }
  
  return thresholds;
}

function collectBrightnessSamples(sourceImg, w, h, reflectionStart) {
  let samplingSpacing = enableMultiPass ? fineSpacing : coarseSpacing;
  let reflectionY = h * reflectionStart;
  
  let samples = {
    all: [],
    global: [],
    reflection: []
  };
  
  for (let y = 0; y < h; y += samplingSpacing) {
    let inReflection = (y >= reflectionY);
    
    for (let x = 0; x < w; x += samplingSpacing) {
      let brightness = getAverageBrightness(sourceImg, x, y, samplingSpacing, w, h);
      samples.all.push(brightness);
      
      if (inReflection) {
        samples.reflection.push(brightness);
      } else {
        samples.global.push(brightness);
      }
    }
  }
  
  return samples;
}

function computeClippingPercentiles(samples) {
  let clipping = {
    globalP10: 0,
    globalP90: 255,
    reflP10: 0,
    reflP90: 255
  };
  
  if (samples.global.length > 0) {
    clipping.globalP10 = computePercentileThreshold(samples.global, 0.10);
    clipping.globalP90 = computePercentileThreshold(samples.global, 0.90);
  }
  
  if (samples.reflection.length > 0) {
    clipping.reflP10 = computePercentileThreshold(samples.reflection, 0.10);
    clipping.reflP90 = computePercentileThreshold(samples.reflection, 0.90);
  }
  
  console.log(`Global clipping: P10=${clipping.globalP10.toFixed(2)}, P90=${clipping.globalP90.toFixed(2)}`);
  console.log(`Reflection clipping: P10=${clipping.reflP10.toFixed(2)}, P90=${clipping.reflP90.toFixed(2)}`);
  
  return clipping;
}

function computeAdaptiveWhiteThreshold(brightnessValues) {
  if (thresholdMethod === 'otsu') {
    return computeOtsuThreshold(brightnessValues);
  } else if (thresholdMethod === 'percentile') {
    return computePercentileThreshold(brightnessValues, brightnessPercentile);
  }
  return whiteThreshold;
}

function computeAdaptiveFireBands(brightnessValues, whiteThresh) {
  let brightPixels = brightnessValues.filter(b => b > whiteThresh);
  
  if (brightPixels.length === 0) {
    return {
      white: whiteThreshold_fire,
      yellowWhite: yellowWhiteThreshold,
      yellow: yellowThreshold,
      red: redThreshold
    };
  }
  
  let bands = {
    white: computePercentileThreshold(brightPixels, whiteThreshold_fire),
    yellowWhite: computePercentileThreshold(brightPixels, yellowWhiteThreshold),
    yellow: computePercentileThreshold(brightPixels, yellowThreshold),
    red: computePercentileThreshold(brightPixels, redThreshold)
  };
  
  console.log(`Adaptive fire bands: white=${bands.white.toFixed(2)}, yellowWhite=${bands.yellowWhite.toFixed(2)}, yellow=${bands.yellow.toFixed(2)}, red=${bands.red.toFixed(2)}`);
  
  return bands;
}

function renderAllLayers(dotImage, sourceImg, w, h, thresholds) {
  let { white, fireBands, clipping } = thresholds;
  let { globalP10, globalP90, reflP10, reflP90 } = clipping;
  
  if (enableMultiPass) {
    console.log(`Rendering multi-pass: coarse (${coarseSpacing}px) + fine (${fineSpacing}px)`);
    
    // Coarse pass: structure
    renderDotLayer(dotImage, sourceImg, w, h, coarseSpacing,
                   maxBlackDotRadius * 1.2, maxRadius * 1.2,
                   white, fireBands, globalP10, globalP90, reflP10, reflP90);
    
    // Fine pass: detail
    renderDotLayer(dotImage, sourceImg, w, h, fineSpacing,
                   maxBlackDotRadius * 0.8, maxRadius * 0.8,
                   white, fireBands, globalP10, globalP90, reflP10, reflP90);
  } else {
    console.log(`Rendering single pass: ${coarseSpacing}px`);
    renderDotLayer(dotImage, sourceImg, w, h, coarseSpacing,
                   maxBlackDotRadius, maxRadius,
                   white, fireBands, globalP10, globalP90, reflP10, reflP90);
  }
}

// ========================================
// DOT LAYER RENDERING
// ========================================

function renderDotLayer(dotImage, sourceImg, w, h, spacing, maxBlackRad, maxFlameRad, whiteThresh, fireBands, globalP10, globalP90, reflP10, reflP90) {
  const REFLECTION_Y = h * 0.8; // Bottom 20%
  
  // Black halftone layer
  renderBlackDots(dotImage, sourceImg, w, h, spacing, maxBlackRad,
                  REFLECTION_Y, globalP10, globalP90, reflP10, reflP90);
  
  // Flame layer (skip reflection area)
  renderFlameDots(dotImage, sourceImg, w, h, spacing, maxFlameRad,
                  whiteThresh, fireBands, REFLECTION_Y);
}

function renderBlackDots(dotImage, sourceImg, w, h, spacing, maxBlackRad, reflY, globalP10, globalP90, reflP10, reflP90) {
  for (let y = 0; y < h; y += spacing) {
    let inReflection = (y >= reflY);
    let minBlackFloor = inReflection ? 0.45 : 0.35;
    let lowClip = inReflection ? reflP10 : globalP10;
    let highClip = inReflection ? reflP90 : globalP90;
    
    for (let x = 0; x < w; x += spacing) {
      let brightness = getAverageBrightness(sourceImg, x, y, spacing, w, h);
      
      // Clip and map brightness to radius
      let clipped = constrain(brightness, lowClip, highClip);
      let radius = map(clipped, lowClip, highClip, maxBlackRad, 0);
      radius = constrain(radius, minBlackFloor, maxBlackRad);
      
      if (radius > 0.1) {
        let centerX = x + spacing / 2;
        let centerY = y + spacing / 2;
        dotImage.fill(0);
        dotImage.ellipse(centerX, centerY, radius * 2, radius * 2);
      }
    }
  }
}

function renderFlameDots(dotImage, sourceImg, w, h, spacing, maxFlameRad, whiteThresh, fireBands, reflY) {
  for (let y = 0; y < h; y += spacing) {
    if (y >= reflY) continue; // Skip reflection area
    
    for (let x = 0; x < w; x += spacing) {
      let brightness = getAverageBrightness(sourceImg, x, y, spacing, w, h);
      
      if (brightness <= whiteThresh) continue;
      
      let radius = map(brightness, whiteThresh, 255, 0, maxFlameRad);
      radius = constrain(radius, 0, maxFlameRad);
      
      if (radius <= minDotRadius) continue;
      
      // Compute flame properties
      let flameProps = computeFlameProperties(sourceImg, x, y, brightness, radius, 
                                              spacing, w, h, whiteThresh, fireBands);
      
      // Draw flame shape
      drawFlameShape(dotImage, flameProps);
    }
  }
}

function computeFlameProperties(sourceImg, x, y, brightness, radius, spacing, w, h, whiteThresh, fireBands) {
  let centerX = x + spacing / 2;
  let centerY = y + spacing / 2;
  
  // Fire color
  let fireColor = getFireColor(brightness, whiteThresh, fireBands);
  
  // Gradient and rotation
  let gradient = computeImageGradient(sourceImg, x, y, spacing, w, h);
  let rotation = computeFlameRotation(x, y, h, gradient);
  
  // Displacement (upward/rightward motion)
  let displacement = computeFlameDisplacement(x, y, brightness, whiteThresh);
  centerX += displacement.x;
  centerY += displacement.y;
  
  // Edge detection
  let edgeType = detectEdgeType(sourceImg, x, y, spacing, w, h, whiteThresh);
  
  return {
    centerX, centerY,
    radius, brightness,
    fireColor,
    rotation,
    gradientMagnitude: gradient.magnitude,
    edgeType
  };
}

function computeFlameRotation(x, y, h, gradient) {
  let gradientAngle = gradient.angle + PI / 2; // Perpendicular
  let gradientAngleDeg = degrees(gradientAngle);
  
  let normalizedMagnitude = constrain(map(gradient.magnitude, 0, 300, 0, 1), 0, 1);
  
  // Base rotation with variation
  let cellVariation = (x + y) * 0.1;
  let upwardBias = map(y, 0, h, 0, 30);
  let baseAngle = rotationAngle + cellVariation + upwardBias;
  
  // Blend with gradient
  return {
    angle: lerp(baseAngle, gradientAngleDeg, normalizedMagnitude * 0.7),
    magnitude: normalizedMagnitude
  };
}

function computeFlameDisplacement(x, y, brightness, whiteThresh) {
  let intensity = constrain(map(brightness, whiteThresh, 255, 0, 1), 0, 1);
  let seed = x * 0.1 + y * 0.2;
  
  return {
    x: (noise(seed) - 0.5) * 2 * maxRightwardDisplacement * intensity,
    y: -noise(seed + 100) * maxUpwardDisplacement * intensity
  };
}

function detectEdgeType(sourceImg, x, y, spacing, w, h, whiteThresh) {
  // Check immediate neighbors
  let isEdge = false;
  for (let dy = -spacing; dy <= spacing; dy += spacing) {
    for (let dx = -spacing; dx <= spacing; dx += spacing) {
      if (dx === 0 && dy === 0) continue;
      let neighborBrightness = getAverageBrightness(sourceImg, x + dx, y + dy, spacing, w, h);
      if (neighborBrightness < whiteThresh) {
        isEdge = true;
        break;
      }
    }
    if (isEdge) break;
  }
  
  if (!isEdge) return 'interior';
  
  // Check extended neighbors for outer edge
  let darkCount = 0;
  let extendedRadius = spacing * 2;
  for (let dy = -extendedRadius; dy <= extendedRadius; dy += spacing) {
    for (let dx = -extendedRadius; dx <= extendedRadius; dx += spacing) {
      if (dx === 0 && dy === 0) continue;
      let neighborBrightness = getAverageBrightness(sourceImg, x + dx, y + dy, spacing, w, h);
      if (neighborBrightness < whiteThresh) darkCount++;
    }
  }
  
  return darkCount > 12 ? 'outer' : 'inner';
}

function drawFlameShape(dotImage, props) {
  const SHAPE_THRESHOLD = 0.3;
  const ALPHA = 180;
  
  dotImage.push();
  dotImage.translate(props.centerX, props.centerY);
  dotImage.rotate(radians(props.rotation.angle));
  dotImage.fill(props.fireColor[0], props.fireColor[1], props.fireColor[2], ALPHA);
  dotImage.noStroke();
  
  let magnitude = props.rotation.magnitude;
  
  if (props.edgeType === 'outer' && magnitude > SHAPE_THRESHOLD) {
    drawCrossShape(dotImage, props.radius, magnitude);
  } else if (props.edgeType === 'inner' && magnitude > SHAPE_THRESHOLD) {
    drawTriangleShape(dotImage, props.radius, magnitude);
  } else {
    dotImage.ellipse(0, 0, props.radius * 2.5, props.radius * 2.5);
  }
  
  // Hot core accent
  let intensity = map(props.brightness, 0, 255, 0, 1);
  if (intensity > 0.9) {
    dotImage.fill(255, 255, 255);
    dotImage.ellipse(0, 0, props.radius * 0.3, props.radius * 0.3);
  }
  
  dotImage.pop();
}

function drawCrossShape(graphics, radius, magnitude) {
  let crossSize = radius * (2.5 + magnitude * 1.5);
  let crossWidth = radius * 0.9;
  graphics.rect(-crossWidth / 2, -crossSize / 2, crossWidth, crossSize);
  graphics.rect(-crossSize / 2, -crossWidth / 2, crossSize, crossWidth);
}

function drawTriangleShape(graphics, radius, magnitude) {
  let triangleSize = radius * (2 + magnitude * 1.5);
  let triangleHeight = triangleSize * sqrt(3) / 2;
  graphics.triangle(
    0, -triangleHeight / 2,
    -triangleSize / 2, triangleHeight / 2,
    triangleSize / 2, triangleHeight / 2
  );
}

// ========================================
// COLOR AND BRIGHTNESS UTILITIES
// ========================================

function getFireColor(brightness, threshold, fireBands) {
  if (useAdaptiveFireBands) {
    return getAdaptiveFireColor(brightness, fireBands);
  } else {
    return getFixedFireColor(brightness, threshold);
  }
}

function getAdaptiveFireColor(brightness, fireBands) {
  if (brightness > fireBands.white) return white;
  if (brightness > fireBands.yellowWhite) return yellowWhite;
  if (brightness > fireBands.yellow) return yellow;
  return darkRed;
}

function getFixedFireColor(brightness, threshold) {
  let intensity = constrain(map(brightness, threshold, 255, 0, 1), 0, 1);
  
  if (intensity > whiteThreshold_fire) return white;
  if (intensity > yellowWhiteThreshold) return yellowWhite;
  if (intensity > yellowThreshold) return yellow;
  return darkRed;
}

function getAverageBrightness(img, startX, startY, cellSize, imgWidth, imgHeight) {
  let sum = 0;
  let count = 0;
  
  for (let y = startY; y < startY + cellSize && y < imgHeight; y++) {
    for (let x = startX; x < startX + cellSize && x < imgWidth; x++) {
      let index = (y * imgWidth + x) * 4;
      
      if (index < img.pixels.length) {
        let r = img.pixels[index];
        let g = img.pixels[index + 1];
        let b = img.pixels[index + 2];
        
        // ITU-R BT.601 luminance conversion
        sum += 0.299 * r + 0.587 * g + 0.114 * b;
        count++;
      }
    }
  }
  
  return count > 0 ? sum / count : 0;
}

// ========================================
// ADAPTIVE THRESHOLDING
// ========================================

function computeOtsuThreshold(brightnessValues) {
  let histogram = buildHistogram(brightnessValues);
  let total = brightnessValues.length;
  let sumTotal = computeHistogramSum(histogram);
  
  return findOptimalThreshold(histogram, total, sumTotal);
}

function buildHistogram(brightnessValues) {
  let histogram = new Array(256).fill(0);
  for (let b of brightnessValues) {
    let bin = floor(constrain(b, 0, 255));
    histogram[bin]++;
  }
  return histogram;
}

function computeHistogramSum(histogram) {
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  return sum;
}

function findOptimalThreshold(histogram, total, sumTotal) {
  let sumBackground = 0;
  let weightBackground = 0;
  let maxVariance = 0;
  let threshold = 0;
  
  for (let t = 0; t < 256; t++) {
    weightBackground += histogram[t];
    if (weightBackground === 0) continue;
    
    let weightForeground = total - weightBackground;
    if (weightForeground === 0) break;
    
    sumBackground += t * histogram[t];
    let meanBackground = sumBackground / weightBackground;
    let meanForeground = (sumTotal - sumBackground) / weightForeground;
    
    // Between-class variance
    let variance = weightBackground * weightForeground *
                   pow(meanBackground - meanForeground, 2);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  
  return threshold;
}

function computePercentileThreshold(brightnessValues, percentile) {
  let sorted = brightnessValues.slice().sort((a, b) => a - b);
  let index = floor(percentile * sorted.length);
  index = constrain(index, 0, sorted.length - 1);
  return sorted[index];
}

// ========================================
// SOBEL GRADIENT OPERATOR
// ========================================

function computeImageGradient(img, x, y, cellSize, imgWidth, imgHeight) {
  let offset = cellSize;
  
  // Sample 3x3 neighborhood
  let neighbors = sample3x3Neighborhood(img, x, y, offset, cellSize, imgWidth, imgHeight);
  
  // Apply Sobel operator
  let gx = computeSobelX(neighbors);
  let gy = computeSobelY(neighbors);
  
  // Compute gradient properties
  let magnitude = sqrt(gx * gx + gy * gy);
  let angle = atan2(gy, gx);
  
  return { magnitude, angle, gx, gy };
}

function sample3x3Neighborhood(img, x, y, offset, cellSize, imgWidth, imgHeight) {
  return {
    tl: getAverageBrightness(img, x - offset, y - offset, cellSize, imgWidth, imgHeight),
    tc: getAverageBrightness(img, x, y - offset, cellSize, imgWidth, imgHeight),
    tr: getAverageBrightness(img, x + offset, y - offset, cellSize, imgWidth, imgHeight),
    ml: getAverageBrightness(img, x - offset, y, cellSize, imgWidth, imgHeight),
    mr: getAverageBrightness(img, x + offset, y, cellSize, imgWidth, imgHeight),
    bl: getAverageBrightness(img, x - offset, y + offset, cellSize, imgWidth, imgHeight),
    bc: getAverageBrightness(img, x, y + offset, cellSize, imgWidth, imgHeight),
    br: getAverageBrightness(img, x + offset, y + offset, cellSize, imgWidth, imgHeight)
  };
}

function computeSobelX(n) {
  return (n.tr + 2 * n.mr + n.br) - (n.tl + 2 * n.ml + n.bl);
}

function computeSobelY(n) {
  return (n.bl + 2 * n.bc + n.br) - (n.tl + 2 * n.tc + n.tr);
}
