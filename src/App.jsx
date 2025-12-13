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
        <div className="control-row">
          <button className="nav-btn" onClick={navigatePrev} title="Previous (←)">←</button>
          <select 
            className="artwork-select"
            value={currentId}
            onChange={(e) => navigateToArtwork(Number(e.target.value))}
          >
            {artworks.map((artwork) => {
              const isBlocked = BLOCKED_ARTWORK_IDS.includes(artwork.id)
              return (
                <option 
                  key={artwork.id} 
                  value={artwork.id}
                  disabled={isBlocked}
                >
                  {artwork.file}{isBlocked ? ' ✕' : ''}
                </option>
              )
            })}
          </select>
          <button className="nav-btn" onClick={navigateNext} title="Next (→)">→</button>
          <button className="save-btn" onClick={handleSave} title="Save (S)">💾</button>
        </div>
      </div>

      <ArtworkRenderer scriptName={currentArtwork.file} key={currentId} />
    </div>
  )
}

export default App
