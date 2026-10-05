import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createArtworkDocument, FRAME_CHANNEL, FRAME_TIMEOUT } from './artwork-frame'

const CATEGORIES = ['geometric', 'symmetry', 'fill', 'density']
const INITIAL_CONTROLS = { category: 'geometric', single: false }

const ArtworkRenderer = forwardRef(function ArtworkRenderer({
  scriptName, artworkTitle, onReadyChange, onShortcut, onViewportChange,
}, ref) {
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const callbacksRef = useRef({ onReadyChange, onShortcut, onViewportChange })
  const controlsRef = useRef(INITIAL_CONTROLS)
  const previousScriptRef = useRef(scriptName)
  const [revision, setRevision] = useState(0)
  const [status, setStatus] = useState({ ready: false, error: null })
  const [controls, setControls] = useState(INITIAL_CONTROLS)
  callbacksRef.current = { onReadyChange, onShortcut, onViewportChange }
  const needsCategories = ['p47.js', 'p48.js', 'p49.js'].includes(scriptName)

  const reload = useCallback(() => setRevision((value) => value + 1), [])
  const getCanvas = useCallback(() => {
    const doc = iframeRef.current?.contentDocument
    return doc?.querySelector('canvas.p5Canvas') || doc?.querySelector('canvas') || null
  }, [])
  useImperativeHandle(ref, () => ({
    reload,
    getCanvas,
    fitView: () => iframeRef.current?.contentWindow?.__canvasViewport?.fit(),
    zoomIn: () => iframeRef.current?.contentWindow?.__canvasViewport?.zoomIn(),
    zoomOut: () => iframeRef.current?.contentWindow?.__canvasViewport?.zoomOut(),
    setInteractionMode: (mode) => iframeRef.current?.contentWindow?.__canvasViewport?.setMode(mode),
    getViewport: () => iframeRef.current?.contentWindow?.__canvasViewport?.getState() || { zoom: 1, mode: 'inspect' },
    regenerate() {
      const frame = iframeRef.current?.contentWindow
      const study = frame?.agnesStudy || frame?.summer80
      if (!study?.regenerate) return reload()
      setStatus({ ready: false, error: null })
      callbacksRef.current.onReadyChange?.(false)
      frame.__artworkFrame?.wait()
      try {
        study.regenerate(Number(study.seed) + 1)
      } catch (error) {
        frame.__artworkFrame?.fail(error.message || 'The artwork could not be regenerated.')
      }
    },
    // Run after the native render in the artwork's own animation frame, while
    // a WebGL drawing buffer is still available for synchronous readback.
    async save(filename = 'artwork.png') {
      const frame = iframeRef.current?.contentWindow
      const canvas = getCanvas()
      if (!frame || !canvas) throw new Error('The artwork is still loading.')
      const dataUrl = await new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('The artwork could not be captured. Please retry.')), 5000)
        frame.requestAnimationFrame(() => {
          window.clearTimeout(timeout)
          if (iframeRef.current?.contentWindow !== frame) return reject(new Error('The selected artwork changed before saving.'))
          try { resolve(canvas.toDataURL('image/png')) }
          catch { reject(new Error('This artwork could not be saved as a PNG.')) }
        })
      })
      const link = document.createElement('a')
      link.download = filename
      link.href = dataUrl
      link.click()
      return { width: canvas.width, height: canvas.height }
    },
  }), [getCanvas, reload])

  useEffect(() => {
    if (previousScriptRef.current !== scriptName) {
      previousScriptRef.current = scriptName
      controlsRef.current = INITIAL_CONTROLS
      setControls(INITIAL_CONTROLS)
    }
    setStatus({ ready: false, error: null })
    callbacksRef.current.onReadyChange?.(false)
    const iframe = document.createElement('iframe')
    iframe.className = 'artwork-iframe'
    iframe.title = artworkTitle || scriptName
    iframe.allow = 'microphone'
    // The flower study positions its canvas and sliders with absolute pixels.
    if (scriptName === 'p32.js') {
      iframe.style.minWidth = '1520px'
      iframe.style.minHeight = '840px'
    }
    let controlsRestored = false
    const watchdog = window.setTimeout(() => {
      setStatus({ ready: false, error: 'The artwork took too long to load. Please retry.' })
      callbacksRef.current.onReadyChange?.(false)
    }, FRAME_TIMEOUT + 5000)
    const receive = (event) => {
      if (event.source !== iframe.contentWindow || event.data?.channel !== FRAME_CHANNEL) return
      const message = event.data
      if (message.type === 'viewport' && typeof message.zoom === 'number' && ['inspect', 'interact'].includes(message.mode)) {
        callbacksRef.current.onViewportChange?.({ zoom: message.zoom, mode: message.mode })
      } else if (message.type === 'shortcut' && typeof message.key === 'string') {
        callbacksRef.current.onShortcut?.(message.key)
      } else if (message.type === 'error') {
        window.clearTimeout(watchdog)
        setStatus({ ready: false, error: message.message || 'The artwork could not be loaded.' })
        callbacksRef.current.onReadyChange?.(false)
      } else if (message.type === 'ready' && typeof message.ready === 'boolean') {
        if (message.ready) {
          window.clearTimeout(watchdog)
          if (!controlsRestored) {
            controlsRestored = true
            const { category, single } = controlsRef.current
            if (needsCategories && category !== 'geometric') iframe.contentWindow.postMessage({ type: 'setCategory', category }, '*')
            if (scriptName === 'p49.js' && single) iframe.contentWindow.postMessage({ type: 'setSingleShapeMode', enabled: true }, '*')
          }
        }
        setStatus({ ready: message.ready, error: null })
        callbacksRef.current.onReadyChange?.(message.ready)
      }
    }
    window.addEventListener('message', receive)
    iframe.srcdoc = createArtworkDocument(scriptName)
    iframeRef.current = iframe
    containerRef.current.appendChild(iframe)
    return () => {
      window.clearTimeout(watchdog)
      window.removeEventListener('message', receive)
      iframe.remove()
      if (iframeRef.current === iframe) iframeRef.current = null
    }
  }, [scriptName, artworkTitle, revision, needsCategories])

  const updateControl = (next, message) => {
    controlsRef.current = next
    setControls(next)
    iframeRef.current?.contentWindow?.postMessage(message, '*')
  }
  return (
    <div className="artwork-wrapper">
      <div ref={containerRef} className="artwork-container" aria-busy={!status.ready && !status.error}>
        {!status.ready && !status.error && <div className="artwork-loading" role="status">Loading artwork…</div>}
        {status.error && (
          <div className="artwork-error" role="status">
            <p>{status.error}</p>
            <button type="button" onClick={reload}>Retry artwork</button>
          </div>
        )}
      </div>
      {needsCategories && (
        <div className="category-buttons" role="group" aria-label="Artwork shape options">
          {CATEGORIES.map((category) => (
            <button key={category} type="button"
              className={`category-btn ${controls.category === category ? 'selected' : ''}`}
              aria-pressed={controls.category === category} aria-label={`Shape category: ${category}`}
              onClick={() => updateControl({ ...controls, category }, { type: 'setCategory', category })}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
          {scriptName === 'p49.js' && (
            <button type="button" className={`category-btn toggle-btn ${controls.single ? 'selected' : ''}`}
              aria-label="Use a single shape" aria-pressed={controls.single}
              onClick={() => updateControl({ ...controls, single: !controls.single }, { type: 'setSingleShapeMode', enabled: !controls.single })}>
              Single
            </button>
          )}
        </div>
      )}
    </div>
  )
})

export default ArtworkRenderer
