export default function PreviewToolbar({ artwork, position, count, ready, focused, onPrev, onNext,
  onSave, onRegenerate, onReload, onFocus, onBrowse }) {
  return (
    <header className="preview-toolbar">
      <div className="preview-title-row"><div className="preview-title">
        <h2>{artwork.title}</h2>
        <p><span>{artwork.file}</span>{artwork.year ? <span>{artwork.year}</span> : null}
          {artwork.source ? <a href={artwork.source} target="_blank" rel="noopener noreferrer">Reference ↗</a> : null}</p>
      </div><button className="text-button browse-return" onClick={onBrowse}>← Browse</button></div>
      <div className="preview-actions"><div className="piece-navigation">
        <button className="arrow-button" aria-label="Previous work" title="Previous work (←)" onClick={onPrev} disabled={!count}>←</button>
        <span className="piece-position">{position > 0 ? `${position} / ${count}` : 'Outside filter'}</span>
        <button className="arrow-button" aria-label="Next work" title="Next work (→)" onClick={onNext} disabled={!count}>→</button>
      </div><div className="render-actions">
        <button onClick={onRegenerate} disabled={!ready} title="Regenerate (R)">Regenerate</button>
        <button onClick={onReload} title="Restore the initial sketch">Reset</button>
        <button onClick={onSave} disabled={!ready} title="Save PNG at its original resolution (S)">Save PNG ↓</button>
        <button onClick={onFocus} aria-pressed={focused} title="Toggle a larger preview">{focused ? 'Show works' : 'Focus'}</button>
      </div></div>
    </header>
  )
}
