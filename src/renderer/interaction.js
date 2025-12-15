// Interaction Window Script
// @ts-check

(function() {

/** @type {any} */
let interactionI18n = {}
/** @type {any} */
let currentData = null
let state = {
  category: 'all',
  page: 1,
  perPage: 5
}

// Initialize
;(async () => {
  try {
    const api = /** @type {any} */ (window).electronAPI
    if (api && api.getI18nData) {
      interactionI18n = await api.getI18nData()
      updateTexts()
    }
  } catch (e) {
    console.error('Failed to init data', e)
  }
})()

// Listeners
const api = /** @type {any} */ (window).electronAPI
if (api && api.onLanguageChange) {
  api.onLanguageChange((/** @type {any} */ data) => {
    interactionI18n = data
    updateTexts()
    if (currentData) render(currentData)
  })
}

if (api && api.onShowInteraction) {
  api.onShowInteraction((/** @type {any} */ data) => {
    render(data)
  })
}

if (api && api.onInteractionResult) {
  api.onInteractionResult((/** @type {any} */ result) => {
    if (!result.success) {
      showToast(t(result.message), 'error')
    } else {
      // Success is usually handled by closing window (for work/study) or refreshing (shop/inventory)
      // But if we get a success message here, we can show it too
      if (result.message) showToast(t(result.message), 'success')
    }
  })
}

// UI Events
const closeBtn = document.getElementById('close-btn')
if (closeBtn) closeBtn.onclick = () => window.close()

const prevPageBtn = document.getElementById('prev-page')
if (prevPageBtn) prevPageBtn.onclick = () => changePage(-1)

const nextPageBtn = document.getElementById('next-page')
if (nextPageBtn) nextPageBtn.onclick = () => changePage(1)

// Helper Functions
/**
 * @param {string} key 
 * @param {any} [params] 
 */
function t(key, params) {
  const keys = key.split('.')
  let v = interactionI18n
  for (const k of keys) {
    if (v && v[k]) v = v[k]
    else return key
  }
  if (typeof v === 'string' && params) {
    return v.replace(/\{(\w+)\}/g, (_, k) => String(params[k] || `{${k}}`))
  }
  return v || key
}

function updateTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (key) el.textContent = t(key)
  })
}

/**
 * @param {any} data 
 */
function render(data) {
  currentData = data
  // Reset state on new data
  state.category = 'all'
  state.page = 1
  
  const resultView = document.getElementById('result-view')
  if (resultView) resultView.style.display = 'none'
  
  const listView = document.getElementById('list-view')
  if (listView) listView.style.display = 'flex'

  // Title
  let titleKey = 'interaction.' + data.type
  if (t(titleKey) === titleKey) {
     titleKey = 'interaction.' + (data.title || data.type)
  }
  let titleText = t(titleKey)
  if (titleText === titleKey) titleText = t(data.title || 'Interaction')
  
  const windowTitle = document.getElementById('window-title')
  if (windowTitle) windowTitle.textContent = titleText
  
  // Icon mapping
  /** @type {Record<string, string>} */
  const icons = {
    feed: '🍗', clean: '🧼', play: '🎾', work: '💼', study: '📚', shop: '🛒', inventory: '🎒'
  }
  const windowIcon = document.getElementById('window-icon')
  if (windowIcon) windowIcon.textContent = icons[data.type] || '📦'

  // Stats
  const statsBar = document.getElementById('stats-bar')
  if (statsBar) {
    statsBar.innerHTML = ''
    
    if (data.money !== undefined) {
      addStat(statsBar, '💰', Math.round(data.money))
    }
    if (data.petStats) {
      if (data.type === 'feed') addStat(statsBar, '🍗', Math.round(data.petStats.hunger))
      if (data.type === 'clean') addStat(statsBar, '✨', Math.round(data.petStats.clean))
      if (data.type === 'play') addStat(statsBar, '😊', Math.round(data.petStats.mood))
    }
  }

  // Categories
  const showCategories = ['shop', 'inventory'].includes(data.type)
  const categoryBar = document.getElementById('category-bar')
  if (categoryBar) {
    categoryBar.style.display = showCategories ? 'flex' : 'none'
    if (showCategories) {
      renderCategories()
    }
  }

  updateList()
}

/**
 * @param {HTMLElement} parent 
 * @param {string} icon 
 * @param {string|number} value 
 */
function addStat(parent, icon, value) {
  const el = document.createElement('div')
  el.className = 'stat-item'
  el.innerHTML = `<span class="stat-icon">${icon}</span><span class="stat-value">${value}</span>`
  parent.appendChild(el)
}

function renderCategories() {
  const bar = document.getElementById('category-bar')
  if (!bar) return
  bar.innerHTML = ''
  
  // Available categories
  const cats = ['all', 'food', 'clean', 'toy', 'medicine', 'special']
  
  cats.forEach(cat => {
    const el = document.createElement('div')
    el.className = `category-tab ${state.category === cat ? 'active' : ''}`
    // Map 'toy' to 'play' key if needed, or ensure 'toy' exists in locales
    el.textContent = t(`itemSelector.map.${cat}`)
    el.onclick = () => {
      state.category = cat
      state.page = 1
      renderCategories()
      updateList()
    }
    bar.appendChild(el)
  })
}

function updateList() {
  if (!currentData) return
  
  let items = currentData.items || []
  
  // Filter by category
  if (state.category !== 'all') {
    items = items.filter((/** @type {any} */ i) => i.type === state.category)
  }
  
  // Pagination
  const totalPages = Math.ceil(items.length / state.perPage) || 1
  if (state.page > totalPages) state.page = totalPages
  if (state.page < 1) state.page = 1
  
  const start = (state.page - 1) * state.perPage
  const end = start + state.perPage
  const pageItems = items.slice(start, end)
  
  renderItems(pageItems)
  updatePagination(totalPages)
}

