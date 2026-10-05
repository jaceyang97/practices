# Tribute to Agnes Martin: The Islands

`p83.js` is a procedural tribute to *The Islands* (1961). It draws the canvas ground, graphite, white touches, inset border and narrow photographed support edge algorithmically from a reproducible seed. It loads no reference image, and contains no sampled reference texture or encoded source pixels.

## Documented facts

[Pace Gallery's Agnes Martin page](https://www.pacegallery.com/artists/agnes-martin/) identifies the opening image as **The Islands, 1961**, **oil and graphite on canvas**, **72 × 72 inches / 182.9 × 182.9 cm**. The page and its [2000-pixel image](https://www.pacegallery.com/media/images/21930.width-2000.jpg) were inspected on 2026-10-06. This is the single 1961 painting; it is distinct from the later *Islands I–XII* series.

## Observations and interpretation

These describe Pace's reproduction, not a physical inspection or conservation analysis:

- A warm tan, almost square canvas with a thin irregular white rectangle inset approximately 3–4% from the edges. The photographed narrow brown support edge is also visible.
- The white field occupies roughly the central 64% of the width and 65% of the height. Bright-mark projection and visual inspection gave **64 columns and 97 rows**. The columns form 32 close pairs; the gap between pairs is wider than the gap within each pair.
- The pale touches are small loaded-brush dabs, often rounded rectangular bodies, with changes in height, rim and white coverage. They are not uniform circular dots.
- The graphite lattice extends several empty cells beyond the white field. Lines vary in pressure and placement; the photograph makes the lower/right lattice somewhat fainter.
- Fine vertical dragged material, crossed canvas tooth, discrete tiny deposits and local abrasion are more apparent than broad blurred colour clouds.
- Photograph-only RGB checks, excluding the frame, found a left ground mean near (188,165,135) and an upper empty-ground mean near (191,167,136). These are reproduction-dependent colour observations, not pigment measurements.

The slightly lighter bounded central glaze, three-rule module around each paired column, cloth weave frequency and exact paint layering are **procedural interpretations**. The medium statement documents oil and graphite; it does not verify linen, a particular priming recipe or these layer mechanisms. The very narrow outer rail is a choice to retain the visible photographic presentation, not an attribution of that rail to Martin's painted composition.

## Rendered comparisons and revisions

Four full native renders were made in Chrome with local p5.js 1.7.0. Every pass was inspected as a full view and with matching upper-left, centre, border and lower-right crops. In comparison PNGs the reference is at left and the generated image at right. Crops normalize both images to a 2000 × 2000 comparison plane; the supplied reference is actually 2000 × 1992.

| Render | Observed result and response |
| --- | --- |
| `p83-v1.png` | Geometry and paired rhythm were close, but the ground was too smooth, the lattice too faint and the touches too flat. Enlarged reference crops showed stronger individual tooth and taller, less regular white bodies. |
| `p83-v2.png` | Added discrete tooth, reduced broad colour variation, added a pale central glaze and stronger graphite. Linked grid placement to the pair/row rhythm and increased touch height. Crops revealed that the vertical material field was now too coarse and that some marks looked like small diamonds. |
| `p83-v3.png` | Shifted variation toward finer tooth, gave dabs rounded rectangular bodies with tilt/rim variation, and made the white perimeter slightly thicker with variable pressure and gentle drift. Broad vertical streaks no longer dominated, but the direction of the fine weave needed emphasis and the lower/right lattice remained too strong. |
| `p83-final.png` | Added finer elongated thread variation and a stronger tiny warp signal while reducing broad directional contrast; mixed rounder and squarer dabs; reduced lower/right graphite pressure. Full and matching crops retain the same composition, with a less even painted surface and no smoky tonal cloud layer. Selected result. |

Render times reported by the sketch were approximately **361 ms, 385 ms, 400 ms and 393 ms** for those four exports on this machine. Regeneration QA reported 422 ms. These are local Chrome timings, not a cross-device performance guarantee.

The final remains a tribute rather than a pixel reconstruction: individual graphite deviations, cloth deposits, dab bodies and aged flecks differ. Some generated mark edges and the narrow support rail are more consistent than those in the photograph. The sketch retains the reference's paired column rhythm and fine material direction while creating fresh surfaces.

## Verification and controls

- Native canvas and PNG: **2240 × 2240**, pixel density 1.
- `node --check artworks/p83.js` passed. Headless Chrome reported no JavaScript errors.
- The first canvas context uses `willReadFrequently: true`; the readiness contract is `window.__ARTWORK_READY__`.
- `window.agnesStudy.regenerate(1961)` reproduced the initial PNG byte-for-byte. Seed 1962 changed the surface. Click advanced 1961 → 1962; **R** advanced it to 1963.
- At 320 × 640, 768 × 1024 and 1440 × 900 viewports, CSS fit produced 320, 768 and 900-pixel displays, retained the 2240-pixel native canvas, had no horizontal overflow and preserved the native image hash.
- **S** downloaded `tribute-agnes-martin-the-islands-1961.png`; its bytes matched the current native canvas export.
- Canvas has an image role, descriptive accessible label, keyboard focus and a title identifying this as a tribute.

The default seed is `1961`. Click or R changes only the generated surface; the composition stays fixed. The repeatability and control evidence is saved as `p83-qa.json` beside the full renders and comparison crops in the generative-art workspace's `outputs/agnes-six/` folder. No shared gallery/catalog files were edited in this study.
