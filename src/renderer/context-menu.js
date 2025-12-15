const $ = (id) => document.getElementById(id);
const list = $('menu-list');
const headerTitle = $('header-title');

let i18nData = {}

function t(key, params) {
  const keys = key.split('.')
  let v = i18nData
  for (const k of keys) {
    if (v && v[k]) v = v[k]
    else return key
  }
  if (typeof v === 'string' && params) {
    return v.replace(/\{(\w+)\}/g, (_, k) => String(params[k] || `{${k}}`))
  }
  return v || key
}

if (window.electronAPI) {
  Promise.all([
    window.electronAPI.getI18nData(),
    window.electronAPI.getAlwaysOnTop(),
    window.electronAPI.getAppInfo ? window.electronAPI.getAppInfo() : Promise.resolve({ isPackaged: false })
  ]).then(([data, alwaysOnTop, appInfo]) => {
    i18nData = data
    renderMain(alwaysOnTop, appInfo?.isPackaged)
  })
  
  window.electronAPI.onLanguageChange((data) => {
    i18nData = data
    // Re-fetch always on top or cache it?
    // Pass isPackaged as undefined or cache it? Better cache it.
    // Actually renderMain handles isPackaged check if we pass it.
    // Let's store isPackaged globally.
  })
}

let isPackaged = false

if (window.electronAPI) {
    // Re-do the initialization logic
}


const MENU_ITEMS = [
  { labelKey: 'contextMenu.items.status', action: 'status', icon: '📊' },
  { type: 'separator' },
  { labelKey: 'contextMenu.items.feed', action: 'feed', icon: '🍖' },
  { labelKey: 'contextMenu.items.clean', action: 'clean', icon: '🚿' },
  { labelKey: 'contextMenu.items.play', action: 'play', icon: '🎾' },
  { labelKey: 'contextMenu.items.adventure', action: 'adventure', icon: '🗺️' },
  { type: 'separator' },
  { labelKey: 'contextMenu.items.work', action: 'work', icon: '💼' },
  { labelKey: 'contextMenu.items.study', action: 'study', icon: '📚' },
  { labelKey: 'contextMenu.items.shop', action: 'shop', icon: '🏪' },
  { labelKey: 'contextMenu.items.bag', action: 'bag', icon: '🎒' },
  { type: 'separator' },
  { labelKey: 'contextMenu.items.settings', action: 'settings', icon: '⚙️' },
  { labelKey: 'contextMenu.items.debug', action: 'debug', icon: '🐞' },
  { labelKey: 'contextMenu.items.quit', action: 'quit', icon: '🚪' }
];

function renderMain(alwaysOnTop = true, isPackaged = false) {
  headerTitle.textContent = t('contextMenu.title');
  list.innerHTML = '';
  
  MENU_ITEMS.forEach(item => {
    if (isPackaged && item.action === 'debug') return;

    if (item.type === 'separator') {
      const el = document.createElement('div');
      el.className = 'separator';
      list.appendChild(el);
      return;
    }

    const el = document.createElement('div');
    el.className = 'menu-item';
    if (['feed', 'clean', 'play'].includes(item.action)) el.classList.add('action');
    
    let icon = item.icon
    if (item.isCheckbox) {
       icon = alwaysOnTop ? '☑️' : '⬜'
    }
    
    const label = t(item.labelKey);
    el.innerHTML = `<span style="margin-right:8px">${icon}</span>${label}`;
    
    el.onclick = () => handleAction(item, alwaysOnTop);
    list.appendChild(el);
  });
}

async function handleAction(item, currentState) {
  if (!window.electronAPI) return;

  switch (item.action) {
    case 'hide':
      window.electronAPI.minimizeToTray();
      break;
    case 'alwaysOnTop':
      window.electronAPI.toggleAlwaysOnTop(!currentState);
      break;
    case 'status':
      window.electronAPI.openStatus();
      break;
    case 'feed':
      window.electronAPI.feedPet();
      break;
    case 'clean':
      window.electronAPI.cleanPet();
      break;
    case 'play':
      window.electronAPI.playWithPet();
      break;
    case 'adventure':
      window.electronAPI.openAdventure();
      break;
    case 'work':
      window.electronAPI.openWorkMenu();
      break;
    case 'study':
      window.electronAPI.openStudyMenu();
      break;
    case 'shop':
      window.electronAPI.openShopMenu();
      break;
    case 'bag':
      window.electronAPI.openInventoryMenu();
      break;
    case 'settings':
      window.electronAPI.openSettings();
      break;
    case 'debug':
      window.electronAPI.openDebug();
      break;
    case 'quit':
      window.electronAPI.quitGame && window.electronAPI.quitGame();
      break;
  }
  
  window.close();
}
