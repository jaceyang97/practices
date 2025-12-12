import { useEffect } from 'react'

/**
 * Hook for handling keyboard shortcuts
 * @param {Object} handlers - Object containing callback functions
 * @param {Function} handlers.onNext - Called on ArrowRight
 * @param {Function} handlers.onPrev - Called on ArrowLeft
 * @param {Function} handlers.onSave - Called on 'S' key
 * @param {Function} handlers.onNavigate - Called with number (0-9) for direct navigation
 * @param {number[]} validIds - Array of valid artwork IDs for number navigation
 */
export function useKeyboardShortcuts({ onNext, onPrev, onSave, onNavigate, validIds = [] }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Arrow keys for navigation
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        onNext?.()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrev?.()
      }
      // Number keys for direct access (0-9)
      else if (e.key >= '0' && e.key <= '9' && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key)
        if (validIds.includes(num)) {
          e.preventDefault()
          onNavigate?.(num)
        }
      }
      // S key to save
      else if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onSave?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrev, onSave, onNavigate, validIds])
}

