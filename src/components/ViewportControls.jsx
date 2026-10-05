export default function ViewportControls({ viewport, ready, onZoomIn, onZoomOut, onFit, onModeChange }) {
  return (
    <div className="viewport-controls" role="group" aria-label="Canvas view controls">
      <button onClick={onZoomOut} disabled={!ready} aria-label="Zoom out" title="Zoom out (−)">−</button>
      <span className="zoom-level" title="Zoom relative to fitted view">{Math.round(viewport.zoom * 100)}%</span>
      <button onClick={onZoomIn} disabled={!ready} aria-label="Zoom in" title="Zoom in (+)">+</button>
      <button onClick={onFit} disabled={!ready} title="Fit artwork (F or double-click)">Fit</button>
      <button className="interaction-toggle" disabled={!ready} aria-pressed={viewport.mode === 'interact'}
        onClick={() => onModeChange(viewport.mode === 'interact' ? 'inspect' : 'interact')}
        title="Toggle the artwork's original mouse controls">Interact</button>
    </div>
  )
}
