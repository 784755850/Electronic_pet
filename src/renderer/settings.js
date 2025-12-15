// 颜色设置页面脚本
// @ts-check

(function() {

/** @type {any} */
let i18nData = {}

// 预设颜色 - 经典像素色系
/** 
 * @typedef {Object} BodyColor
 * @property {string} name
 * @property {string} dark
 * @property {string} mid
 * @property {string} light
 */
/** @type {BodyColor[]} */
const BODY_COLORS = [
  { name: 'purple', dark: '#1a1a2e', mid: '#4a4a6a', light: '#8a8aaa' },
  { name: 'blue', dark: '#1a1a3e', mid: '#4a4a8a', light: '#8a8aca' },
  { name: 'green', dark: '#1a2e1a', mid: '#4a6a4a', light: '#8aaa8a' },
  { name: 'pink', dark: '#2e1a2a', mid: '#8a4a7a', light: '#ca8aba' },
  { name: 'orange', dark: '#2e2a1a', mid: '#8a6a4a', light: '#caaa8a' },
  { name: 'red', dark: '#2e1a1a', mid: '#8a4a4a', light: '#ca8a8a' },
  { name: 'cyan', dark: '#1a2e2e', mid: '#4a7a7a', light: '#8ababa' },
  { name: 'gold', dark: '#2e2a1a', mid: '#8a7a3a', light: '#caba6a' }
]

/**
 * @typedef {Object} OutlineColor
 * @property {string} name
 * @property {string} color
 */
/** @type {OutlineColor[]} */
const OUTLINE_COLORS = [
  { name: 'darkPurple', color: '#1a1a2e' },
  { name: 'darkBlue', color: '#1a1a3e' },
  { name: 'darkGreen', color: '#1a2e1a' },
  { name: 'darkRed', color: '#2e1a1a' },
  { name: 'darkBrown', color: '#2e2a1a' },
  { name: 'pureBlack', color: '#0a0a0a' },
  { name: 'darkGray', color: '#2a2a2a' },
  { name: 'darkGreen2', color: '#1a2a1a' }
]

// 当前选择
let selectedBodyIndex = 0
let selectedOutlineIndex = 0
/** @type {BodyColor} */
let currentColors = { ...BODY_COLORS[0] }
/** @type {number|null} */
let currentAppearanceSeed = null

// 国际化辅助函数
/**
 * @param {string} key 
 * @param {any} [params] 
 * @returns {string}
 */
function t(key, params) {
  const keys = key.split('.')
  let v = i18nData
  for (const k of keys) {
    // @ts-ignore
    if (v && v[k]) v = v[k]
    else return key
  }
  if (typeof v === 'string') {
    if (params) {
      return v.replace(/\{(\w+)\}/g, (_, k) => String(params[k] || `{${k}}`))
    }
    return v
  }
  return key
}

function updateTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (key) el.textContent = t(key)
  })
  // 更新提示文本
  document.querySelectorAll('#body-colors .color-btn').forEach((el, i) => {
    const btn = /** @type {HTMLElement} */ (el)
    // @ts-ignore
    if (BODY_COLORS[i]) btn.title = t('themes.' + BODY_COLORS[i].name)
  })
  document.querySelectorAll('#outline-colors .color-btn').forEach((el, i) => {
    const btn = /** @type {HTMLElement} */ (el)
    // @ts-ignore
    if (OUTLINE_COLORS[i]) btn.title = t('themes.' + OUTLINE_COLORS[i].name)
  })
}

const api = /** @type {any} */ (window).electronAPI

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 优先注册事件监听，确保关闭按钮可用
  setupEventListeners()

  // 优先初始化国际化
  try {
    if (api && api.getI18nData) {
      i18nData = await api.getI18nData()
      updateTexts()
    }
  } catch (e) {
    console.error('Failed to init i18n', e)
  }

  // 监听语言变更
  if (api && api.onLanguageChange) {
    api.onLanguageChange((/** @type {any} */ data) => {
      i18nData = data
      updateTexts()
    })
  }

  initColorPalette()
  renderPreview()
  loadCurrentSettings()
})

