# Tribute to Agnes Martin: Untitled (1960)

Procedural p5.js study after Whitney accession **81.30**, object **2125**. Every mark and paper pixel is generated; the sketch does not load, sample, or trace a reference image at runtime.

## Documented work

- **Title / date:** *Untitled*, 1960.
- **Medium:** pen and ink and graphite on paper.
- **Dimensions:** sheet, irregular, 12 × 9⅜ inches (30.5 × 23.8 cm); image, 8 × 8 inches (20.3 × 20.3 cm).
- **Accession:** 81.30.
- **Primary source:** [Whitney Museum of American Art, collection object 2125](https://whitney.org/collection/works/2125), checked 2026-10-06.

The supplied reproduction measures 1562 × 1600 pixels and shows an almost-square paper area within a narrow gray surround. This appearance differs from the museum's recorded sheet ratio. The study retains the supplied photograph's crop and proportions; it does not claim to reconstruct the full physical sheet. The gray surround records the reproduction's presentation, rather than a medium of the drawing.

## Observations of the reproduction

- Seven narrow columns filled with short horizontal rules, crossed by a thin vertical spine. The rules occupy about two-thirds of each column pitch, leaving pronounced pale gaps between the columns.
- Three long internal transverse lines create four tall tiers. The middle transverse line inclines downward toward the right more than the other two.
- Three nested perimeter structures, with independent line overruns and slightly displaced corners. The outer left structure has two close vertical lines.
- Roughly 142–147 short rules per column in this study. Counts were estimated from the reproduction; softened edges and intersections make a unique count uncertain. The first and last columns have their own pacing; the middle columns begin with a denser upper rhythm.
- Narrow, warm brown-black ink cores, slight changes of pressure, small endpoint catches and occasional accumulated ink. The geometry remains restrained rather than visibly wavy.
- Warm ivory paper with fine grain, small inclusions and faint graphite construction rails, most visible around the outside columns. Clear graphite fragments are generated separately from the ink.

The composition is specified in source-image proportions. Line geometry uses a fixed seed; paper, ink pressure, pores and incidental marks use the selected surface seed. Click / R therefore changes the material without reorganizing the drawing.

## Actual render and comparison passes, 2026-10-06

All passes rendered in Chrome using local p5.js 1.7.0. Full PNGs are **2240 × 2295**; CSS fits the canvas into the viewport without resampling its stored native raster. Three matched regions were inspected: upper-left columns `(140,150)–(500,510)`, center `(680,670)–(1060,1050)` and lower-right corner `(1200,1300)–(1520,1560)`, expressed in reference-image pixels.

| Pass | Inspection and refinement |
| --- | --- |
| v1, 327 ms | Seven-column composition and nested borders were close. The upper-left and center crops revealed overly even spacing, uniform stroke ends, pale border intersections and a too-clean graphite rail. The lower first-column bars were too symmetric around their spine. |
| v2, 376 ms | Added independent first/last-column tier bounds, denser pacing at the top of the middle columns, asymmetric bar drift, smaller stroke sampling intervals, darker warm ink, variable pressure, sparse nib catches and small ink deposits at selected corners. Crops showed convincing short-rule texture, but some pressure changes were too bumpy and long borders still too light. |
| final, 375 ms | Reduced local pressure noise, strengthened the independent long border strokes and increased the distinct narrow graphite fragments at the outside columns. Inspected the final matching three-region comparison. Selected this pass: the paper stays quiet, ink detail remains sharp, and the tier/column rhythm matches the reproduction at display scale. |

Local evidence is in `C:\Users\Jace\Documents\ChatGPT\生成艺术\outputs\agnes-six\`: `p82-reference.jpg`, `p82-v1.png`, `p82-v2.png`, `p82-final.png`, three crop sets, `p82-comparison-final.png`, display screenshots, `p82-qa.cjs` and `p82-qa.json`.

This is a procedural tribute, not a pixel-identical facsimile or conservation analysis. Ink and paper colors describe the reproduction's appearance, including its lighting and color processing.

## Verification

- JavaScript syntax check passes; Chrome reports no runtime errors.
- Regenerating seed `1960` after seed `1961` produces the identical raster hash. A different seed changes the raster.
- Click increments the seed; keyboard **R** increments it again.
- Keyboard **S** produces a full-resolution PNG byte-identical to the selected final export when seed `1960` is restored.
- Viewports 320 × 700, 768 × 900 and 1440 × 1000 retain the complete canvas with no horizontal overflow. Native dimensions remain 2240 × 2295.
- The CPU canvas context uses `willReadFrequently` from its creation, avoiding a rasterization change after readbacks.
- Canvas has an accessible description, focusability, and a *Tribute to Agnes Martin* title.

## Controls / integration contract

- Click the paper or press **R**: another material surface.
- Press **S**: save the complete native raster.
- `window.__ARTWORK_READY__`: false during drawing, true after all layers complete.
- `window.agnesStudy`: `{ seed, renderMs, regenerate(seed) }`.
- `window.agnesStudy.regenerate(1960)`: restore the selected surface.
