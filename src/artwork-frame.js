import { P5_MAIN_URL, P5_SOUND_URL } from './config/constants'
import { installCanvasViewport } from './canvas-viewport'

export const FRAME_CHANNEL = 'workshop-artwork'
export const FRAME_TIMEOUT = 30000

// Runs before p5 or the artwork registers any event handlers.
function installFrameBridge(channel, timeout, scriptName) {
  let loaded = false
  let failed = false
  let lastReady = null
  let deadline = Date.now() + timeout
  const nativeLayout = /^(p32|p63|p64|p66|p8[0-6])\.js$/.test(scriptName)
  const send = (type, detail = {}) => parent.postMessage({ channel, type, ...detail }, '*')
  const report = (ready) => {
    if (ready !== lastReady) {
      lastReady = ready
      send('ready', { ready })
    }
  }
  const fail = (message) => {
    if (failed) return
    failed = true
    report(false)
    send('error', { message })
  }
  window.__artworkFrame = {
    fail,
    loaded: () => { loaded = true },
    wait: () => { deadline = Date.now() + timeout; report(false) },
  }
  window.addEventListener('error', (event) => {
    if (event.message) fail(event.message)
    else if (event.target?.tagName === 'SCRIPT') fail('An artwork dependency could not be loaded.')
  }, true)
  window.addEventListener('unhandledrejection', (event) => {
    fail(event.reason?.message || 'The artwork could not finish loading.')
  })
  window.addEventListener('keydown', (event) => {
    const target = event.target
    if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return
    if (event.shiftKey && !['S', 'R', 'F', '+'].includes(event.key)) return
    if (target?.isContentEditable || target?.closest?.('input, textarea, select')) return
    if (event.repeat) return
    if (!['ArrowLeft', 'ArrowRight', 'Escape', 's', 'S', 'r', 'R', 'f', 'F', '+', '-', '=', '/'].includes(event.key) && !/^[0-9]$/.test(event.key)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    send('shortcut', { key: event.key })
  }, true)
  const fit = (canvas, instance) => {
    if (nativeLayout || !canvas?.classList.contains('p5Canvas')) return
    const width = instance.width
    const height = instance.height
    const scale = Math.min(1, Math.max(1, innerWidth) / width, Math.max(1, innerHeight) / height)
    // CSS sizing keeps the pixel backing and p5's scaled mouse coordinates.
    canvas.style.width = `${width * scale}px`
    canvas.style.height = `${height * scale}px`
  }
  const poll = () => {
    if (failed) return
    const canvas = document.querySelector('canvas.p5Canvas') || document.querySelector('canvas')
    const instance = window.p5?.instance
    const flags = [window.__ARTWORK_READY__, window.__SUMMER_READY__]
    const rendered = !window.draw || (instance?.frameCount || window.frameCount) > 0
    const ready = Boolean(loaded && instance?._setupDone && rendered && canvas?.width && canvas?.height
      && flags.every((flag) => flag === undefined || flag === true))
    if (lastReady === true && !ready) deadline = Date.now() + timeout
    if (ready) {
      fit(canvas, instance)
      window.__canvasViewport?.attach(canvas)
    }
    report(ready)
    if (!ready && Date.now() > deadline) fail('The artwork took too long to load. Please retry.')
  }
  window.addEventListener('resize', poll)
  window.setInterval(poll, 120)
}

const scriptLiteral = (value) => JSON.stringify(value).replaceAll('<', '\\u003c')
const attribute = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')

export function createArtworkDocument(scriptName) {
  const scriptUrl = `/artworks/${encodeURIComponent(scriptName)}?t=${Date.now()}`
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html{margin:0;min-height:100%;background:#f7f7f4;overflow:hidden}canvas{display:block}.p63-panel{max-height:calc(100vh - 36px);overflow-y:auto;box-sizing:border-box}</style>
<script>(${installCanvasViewport.toString()})(${scriptLiteral(FRAME_CHANNEL)});</script>
<script>(${installFrameBridge.toString()})(${scriptLiteral(FRAME_CHANNEL)},${FRAME_TIMEOUT},${scriptLiteral(scriptName)});</script>
<script src="${attribute(P5_MAIN_URL)}" onerror="window.__artworkFrame.fail('Could not load p5.js. Please retry.')"></script>
<script src="${attribute(P5_SOUND_URL)}" onerror="window.__artworkFrame.fail('Could not load p5 sound. Please retry.')"></script>
</head><body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh;width:100%;background:#f7f7f4">
<script src="${attribute(scriptUrl)}" onerror="window.__artworkFrame.fail('Could not load the artwork. Please retry.')"></script>
<script>window.__artworkFrame.loaded();</script>
</body></html>`
}
