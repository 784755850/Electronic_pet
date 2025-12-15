import fs from 'node:fs'
import path from 'node:path'
import {app} from 'electron'
import type { SaveData, Pet, Player } from './types/index.js'
import { createPet, offlineSettle } from './core/pet.js'

const SAVE_FILE = 'save.json'
const TEST_SAVE_FILE = 'save_test.json'
const VERSION = '1.0.0'

let isTestMode = false

export function setTestMode(enabled: boolean) {
  isTestMode = enabled
}

export function clearTestSave() {
  const userDataPath = app.getPath('userData')
  const testPath = path.join(userDataPath, TEST_SAVE_FILE)
  if (fs.existsSync(testPath)) {
    try {
      fs.unlinkSync(testPath)
      console.log('Test save cleared')
    } catch (e) {
      console.error('Failed to clear test save', e)
    }
  }
}

// 获取存档路径
export function getSavePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, isTestMode ? TEST_SAVE_FILE : SAVE_FILE)
}

// 创建默认玩家数据
export function createDefaultPlayer(): Player {
  return {
    coins: 50,  // 初始50元宝
    inventory: {},
    stats: {
      workCount: 0,
      studyCount: 0,
      adventureCount: 0,
      totalCoinsEarned: 0,
      itemsUsed: 0
    },
    achievements: [],
    settings: {
      soundEnabled: true,
      autoSave: true,
      bubbleEnabled: true,
      toastEnabled: true,
      defaultMode: 'roam',
      colorTheme: 'purple',  // 默认紫色主题
      widgetBgColor: '',
      quietHours: {
        enabled: false,
        start: 22,
        end: 7
      }
    }
  }
}

// 保存游戏
export function saveGame(pet: Pet, player: Player): void {
  const data: SaveData = {
    version: VERSION,
    pet,
    player,
    lastSaved: Date.now()
  }
  
  const savePath = getSavePath()
  const dir = path.dirname(savePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(savePath, JSON.stringify(data, null, 2), 'utf-8')
  console.log('游戏已保存到:', savePath)
}

// 加载游戏
export function loadGame(): { pet: Pet; player: Player } {
  const savePath = getSavePath()
  
  // 如果没有存档，创建新游戏
  if (!fs.existsSync(savePath)) {
    console.log('未找到存档，创建新游戏')
    const pet = createPet('小Q')
    const player = createDefaultPlayer()
    return { pet, player }
  }
  
  try {
    const data: SaveData = JSON.parse(fs.readFileSync(savePath, 'utf-8'))
    
    // 离线结算
    offlineSettle(data.pet)
    
    const s: any = data.player?.settings || {}
    if (typeof s.bubbleEnabled === 'undefined') {
      s.bubbleEnabled = typeof s.notifyEnabled === 'boolean' ? s.notifyEnabled : true
    }
    if (typeof s.toastEnabled === 'undefined') {
      s.toastEnabled = typeof s.notifyEnabled === 'boolean' ? s.notifyEnabled : true
    }
    data.player.settings = {
      ...data.player.settings,
      bubbleEnabled: s.bubbleEnabled,
      toastEnabled: s.toastEnabled
    }
    
    console.log('游戏已加载')
    console.log('离线时长:', Math.floor((Date.now() - data.lastSaved) / 1000 / 60), '分钟')
    
    return {
      pet: data.pet,
      player: data.player
    }
  } catch (error) {
    console.error('加载存档失败，创建新游戏:', error)
    const pet = createPet('小Q')
    const player = createDefaultPlayer()
    return { pet, player }
  }
}

// 自动保存（每分钟）
let autoSaveTimer: NodeJS.Timeout | null = null

export function startAutoSave(pet: Pet, player: Player): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  
  autoSaveTimer = setInterval(() => {
    if (player.settings.autoSave) {
      saveGame(pet, player)
    }
  }, 60 * 1000) // 每分钟保存一次
}

export function stopAutoSave(): void {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}
