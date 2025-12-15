import zhCN from '../locales/zh-CN'
import enUS from '../locales/en-US'

export type Language = 'zh-CN' | 'en-US'

// Flatten keys helper (optional, but good for nested keys)
// For now, I'll stick to simple object traversal

class I18n {
  private locale: Language = 'zh-CN'
  private data: Record<Language, any> = {
    'zh-CN': zhCN,
    'en-US': enUS
  }

  setLocale(lang: Language) {
    if (this.data[lang]) {
      this.locale = lang
      // Trigger update? In a simple app, we might reload or manually update UI.
    }
  }

  getLocale(): Language {
    return this.locale
  }

  // Get raw data for the current locale (useful for arrays etc)
  getData(): any {
    return this.data[this.locale]
  }

  // Merge external data into specific locale
  mergeLocaleData(lang: Language, newData: any) {
    if (!this.data[lang]) {
      this.data[lang] = newData
    } else {
      this.deepMerge(this.data[lang], newData)
    }
  }

  private deepMerge(target: any, source: any) {
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        Object.assign(source[key], this.deepMerge(target[key], source[key]))
      }
    }
    Object.assign(target || {}, source)
    return target
  }

  t(key: string, params?: Record<string, string | number>): any {
    const keys = key.split('.')
    let value: any = this.data[this.locale]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Missing translation for key: ${key} in ${this.locale}`)
        return key // Fallback
      }
    }

    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] || `{${k}}`))
    }
    
    return value
  }
}

export const i18n = new I18n()
