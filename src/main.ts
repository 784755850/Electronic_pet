import {app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, globalShortcut, Notification, screen} from 'electron'
import path from 'path'
import { loadGame, saveGame, startAutoSave, stopAutoSave, setTestMode, clearTestSave, createDefaultPlayer } from './storage'
import { tick, checkEvolution, feed as feedPet, clean as cleanPet, play as playPet, applyPendingEffects, pet_pet, createPet } from './core/pet'
import { getDialog } from './core/events'
import { completeWork, completeStudy, startWork, startStudy, getAvailableJobs, getStudies, getItems, buyItem, useItem } from './core/economy'
import { startAdventure, getAdventureLocations } from './core/adventure'
import { AchievementSystem } from './core/achievement'
import { addExp } from './core/growth'
import { i18n } from './core/i18n'
import { dataLoader } from './core/data-loader'
import * as movement from './app/movement'
import * as modeDetection from './app/modeDetection'
import type { Pet, Player, ColorTheme, PetColors } from './types/index'

let win: BrowserWindow | null = null
let settingsWin: BrowserWindow | null = null
let statusWin: BrowserWindow | null = null
let trayOverlayWin: BrowserWindow | null = null
let debugWin: BrowserWindow | null = null
let tray: Tray | null = null

// 游戏状态
let pet: Pet
let player: Player

// Test Mode State
let isTestMode = false
let backupState: { pet: Pet, player: Player } | null = null

// 注入数据到多语言系统
dataLoader.injectToI18n(i18n)

// 预设颜色方案
const COLOR_THEMES: Record<ColorTheme, PetColors> = {
  purple: { dark: '#1a1a2e', mid: '#4a4a6a', light: '#8a8aaa' },
  green:  { dark: '#1a2e1a', mid: '#4a6a4a', light: '#8aaa8a' },
  blue:   { dark: '#1a1a3e', mid: '#4a4a8a', light: '#8a8aca' },
  pink:   { dark: '#2e1a2a', mid: '#8a4a7a', light: '#ca8aba' },
  orange: { dark: '#2e2a1a', mid: '#8a6a4a', light: '#caaa8a' },
  custom: { dark: '#1a1a2e', mid: '#4a4a6a', light: '#8a8aaa' }
}

// 获取当前颜色配置
function getCurrentColors(): PetColors {
  const theme = player.settings.colorTheme
  if (theme === 'custom' && player.settings.customColors) {
    return player.settings.customColors
  }
  return COLOR_THEMES[theme] || COLOR_THEMES.purple
}

// 定时器
let tickTimer: NodeJS.Timeout | null = null
let dialogTimer: NodeJS.Timeout | null = null
let tickIntervalMs = 1000
let dialogIntervalMs = 30000
let dialogEnabled = true
let currentUserMode: 'quiet'|'roam'|'mischief' = 'roam'
let currentEffectiveMode: 'quiet'|'roam'|'mischief' = 'roam'
let isDndQuiet = false
let isDraggingActive = false

function sendBubble(text: string, duration = 3000) {
  if (isDndQuiet) return
  if (!win || win.isDestroyed()) return
  win.webContents.send('show-bubble', text, duration)
}

function restartTickTimer() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  tickTimer = setInterval(gameTick, tickIntervalMs)
}

function restartDialogTimer() {
  if (dialogTimer) {
    clearInterval(dialogTimer)
    dialogTimer = null
  }
  if (dialogEnabled) {
    dialogTimer = setInterval(gameDialogTick, dialogIntervalMs)
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 120,
    height: 200,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: player.settings.alwaysOnTop !== false,
    skipTaskbar: player.settings.showTrayIcon !== false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  const htmlPath = path.join(__dirname, '..', 'src', 'renderer', 'index.html')
  win.loadFile(htmlPath)
  
  // 开发模式下打开控制台
  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: 'detach' })
  }
  
  // 设置初始位置
  win.setPosition(pet.x, pet.y)
  
  // 监听窗口移动
  win.on('moved', () => {
    if (win) {
      const [x, y] = win.getPosition()
      pet.x = x
      pet.y = y
      
      // Edge detection for auto-hide/peek
      if (isDraggingActive) {
         // Logic handled in mouseup/move loop in renderer mostly, but we can do safety checks here
         // Actually, let's leave the 'moved' event for saving position
         // The edge hiding is better handled when drag ENDS.
      }
    }
  })
  
  win.on('move', () => {
     // Optional: Check edges during move
  })

  // 启动自动移动
  movement.setPetStage(pet.stage)
  movement.start(win)
  
  win.on('focus', () => {
    modeDetection.setUserMode(currentUserMode)
  })
  win.on('blur', () => {
    applyEffectiveMode('quiet')
  })
}

function createTray() {
  if (player.settings.showTrayIcon === false) return
  if (tray) return

  // 创建一个空图标（后续添加实际图标）
  tray = new Tray(nativeImage.createEmpty())
  tray.setToolTip(i18n.t('tray.tooltip', { name: pet.name }))
  tray.on('click', () => {
    openTrayOverlay()
  })
  tray.on('right-click', () => {
    openTrayOverlay()
  })
}

// 更新托盘菜单
function updateTray() {
  if (!tray) return
  const now = Date.now()
  const leftLabel = (() => {
    if (pet.workingUntil && pet.workingUntil > now) {
      const ms = pet.workingUntil - now
      return i18n.t('tray.work_remaining', { time: formatLeft(ms) })
    }
    if (pet.studyingUntil && pet.studyingUntil > now) {
      const ms = pet.studyingUntil - now
      return i18n.t('tray.study_remaining', { time: formatLeft(ms) })
    }
    return ''
  })()
  const modeText = i18n.t('tray.mode', { mode: i18n.t(`modes.${currentEffectiveMode}`) })
  const coinsText = i18n.t('tray.coins', { coins: player.coins })
  const tip = [ `${pet.name} Lv.${pet.level}`, coinsText, modeText, leftLabel ].filter(Boolean).join(' | ')
  tray.setToolTip(tip)
}

