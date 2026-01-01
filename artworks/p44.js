/**
 * Practice 44: Replication of Ad Reinhardt's "Abstract Painting" (Black) series
 * 
 * This is a replication of Ad Reinhardt's iconic black paintings from the 1960s,
 * featuring a 6×6 grid of extremely subtle dark gray/black rectangles forming
 * a barely visible cruciform (cross) pattern. The painting requires prolonged
 * viewing to reveal its structure, characteristic of Reinhardt's "last paintings
 * which anyone can make."
 * 
 * Reference: https://www.artforum.com/features/reinhardt-the-purist-blacklash-211527/
 * 
 * Code by Jace Yang
 */

function setup() {
    createCanvas(600, 600);
    pixelDensity(2);
    noLoop();
    noiseSeed(7);
    randomSeed(7);
  }
  
  function draw() {
    background(255);
  
    const PADDING = 30;
  
    const PAINTING_ASPECT_RATIO = 2092 / 2667;
  
    const availableHeight = height - PADDING * 2;
    const PAINTING_HEIGHT = availableHeight;
    const PAINTING_WIDTH = PAINTING_HEIGHT * PAINTING_ASPECT_RATIO;
  
    const PAINTING_X = (width - PAINTING_WIDTH) / 2;
    const PAINTING_Y = PADDING;

    const paper = createGraphics(width, height);
    paper.pixelDensity(2);
    addPaperFrame(paper, PAINTING_X, PAINTING_Y, PAINTING_WIDTH, PAINTING_HEIGHT);
    image(paper, 0, 0);

    const COLS = 6;
    const ROWS = 6;
  
    const cellWidth = PAINTING_WIDTH / COLS;
    const cellHeight = PAINTING_HEIGHT / ROWS;
  
    const CELL_COLORS = {
      0: [21, 21, 21],
      1: [75, 75, 75],
      2: [75, 75, 75],
      3: [75, 75, 75],
      4: [75, 75, 75],
      5: [21, 21, 21],
      6: [21, 21, 21],
      7: [21, 21, 21],
      8: [40, 40, 40],
      9: [40, 40, 40],
      10: [21, 21, 21],
      11: [21, 21, 21],
      12: [86, 86, 86],
      13: [86, 86, 86],
      14: [40, 40, 40],
      15: [40, 40, 40],
      16: [86, 86, 86],
      17: [86, 86, 86],
      18: [86, 86, 86],
      19: [86, 86, 86],
      20: [40, 40, 40],
      21: [40, 40, 40],
      22: [86, 86, 86],
      23: [86, 86, 86],
      24: [21, 21, 21],
      25: [21, 21, 21],
      26: [40, 40, 40],
      27: [40, 40, 40],
      28: [21, 21, 21],
      29: [21, 21, 21],
      30: [21, 21, 21],
      31: [75, 75, 75],
      32: [75, 75, 75],
      33: [75, 75, 75],
      34: [75, 75, 75],
      35: [21, 21, 21],
    };
  
    const base = mkLayer();
    const mult = mkLayer();  // MULTIPLY overlays
    const soft = mkLayer();  // SOFT_LIGHT overlays

    // draw base blocks
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = PAINTING_X + col * cellWidth;
        const y = PAINTING_Y + row * cellHeight;
        const id = row * COLS + col;

        const rgb = CELL_COLORS[id];
        const w = col === COLS - 1 ? PAINTING_X + PAINTING_WIDTH - x : cellWidth + 0.5;
        const h = row === ROWS - 1 ? PAINTING_Y + PAINTING_HEIGHT - y : cellHeight + 0.5;

        paintRect(base, x, y, w, h, rgb, id);
      }
    }

    const cfg = {
      px: PAINTING_X, py: PAINTING_Y,
      cw: cellWidth, ch: cellHeight,
      cols: COLS, rows: ROWS,
      colors: CELL_COLORS
    };

    // overlays
    addSeamShadow(mult, cfg);
    addEdgeSmear(mult, cfg);
    addScanBands(mult, PAINTING_X, PAINTING_Y, PAINTING_WIDTH, PAINTING_HEIGHT);
    addVignette(mult, PAINTING_X, PAINTING_Y, PAINTING_WIDTH, PAINTING_HEIGHT);
    addScratches(mult, PAINTING_X, PAINTING_Y, PAINTING_WIDTH, PAINTING_HEIGHT);

    addSeamRidgeSoft(soft, cfg);
    addTextureSoft(soft, PAINTING_X, PAINTING_Y, PAINTING_WIDTH, PAINTING_HEIGHT);

    // composite
    image(base, 0, 0);
    blit(mult, MULTIPLY, 150);
    blit(soft, SOFT_LIGHT, 255);
  }
  
  // ------------------------------
  // Helpers
  // ------------------------------

  function mkLayer() {
    const g = createGraphics(width, height);
    g.pixelDensity(2);
    return g;
  }

  function blit(g, mode, alpha = 255) {
    blendMode(mode);
    if (alpha !== 255) tint(255, alpha);
    image(g, 0, 0);
    noTint();
    blendMode(BLEND);
  }

  function forEachBoundary(cfg, fn) {
    const { px, py, cw, ch, cols, rows, colors } = cfg;

    // vertical boundaries
    for (let c = 1; c < cols; c++) {
      const bx = px + c * cw;
      for (let r = 0; r < rows; r++) {
        const a = colors[r * cols + (c - 1)];
        const b = colors[r * cols + c];
        if (sameRGB(a, b)) continue;

        const y0 = py + r * ch;
        const y1 = y0 + ch;

        const la = lum(a), lb = lum(b);
        fn({ o: "v", bx, y0, y1, c, r, diff: abs(la - lb), dir: lb > la ? 1 : -1 });
      }
    }

    // horizontal boundaries
    for (let r = 1; r < rows; r++) {
      const by = py + r * ch;
      for (let c = 0; c < cols; c++) {
        const a = colors[(r - 1) * cols + c];
        const b = colors[r * cols + c];
        if (sameRGB(a, b)) continue;

        const x0 = px + c * cw;
        const x1 = x0 + cw;

        const la = lum(a), lb = lum(b);
        fn({ o: "h", by, x0, x1, c, r, diff: abs(la - lb), dir: lb > la ? 1 : -1 });
      }
    }
  }

  // ------------------------------
  // Texture helpers
  // ------------------------------
  
  function paintRect(g, x, y, w, h, rgb, cellNumber) {
    // Small per-cell drift so blocks do not feel like flat UI fills
    const lum = (rgb[0] + rgb[1] + rgb[2]) / 3;
    const drift = map(noise(lum * 0.07), 0, 1, -8, 8);
  
    const r = constrain(rgb[0] + drift, 0, 255);
    const gg = constrain(rgb[1] + drift, 0, 255);
    const b = constrain(rgb[2] + drift, 0, 255);
  
    // Base fill
    g.noStroke();
    g.fill(r, gg, b);
    g.rect(x, y, w, h);
  
    // Clip to the rect, then draw streaks and subtle blotches
    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  
    // Dry-brush streaks with direction (wide = horizontal, tall = vertical)
    g.strokeCap(SQUARE);

    const vertical = (rgb[0] === 40 && rgb[1] === 40 && rgb[2] === 40);
    const streakCount = 70;

    for (let i = 0; i < streakCount; i++) {
    const a = random(5, 14);
    const darker = random() < 0.65;

    const dr = darker ? r - random(10, 22) : r + random(4, 10);
    const dg = darker ? gg - random(10, 22) : gg + random(4, 10);
    const db = darker ? b - random(10, 22) : b + random(4, 10);

    g.stroke(constrain(dr, 0, 255), constrain(dg, 0, 255), constrain(db, 0, 255), a);
    g.strokeWeight(random(0.5, 1.4));

    if (vertical) {
        const xx = x + random(w);
        const wobble = random(-2, 2);
        g.line(xx, y - 5, xx + wobble, y + h + 5);
    } else {
        const yy = y + random(h);
        const wobble = random(-2, 2);
        g.line(x - 5, yy, x + w + 5, yy + wobble);
    }
    }

    // A few soft blotches (uneven paint coverage)
    g.strokeWeight(1);
    for (let i = 0; i < 2200; i++) {
      const px = x + random(w);
      const py = y + random(h);
    
      // Low-frequency field so it forms cloudy patches
      const n = noise(px * 0.008, py * 0.008, 13.7 + cellNumber * 0.07);
    
      const delta = map(n, 0, 1, -18, 18);
      const a = map(n, 0, 1, 2, 10);
    
      g.stroke(
        constrain(r + delta, 0, 255),
        constrain(gg + delta, 0, 255),
        constrain(b + delta, 0, 255),
        a
      );
      g.point(px, py);
    }
    ctx.restore();
  }
  
  function addMottling(g, x, y, w, h) {
    g.clear();
    g.noStroke();
  
    const step = 2; // bigger step = smoother + faster, smaller = more detail
  
    // Two-scale noise: big clouds + smaller variation
    const f1 = 0.0022; // big
    const f2 = 0.0100; // small
  
    for (let yy = y; yy < y + h; yy += step) {
      for (let xx = x; xx < x + w; xx += step) {
        const nx = xx - x;
        const ny = yy - y;
  
        const n1 = noise(nx * f1, ny * f1, 3.1);
        const n2 = noise(nx * f2, ny * f2, 7.7);
  
        // Weighted blend, centered so SOFT_LIGHT has real effect
        const n = 0.75 * n1 + 0.25 * n2;
  
        // Push away from 128 so it actually shows up under SOFT_LIGHT
        const val = map(n, 0, 1, 55, 210);
        const a = map(n1, 0, 1, 10, 34); // alpha driven mostly by the big field
  
        g.fill(val, a);
        g.rect(xx + random(-0.6, 0.6), yy + random(-0.6, 0.6), step, step);
      }
    }
  
    g.filter(BLUR, 2);
  }

  function addTextureSoft(g, x, y, w, h) {
    addMottling(g, x, y, w, h);
    addGrain(g, x, y, w, h);
  }
  
  function addGrain(g, x, y, w, h) {
    g.loadPixels();

    const x0 = floor(x), y0 = floor(y);
    const x1 = floor(x + w), y1 = floor(y + h);

    const sigma = 18;     // grain strength (try 14..26)
    const mix = 0.35;     // how much grain mixes into existing tex
    const alphaBoost = 18; // keeps it visible under SOFT_LIGHT

    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) {
        const idx = 4 * (yy * g.width + xx);

        // existing tex pixel (already has mottling)
        const r0 = g.pixels[idx + 0];
        const g0 = g.pixels[idx + 1];
        const b0 = g.pixels[idx + 2];
        const a0 = g.pixels[idx + 3];

        // neutral-centered grain
        const gv = constrain(128 + randomGaussian() * sigma, 0, 255);

        g.pixels[idx + 0] = lerp(r0, gv, mix);
        g.pixels[idx + 1] = lerp(g0, gv, mix);
        g.pixels[idx + 2] = lerp(b0, gv, mix);
        g.pixels[idx + 3] = min(255, a0 + alphaBoost);
      }
    }

    // Dust (don't erase mottling, just punch a few pixels)
    const dustCount = floor(w * h * 0.0020);
    for (let i = 0; i < dustCount; i++) {
      const xx = floor(x + random(w));
      const yy = floor(y + random(h));
      const idx = 4 * (yy * g.width + xx);

      const dark = random() < 0.75;
      const v = dark ? 0 : 255;

      g.pixels[idx + 0] = v;
      g.pixels[idx + 1] = v;
      g.pixels[idx + 2] = v;
      g.pixels[idx + 3] = min(255, g.pixels[idx + 3] + (dark ? 70 : 45));
    }

    g.updatePixels();
  }
  
  function addVignette(g, x, y, w, h) {
    g.clear();
  
    const ctx = g.drawingContext;
  
    // Radial vignette centered on painting
    const cx = x + w * 0.5;
    const cy = y + h * 0.5;
    const r0 = min(w, h) * 0.25;
    const r1 = min(w, h) * 0.85;
  
    const grad = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
    grad.addColorStop(0.0, "rgba(0,0,0,0.00)");
    grad.addColorStop(1.0, "rgba(0,0,0,0.35)");
  
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function sameRGB(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  function lum(rgb) {
    return (rgb[0] + rgb[1] + rgb[2]) / 3;
  }


  function addPaperFrame(g, px, py, pw, ph) {
    // Slightly warm paper, not pure white
    g.background(252);

    // Paper grain using noise (no random)
    g.strokeWeight(1);
    for (let y = 0; y < g.height; y += 2) {
      for (let x = 0; x < g.width; x += 2) {
        const n = noise(x * 0.03, y * 0.03, 41.7);
        const v = constrain(246 + (n - 0.5) * 22, 235, 255);
        const a = 16;
        g.stroke(v, a);
        g.point(x, y);

        // Sparse dust specks from thresholded noise
        const d = noise(x * 0.12, y * 0.12, 99.3);
        if (d > 0.988) {
          g.stroke(0, 55);
          g.point(x, y);
        }
      }
    }

    // Soft shadow around the painting rectangle (photo feel)
    const ctx = g.drawingContext;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    g.noStroke();
    g.fill(255);
    g.rect(px, py, pw, ph);

    ctx.restore();

    // Subtle edge darkening on the paper itself
    const grad = ctx.createRadialGradient(
      g.width * 0.5, g.height * 0.5, min(g.width, g.height) * 0.25,
      g.width * 0.5, g.height * 0.5, min(g.width, g.height) * 0.95
    );
    grad.addColorStop(0.0, "rgba(0,0,0,0.00)");
    grad.addColorStop(1.0, "rgba(0,0,0,0.10)");

    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, g.width, g.height);
    ctx.restore();

    g.filter(BLUR, 0.6);
  }



  function addScanBands(g, x, y, w, h) {
    g.clear();
    g.noStroke();

    const bandH = 3;          // band thickness
    const freq = 0.014;       // smaller = slower bands

    // Horizontal banding: darken in uneven strips
    for (let yy = y; yy < y + h; yy += bandH) {
      const n = noise(yy * freq, 12.3);
      const a = map(n, 0, 1, 0, 14);   // alpha for darkening

      // no chunking
      g.fill(0, a * random(0.6, 1.2));
      g.rect(x, yy + random(-0.6, 0.6), w, bandH + 0.6);
    }

    // a few faint vertical scratches
    g.stroke(0, 18);
    for (let i = 0; i < 10; i++) {
      const xx = x + random(w);
      g.strokeWeight(random(0.6, 1.1));
      g.line(xx, y, xx + random(-2, 2), y + h);
    }

    g.filter(BLUR, 0.8);
  }

  function addSeamShadow(g, cfg) {
    g.clear();
    g.strokeCap(SQUARE);
    g.noFill();

    const step = 6;

    forEachBoundary(cfg, (b) => {
      const aBase = map(b.diff, 0, 70, 8, 30);

      if (b.o === "v") {
        for (let y = b.y0; y < b.y1; y += step) {
          const n = noise(b.c * 0.9, b.r * 0.7, y * 0.02);
          const j = map(n, 0, 1, -0.9, 0.9);

          g.stroke(0, aBase * random(0.7, 1.1));
          g.strokeWeight(random(0.7, 1.3));

          g.line(b.bx + j - 0.6, y, b.bx + j - 0.6, y + step);
          if (random() < 0.55) g.line(b.bx + j + 0.6, y, b.bx + j + 0.6, y + step);
        }
      } else {
        for (let x = b.x0; x < b.x1; x += step) {
          const n = noise(b.c * 0.6, b.r * 0.8, x * 0.02);
          const j = map(n, 0, 1, -0.9, 0.9);

          g.stroke(0, aBase * random(0.7, 1.1));
          g.strokeWeight(random(0.7, 1.2));

          g.line(x, b.by + j - 0.5, x + step, b.by + j - 0.5);
          if (random() < 0.55) g.line(x, b.by + j + 0.5, x + step, b.by + j + 0.5);
        }
      }
    });

    g.filter(BLUR, 1.2);
  }

  function addEdgeSmear(g, cfg) {
    g.strokeCap(SQUARE);

    const step = 6;

    forEachBoundary(cfg, (b) => {
      const aBase = map(b.diff, 0, 70, 8, 22);

      if (b.o === "v") {
        for (let y = b.y0; y < b.y1; y += step) {
          const n = noise(b.c * 0.7, b.r * 0.9, y * 0.03);
          const j = map(n, 0, 1, -1.3, 1.3);

          // bleed into lighter side
          g.stroke(0, aBase * random(0.6, 1.1));
          g.strokeWeight(random(0.8, 1.8));
          const bleed = random(2, 10) * b.dir;
          g.line(b.bx + j, y, b.bx + j + bleed, y + random(-0.8, 0.8));

          // grime cross
          if (random() < 0.55) {
            g.stroke(0, aBase * random(0.5, 1.0));
            g.strokeWeight(random(0.7, 1.6));
            const cross = random(2, 8) * (random() < 0.5 ? -1 : 1);
            g.line(b.bx + j, y, b.bx + j + cross, y + random(-0.8, 0.8));
          }
        }
      } else {
        for (let x = b.x0; x < b.x1; x += step) {
          const n = noise(b.c * 0.8, b.r * 0.6, x * 0.03);
          const j = map(n, 0, 1, -1.2, 1.2);

          g.stroke(0, aBase * random(0.6, 1.1));
          g.strokeWeight(random(0.8, 1.6));
          const bleed = random(2, 8) * b.dir;
          g.line(x, b.by + j, x + random(-0.8, 0.8), b.by + j + bleed);

          if (random() < 0.55) {
            g.stroke(0, aBase * random(0.5, 1.0));
            g.strokeWeight(random(0.7, 1.4));
            const cross = random(2, 8) * (random() < 0.5 ? -1 : 1);
            g.line(x, b.by + j, x + random(-0.8, 0.8), b.by + j + cross);
          }
        }
      }
    });

    g.filter(BLUR, 1.6);
  }

  function addSeamRidgeSoft(g, cfg) {
    g.clear();
    g.strokeCap(SQUARE);

    const step = 10;
    const maxLen = 26;

    forEachBoundary(cfg, (b) => {
      if (b.diff < 4) return;

      const darkA = map(b.diff, 0, 65, 6, 22);
      const lightA = map(b.diff, 0, 65, 2, 12);

      if (b.o === "v") {
        for (let y = b.y0; y < b.y1; y += step) {
          if (random() < 0.35) continue;

          const len = random(10, maxLen);
          const jit = random(-1.2, 1.2);

          g.stroke(0, darkA);
          g.strokeWeight(random(1.0, 2.2));
          g.line(b.bx + b.dir * 1.2, y + jit, b.bx + b.dir * 1.2, min(b.y1, y + len) + jit);

          g.stroke(255, lightA);
          g.strokeWeight(random(0.8, 1.8));
          g.line(b.bx - b.dir * 0.9, y + jit, b.bx - b.dir * 0.9, min(b.y1, y + len) + jit);
        }
      } else {
        for (let x = b.x0; x < b.x1; x += step) {
          if (random() < 0.35) continue;

          const len = random(10, maxLen);
          const jit = random(-1.2, 1.2);

          g.stroke(0, darkA);
          g.strokeWeight(random(1.0, 2.0));
          g.line(x + jit, b.by + b.dir * 1.2, min(b.x1, x + len) + jit, b.by + b.dir * 1.2);

          g.stroke(255, lightA);
          g.strokeWeight(random(0.8, 1.6));
          g.line(x + jit, b.by - b.dir * 0.9, min(b.x1, x + len) + jit, b.by - b.dir * 0.9);
        }
      }
    });

    g.filter(BLUR, 1);
  }

  function addScratches(g, x, y, w, h) {
    g.clear();

    const ctx = g.drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Dust specks
    g.strokeWeight(1);
    const dust = floor(w * h * 0.0009); // tweak 0.0005..0.0016
    for (let i = 0; i < dust; i++) {
      const px = x + random(w);
      const py = y + random(h);
      g.stroke(0, random(12, 55));
      g.point(px, py);
    }

    // A few hairline scratches
    g.strokeCap(SQUARE);
    for (let i = 0; i < 18; i++) {
      const vertical = random() < 0.7;
      g.stroke(0, random(6, 18));
      g.strokeWeight(random(0.6, 1.2));

      if (vertical) {
        const xx = x + random(w);
        const y0 = y + random(-0.1 * h, 0.2 * h);
        const y1 = y + h + random(-0.2 * h, 0.1 * h);
        g.line(xx, y0, xx + random(-2, 2), y1);
      } else {
        const yy = y + random(h);
        const x0 = x + random(-0.1 * w, 0.2 * w);
        const x1 = x + w + random(-0.2 * w, 0.1 * w);
        g.line(x0, yy, x1, yy + random(-2, 2));
      }
    }

    // Make them feel embedded, not drawn-on-top
    g.filter(BLUR, 0.8);

    ctx.restore();
  }
  