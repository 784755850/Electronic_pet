import { Player, Achievement, PlayerStats } from '../types/index'
import { dataLoader } from './data-loader'
import { addExp } from './growth'

export class AchievementSystem {
  static checkAll(player: Player, pet: any) {
    const achievements = dataLoader.getAchievements()
    const newUnlocks: Achievement[] = []

    for (const ach of achievements) {
      if (player.achievements && player.achievements.includes(ach.id)) continue

      if (this.checkCondition(ach, player.stats)) {
        this.unlock(player, ach, pet)
        newUnlocks.push(ach)
      }
    }

    return newUnlocks
  }

  static checkCondition(ach: Achievement, stats: PlayerStats): boolean {
    if (!stats) return false
    const { type, target } = ach.condition
    
    switch (type) {
      case 'work_count':
        return (stats.workCount || 0) >= target
      case 'study_count':
        return (stats.studyCount || 0) >= target
      case 'adventure_count':
        return (stats.adventureCount || 0) >= target
      case 'earn_money':
        return (stats.totalCoinsEarned || 0) >= target
      case 'items_used':
        return (stats.itemsUsed || 0) >= target
      default:
        return false
    }
  }

  static unlock(player: Player, ach: Achievement, pet: any) {
    if (!player.achievements) player.achievements = []
    player.achievements.push(ach.id)
    
    // Apply rewards
    if (ach.reward) {
      if (ach.reward.coins) {
        player.coins += ach.reward.coins
      }
      if (ach.reward.exp) {
        if (pet) {
            addExp(pet, ach.reward.exp)
        }
      }
      if (ach.reward.items) {
        for (const item of ach.reward.items) {
          player.inventory[item.id] = (player.inventory[item.id] || 0) + item.count
        }
      }
    }
  }
}
