// Serialized into the iframe: keep this function self-contained.
export function installCanvasViewport(channel) {
  let canvas = null
  let original = null
  let signature = ''
  let zoom = 1
  let x = 0
  let y = 0
  let mode = 'inspect'
  let target = { zoom, x, y }
  let animation = 0
  let drag = null
  let lastReport = 0
  let reportedZoom = null
  let reportedMode = null
  const controls = 'input,textarea,select,button,a,label,[contenteditable],[role="button"],[role="slider"],.p63-panel,.p64-sidebar,.p66-sidebar'
  const state = () => ({ zoom, mode })
  const report = (force = false) => {
    const now = performance.now()
    if (!force && (now - lastReport < 70 || (zoom === reportedZoom && mode === reportedMode))) return
    lastReport = now
    reportedZoom = zoom
    reportedMode = mode
    parent.postMessage({ channel, type: 'viewport', ...state() }, '*')
  }
  const eligible = (event) => {
    const element = event.target
    if (!canvas || element?.closest?.(controls)) return false
    return element === canvas || element === document.body || element === document.documentElement
      || element?.tagName === 'MAIN' || element?.classList?.contains('p64-stage') || element?.classList?.contains('p66-stage')
  }
  const stop = (event) => { event.preventDefault(); event.stopImmediatePropagation() }
  const apply = () => {
    if (!canvas) return
    canvas.style.transformOrigin = '0 0'
    canvas.style.transform = `translate(${x}px, ${y}px) scale(${zoom})`
    canvas.style.cursor = mode === 'inspect' ? (drag ? 'grabbing' : 'grab') : original.cursor
    canvas.style.touchAction = mode === 'inspect' ? 'none' : original.touchAction
    canvas.style.willChange = 'transform'
    report()
  }
  const cancel = () => { cancelAnimationFrame(animation); animation = 0; target = { zoom, x, y } }
  const clearDrag = () => {
    const id = drag?.id
    drag = null
    if (id !== undefined && canvas?.hasPointerCapture?.(id)) canvas.releasePointerCapture(id)
  }
  const fit = () => {
    cancel()
    clearDrag()
    zoom = 1
    x = y = 0
    target = { zoom, x, y }
    apply()
    report(true)
  }
  const animate = () => {
    const close = Math.abs(target.zoom - zoom) < 0.0001 && Math.abs(target.x - x) < 0.02 && Math.abs(target.y - y) < 0.02
    if (close) {
      ({ zoom, x, y } = target)
      animation = 0
      apply()
      report(true)
      return
    }
    zoom += (target.zoom - zoom) * 0.24
    x += (target.x - x) * 0.24
    y += (target.y - y) * 0.24
    apply()
    animation = requestAnimationFrame(animate)
  }
  const zoomAt = (factor, clientX, clientY) => {
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const next = Math.max(0.1, Math.min(20, target.zoom * factor))
    // With origin 0,0, this point stays fixed for every interpolated frame.
    target = {
      zoom: next,
      x: x + (clientX - rect.left) * (1 - next / zoom),
      y: y + (clientY - rect.top) * (1 - next / zoom),
    }
    if (!animation) animation = requestAnimationFrame(animate)
  }
  const zoomBy = (factor) => {
    const rect = canvas?.getBoundingClientRect()
    if (rect) zoomAt(factor, Math.max(0, Math.min(innerWidth, rect.left + rect.width / 2)), Math.max(0, Math.min(innerHeight, rect.top + rect.height / 2)))
  }
  const setMode = (next) => {
    if (!['inspect', 'interact'].includes(next)) return
    cancel()
    clearDrag()
    mode = next
    apply()
    report(true)
  }
  window.__canvasViewport = {
    fit, zoomIn: () => zoomBy(1.25), zoomOut: () => zoomBy(0.8), setMode, getState: state,
    attach(next) {
      const nextSignature = `${next.width}/${next.height}/${next.style.width}/${next.style.height}`
      if (next === canvas && signature === nextSignature) return
      if (next !== canvas) {
        canvas = next
        original = { cursor: canvas.style.cursor, touchAction: canvas.style.touchAction }
      }
      signature = nextSignature
      fit()
    },
  }
  window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) event.preventDefault()
    if (mode !== 'inspect' || !eligible(event)) return
    stop(event)
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1)
    zoomAt(Math.exp(-Math.max(-300, Math.min(300, delta)) * 0.0018), event.clientX, event.clientY)
  }, { capture: true, passive: false })
  window.addEventListener('pointerdown', (event) => {
    if (mode !== 'inspect' || !eligible(event) || event.button !== 0) return
    stop(event)
    if (drag) return
    cancel()
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
    window.focus()
    canvas.focus?.({ preventScroll: true })
    try { canvas.setPointerCapture?.(event.pointerId) } catch { /* Synthetic or cancelled pointer. */ }
    apply()
  }, true)
  window.addEventListener('pointermove', (event) => {
    if (mode !== 'inspect' || (!drag && !eligible(event))) return
    stop(event)
    if (!drag || drag.id !== event.pointerId) return
    x += event.clientX - drag.x
    y += event.clientY - drag.y
    drag.x = event.clientX
    drag.y = event.clientY
    target = { zoom, x, y }
    apply()
  }, true)
  const end = (event) => {
    if (mode !== 'inspect' || (!drag && !eligible(event))) return
    stop(event)
    if (drag?.id === event.pointerId) {
      clearDrag()
      apply()
    }
  }
  window.addEventListener('pointerup', end, true)
  window.addEventListener('pointercancel', end, true)
  window.addEventListener('lostpointercapture', end, true)
  window.addEventListener('blur', () => { clearDrag(); apply() })
  // p5 listens to mouse events on window; capturing only pointer events would
  // still allow a click or drag to regenerate its painting.
  for (const type of ['mousedown', 'mouseup', 'mousemove', 'click', 'touchstart', 'touchmove', 'touchend']) {
    window.addEventListener(type, (event) => {
      if (mode === 'inspect' && (drag || eligible(event))) stop(event)
    }, { capture: true, passive: false })
  }
  window.addEventListener('dblclick', (event) => {
    if (mode !== 'inspect' || !eligible(event)) return
    stop(event)
    fit()
  }, true)
  window.addEventListener('resize', () => requestAnimationFrame(fit))
  report(true)
}
