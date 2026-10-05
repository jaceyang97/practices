import { artists } from '../artworks-data'
import ArtworkGrid from './ArtworkGrid'

export default function ArtworkBrowser({ artworks, currentId, query, onQueryChange, artist, onArtistChange,
  order, onOrderChange, searchRef, onClose, onSelect, onClear }) {
  return (
    <aside className="workbench-browser" aria-label="Switch artwork">
      <div className="drawer-search"><label className="sr-only" htmlFor="preview-search">Search works</label>
        <input ref={searchRef} id="preview-search" type="search" placeholder="Title, artist, or p86"
          value={query} onChange={event => onQueryChange(event.target.value)} />
        <button onClick={onClose} aria-label="Close works" title="Close works (Esc)">×</button>
      </div>
      <div className="drawer-filters">
        <select aria-label="Filter by artist" value={artist} onChange={event => onArtistChange(event.target.value)}>
          <option value="">All artists</option>{artists.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <select aria-label="Sort works" value={order} onChange={event => onOrderChange(event.target.value)}>
          <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
        </select>
      </div>
      <div className="drawer-works"><ArtworkGrid artworks={artworks} currentId={currentId} onSelect={onSelect} compact onClear={onClear} /></div>
    </aside>
  )
}
