import {BrowserWindow, screen} from 'electron'

let timer: NodeJS.Timeout | null = null
let vx = 0.8 // 降低速度
let direction: 1 | -1 = 1 // 1: 向右, -1: 向左
let mode: 'quiet'|'roam'|'mischief' = 'roam'
let isPaused = false
let petStage: 'egg' | 'baby' | 'adult' = 'egg'

function boundsUnion() {
  const displays = screen.getAllDisplays()
  const x0 = Math.min(...displays.map(d => d.bounds.x))
  const y0 = Math.min(...displays.map(d => d.bounds.y))
  const x1 = Math.max(...displays.map(d => d.bounds.x + d.bounds.width))
  const y1 = Math.max(...displays.map(d => d.bounds.y + d.bounds.height))
  return {x: x0, y: y0, width: x1 - x0, height: y1 - y0}
}

export function setMode(m: 'quiet'|'roam'|'mischief') {
  mode = m
  if (mode === 'quiet') vx = 0
  if (mode === 'roam') vx = 0.8
  if (mode === 'mischief') vx = 1.5
}

export function setPetStage(stage: 'egg' | 'baby' | 'adult') {
  petStage = stage
}

export function start(win: BrowserWindow) {
  stop()
  timer = setInterval(() => {
    // 蛋状态不能移动
    if (mode === 'quiet' || isPaused || petStage === 'egg') return
    try {
      const u = boundsUnion()
      const b = win.getBounds()
      
      // 横向移动
      let nx = b.x + vx * direction
      
      // 碰到边界则转向
      if (nx < u.x || nx + b.width > u.x + u.width) {
        direction *= -1
        nx = b.x + vx * direction
      }
      
      // 淘气模式：左右摇摆
      if (mode === 'mischief') {
        nx += Math.sin(Date.now() / 120) * 3
      }
      
      // Y轴保持不变，横向行走
      win.setPosition(Math.round(nx), b.y)
    } catch {}
  }, 16)
}

export function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

export function pause() {
  isPaused = true
}

export function resume() {
  isPaused = false
}
