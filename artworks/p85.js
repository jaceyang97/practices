/**
 * Title: Tribute to Agnes Martin: With My Back to the World
 * Practice 85 — after Agnes Martin, 1997.
 * Synthetic polymer paint on canvas; six panels, each 152.4 cm square.
 * https://artbooks.artcanada.com/agnes-martin/key-works/with-my-back-to-the-world
 *
 * Six individually painted procedural canvases retain the order, band rhythms
 * and white gutters of the supplied reproduction. Colours and proportions are
 * observations of that reproduction, not a physical analysis of the paintings.
 * No images, sampled textures or reference pixel maps are loaded at runtime.
 * Click / R resurfaces all six panels; S saves the native 3360 × 2240 PNG.
 */

const WORLD85 = {
  width: 3360,
  height: 2240,
  side: 1024,
  seed: 1997,
  panels: [
    {
      x: 64, y: 56,
      // Two identical four-bar schemes; the touching blue bars meet in graphite.
      stops: [0, .110, .247, .381, .5, .617, .751, .890, 1],
      colours: [[209,217,225],[226,218,192],[228,227,188],[212,219,227],
        [211,219,227],[222,217,192],[227,225,186],[203,211,219]],
      graphite: [.5], light: 1.0, paint: 1.00,
    },
    {
      x: 1168, y: 56,
      stops: [0, .049, .229, .288, .468, .527, .709, .766, .946, 1],
      colours: [[193,209,226],[230,230,186],[195,209,222],[229,229,185],
        [199,211,222],[230,230,187],[202,212,221],[231,231,188],[198,207,217]],
      graphite: [], light: .7, paint: .90,
    },
    {
      x: 2272, y: 56,
      stops: [0, .124, .290, .415, .583, .710, .880, 1],
      colours: [[185,198,211],[227,221,191],[187,201,216],[227,221,190],
        [179,196,212],[224,219,189],[172,192,211]],
      graphite: [], light: 1.1, paint: 1.12,
    },
    {
      x: 64, y: 1160,
      stops: [0, .230, .472, .532, .773, 1],
      colours: [[194,203,212],[229,226,191],[237,238,234],[195,207,221],[229,227,191]],
      graphite: [], light: .8, paint: 1.05,
    },
    {
      x: 1168, y: 1160,
      stops: [0, .053, .142, .231, .292, .380, .469, .530, .619, .711, .771, .860, .952, 1],
      colours: [[234,226,201],[238,234,195],[207,214,226],[232,223,194],
        [239,236,196],[203,212,228],[230,223,198],[239,236,195],
        [200,210,226],[228,222,198],[234,231,190],[193,206,224],[227,222,203]],
      graphite: [], light: 1.0, paint: .86,
    },
    {
      x: 2272, y: 1160,
      stops: [0, .067, .281, .497, .714, .930, 1],
      colours: [[234,234,206],[210,216,225],[197,210,228],
        [208,217,227],[192,208,225],[235,235,203]],
      graphite: [], light: .6, paint: .86,
    },
  ],
};

let world85Canvas;
let world85Seed = WORLD85.seed;
let world85Random;

function setup() {
  pixelDensity(1);
  // The first canvas uses the same CPU raster path as subsequent regenerations.
  const sheet = document.createElement('canvas');
  sheet.getContext('2d', { willReadFrequently: true });
  world85Canvas = createCanvas(WORLD85.width, WORLD85.height, P2D, sheet);
  (document.querySelector('main') || document.body).appendChild(sheet);
  sheet.setAttribute('role', 'img');
  sheet.tabIndex = 0;
  sheet.setAttribute('aria-label', 'Tribute to Agnes Martin: With My Back to the World, 1997. Six square canvases in two rows of three, each with a distinct rhythm of pale blue, yellow and warm cream horizontal bands. Click or press R for another painted surface; press S to save all six panels.');
  sheet.title = 'Tribute to Agnes Martin: With My Back to the World · 1997 · Click / R: new surface · S: save';
  sheet.style.display = 'block';
  sheet.style.margin = 'auto';
  world85Fit();
  noLoop();
}

function draw() {
  const started = performance.now();
  window.__ARTWORK_READY__ = false;
  world85Random = world85Rng(world85Seed);
  background(255);
  WORLD85.panels.forEach((panel, index) => world85PaintPanel(panel, index));
  window.agnesStudy = {
    seed: world85Seed,
    renderMs: Math.round(performance.now() - started),
    regenerate: (seed = world85Seed + 1) => {
      world85Seed = Number(seed) >>> 0;
      window.__ARTWORK_READY__ = false;
      redraw();
    },
  };
  window.__ARTWORK_READY__ = true;
}