function checkAutomation() {
  if (pet.currentAction !== 'idle') return
  
  // 自动化触发阈值：15分钟无操作
  const now = Date.now()
  const lastInteraction = pet.lastInteractionTime || pet.bornAt
  if (now - lastInteraction < 15 * 60 * 1000) return 
  
  const items = getItems()
  
  // 自动进食
  if (pet.hunger >= 80) {
      const foods = items.filter(i => i.type === 'food').sort((a,b) => a.price - b.price)
      
      // 1. 检查背包
      let foodToUse = foods.find(f => player.inventory[f.id] > 0)
      
      if (foodToUse) {
          useItem(pet, player, foodToUse.id, true)
          sendBubble(i18n.t('messages.auto_feed', { item: foodToUse.name }))
          return
      }
      
      // 2. 购买最便宜的
      const cheapest = foods[0]
      if (cheapest) {
          if (player.coins >= cheapest.price) {
              if (buyItem(player, cheapest.id, 1)) {
                  useItem(pet, player, cheapest.id, true)
                  sendBubble(i18n.t('messages.auto_buy_feed', { item: cheapest.name }))
                  return
              }
          }
      }
  }
  
  // 自动清洁
  if (pet.clean <= 20) {
      const cleans = items.filter(i => i.type === 'clean' || (i.effects && (i.effects.clean || 0) > 0)).sort((a,b) => a.price - b.price)
      
      let cleanToUse = cleans.find(i => player.inventory[i.id] > 0)
      
      if (cleanToUse) {
          useItem(pet, player, cleanToUse.id, true)
          sendBubble(i18n.t('messages.auto_clean', { item: cleanToUse.name }))
          return
      }
      
      const cheapest = cleans[0]
      if (cheapest) {
          if (player.coins >= cheapest.price) {
              if (buyItem(player, cheapest.id, 1)) {
                  useItem(pet, player, cheapest.id, true)
                  sendBubble(i18n.t('messages.auto_buy_clean', { item: cheapest.name }))
                  return
              }
          }
      }
  }
  
  // 自动打工 (如果有需求未满足)
  if (pet.hunger >= 80 || pet.clean <= 20) {
      const jobs = getAvailableJobs(pet).sort((a,b) => b.income - a.income)
      if (jobs.length > 0) {
          const job = jobs[0]
          if (startWork(pet, job.id, true)) {
             sendBubble(i18n.t('messages.auto_work', { job: job.name }))
             return
          }
      }
  }
}

function broadcastUpdate(pet: Pet, player: Player) {
  win?.webContents.send('pet-update', pet)
  // Send full data to status window as it expects {pet, player}
  statusWin?.webContents.send('status-update', { pet, player })
  // Also send legacy pet-update just in case
  statusWin?.webContents.send('pet-update', pet)
  // Ensure player data is reachable if needed, though status window fetches it on pet-update
}

function gameTick() {
  tick(pet)
  checkAutomation()
  
  if (pet.workingUntil && Date.now() >= pet.workingUntil) {
    const result = completeWork(pet, player)
    if (result) {
      const income = typeof result === 'number' ? result : result.income
      sendBubble(i18n.t('tray.earned_money', { amount: income }))
      
      if (typeof result !== 'number' && result.unlocks && result.unlocks.length > 0) {
         result.unlocks.forEach(ach => {
             setTimeout(() => {
                 sendBubble(i18n.t('tray.unlock_achievement', { name: ach.name }))
             }, 1000)
         })
      }

      addExp(pet, 20)
      updateTray()
    }
  }
  
  if (pet.studyingUntil && Date.now() >= pet.studyingUntil) {
    if (completeStudy(pet, player)) {
      sendBubble(i18n.t('tray.study_complete'))
      updateTray()
    }
  }
  
  // 检查短期动作 (eating, cleaning, playing)
  if (pet.actionEndsAt && Date.now() >= pet.actionEndsAt) {
    applyPendingEffects(pet)
    const action = pet.currentAction
    pet.currentAction = 'idle'
    pet.actionEndsAt = undefined
    pet.actionTotalDuration = undefined
    
    let msgKey = 'messages.action_done'
    if (action === 'eating') msgKey = 'messages.eating_done'
    else if (action === 'cleaning') msgKey = 'messages.cleaning_done'
    else if (action === 'playing') msgKey = 'messages.playing_done'
    
    sendBubble(i18n.t(msgKey))
    saveGame(pet, player)
    updateTray()
  }

  const evolved = checkEvolution(pet)
  if (evolved) {
    const stageName = i18n.t(`stages.${evolved === 'baby' ? 'baby' : 'adult'}`)
    sendBubble(i18n.t('messages.evolution', { stage: stageName }))
    movement.setPetStage(pet.stage)
  }
  
  broadcastUpdate(pet, player)
  updateTray()
}

function gameDialogTick() {
  if (!player.settings.bubbleEnabled) return
  const dialog = getDialog(pet, Date.now())
  
  // 检查是否为紧急状态
  const isCritical = pet.sick || pet.hunger >= 80 || pet.clean <= 20 || pet.mood < 40
  
  // 紧急状态下必然显示，否则按概率
  let chance = dialogIntervalMs <= 20000 ? 0.4 : dialogIntervalMs >= 60000 ? 0.15 : 0.3
  if (isCritical) chance = 1.0
  
  if (dialog && Math.random() <= chance) {
    sendBubble(dialog)
  }
}

function startGameLoop() {
  restartTickTimer()
  restartDialogTimer()
}

function stopGameLoop() {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  if (dialogTimer) {
    clearInterval(dialogTimer)
    dialogTimer = null
  }
}

