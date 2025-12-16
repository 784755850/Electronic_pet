import { contextBridge, ipcRenderer } from 'electron'

// 暴露安全的API给渲染进程
const electronAPI = {
  // 获取宠物数据
  getPet: () => ipcRenderer.invoke('get-pet'),
  
  // 获取玩家数据
  getPlayer: () => ipcRenderer.invoke('get-player'),
  
  // 监听宠物状态更新
  onPetUpdate: (callback: any) => {
    ipcRenderer.on('pet-update', (_event, pet) => callback(pet))
  },
  
  // 监听显示对话气泡
  onShowBubble: (callback: any) => {
    ipcRenderer.on('show-bubble', (_event, text) => callback(text))
  },
  
  // 发送宠物动作
  petAction: (action: string) => {
    ipcRenderer.send('pet-action', action)
  },
  
  // 移动窗口
  moveWindow: (deltaX: any, deltaY: any) => {
    ipcRenderer.send('move-window', { deltaX, deltaY })
  },
  
  // 拖动开始
  startDrag: () => {
    ipcRenderer.send('start-drag')
  },
  
  // 拖动结束
  endDrag: () => {
    ipcRenderer.send('end-drag')
  },
  
  // 获取颜色设置
  getColorSettings: () => ipcRenderer.invoke('get-color-settings'),
  
  // 设置颜色主题
  setColorTheme: (theme: any) => {
    ipcRenderer.send('set-color-theme', theme)
  },
  
  // 监听颜色更新
  onColorUpdate: (callback: any) => {
    ipcRenderer.on('color-update', (_event, colors) => callback(colors))
  },
  
  // 保存颜色设置
  saveColors: (colors: any) => {
    ipcRenderer.send('save-colors', colors)
  },
  
  // 保存免打扰时段
  saveQuietHours: (cfg: any) => {
    ipcRenderer.send('save-quiet-hours', cfg)
  },
  
  // 获取通用设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  
  // 保存通用设置
  saveSettings: (settings: any) => {
    ipcRenderer.send('save-settings', settings)
  },
  
  // 关闭设置窗口
  closeSettings: () => {
    ipcRenderer.send('close-settings')
  },
  
  // 打开设置窗口
  openSettings: () => {
    ipcRenderer.send('open-settings')
  },
  
  // 打开宠物状况面板
  openStatus: () => {
    ipcRenderer.send('open-status')
  },
  closeStatus: () => {
    ipcRenderer.send('close-status')
  },
  
  // Status Window Updates
  onStatusUpdate: (callback: any) => {
    ipcRenderer.on('status-update', (_event, data) => callback(data))
  },
  refreshStatus: () => {
    ipcRenderer.send('refresh-status')
  },
  
  // 右键弹出托盘菜单
  popTray: () => {
    ipcRenderer.send('pop-tray')
  },

  // 更新应用图标
  updateAppIcon: (dataUrl: string) => {
    ipcRenderer.send('update-icon', dataUrl)
  },
  
  renamePet: (name: any) => {
    ipcRenderer.send('rename-pet', name)
  },
  
  updatePetAppearance: (seed: number) => {
    ipcRenderer.send('update-pet-appearance', seed)
  },
  
  setWidgetBg: (color: any) => {
    ipcRenderer.send('set-widget-bg', color)
  },

  resizeWindow: (width: number, height: number) => {
    ipcRenderer.send('resize-interaction', { width, height })
  },
  
  onWidgetBgUpdate: (callback: any) => {
    ipcRenderer.on('widget-bg', (_event, color) => callback(color))
  },
  
  feedPet: () => {
    ipcRenderer.send('feed')
  },
  
  cleanPet: () => {
    ipcRenderer.send('clean')
  },
  
  playWithPet: () => {
    ipcRenderer.send('play')
  },
  
  getJobs: () => ipcRenderer.invoke('get-jobs'),
  openWorkMenu: () => ipcRenderer.send('open-work-menu'),
  startWork: (jobId: string) => {
    ipcRenderer.send('start-work', { jobId })
  },
  endWork: () => {
    ipcRenderer.send('end-work')
  },
  
  getStudies: () => ipcRenderer.invoke('get-studies'),
  openStudyMenu: () => ipcRenderer.send('open-study-menu'),
  startStudy: (studyId: string) => {
    ipcRenderer.send('start-study', studyId)
  },
  
  getItems: () => ipcRenderer.invoke('get-items'),
  openShopMenu: () => ipcRenderer.send('open-shop-menu'),
  openInventoryMenu: () => ipcRenderer.send('open-inventory-menu'),
  buyItem: (itemId: string, qty: number = 1) => {
    ipcRenderer.send('buy-item', { itemId, qty })
  },
  useItem: (itemId: string) => {
    ipcRenderer.send('use-item', itemId)
  },

  getAdventureLocations: () => ipcRenderer.invoke('get-adventure-locations'),
  startAdventure: (locationId: string) => ipcRenderer.invoke('start-adventure', locationId),
  openAdventure: () => ipcRenderer.send('open-adventure'),

  // LLM
  openChat: () => ipcRenderer.send('open-chat'),
  llmChat: (messages: any[]) => ipcRenderer.invoke('llm-chat', messages),
  getLLMConfig: () => ipcRenderer.invoke('get-llm-config'),
  saveLLMConfig: (config: any) => ipcRenderer.send('save-llm-config', config),
  testLLMConfig: (config: any) => ipcRenderer.invoke('test-llm-config', config),

  // I18n
  getI18n: async () => {
    const res = await ipcRenderer.invoke('get-i18n')
    return res.t
  },
  getI18nData: async () => {
    const res = await ipcRenderer.invoke('get-i18n')
    return res.t
  },
  setLanguage: (lang: string) => ipcRenderer.send('set-language', lang),
  onLanguageChange: (callback: any) => ipcRenderer.on('language-changed', (_event, data) => callback(data.t)),

  // Interaction Window
  onShowInteraction: (callback: any) => ipcRenderer.on('show-interaction', (_event, data) => callback(data)),
  interact: (type: string, id: string, mode: string) => ipcRenderer.send('interact', { type, id, mode }),
  onInteractionResult: (callback: any) => ipcRenderer.on('interaction-result', (_event, result) => callback(result)),
  refreshInteraction: (type: string) => ipcRenderer.send('refresh-interaction', type),

  // Debug
  openDebug: () => ipcRenderer.send('open-debug'),
  debugAction: (action: string, param?: any) => ipcRenderer.send('debug-action', { action, param }),

  quitGame: () => ipcRenderer.send('quit-app'),
  
  // New features
  minimizeToTray: () => ipcRenderer.send('minimize-to-tray'),
  toggleAlwaysOnTop: (flag: boolean) => ipcRenderer.send('toggle-always-on-top', flag),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  
  resetGame: () => ipcRenderer.send('reset-game'),
};
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
export {}
