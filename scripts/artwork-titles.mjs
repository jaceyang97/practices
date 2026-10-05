import fs from 'node:fs'
import path from 'node:path'

export const catalogPath = path.resolve('artworks/catalog.json')

export function readArtworkCatalog() {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  for (const [file, entry] of Object.entries(catalog)) {
    if (!/^p\d+\.js$/.test(file) || typeof entry.name !== 'string' || !entry.name.trim()) {
      throw new Error(`Invalid artwork title entry: ${file}`)
    }
    if (entry.tributeTo !== undefined && (typeof entry.tributeTo !== 'string' || !entry.tributeTo.trim())) {
      throw new Error(`Invalid tribute credit: ${file}`)
    }
  }
  return catalog
}

export function artworkTitle(entry, catalog = {}) {
  let name = entry.name
  if (name === 'Unknown' && entry.tributeTo) {
    const siblings = Object.entries(catalog)
      .filter(([, other]) => other.name === 'Unknown' && other.tributeTo === entry.tributeTo)
      .sort(([a], [b]) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
      .map(([, other]) => other)
    if (siblings.length > 1) name += ` #${siblings.indexOf(entry) + 1}`
  }
  return entry.tributeTo ? `Tribute to ${entry.tributeTo}: ${name}` : name
}