// IPC 处理器
function setupIPC() {
  // 获取初始数据
  ipcMain.handle('get-pet', () => pet)
  ipcMain.handle('get-player', () => player)
  
  // 移动窗口
  ipcMain.on('move-window', (_event, { deltaX, deltaY }) => {
    if (!win) return
    const [x, y] = win.getPosition()
    win.setPosition(x + Math.round(deltaX), y + Math.round(deltaY))
  })
  
  // 拖动开始 - 暂停自动移动
  ipcMain.on('start-drag', () => {
    movement.pause()
    isDraggingActive = true
  })
  
  // 拖动结束 - 恢复自动移动
  ipcMain.on('end-drag', () => {
    isDraggingActive = false
    
    // Check for edge docking (Slant Hide / Peek)
    let isDocked = false
    if (win) {
       const bounds = win.getBounds()
       const display = screen.getDisplayMatching(bounds)
       const db = display.bounds
       const threshold = 50
       const visiblePart = 80 // px visible when hidden
       
       let newX = bounds.x
       
       // Left edge
       if (bounds.x - db.x < threshold) {
         newX = db.x - bounds.width + visiblePart
         isDocked = true
       } 
       // Right edge
       else if ((db.x + db.width) - (bounds.x + bounds.width) < threshold) {
         newX = (db.x + db.width) - visiblePart
         isDocked = true
       }
       
       if (isDocked) {
         win.setPosition(newX, bounds.y, true)
         // Stop movement if docked
         movement.stop()
         return
       }
    }
    
    if (win) {
      movement.setPetStage(pet.stage)
      movement.start(win)
    }
  })
  
  ipcMain.on('minimize-to-tray', () => {
    if (player.settings.showTrayIcon === false) {
      win?.minimize()
    } else {
      win?.hide()
    }
  })
  
  ipcMain.on('toggle-always-on-top', (_event, flag: boolean) => {
    player.settings.alwaysOnTop = flag
    win?.setAlwaysOnTop(flag)
    saveGame(pet, player)
  })
  
  ipcMain.handle('get-always-on-top', () => {
    return win?.isAlwaysOnTop() ?? (player.settings.alwaysOnTop !== false)
  })
  
  // 基础互动
  ipcMain.on('pet-action', (_event, action: string) => {
    console.log('宠物动作:', action)
    if (action === 'touch') {
      pet_pet(pet)
      saveGame(pet, player)
      win?.webContents.send('pet-update', pet)
    }
    // 这里后续添加具体动作处理
  })
  
  // 获取颜色设置
  ipcMain.handle('get-color-settings', () => {
    return {
      theme: player.settings.colorTheme,
      colors: getCurrentColors(),
      themes: Object.keys(COLOR_THEMES),
      quietHours: player.settings.quietHours || { enabled: false, start: 22, end: 7 }
    }
  })
  
  // 设置颜色主题
  ipcMain.on('set-color-theme', (_event, theme: ColorTheme) => {
    if (COLOR_THEMES[theme]) {
      player.settings.colorTheme = theme
      const colors = getCurrentColors()
      win?.webContents.send('color-update', colors)
      saveGame(pet, player)
      console.log('颜色主题已更新:', theme)
    }
  })

  // 设置语言
  ipcMain.on('set-language', (_event, lang: 'zh-CN' | 'en-US') => {
    player.settings.language = lang
    i18n.setLocale(lang)
    saveGame(pet, player)
    updateTray()
    
    // 通知所有窗口
    const windows = [win, settingsWin, statusWin, adventureWin, trayOverlayWin, ...interactionWindows.values()]
    windows.forEach(w => w?.webContents.send('language-changed', { lang, t: i18n.getData() }))
  })

  // 获取当前语言包
  ipcMain.handle('get-i18n', () => {
    return {
      lang: i18n.getLocale(),
      t: i18n.getData()
    }
  })

  // 打开设置窗口
  ipcMain.on('open-settings', () => {
    createSettingsWindow()
  })
  
  // 打开宠物状况面板
  ipcMain.on('open-status', () => {
    createStatusWindow()
  })
  ipcMain.on('close-status', () => {
    if (statusWin) {
      statusWin.close()
      statusWin = null
    }
  })

  ipcMain.on('refresh-status', (_event) => {
    const senderWin = BrowserWindow.fromWebContents(_event.sender)
    if (senderWin && !senderWin.isDestroyed()) {
      senderWin.webContents.send('status-update', { pet, player })
    }
  })

  // Debug
  ipcMain.on('open-debug', () => {
    createDebugWindow()
  })

  ipcMain.on('debug-action', (_event, { action, param }) => {
    console.log('Debug Action:', action, param)
    switch(action) {
      case 'fill-stats':
        pet.hunger = 0
        pet.clean = 100
        pet.mood = 100
        pet.health = 100
        break;
      case 'low-stats':
        pet.hunger = 100
        pet.clean = 10
        pet.mood = 10
        pet.health = 60
        break;
      case 'add-money':
        player.coins += 1000
        break;
      case 'reset-money':
        player.coins = 0
        break;
      case 'set-stage':
        if (['egg', 'baby', 'adult', 'rare'].includes(param)) {
           pet.stage = param
           // Reset growth for new stage
           pet.exp = 0
           movement.setPetStage(pet.stage)
        }
        break;
      case 'unlock-all':
         player.coins += 99999
         pet.level = 99
         pet.exp = 0
         if (!player.stats) player.stats = { workCount: 0, studyCount: 0, adventureCount: 0, totalCoinsEarned: 0, itemsUsed: 0 }
         player.stats.workCount += 100
         player.stats.studyCount += 100
         player.stats.adventureCount += 100
         break;
    }
    saveGame(pet, player)
    broadcastUpdate(pet, player)
    updateTray()
  })
  
  // 右键弹出托盘菜单
  ipcMain.on('pop-tray', () => {
    openTrayOverlay()
  })
  
  // 关闭设置窗口
  ipcMain.on('close-settings', () => {
    if (settingsWin) {
      settingsWin.close()
      settingsWin = null
    }
  })
  
  // 保存颜色设置
  ipcMain.on('save-colors', (_event, colors: PetColors) => {
    player.settings.colorTheme = 'custom'
    player.settings.customColors = colors
    win?.webContents.send('color-update', colors)
    saveGame(pet, player)
    sendBubble(i18n.t('messages.colors_saved'))
    console.log('自定义颜色已保存:', colors)
  })
  
  ipcMain.on('save-quiet-hours', (_event, cfg: {enabled: boolean, start: number, end: number}) => {
    player.settings.quietHours = {
      enabled: !!cfg.enabled,
      start: Math.max(0, Math.min(23, Math.floor(cfg.start))),
      end: Math.max(0, Math.min(23, Math.floor(cfg.end)))
    }
    saveGame(pet, player)
    // 应用可能的即时模式变化
    applyEffectiveMode(currentUserMode)
    sendBubble(i18n.t('messages.quiet_saved'))
    console.log('免打扰时段已保存:', player.settings.quietHours)
  })
  
  ipcMain.handle('get-settings', () => {
    return {
      bubbleEnabled: player.settings.bubbleEnabled,
      toastEnabled: player.settings.toastEnabled,
      autoSave: player.settings.autoSave,
      defaultMode: player.settings.defaultMode || 'roam',
      colorTheme: player.settings.colorTheme,
      showTrayIcon: player.settings.showTrayIcon ?? true,
      alwaysOnTop: player.settings.alwaysOnTop !== false,
      quietHours: player.settings.quietHours || { enabled: false, start: 22, end: 7 },
      widgetBgColor: player.settings.widgetBgColor || ''
    }
  })

  ipcMain.handle('get-app-info', () => {
    return {
      isPackaged: app.isPackaged,
      version: app.getVersion()
    }
  })
  
  ipcMain.on('save-settings', (_event, s: {
    bubbleEnabled?: boolean, 
    toastEnabled?: boolean, 
    autoSave?: boolean, 
    defaultMode?: 'quiet'|'roam'|'mischief', 
    showTrayIcon?: boolean,
    alwaysOnTop?: boolean
  }) => {
    if (typeof s.bubbleEnabled === 'boolean') player.settings.bubbleEnabled = s.bubbleEnabled
    if (typeof s.toastEnabled === 'boolean') player.settings.toastEnabled = s.toastEnabled
    if (typeof s.autoSave === 'boolean') player.settings.autoSave = s.autoSave
    
    if (typeof s.alwaysOnTop === 'boolean') {
      player.settings.alwaysOnTop = s.alwaysOnTop
      win?.setAlwaysOnTop(s.alwaysOnTop)
    }

    if (typeof s.showTrayIcon === 'boolean') {
      player.settings.showTrayIcon = s.showTrayIcon
      if (s.showTrayIcon) {
        createTray()
        updateTray()
        win?.setSkipTaskbar(true)
      } else {
        if (tray) {
          tray.destroy()
          tray = null
        }
        if (win) {
          win.setSkipTaskbar(false)
          // 确保窗口可见，强制显示以刷新任务栏状态
          win.show()
        }
      }
    }

    if (s.defaultMode) {
      player.settings.defaultMode = s.defaultMode
      currentUserMode = s.defaultMode
      modeDetection.setUserMode(currentUserMode)
      applyEffectiveMode(currentUserMode)
    }
    saveGame(pet, player)
    updateTray()
    sendBubble(i18n.t('messages.settings_saved'))
  })
  
  ipcMain.on('rename-pet', (_event, name: string) => {
    const n = String(name || '').trim()
    if (n) {
      pet.name = n
      updateTray()
      saveGame(pet, player)
      broadcastUpdate(pet, player)
      sendBubble(i18n.t('messages.greeting', { name: pet.name }))
    }
  })

  ipcMain.on('reset-game', () => {
    // Keep settings
    const oldSettings = player.settings
    const oldName = pet.name
    
    // Reset data
    pet = createPet(oldName) // Keep name? User said "initialize pet to lowest form", didn't say reset name.
    // If user wants full reset including name, they can rename.
    // But "Reset Data" usually implies back to square one.
    // However, keeping name is friendlier if they just want to restart the growth cycle.
    // But the user said "initialize pet to lowest form".
    // I will keep the name for now, but reset stats and stage.
    
    player = createDefaultPlayer()
    player.settings = oldSettings
    
    // Reset window state if needed (e.g. not working)
    
    saveGame(pet, player)
    broadcastUpdate(pet, player)
    updateTray()
    
    // Notify
    sendBubble(i18n.t('messages.reset_success') || 'Game Data Reset!')
    console.log('Game Data Reset')
  })
  
  ipcMain.on('update-pet-appearance', (_event, seed: number) => {
    pet.appearanceSeed = seed
    saveGame(pet, player)
    broadcastUpdate(pet, player)
  })
  
  ipcMain.on('set-widget-bg', (_event, color: string) => {
    player.settings.widgetBgColor = color || ''
    saveGame(pet, player)
    win?.webContents.send('widget-bg', player.settings.widgetBgColor)
  })
  
  // Helper to map action to key
  const getActionKey = (action: string): string => {
    switch(action) {
      case 'eating': return 'feed';
      case 'cleaning': return 'clean';
      case 'playing': return 'play';
      case 'work': return 'work';
      case 'study': return 'study';
      case 'sleep': return 'sleep';
      default: return action;
    }
  }

  // Helper to check blocking status
  const checkBlockingStatus = (incomingIntent?: string) => {
    // Check if pet is in a busy state
    // idle, walk, sit are considered available states
    if (pet.currentAction !== 'idle' && pet.currentAction !== 'walk' && pet.currentAction !== 'sit') {
      const currentKey = getActionKey(pet.currentAction)
      // Use actions keys as they are reliable
      const currentActionName = i18n.t(`actions.${currentKey}`)
      
      if (incomingIntent) {
         if (incomingIntent === currentKey) {
            sendBubble(i18n.t('messages.busy_same_action', { action: currentActionName }))
         } else {
            const incomingName = i18n.t(`actions.${incomingIntent}`)
            sendBubble(i18n.t('messages.busy_other_action', { action: currentActionName, incoming: incomingName }))
         }
      } else {
         const msg = i18n.t('messages.pet_is_busy', { action: currentActionName })
         sendBubble(typeof msg === 'string' ? msg : `Pet is busy (${currentActionName})`)
      }
      return true
    }
    return false
  }

  ipcMain.on('feed', () => {
    if (checkBlockingStatus('feed')) return
    createInteractionWindow(getInteractionData('feed'))
  })
  ipcMain.on('clean', () => {
    if (checkBlockingStatus('clean')) return
    createInteractionWindow(getInteractionData('clean'))
  })
  ipcMain.on('play', () => {
    if (checkBlockingStatus('play')) return
    createInteractionWindow(getInteractionData('play'))
  })
  
  ipcMain.on('open-work-menu', () => {
    if (checkBlockingStatus('work')) return
    createInteractionWindow(getInteractionData('work'))
  })
  ipcMain.on('open-study-menu', () => {
    if (checkBlockingStatus('study')) return
    createInteractionWindow(getInteractionData('study'))
  })
  ipcMain.on('open-shop-menu', () => {
    if (checkBlockingStatus('shop')) return
    createInteractionWindow(getInteractionData('shop'))
  })
  ipcMain.on('open-inventory-menu', () => {
    if (checkBlockingStatus('inventory')) return
    createInteractionWindow(getInteractionData('inventory'))
  })

  ipcMain.on('interact', (_event, { type, id, mode }) => {
    // Double check blocking for safety
    // Determine intent for blocking check if applicable
    let intent = ''
    if (mode === 'work') intent = 'work'
    else if (mode === 'study') intent = 'study'
    
    if (mode !== 'shop' && mode !== 'inventory' && checkBlockingStatus(intent)) {
       // Shop/Inventory logic inside window might be tricky if we block opening.
       // But if window is already open, we might want to allow it?
       // Actually if we block opening, this shouldn't be reached easily except for race conditions.
       // However, if the window was OPEN and then the pet started working (e.g. via timer?), 
       // but here we are starting work/study, so we are transitioning FROM idle TO busy.
       // If we are already busy, we shouldn't start another busy task.
       
       const win = BrowserWindow.fromWebContents(_event.sender)
       if (win && !win.isDestroyed()) {
          win.webContents.send('interaction-result', { 
            success: false, 
            message: 'messages.pet_busy_now' 
          })
       }
       return
    }
    
    let success = false
    let message = 'failed'
    let rewards: any = {}
    
    if (mode === 'shop') {
      if (buyItem(player, id, 1)) {
        success = true
        message = 'messages.shop_buy_success'
        rewards = { money: player.coins }
        saveGame(pet, player)
        updateTray()
      } else {
        message = 'messages.shop_buy_failed'
      }
    } else if (mode === 'inventory') {
      const result = useItem(pet, player, id)
      if (result.success) {
        success = true
        message = 'messages.item_use_success'
        saveGame(pet, player)
        win?.webContents.send('pet-update', pet)
        updateTray()
      } else {
        message = result.reason || 'messages.item_use_failed'
      }
    } else if (mode === 'work') {
      const result = startWork(pet, id)
      if (result.success) {
        success = true
        message = 'messages.work_started'
        saveGame(pet, player)
        win?.webContents.send('pet-update', pet)
        updateTray()
      } else {
        success = false
        message = result.reason || 'messages.work_failed'
      }
    } else if (mode === 'study') {
      const result = startStudy(pet, player, id)
      if (result.success) {
        success = true
        message = 'messages.study_started'
        saveGame(pet, player)
        win?.webContents.send('pet-update', pet)
        updateTray()
      } else {
        success = false
        message = result.reason || 'messages.study_failed'
      }
    }
 
    const senderWin = BrowserWindow.fromWebContents(_event.sender)
    if (senderWin && !senderWin.isDestroyed()) {
       if (mode === 'shop' || mode === 'inventory') {
          // Use bubble for both success and failure
          const msgText = i18n.t(message)
          sendBubble(msgText)
          // Refresh list to show updated money/inventory
          senderWin.webContents.send('show-interaction', getInteractionData(type))
          // Also show toast in window
          senderWin.webContents.send('interaction-result', { success, message, rewards })
       } else {
          if (success && (mode === 'work' || mode === 'study')) {
             senderWin.close()
          } else {
             senderWin.webContents.send('interaction-result', { success, message, rewards })
          }
       }
    }
  })

  // Refresh interaction data (e.g. after buy)
  ipcMain.on('refresh-interaction', (_event, type) => {
    const senderWin = BrowserWindow.fromWebContents(_event.sender)
    if (senderWin && !senderWin.isDestroyed()) {
      senderWin.webContents.send('show-interaction', getInteractionData(type))
    }
  })

  ipcMain.on('resize-interaction', (_event, { width, height }) => {
    const senderWin = BrowserWindow.fromWebContents(_event.sender)
    if (senderWin && !senderWin.isDestroyed()) {
      senderWin.setSize(Math.round(width), Math.round(height))
    }
  })
  
  // 获取可用工作
  ipcMain.handle('get-jobs', () => {
    return getAvailableJobs(pet)
  })
  
  // 开始打工
  ipcMain.on('start-work', (_event, payload: { jobId: string }) => {
    const jobId = payload?.jobId
    const result = jobId ? startWork(pet, jobId) : { success: false, reason: 'messages.work_failed' }
    if (result.success) {
      saveGame(pet, player)
      win?.webContents.send('pet-update', pet)
      // Retrieve job duration for display
      const job = getAvailableJobs(pet).find(j => j.id === jobId)
      const duration = job ? job.duration : '?'
      const jobName = job ? (i18n.t(`jobs.${job.id}`) !== `jobs.${job.id}` ? i18n.t(`jobs.${job.id}`) : job.name) : jobId
      sendBubble(i18n.t('messages.work_started', { job: jobName, duration }))
      updateTray()
    } else {
      const msg = result.reason ? i18n.t(result.reason) : i18n.t('messages.work_failed')
      sendBubble(msg)
    }
  })
  
  // 结束打工并结算
  ipcMain.on('end-work', () => {
    const result = completeWork(pet, player, true)
    if (result) {
      saveGame(pet, player)
      win?.webContents.send('pet-update', pet)
      updateTray()

      const earnings = typeof result === 'number' ? result : result.income
      let msg = i18n.t('messages.work_income', { amount: earnings })

      if (typeof result !== 'number' && result.unlocks && result.unlocks.length > 0) {
        const names = result.unlocks.map((a: any) => a.name).join(', ')
        msg += i18n.t('messages.work_unlock_achievement', { names })
        
        result.unlocks.forEach((ach: any) => {
          setTimeout(() => {
            sendBubble(i18n.t('messages.achievement_unlocked', { name: ach.name }))
          }, 1000)
        })
      }
      sendBubble(msg)
    } else {
      sendBubble(i18n.t('messages.work_not_working'))
    }
  })
  
  // 获取学习列表
  ipcMain.handle('get-studies', () => {
    return getStudies(pet)
  })
  
  // 开始学习
  ipcMain.on('start-study', (_event, studyId: string) => {
    const result = startStudy(pet, player, studyId)
    if (result.success) {
      saveGame(pet, player)
      win?.webContents.send('pet-update', pet)
      sendBubble(i18n.t('messages.study_started'))
      updateTray()
    } else {
      const msg = result.reason ? i18n.t(result.reason) : i18n.t('messages.study_failed')
      sendBubble(msg)
    }
  })
  
  // 获取商品列表
  ipcMain.handle('get-items', () => {
    return getItems()
  })
  
  // 购买物品
  ipcMain.on('buy-item', (_event, payload: { itemId: string, qty?: number }) => {
    const itemId = payload?.itemId
    const qty = Math.max(1, Math.floor(payload?.qty || 1))
    const ok = itemId ? buyItem(player, itemId, qty) : false
    if (ok) {
      saveGame(pet, player)
      updateTray()
      sendBubble(i18n.t('messages.shop_buy_success'))
    } else {
      sendBubble(i18n.t('messages.shop_buy_failed'))
    }
  })
  
  // 使用物品
  ipcMain.on('use-item', (_event, itemId: string) => {
    const result = useItem(pet, player, itemId)
    if (result.success) {
      saveGame(pet, player)
      win?.webContents.send('pet-update', pet)
      updateTray()
      const itemKey = `items.${itemId}`
      const itemName = i18n.t(itemKey) !== itemKey ? i18n.t(itemKey) : itemId
      sendBubble(i18n.t('messages.item_use_success'))
    } else {
      const msg = result.reason ? i18n.t(result.reason) : i18n.t('messages.item_use_failed')
      sendBubble(msg)
    }
  })

  // 获取探险地点
  ipcMain.handle('get-adventure-locations', () => {
    return getAdventureLocations(pet)
  })

  // 开始探险
  ipcMain.handle('start-adventure', (_event, locationId: string) => {
    const result = startAdventure(pet, player, locationId)
    if (result.success) {
      // Apply costs
      if (result.cost) {
        if (result.cost.hunger) pet.hunger = Math.max(0, Math.min(100, pet.hunger - result.cost.hunger))
        if (result.cost.clean) pet.clean = Math.max(0, Math.min(100, pet.clean + result.cost.clean)) // cost is usually negative
        if (result.cost.mood) pet.mood = Math.max(0, Math.min(100, pet.mood + result.cost.mood))
        if (result.cost.health) pet.health = Math.max(0, Math.min(100, pet.health + result.cost.health))
      }

      // Apply rewards
      if (result.rewards) {
        if (result.rewards.exp) {
          addExp(pet, result.rewards.exp)
        }
        if (result.rewards.coins) {
          player.coins += result.rewards.coins
        }
        if (result.rewards.mood) {
            pet.mood = Math.min(100, pet.mood + result.rewards.mood)
        }
        if (result.rewards.items) {
          result.rewards.items.forEach(item => {
            player.inventory[item.id] = (player.inventory[item.id] || 0) + item.count
          })
        }
        if (result.rewards.stats) {
          if (result.rewards.stats.strength) pet.strength += result.rewards.stats.strength
          if (result.rewards.stats.dexterity) pet.dexterity += result.rewards.stats.dexterity
          if (result.rewards.stats.endurance) pet.endurance += result.rewards.stats.endurance
          if (result.rewards.stats.intelligence) pet.intelligence += result.rewards.stats.intelligence
          if (result.rewards.stats.luck) pet.luck += result.rewards.stats.luck
          if (result.rewards.stats.charm) pet.charm += result.rewards.stats.charm
        }
      }

      // Add Adventure Stats & Check Achievements
      if (!player.stats) player.stats = { workCount: 0, studyCount: 0, adventureCount: 0, totalCoinsEarned: 0, itemsUsed: 0 }
      player.stats.adventureCount = (player.stats.adventureCount || 0) + 1
      const unlocks = AchievementSystem.checkAll(player, pet)
      if (unlocks.length > 0) {
        unlocks.forEach(ach => {
           setTimeout(() => {
               sendBubble(i18n.t('messages.achievement_unlocked', { name: ach.name }))
           }, 1000)
        })
      }

      saveGame(pet, player)
      win?.webContents.send('pet-update', pet)
      updateTray()
    }
    return result
  })

  ipcMain.on('open-adventure', () => {
    createAdventureWindow()
  })
}

