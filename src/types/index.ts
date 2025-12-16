// 核心类型定义

export type PetStage = 'egg' | 'baby' | 'adult'
export type PetAction = 'idle' | 'walk' | 'sit' | 'work' | 'study' | 'sleep' | 'eating' | 'cleaning' | 'playing'

export interface Pet {
  id: string
  name: string
  stage: PetStage
  level: number              // 0-99
  exp: number                // 当前经验值
  
  // 基础属性 0-100
  hunger: number             // 饥饿值（越高越饿）
  clean: number              // 清洁值
  mood: number               // 心情值
  health: number             // 健康值
  
  // 成长属性 0-100
  strength: number           // 力量
  dexterity: number          // 敏捷
  endurance: number          // 耐力
  intelligence: number       // 智力
  luck: number               // 幸运
  charm: number              // 魅力 (保留，可能用于社交/其他)
  
  // 互动成长限制
  dailyInteractionGrowth: number // 今日互动获得的成长值
  lastInteractionReset: number   // 上次重置互动限制的时间戳
  lastInteractionTime?: number   // 上次用户手动互动的时间戳
  isAutoAction?: boolean         // 当前动作是否由自动化触发（收益减半）
  
  completedStudies: string[]     // 已完成的课程ID列表
  
  // 状态
  sick: boolean              // 是否生病
  appearanceSeed?: number    // 外观种子
  currentAction: PetAction
  workingUntil?: number      // 打工结束时间戳
  studyingUntil?: number     // 学习结束时间戳
  actionEndsAt?: number      // 通用动作结束时间戳 (eating, cleaning, playing)
  actionTotalDuration?: number // 通用动作总时长（毫秒）
  pendingEffects?: {         // 待应用的属性效果
    hunger?: number
    clean?: number
    mood?: number
    health?: number
    cure?: boolean
    strength?: number
    dexterity?: number
    endurance?: number
    intelligence?: number
    luck?: number
    charm?: number
  }
  workingStartedAt?: number
  studyingStartedAt?: number
  currentJob?: string        // 当前工作ID
  currentStudy?: string      // 当前学习ID
  
  // 时间
  lastUpdate: number         // 上次更新时间戳
  bornAt: number             // 出生时间戳
  
  // 位置（桌面）
  x: number
  y: number
}

// 宠物颜色配置
export interface PetColors {
  dark: string      // 轮廓/深色
  mid: string       // 主体色
  light: string     // 高光/浅色
}

// 预设颜色方案
export type ColorTheme = 'purple' | 'green' | 'blue' | 'pink' | 'orange' | 'custom'

export interface PlayerStats {
  workCount: number
  studyCount: number
  adventureCount: number
  totalCoinsEarned: number
  itemsUsed: number
}

export interface LocalizedText {
  name?: string
  description?: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  locales?: Record<string, LocalizedText>
  condition: {
    type: 'work_count' | 'study_count' | 'adventure_count' | 'earn_money' | 'items_used'
    target: number
  }
  reward?: {
    coins?: number
    items?: { id: string, count: number }[]
    exp?: number
  }
}

export interface Player {
  coins: number              // 元宝余额
  inventory: Record<string, number>  // {itemId: count}
  stats: PlayerStats         // 统计数据
  achievements: string[]     // 已解锁成就ID
  settings: {
    language?: 'zh-CN' | 'en-US'
    soundEnabled: boolean
    autoSave: boolean
    bubbleEnabled: boolean
    toastEnabled: boolean
    defaultMode?: 'quiet'|'roam'|'mischief'
    colorTheme: ColorTheme
    customColors?: PetColors
    widgetBgColor?: string
    showTrayIcon?: boolean
    alwaysOnTop?: boolean
    quietHours?: {
      enabled: boolean
      start: number
      end: number
    }
    llm?: {
    enabled?: boolean
    provider?: 'bailian' | 'openai' | 'xiaozhi' // 'openai' supports Ollama, LM Studio, etc.
    baseUrl?: string // For local/custom providers, or XiaoZhi WebSocket URL
    apiKey: string // For XiaoZhi, this is the Bearer token
    model: string
    systemPrompt?: string
    temperature?: number // 0.0 - 2.0
    maxHistory?: number // 0-50
  }
}
}

export interface Job {
  id: string
  name: string
  locales?: Record<string, LocalizedText>
  income: number             // 每次收入
  requirement: {
    level?: number
    strength?: number
    dexterity?: number
    endurance?: number
    intelligence?: number
    luck?: number
    charm?: number
    stages?: PetStage[]
  }
  duration: number           // 动作持续时间（秒）
}

export interface ItemEffect {
  hunger?: number
  clean?: number
  mood?: number
  health?: number
  cure?: boolean
  strength?: number
  dexterity?: number
  endurance?: number
  intelligence?: number
  luck?: number
  charm?: number
}

export interface Item {
  id: string
  name: string
  locales?: Record<string, LocalizedText>
  type: 'food' | 'clean' | 'toy' | 'medicine' | 'special'
  price: number
  duration?: number        // 动作持续时间（秒）
  effects: ItemEffect
  durability?: number        // 玩具耐久度
}

export interface Study {
  id: string
  name: string
  locales?: Record<string, LocalizedText>
  cost: number               // 元宝消耗
  duration: number           // 学习时长（秒）
  preReqStudyId?: string     // 前置课程ID
  requirements?: {
    level?: number
    stages?: PetStage[]
  }
  cost_stats?: {
    hunger?: number
    clean?: number
    mood?: number
    health?: number
  }
  effect: {
    strength?: number
    dexterity?: number
    endurance?: number
    intelligence?: number
    luck?: number
    charm?: number
    exp?: number
  }
}

export interface SaveData {
  version: string
  pet: Pet
  player: Player
  lastSaved: number
}
