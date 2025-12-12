import { useCallback } from 'react'

/**
 * Hook for saving canvas content as PNG
 * @param {Object} currentArtwork - Current artwork object with file property
 * @returns {Function} Save handler function
 */
export function useCanvasSave(currentArtwork) {
  const handleSave = useCallback(() => {
    const iframe = document.querySelector('iframe')
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    const canvas = iframeDoc.querySelector('canvas')
    
    if (canvas) {
      const link = document.createElement('a')
      const filename = `${currentArtwork.file.replace('.js', '')}.png`
      link.download = filename
      link.href = canvas.toDataURL()
      link.click()
    }
  }, [currentArtwork])

  return handleSave
}