// 创建设置窗口
function createSettingsWindow() {
  if (settingsWin) {
    settingsWin.focus()
    return
  }
  
  settingsWin = new BrowserWindow({
    width: 420,
    height: 560,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  const settingsPath = path.join(__dirname, '..', 'src', 'renderer', 'settings.html')
  settingsWin.loadFile(settingsPath)
  
  // 兔点击外部关闭
  settingsWin.on('blur', () => {
    // 可选：点击外部关闭
    // settingsWin?.close()
  })
  
  settingsWin.on('closed', () => {
    settingsWin = null
  })
}



const interactionWindows = new Map<string, BrowserWindow>()

function createInteractionWindow(data: any) {
  const type = data.type

  // Close other interaction windows to ensure only one is open
  Array.from(interactionWindows.keys()).forEach(key => {
    if (key !== type) {
      const win = interactionWindows.get(key)
      if (win && !win.isDestroyed()) {
        win.close()
      }
      interactionWindows.delete(key)
    }
  })

  if (interactionWindows.has(type)) {
    const existingWin = interactionWindows.get(type)
    if (existingWin && !existingWin.isDestroyed()) {
      existingWin.focus()
      // Optional: refresh data?
      existingWin.webContents.send('show-interaction', data)
      return
    }
    interactionWindows.delete(type)
  }
  
  const w = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  const p = path.join(__dirname, '..', 'src', 'renderer', 'interaction.html')
  w.loadFile(p)
  
  w.once('ready-to-show', () => {
    w.webContents.send('show-interaction', data)
    w.show()
  })
  
  w.on('closed', () => {
    interactionWindows.delete(type)
  })

  interactionWindows.set(type, w)
}

function getInteractionData(type: string) {
  let title = type.charAt(0).toUpperCase() + type.slice(1)
  let items: any[] = []
  let mode = 'inventory'
  let petStats: any = {}
  
  // Stats
  if (type === 'feed') petStats = { hunger: pet.hunger }
  else if (type === 'clean') petStats = { clean: pet.clean }
  else if (type === 'play') petStats = { mood: pet.mood }
  
  if (type === 'work') {
    items = getAvailableJobs(pet)
    mode = 'work'
    title = 'Work'
  } else if (type === 'study') {
    items = getStudies(pet)
    mode = 'study'
    title = 'Study'
  } else if (['feed', 'clean', 'play'].includes(type)) {
    const allItems = getItems()
    // Map action type to item type
    let targetItemType = type
    if (type === 'feed') targetItemType = 'food'
    if (type === 'play') targetItemType = 'toy'
    
    // console.log(`[Interaction] Type: ${type}, Target: ${targetItemType}`)
    
    const invItems: any[] = []
    for (const itemId in player.inventory) {
       if (player.inventory[itemId] > 0) {
         const item = allItems.find(i => i.id === itemId)
         if (item) {
           let match = item.type === targetItemType
           
           // Fallback: check effects if type mismatch
           // This allows items like 'medicine' (nutrition) to be used for feeding if they reduce hunger
           if (!match) {
             if (type === 'feed' && item.effects?.hunger && item.effects.hunger < 0) match = true
             if (type === 'clean' && item.effects?.clean && item.effects.clean > 0) match = true
           }

           if (match) {
             invItems.push({...item, count: player.inventory[itemId]})
           }
         }
       }
    }
    
    // Always show inventory view, even if empty
    items = invItems
    mode = 'inventory'
  } else if (type === 'shop') {
     items = getItems().sort((a,b) => a.type.localeCompare(b.type) || a.price - b.price)
     mode = 'shop'
  } else if (type === 'inventory') {
     const allItems = getItems()
     for (const itemId in player.inventory) {
       if (player.inventory[itemId] > 0) {
         const item = allItems.find(i => i.id === itemId)
         if (item) {
           items.push({...item, count: player.inventory[itemId]})
         }
       }
     }
     mode = 'inventory'
  }

  return { type, title, items, mode, money: player.coins, petStats }
}

let adventureWin: BrowserWindow | null = null

function createAdventureWindow() {
  if (adventureWin) {
    adventureWin.focus()
    return
  }
  
  adventureWin = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  const p = path.join(__dirname, '..', 'src', 'renderer', 'adventure.html')
  adventureWin.loadFile(p)
  
  adventureWin.on('closed', () => {
    adventureWin = null
  })
}

function createStatusWindow() {
  if (statusWin) {
    statusWin.focus()
    return
  }
  
  statusWin = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  const statusPath = path.join(__dirname, '..', 'src', 'renderer', 'status.html')
  statusWin.loadFile(statusPath)
  
  statusWin.on('closed', () => {
    statusWin = null
  })
}

function createDebugWindow() {
  if (debugWin) {
    debugWin.focus()
    return
  }
  
  // Enter Test Mode
  if (!isTestMode) {
    isTestMode = true
    try {
      backupState = { 
        pet: JSON.parse(JSON.stringify(pet)), 
        player: JSON.parse(JSON.stringify(player)) 
      }
      setTestMode(true)
      console.log('Entered Test Mode')
      // Force save to test file
      saveGame(pet, player)
      sendBubble(i18n.t('debug.title') + ': ON')
    } catch (e) {
      console.error('Failed to enter test mode', e)
    }
  }

  debugWin = new BrowserWindow({
    width: 300,
    height: 400,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })
  
  const p = path.join(__dirname, '..', 'src', 'renderer', 'debug.html')
  debugWin.loadFile(p)
  
  debugWin.on('closed', () => {
    debugWin = null
    // Exit Test Mode
    if (isTestMode) {
      isTestMode = false
      setTestMode(false)
      clearTestSave()
      
      if (backupState) {
        pet = backupState.pet
        player = backupState.player
        backupState = null
        
        broadcastUpdate(pet, player)
        updateTray()
        sendBubble(i18n.t('debug.title') + ': OFF')
        console.log('Exited Test Mode, state restored')
      }
    }
  })
}

function openTrayOverlay() {
  try {
    if (trayOverlayWin) {
      trayOverlayWin.focus()
      return
    }
    const pt = screen.getCursorScreenPoint()
    trayOverlayWin = new BrowserWindow({
      width: 160,
      height: 320,
      frame: false,
      transparent: true,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true
      }
    })
    
    // 点击外部关闭
    trayOverlayWin.on('blur', () => {
      trayOverlayWin?.close()
    })
    
    trayOverlayWin.on('closed', () => {
      trayOverlayWin = null
    })

    const displays = screen.getAllDisplays()
    const baseBounds = win ? win.getBounds() : { x: pt.x, y: pt.y, width: 0, height: 0 }
    const centerX = baseBounds.x + Math.floor(baseBounds.width / 2)
    const belowY = baseBounds.y + baseBounds.height + 8
    
    const targetDisplay = displays.find(di => {
      const b = di.bounds
      return centerX >= b.x && centerX <= (b.x + b.width) && belowY >= b.y && belowY <= (b.y + b.height)
    }) || displays[0]
    
    const bx = targetDisplay.bounds.x, by = targetDisplay.bounds.y, bw = targetDisplay.bounds.width, bh = targetDisplay.bounds.height
    const w = 160, h = 320
    
    // 优先显示在鼠标位置附近，如果超出屏幕则调整
    let posX = pt.x
    let posY = pt.y
    
    // 确保不超出右边界
    if (posX + w > bx + bw) {
      posX = bx + bw - w - 10
    }
    // 确保不超出下边界
    if (posY + h > by + bh) {
      posY = by + bh - h - 10
    }
    
    trayOverlayWin.setPosition(posX, posY)
    
    const menuPath = path.join(__dirname, '..', 'src', 'renderer', 'context-menu.html')
    trayOverlayWin.loadFile(menuPath)
    
  } catch (e) {
    console.error('Failed to open tray overlay:', e)
  }
}

function applyEffectiveMode(m: 'quiet'|'roam'|'mischief') {
  if (!win) return
  const dnd = player?.settings?.quietHours
  const nowH = new Date().getHours()
  let forceQuiet = false
  if (dnd && dnd.enabled) {
    if (dnd.start <= dnd.end) {
      forceQuiet = nowH >= dnd.start && nowH < dnd.end
    } else {
      forceQuiet = nowH >= dnd.start || nowH < dnd.end
    }
  }
  const effective = forceQuiet ? 'quiet' : m
  currentEffectiveMode = effective
  isDndQuiet = forceQuiet
  movement.setMode(effective)
  if (effective === 'quiet') {
    tickIntervalMs = 10000
    dialogIntervalMs = 60000
    dialogEnabled = false
  } else if (effective === 'roam') {
    tickIntervalMs = 1000
    dialogIntervalMs = 30000
    dialogEnabled = true
  } else {
    tickIntervalMs = 800
    dialogIntervalMs = 20000
    dialogEnabled = true
  }
  restartTickTimer()
  restartDialogTimer()
}

function buildTrayMenu() {
  const dnd = player.settings.quietHours || { enabled: false, start: 22, end: 7 }
  const now = Date.now()
  const leftLabel = (() => {
    if (pet.workingUntil && pet.workingUntil > now) {
      const ms = pet.workingUntil - now
      return `${i18n.t('tray.work_left')}: ${formatLeft(ms)}`
    }
    if (pet.studyingUntil && pet.studyingUntil > now) {
      const ms = pet.studyingUntil - now
      return `${i18n.t('tray.study_left')}: ${formatLeft(ms)}`
    }
    return null
  })()
  const modeName = i18n.t(`modes.${currentEffectiveMode}`)
  return Menu.buildFromTemplate([
    {label: `${pet.name} Lv.${pet.level}`, enabled: false},
    {label: `${i18n.t('status.labels.money')}: ${player.coins}`, enabled: false},
    {label: `${i18n.t('tray.mode')}: ${modeName}`, enabled: false},
    ...(leftLabel ? [{label: leftLabel, enabled: false}] : []),
    {type: 'separator'},
    {label: i18n.t('status.title'), click: () => createStatusWindow()},
    ...(pet.currentAction === 'work' ? [{
      label: i18n.t('tray.finish_work'),
      click: () => {
        const result = completeWork(pet, player, true)
        if (result !== null) {
          sendBubble(i18n.t('tray.settle_income', { amount: result.income }))
          updateTray()
          saveGame(pet, player)
        }
      }
    }] : []),
    {label: i18n.t('actions.study'), enabled: pet.currentAction !== 'work' && pet.currentAction !== 'study', submenu: getStudies().map(study => {
      const studyKey = `studies.${study.id}`
      const studyName = i18n.t(studyKey) !== studyKey ? i18n.t(studyKey) : study.name
      return {
        label: `${studyName} (${study.cost}${i18n.t('status.labels.money')})`,
        click: () => {
          const result = startStudy(pet, player, study.id)
          if (result.success) {
            saveGame(pet, player)
            win?.webContents.send('pet-update', pet)
            sendBubble(i18n.t('tray.start_study', { name: studyName }))
            updateTray()
          } else {
            const msg = result.reason ? i18n.t(result.reason) : i18n.t('tray.cannot_study')
            sendBubble(msg)
          }
        }
      }
    })},
    {label: i18n.t('actions.work'), enabled: pet.currentAction !== 'work' && pet.currentAction !== 'study', submenu: getAvailableJobs(pet).map(job => {
      const jobKey = `jobs.${job.id}`
      const jobName = i18n.t(jobKey) !== jobKey ? i18n.t(jobKey) : job.name
      return {
        label: `${jobName} (${job.duration}s)`,
        click: () => {
          const result = startWork(pet, job.id)
          if (result.success) {
            saveGame(pet, player)
            win?.webContents.send('pet-update', pet)
            sendBubble(i18n.t('tray.start_work', { name: jobName, duration: job.duration }))
            updateTray()
          } else {
            const msg = result.reason ? i18n.t(result.reason) : i18n.t('tray.cannot_work')
            sendBubble(msg)
          }
        }
      }
    })},
    {label: i18n.t('tray.shop_quick'), submenu: (() => {
      const items = getItems()
      const quickIds = ['bread', 'soap', 'ball', 'cold_medicine']
      return quickIds
        .map(id => items.find(i => i.id === id))
        .filter((item): item is NonNullable<typeof item> => !!item)
        .map(item => {
          const itemKey = `items.${item.id}`
          const itemName = i18n.t(itemKey) !== itemKey ? i18n.t(itemKey) : item.name
          return {
            label: `${itemName} (${item.price}${i18n.t('status.labels.money')})`,
            click: () => {
              if (buyItem(player, item.id, 1)) {
                saveGame(pet, player)
                updateTray()
                sendBubble(i18n.t('messages.shop_buy_success'))
              } else {
                sendBubble(i18n.t('messages.shop_buy_failed'))
              }
            }
          }
        })
    })()},
    {label: i18n.t('tray.inventory'), submenu: Object.entries(player.inventory).map(([id, count]) => {
      const it = getItems().find(i => i.id === id)
      const name = it ? it.name : id
      const itemKey = `items.${id}`
      const itemName = i18n.t(itemKey) !== itemKey ? i18n.t(itemKey) : name
      return {
        label: `${itemName} ×${count}`,
        click: () => {
          if (useItem(pet, player, id)) {
            saveGame(pet, player)
            win?.webContents.send('pet-update', pet)
            updateTray()
            sendBubble(i18n.t('messages.item_use_success'))
          } else {
            sendBubble(i18n.t('messages.item_use_failed'))
          }
        }
      }
    })},
    {
      label: i18n.t('tray.settings'),
      submenu: [
        { label: i18n.t('tray.dnd_settings'), click: () => createSettingsWindow() },
        { label: i18n.t('tray.open_settings'), click: () => createSettingsWindow() }
      ]
    },
    {type: 'separator'},
    {label: i18n.t('tray.show_pet'), click: () => win?.show()},
    {label: i18n.t('tray.hide_pet'), click: () => win?.hide()},
    {type: 'separator'},
    {label: i18n.t('tray.save_game'), click: () => saveGame(pet, player)},
    {type: 'separator'},
    {label: i18n.t('tray.quit'), click: () => {
      saveGame(pet, player)
      app.quit()
    }}
  ])
}

function formatLeft(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h${m}m`
  if (m > 0) return `${m}m${s}s`
  return `${s}s`
}
app.whenReady().then(() => {
  app.setAppUserModelId('com.example.electronicpet')
  // 加载游戏数据
  const gameData = loadGame()
  pet = gameData.pet
  player = gameData.player
  
  // 初始化语言
  if (player.settings.language) {
    i18n.setLocale(player.settings.language)
  }

  console.log('游戏数据加载完成:')
  console.log(`宠物: ${pet.name}, Lv.${pet.level}`)
  console.log(`元宝: ${player.coins}`)
  
  createWindow()
  createTray()
  setupIPC()
  modeDetection.start(win!, (m) => {
    applyEffectiveMode(m)
  })
  currentUserMode = player.settings.defaultMode || 'roam'
  applyEffectiveMode(currentUserMode)
  startGameLoop()
  startAutoSave(pet, player)
  
  globalShortcut.register('Alt+S', () => {
    createSettingsWindow()
  })
  globalShortcut.register('Alt+M', () => {
    const next = currentUserMode === 'roam' ? 'mischief' : currentUserMode === 'mischief' ? 'quiet' : 'roam'
    currentUserMode = next
    modeDetection.setUserMode(next)
  })
  globalShortcut.register('Alt+1', () => {
    currentUserMode = 'roam'
    modeDetection.setUserMode('roam')
    applyEffectiveMode('roam')
    updateTray()
  })
  globalShortcut.register('Alt+2', () => {
    currentUserMode = 'mischief'
    modeDetection.setUserMode('mischief')
    applyEffectiveMode('mischief')
    updateTray()
  })
  globalShortcut.register('Alt+3', () => {
    currentUserMode = 'quiet'
    modeDetection.setUserMode('quiet')
    applyEffectiveMode('quiet')
    updateTray()
  })
  globalShortcut.register('Alt+N', () => {
    player.settings.bubbleEnabled = !player.settings.bubbleEnabled
    saveGame(pet, player)
    updateTray()
  })
  globalShortcut.register('Alt+T', () => {
    player.settings.toastEnabled = !player.settings.toastEnabled
    saveGame(pet, player)
    updateTray()
  })
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // 不退出应用，托盘常驻
})

app.on('before-quit', () => {
  console.log('正在退出，保存游戏...')
  stopGameLoop()
  stopAutoSave()
  saveGame(pet, player)
})
