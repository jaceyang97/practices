import { useEffect, useRef } from 'react'

export default function ArtworkGrid({ artworks, currentId, onSelect, compact = false, onClear }) {
  const gridRef = useRef(null)
  useEffect(() => {
    if (!compact) return
    const selected = gridRef.current?.querySelector('[aria-current="true"]')
    if (selected) {
      const container = gridRef.current.parentElement
      const bounds = selected.getBoundingClientRect()
      const containerBounds = container.getBoundingClientRect()
      const cardTop = bounds.top - containerBounds.top + container.scrollTop
      const cardLeft = bounds.left - containerBounds.left + container.scrollLeft
      if (cardLeft < container.scrollLeft || cardLeft + bounds.width > container.scrollLeft + container.clientWidth) {
        container.scrollLeft = Math.max(0, cardLeft - 1)
      }
      if (cardTop < container.scrollTop || cardTop + selected.offsetHeight > container.scrollTop + container.clientHeight) {
        container.scrollTop = cardTop - 1
      }
    }
  }, [currentId, compact, artworks])

  if (!artworks.length) return <div className="empty-results" role="status"><p>No works found.</p>
    <button className="text-button" onClick={onClear}>Clear filters</button></div>

  return (
    <div ref={gridRef} className={`artwork-grid ${compact ? 'compact-grid' : ''}`}>
      {artworks.map((artwork, index) => (
        <button className={`artwork-card ${artwork.id === currentId ? 'is-current' : ''}`}
          key={artwork.id} data-artwork-id={artwork.id} aria-label={`Preview p${artwork.id}: ${artwork.title}`}
          aria-current={artwork.id === currentId ? 'true' : undefined} onClick={() => onSelect(artwork.id)}>
          {artwork.thumbnail ? <img src={artwork.thumbnail} alt="" width="640" height="640"
            loading={index < (compact ? 8 : 4) ? 'eager' : 'lazy'} decoding="async" />
            : <div className="missing-thumbnail">p{artwork.id}</div>}
          <span className="artwork-caption"><span className="artwork-caption-text">
            <strong>{artwork.name}</strong>
            <span>{artwork.artist ? `Tribute to ${artwork.artist}` : 'Generative study'}{artwork.year ? ` · ${artwork.year}` : ''}</span>
          </span><span className="artwork-number">p{artwork.id}</span></span>
        </button>
      ))}
    </div>
  )
}
