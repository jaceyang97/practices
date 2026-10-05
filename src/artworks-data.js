import { artworks } from './artworks-manifest'
import { BLOCKED_ARTWORK_IDS } from './config/constants'

const thumbnails = import.meta.glob('../assets/gallery/p*.webp', {
  eager: true, query: '?url', import: 'default'
})

export const workshopArtworks = artworks
  .filter(artwork => !BLOCKED_ARTWORK_IDS.includes(artwork.id))
  .map(artwork => ({ ...artwork, thumbnail: thumbnails[`../assets/gallery/p${artwork.id}.webp`] }))

export const artists = [...new Set(workshopArtworks.map(artwork => artwork.artist).filter(Boolean))]
  .sort((a, b) => a.localeCompare(b))

export function filterArtworks(query, artist, order) {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean)
  return workshopArtworks.filter(artwork => {
    const text = `p${artwork.id} ${artwork.file} ${artwork.title} ${artwork.year}`.toLocaleLowerCase()
    return (!artist || artwork.artist === artist) && terms.every(term => text.includes(term))
  }).sort((a, b) => order === 'oldest' ? a.id - b.id : b.id - a.id)
}
