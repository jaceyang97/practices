# Tribute to Agnes Martin: Starlight

`p84.js` is a fully procedural study after *Starlight* (1963). Its watercolor ground, pigment fragments, paper tooth and interrupted ink lattice are generated from a reproducible seed. It does not load a reference photograph or texture at runtime, and it does not trace individual marks from source pixels.

## Documented work

- **Artist / title / date:** Agnes Martin, *Starlight*, 1963.
- **Medium:** watercolor and ink on paper.
- **Documented sheet dimensions:** 11¾ × 10½ inches (29.8 × 26.7 cm.).
- **Inscriptions recorded by the source:** signed and titled “starlight a martin” at the lower edge; signed again and dated “a. martin 1963” on the backing board.
- **Primary source:** [Christie's, lot 5147496](https://www.christies.com/en/lot/lot-5147496). The locally saved source page was checked for the title, medium, date and dimensions.

The documented sheet is taller than it is wide: width / height ≈ 0.894. The supplied reproduction is 2186 × 2204 pixels, width / height ≈ 0.992, and cuts closely into the blue surface. This study follows the visible reproduction at **2240 × 2258 pixels**. It does not infer unseen sheet edges, margins or the location of inscriptions. Its near-square presentation should not be mistaken for a measurement of the complete physical sheet.

## Observations of the reproduction

The full reproduction and three 600-pixel native crops were visually inspected before implementation. The following are compositional observations of that photograph, rather than conservation measurements:

- Approximately **33 vertical axes / 32 intervals** across the crop. Axes shift slightly from row to row; neighbouring intervals are unequal.
- **22 strong horizontal dash rows**, including the partially clipped top row. The blue field continues below the last row.
- Typically **three short vertical ink dashes** between the horizontal rows. At a horizontal row, the vertical dash intersects the horizontal dash, creating a cross. The horizontal dashes nearly join but leave uneven small gaps.
- Compact grey-black ink with rounded blunt ends, changes in pressure, a darker perimeter and small pale tooth breaks. Cross arms differ in length and balance. This is an interrupted lattice, rather than a continuous ruled grid.
- A periwinkle blue surface with fine sharp pigment granules and many short horizontal fragments. Broad color changes are modest. A small number of pale scuffs and sheet creases appear in the photograph.
- **No white gouache dots.** This differs materially and compositionally from *Summer*.

A simple mask excluding the darkest marks and low-blue pixels gave photograph RGB approximately **(93, 116, 162)**. It informed the general hue, not a pixel reconstruction or a claim about the work's original color. Photography, compression, lighting and screen rendering affect this number.

## Procedural construction

The composition remains fixed as the surface seed changes. A low-amplitude blue raster has fine tooth and sharp grain. Hundreds of bounded horizontal wash passes, many small irregular pigment fragments, dry brush traces and a few concentrated blue deposits build the surface. No blur filters, radial fog fields or imported material maps are used.

Each ink dash is a variable-width nib polygon with rounded ends and independent pressure. A separate procedural ink layer adds a darker rim, granular interiors and sparse transparent tooth holes so the generated watercolor shows through. Row curvature and column offsets suggest an uneven sheet and hand placement without storing per-mark coordinates from the reference.

## Render / compare / refine log — 2026-10-06

All passes were rendered in headless Chrome with p5.js 1.7.0. Each exported PNG was inspected, with matching top, centre and lower regions shown side by side against the reference resized only to the same canvas dimensions. Local evidence is under `C:\Users\Jace\Documents\ChatGPT\生成艺术\outputs\agnes-six\`, using the `p84-` prefix.

| Pass | Actual observation and refinement |
| --- | --- |
| `v1` | The counts and spacing were close, but the ink was too thin and flat; the blue was too grey and smooth. Increased blue chroma, sharpened pigment grain, thickened the compact dashes and introduced a dark rim. |
| `v2` | Blue had more of the needed granular character. Ink interiors still looked solid and mechanically cut, and central / lower row placement drifted upward relative to the reproduction. Added granular ink tooth on its own layer, modest row curvature, broader spacing variation and shorter cross arms. |
| `v3` | The ink acquired material variation and row placement improved. Ends still read as blunt polygon cuts, gaps between horizontal dashes were too uniform, and the pale ink grain was too strong. Added rounded caps, extended variable horizontal arms, reduced interior grain and pinholes, and darkened the ink centre. |
| `final` | Selected after inspecting the full export and all three matching crops. The result retains a close interrupted lattice rhythm and a crisp, periwinkle pigment surface. Final export: `p84-final.png`, **2240 × 2258**. Measured render time was approximately **670 ms** in this Chrome run. |

The study generates plausible new material marks; it does not reproduce every photographic irregularity, crease, stain, individual dash or exact row position. The surface remains somewhat more evenly distributed than the reference's particular worn sheet. The physical sheet's unshown proportions and margins remain unresolved by this crop.

## Controls and verification

- Click the canvas or press **R** to generate the next seeded surface.
- Press **S** to download the full native-resolution PNG.
- `window.agnesStudy.regenerate(1963)` restores the selected surface.
- `window.agnesStudy` exposes `seed`, `renderMs` and `regenerate(seed)`; `window.__ARTWORK_READY__` reports render completion.
- CSS resizing changes only presentation dimensions and preserves the native drawing and aspect ratio. The canvas has a descriptive accessible image label, a title and keyboard focus.

Verified with `p84-qa.cjs`: click changed seed to 1964; R changed it to 1965; restoring 1963 produced identical PNG data; widths 320, 768 and 1440 retained the 2240 × 2258 canvas with no horizontal overflow; S downloaded `starlight-1963.png` with identical PNG bytes to the canvas export. JavaScript syntax passed and Chrome reported no runtime errors. Both the primary canvas and the ink layer request `willReadFrequently` on their first 2D context creation.