function initColorPalette() {
  const bodyContainer = document.getElementById('body-colors')
  const outlineContainer = document.getElementById('outline-colors')
  
  if (bodyContainer) {
    bodyContainer.innerHTML = ''
    // 主体色按钮
    BODY_COLORS.forEach((color, index) => {
      const btn = document.createElement('button')
      btn.className = 'color-btn'
      btn.style.background = color.mid
      btn.title = t('themes.' + color.name)
      btn.dataset.index = index.toString()
      if (index === selectedBodyIndex) btn.classList.add('selected')
      
      btn.addEventListener('click', () => {
        selectBodyColor(index)
      })
      
      bodyContainer.appendChild(btn)
    })
  }
  
  if (outlineContainer) {
    outlineContainer.innerHTML = ''
    // 轮廓色按钮
    OUTLINE_COLORS.forEach((color, index) => {
      const btn = document.createElement('button')
      btn.className = 'color-btn'
      btn.style.background = color.color
      btn.title = t('themes.' + color.name)
      btn.dataset.index = index.toString()
      if (index === selectedOutlineIndex) btn.classList.add('selected')
      
      btn.addEventListener('click', () => {
        selectOutlineColor(index)
      })
      
      outlineContainer.appendChild(btn)
    })
  }
}

/**
 * @param {number} index 
 */
function selectBodyColor(index) {
  if (index < 0 || index >= BODY_COLORS.length) return
  
  selectedBodyIndex = index
  // 更新选中状态
  document.querySelectorAll('#body-colors .color-btn').forEach((el) => {
    const btn = /** @type {HTMLElement} */ (el)
    btn.classList.toggle('selected', btn.dataset.index === index.toString())
  })
  
  // 更新当前颜色配置
  const color = BODY_COLORS[index]
  currentColors.mid = color.mid
  currentColors.light = color.light
  // 注意：dark 颜色由轮廓色决定，这里不覆盖
  
  renderPreview()
}

/**
 * @param {number} index 
 */
function selectOutlineColor(index) {
  if (index < 0 || index >= OUTLINE_COLORS.length) return
  
  selectedOutlineIndex = index
  // 更新选中状态
  document.querySelectorAll('#outline-colors .color-btn').forEach((el) => {
    const btn = /** @type {HTMLElement} */ (el)
    btn.classList.toggle('selected', btn.dataset.index === index.toString())
  })
  
  // 更新当前颜色配置中的 dark
  currentColors.dark = OUTLINE_COLORS[index].color
  
  renderPreview()
}

// 渲染预览
function renderPreview() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('preview-canvas'))
  if (!canvas) return
  
  const CuteRenderer = /** @type {any} */ (window).CuteRenderer

  if (!CuteRenderer) {
    console.warn('CuteRenderer not loaded, retrying in 100ms')
    setTimeout(renderPreview, 100)
    return
  }
  
  // 使用当前选择的颜色
  const renderer = new CuteRenderer(canvas, 1)
  const seed = currentAppearanceSeed !== null ? currentAppearanceSeed : 12345
  
  renderer.renderPet('adult', 50, false, false, 1, currentColors, seed)
}

