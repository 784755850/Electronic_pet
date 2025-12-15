// 渲染进程脚本 - 像素风电子宠物
// @ts-check

(function() {

// 获取DOM元素
const petCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('pet-canvas'))
const statusCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('status-canvas'))
const bubbleEl = document.getElementById('bubble')
const progressBarContainer = document.getElementById('progress-bar-container')
const progressBarFill = document.getElementById('progress-bar-fill')

/** @type {any} */
let pet = null
/** @type {any} */
let player = null
/** @type {any} */
let pixelRenderer = null
let isMoving = false
let moveDirection = 1
/** @type {any} */
let colorMenu = null

let lastTouchTime = 0
const TOUCH_COOLDOWN = 2000

// 颜色主题名称映射
const THEME_NAMES = {
  purple: 'themes.purple',
  green: 'themes.green',
  blue: 'themes.blue',
  pink: 'themes.pink',
  orange: 'themes.orange',
  settings: 'themes.settings'
}

/** @type {any} */
let rendererI18n = {}

/**
 * @param {string} key 
 */
function t(key) {
  const keys = key.split('.')
  let v = rendererI18n
  for (const k of keys) {
    if (v && v[k]) v = v[k]
    else return key
  }
  return v || key
}

const api = /** @type {any} */ (window).electronAPI

if (api) {
  api.getI18nData().then((/** @type {any} */ data) => rendererI18n = data)
  api.onLanguageChange((/** @type {any} */ data) => rendererI18n = data)
}

// 初始化萌系渲染器
const CuteRenderer = /** @type {any} */ (window).CuteRenderer
if (petCanvas && CuteRenderer) {
  // @ts-ignore
  pixelRenderer = new CuteRenderer(petCanvas, 1)
  pixelRenderer.setScale(1)
  
  // 启动动画循环
  pixelRenderer.startAnimation(() => {
    if (pet) {
      updatePetDisplay()
    }
  })
}

// 更新宠物显示 - 渲染
function updatePetDisplay() {
  if (!pet || !pixelRenderer) return
  
  // 传递颜色信息
  const theme = pet.settings?.colorTheme || 'purple'
  const colors = player?.settings?.colorTheme === 'custom' 
    ? player.settings.customColors 
    : (/** @type {any} */ (window).SPRITES?.themes?.[theme] || { mid: '#8a8aaa', dark: '#4a4a6a', light: '#b0b0d0' })

  // 获取颜色 - 从 renderer.js 的 THEME_NAMES 映射获取不到颜色值，需要从 CSS 或者硬编码获取
  // 实际上 main process 会发送颜色更新
  // 我们这里尝试从 currentColors 获取，或者 window.SPRITES.themes
  
  pixelRenderer.renderPet(
    pet.stage,
    pet.mood || 50,
    pet.sick || false,
    isMoving,
    moveDirection,
    colors,
    pet.appearanceSeed || 12345
  )
  
  // 更新状态图标
  if (statusCanvas) {
    const ctx = statusCanvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 24, 24)
      
      let showStatus = false
      if (pet.currentAction === 'work') {
        drawPixelIcon(ctx, 'work')
        showStatus = true
      } else if (pet.currentAction === 'study') {
        drawPixelIcon(ctx, 'study')
        showStatus = true
      } else if (pet.sick) {
        drawPixelIcon(ctx, 'sick')
        showStatus = true
      } else if (pet.currentAction === 'sleep') {
        drawPixelIcon(ctx, 'sleep')
        showStatus = true
      }
      
      statusCanvas.classList.toggle('show', showStatus)
    }
  }

  // Update status label
  const statusLabel = document.getElementById('status-label')
  if (statusLabel) {
    let statusText = ''
    if (pet.currentAction === 'work') {
      statusText = t('interaction.work') + '...'
    } else if (pet.currentAction === 'study') {
      statusText = t('interaction.study') + '...'
    } else if (pet.currentAction === 'sleep') {
      statusText = 'Zzz...'
    } else if (pet.sick) {
      statusText = t('status.sick')
    }

    if (statusText) {
      statusLabel.textContent = statusText
      statusLabel.classList.add('show')
    } else {
      statusLabel.classList.remove('show')
    }
  }

  // 更新进度条
  if (progressBarContainer && progressBarFill) {
    let showProgress = false
    if (pet.currentAction !== 'idle' && pet.actionEndsAt && pet.actionTotalDuration) {
      const now = Date.now()
      const remaining = pet.actionEndsAt - now
      if (remaining > 0 && pet.actionTotalDuration > 0) {
        const progress = 1 - (remaining / pet.actionTotalDuration)
        const percent = Math.min(100, Math.max(0, progress * 100))
        progressBarFill.style.width = `${percent}%`
        showProgress = true
      }
    }
    
    progressBarContainer.style.display = showProgress ? 'block' : 'none'
  }
}

