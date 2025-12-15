export type SkillType = 'active'|'passive'|'trigger'

export type SkillEffect = {
  target: 'attr'|'motion'|'visual'
  key: string
  op: 'add'|'mul'|'set'
  value: number
  durationMs?: number
}

export type Skill = {
  id: string
  name: string
  type: SkillType
  level: number
  unlockStage?: 'egg'|'baby'|'child'|'teen'|'adult'
  costEnergy?: number
  cooldownMs?: number
  effects: SkillEffect[]
  enabled: boolean
  requiresMischief?: boolean
}

export class SkillManager {
  skills: Map<string, Skill>
  cooldowns: Map<string, number>
  actives: Map<string, number>
  constructor(defs: Skill[]) {
    this.skills = new Map(defs.map(s => [s.id, s]))
    this.cooldowns = new Map()
    this.actives = new Map()
  }
  canUse(id: string, mode: 'quiet'|'roam'|'mischief') {
    const s = this.skills.get(id)
    if (!s || !s.enabled) return false
    if (s.requiresMischief && mode !== 'mischief') return false
    const now = Date.now()
    const cd = this.cooldowns.get(id) || 0
    return now >= cd
  }
  use(id: string) {
    const s = this.skills.get(id)
    if (!s) return []
    const now = Date.now()
    const dur = Math.max(...s.effects.map(e => e.durationMs || 0))
    if (s.cooldownMs) this.cooldowns.set(id, now + s.cooldownMs)
    if (dur > 0) this.actives.set(id, now + dur)
    return s.effects
  }
  isActive(id: string) {
    const until = this.actives.get(id) || 0
    return Date.now() < until
  }
}
