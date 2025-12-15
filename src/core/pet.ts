import type { Pet, PetStage } from '../types/index.js'
import { addExp } from './growth'

// 工具函数：限制数值范围
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// 创建新宠物
export function createPet(name: string): Pet {
  const now = Date.now()
  return {
    id: `pet_${now}`,
    name,
    stage: 'egg',
    level: 0,
    exp: 0,
    
    // 初始属性
    hunger: 20,
    clean: 80,
    mood: 80,
    health: 100,
    
    strength: 10,
    dexterity: 10,
    endurance: 10,
    intelligence: 10,
    luck: 10,
    charm: 10,

    dailyInteractionGrowth: 0,
    lastInteractionReset: now,
    lastInteractionTime: now,
    completedStudies: [],
    
    sick: false,
    appearanceSeed: now,
    currentAction: 'idle',
    
    lastUpdate: now,
    bornAt: now,
    
    x: 100,
    y: 100
  }
}

// 属性衰减（每秒调用）
export function tick(pet: Pet): void {
  const now = Date.now()
  const delta = (now - pet.lastUpdate) / 1000 / 3600 // 转换为小时
  
  // 饥饿每小时 +20
  pet.hunger = clamp(pet.hunger + 20 * delta, 0, 100)
  
  // 清洁每小时 -15
  pet.clean = clamp(pet.clean - 15 * delta, 0, 100)
  
  // 心情受饥饿和清洁影响
  if (pet.hunger >= 80) {
    pet.mood = clamp(pet.mood - 10 * delta, 0, 100)
  }
  if (pet.clean <= 20) {
    pet.mood = clamp(pet.mood - 5 * delta, 0, 100)
  }
  
  // 生病判定
  if (pet.clean < 20 && Math.random() < 0.01 * delta) {
    pet.sick = true
  }
  
  // 生病时健康下降
  if (pet.sick) {
    pet.health = clamp(pet.health - 5 * delta, 0, 100)
  }
  
  // 健康<=0强制睡觉
  if (pet.health <= 0 && pet.currentAction !== 'sleep') {
    pet.currentAction = 'sleep'
  }
  
  // 重置每日互动限制
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  if (!pet.lastInteractionReset || pet.lastInteractionReset < startOfToday) {
    pet.dailyInteractionGrowth = 0
    pet.lastInteractionReset = now
  }
  
  // 在线挂机成长 (每小时 +10)
  const growth = 10 * delta
  addExp(pet, growth)
  
  pet.lastUpdate = now
}

// 离线结算
export function offlineSettle(pet: Pet): void {
  const now = Date.now()
  const offlineHours = (now - pet.lastUpdate) / 1000 / 3600
  
  // 超过24小时进入休眠保护
  if (offlineHours > 24) {
    console.log('休眠保护：超过24小时离线')
    pet.lastUpdate = now
    return
  }
  
  // 正常结算
  tick(pet)
  
  // 限制极端值（离线保护）
  if (offlineHours > 12) {
    pet.hunger = Math.min(pet.hunger, 90)
    pet.clean = Math.max(pet.clean, 10)
  }
}

// 喂食
export function feed(pet: Pet, hungerReduction: number, moodBonus: number = 0): void {
  pet.hunger = clamp(pet.hunger - hungerReduction, 0, 100)
  pet.mood = clamp(pet.mood + moodBonus, 0, 100)
}

// 洗澡
export function clean(pet: Pet, cleanBonus: number, moodBonus: number = 0): void {
  pet.clean = clamp(pet.clean + cleanBonus, 0, 100)
  pet.mood = clamp(pet.mood + moodBonus, 0, 100)
}

// 玩耍
export function play(pet: Pet, moodBonus: number): void {
  pet.mood = clamp(pet.mood + moodBonus, 0, 100)
}

// 吃药
export function takeMedicine(pet: Pet, healthBonus: number = 0, moodPenalty: number = 0): void {
  pet.sick = false
  pet.health = clamp(pet.health + healthBonus, 0, 100)
  pet.mood = clamp(pet.mood - moodPenalty, 0, 100)
}

// 增加互动经验（受每日上限限制）
export function addInteractionExp(pet: Pet, amount: number): number {
  const MAX_DAILY_GROWTH = 500
  
  if (!pet.dailyInteractionGrowth) {
    pet.dailyInteractionGrowth = 0
  }
  
  if (pet.dailyInteractionGrowth >= MAX_DAILY_GROWTH) {
    return 0
  }
  
  const actualGain = Math.min(amount, MAX_DAILY_GROWTH - pet.dailyInteractionGrowth)
  if (actualGain > 0) {
    addExp(pet, actualGain)
    pet.dailyInteractionGrowth += actualGain
  }
  
  return actualGain
}

// 应用待生效的属性效果
export function applyPendingEffects(pet: Pet): void {
  if (!pet.pendingEffects) return

  const e = pet.pendingEffects
  if (e.hunger) pet.hunger = clamp(pet.hunger + e.hunger, 0, 100)
  if (e.clean) pet.clean = clamp(pet.clean + e.clean, 0, 100)
  if (e.mood) pet.mood = clamp(pet.mood + e.mood, 0, 100)
  if (e.health) pet.health = clamp(pet.health + e.health, 0, 100)
  
  if (e.strength) pet.strength = clamp(pet.strength + e.strength, 0, 100)
  if (e.dexterity) pet.dexterity = clamp(pet.dexterity + e.dexterity, 0, 100)
  if (e.endurance) pet.endurance = clamp(pet.endurance + e.endurance, 0, 100)
  if (e.intelligence) pet.intelligence = clamp(pet.intelligence + e.intelligence, 0, 100)
  if (e.luck) pet.luck = clamp(pet.luck + e.luck, 0, 100)
  if (e.charm) pet.charm = clamp(pet.charm + e.charm, 0, 100)
  
  // 互动获得成长值
  // 基础互动成长值：每次动作 +10
  addInteractionExp(pet, 10)

  if (e.cure) {
    pet.sick = false
  }
  
  pet.pendingEffects = undefined
}

// 抚摸（点击）
export function pet_pet(pet: Pet): void {
  pet.mood = clamp(pet.mood + 2, 0, 100)
  addInteractionExp(pet, 2)
}

// 检查进化
export function checkEvolution(pet: Pet): PetStage | null {
  // Egg -> Baby (Level 1, 100 Exp)
  if (pet.stage === 'egg' && pet.level >= 1) {
    pet.stage = 'baby'
    return 'baby'
  }
  
  // Baby -> Adult (Level 5, 1500 Exp)
  if (pet.stage === 'baby' && pet.level >= 5) {
    pet.stage = 'adult'
    return 'adult'
  }
  
  return null
}

// 获取随机对话
export function getRandomDialog(pet: Pet): string | null {
  const dialogs: string[] = []
  
  if (pet.hunger >= 80) {
    dialogs.push('主人，我饿了', '好饿啊，给我吃的吧')
  }
  
  if (pet.clean <= 20) {
    dialogs.push('我需要洗澡', '身上好脏啊')
  }
  
  if (pet.mood < 40) {
    dialogs.push('好无聊啊', '陪我玩嘛')
  }
  
  if (pet.sick) {
    dialogs.push('我生病了，需要吃药', '感觉不舒服')
  }
  
  if (dialogs.length === 0 && Math.random() < 0.1) {
    dialogs.push('主人真好', '我很开心', '今天天气不错')
  }
  
  return dialogs.length > 0 ? dialogs[Math.floor(Math.random() * dialogs.length)] : null
}
