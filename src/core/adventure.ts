import type { Pet, Player } from '../types/index'
import { getItems } from './economy'
import { dataLoader, AdventureLocation } from './data-loader'

export { AdventureLocation }

export interface AdventureResult {
  success: boolean
  message: string
  rewards?: {
    exp?: number
    coins?: number
    items?: { id: string, count: number }[]
    stats?: Partial<Pick<Pet, 'strength' | 'dexterity' | 'endurance' | 'intelligence' | 'luck' | 'charm'>>
    mood?: number
  }
  cost?: {
    hunger?: number
    health?: number
    mood?: number
    clean?: number
  }
}

export function getAdventureLocations(pet: Pet): AdventureLocation[] {
  return dataLoader.getAdventureLocations().filter(loc => {
    // Check basic level requirement (legacy support or explicit check)
    if (loc.requirements?.level && pet.level < loc.requirements.level) return false
    
    // Check other stats if needed for visibility? 
    // Usually locations are visible if level is met, but maybe locked if stats are not met.
    // For now, let's say they are visible if level is met.
    return true
  })
}

export function startAdventure(pet: Pet, player: Player, locationId: string): AdventureResult {
  const location = dataLoader.getAdventureLocation(locationId)
  if (!location) {
    return { success: false, message: 'adventure_results.unknown_location' }
  }

  // Check Requirements
  if (location.requirements) {
    const req = location.requirements
    if (req.level && pet.level < req.level) return { success: false, message: 'adventure_results.level_low' }
    if (req.strength && pet.strength < req.strength) return { success: false, message: 'adventure_results.str_low' }
    if (req.dexterity && pet.dexterity < req.dexterity) return { success: false, message: 'adventure_results.dex_low' }
    if (req.endurance && pet.endurance < req.endurance) return { success: false, message: 'adventure_results.end_low' }
    if (req.intelligence && pet.intelligence < req.intelligence) return { success: false, message: 'adventure_results.int_low' }
    if (req.luck && pet.luck < req.luck) return { success: false, message: 'adventure_results.luk_low' }
    if (req.charm && pet.charm < req.charm) return { success: false, message: 'adventure_results.cha_low' }
  }

  if (pet.hunger + location.cost > 100) {
    return { success: false, message: 'adventure_results.too_hungry' }
  }
  
  if (pet.health < 20) {
    return { success: false, message: 'adventure_results.sick' }
  }

  // Base cost
  const result: AdventureResult = {
    success: true,
    message: '',
    rewards: {
      items: [],
      stats: {}
    },
    cost: {
      hunger: location.cost
    }
  }

  // Determine outcome based on risk and luck
  const roll = Math.random() * 100 + (pet.luck * 0.5)
  
  // Logic based on location
  switch (location.id) {
    case 'park':
      handleParkAdventure(roll, result)
      break
    case 'forest':
      handleForestAdventure(roll, result)
      break
    case 'city':
      handleCityAdventure(roll, result)
      break
    case 'ruins':
      handleRuinsAdventure(roll, result)
      break
    case 'space_station':
      handleSpaceStationAdventure(roll, result)
      break
  }

  return result
}

function handleParkAdventure(roll: number, result: AdventureResult) {
  if (roll < 20) {
    result.message = 'adventure_results.park_stroll'
    result.rewards!.mood = 10
  } else if (roll < 60) {
    result.message = 'adventure_results.park_flower'
    result.rewards!.coins = Math.floor(Math.random() * 20) + 10
    result.rewards!.exp = 10
  } else if (roll < 90) {
    result.message = 'adventure_results.park_friend'
    result.rewards!.exp = 20
    result.rewards!.stats!.charm = 1
  } else {
    result.message = 'adventure_results.park_toy'
    result.rewards!.items!.push({ id: 'ball', count: 1 })
    result.rewards!.exp = 30
  }
}

function handleForestAdventure(roll: number, result: AdventureResult) {
  if (roll < 30) {
    result.message = 'adventure_results.forest_lost'
    result.cost!.mood = -15
    result.cost!.health = -5
    result.rewards!.exp = 15
  } else if (roll < 60) {
    result.message = 'adventure_results.forest_berry'
    result.rewards!.items!.push({ id: 'bread', count: 1 }) // Placeholder for fruit
    result.rewards!.exp = 40
  } else if (roll < 85) {
    result.message = 'adventure_results.forest_herb'
    result.rewards!.items!.push({ id: 'mystic_herb', count: 1 })
    result.rewards!.exp = 60
  } else {
    result.message = 'adventure_results.forest_elf'
    result.rewards!.coins = 200
    result.rewards!.items!.push({ id: 'feast', count: 1 })
    result.rewards!.stats!.charm = 2
    result.rewards!.exp = 120
  }
}

function handleCityAdventure(roll: number, result: AdventureResult) {
  if (roll < 40) {
    result.message = 'adventure_results.city_splash'
    result.cost!.clean = -40
    result.cost!.mood = -25
  } else if (roll < 70) {
    result.message = 'adventure_results.city_work'
    result.rewards!.coins = 120
    result.rewards!.exp = 60
  } else if (roll < 90) {
    result.message = 'adventure_results.city_arcade'
    result.rewards!.stats!.dexterity = 3
    result.rewards!.stats!.intelligence = 2
    result.rewards!.exp = 100
  } else {
    result.message = 'adventure_results.city_tech'
    result.rewards!.items!.push({ id: 'game_console', count: 1 })
    result.rewards!.exp = 180
  }
}

function handleRuinsAdventure(roll: number, result: AdventureResult) {
  if (roll < 40) {
    result.message = 'adventure_results.ruins_trap'
    result.cost!.health = -20
    result.cost!.clean = -50
    result.cost!.mood = -30
  } else if (roll < 70) {
    result.message = 'adventure_results.ruins_coin'
    result.rewards!.items!.push({ id: 'ancient_coin', count: 1 })
    result.rewards!.exp = 80
  } else if (roll < 90) {
    result.message = 'adventure_results.ruins_text'
    result.rewards!.stats!.intelligence = 5
    result.rewards!.exp = 150
  } else {
    result.message = 'adventure_results.ruins_feather'
    result.rewards!.items!.push({ id: 'golden_feather', count: 1 })
    result.rewards!.stats!.luck = 5
    result.rewards!.exp = 300
  }
}

function handleSpaceStationAdventure(roll: number, result: AdventureResult) {
  if (roll < 50) {
    result.message = 'adventure_results.space_guard'
    result.cost!.mood = -50
    result.rewards!.exp = 20
  } else if (roll < 75) {
    result.message = 'adventure_results.space_training'
    result.rewards!.stats!.strength = 3
    result.rewards!.stats!.endurance = 3
    result.rewards!.exp = 100
  } else if (roll < 95) {
    result.message = 'adventure_results.space_tech'
    result.rewards!.items!.push({ id: 'alien_chip', count: 1 })
    result.rewards!.exp = 200
  } else {
    result.message = 'adventure_results.space_contact'
    result.rewards!.items!.push({ id: 'alien_chip', count: 2 })
    result.rewards!.items!.push({ id: 'nutrition', count: 1 })
    result.rewards!.stats!.charm = 5
    result.rewards!.exp = 500
  }
}
