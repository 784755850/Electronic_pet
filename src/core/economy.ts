import type { Pet, Player, Job, Item, Study, Achievement } from '../types/index.js'
import { dataLoader } from './data-loader.js'
import { addExp } from './growth.js'
import { addInteractionExp } from './pet.js'
import { AchievementSystem } from './achievement.js'
import { ActionSystem, ActionDefinition, ActionContext } from './action-system.js'

// --- Action Factories ---

// Minimum durations per category (seconds)
const MIN_DURATIONS = {
  work: 5,
  study: 5,
  item: 2,
  adventure: 10
}

function createWorkAction(job: Job): ActionDefinition {
  const duration = Math.max(MIN_DURATIONS.work, job.duration || MIN_DURATIONS.work)
  return {
    id: job.id,
    type: 'work',
    name: job.name,
    duration: duration * 1000,
    conditions: [
      ({ pet }: ActionContext) => {
        const req = job.requirement
        if (req.level && pet.level < req.level) return { success: false, reason: 'messages.level_too_low' }
        if (req.strength && pet.strength < req.strength) return { success: false, reason: 'messages.strength_too_low' }
        if (req.dexterity && pet.dexterity < req.dexterity) return { success: false, reason: 'messages.dexterity_too_low' }
        if (req.endurance && pet.endurance < req.endurance) return { success: false, reason: 'messages.endurance_too_low' }
        if (req.intelligence && pet.intelligence < req.intelligence) return { success: false, reason: 'messages.intelligence_too_low' }
        if (req.luck && pet.luck < req.luck) return { success: false, reason: 'messages.luck_too_low' }
        if (req.charm && pet.charm < req.charm) return { success: false, reason: 'messages.charm_too_low' }
        if (req.stages && !req.stages.includes(pet.stage)) return { success: false, reason: 'messages.invalid_stage' }
        return { success: true }
      }
    ],
    onComplete: [
      ({ pet, player }: ActionContext) => {
        // Logic handled in completeWork for now to return income, 
        // but could be moved here if return value wasn't needed synchronously
      }
    ]
  }
}

function createStudyAction(study: Study): ActionDefinition {
  const duration = Math.max(MIN_DURATIONS.study, study.duration || MIN_DURATIONS.study)
  return {
    id: study.id,
    type: 'study',
    name: study.name,
    duration: duration * 1000,
    conditions: [
      ({ pet }: ActionContext) => {
        if (study.requirements?.stages && !study.requirements.stages.includes(pet.stage)) {
          return { success: false, reason: 'messages.invalid_stage' }
        }
        if (study.requirements?.level && pet.level < study.requirements.level) {
          return { success: false, reason: 'messages.level_too_low' }
        }
        if (study.preReqStudyId && (!pet.completedStudies || !pet.completedStudies.includes(study.preReqStudyId))) {
          return { success: false, reason: 'messages.prerequisite_not_met' }
        }
        return { success: true }
      },
      ({ pet }: ActionContext) => {
        if (study.cost_stats) {
          const s = study.cost_stats
          if (s.hunger && (pet.hunger + s.hunger > 100)) return { success: false, reason: 'messages.too_hungry' }
          if (s.mood && (pet.mood - s.mood < 0)) return { success: false, reason: 'messages.mood_too_low' }
          if (s.clean && (pet.clean - s.clean < 0)) return { success: false, reason: 'messages.too_dirty' }
          if (s.health && (pet.health - s.health < 0)) return { success: false, reason: 'messages.too_sick' }
        }
        return { success: true }
      },
      ({ player }: ActionContext) => {
        if (player.coins < study.cost) return { success: false, reason: 'messages.not_enough_coins' }
        return { success: true }
      }
    ],
    onStart: [
      ({ pet, player }: ActionContext) => {
        player.coins -= study.cost
        if (study.cost_stats) {
          const s = study.cost_stats
          if (s.hunger) pet.hunger += s.hunger
          if (s.mood) pet.mood -= s.mood
          if (s.clean) pet.clean -= s.clean
          if (s.health) pet.health -= s.health
        }
      }
    ],
    onComplete: [
      ({ pet }: ActionContext) => {
        if (study.effect.strength) pet.strength = Math.min(100, pet.strength + study.effect.strength)
        if (study.effect.dexterity) pet.dexterity = Math.min(100, pet.dexterity + study.effect.dexterity)
        if (study.effect.endurance) pet.endurance = Math.min(100, pet.endurance + study.effect.endurance)
        if (study.effect.intelligence) pet.intelligence = Math.min(100, pet.intelligence + study.effect.intelligence)
        if (study.effect.luck) pet.luck = Math.min(100, pet.luck + study.effect.luck)
        if (study.effect.charm) pet.charm = Math.min(100, pet.charm + study.effect.charm)
        if (study.effect.exp) addInteractionExp(pet, study.effect.exp)
        
        if (!pet.completedStudies) pet.completedStudies = []
        if (!pet.completedStudies.includes(study.id)) {
          pet.completedStudies.push(study.id)
        }
      }
    ]
  }
}

