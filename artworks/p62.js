/**
 * Practice 62 — DAC · Digital Access Card
 *
 * Replica of a generative icon set seen as "[DAC — DIGITAL ACCESS CARD]".
 *
 * Each badge is a layered concentric stack. Layers, back-to-front:
 *   1. dark disc
 *   2. glyph layer 1 — 4 outer marks inside the disc edge
 *   3. big background shape  (quatrefoil / plusCross / bigX / hexagon /
 *                             square / fan4)
 *   4. glyph layer 2 — 4 marks at the big shape "corners"
 *   5. mid shape            (square / hexagon / triangle / octagon),
 *                            size & rotation picked for an intentional
 *                            geometric relationship with the big shape
 *   6. glyph layer 3 — 4 marks at the mid shape "corners"
 *   7. chip plate           (small rounded square)
 *   8. chip                 (smaller nested square)
 *   9. glyph layer 4 — single center marker
 *
 * Each of the four glyph layers picks independently from the same glyph
 * list. L1 is forced to contrast with the big shape so the outer ring is
 * always legible; inner-layer color collisions are tolerated. All polygon
 * shapes have rounded corners. Click GENERATE to re-roll.
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

const BIG_SHAPES = ['quatrefoil', 'plusCross', 'bigX', 'hexagon', 'square', 'fan4'];
const MID_SHAPES = ['square', 'hexagon', 'triangle', 'octagon'];
const GLYPHS     = ['plus', 'cross', 'dashFwd', 'dashBack', 'square', 'dot'];

const BRIGHT       = ['lime', 'purple', 'magenta', 'orange', 'lightBlue', 'lavender', 'slate'];
const BIG_COLORS   = [...BRIGHT, 'lightGray', 'darkGray'];
const ON_DARK      = ['lightGray', 'lightBlue', 'lavender', 'orange', 'magenta', 'lime', 'yellow'];
const ON_BRIGHT    = ['darkGray', 'midGray', 'almostBlack', 'lightGray'];
const CENTER_COL   = ['orange', 'purple', 'magenta', 'yellow', 'lime'];
const INNER_SQ_COL = [...BRIGHT, 'lightGray', 'almostBlack'];

const DARK_SET = new Set(['darkGray', 'midGray', 'almostBlack', 'slate']);
const isDark = c => DARK_SET.has(c);

// Mid-shape size as a fraction of disc diameter, indexed by big × mid.
// Values are picked so the mid shape sits in a specific geometric
// relationship with the big shape:
//   hexagon × hexagon  : inner hex's vertices touch outer hex's edges
//                        (with the 30° rotation below — star of David)
//   hexagon × triangle : triangle inscribed in the hexagon's apothem circle
//   square  × square   : diamond inscribed in the outer square (45° rot)
//   square  × hexagon  : hex inscribed in the square (R = half-side)
//   square  × triangle : equilateral triangle inscribed in the square
//   bigX    × *        : kept tight so the X's central crossing reads
//   quatrefoil / plusCross / fan4 : mid fits the central negative space
const MID_SIZE = {
  quatrefoil: { square: 0.30, hexagon: 0.30, triangle: 0.34, octagon: 0.28 },
  plusCross:  { square: 0.28, hexagon: 0.27, triangle: 0.30, octagon: 0.25 },
  bigX:       { square: 0.22, hexagon: 0.22, triangle: 0.24, octagon: 0.20 },
  hexagon:    { square: 0.34, hexagon: 0.42, triangle: 0.38, octagon: 0.32 },
  square:     { square: 0.38, hexagon: 0.40, triangle: 0.40, octagon: 0.36 },
  fan4:       { square: 0.30, hexagon: 0.28, triangle: 0.32, octagon: 0.26 },
};

// Mid-shape rotation in radians, indexed by big × mid. Used when a rotation
// completes a mathematical nesting: hexagon-in-hexagon rotated 30° gives
// the star-of-David relationship; square-in-square rotated 45° gives a
// diamond inscribed in the outer square.
const MID_ROT = {
  hexagon: { hexagon: Math.PI / 6 },
  square:  { square: Math.PI / 4 },
};

let icons = [];
let btnRect = null;

function setup() {
  createCanvas(W, H);
  noLoop();
  reroll();
}

function mousePressed() {
  if (!btnRect) return;
  const { x, y, w, h } = btnRect;
  if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) reroll();
}

function reroll() {
  icons = [];
  for (let i = 0; i < COLS * ROWS; i++) icons.push(randomIcon());
  redraw();
}

function randomIcon() {
  const big      = random(BIG_SHAPES);
  const bigColor = random(BIG_COLORS);
  const bigDark  = isDark(bigColor);

  const mid      = random(MID_SHAPES);
  const midColor = bigDark
    ? random([...BRIGHT, 'lightGray'])
    : random(['darkGray', 'midGray', 'almostBlack', 'lightGray']);
  const midDark  = isDark(midColor);

  const innerColor = random(INNER_SQ_COL);
  const chipColor  = random([...BRIGHT, 'darkGray', 'almostBlack', 'lightGray']);

  // L1 must visibly contrast with the big shape — it sits closest to the
  // viewer's eye and an exact color collision on the outermost ring makes
  // the glyphs disappear. Inner-layer collisions are tolerable.
  const g1Pool = ON_DARK.filter(c => c !== bigColor);
  const g1 = random(GLYPHS); const g1Color = random(g1Pool.length ? g1Pool : ON_DARK);
  const g2 = random(GLYPHS); const g2Color = bigDark ? random(ON_DARK) : random(ON_BRIGHT);
  const g3 = random(GLYPHS); const g3Color = midDark ? random(ON_DARK) : random(ON_BRIGHT);
  const g4 = random(GLYPHS); const g4Color = random(CENTER_COL);

  return {
    big, bigColor, mid, midColor,
    innerColor, chipColor,
    g1, g1Color, g2, g2Color, g3, g3Color, g4, g4Color,
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

  noStroke();
  fill(C.lightGray);
  textFont('monospace');
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text('[DAC — DIGITAL ACCESS CARD]', marginX, H - 18);

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

  // 2. Layer 1 — 4 outermost glyphs, clearly inside the disc.
  //    drawFourGlyphs uses (±r, ±r), so diagonal distance from center is
  //    r·√2. r ≤ 0.28 keeps the glyph (size 0.075) safely inside the disc.
  drawFourGlyphs(icon.g1, C[icon.g1Color], size * 0.28, size * 0.075);

  // 3. big shape
  drawBigShape(icon.big, C[icon.bigColor], size * 0.66);

  // 4. Layer 2 — 4 marks on the big shape
  drawFourGlyphs(icon.g2, C[icon.g2Color], size * 0.18, size * 0.045);

  // 5. mid shape — sized & rotated per MID_SIZE / MID_ROT so it nests in
  //    the big shape with an intentional geometric relationship.
  const midSizeFrac = MID_SIZE[icon.big][icon.mid];
  const midRot      = (MID_ROT[icon.big] && MID_ROT[icon.big][icon.mid]) || 0;
  push();
  rotate(midRot);
  drawMidShape(icon.mid, C[icon.midColor], size * midSizeFrac);
  pop();

  // 6. Layer 3 — 4 marks on the mid shape
  drawFourGlyphs(icon.g3, C[icon.g3Color], size * 0.095, size * 0.024);

  // 7. chip plate
  rectMode(CENTER);
  fill(C[icon.innerColor]);
  rect(0, 0, size * 0.135, size * 0.135, size * 0.020);

  // 7b. nested chip
  fill(C[icon.chipColor]);
  rect(0, 0, size * 0.072, size * 0.072, size * 0.010);

  // 8. Layer 4 — single center marker
  drawGlyph(icon.g4, 0, 0, size * 0.045, C[icon.g4Color]);

  pop();
}

function drawBigShape(shape, color, size) {
  fill(color);
  noStroke();
  rectMode(CENTER);

  switch (shape) {
    case 'quatrefoil': {
      const r = size * 0.60;
      const d = size * 0.25;
      circle(-d, -d, r);
      circle( d, -d, r);
      circle(-d,  d, r);
      circle( d,  d, r);
      break;
    }
    case 'plusCross': {
      const sq  = size * 0.46;
      const off = size * 0.24;
      const rd  = sq * 0.32;
      rect(-off, 0, sq, sq, rd);
      rect( off, 0, sq, sq, rd);
      rect(0, -off, sq, sq, rd);
      rect(0,  off, sq, sq, rd);
      break;
    }
    case 'bigX': {
      push();
      rotate(PI / 4);
      const len = size * 1.00;
      const thk = size * 0.26;
      rect(0, 0, len, thk, thk * 0.5);
      rect(0, 0, thk, len, thk * 0.5);
      pop();
      break;
    }
    case 'hexagon': {
      drawRoundedPolygon(size * 0.55, 6, -PI / 2, color, 0.18);
      break;
    }
    case 'square': {
      rect(0, 0, size * 0.86, size * 0.86, size * 0.10);
      break;
    }
    case 'fan4': {
      // 4 elliptical petals in a + pattern. Horizontal pair top/bottom,
      // vertical pair left/right. Offset & axis lengths chosen so adjacent
      // petals leave a dark gap (the petals do not overlap), and the outer
      // extent (off + longAxis/2 = 0.525 of size) is similar to the
      // other big shapes.
      const off       = size * 0.30;
      const longAxis  = size * 0.45;
      const shortAxis = size * 0.25;
      ellipse(0, -off, longAxis,  shortAxis);
      ellipse(0,  off, longAxis,  shortAxis);
      ellipse(-off, 0, shortAxis, longAxis);
      ellipse( off, 0, shortAxis, longAxis);
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
      rect(0, 0, size * 1.05, size * 1.05, size * 0.16);
      break;
    case 'hexagon':
      drawRoundedPolygon(size * 0.68, 6, -PI / 2, color, 0.22);
      break;
    case 'triangle':
      drawRoundedPolygon(size * 0.82, 3, -PI / 2, color, 0.26);
      break;
    case 'octagon':
      drawRoundedPolygon(size * 0.66, 8, PI / 8, color, 0.18);
      break;
  }
}

// Rounded n-gon: draw a slightly smaller polygon, then expand outward with
// a thick same-color stroke whose ROUND joins create the corner rounding.
function drawRoundedPolygon(r, n, start, color, roundRatio) {
  const strokeW = r * roundRatio;
  const innerR  = r - strokeW / 2;
  fill(color);
  stroke(color);
  strokeJoin(ROUND);
  strokeWeight(strokeW);
  beginShape();
  for (let i = 0; i < n; i++) {
    const a = start + i * TWO_PI / n;
    vertex(cos(a) * innerR, sin(a) * innerR);
  }
  endShape(CLOSE);
  noStroke();
}

function drawFourGlyphs(glyph, color, radius, glyphSize) {
  const positions = [
    { x: -radius, y: -radius },
    { x:  radius, y: -radius },
    { x: -radius, y:  radius },
    { x:  radius, y:  radius },
  ];
  for (const p of positions) drawGlyph(glyph, p.x, p.y, glyphSize, color);
}

function drawGlyph(type, x, y, s, color) {
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
    case 'dashFwd':
      push();
      rotate(-PI / 4);
      rect(0, 0, s, t);
      pop();
      break;
    case 'dashBack':
      push();
      rotate(PI / 4);
      rect(0, 0, s, t);
      pop();
      break;
    case 'square':
      rect(0, 0, s * 0.7, s * 0.7);
      break;
    case 'dot':
      circle(0, 0, s * 0.65);
      break;
  }
  pop();
}
