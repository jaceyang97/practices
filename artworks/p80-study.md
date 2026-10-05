# Tribute to Agnes Martin: Summer

Procedural study of *Summer* (1964).

`p80.js` is a procedural study after the photograph supplied for this piece. The reference is not loaded by the sketch. Its wash, grid, gouache and paper texture are generated from a reproducible seed.

## Documented work

- **Title / date:** *Summer*, 1964.
- **Medium:** watercolour, ink and gouache on paper.
- **Dimensions:** 9¼ × 9¼ inches, approximately 23.5 × 23.5 cm.
- **Collection credit in the 2016 exhibition:** Collection Patricia L Lewy Gidwitz. This is a historical credit, not a verification of present ownership.
- **Primary source:** [LACMA, Agnes Martin exhibition advisory, 2016, image captions on page 5](https://www-images.lacma.org/s3fs-public/Agnes-Martin-exhibition-advisory-6.6.16_0.pdf).
- **Cross-check:** [Lannoo's publisher-hosted excerpt, fig. 3](https://www.lannoopublishers.com/sites/default/files/books/issuu/9782390252535.pdf) lists the same medium, date and collection, with the size rounded to 23.4 cm.
- **Context for the hand-ruled grid:** [Guggenheim's Agnes Martin activity guide, 2016](https://www.guggenheim.org/wp-content/uploads/2016/10/guggenheim-agnes-martin-family-activity-guide-10.4.16.pdf). General information about Martin's practice; not a material analysis of *Summer*.
- The request's phrase about synthesizing Abstract Expressionism and minimalism is the image caption in [Peter Schjeldahl's 2016 New Yorker review](https://www.newyorker.com/magazine/2016/10/17/agnes-martin-a-matter-of-fact-mystic).

## Observations of the supplied reproduction

These describe the photograph, rather than measurements of the physical sheet:

- A square sheet with a narrow warm ivory margin, slightly irregular blue edges and a 47-column / 35-row rhythm used for this study.
- Dark, nearly straight vertical rules, with heavier horizontal rules and small changes in spacing, pressure and alignment.
- Translucent blue with overlapping horizontal strokes, small blooms, dry brush marks and fine pigment grain. The right side is somewhat darker.
- One small white touch per cell. Many of the left-side touches have a blue core; the right-side marks tend to be smaller and more broken.
- An analysis at 1600 pixels, excluding dark ink and paper, gave mean blue-field RGB approximately (43, 128, 178). This includes the white marks and is dependent on the supplied reproduction's lighting and colour processing.

## Rendering iterations, 2026-10-05

Each version was rendered in Chrome from the actual gallery, exported at 2240 × 2240 and visually inspected. Local QA captures are in the generative-art workspace's `outputs/summer/` folder.

| Version | Observation and next adjustment |
| --- | --- |
| 1 | Excessively regular waves in the rules; blue variation too small; white marks too fine. |
| 2 | Straighter grid, wider blue variation, larger marks. Fine texture still too smooth. |
| 3 | Added ragged horizontal glazes, dry brush traces and pigment blooms. Enlarged comparison crops showed that the white marks were too angular and the pigment grain too fine. |
| 4 | More round, incomplete marks at the left; smaller broken touches toward the right; stronger grain and one shared paper-tooth pass over ink and gouache. Initial gallery selection; subsequently revised after the material feedback below. |

The result preserves the reference's composition and material cues while generating different individual brush marks. It is not a pixel-identical reconstruction.

Verification: the gallery defaults to `p80`; click and R regeneration work; restoring seed 1964 reproduces the same pixels; resizing at widths 320, 768, 1024 and 1440 retains the drawing with no overflow; keyboard and gallery save controls export identical 2240 × 2240 PNGs. Chrome reported no JavaScript errors. The renderer starts with `willReadFrequently` enabled so the first render and subsequent renders use the same rasterization path. The production build and JavaScript syntax checks pass.

## Material revision after feedback

The user described the reference's blue as resembling a plastic sheet laid flat, and the initial rendering as smoky and blurred. This is a visual analogy guiding the revision; the documented medium remains watercolour, ink and gouache on paper.

Four regions were compared at the same native-resolution crop coordinates: upper left, centre left, centre right and lower right. The initial rendering spread tonal differences through soft isotropic noise. The reference showed bounded overlapping areas, directional scuffs, coarse pigment variation and a small number of concentrated dark deposits. The initial grid also had a greyer core and a broad translucent fringe.

| Material pass | Change and inspection |
| --- | --- |
| 1 | Removed the large cloudy tonal contribution. Built blue changes from overlapping bounded planes, dragged glazes and narrow slanted scuffs. Reduced the grid fringe and darkened its core. Native-size crops revealed overly hard dark deposits and too-even blue layering. |
| 2 | Increased the distinction between lighter and darker blue planes. Reduced the number and size of deep deposits, softened only their outermost boundary and kept a concentrated centre. Adjusted the ink toward dark blue-black. |
| 3 | Added discrete small pigment fragments and broken scuffs. Rebuilt gouache on a separate porous layer, so the actual blue shows through its holes instead of a painted flat blue disc. Selected for this revision. |

The selected full-resolution export is `outputs/summer/summer-1964-v2.png` in the generative-art workspace. `before-material.png` and `p79-before-material.js` preserve the prior result; `comparison-material.png` and `regions-material-v3-*.png` record the visual comparisons. The final script and gallery thumbnail use the revised material. The local study was numbered p79 during iteration and became p80 when synced with the existing p79, Vera Molnár's *Ascension*, on GitHub.

## Controls

- Click the sheet or focus it and press **R**: generate the next surface.
- Press **S** inside the sheet, or use the gallery's save button: download a 2240 × 2240 PNG.
- The default seed is `1964`; `window.summer80.regenerate(1964)` restores that surface for repeatable comparisons.
- Resizing changes only the display size, retaining the full-resolution drawing.