function createItemAction(item: Item, quantity: number = 1, efficiency: number = 1): ActionDefinition {
  const itemDuration = item.duration || 0
  // Apply minimum only if it's not instantaneous (0 usually means instant, but user said "cannot be 0")
  // User said "each time cannot be 0". So we enforce minimum.
  const duration = Math.max(MIN_DURATIONS.item, itemDuration) * 1000
  
  let actionType: any = 'idle'
  if (duration > 0) {
      if (item.type === 'food') actionType = 'eating'
      else if (item.type === 'clean') actionType = 'cleaning'
      else if (item.type === 'toy') actionType = 'playing'
      else if (item.type === 'medicine') actionType = 'eating'
  }

  return {
    id: item.id,
    type: actionType, 
    name: item.name,
    duration: duration,
    conditions: [
      ({ pet }: ActionContext) => {
        const availableStates = ['idle', 'walk', 'sit']
        if (actionType !== 'idle' && !availableStates.includes(pet.currentAction)) {
           return { success: false, reason: 'messages.pet_busy_now' }
        }
        return { success: true }
      },
      ({ player }: ActionContext) => {
        if (!player.inventory[item.id] || player.inventory[item.id] < quantity) {
           return { success: false, reason: 'messages.not_enough_items' }
        }
        return { success: true }
      }
    ],
    onStart: [
      ({ pet, player }: ActionContext) => {
         player.inventory[item.id] -= quantity
         if (player.inventory[item.id] <= 0) delete player.inventory[item.id]
         
         if (duration > 0) {
            const effects = { ...item.effects }
            if (efficiency !== 1) {
              if (effects.hunger) effects.hunger *= efficiency
              if (effects.clean) effects.clean *= efficiency
              if (effects.mood) effects.mood *= efficiency
              if (effects.health) effects.health *= efficiency
              if (effects.strength) effects.strength *= efficiency
              if (effects.dexterity) effects.dexterity *= efficiency
              if (effects.endurance) effects.endurance *= efficiency
              if (effects.intelligence) effects.intelligence *= efficiency
              if (effects.luck) effects.luck *= efficiency
              if (effects.charm) effects.charm *= efficiency
            }
            pet.pendingEffects = effects
         } else {
            // Apply immediately
            applyItemEffects(pet, item, efficiency)
         }
      }
    ]
  }
}