function world85Rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

// A field of short horizontal paint ribbons. Each ribbon has a bounded extent,
// individual drag and bristle loss rather than a soft circular noise cloud.
function world85Ribbons(side) {
  const columns = 48, rows = 210;
  const values = new Float32Array(columns * rows);
  for (let y = 0; y < rows; y++) {
    let carry = (world85Random() - .5) * 2;
    for (let x = 0; x < columns; x++) {
      carry = carry * .68 + (world85Random() - .5) * .65;
      values[y * columns + x] = carry;
    }
  }
  const field = new Float32Array(side * side);
  for (let y = 0; y < side; y++) {
    const row = Math.min(rows - 1, Math.floor(y / side * rows));
    for (let x = 0; x < side; x++) {
      const fx = x / side * (columns - 1), ix = Math.floor(fx);
      const a = values[row * columns + ix];
      const b = values[row * columns + Math.min(columns - 1, ix + 1)];
      field[y * side + x] = a + (b - a) * (fx - ix);
    }
  }
  return field;
}

function world85PaintPanel(panel, index) {
  const side = WORLD85.side;
  const ctx = drawingContext;
  const image = ctx.createImageData(side, side);
  const pixels = image.data;
  const ribbons = world85Ribbons(side);
  const warp = new Float32Array(side);
  const weft = new Float32Array(side);
  for (let x = 0; x < side; x++) warp[x] = Math.sin(x * 2.31 + index * .73) * .42 + (world85Random() - .5) * .55;
  for (let y = 0; y < side; y++) weft[y] = Math.sin(y * 2.27 + index * .62) * .37 + (world85Random() - .5) * .50;
  const edges = panel.stops.map((stop, boundary) => {
    const edge = new Float32Array(side);
    for (let x = 0; x < side; x++) {
      const u = x / side;
      edge[x] = stop * side + (boundary && boundary < panel.stops.length - 1 ?
        .46 * Math.sin(u * 8.2 + boundary * 1.2 + index) + .22 * Math.sin(u * 36 + boundary * 2.7) : 0);
    }
    return edge;
  });
  for (let y = 0; y < side; y++) {
    const v = y / side;
    let nominalBand = 0;
    while (nominalBand < panel.colours.length - 1 && y + .5 >= panel.stops[nominalBand + 1] * side) nominalBand++;
    for (let x = 0; x < side; x++) {
      const u = x / side;
      let band = nominalBand;
      if (band && y + .5 < edges[band][x]) band--;
      else if (band < panel.colours.length - 1 && y + .5 >= edges[band + 1][x]) band++;
      let base = panel.colours[band];
      // Subpixel paint coverage avoids hard pixel stair steps at ruled edges.
      const above = band ? y + .5 - edges[band][x] : Infinity;
      const below = band < panel.colours.length - 1 ? edges[band + 1][x] - y - .5 : Infinity;
      if (above < .65 || below < .65) {
        const neighbour = panel.colours[above < below ? band - 1 : band + 1];
        const mix = .5 * (1 - Math.min(above, below) / .65);
        base = base.map((value, channel) => value + (neighbour[channel] - value) * mix);
      }
      const grain = (world85Random() - .5) * 6.5;
      const tooth = warp[x] + weft[y];
      const pigment = ribbons[y * side + x] * 1.35 * panel.paint;
      // Restrained illumination and opacity differences remain inside a band.
      const light = (u - .5) * panel.light * 2 + Math.sin(u * 5.1 + index) * .7;
      const drag = .18 * Math.sin(v * 42 + index * .6) + .13 * Math.sin(v * 156 + u * 2);
      const tone = grain + tooth + pigment + light + drag;
      const i = (y * side + x) * 4;
      pixels[i] = base[0] + tone;
      pixels[i + 1] = base[1] + tone * .96;
      pixels[i + 2] = base[2] + tone * .86;
      pixels[i + 3] = 255;
    }
  }
  ctx.putImageData(image, panel.x, panel.y);
  ctx.save();
  ctx.translate(panel.x, panel.y);
  ctx.beginPath();
  ctx.rect(0, 0, side, side);
  ctx.clip();
  world85DryBrush(panel);
  panel.graphite.forEach(stop => world85Graphite(stop * side, index));
  ctx.restore();
}