// 设置事件监听
function setupEventListeners() {
  // Close button - Register first
  const closeBtn = document.getElementById('close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log('Close button clicked')
      closeWindow()
    })
  }

  const confirmBtn = document.getElementById('confirm-btn')
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      saveAndClose()
    })
  }
  
  const resetBtn = document.getElementById('reset-btn')
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      const generalTab = document.getElementById('tab-general')
      if (generalTab && generalTab.classList.contains('active')) {
        // General Tab - Reset Game Data
        // Use a simple confirm dialog
        // @ts-ignore
        const isZh = i18nData && i18nData.settings && i18nData.settings.general && i18nData.settings.general.reset_confirm
        const msg = isZh ? '确定要重置所有游戏数据吗？这将清除宠物状态和物品。' : 'Are you sure you want to reset all game data?'
        
        if (confirm(msg)) {
           if (api && api.resetGame) {
             api.resetGame()
           }
        }
      } else {
        // Appearance Tab - Reset Colors
        resetColors()
      }
    })
  }
  
  const randomBtn = document.getElementById('random-appearance-btn')
  if (randomBtn) {
    randomBtn.addEventListener('click', () => {
      currentAppearanceSeed = Math.floor(Math.random() * 2147483647)
      renderPreview()
    })
  }

  const applyBtn = document.getElementById('apply-appearance-btn')
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      saveColorsOnly()
      
      // Visual feedback
      const originalText = applyBtn.textContent
      applyBtn.textContent = 'OK!'
      setTimeout(() => {
        applyBtn.textContent = originalText
      }, 1000)
    })
  }

  const applyGeneralBtn = document.getElementById('apply-general-btn')
  if (applyGeneralBtn) {
    applyGeneralBtn.addEventListener('click', () => {
      saveAllSettings()
      
      // Visual feedback
      const originalText = applyGeneralBtn.textContent
      applyGeneralBtn.textContent = 'OK!'
      setTimeout(() => {
        applyGeneralBtn.textContent = originalText
      }, 1000)
    })
  }
  
  const dndStart = /** @type {HTMLInputElement} */ (document.getElementById('dnd-start'))
  const dndEnd = /** @type {HTMLInputElement} */ (document.getElementById('dnd-end'))
  if (dndStart) {
    dndStart.addEventListener('change', () => {
      dndStart.value = clampHour(dndStart.value)
    })
  }
  if (dndEnd) {
    dndEnd.addEventListener('change', () => {
      dndEnd.value = clampHour(dndEnd.value)
    })
  }

  // 语言选择
  const langSelect = /** @type {HTMLSelectElement} */ (document.getElementById('language-select'))
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      const target = /** @type {HTMLSelectElement} */ (e.target)
      const lang = target.value
      if (api && api.setLanguage) {
        api.setLanguage(lang)
      }
    })
  }
}

function resetColors() {
    selectBodyColor(0)
    selectOutlineColor(0)
    currentAppearanceSeed = null
    renderPreview()
}

function saveColorsOnly() {
  if (api && api.saveColors) {
    api.saveColors(currentColors)
  }
  if (currentAppearanceSeed !== null && api && api.updatePetAppearance) {
    api.updatePetAppearance(currentAppearanceSeed)
  }
}

function saveAllSettings() {
  saveColorsOnly()
  
  const dndEnabledInput = /** @type {HTMLInputElement} */ (document.getElementById('dnd-enabled'))
  const dndStartInput = /** @type {HTMLInputElement} */ (document.getElementById('dnd-start'))
  const dndEndInput = /** @type {HTMLInputElement} */ (document.getElementById('dnd-end'))

  const enabled = dndEnabledInput ? dndEnabledInput.checked : false
  const start = dndStartInput ? parseInt(dndStartInput.value, 10) : 22
  const end = dndEndInput ? parseInt(dndEndInput.value, 10) : 7

  if (api && api.saveQuietHours) {
    api.saveQuietHours({
      enabled,
      start: isNaN(start) ? 22 : Math.max(0, Math.min(23, start)),
      end: isNaN(end) ? 7 : Math.max(0, Math.min(23, end))
    })
  }
  
  const notifyEnabledInput = /** @type {HTMLInputElement} */ (document.getElementById('notify-enabled'))
  const toastEnabledInput = /** @type {HTMLInputElement} */ (document.getElementById('toast-enabled'))
  const autoSaveInput = /** @type {HTMLInputElement} */ (document.getElementById('autosave-enabled'))
  const showTrayInput = /** @type {HTMLInputElement} */ (document.getElementById('show-tray'))
  
  const bubbleEnabled = notifyEnabledInput ? notifyEnabledInput.checked : true
  const toastEnabled = toastEnabledInput ? toastEnabledInput.checked : true
  const autoSave = autoSaveInput ? autoSaveInput.checked : true
  const showTrayIcon = showTrayInput ? showTrayInput.checked : true
  
  const defaultModeInput = /** @type {HTMLInputElement} */ (document.querySelector('input[name="default-mode"]:checked'))
  const defaultMode = defaultModeInput ? defaultModeInput.value : 'roam'
  
  const langSelect = /** @type {HTMLSelectElement} */ (document.getElementById('language-select'))
  const language = langSelect ? langSelect.value : 'zh-CN'

  const alwaysOnTopInput = /** @type {HTMLInputElement} */ (document.getElementById('always-on-top'))
  const alwaysOnTop = alwaysOnTopInput ? alwaysOnTopInput.checked : true

  if (api && api.saveSettings) {
    api.saveSettings({
      bubbleEnabled,
      toastEnabled,
      autoSave,
      defaultMode,
      language,
      showTrayIcon,
      alwaysOnTop
    })
  }
  
  const nameInput = /** @type {HTMLInputElement} */ (document.getElementById('pet-name-input'))
  if (nameInput && api && api.renamePet) {
    api.renamePet(nameInput.value)
  }
}

