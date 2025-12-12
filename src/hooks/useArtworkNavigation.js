import { useState, useCallback, useMemo } from 'react'
import { getArtworkById, getAllArtworkIds } from '../artworks-manifest'

/**
 * Hook for managing artwork navigation state and actions
 * @param {number[]} blockedIds - Array of artwork IDs to exclude from navigation
 * @returns Navigation state and methods
 */
export function useArtworkNavigation(blockedIds = []) {
  const allIds = useMemo(() => {
    return getAllArtworkIds().filter(id => !blockedIds.includes(id))
  }, [blockedIds])

  const latestId = useMemo(() => Math.max(...allIds), [allIds])

  const [currentId, setCurrentId] = useState(latestId)
  const currentArtwork = getArtworkById(currentId)

  const navigateToArtwork = useCallback((id) => {
    if (allIds.includes(id)) {
      setCurrentId(id)
    }
  }, [allIds])

  const navigateNext = useCallback(() => {
    const currentIndex = allIds.indexOf(currentId)
    if (currentIndex === -1) {
      setCurrentId(allIds[0])
      return
    }
    const nextIndex = (currentIndex + 1) % allIds.length
    setCurrentId(allIds[nextIndex])
  }, [currentId, allIds])

  const navigatePrev = useCallback(() => {
    const currentIndex = allIds.indexOf(currentId)
    if (currentIndex === -1) {
      setCurrentId(allIds[allIds.length - 1])
      return
    }
    const prevIndex = (currentIndex - 1 + allIds.length) % allIds.length
    setCurrentId(allIds[prevIndex])
  }, [currentId, allIds])

  return {
    currentId,
    currentArtwork,
    allIds,
    navigateToArtwork,
    navigateNext,
    navigatePrev
  }
}