// 绘制像素状态图标
/**
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} iconName 
 */
function drawPixelIcon(ctx, iconName) {
  const SPRITES = /** @type {any} */ (window).SPRITES
  const icons = SPRITES?.icons
  if (!icons || !icons[iconName]) return
  
  const iconData = icons[iconName]
  const scale = 3
  const colorMap = ['transparent', '#1a1a2e', '#4a4a6a']
  
  for (let y = 0; y < iconData.length; y++) {
    for (let x = 0; x < iconData[y].length; x++) {
      const pixel = iconData[y][x]
      if (pixel === 0) continue
      ctx.fillStyle = colorMap[pixel]
      ctx.fillRect(x * scale, y * scale, scale, scale)
    }
  }
}

// 显示对话气泡
/** @type {any} */
let typeInterval = null
/** @type {any} */
let hideTimeout = null

/**
 * @param {string} text 
 */
function showBubble(text) {
  if (!bubbleEl) return
  
  // 清除之前的定时器
  if (typeInterval) {
    clearInterval(typeInterval)
    typeInterval = null
  }
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  
  // 加上名字前缀
  const petName = (pet && pet.name) ? pet.name : 'Pet'
  const fullText = `${petName}: ${text}`
  
  // 重置内容
  bubbleEl.textContent = ''
  bubbleEl.classList.add('show')
  
  // 打字机效果
  let i = 0
  typeInterval = setInterval(() => {
    if (!bubbleEl) return
    bubbleEl.textContent += fullText.charAt(i)
    i++
    if (i >= fullText.length) {
      clearInterval(typeInterval)
      typeInterval = null
      
      // 打字结束后保持显示的时间 (基础 3s + 每个字 0.1s)
      const readTime = 3000 + fullText.length * 100
      hideTimeout = setTimeout(() => {
        if (bubbleEl) bubbleEl.classList.remove('show')
      }, readTime)
    }
  }, 50) // 打字速度
}

// 拖动相关变量
let isDragging = false
let dragStarted = false
let dragOffsetX = 0
let dragOffsetY = 0

// 点击宠物 - 抚摸
if (petCanvas) {
  petCanvas.addEventListener('click', (e) => {
    // 防止拖动后触发点击
    if (dragStarted) return
    
    const now = Date.now()
    if (now - lastTouchTime < TOUCH_COOLDOWN) {
      showBubble(t('messages.pet_touch_too_fast'))
      return
    }
    lastTouchTime = now

    console.log(t('messages.pet_touch_log'))
    showBubble(t('messages.pet_touch'))
    
    if (api && api.petAction) {
      api.petAction('touch')
    }
  })
  
  // 鼠标按下 - 开始拖动
  petCanvas.addEventListener('mousedown', (e) => {
    e.preventDefault()
    isDragging = true
    dragStarted = false
    dragOffsetX = e.screenX
    dragOffsetY = e.screenY
    
    // 显示拖动状态 - 渲染手捧宠物
    if (pixelRenderer && pet) {
      const theme = pet.settings?.colorTheme || 'purple'
      const colors = player?.settings?.colorTheme === 'custom' 
        ? player.settings.customColors 
        : (/** @type {any} */ (window).SPRITES?.themes?.[theme] || { mid: '#8a8aaa', dark: '#4a4a6a', light: '#b0b0d0' })
        
      pixelRenderer.renderHolding(pet.stage, pet.appearanceSeed || 12345, colors)
    }
    
    // 通知主进程暂停自动移动
    if (api && api.startDrag) {
      api.startDrag()
    }
  })
  
  // 右键菜单 - 颜色设置
  petCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    if (api && api.popTray) {
      api.popTray()
    }
  })
}

/** @type {HTMLElement | null} */
let overlayEl = null

/**
 * @param {number} x 
 * @param {number} y 
 */
