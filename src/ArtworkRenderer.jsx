import { useEffect, useRef, useState } from 'react'
import { P5_MAIN_URL, P5_SOUND_URL } from './config/constants'

function ArtworkRenderer({ scriptName }) {
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('geometric')
  const [singleShapeMode, setSingleShapeMode] = useState(false)

  // Check if this artwork needs category buttons
  const needsCategoryButtons = scriptName === 'p47.js' || scriptName === 'p48.js' || scriptName === 'p49.js'
  const hasSingleShapeToggle = scriptName === 'p49.js'

  // Send category to iframe
  const sendCategoryToIframe = (category) => {
    setSelectedCategory(category)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'setCategory', category },
        '*'
      )
    }
  }

  // Send single shape mode toggle to iframe
  const toggleSingleShapeMode = () => {
    const newValue = !singleShapeMode
    setSingleShapeMode(newValue)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'setSingleShapeMode', enabled: newValue },
        '*'
      )
    }
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous iframe if it exists
    if (iframeRef.current && containerRef.current.contains(iframeRef.current)) {
      containerRef.current.removeChild(iframeRef.current)
    }

    // Create a new iframe
    const iframe = document.createElement('iframe')
    iframe.className = 'artwork-iframe'
    iframe.title = `Artwork ${scriptName}`
    
    // Create HTML content that loads the p5.js script
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="${P5_MAIN_URL}"></script>
          <script src="${P5_SOUND_URL}"></script>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
            canvas { display: block; }
          </style>
        </head>
        <body>
          <script>
            const script = document.createElement('script');
            script.src = '/artworks/${scriptName}?t=' + Date.now();
            script.onload = () => console.log('Script loaded successfully');
            script.onerror = () => console.error('Failed to load script: /artworks/${scriptName}');
            document.head.appendChild(script);
          </script>
        </body>
      </html>
    `
    
    iframe.srcdoc = htmlContent
    
    iframe.onload = () => {
      setIsLoading(false)
      setError(null)
    }
    
    iframe.onerror = () => {
      console.error('Failed to load iframe content')
      setIsLoading(false)
      setError('Failed to load artwork')
    }

    // Store reference and append
    iframeRef.current = iframe
    containerRef.current.appendChild(iframe)

    // Cleanup function
    return () => {
      if (iframeRef.current && containerRef.current && containerRef.current.contains(iframeRef.current)) {
        containerRef.current.removeChild(iframeRef.current)
      }
      iframeRef.current = null
    }
  }, [scriptName])

  return (
    <div className="artwork-wrapper">
      <div ref={containerRef} className="artwork-container">
        {isLoading && (
          <div className="artwork-loading">
            Loading {scriptName}...
          </div>
        )}
        {error && (
          <div className="artwork-error">
            {error}
          </div>
        )}
      </div>
      {needsCategoryButtons && (
        <div className="category-buttons">
          {['geometric', 'symmetry', 'fill', 'density'].map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'selected' : ''}`}
              onClick={() => sendCategoryToIframe(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
          {hasSingleShapeToggle && (
            <button
              className={`category-btn toggle-btn ${singleShapeMode ? 'selected' : ''}`}
              onClick={toggleSingleShapeMode}
            >
              Single
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ArtworkRenderer
