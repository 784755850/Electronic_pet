import fs from 'node:fs'
import path from 'node:path'
import {app} from 'electron'
import type { SaveData, Pet, Player } from './types/index.js'
import { createPet, offlineSettle } from './core/pet.js'

const SAVE_FILE = 'save.json'
const TEST_SAVE_FILE = 'save_test.json'
const LLM_CONFIG_FILE = 'llm_config.json'
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
  // 检查是否存在本地数据目录（Portable模式支持）
  const exeDir = path.dirname(app.getPath('exe'))
  // 开发环境下 exeDir 可能是 dist 目录，我们需要向上找
  // 在生产环境（打包后），exe 在根目录，resources 在旁边
  
  // 简单的本地数据检查：如果应用目录下有 data 文件夹，则使用它
  // 注意：如果是安装在 Program Files，普通用户可能没有写入权限
  // 这里的逻辑主要服务于 Portable 版本或用户手动创建 data 文件夹的情况
  let localDataDir = path.join(exeDir, 'data')
  
  // 开发模式下，存在根目录
  if (!app.isPackaged) {
    localDataDir = path.join(process.cwd(), 'data')
  }

  if (fs.existsSync(localDataDir)) {
    return path.join(localDataDir, isTestMode ? TEST_SAVE_FILE : SAVE_FILE)
  }

  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, isTestMode ? TEST_SAVE_FILE : SAVE_FILE)
}

export function getLLMConfigPath(): string {
  // 同步检查本地数据目录
  const exeDir = path.dirname(app.getPath('exe'))
  let localDataDir = path.join(exeDir, 'data')
  if (!app.isPackaged) {
    localDataDir = path.join(process.cwd(), 'data')
  }

  if (fs.existsSync(localDataDir)) {
    return path.join(localDataDir, LLM_CONFIG_FILE)
  }

  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, LLM_CONFIG_FILE)
}

export function loadLLMConfig(): any {
  const configPath = getLLMConfigPath()
  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    } catch (e) {
      console.error('Failed to load LLM config', e)
    }
  }
  return null
}

export function saveLLMConfig(config: any): void {
  const configPath = getLLMConfigPath()
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    console.log('LLM config saved to:', configPath)
  } catch (e) {
    console.error('Failed to save LLM config', e)
  }
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
      },
      llm: {
        enabled: false,
        provider: 'bailian',
        apiKey: '',
        model: 'qwen-turbo',
        systemPrompt: '你是桌面宠物小Q，性格活泼可爱，喜欢和主人聊天。请用简短可爱的语气回答。'
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
  
  // 尝试加载独立存储的 LLM 配置
  const llmConfig = loadLLMConfig()

  // 如果没有存档，创建新游戏
  if (!fs.existsSync(savePath)) {
    console.log('未找到存档，创建新游戏')
    const pet = createPet('小Q')
    const player = createDefaultPlayer()
    
    // 如果有独立的 LLM 配置，应用它
    if (llmConfig) {
      player.settings.llm = { ...player.settings.llm, ...llmConfig }
    }
    
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
    
    // 处理 LLM 配置
    if (llmConfig) {
      // 优先使用独立文件中的配置
      data.player.settings.llm = { ...data.player.settings.llm, ...llmConfig }
    } else if (data.player.settings.llm) {
      // 迁移：如果 save.json 中有配置但独立文件没有，保存到独立文件
      saveLLMConfig(data.player.settings.llm)
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
    
    // 如果有独立的 LLM 配置，应用它
    if (llmConfig) {
      player.settings.llm = { ...player.settings.llm, ...llmConfig }
    }

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