function showOverlayTray(x, y) {
  closeOverlayTray()
  overlayEl = document.createElement('div')
  overlayEl.style.cssText = `
    position: fixed;
    left: ${Math.max(8, x - 80)}px;
    top: ${Math.max(8, y - 80)}px;
    width: 160px;
    height: 160px;
    background-image:
      linear-gradient(45deg, #3a3a4a 25%, transparent 25%),
      linear-gradient(-45deg, #3a3a4a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #3a3a4a 75%),
      linear-gradient(-45deg, transparent 75%, #3a3a4a 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    border: 2px solid #4a4a6a;
    box-shadow: 6px 6px 0 rgba(0,0,0,0.4);
    z-index: 1000;
    font-family: monospace;
    image-rendering: pixelated;
  `
  const title = document.createElement('div')
  title.style.cssText = `
    position: absolute;
    top: 6px;
    left: 8px;
    right: 8px;
    height: 18px;
    background: #1a1a2e;
    color: #c8d8c8;
    border: 2px solid #4a4a6a;
    font-size: 11px;
    line-height: 18px;
    text-align: center;
  `
  title.textContent = pet?.name || 'pet'
  overlayEl.appendChild(title)
  const bars = document.createElement('div')
  bars.style.cssText = `
    position: absolute;
    top: 28px;
    left: 14px;
    right: 14px;
  `
  /**
   * @param {number} val 
   * @param {string} color 
   */
  const bar = (val, color) => {
    const wrap = document.createElement('div')
    wrap.style.cssText = `height:8px;border:2px solid #4a4a6a;background:#1a1a2e;margin:2px 0;`
    const fill = document.createElement('div')
    fill.style.cssText = `height:4px;margin:1px;background:${color};width:${Math.max(0, Math.min(100, val))}%;`
    wrap.appendChild(fill)
    return wrap
  }
  bars.appendChild(bar(100 - (pet?.hunger ?? 50), '#ff8a00'))
  bars.appendChild(bar(pet?.mood ?? 50, '#ff4a4a'))
  overlayEl.appendChild(bars)
  // 中心角色展示（静态像素）
  const center = document.createElement('canvas')
  center.width = 64
  center.height = 64
  center.style.cssText = `
    position:absolute;left:48px;top:52px;
    border:2px solid #4a4a6a;background:#1a1a2e;
    image-rendering: pixelated;
  `
  overlayEl.appendChild(center)
  const CuteRenderer = /** @type {any} */ (window).CuteRenderer
  if (CuteRenderer && pet) {
    const pr = new CuteRenderer(center, 0.5)
    // 传递颜色
    const theme = pet.settings?.colorTheme || 'purple'
    const colors = player?.settings?.colorTheme === 'custom' 
      ? player.settings.customColors 
      : (/** @type {any} */ (window).SPRITES?.themes?.[theme] || { mid: '#8a8aaa', dark: '#4a4a6a', light: '#b0b0d0' })
      
    pr.renderPet(pet.stage, pet.mood || 50, !!pet.sick, false, 1, colors, pet.appearanceSeed || 12345)
  }
  /**
   * @param {string} text 
   * @param {number} left 
   * @param {number} top 
   * @param {() => void} onClick 
   */
  const btn = (text, left, top, onClick) => {
    const el = document.createElement('div')
    el.style.cssText = `
      position:absolute;width:36px;height:36px;border-radius:50%;
      left:${left}px;top:${top}px;border:2px solid #6a4a2a;background:#c8a86a;color:#2a2a2a;
      display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;
      box-shadow: inset -2px -2px 0 rgba(0,0,0,0.3), inset 2px 2px 0 rgba(255,255,255,0.3);
    `
    el.textContent = text
    if (overlayEl) {
      el.onclick = () => { onClick(); closeOverlayTray() }
      overlayEl.appendChild(el)
    }
  }
  btn(t('overlay.status'), 12, 96, () => {
    api && api.openStatus && api.openStatus()
  })
  btn(t('overlay.study'), 48, 116, () => {
    if (api && api.getStudies) {
      api.getStudies().then((/** @type {any[]} */ studies) => {
        if (Array.isArray(studies) && studies[0]) {
          api.startStudy && api.startStudy(studies[0].id)
        }
      })
    }
  })
  btn(t('overlay.work'), 112, 96, () => {
    if (api && api.getJobs) {
      api.getJobs().then((/** @type {any[]} */ jobs) => {
        if (Array.isArray(jobs) && jobs[0]) {
          api.startWork && api.startWork(jobs[0].id)
        }
      })
    }
  })
  btn(t('overlay.shop'), 116, 52, () => {
    if (api && api.getItems) {
      api.getItems().then((/** @type {any[]} */ items) => {
        const it = Array.isArray(items) ? items.find(i => ['bread','soap','ball','cold_medicine'].includes(i.id)) : null
        if (it && api && api.buyItem) {
          api.buyItem(it.id, 1)
        }
      })
    }
  })
  btn(t('overlay.bag'), 48, 16, () => {
    if (player && player.inventory) {
      const id = Object.keys(player.inventory)[0]
      if (id && api && api.useItem) {
        api.useItem(id)
      }
    }
  })
  btn(t('overlay.settings'), 12, 52, () => {
    api && api.openSettings && api.openSettings()
  })
  document.body.appendChild(overlayEl)
  setTimeout(() => {
    document.addEventListener('click', closeOverlayTray, { once: true })
  }, 50)
}
function closeOverlayTray() {
  if (overlayEl) {
    overlayEl.remove()
    overlayEl = null
  }
}

