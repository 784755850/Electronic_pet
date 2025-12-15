import type {BrowserWindow} from 'electron'
import {screen} from 'electron'

type DetectionResult = {isFullscreen: boolean, app?: string}

async function detectActiveWindow(): Promise<DetectionResult> {
  try {
    // dynamic import; may fail if module not installed
    const mod = await import('active-win')
    const info = await mod.default()
    if (!info) return {isFullscreen: false}
    const displays = screen.getAllDisplays()
    const on = displays.find(d => {
      const b = d.bounds
      const w = info.bounds
      const epsilon = 4
      return Math.abs(w.x - b.x) <= epsilon &&
             Math.abs(w.y - b.y) <= epsilon &&
             Math.abs((w.x + w.width) - (b.x + b.width)) <= epsilon &&
             Math.abs((w.y + w.height) - (b.y + b.height)) <= epsilon
    })
    return {isFullscreen: !!on, app: info.owner?.name}
  } catch {
    return {isFullscreen: false}
  }
}

let timer: NodeJS.Timeout | null = null
let userMode: 'quiet'|'roam'|'mischief' = 'roam'
let effectiveMode: 'quiet'|'roam'|'mischief' = 'roam'

export function setUserMode(m: typeof userMode) {
  userMode = m
}

export function getEffectiveMode() {
  return effectiveMode
}

export function start(win: BrowserWindow, onMode: (m: typeof userMode) => void) {
  stop()
  timer = setInterval(async () => {
    try {
      const res = await detectActiveWindow()
      const next = res.isFullscreen ? 'quiet' : userMode
      if (next !== effectiveMode) {
        effectiveMode = next
        onMode(effectiveMode)
        win.webContents.send('mode', effectiveMode)
      }
    } catch {}
  }, 1000)
}

export function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
