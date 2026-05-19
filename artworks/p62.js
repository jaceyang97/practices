/**
 * Practice 62 — DAC · Digital Access Card
 *
 * Replica of a generative icon set seen as "[DAC — DIGITAL ACCESS CARD]".
 *
 * Each badge is a layered concentric stack assembled from a small parts
 * library. Layers, back-to-front:
 *   1. dark disc                                (constant)
 *   2. four outer corner glyphs                 ({plus, cross, dash, square})
 *   3. big background shape                     ({quatrefoil, plusCross, bigX, hexagon, square})
 *   4. four inner corner glyphs (optional)      (same library, smaller)
 *   5. mid frame shape                          ({square, hexagon, triangle, octagon})
 *   6. inner colored square                     (small rounded square)
 *   7. tiny center marker                       (mini cross)
 * Each shape and color is independently drawn from a constrained palette
 * so adjacent layers contrast. Click GENERATE to re-roll the 4×3 grid.
 *
 * Code by Jace Yang
 */

const W = 950;
const H = 1180;
const COLS = 3;
const ROWS = 4;

const C = {
  bg:          '#000000',
  disc:        '#1B1B1B',
  lime:        '#C8F500',
  purple:      '#5828FF',
  magenta:     '#FF1B98',
  orange:      '#FB451C',
  lightBlue:   '#A8DDEB',
  lavender:    '#B69EF0',
  yellow:      '#F4E32A',
  slate:       '#3F4F69',
  lightGray:   '#B0B0B0',
  midGray:     '#5C5C5C',
  darkGray:    '#2B2B2B',
  almostBlack: '#161616',
};

const BIG_SHAPES = ['quatrefoil', 'plusCross', 'bigX', 'hexagon', 'square'];
const MID_SHAPES = ['square', 'hexagon', 'triangle', 'octagon'];
const GLYPHS     = ['plus', 'cross', 'dash', 'square'];

const BRIGHT          = ['lime', 'purple', 'magenta', 'orange', 'lightBlue', 'lavender', 'slate'];
const BIG_COLORS      = [...BRIGHT, 'lightGray', 'darkGray'];
const OUTER_GLYPH_COL = ['lightGray', 'lightBlue', 'lavender', 'orange', 'purple', 'magenta', 'midGray'];
const CENTER_COL      = ['orange', 'purple', 'magenta', 'yellow', 'lime'];
const INNER_SQ_COL    = [...BRIGHT, 'lightGray', 'almostBlack'];

let icons = [];

let btnRect = null; // on-canvas GENERATE button

function setup() {
  createCanvas(W, H);
  noLoop();
  reroll();
}

function mousePressed() {
  if (!btnRect) return;
  const { x, y, w, h } = btnRect;
  if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
    reroll();
  }
}

function reroll() {
  icons = [];
  for (let i = 0; i < COLS * ROWS; i++) icons.push(randomIcon());
  redraw();
}

function randomIcon() {
  const big      = random(BIG_SHAPES);
  const bigColor = random(BIG_COLORS);

  const bigIsDark = bigColor === 'darkGray' || bigColor === 'midGray' || bigColor === 'almostBlack';
  const mid       = random(MID_SHAPES);
  const midColor  = bigIsDark
    ? random([...BRIGHT, 'lightGray'])
    : random(['darkGray', 'lightGray', 'midGray', 'almostBlack']);

  const innerColor  = random(INNER_SQ_COL);
  const centerColor = random(CENTER_COL);

  const cornerGlyph = random(GLYPHS);
  const cornerColor = random(OUTER_GLYPH_COL);

  const hasInner        = random() < 0.55;
  const innerGlyph      = hasInner ? random(GLYPHS) : null;
  const innerGlyphColor = hasInner
    ? random(['darkGray', 'midGray', 'purple', 'orange', 'magenta', 'almostBlack', 'lightGray'])
    : null;

  return {
    big, bigColor, mid, midColor,
    innerColor, centerColor,
    cornerGlyph, cornerColor,
    innerGlyph, innerGlyphColor,
  };
}

function draw() {
  background(C.bg);

  const labelHeight = 50;
  const marginX = 40;
  const marginY = 40;
  const cellW = (W - marginX * 2) / COLS;
  const cellH = (H - marginY * 2 - labelHeight) / ROWS;
  const discSize = min(cellW, cellH) * 0.78;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = marginX + cellW * c + cellW / 2;
      const cy = marginY + cellH * r + cellH / 2;
      drawIcon(icons[r * COLS + c], cx, cy, discSize);
    }
  }

  // caption
  noStroke();
  fill(C.lightGray);
  textFont('monospace');
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text('[DAC — DIGITAL ACCESS CARD]', marginX, H - 18);

  // GENERATE button (top-right of canvas)
  const bw = 140, bh = 36;
  const bx = W - marginX - bw;
  const by = 20;
  btnRect = { x: bx, y: by, w: bw, h: bh };
  noFill();
  stroke(C.lime);
  strokeWeight(1);
  rect(bx, by, bw, bh);
  noStroke();
  fill(C.lime);
  textAlign(CENTER, CENTER);
  textSize(12);
  text('▶ GENERATE', bx + bw / 2, by + bh / 2 + 1);
}