// 鼠标移动 - 拖动中
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return
  
  dragStarted = true
  
  const deltaX = e.screenX - dragOffsetX
  const deltaY = e.screenY - dragOffsetY
  
  // 更新偏移量，为下次移动做准备
  dragOffsetX = e.screenX
  dragOffsetY = e.screenY
  
  // 通知主进程移动窗口
  if (api && api.moveWindow) {
    api.moveWindow(deltaX, deltaY)
  }
})

// 鼠标释放 - 结束拖动
document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false
    
    // 恢复正常渲染
    updatePetDisplay()
    
    // 通知主进程恢复自动移动
    if (api && api.endDrag) {
      api.endDrag()
    }
    
    // 延迟重置，防止立即触发点击
    setTimeout(() => {
      dragStarted = false
    }, 100)
  }
})

// 监听来自主进程的事件
if (api) {
  // 宠物状态更新
  api.onPetUpdate((/** @type {any} */ data) => {
    updatePetSprites(data)
    pet = data
    updatePetDisplay()
  })
  
  // 显示对话气泡
  api.onShowBubble((/** @type {string} */ text) => {
    showBubble(text)
  })
  
  // 移动状态更新
  api.onMoving && api.onMoving((/** @type {any} */ data) => {
    isMoving = data.isMoving
    moveDirection = data.direction || 1
  })
  
  // 颜色更新
  api.onColorUpdate && api.onColorUpdate((/** @type {any} */ colors) => {
    const updateColors = /** @type {any} */ (window).updateColors
    if (updateColors) {
      updateColors(colors)
    }
    
    // 更新本地 player 状态
    if (!player) player = { settings: {} }
    if (!player.settings) player.settings = {}
    player.settings.colorTheme = 'custom'
    player.settings.customColors = colors
    
    updatePetDisplay()
    showBubble(t('messages.colors_saved'))
  })
  
  // 获取初始数据
  api.getPet().then((/** @type {any} */ data) => {
    updatePetSprites(data)
    pet = data
    updatePetDisplay()
  })
  
  api.getPlayer().then((/** @type {any} */ data) => {
    player = data
  })
  
  // 获取颜色设置
  api.getColorSettings && api.getColorSettings().then((/** @type {any} */ settings) => {
    const updateColors = /** @type {any} */ (window).updateColors
    if (settings && settings.colors && updateColors) {
      updateColors(settings.colors)
      updatePetDisplay()
    }
  })
  
  api.getSettings && api.getSettings().then((/** @type {any} */ s) => {
    const el = document.getElementById('pet-container')
    if (el) {
      el.style.background = (s && s.widgetBgColor) ? s.widgetBgColor : 'transparent'
    }
  })
  
  if (api && api.onWidgetBgUpdate) {
    api.onWidgetBgUpdate((/** @type {string} */ color) => {
      const el = document.getElementById('pet-container')
      if (el) {
        el.style.background = color || 'transparent'
      }
    })
  }
}

console.log('Pixel renderer process loaded')

// Helper for seed generation
/**
 * @param {string} str 
 */
function stringToSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

// Update sprites based on pet data
/**
 * @param {any} petData 
 */
function updatePetSprites(petData) {
  const generatePetAppearance = /** @type {any} */ (window).generatePetAppearance
  const SPRITES = /** @type {any} */ (window).SPRITES
  if (generatePetAppearance && SPRITES) {
    const seed = petData.appearanceSeed || stringToSeed(petData.id || 'default')
    const generated = generatePetAppearance(seed)
    SPRITES.adult = generated
  }
}
})();
