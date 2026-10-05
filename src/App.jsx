import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ArtworkRenderer from './ArtworkRenderer'
import ArtworkGrid from './components/ArtworkGrid'
import WorkshopHeader from './components/WorkshopHeader'
import PreviewToolbar from './components/PreviewToolbar'
import ArtworkBrowser from './components/ArtworkBrowser'
import ViewportControls from './components/ViewportControls'
import { filterArtworks, workshopArtworks } from './artworks-data'
import { useArtworkNavigation, useKeyboardShortcuts, useCanvasSave } from './hooks'
import { BLOCKED_ARTWORK_IDS } from './config/constants'

const initialParams = new URLSearchParams(window.location.search)

function App() {
  const [view, setView] = useState(initialParams.get('view') === 'preview' ? 'preview' : 'browse')
  const [query, setQuery] = useState(initialParams.get('q') || '')
  const [artist, setArtist] = useState(initialParams.get('artist') || '')
  const [order, setOrder] = useState(initialParams.get('order') === 'oldest' ? 'oldest' : 'newest')
  const [focused, setFocused] = useState(true)
  const [viewport, setViewport] = useState({ zoom: 1, mode: 'inspect' })
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('')
  const rendererRef = useRef(null)
  const searchRef = useRef(null)
  const browseScroll = useRef(0)
  const restoreBrowse = useRef(false)
  const filtered = useMemo(() => filterArtworks(query, artist, order), [query, artist, order])
  const navigationIds = useMemo(() => filtered.map(artwork => artwork.id), [filtered])
  const { currentId, currentArtwork, allIds, navigateToArtwork, navigateNext, navigatePrev } =
    useArtworkNavigation(BLOCKED_ARTWORK_IDS, navigationIds)
  const saveCanvas = useCanvasSave(currentArtwork, rendererRef)

  useEffect(() => {
    const url = new URL(window.location.href)
    for (const [key, value] of Object.entries({ view, q: query, artist, order })) {
      if (value && !(key === 'order' && value === 'newest')) url.searchParams.set(key, value)
      else url.searchParams.delete(key)
    }
    window.history.replaceState(null, '', url)
  }, [view, query, artist, order])
  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      setView(params.get('view') === 'preview' ? 'preview' : 'browse')
      setQuery(params.get('q') || '')
      setArtist(params.get('artist') || '')
      setOrder(params.get('order') === 'oldest' ? 'oldest' : 'newest')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  useEffect(() => {
    document.title = view === 'preview' ? `${currentArtwork.title} · Workshop` : 'Workshop'
    setStatus('')
  }, [currentId, currentArtwork.title, view])
  useEffect(() => {
    if (view === 'browse' && restoreBrowse.current) {
      window.scrollTo(0, browseScroll.current)
      document.querySelector(`[data-artwork-id="${currentId}"]`)?.focus({ preventScroll: true })
      restoreBrowse.current = false
    }
  }, [view, currentId])

  const changeView = useCallback(nextView => {
    if (nextView === view) return
    if (nextView === 'preview') {
      browseScroll.current = window.scrollY
      window.scrollTo(0, 0)
      setFocused(true)
    } else {
      restoreBrowse.current = true
      setFocused(false)
    }
    setView(nextView)
  }, [view])
  const openArtwork = useCallback(id => {
    navigateToArtwork(id)
    changeView('preview')
    setFocused(true)
  }, [navigateToArtwork, changeView])
  const handleSave = useCallback(async () => {
    if (!ready) return
    try {
      const size = await saveCanvas()
      setStatus(`Saved p${currentId}.png · ${size.width} × ${size.height}`)
    } catch (error) { setStatus(error.message || 'Could not save this canvas.') }
  }, [ready, saveCanvas, currentId])
  const handleRegenerate = useCallback(() => {
    if (ready) { setStatus(''); rendererRef.current?.regenerate() }
  }, [ready])
  const onShortcut = useCallback(key => {
    if (key === '/') {
      if (view === 'preview') setFocused(false)
      requestAnimationFrame(() => searchRef.current?.focus())
      return true
    }
    if (/^[0-9]$/.test(key) && allIds.includes(Number(key))) { openArtwork(Number(key)); return true }
    if (key === 'Escape' && view === 'preview') {
      const menu = document.querySelector('.preview-menu[open]')
      if (menu) menu.removeAttribute('open')
      else if (!focused) setFocused(true)
      else changeView('browse')
      return true
    }
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      if (view === 'browse') changeView('preview')
      key === 'ArrowRight' ? navigateNext() : navigatePrev()
      return true
    }
    if (view === 'preview' && key.toLowerCase() === 's') { handleSave(); return true }
    if (view === 'preview' && key.toLowerCase() === 'r') { handleRegenerate(); return true }
    if (view === 'preview' && key.toLowerCase() === 'f') { rendererRef.current?.fitView(); return true }
    if (view === 'preview' && ['+', '='].includes(key)) { rendererRef.current?.zoomIn(); return true }
    if (view === 'preview' && key === '-') { rendererRef.current?.zoomOut(); return true }
    return false
  }, [view, focused, changeView, navigateNext, navigatePrev, handleSave, handleRegenerate, allIds, openArtwork])
  useKeyboardShortcuts({ onShortcut })
  const clearFilters = () => { setQuery(''); setArtist('') }

  return (
    <div className={`workshop ${view === 'preview' ? 'preview-mode' : 'browse-mode'} ${focused ? 'is-focused' : ''}`}>
      <a href="#workshop-content" className="skip-link">Skip to works</a>
      {view === 'browse' && <WorkshopHeader view={view} onViewChange={changeView} total={workshopArtworks.length} count={filtered.length}
        query={query} onQueryChange={setQuery} artist={artist} onArtistChange={setArtist}
        order={order} onOrderChange={setOrder} searchRef={searchRef} />}
      {view === 'browse' ? (
        <main id="workshop-content" className="browse-grid" aria-label="All works">
          <ArtworkGrid artworks={filtered} currentId={currentId} onSelect={openArtwork} onClear={clearFilters} />
        </main>
      ) : (
        <main id="workshop-content" className="workbench">
          {!focused && <ArtworkBrowser artworks={filtered} currentId={currentId} onSelect={openArtwork} onClear={clearFilters}
            query={query} onQueryChange={setQuery} artist={artist} onArtistChange={setArtist}
            order={order} onOrderChange={setOrder} searchRef={searchRef} onClose={() => setFocused(true)} />}
          <section className="workbench-preview" aria-label="Interactive artwork preview">
            <PreviewToolbar artwork={currentArtwork} position={navigationIds.indexOf(currentId) + 1}
              count={filtered.length} ready={ready} browserOpen={!focused} onPrev={navigatePrev} onNext={navigateNext}
              onSave={handleSave} onRegenerate={handleRegenerate} onReload={() => rendererRef.current?.reload()}
              onToggleBrowser={() => setFocused(value => !value)} onBrowse={() => changeView('browse')} />
            <div className="canvas-stage">
              <ArtworkRenderer key={currentId} ref={rendererRef} scriptName={currentArtwork.file}
                artworkTitle={currentArtwork.title} onReadyChange={setReady} onShortcut={onShortcut} onViewportChange={setViewport} />
              <ViewportControls viewport={viewport} ready={ready} onZoomIn={() => rendererRef.current?.zoomIn()}
                onZoomOut={() => rendererRef.current?.zoomOut()} onFit={() => rendererRef.current?.fitView()}
                onModeChange={mode => rendererRef.current?.setInteractionMode(mode)} />
              <span className={`canvas-status ${status ? 'has-message' : ''}`} role="status">{status}</span>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