/**
 * @param {number} totalPages 
 */
function updatePagination(totalPages) {
  const bar = document.getElementById('pagination-bar')
  if (bar) bar.style.display = 'flex' // Always show for consistency
  
  const pageInfo = document.getElementById('page-info')
  if (pageInfo) pageInfo.textContent = `${state.page} / ${totalPages}`
  
  const prevBtn = /** @type {HTMLButtonElement} */ (document.getElementById('prev-page'))
  if (prevBtn) prevBtn.disabled = state.page <= 1
  
  const nextBtn = /** @type {HTMLButtonElement} */ (document.getElementById('next-page'))
  if (nextBtn) nextBtn.disabled = state.page >= totalPages
}

/**
 * @param {number} delta 
 */
function changePage(delta) {
  state.page += delta
  updateList()
}

/**
 * @param {any[]} items 
 */
function renderItems(items) {
  const list = document.getElementById('item-list')
  if (!list) return
  list.innerHTML = ''

  if (items.length === 0 && false) { // Never show empty message, always show slots
    // @ts-ignore
    list.innerHTML = `<div class="empty-msg">${t('interaction.empty')}</div>`
    return
  }

  items.forEach(item => {
    const el = document.createElement('div')
    el.className = 'list-item'
    
    // Name & Desc Localization
    let name = item.name
    let desc = item.description
    
    // Try to translate if key exists
    let k = ''
    if (currentData.type === 'work') {
      k = `jobs.${item.id}`
    } else if (currentData.type === 'study') {
      k = `studies.${item.id}`
    } else {
      k = `items.${item.id}`
    }
    
    // Check main key
    const val = t(k)
    if (val !== k) {
      if (typeof val === 'object' && val !== null) {
        if (val.name) name = val.name
        if (val.description || val.desc) desc = val.description || val.desc
      } else {
        name = val
      }
    }

    // Fallback for description
    const descKey = k + '.desc'
    const descVal = t(descKey)
    if (descVal !== descKey) desc = descVal

    // Right side info
    let rightInfo = ''
    if (item.price !== undefined) rightInfo = `<span class="item-cost">💰${item.price}</span>`
    else if (item.count !== undefined) rightInfo = `<span class="item-cost">x${item.count}</span>`
    else if (item.income !== undefined) rightInfo = `<span class="item-cost">+💰${item.income}</span>`
    else if (item.cost !== undefined) rightInfo = `<span class="item-cost">-💰${item.cost}</span>`

    // Effects tags
    let effectsHtml = ''
    if (item.effects) {
      Object.entries(item.effects).forEach(([k, v]) => {
        if (v === 0) return
        const label = t(`status.labels.${k}`) !== `status.labels.${k}` ? t(`status.labels.${k}`) : k
        const val = /** @type {number} */ (v)
        const sign = val > 0 ? '+' : ''
        effectsHtml += `<span class="effect-tag">${label}${sign}${val}</span>`
      })
    }
    if (item.duration) {
       effectsHtml += `<span class="effect-tag">⏱️${item.duration}s</span>`
    }

    el.innerHTML = `
      <div class="item-icon">${item.icon || '📦'}</div>
      <div class="item-info">
        <div class="item-name">
          <span>${name}</span>
          ${rightInfo}
        </div>
        <div class="item-desc">${desc || ''}</div>
        <div class="item-effects">${effectsHtml}</div>
      </div>
    `
    
    el.onclick = () => {
      // Use bubble notification instead of result view
      const api = /** @type {any} */ (window).electronAPI
      if (api) api.interact(currentData.type, item.id, currentData.mode)
      // window.close() // Don't close immediately? Or keep open? 
      // User said "replace page prompts with bubble notifications". 
      // Usually shop stays open to buy more.
    }
    
    list.appendChild(el)
  })

  // Fill empty slots for all types
  // if (currentData.type === 'shop' || currentData.type === 'inventory') {
    const remainingSlots = state.perPage - items.length
    if (remainingSlots > 0) {
      for (let i = 0; i < remainingSlots; i++) {
        const el = document.createElement('div')
        el.className = 'list-item empty'
        el.innerHTML = `
          <div class="item-icon"></div>
          <div class="item-info">
            <div class="item-name"></div>
            <div class="item-desc"></div>
          </div>
        `
        list.appendChild(el)
      }
    }
  // }
}

/**
 * @param {string} msg 
 * @param {'success'|'error'} type 
 */
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast-msg')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'toast-msg'
    toast.style.position = 'fixed'
    toast.style.bottom = '20px'
    toast.style.left = '50%'
    toast.style.transform = 'translateX(-50%)'
    toast.style.padding = '8px 16px'
    toast.style.borderRadius = '4px'
    toast.style.color = '#fff'
    toast.style.fontSize = '14px'
    toast.style.zIndex = '1000'
    toast.style.transition = 'opacity 0.3s'
    document.body.appendChild(toast)
  }
  
  toast.textContent = msg
  toast.style.background = type === 'error' ? 'rgba(255, 80, 80, 0.9)' : 'rgba(80, 200, 80, 0.9)'
  toast.style.display = 'block'
  toast.style.opacity = '1'
  
  // Clear previous timeout if any
  const tToast = /** @type {any} */ (toast)
  if (tToast.timeout) {
    clearTimeout(tToast.timeout)
  }
  
  tToast.timeout = setTimeout(() => {
    if (toast) {
        toast.style.opacity = '0'
        setTimeout(() => { if (toast) toast.style.display = 'none' }, 300)
    }
  }, 3000)
}

})();
