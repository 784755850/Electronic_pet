import type { Pet } from '../types/index.js'
import { i18n } from './i18n'

type DialogType = 'hunger_high' | 'clean_low' | 'mood_low' | 'sick' | 'generic'

type DialogRule = {
  type: DialogType
  cooldownMs: number
  weight: number
  condition: (pet: Pet) => boolean
  textKey: string
}

const lastShown: Record<DialogType, number> = {
  hunger_high: 0,
  clean_low: 0,
  mood_low: 0,
  sick: 0,
  generic: 0
}

const rules: DialogRule[] = [
  {
    type: 'hunger_high',
    cooldownMs: 60000,
    weight: 20,
    condition: (p) => p.hunger >= 80,
    textKey: 'dialog.hunger_high'
  },
  {
    type: 'clean_low',
    cooldownMs: 60000,
    weight: 20,
    condition: (p) => p.clean <= 20,
    textKey: 'dialog.clean_low'
  },
  {
    type: 'mood_low',
    cooldownMs: 60000,
    weight: 20,
    condition: (p) => p.mood < 40,
    textKey: 'dialog.mood_low'
  },
  {
    type: 'sick',
    cooldownMs: 60000,
    weight: 30,
    condition: (p) => p.sick,
    textKey: 'dialog.sick'
  },
  {
    type: 'generic',
    cooldownMs: 180000,
    weight: 1,
    condition: (_p) => true,
    textKey: 'dialog.generic'
  }
]

function pickWeighted<T>(items: { item: T; weight: number }[]): T | null {
  if (!items.length) return null
  const total = items.reduce((s, i) => s + i.weight, 0)
  const r = Math.random() * total
  let acc = 0
  for (const i of items) {
    acc += i.weight
    if (r <= acc) return i.item
  }
  return items[items.length - 1].item
}

export function getDialog(pet: Pet, now: number): string | null {
  const candidates: { item: DialogRule; weight: number }[] = []
  for (const rule of rules) {
    if (!rule.condition(pet)) continue
    const last = lastShown[rule.type] || 0
    if (now - last < rule.cooldownMs) continue
    candidates.push({ item: rule, weight: rule.weight })
  }
  const picked = pickWeighted(candidates)
  if (!picked) return null
  lastShown[picked.type] = now
  
  const texts = i18n.t(picked.textKey)
  if (!Array.isArray(texts)) return null

  const idx = Math.floor(Math.random() * texts.length)
  return texts[idx] || null
}