function world85DryBrush(panel) {
  const ctx = drawingContext, side = WORLD85.side;
  // Thin transparent brush passes have definite edges, shallow overlaps and
  // sparse bristle breaks. They never cover the composition in mist.
  for (let pass = 0; pass < 780; pass++) {
    const x = world85Random() * side, y = world85Random() * side;
    let band = 0;
    while (band < panel.colours.length - 1 && y >= panel.stops[band + 1] * side) band++;
    const bottom = panel.stops[band + 1] * side;
    const length = 18 + world85Random() * 140;
    const thickness = Math.min(bottom - y, .6 + world85Random() * 4.5);
    const light = world85Random() < .52;
    ctx.fillStyle = light ? `rgba(255,252,232,${.007 + world85Random() * .014})` : `rgba(142,145,133,${.005 + world85Random() * .010})`;
    ctx.fillRect(x, y, length, thickness);
    for (let bristle = 0; bristle < 5; bristle++) {
      ctx.fillStyle = light ? 'rgba(255,253,237,.016)' : 'rgba(155,155,146,.009)';
      ctx.fillRect(x + world85Random() * length * .25, y + world85Random() * thickness, length * (.2 + world85Random() * .6), .25 + world85Random() * .45);
    }
  }
  // Small bounded pigment fragments break up the remaining long brush drag.
  // Their ragged corners and directional footprint remain discrete at 1:1.
  for (let i = 0; i < 6500; i++) {
    const x = world85Random() * side, y = world85Random() * side;
    let band = 0;
    while (band < panel.colours.length - 1 && y >= panel.stops[band + 1] * side) band++;
    const base = panel.colours[band];
    const shift = world85Random() < .5 ? 24 : -24;
    const length = 2 + world85Random() * 17;
    const h = Math.min(panel.stops[band + 1] * side - y, 1 + world85Random() * 7);
    ctx.fillStyle = `rgba(${base[0] + shift},${base[1] + shift},${base[2] + shift},${.024 + world85Random() * .050})`;
    ctx.beginPath();
    ctx.moveTo(x, y + h * .16);
    ctx.lineTo(x + length * .26, y);
    ctx.lineTo(x + length, y + h * .31);
    ctx.lineTo(x + length * .84, y + h * .87);
    ctx.lineTo(x + length * .17, y + h);
    ctx.closePath();
    ctx.fill();
  }
  // Much fainter vertical dry threads recall stretched canvas under thin paint.
  for (let i = 0; i < 320; i++) {
    const x = world85Random() * side, y = world85Random() * side;
    ctx.fillStyle = world85Random() < .5 ? 'rgba(250,251,237,.020)' : 'rgba(135,144,145,.018)';
    ctx.fillRect(x, y, .4 + world85Random() * .5, 8 + world85Random() * 58);
  }
}

function world85Graphite(y, index) {
  const ctx = drawingContext;
  for (let x = 0; x < WORLD85.side; x += 8) {
    const pressure = .12 + world85Random() * .085;
    ctx.strokeStyle = `rgba(113,120,121,${pressure})`;
    ctx.lineWidth = .52 + world85Random() * .24;
    const a = y + .22 * Math.sin(x * .021 + index);
    const b = y + .22 * Math.sin((x + 8) * .021 + index);
    ctx.beginPath();
    ctx.moveTo(x, a);
    ctx.lineTo(Math.min(x + 8.3, WORLD85.side), b);
    ctx.stroke();
  }
}

function world85Fit() {
  const availableWidth = Math.max(1, window.innerWidth - 24);
  const availableHeight = Math.max(1, window.innerHeight - 48);
  const displayWidth = Math.min(1600, availableWidth, availableHeight * WORLD85.width / WORLD85.height);
  world85Canvas.elt.style.width = `${displayWidth}px`;
  world85Canvas.elt.style.height = `${displayWidth * WORLD85.height / WORLD85.width}px`;
  document.body.style.background = '#fff';
}

function windowResized() { world85Fit(); }
function mousePressed(event) {
  if (event?.target !== world85Canvas.elt) return;
  world85Seed++;
  window.__ARTWORK_READY__ = false;
  redraw();
}
function keyPressed() {
  if (key === 'r' || key === 'R') {
    world85Seed++;
    window.__ARTWORK_READY__ = false;
    redraw();
  }
  if (key === 's' || key === 'S') saveCanvas(world85Canvas, `with-my-back-to-the-world-${world85Seed}`, 'png');
}
