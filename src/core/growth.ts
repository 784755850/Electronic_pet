import type { Pet } from '../types/index.js'

// 经验值等级对照表 (成长值阈值)
const EXP_TABLE = [
  0,     // 0级 (Egg)
  100,   // 1级 (Baby Start)
  300,   // 2级
  600,   // 3级
  1000,  // 4级
  1500,  // 5级 (Adult Start?) - 假设5级成年
  2100,  // 6级
  2800,  // 7级
  3600,  // 8级
  4500,  // 9级
  5500,  // 10级
]

// 生成完整等级表到99级
for (let i = EXP_TABLE.length; i < 100; i++) {
  EXP_TABLE.push(EXP_TABLE[i - 1] + (i * 100)) // 增加每级所需经验
}

// 添加成长值
export function addExp(pet: Pet, exp: number): boolean {
  // 即使满级也增加成长值，方便后续扩展
  pet.exp += exp
  
  let leveledUp = false
  
  // 检查是否升级
  while (pet.level < 99 && pet.exp >= EXP_TABLE[pet.level + 1]) {
    pet.level++
    leveledUp = true
  }
  
  return leveledUp
}

// 获取当前等级所需经验
export function getExpForLevel(level: number): number {
  return EXP_TABLE[Math.min(level, 99)]
}

// 获取升级进度 0-1
export function getExpProgress(pet: Pet): number {
  if (pet.level >= 99) return 1
  
  const currentLevelExp = EXP_TABLE[pet.level]
  const nextLevelExp = EXP_TABLE[pet.level + 1]
  const progress = (pet.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)
  
  return Math.max(0, Math.min(1, progress))
}

// 获取年龄（天）
export function getAge(pet: Pet): number {
  const ageMs = Date.now() - pet.bornAt
  return Math.floor(ageMs / 1000 / 3600 / 24)
}

// 获取年龄字符串
export function getAgeString(pet: Pet): string {
  const days = getAge(pet)
  if (days === 0) return '刚出生'
  if (days === 1) return '1天'
  return `${days}天`
}
