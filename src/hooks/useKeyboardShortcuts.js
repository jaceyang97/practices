import { useEffect } from 'react'

export function useKeyboardShortcuts({ onShortcut }) {
  useEffect(() => {
    const handleKeyDown = event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
      if (event.target.closest?.('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return
      if (onShortcut(event.key)) event.preventDefault()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onShortcut])
}