// 保存并关闭
function saveAndClose() {
  saveAllSettings()
  closeWindow()
}

// 加载当前设置
function loadCurrentSettings() {
  if (api && api.getColorSettings) {
    api.getColorSettings().then((/** @type {any} */ settings) => {
      if (settings && settings.colors) {
        currentColors = settings.colors
        const matchIndex = BODY_COLORS.findIndex(c => c.mid === settings.colors.mid)
        if (matchIndex >= 0) {
          selectBodyColor(matchIndex)
        }
        
        const outlineMatchIndex = OUTLINE_COLORS.findIndex(c => c.color === settings.colors.dark)
        if (outlineMatchIndex >= 0) {
          selectOutlineColor(outlineMatchIndex)
        }
        
        renderPreview()
      }
      if (settings && settings.quietHours) {
        const dnd = settings.quietHours
        const dndEnabled = /** @type {HTMLInputElement} */ (document.getElementById('dnd-enabled'))
        const dndStart = /** @type {HTMLInputElement} */ (document.getElementById('dnd-start'))
        const dndEnd = /** @type {HTMLInputElement} */ (document.getElementById('dnd-end'))
        
        if (dndEnabled) dndEnabled.checked = !!dnd.enabled
        if (dndStart) dndStart.value = (dnd.start ?? 22).toString()
        if (dndEnd) dndEnd.value = (dnd.end ?? 7).toString()
      }
    })
  }
  
  if (api && api.getSettings) {
    api.getSettings().then((/** @type {any} */ s) => {
      if (!s) return
      const notifyEnabled = /** @type {HTMLInputElement} */ (document.getElementById('notify-enabled'))
      if (notifyEnabled) notifyEnabled.checked = !!s.bubbleEnabled
      
      const toastEl = /** @type {HTMLInputElement} */ (document.getElementById('toast-enabled'))
      if (toastEl) toastEl.checked = !!s.toastEnabled
      
      const autoSave = /** @type {HTMLInputElement} */ (document.getElementById('autosave-enabled'))
      if (autoSave) autoSave.checked = !!s.autoSave

      const showTray = /** @type {HTMLInputElement} */ (document.getElementById('show-tray'))
      if (showTray) showTray.checked = s.showTrayIcon !== false
      
      const modeEl = /** @type {HTMLInputElement} */ (document.querySelector(`input[name="default-mode"][value="${s.defaultMode || 'roam'}"]`))
      if (modeEl) modeEl.checked = true
      
      // 设置语言选择框
      if (s.language) {
        const langEl = /** @type {HTMLSelectElement} */ (document.getElementById('language-select'))
        if (langEl) langEl.value = s.language
      }
    })
  }

  if (api && api.getAlwaysOnTop) {
    api.getAlwaysOnTop().then((/** @type {boolean} */ flag) => {
      const el = /** @type {HTMLInputElement} */ (document.getElementById('always-on-top'))
      if (el) el.checked = flag
    })
  }
  
  if (api && api.getPet) {
    api.getPet().then((/** @type {any} */ pet) => {
      const nameInput = /** @type {HTMLInputElement} */ (document.getElementById('pet-name-input'))
      if (pet) {
        if (nameInput) nameInput.value = pet.name
        if (pet.appearanceSeed) {
           currentAppearanceSeed = pet.appearanceSeed
           renderPreview()
        }
      }
    })
  }
}

console.log('Settings page loaded')

function closeWindow() {
  if (api && api.closeSettings) {
    api.closeSettings()
  } else {
    window.close()
  }
}

/**
 * @param {string} v 
 */
function clampHour(v) {
  const n = parseInt(v, 10)
  if (isNaN(n)) return '0'
  return Math.max(0, Math.min(23, n)).toString()
}

})();
