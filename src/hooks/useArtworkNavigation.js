import { useState, useCallback, useMemo, useEffect } from 'react'
import { getArtworkById, getAllArtworkIds } from '../artworks-manifest'

function readSelectedId(allIds) {
  const parameter = new URLSearchParams(window.location.search).get('artwork')
  let saved
  try { saved = localStorage.getItem('workshop-artwork') } catch { /* Storage can be unavailable. */ }
  const id = Number((parameter || saved || '').replace(/^p/, ''))
  return (parameter || saved) && allIds.includes(id) ? id : Math.max(...allIds)
}

export function useArtworkNavigation(blockedIds = [], navigationIds) {
  const allIds = useMemo(() => getAllArtworkIds().filter(id => !blockedIds.includes(id)), [blockedIds])
  const [currentId, setCurrentId] = useState(() => readSelectedId(allIds))
  const currentArtwork = getArtworkById(currentId)
  const orderedIds = navigationIds || allIds
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('artwork', String(currentId))
    window.history.replaceState(null, '', url)
    try { localStorage.setItem('workshop-artwork', String(currentId)) } catch { /* Selection still lives in the URL. */ }
  }, [currentId])
  useEffect(() => {
    const onPopState = () => setCurrentId(readSelectedId(allIds))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [allIds])
  const navigateToArtwork = useCallback(id => {
    if (allIds.includes(id)) setCurrentId(id)
  }, [allIds])
  const navigateNext = useCallback(() => {
    if (!orderedIds.length) return
    setCurrentId(id => orderedIds[(orderedIds.indexOf(id) + 1) % orderedIds.length])
  }, [orderedIds])
  const navigatePrev = useCallback(() => {
    if (!orderedIds.length) return
    setCurrentId(id => {
      const index = orderedIds.indexOf(id)
      return orderedIds[index < 0 ? orderedIds.length - 1 : (index - 1 + orderedIds.length) % orderedIds.length]
    })
  }, [orderedIds])
  return { currentId, currentArtwork, allIds, navigateToArtwork, navigateNext, navigatePrev }
}
