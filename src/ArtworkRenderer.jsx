import { useEffect, useRef, useState } from 'react'

function ArtworkRenderer({ scriptName }) {
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous iframe if it exists
    if (iframeRef.current && containerRef.current.contains(iframeRef.current)) {
      containerRef.current.removeChild(iframeRef.current)
    }

    // Create a new iframe with a unique src
    const iframe = document.createElement('iframe')
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    iframe.style.background = '#f0f0f0'
    iframe.title = `Artwork ${scriptName}`
    
    // Create a simple HTML page that loads the script
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/addons/p5.sound.min.js"></script>
          <style>
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
            canvas { display: block; }
          </style>
        </head>
        <body>
          <script>
            // Load the script dynamically
            const script = document.createElement('script');
            script.src = '/artworks/${scriptName}';
            script.onload = () => {
              console.log('Script loaded successfully');
            };
            script.onerror = () => {
              console.error('Failed to load script: /artworks/${scriptName}');
            };
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
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#666',
          fontSize: '18px'
        }}>
          Loading {scriptName}...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff4444',
          fontSize: '18px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}

export default ArtworkRenderer
