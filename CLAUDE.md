# CLAUDE.md

## Project Overview
p5.js generative art gallery. React frontend with Vite build tooling.
62 artworks (p0.js-p61.js) rendered in iframes with p5.js loaded from CDN.

## Key Commands
- `npm run dev` - Start dev server on port 3000
- `npm run build` - Production build
- `npm run preview` - Preview production build

## Architecture
- Artworks are vanilla p5.js scripts in `artworks/`, loaded into iframes by `src/ArtworkRenderer.jsx`
- `src/plugins/vite-plugin-artworks.js` auto-generates `src/artworks-manifest.js` by scanning `artworks/` for p*.js files. Do NOT manually edit the manifest.
- Static assets (images, SVGs) are in `public/` and served at root by Vite
- Images referenced as `/images/filename` (e.g. `/images/mona_lisa.jpg`)
- SVGs referenced as `/anthropic_basic_shapes/filename` (e.g. `/anthropic_basic_shapes/circle_sym_filled_dense.svg`)
- Artwork p34 is blocked (see `src/config/constants.js` BLOCKED_ARTWORK_IDS)

## Important Constraints
- The vite plugin depends on `artworks/` being at the project root
- `src/artworks-manifest.js` is auto-generated and gitignored - do not commit manual edits
- ArtworkRenderer.jsx has hardcoded checks for p47/p48/p49 (category buttons)
- Artwork scripts run in iframes so they reference assets via absolute paths from server root