// Helper for immediate item effects
function applyItemEffects(pet: Pet, item: Item, efficiency: number = 1) {
  if (item.effects.hunger) pet.hunger = Math.max(0, Math.min(100, pet.hunger + item.effects.hunger * efficiency))
  if (item.effects.clean) pet.clean = Math.max(0, Math.min(100, pet.clean + item.effects.clean * efficiency))
  if (item.effects.mood) pet.mood = Math.max(0, Math.min(100, pet.mood + item.effects.mood * efficiency))
  if (item.effects.health) pet.health = Math.max(0, Math.min(100, pet.health + item.effects.health * efficiency))
  if (item.effects.cure) pet.sick = false
  
  if (item.effects.strength) pet.strength += item.effects.strength * efficiency
  if (item.effects.dexterity) pet.dexterity += item.effects.dexterity * efficiency
  if (item.effects.endurance) pet.endurance += item.effects.endurance * efficiency
  if (item.effects.intelligence) pet.intelligence += item.effects.intelligence * efficiency
  if (item.effects.luck) pet.luck += item.effects.luck * efficiency
  if (item.effects.charm) pet.charm += item.effects.charm * efficiency
  
  addExp(pet, 10 * efficiency)
}

// --- Exported Functions (Refactored) ---

// 检查是否满足工作要求
export function canWork(pet: Pet, job: Job): boolean {
  // Use a dummy context since we only check conditions
  const action = createWorkAction(job)
  return ActionSystem.canStart(action, { pet, player: {} as any }).success
}

// 开始打工
export function startWork(pet: Pet, jobId: string, isAuto: boolean = false): { success: boolean, reason?: string } {
  const job = dataLoader.getJob(jobId)
  if (!job) return { success: false, reason: 'messages.work_not_found' }
  
  // Duration is now fixed in Job definition
  
  const action = createWorkAction(job)
  const result = ActionSystem.start(action, { pet, player: {} as any })
  
  if (result.success) {
    pet.isAutoAction = isAuto
    if (!isAuto) {
      pet.lastInteractionTime = Date.now()
    }
  }
  return result
}

// 完成打工
export function completeWork(pet: Pet, player: Player, force: boolean = false): { income: number, unlocks?: Achievement[] } | null {
  if (!pet.workingUntil || !pet.currentJob) return null
  
  const job = dataLoader.getJob(pet.currentJob)
  if (!job) {
    ActionSystem.resetState(pet, 'work')
    return null
  }
  
  // Calculate income logic (specific to work)
  const now = Date.now()
  const startTs = pet.workingStartedAt || pet.workingUntil
  const endTs = Math.min(now, pet.workingUntil)
  
  // Use defined duration, not elapsed time for income calculation?
  // Usually income is "per job completion". Since duration is fixed, income is fixed.
  // The original logic tried to calculate partial income or tiered income.
  // Now it's a single fixed duration task.
  // Let's assume full income if completed successfully.
  
  const action = createWorkAction(job)
  const duration = action.duration / 1000 // Seconds
  
  let income = job.income // Now income is "per task" not "per hour" based on new type definition
  if (pet.mood < 60) income *= 0.5
  
  if (pet.isAutoAction) {
    income *= 0.5
  }

  income = Math.floor(income)
  
  // Execute completion (this will clean up state)
  const success = ActionSystem.complete(action, { pet, player }, force)
  
  if (success || force) {
    pet.isAutoAction = false
    
    // If forced or success, we give income calculated above
    // Note: ActionSystem.complete already reset the state
    if (income > 0) player.coins += income

    // Add Stats
    if (!player.stats) player.stats = { workCount: 0, studyCount: 0, adventureCount: 0, totalCoinsEarned: 0, itemsUsed: 0 }
    player.stats.workCount = (player.stats.workCount || 0) + 1
    player.stats.totalCoinsEarned = (player.stats.totalCoinsEarned || 0) + income
    
    // Check Achievements
    const unlocks = AchievementSystem.checkAll(player, pet)

    return { income, unlocks }
  }
  
  return null
}

// 购买物品 (Unchanged)
export function buyItem(player: Player, itemId: string, quantity: number = 1): boolean {
  const item = dataLoader.getItem(itemId)
  if (!item) return false
  
  const totalCost = item.price * quantity
  if (player.coins < totalCost) {
    return false
  }
  
  player.coins -= totalCost
  player.inventory[itemId] = (player.inventory[itemId] || 0) + quantity
  
  return true
}

