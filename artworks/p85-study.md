# Tribute to Agnes Martin: With My Back to the World

Procedural study of the entire six-panel *With My Back to the World* (1997), with the supplied reproduction's three-column, two-row arrangement retained.

## Documented work

- **Artist / title / date:** Agnes Martin, *With My Back to the World*, 1997.
- **Medium:** synthetic polymer paint on canvas.
- **Format / dimensions:** six panels, each 152.4 × 152.4 cm.
- **Collection credit:** the Art Canada Institute page credits the Ovitz Family Collection, Los Angeles, with a fractional and promised gift to the Museum of Modern Art, New York. This is the source's credit, rather than an independent verification of present ownership.
- **Source:** [Art Canada Institute, Christopher Régimbal, *Agnes Martin: Life & Work*, “With My Back to the World”](https://artbooks.artcanada.com/agnes-martin/key-works/with-my-back-to-the-world), checked 2026-10-06. The saved local HTML was a 403 response, so the actual page was retrieved separately for the facts above.
- The source describes six related but distinct canvases shown as one work. It specifies the first canvas's repeated four-bar scheme and central graphite line, and the second canvas's four wide yellow bars alternating with five narrow blue bars.

## Observations of the supplied reproduction

These are observations of the 1980 × 1335 reproduction, not measurements or colour readings of the physical paintings:

- White outer space and white gutters separate six nearly square canvases. The procedural rendering uses six exactly square 1024 px panels in a 3360 × 2240 image, retaining the 3 × 2 arrangement and approximately the same relative spacing.
- Upper left: pale blue, warmer cream/orange and light yellow repeat in two halves. The adjacent middle blue bands meet at a faint graphite rule.
- Upper centre: four broad, subdued yellow bars alternate with five much narrower blue bars.
- Upper right: four wider blue bars alternate with three warm cream bars. Its cream is less lemon-coloured than the upper-centre yellow, and the lower blue bars are slightly deeper.
- Lower left: two broad blue areas and two broad yellow areas surround one narrow off-white bar.
- Lower centre: four blue bars alternate with a repeating narrow warm-cream / slightly wider pale-yellow pair; warm cream also appears at the top and bottom.
- Lower right: narrow yellow ends bracket four wide blue bands, alternating lighter grey-blue and somewhat stronger blue.
- The surface is quiet: faint directional drag, mixed fine paint irregularities, thin canvas tooth and restrained changes in opacity. It is neither uniformly flat nor covered by smoky broad noise.
- Palette estimates and band proportions informed small sets of colour and geometry constants. No reference pixel array or sampled texture is embedded in the program.

## Procedural construction

Each panel has a separate configuration of band stops, colours, material strength and light variation. Rendering uses thin generated horizontal ribbons, restrained bounded brush glazes, ragged small pigment fragments, faint vertical dry threads and fine warp/weft tooth. The central graphite rule is segmented with small pressure changes. Subpixel colour coverage keeps band edges from acquiring hard pixel stair steps.

All six surfaces regenerate together, while the panel order, layout and band rhythms remain fixed. No image is loaded by the sketch at runtime. The native resolution is retained when the browser window changes; CSS alone fits the whole work into the viewport.

## Rendered comparisons and refinement

All passes were rendered by Chrome using p5.js 1.7.0, exported at native resolution and inspected as full compositions. Every panel was also compared to its reference crop at matching display scale; native procedural crops were inspected separately. Evidence is in `C:\Users\Jace\Documents\ChatGPT\生成艺术\outputs\agnes-six\`, with only `p85-` filenames owned by this study.

| Pass | Actual inspection and change |
| --- | --- |
| `p85-v1.png` | The six distinct schemes and spacing were recognizable, but repetitive horizontal streaks dominated the paint. Close comparisons showed several boundary offsets and slightly lightened palettes. |
| `p85-v2.png` | Reduced ribbon amplitude from 3.6 to 1.35, cut long-glaze opacity by about 60%, reduced broad periodic drag, strengthened fine grain and added small ragged pigment fragments. Adjusted observed band heights and individual colours. All six matching-scale comparisons showed a quieter surface and clearer separation of warm cream from yellow. |
| `p85-final.png` | Kept the selected second-pass material and composition, then added subpixel paint coverage at band boundaries to reduce visible raster stair steps. Native resolution remains 3360 × 2240. |

Selected export: `C:\Users\Jace\Documents\ChatGPT\生成艺术\outputs\agnes-six\p85-final.png`. `p85-v1-crop-comparison-1.png` through `-6.png` and the corresponding `p85-v2-` files record the reference/render comparisons. `p85-v2-panel-comparison-1.png` through `-6.png` record complete individual panels. The reference occupies the left side of these comparisons.

## Verification

- JavaScript syntax check passes; Chrome reported no runtime errors.
- Default seed 1997 renders in approximately 0.44 seconds on the local QA machine. `window.__ARTWORK_READY__` switches from false to true for each completed render, and `window.agnesStudy` exposes the current seed, render time and `regenerate(seed)`.
- Restoring seed 1997 produces an identical PNG hash to the first render. Seed 2000 changes material samples in every panel.
- Canvas click advances to seed 1998, and focused **R** advances to 1999.
- Widths 320, 768, 1024 and 1440 were checked: the entire work fits, there is no horizontal overflow, the 3360 × 2240 native canvas stays intact, and resizing leaves the pixel hash unchanged.
- The actual **S** download is a 3360 × 2240 PNG and its bytes match the canvas export. The canvas has an accessible description, image role, keyboard focus and a Tribute title.
- The canvas requests `willReadFrequently` before p5 initialization so initial and regenerated renders use the same CPU raster path.
- Local evidence: `p85-qa.cjs`, `p85-qa.json`, `p85-qa-save.png` and `p85-qa-320.png` / `768.png` / `1024.png` / `1440.png`.

## Controls and limits

- Click the work or focus it and press **R** to generate another surface.
- Press **S** to download all six panels at native resolution.
- `window.agnesStudy.regenerate(1997)` restores the selected surface.

This is a procedural tribute to one reproduction. The photograph's colour processing and lighting cannot establish the exact original hues, and generated paint fragments do not reproduce particular marks. The construction retains the complete work's panel relationships and visible material cues without claiming a pixel-identical or conservation-grade reconstruction.
