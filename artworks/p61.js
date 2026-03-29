/**
 * Practice 61 — Converging Grid
 *
 * Replica of work by Pixel Symphony
 * https://x.com/Pixel0Symphony/status/2037172789166432692
 *
 * A 17x17 grid where cells and gaps compress toward the center.
 * Directional inward borders grow thicker near the center.
 * Cell fills fade toward the bottom-left corner.
 *
 * Code by Jace Yang
 */

function setup() {
  createCanvas(1000, 1000);
  noLoop();
}

function draw() {
  background('#EFEBE0');

  let cols = 17;
  let margin = width * 0.05;
  let maxGap = width * 0.008;
  let minFactor = 0.15;
  let center = (cols - 1) / 2;
  let borderWeight = 5;
  let fillBorder = 2;
  let fb = fillBorder / 2;

  // --- Grid layout ---

  // Gaps shrink toward center
  let hGaps = [], vGaps = [];
  for (let i = 0; i < cols - 1; i++) {
    let dist = Math.abs((i + 0.5) - center) / center;
    let g = maxGap * (0.15 + 0.85 * dist);
    hGaps.push(g);
    vGaps.push(g);
  }

  let totalHGap = hGaps.reduce((a, b) => a + b, 0);
  let totalVGap = vGaps.reduce((a, b) => a + b, 0);
  let availableW = width - margin * 2 - totalHGap;
  let availableH = height - margin * 2 - totalVGap;

  // Cell sizes: full at edges, smallest at center (quadratic for flat center)
  let wFactors = [], hFactors = [];
  for (let i = 0; i < cols; i++) {
    let dist = Math.abs(i - center) / center;
    let f = minFactor + (1 - minFactor) * Math.pow(dist, 2);
    wFactors.push(f);
    hFactors.push(f);
  }

  let wSum = wFactors.reduce((a, b) => a + b, 0);
  let widths = wFactors.map(f => f * availableW / wSum);
  let hSum = hFactors.reduce((a, b) => a + b, 0);
  let heights = hFactors.map(f => f * availableH / hSum);

  // Cumulative positions
  let xPos = [margin], yPos = [margin];
  for (let i = 1; i < cols; i++) {
    xPos.push(xPos[i - 1] + widths[i - 1] + hGaps[i - 1]);
    yPos.push(yPos[i - 1] + heights[i - 1] + vGaps[i - 1]);
  }

  // --- Cell fills (fade toward bottom-left, height only) ---

  function smoothstep(x) { return x * x * (3 - 2 * x); }

  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      let topFrac = (cols - 1 - r) / (cols - 1);
      let rightFrac = c / (cols - 1);
      let fillFrac = smoothstep(smoothstep(Math.min(topFrac * 1.2 + rightFrac, 1)));
      let fh = fillFrac * heights[r];
      if (fh <= 0.5) continue;

      let fx = xPos[c], fy = yPos[r] + heights[r] - fh, fw = widths[c];
      noStroke(); fill('#D4D8E3');
      rect(fx, fy, fw, fh);

      noFill(); stroke(83, 129, 215, 217); strokeWeight(fillBorder);
      rect(fx + fb, fy + fb, fw - fillBorder, fh - fillBorder);
    }
  }

  // --- Inward borders (grow toward center) ---

  noFill();
  stroke(83, 129, 215, 217);
  strokeCap(SQUARE);

  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      let x = xPos[c], y = yPos[r], w = widths[c], h = heights[r];
      let rF = 1 - Math.abs(r - center) / center;
      let cF = 1 - Math.abs(c - center) / center;
      let frac = 0.08 + 0.12 * rF + 0.12 * cF + 0.68 * rF * cF;

      let hB = frac * h, hh = hB / 2;
      let vB = frac * w, vh = vB / 2;

      if (r <= center) { strokeWeight(hB); line(x, y + hh, x + w, y + hh); }
      if (r >= center) { strokeWeight(hB); line(x, y + h - hh, x + w, y + h - hh); }
      if (c <= center) { strokeWeight(vB); line(x + vh, y, x + vh, y + h); }
      if (c >= center) { strokeWeight(vB); line(x + w - vh, y, x + w - vh, y + h); }
    }
  }
}

function windowResized() {
  resizeCanvas(1000, 1000);
  redraw();
}
