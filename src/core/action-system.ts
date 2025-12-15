import { Pet, Player, PetAction } from '../types/index.js'

export interface ActionContext {
  pet: Pet
  player: Player
}

export interface CheckResult {
  success: boolean
  reason?: string
}

export type Condition = (ctx: ActionContext) => CheckResult
export type Effect = (ctx: ActionContext) => void

export interface ActionDefinition {
  id: string
  type: PetAction
  name: string
  description?: string
  
  // Duration in milliseconds
  duration: number 
  
  // Prerequisites to start
  conditions: Condition[]
  
  // Costs applied immediately upon starting (e.g. paying money, stats reduction)
  onStart?: Effect[]
  
  // Effects applied upon successful completion (e.g. rewards, stats gain)
  onComplete?: Effect[]
  
  // Optional: Effects applied periodically (not fully implemented in current tick system but good for design)
  onTick?: Effect[]
}

/**
 * Unified system for managing pet actions (Work, Study, etc.)
 */
export class ActionSystem {
  
  /**
   * Check if an action can be started
   */
  static canStart(action: ActionDefinition, ctx: ActionContext): CheckResult {
    // 1. Basic State Check
    // Allow idle, walk, sit to be interrupted
    const availableStates = ['idle', 'walk', 'sit']
    if (!availableStates.includes(ctx.pet.currentAction)) {
      return { success: false, reason: 'messages.pet_busy_now' }
    }
    
    if (ctx.pet.sick || ctx.pet.health < 20) {
      // Allow taking medicine (assuming it's an 'eating' action or specific type, but general actions are blocked)
      // We might need a flag in ActionDefinition like 'allowedWhileSick'
      if (action.type === 'work' || action.type === 'study') {
        return { success: false, reason: 'messages.pet_too_sick' }
      }
    }

    // 2. Custom Conditions
    for (const condition of action.conditions) {
      const result = condition(ctx)
      if (!result.success) return result
    }

    return { success: true }
  }

  /**
   * Start an action
   */
  static start(action: ActionDefinition, ctx: ActionContext): CheckResult {
    const check = this.canStart(action, ctx)
    if (!check.success) {
      console.log(`Cannot start action ${action.id}: ${check.reason}`)
      return check
    }

    // Apply start effects (costs)
    if (action.onStart) {
      action.onStart.forEach(effect => effect(ctx))
    }

    // Update Pet State
    const now = Date.now()
    ctx.pet.currentAction = action.type
    
    // Handle specific fields for backward compatibility
    // In the future, we should migrate to a unified 'activeAction' object in Pet
    if (action.type === 'work') {
      ctx.pet.workingStartedAt = now
      ctx.pet.workingUntil = now + action.duration
      ctx.pet.currentJob = action.id
    } else if (action.type === 'study') {
      ctx.pet.studyingStartedAt = now
      ctx.pet.studyingUntil = now + action.duration
      ctx.pet.currentStudy = action.id
    } else {
      // Generic handling for items/others
      ctx.pet.actionEndsAt = now + action.duration
      ctx.pet.actionTotalDuration = action.duration
      // For items, we often don't store the ID in the pet state in the current architecture
      // but we store 'pendingEffects' sometimes.
    }

    return { success: true }
  }

  /**
   * Complete an action
   * Returns generic result or specific data depending on need. 
   * Currently returns void, modifying context in place.
   */
  static complete(action: ActionDefinition, ctx: ActionContext, force: boolean = false): boolean {
    const now = Date.now()
    
    // 1. Validate End Time
    let endTime = 0
    if (action.type === 'work') endTime = ctx.pet.workingUntil || 0
    else if (action.type === 'study') endTime = ctx.pet.studyingUntil || 0
    else endTime = ctx.pet.actionEndsAt || 0

    if (endTime === 0) return false // Not running this action type?

    if (now < endTime && !force) {
      return false // Not finished yet
    }

    // 2. Apply Completion Effects (Rewards)
    if (action.onComplete) {
      action.onComplete.forEach(effect => effect(ctx))
    }

    // 3. Cleanup State
    this.resetState(ctx.pet, action.type)
    
    return true
  }

  /**
   * Force cancel/reset state
   */
  static resetState(pet: Pet, type: PetAction) {
    pet.currentAction = 'idle'
    if (type === 'work') {
      pet.workingUntil = undefined
      pet.workingStartedAt = undefined
      pet.currentJob = undefined
    } else if (type === 'study') {
      pet.studyingUntil = undefined
      pet.studyingStartedAt = undefined
      pet.currentStudy = undefined
    } else {
      pet.actionEndsAt = undefined
      pet.actionTotalDuration = undefined
      pet.pendingEffects = undefined
    }
  }
}