function drawIcon(icon, cx, cy, size) {
  push();
  translate(cx, cy);
  noStroke();

  // 1. disc
  fill(C.disc);
  circle(0, 0, size);

  // 2. outer corner glyphs (just inside disc perimeter)
  drawFourGlyphs(icon.cornerGlyph, C[icon.cornerColor], size * 0.36, size * 0.075);

  // 3. big shape
  drawBigShape(icon.big, C[icon.bigColor], size * 0.62);

  // 4. inner corner glyphs on big shape (optional)
  if (icon.innerGlyph) {
    drawFourGlyphs(icon.innerGlyph, C[icon.innerGlyphColor], size * 0.21, size * 0.045);
  }

  // 5. mid shape
  drawMidShape(icon.mid, C[icon.midColor], size * 0.30);

  // 6. inner small colored square
  rectMode(CENTER);
  fill(C[icon.innerColor]);
  rect(0, 0, size * 0.13, size * 0.13, size * 0.012);

  // 7. tiny center marker (cross)
  fill(C[icon.centerColor]);
  const t = size * 0.011;
  const m = size * 0.05;
  rect(0, 0, m, t);
  rect(0, 0, t, m);

  pop();
}

function drawBigShape(shape, color, size) {
  fill(color);
  noStroke();
  rectMode(CENTER);

  switch (shape) {
    case 'quatrefoil': {
      const r = size * 0.50;
      const d = size * 0.27;
      circle(-d, -d, r);
      circle( d, -d, r);
      circle(-d,  d, r);
      circle( d,  d, r);
      break;
    }
    case 'plusCross': {
      const sq  = size * 0.38;
      const off = size * 0.28;
      const rd  = sq * 0.20;
      rect(-off, 0, sq, sq, rd);
      rect( off, 0, sq, sq, rd);
      rect(0, -off, sq, sq, rd);
      rect(0,  off, sq, sq, rd);
      break;
    }
    case 'bigX': {
      push();
      rotate(PI / 4);
      const len = size * 1.05;
      const thk = size * 0.24;
      rect(0, 0, len, thk, thk * 0.08);
      rect(0, 0, thk, len, thk * 0.08);
      pop();
      break;
    }
    case 'hexagon': {
      drawPolygon(size * 0.55, 6, -PI / 2);
      break;
    }
    case 'square': {
      rect(0, 0, size * 0.95, size * 0.95, size * 0.05);
      break;
    }
  }
}

function drawMidShape(shape, color, size) {
  fill(color);
  noStroke();
  rectMode(CENTER);

  switch (shape) {
    case 'square':
      rect(0, 0, size * 1.0, size * 1.0, size * 0.05);
      break;
    case 'hexagon':
      drawPolygon(size * 0.62, 6, -PI / 2);
      break;
    case 'triangle': {
      const r = size * 0.72;
      triangle(0, -r, r * 0.866, r * 0.5, -r * 0.866, r * 0.5);
      break;
    }
    case 'octagon':
      drawPolygon(size * 0.62, 8, PI / 8);
      break;
  }
}

function drawPolygon(r, n, start) {
  beginShape();
  for (let i = 0; i < n; i++) {
    const a = start + i * TWO_PI / n;
    vertex(cos(a) * r, sin(a) * r);
  }
  endShape(CLOSE);
}

function drawFourGlyphs(glyph, color, radius, glyphSize) {
  // diagonals point inward (mirrored across each quadrant) for dash glyph
  const positions = [
    { x: -radius, y: -radius, dashAngle:  PI / 4 },  // top-left   "\"
    { x:  radius, y: -radius, dashAngle: -PI / 4 },  // top-right  "/"
    { x: -radius, y:  radius, dashAngle: -PI / 4 },  // bot-left   "/"
    { x:  radius, y:  radius, dashAngle:  PI / 4 },  // bot-right  "\"
  ];
  for (const p of positions) drawGlyph(glyph, p.x, p.y, glyphSize, color, p.dashAngle);
}

function drawGlyph(type, x, y, s, color, dashAngle) {
  push();
  translate(x, y);
  rectMode(CENTER);
  noStroke();
  fill(color);
  const t = s * 0.22;
  switch (type) {
    case 'plus':
      rect(0, 0, s, t);
      rect(0, 0, t, s);
      break;
    case 'cross':
      push();
      rotate(PI / 4);
      rect(0, 0, s, t);
      rect(0, 0, t, s);
      pop();
      break;
    case 'dash':
      push();
      rotate(dashAngle);
      rect(0, 0, s * 1.0, t);
      pop();
      break;
    case 'square':
      rect(0, 0, s * 0.7, s * 0.7);
      break;
  }
  pop();
}
