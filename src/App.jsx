import { useState, useEffect, useCallback, useMemo } from 'react'
import ArtworkRenderer from './ArtworkRenderer'
import { artworks, getArtworkById, getAllArtworkIds } from './artworks-manifest'

// Block access to artwork 34
const BLOCKED_IDS = [34]

function App() {
  const allIds = useMemo(() => {
    return getAllArtworkIds().filter(id => !BLOCKED_IDS.includes(id))
  }, [])
  
  const latestId = useMemo(() => Math.max(...allIds), [allIds])
  
  const [currentId, setCurrentId] = useState(latestId)
  const currentArtwork = getArtworkById(currentId)

  // Navigate to specific artwork
  const navigateToArtwork = useCallback((id) => {
    if (allIds.includes(id)) {
      setCurrentId(id)
    }
  }, [allIds])

  // Navigate to next artwork
  const navigateNext = useCallback(() => {
    const currentIndex = allIds.indexOf(currentId)
    if (currentIndex === -1) {
      // If current ID is not in the list (shouldn't happen), go to first
      setCurrentId(allIds[0])
      return
    }
    const nextIndex = (currentIndex + 1) % allIds.length
    setCurrentId(allIds[nextIndex])
  }, [currentId, allIds])

  // Navigate to previous artwork
  const navigatePrev = useCallback(() => {
    const currentIndex = allIds.indexOf(currentId)
    if (currentIndex === -1) {
      // If current ID is not in the list (shouldn't happen), go to last
      setCurrentId(allIds[allIds.length - 1])
      return
    }
    const prevIndex = (currentIndex - 1 + allIds.length) % allIds.length
    setCurrentId(allIds[prevIndex])
  }, [currentId, allIds])

  // Handle save canvas
  const handleSave = useCallback(() => {
    const iframe = document.querySelector('iframe')
    if (iframe) {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      const canvas = iframeDoc.querySelector('canvas')
      if (canvas) {
        const link = document.createElement('a')
        const filename = `${currentArtwork.file.replace('.js', '')}.png`
        link.download = filename
        link.href = canvas.toDataURL()
        link.click()
      }
    }
  }, [currentArtwork])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Arrow keys for navigation
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        navigateNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        navigatePrev()
      }
      // Number keys for direct access (0-9)
      else if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key)
        if (allIds.includes(num)) {
          e.preventDefault()
          navigateToArtwork(num)
        }
      }
      // S key to save
      else if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigateNext, navigatePrev, navigateToArtwork, handleSave, allIds])

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
            const isBlocked = BLOCKED_IDS.includes(artwork.id)
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


