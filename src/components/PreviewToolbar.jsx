import { useEffect, useRef } from 'react'

export default function PreviewToolbar({ artwork, position, count, ready, browserOpen, onPrev, onNext,
  onSave, onRegenerate, onReload, onToggleBrowser, onBrowse }) {
  const menuRef = useRef(null)
  useEffect(() => {
    const close = event => {
      if (!menuRef.current?.contains(event.target)) menuRef.current?.removeAttribute('open')
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])
  return (
    <header className="preview-toolbar">
      <button className="back-to-workshop" onClick={onBrowse} title="Back to Workshop (Esc)">← <span>Workshop</span></button>
      <div className="piece-navigation">
        <button className="arrow-button" aria-label="Previous work" title="Previous work (←)" onClick={onPrev} disabled={!count}>←</button>
        <button className="arrow-button" aria-label="Next work" title="Next work (→)" onClick={onNext} disabled={!count}>→</button>
      </div>
      <div className="preview-title" title={`${artwork.title} · ${artwork.file}`}>
        <h2>{artwork.title}</h2><span className="artwork-file">p{artwork.id}</span>
      </div>
      <div className="render-actions">
        <button onClick={onToggleBrowser} aria-pressed={browserOpen} title="Show works and search (/)">Works</button>
        <button className="regenerate-button" onClick={onRegenerate} disabled={!ready} title="Regenerate (R)" aria-label="Regenerate">↻</button>
        <button onClick={onSave} disabled={!ready} title="Save PNG at its original resolution (S)">PNG ↓</button>
        <details className="preview-menu" ref={menuRef}>
          <summary title="Artwork options" aria-label="Artwork options">···</summary>
          <div className="preview-menu-content">
            <p className="menu-artwork-title">{artwork.title}</p>
            <p className="menu-artwork-meta">{artwork.file}{artwork.year ? ` · ${artwork.year}` : ''}{position > 0 ? ` · ${position} / ${count}` : ''}</p>
            <button onClick={() => { onReload(); menuRef.current.removeAttribute('open') }}>Reset artwork</button>
            {artwork.source && <a href={artwork.source} target="_blank" rel="noopener noreferrer">Original reference ↗</a>}
            <div className="menu-shortcuts"><p>Scroll to zoom · Drag to pan</p><p>Double-click or F to fit</p>
              <p>← / → Switch · R Regenerate · S Save</p><p>/ Search · Esc Back · 0–9 Jump</p>
              <p>Interact restores the artwork's mouse controls.</p></div>
          </div>
        </details>
      </div>
    </header>
  )
}
