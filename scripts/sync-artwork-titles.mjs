import fs from 'node:fs'
import path from 'node:path'
import { artworkTitle, readArtworkCatalog } from './artwork-titles.mjs'

const catalog = readArtworkCatalog()
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const read = file => fs.readFileSync(file, 'utf8')
const writeIfChanged = (file, content) => {
  if (read(file) !== content) fs.writeFileSync(file, content)
}

// Preserve the hand-maintained gallery layout; update only its title fields.
let readme = read('README.md')
readme = readme.replace(/<td\b[^>]*>[\s\S]*?<\/td>/g, cell => {
  const file = cell.match(/href="artworks\/(p\d+\.js)"/)?.[1]
  if (!catalog[file]) return cell
  const title = escapeHtml(artworkTitle(catalog[file], catalog))
  return cell.replace(/\btitle="[^"]*"/g, () => `title="${title}"`)
    .replace(/\balt="[^"]*"/g, () => `alt="${title}"`)
    .replace(/<b>[\s\S]*?<\/b>/, () => `<b>${title}</b>`)
})
readme = readme.replace(/<img\b[^>]*src="assets\/gallery\/(p\d+)\.webp"[^>]*>/g, (image, id) => {
  const entry = catalog[`${id}.js`]
  if (!entry) return image
  const title = escapeHtml(artworkTitle(entry, catalog))
  return image.replace(/\balt="[^"]*"/, () => `alt="${title}"`)
})
readme = readme.replace(/^- \*\*[^\n]*?\*\*([^\n]*?&nbsp;`p(\d+)`[^\n]*)$/gm, (line, rest, id) => {
  const entry = catalog[`p${id}.js`]
  return entry ? `- **${escapeHtml(artworkTitle(entry, catalog))}**${rest}` : line
})
writeIfChanged('README.md', readme)

// Keep a visible title in every standalone sketch while preserving source notes.
for (const [file, entry] of Object.entries(catalog)) {
  const sketchPath = path.join('artworks', file)
  let sketch = read(sketchPath)
  const eol = sketch.includes('\r\n') ? '\r\n' : '\n'
  const titleLine = ` * Title: ${artworkTitle(entry, catalog)}`
  if (/^\/\*\*/.test(sketch)) {
    if (/^ \* Title:.*$/m.test(sketch)) sketch = sketch.replace(/^ \* Title:[^\r\n]*/m, () => titleLine)
    else sketch = sketch.replace(/^\/\*\*/, () => `/**${eol}${titleLine}`)
  } else {
    sketch = `/**${eol}${titleLine}${eol} */${eol}${eol}${sketch}`
  }
  writeIfChanged(sketchPath, sketch)
}

console.log(`Synchronized ${Object.keys(catalog).length} artwork titles.`)
