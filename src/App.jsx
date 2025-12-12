import ArtworkRenderer from './ArtworkRenderer'
import { artworks } from './artworks-manifest'
import { useArtworkNavigation, useKeyboardShortcuts, useCanvasSave } from './hooks'
import { BLOCKED_ARTWORK_IDS } from './config/constants'

function App() {
  const {
    currentId,
    currentArtwork,
    allIds,
    navigateToArtwork,
    navigateNext,
    navigatePrev
  } = useArtworkNavigation(BLOCKED_ARTWORK_IDS)

  const handleSave = useCanvasSave(currentArtwork)

  useKeyboardShortcuts({
    onNext: navigateNext,
    onPrev: navigatePrev,
    onSave: handleSave,
    onNavigate: navigateToArtwork,
    validIds: allIds
  })

  return (
    <div className="app">
      <div className="control-panel">
        <div className="control-group">
          <span className="current-file">{currentArtwork.file}</span>
          <div className="nav-controls">
            <button className="nav-btn" onClick={navigatePrev} title="Previous (←)">←</button>
            <button className="nav-btn" onClick={navigateNext} title="Next (→)">→</button>
            <button className="save-btn" onClick={handleSave} title="Save (S)">💾</button>
          </div>
        </div>
        <div className="grid-buttons">
          {artworks.map((artwork) => {
            const isBlocked = BLOCKED_ARTWORK_IDS.includes(artwork.id)
            return (
              <button
                key={artwork.id}
                className={`grid-btn ${currentId === artwork.id ? 'active' : ''} ${isBlocked ? 'blocked' : ''}`}
                onClick={() => !isBlocked && navigateToArtwork(artwork.id)}
                disabled={isBlocked}
                title={isBlocked ? 'Blocked' : artwork.file}
              >
                {artwork.id}
                {isBlocked && <span className="blocked-x">✕</span>}
              </button>
            )
          })}
        </div>
      </div>

      <ArtworkRenderer scriptName={currentArtwork.file} key={currentId} />
    </div>
  )
}

export default App
