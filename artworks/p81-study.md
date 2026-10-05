# Tribute to Agnes Martin: The Lamp

Procedural p5.js study after *The Lamp* (1959). All paint, canvas texture, circles and marks are calculated in JavaScript. The source reproduction is used only for offline visual comparison, never loaded by the sketch.

## Documented work

- **Artist / title / date:** Agnes Martin, *The Lamp*, 1959.
- **Medium:** oil on canvas.
- **Dimensions:** 32 × 32 inches, 81.3 × 81.3 cm.
- **Primary source:** [Christie's, lot 6438935](https://www.christies.com/en/lot/lot-6438935), including the reverse inscription and medium/dimensions. The lot essay describes twenty-four golden circles in a grid on a black square, with a painted white border.
- The photograph does not establish particular pigment chemistry, gilding, or an exact layer order. The study's warm ochre colour and thin-looking black film are visual interpretations of that photograph.

## Reference observations

The local primary-source image is 3200 × 3171 pixels. For comparison, an approximate crop of the physical canvas, `(150,117)` through `(3090,3060)`, was resized to 2240 square. This removes the auction photograph's white studio surround and cast shadow. The painted white border remains part of the artwork.

- Six columns and four rows of near-round ochre circles. Centres follow a stable rhythm but spacing and individual row alignment differ slightly. The last row is closer to the preceding row than the earlier row intervals.
- Circle contours remain essentially circular, with subtle flattening, unequal widths/heights and short ragged paint interruptions. They are not regularly lobed polygons.
- The ochre is matte and shows a strong close canvas weave. A narrow grey-green edge surrounds many circles. These are observations of the reproduction, not an assertion that the actual work exposes bare canvas there.
- The black field is warm and dark, with canvas relief, short directional scuffs, isolated light flecks and paint deposits. Its visible changes should come chiefly from crisp small material marks, with limited low-frequency tonal variation.
- The white border is slightly grey/yellow, particularly toward the left/top in the photograph. Photography and aging cannot be separated from the reproduced colours.

Two fixed sampled areas of the normalized reproduction gave approximate mean RGB / channel deviation: black field `(38,37,35)` / about `6`, and an inner first-circle area `(134,115,90)` / about `13`. The selected procedural surface is approximately `(38,37,35)` / `6` and `(136,117,92)` / `14` in the same areas. These figures helped constrain colour and fine texture; they do not prove material equivalence.

## Actual rendering iterations, 2026-10-06

Each version was rendered by Chrome with local p5.js 1.7.0 at **2240 × 2240**. Full images and fixed-location comparisons were inspected; these were revisions to the actual procedural code rather than proposed adjustments.

| Version | Visible result and next change |
| --- | --- |
| 1 | Recognizable layout, but circles were too lobed and angular. Both circle texture and black grain were too faint; the black read as a smooth dark wash. |
| 2 | Reduced contour harmonics, strengthened grain and the cool circle rims, reduced broad black shading and adjusted the border tone. Native crops still showed very orderly dotted weave and soft small-scale mottling. |
| 3 | Added fine material variation, uneven fibre phases and discrete pigment fragments/scratches. Full and crop views revealed an over-coarse quilted texture; increasing noise alone did not improve fidelity. |
| 4 | Replaced the dotted weave with alternating horizontal/vertical yarn crossings and restrained the fine smooth field. The circle contour became near-round. Crops showed that the yarn highlights were too small and regularly spaced; the overall ochre was slightly too dark. |
| 5 | Broadened the yarn knuckles, introduced local thread drift/thickness, added sparse shallow deposits inside the circles and corrected the dark/ochre means. Selected composition and material balance. The texture remains more uniform than the reference's worn cloth. |
| 6 | Added a few brighter isolated fibre deposits and thin dry brush drags along the inner left/bottom black boundary. Selected final, seed **1959**. Full image and first-circle native comparison were inspected again after verification. |

QA outputs live in `C:\Users\Jace\Documents\ChatGPT\生成艺术\outputs\agnes-six\`:

- `p81-v1.png` through `p81-v6.png`, and the corresponding display screenshots.
- `p81-v1-compare.png`, `p81-v2-compare.png` through `p81-v5-compare.png`, plus fixed first-circle and ground crop comparisons.
- **Selected export:** `p81-final.png`.
- **Selected comparison:** `p81-final-compare.png` and `p81-final-detail-compare.png`.
- `p81-verification.json` records the browser/control checks; `p81-verify.cjs` is the local verification harness.

## Implementation and verification

The native canvas is 2240 square with pixel density 1. CSS changes its display size. The first 2D context is created with `willReadFrequently`, so initial and later renderings use the same rasterization path.

Separate procedural scales produce painted-ground variation, visible yarn crossings, thread drift, pixel grain, sharply edged dry brush fragments and scratches. Low-frequency shading has deliberately limited amplitude. Circle centres and core contour parameters remain fixed; seed changes alter the paint surface and microscopic edge interruptions.

Browser verification passed:

- Native canvas remains 2240 × 2240 at viewport widths **320, 768 and 1440**; no horizontal overflow.
- Seed 1959 renders byte-identical PNGs before/after rendering a different seed.
- A different seed changes the surface. Clicking advances to seed 1960; **R** advances to 1961.
- **S** downloads `the-lamp-1959.png`, byte-identical to the verified 2240-square canvas PNG.
- Accessible canvas description and title are present.
- `window.__ARTWORK_READY__` brackets each render; `window.agnesStudy` exposes `seed`, `renderMs` and `regenerate(seed)`.
- `node --check` passes; Chrome reports no runtime errors. Final measured render time was about **0.7 seconds** on this machine.

## Limits

The result preserves the painting's main spacing, near-round shapes, warm circles, narrow painted border and dark woven surface. The generated weave and deposits remain more even than the physical work's worn fibres and irregular paint handling. The circle rims approximate a visible photographic cue; they are not a reconstruction of the oil layer chemistry. The white border is not a simulation of the photographed canvas's depth, and the studio shadow/surround is omitted. No source pixels or sampled bitmap texture appear in the rendering code.

## Controls

- **Click / R:** next procedural surface while retaining composition.
- **S:** save the full 2240 × 2240 canvas.
- `window.agnesStudy.regenerate(1959)` restores the selected surface.