// 使用物品
export function useItem(pet: Pet, player: Player, itemId: string, isAuto: boolean = false): { success: boolean, reason?: string } {
  const item = dataLoader.getItem(itemId)
  if (!item) return { success: false, reason: 'messages.item_not_found' }
  
  const efficiency = isAuto ? 0.5 : 1.0
  const action = createItemAction(item, 1, efficiency)
  
  // Special case: ItemSystem handles immediate effects in onStart if duration is 0
  // If duration > 0, it sets state.
  const result = ActionSystem.start(action, { pet, player })

  if (result.success) {
    if (!isAuto) {
      pet.lastInteractionTime = Date.now()
    }
    pet.isAutoAction = isAuto
    
    if (!player.stats) player.stats = { workCount: 0, studyCount: 0, adventureCount: 0, totalCoinsEarned: 0, itemsUsed: 0 }
    player.stats.itemsUsed = (player.stats.itemsUsed || 0) + 1
    AchievementSystem.checkAll(player, pet)
  }

  return result
}

// 检查学习项目是否可用
export function isStudyAvailable(pet: Pet, study: Study): boolean {
  const action = createStudyAction(study)
  // Only check first condition (requirements), ignore costs for availability visibility
  // Actually original isStudyAvailable checked requirements but not costs.
  // My createStudyAction checks costs in condition #2 and #3.
  // So I should only check condition #1.
  const check = action.conditions[0]({ pet, player: {} as any })
  return check.success
}

// 开始学习
export function startStudy(pet: Pet, player: Player, studyId: string): { success: boolean, reason?: string } {
  const study = dataLoader.getStudy(studyId)
  if (!study) return { success: false, reason: 'messages.study_not_found' }
  
  const action = createStudyAction(study)
  const result = ActionSystem.start(action, { pet, player })
  
  if (result.success) {
      pet.lastInteractionTime = Date.now() // Always manual for now
      
      if (!player.stats) player.stats = { workCount: 0, studyCount: 0, adventureCount: 0, totalCoinsEarned: 0, itemsUsed: 0 }
      player.stats.studyCount = (player.stats.studyCount || 0) + 1
      AchievementSystem.checkAll(player, pet)
  }

  return result
}

// 完成学习
export function completeStudy(pet: Pet, player?: Player): boolean {
  if (!pet.currentStudy) return false
  
  const study = dataLoader.getStudy(pet.currentStudy)
  if (!study) {
    ActionSystem.resetState(pet, 'study')
    return false
  }
  
  const action = createStudyAction(study)
  const success = ActionSystem.complete(action, { pet, player: player || ({} as any) })

  if (success && player) {
      // If we want to track completions instead of starts:
      // if (!player.stats) player.stats = { workCount: 0, studyCount: 0, adventureCount: 0, totalCoinsEarned: 0, itemsUsed: 0 }
      // player.stats.studyCount = (player.stats.studyCount || 0) + 1
      // AchievementSystem.checkAll(player, pet)
      
      // But we already track at start. Let's just check achievements again just in case (e.g. "Finish X studies")?
      // Or maybe some achievements are "Finish study with A grade"? (not implemented)
      // For now, let's just leave it. If start counts, it's fine.
      // But user might expect "Finish".
      // Let's assume start is enough for now to keep it simple, or add "completedStudyCount" later.
      // Wait, I updated `startStudy` to increment `studyCount`. So it counts starts.
      // If I want to verify completion, I should move it here.
      // But `gameTick` calls `completeStudy`.
      // Let's stick to "Start counts" for now as I already implemented it.
  }

  return success
}

// 获取所有可用工作
export function getAvailableJobs(pet: Pet): Job[] {
  return dataLoader.getJobs().filter(job => canWork(pet, job))
}

// 获取商品列表
export function getItems(): Item[] {
  return dataLoader.getItems()
}

// 获取学习列表
export function getStudies(pet?: Pet): Study[] {
  const studies = dataLoader.getStudies()
  if (pet) {
    return studies.filter(study => isStudyAvailable(pet, study))
  }
  return studies
}

