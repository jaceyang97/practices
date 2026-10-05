import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ArtworkRenderer from './ArtworkRenderer'
import ArtworkGrid from './components/ArtworkGrid'
import WorkshopHeader from './components/WorkshopHeader'
import PreviewToolbar from './components/PreviewToolbar'
import { filterArtworks, workshopArtworks } from './artworks-data'
import { useArtworkNavigation, useKeyboardShortcuts, useCanvasSave } from './hooks'
import { BLOCKED_ARTWORK_IDS } from './config/constants'

const initialParams = new URLSearchParams(window.location.search)

function App() {
  const [view, setView] = useState(initialParams.get('view') === 'preview' ? 'preview' : 'browse')
  const [query, setQuery] = useState(initialParams.get('q') || '')
  const [artist, setArtist] = useState(initialParams.get('artist') || '')
  const [order, setOrder] = useState(initialParams.get('order') === 'oldest' ? 'oldest' : 'newest')
  const [focused, setFocused] = useState(false)
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
    } else {
      restoreBrowse.current = true
      setFocused(false)
    }
    setView(nextView)
  }, [view])
  const openArtwork = useCallback(id => {
    navigateToArtwork(id)
    changeView('preview')
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
    if (key === '/') { searchRef.current?.focus(); return true }
    if (/^[0-9]$/.test(key) && allIds.includes(Number(key))) { openArtwork(Number(key)); return true }
    if (key === 'Escape' && view === 'preview') {
      if (focused) setFocused(false)
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
    return false
  }, [view, focused, changeView, navigateNext, navigatePrev, handleSave, handleRegenerate, allIds, openArtwork])
  useKeyboardShortcuts({ onShortcut })
  const clearFilters = () => { setQuery(''); setArtist('') }

  return (
    <div className={`workshop ${view === 'preview' ? 'preview-mode' : 'browse-mode'} ${focused ? 'is-focused' : ''}`}>
      <a href="#workshop-content" className="skip-link">Skip to works</a>
      <WorkshopHeader view={view} onViewChange={changeView} total={workshopArtworks.length} count={filtered.length}
        query={query} onQueryChange={setQuery} artist={artist} onArtistChange={setArtist}
        order={order} onOrderChange={setOrder} searchRef={searchRef} />
      {view === 'browse' ? (
        <main id="workshop-content" className="browse-grid" aria-label="All works">
          <ArtworkGrid artworks={filtered} currentId={currentId} onSelect={openArtwork} onClear={clearFilters} />
        </main>
      ) : (
        <main id="workshop-content" className="workbench">
          <aside className="workbench-browser" aria-label="Switch artwork">
            <ArtworkGrid artworks={filtered} currentId={currentId} onSelect={openArtwork} compact onClear={clearFilters} />
          </aside>
          <section className="workbench-preview" aria-label="Interactive artwork preview">
            <PreviewToolbar artwork={currentArtwork} position={navigationIds.indexOf(currentId) + 1}
              count={filtered.length} ready={ready} focused={focused} onPrev={navigatePrev} onNext={navigateNext}
              onSave={handleSave} onRegenerate={handleRegenerate} onReload={() => rendererRef.current?.reload()}
              onFocus={() => setFocused(value => !value)} onBrowse={() => changeView('browse')} />
            <ArtworkRenderer key={currentId} ref={rendererRef} scriptName={currentArtwork.file}
              artworkTitle={currentArtwork.title} onReadyChange={setReady} onShortcut={onShortcut} />
            <footer className="preview-footer">
              <span role="status">{status || (ready ? 'Interactive preview' : 'Loading artwork…')}</span>
              <details className="shortcut-help"><summary>Shortcuts</summary>
                <div><p><kbd>←</kbd> <kbd>→</kbd> Switch work</p><p><kbd>R</kbd> Regenerate</p>
                  <p><kbd>S</kbd> Save PNG</p><p><kbd>/</kbd> Search</p><p><kbd>0–9</kbd> Jump to p0–p9</p><p><kbd>Esc</kbd> Back</p></div>
              </details>
            </footer>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
