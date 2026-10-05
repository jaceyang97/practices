import { artists } from '../artworks-data'

export default function WorkshopHeader({ view, onViewChange, total, count, query, onQueryChange,
  artist, onArtistChange, order, onOrderChange, searchRef }) {
  return (
    <header className={`workshop-header ${view === 'preview' ? 'compact' : ''}`}>
      <div className="workshop-heading"><h1>Workshop</h1><p>{total} pieces, drawn with code.</p></div>
      <div className="workshop-intro">
        <nav className="view-switch" aria-label="Workshop view">
          <button aria-pressed={view === 'browse'} onClick={() => onViewChange('browse')}>Browse</button>
          <button aria-pressed={view === 'preview'} onClick={() => onViewChange('preview')}>Preview</button>
        </nav>
        <p>Browse, generate &amp; save.</p>
      </div>
      <div className="workshop-filters">
        <div className="search-field">
          <label className="sr-only" htmlFor="artwork-search">Search works</label>
          <input ref={searchRef} id="artwork-search" type="search" autoComplete="off"
            placeholder="Search title, artist, or p86" value={query}
            onChange={event => onQueryChange(event.target.value)} />
          <span className="search-count" aria-live="polite">{count === total ? `${total} works` : `${count} / ${total}`}</span>
          <kbd aria-hidden="true">/</kbd>
        </div>
        <label className="filter-field"><span className="sr-only">Filter by artist</span>
          <select aria-label="Filter by artist" value={artist} onChange={event => onArtistChange(event.target.value)}>
            <option value="">All artists</option>{artists.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="filter-field"><span className="sr-only">Sort works</span>
          <select aria-label="Sort works" value={order} onChange={event => onOrderChange(event.target.value)}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>
    </header>
  )
}
