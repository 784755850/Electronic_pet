import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { PetStage, Achievement } from '../types/index'

// 默认数据，用于兜底
import defaultItems from '../data/json/items.json'
import defaultJobs from '../data/json/jobs.json'
import defaultStudies from '../data/json/studies.json'
import defaultAdventures from '../data/json/adventures.json'
import defaultAchievements from '../data/achievements/basic.json'

// 数据类型定义
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

export interface LocalizedText {
  name?: string
  description?: string
}

export interface Item {
  id: string
  name: string
  type: 'food' | 'clean' | 'toy' | 'medicine' | 'special'
  price: number
  duration?: number
  effects: ItemEffect
  durability?: number
  description?: string
  locales?: Record<string, LocalizedText>
}

export interface JobRequirement {
  level?: number
  strength?: number
  dexterity?: number
  endurance?: number
  intelligence?: number
  luck?: number
  charm?: number
  stages?: PetStage[]
}

export interface Job {
  id: string
  name: string
  income: number
  requirement: JobRequirement
  duration: number
  description?: string
  locales?: Record<string, LocalizedText>
}

export interface StudyEffect {
  strength?: number
  dexterity?: number
  endurance?: number
  intelligence?: number
  luck?: number
  charm?: number
  exp?: number
}

export interface StudyRequirements {
  stages?: PetStage[] // egg, baby, adult
  level?: number
}

export interface StudyCostStats {
  hunger?: number // 增加饥饿
  clean?: number  // 减少清洁
  mood?: number   // 减少心情
  health?: number // 减少健康
}

export interface Study {
  id: string
  name: string
  cost: number
  duration: number
  preReqStudyId?: string
  effect: StudyEffect
  requirements?: StudyRequirements
  cost_stats?: StudyCostStats
  description?: string
  locales?: Record<string, LocalizedText>
}

export interface AdventureRequirements {
  level?: number
  strength?: number
  dexterity?: number
  endurance?: number
  intelligence?: number
  luck?: number
  charm?: number
}

export interface AdventureLocation {
  id: string
  name: string
  description: string
  cost: number // Hunger cost
  duration?: number // Adventure duration in seconds
  riskLevel: 'low' | 'medium' | 'high'
  requirements?: AdventureRequirements
  locales?: Record<string, LocalizedText>
}

class DataLoader {
  private items: Item[] = []
  private jobs: Job[] = []
  private studies: Study[] = []
  private adventures: AdventureLocation[] = []
  private achievements: Achievement[] = []
  private loaded = false

  constructor() {
    this.loadData()
  }

  private normalizeData<T>(data: any): T[] {
    if (Array.isArray(data)) {
      return [...data] as T[]
    } else if (typeof data === 'object' && data !== null) {
      return Object.values(data).flat() as T[]
    }
    return []
  }

  private mergeData<T extends { id: string }>(current: T[], incoming: T[]): T[] {
    const map = new Map(current.map(i => [i.id, i]))
    for (const item of incoming) {
      map.set(item.id, item) // Incoming overwrites existing with same ID
    }
    return Array.from(map.values())
  }

