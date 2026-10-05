import { useCallback } from 'react'

export function useCanvasSave(currentArtwork, rendererRef) {
  return useCallback(async () => {
    if (!rendererRef.current) throw new Error('The artwork is still loading. Try again in a moment.')
    return rendererRef.current.save(`${currentArtwork.file.replace('.js', '')}.png`)
  }, [currentArtwork, rendererRef])
}