  public loadData() {
    try {
      // 1. 加载默认数据 (Bundled)
      this.items = this.normalizeData<Item>(defaultItems)
      this.jobs = this.normalizeData<Job>(defaultJobs)
      this.studies = this.normalizeData<Study>(defaultStudies)
      this.adventures = this.normalizeData<AdventureLocation>(defaultAdventures)
      this.achievements = this.normalizeData<Achievement>(defaultAchievements)

      // 定义加载路径优先级 (后加载的覆盖前面的)
      const dataPaths: string[] = []

      // 路径A: 安装目录/data (用于随安装包分发的数据)
      // 注意：开发环境下 exe 路径可能是 node_modules/electron/dist，这里可能找不到 data，属于预期行为
      const exeDir = path.dirname(app.getPath('exe'))
      dataPaths.push(path.join(exeDir, 'data'))

      // 路径B: 开发环境根目录/data (仅开发环境有效)
      if (!app.isPackaged) {
         dataPaths.push(path.join(process.cwd(), 'data'))
      }

      // 路径C: 用户数据目录/game-data (用于用户存档、MOD、覆盖配置)
      // Windows: %APPDATA%/AppName/game-data
      const userDataDir = path.join(app.getPath('userData'), 'game-data')
      // 确保用户数据目录存在
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true })
      }
      dataPaths.push(userDataDir)

      // 去重路径 (防止开发环境路径重复)
      const uniquePaths = [...new Set(dataPaths)]

      // 2. 依次加载外部数据
      for (const basePath of uniquePaths) {
         if (!fs.existsSync(basePath)) continue
         
         this.loadCategory<Item>(basePath, 'items', (data) => this.items = this.mergeData(this.items, data))
         this.loadCategory<Job>(basePath, 'jobs', (data) => this.jobs = this.mergeData(this.jobs, data))
         this.loadCategory<Study>(basePath, 'studies', (data) => this.studies = this.mergeData(this.studies, data))
         this.loadCategory<AdventureLocation>(basePath, 'adventures', (data) => this.adventures = this.mergeData(this.adventures, data))
         this.loadCategory<Achievement>(basePath, 'achievements', (data) => this.achievements = this.mergeData(this.achievements, data))
      }

      console.log(`Data loaded from ${uniquePaths.length} paths. Final counts - Items: ${this.items.length}, Jobs: ${this.jobs.length}, Studies: ${this.studies.length}, Adventures: ${this.adventures.length}, Achievements: ${this.achievements.length}`)
      this.loaded = true
    } catch (e) {
      console.error('Failed to load data:', e)
    }
  }

  // Helper to load file OR folder for a category
  private loadCategory<T extends { id: string }>(basePath: string, categoryName: string, setter: (data: T[]) => void) {
      // 1. Try file: basePath/items.json
      const filePath = path.join(basePath, `${categoryName}.json`)
      this.loadExternalFile<T>(filePath, (data) => setter(data))

      // 2. Try folder: basePath/items/*.json
      const dirPath = path.join(basePath, categoryName)
      this.loadExternalDirectory<T>(dirPath, (data) => setter(data))
  }

  private loadExternalDirectory<T>(dirPath: string, callback: (data: T[]) => void) {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      try {
        const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'))
        let allData: T[] = []
        for (const file of files) {
             const content = fs.readFileSync(path.join(dirPath, file), 'utf-8')
             const rawData = JSON.parse(content)
             const data = this.normalizeData<T>(rawData)
             allData = [...allData, ...data]
        }
        if (allData.length > 0) {
            callback(allData)
            console.log(`Loaded ${allData.length} entries from directory ${dirPath}`)
        }
      } catch (e) {
        console.error(`Error reading directory ${dirPath}:`, e)
      }
    }
  }

  private loadExternalFile<T>(filePath: string, callback: (data: T[]) => void) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const rawData = JSON.parse(content)
        const data = this.normalizeData<T>(rawData)
        if (data.length > 0) {
          callback(data)
          console.log(`Loaded external data from ${filePath}`)
        }
      } catch (e) {
        console.error(`Error reading ${filePath}:`, e)
      }
    }
  }

  public getItems(): Item[] {
    return this.items
  }

  public getItem(id: string): Item | undefined {
    return this.items.find(i => i.id === id)
  }

  public getJobs(): Job[] {
    return this.jobs
  }

  public getJob(id: string): Job | undefined {
    return this.jobs.find(j => j.id === id)
  }

  public getStudies(): Study[] {
    return this.studies
  }

  public getStudy(id: string): Study | undefined {
    return this.studies.find(s => s.id === id)
  }

  public getAdventureLocations(): AdventureLocation[] {
    return this.adventures
  }
  
  public getAdventureLocation(id: string): AdventureLocation | undefined {
    return this.adventures.find(a => a.id === id)
  }

  public getAchievements(): Achievement[] {
    return this.achievements
  }

  public injectToI18n(i18nInstance: any) {
    const categories = [
      { data: this.items, key: 'items' },
      { data: this.jobs, key: 'jobs' },
      { data: this.studies, key: 'studies' },
      { data: this.achievements, key: 'achievements' }
    ]

    const localesToUpdate: Record<string, any> = {
      'zh-CN': {},
      'en-US': {}
    }

    // Helper to ensure path exists
    const ensurePath = (obj: any, path: string[]) => {
      let current = obj
      for (const part of path) {
        if (!current[part]) current[part] = {}
        current = current[part]
      }
      return current
    }

    // 1. Process Items, Jobs, Studies, Achievements (Nested Object with name/description)
    for (const cat of categories) {
      for (const item of cat.data) {
        // Default (zh-CN)
        const zhRoot = ensurePath(localesToUpdate['zh-CN'], [cat.key])
        zhRoot[item.id] = { name: item.name }
        if ('description' in item && item.description) {
           zhRoot[item.id].description = item.description
        }

        // Locales
        if (item.locales) {
          for (const [lang, texts] of Object.entries(item.locales)) {
             if (!localesToUpdate[lang]) localesToUpdate[lang] = {}
             const root = ensurePath(localesToUpdate[lang], [cat.key])
             
             // Merge with existing or create new
             if (!root[item.id]) root[item.id] = {}

             if (texts.name) {
               root[item.id].name = texts.name
             }
             if (texts.description) {
               root[item.id].description = texts.description
             }
          }
        }
      }
    }

    // 2. Process Adventures (Nested Object with name/desc)
    for (const adv of this.adventures) {
       // Default (zh-CN)
       const zhRoot = ensurePath(localesToUpdate['zh-CN'], ['adventure', 'locations'])
       zhRoot[adv.id] = { name: adv.name, desc: adv.description }

       if (adv.locales) {
         for (const [lang, texts] of Object.entries(adv.locales)) {
            if (!localesToUpdate[lang]) localesToUpdate[lang] = {}
            const root = ensurePath(localesToUpdate[lang], ['adventure', 'locations'])
            
            // Merge with existing or create new
            if (!root[adv.id]) root[adv.id] = {}
            
            if (texts.name) root[adv.id].name = texts.name
            if (texts.description) root[adv.id].desc = texts.description
         }
       }
    }

    // Apply updates
    for (const [lang, data] of Object.entries(localesToUpdate)) {
      if (Object.keys(data).length > 0) {
        i18nInstance.mergeLocaleData(lang, data)
      }
    }
  }
}

export const dataLoader = new DataLoader()
