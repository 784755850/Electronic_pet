export default {
  status: {
    title: "宠物状况",
    tabs: {
      basic: "基本",
      abilities: "能力",
      info: "信息"
    },
    labels: {
      hunger: "饱食度",
      clean: "清洁度",
      mood: "心情",
      health: "健康",
      energy: "体力",
      level: "等级",
      exp: "经验",
      stage: "阶段",
      action: "动作",
      timeLeft: "剩余",
      money: "元宝",
      strength: "力量",
      dexterity: "敏捷",
      endurance: "耐力",
      intelligence: "智力",
      luck: "幸运",
      charm: "魅力"
    },
    picker: {
      study: "选择学习科目",
      work: "选择打工项目"
    }
  },
  dialog: {
    hunger_high: ["我饿了", "给我吃的吧", "肚子饿咕咕叫"],
    clean_low: ["我该洗澡了", "身上有点脏"],
    mood_low: ["陪我玩会儿", "有点无聊"],
    sick: ["不舒服", "需要吃药"],
    generic: ["今天天气不错", "我很开心", "主人真好"]
  },
  settings: {
    title: "宠物设置",
    tabs: {
      appearance: "外观",
      general: "常规"
    },
    appearance: {
      bodyColor: "蛋体主色",
      outlineColor: "轮廓色",
      random: "随机生成外观",
      apply: "立即生效"
    },
    theme: "主题颜色",
    custom: "自定义",
    themes: {
      purple: "紫色",
      green: "绿色",
      blue: "蓝色",
      pink: "粉色",
      orange: "橙色",
      red: "红色",
      cyan: "青色",
      gold: "金色",
      darkPurple: "深紫",
      darkBlue: "深蓝",
      darkGreen: "深绿",
      darkRed: "深红",
      darkBrown: "深棕",
      pureBlack: "纯黑",
      darkGray: "深灰",
      darkGreen2: "墨绿"
    },
    dnd: {
      title: "免打扰时段",
      desc: "在此期间不会发出任何弹窗",
      start: "开始",
      end: "结束",
      enable: "开启免打扰"
    },
    name: {
      title: "宠物昵称"
    },
    general: {
      title: "通用设置",
      language: "语言",
      tickInterval: "Tick间隔(ms)",
      dialogInterval: "对话间隔(ms)",
      save: "保存设置",
      reset: "重置数据",
      bubble: "显示对话气泡",
      desktop_notify: "Windows系统通知",
      autosave: "自动保存",
      default_mode: "默认模式"
    }
  },
  actions: {
    feed: "喂食",
    clean: "洗澡",
    play: "玩耍",
    sleep: "睡觉",
    work: "打工",
    study: "学习",
    adventure: "探险",
    shop: "商店",
    inventory: "背包",
    item: "物品",
    end_work: "结束"
  },
  adventure: {
    title: "探险",
    loading: "加载中...",
    back: "返回",
    empty: "等级太低，暂无探险地点",
    error: "加载失败",
    error_generic: "出错啦",
    adventuring: "探险中...",
    risk: {
      low: "安全",
      medium: "普通",
      high: "危险"
    },
    labels: {
      cost: "消耗: {amount} 饱食度",
      risk: "风险: {level}"
    },
    rewards: {
      coins: "元宝 +{amount}",
      exp: "经验 +{amount}",
      item: "获得物品: {name} x{count}",
      stat: "{key} +{value}"
    },
    locations: {
      park: { name: "附近公园", desc: "一个和平的公园，适合散步。" },
      forest: { name: "迷雾森林", desc: "充满未知的森林，可能发现珍稀草药。" },
      city: { name: "赛博城区", desc: "繁华但危险的都市，机遇与风险并存。" },
      ruins: { name: "古老遗迹", desc: "沉睡千年的遗迹，传说埋藏着古币和金羽毛。" },
      space_station: { name: "星际空间站", desc: "通往宇宙的门户，可能有外星科技产物。" }
    }
  },
  stages: {
    title: "◆ 宠物成长阶段 ◆",
    egg: "宠物蛋",
    baby: "幼生",
    teen: "成长",
    adult: "成熟",
    rare: "稀有",
    tabs: {
      baby: "幼生",
      teen: "成长",
      adult: "成熟",
      rare: "稀有"
    },
    labels: {
      baby: "幼生期",
      teen: "成长期",
      adult: "成熟期",
      rare: "稀有成熟期"
    },
    moods: {
      happy: "开心(4)",
      bored: "无聊(2-3)",
      hungry: "饥饿(3)",
      angry: "生气(4)",
      tired: "疲惫(2)"
    },
    pixels: "{size}×{size} 像素",
    legend: {
      title: "配色说明",
      dark_outline: "深紫描边",
      mid_body: "中紫主色",
      light_highlight: "浅紫高光",
      pink_heart: "浅粉心形",
      yellow_decor: "浅黄装饰"
    }
  },
  jobs: {
    flyer_distributor: "发传单",
    miner: "矿工",
    programmer: "程序员",
    thief: "侠盗"
  },
  studies: {
    kindergarten_basic: "幼儿园基础",
    primary_school_math: "小学数学",
    middle_school_physics: "中学物理",
    gym_basic: "基础体能",
    gym_advanced: "进阶格斗"
  },
  moods: {
    happy: "开心(4)",
    bored: "无聊(2-3)",
    hungry: "饥饿(3)",
    angry: "生气(4)",
    tired: "疲惫(2)",
    rare_prefix: "稀有 "
  },
  actionStatus: {
    idle: "空闲",
    eating: "吃饭中",
    cleaning: "洗澡中",
    playing: "玩耍中",
    sleeping: "睡觉中",
    working: "打工中",
    studying: "学习中"
  },
  interaction: {
    empty: "空空如也",
    feed: "喂食",
    clean: "洗澡",
    play: "玩耍",
    work: "打工",
    study: "学习",
    shop: "商店",
    inventory: "背包",
    sleep: "睡觉",
    Feed: "喂食",
    Clean: "洗澡",
    Play: "玩耍",
    Work: "打工",
    Study: "学习",
    Shop: "商店",
    Inventory: "背包"
  },
  tray: {
    tooltip: "{name} - 电子宠物",
    work_remaining: "打工剩余: {time}",
    study_remaining: "学习剩余: {time}",
    mode: "模式: {mode}",
    coins: "元宝: {coins}",
    earned_money: "获得金钱{amount}",
    unlock_achievement: "解锁成就: {name}",
    study_complete: "学习结束",
    finish_work: "结束打工并结算",
    shop_quick: "商店 (快速购买)",
    inventory: "背包 (使用物品)",
    settings: "设置",
    dnd_settings: "免打扰时间设置...",
    open_settings: "打开设置",
    show_pet: "显示宠物",
    hide_pet: "隐藏宠物",
    save_game: "保存游戏",
    quit: "退出"
  },
  modes: {
    quiet: "安静",
    roam: "闲逛",
    mischief: "捣蛋"
  },
  messages: {
    action_done: "动作完成",
    eating_done: "吃饱了",
    cleaning_done: "洗香香了",
    playing_done: "玩开心了",
    evolution: "进化为{stage}",
    saved: "已保存",
    colors_saved: "颜色已保存",
    quiet_saved: "免打扰设置已保存",
    settings_saved: "设置已保存",
    greeting: "你好，我叫{name}",
    work_started: "开始工作：{job}，时长{duration}秒",
    work_failed: "无法开始工作",
    work_not_working: "当前未在打工",
    work_income: "结算收入{amount}元宝",
    work_unlock_achievement: "\n解锁成就: {names}",
    achievement_unlocked: "🏆 解锁成就：{name}!",
    study_started: "开始学习",
    study_failed: "无法开始学习",
    shop_buy_success: "购买成功",
    shop_buy_failed: "购买失败",
    item_use_success: "使用成功",
    item_use_failed: "使用失败",
    pet_touch: "❤",
    pet_touch_too_fast: "不要摸太快啦~",
    pet_touch_log: "抚摸宠物",
    
    // Action failures
    pet_busy_now: "宠物正在忙呢",
    pet_too_sick: "宠物生病了，没力气",
    level_too_low: "等级不足",
    strength_too_low: "力量不足",
    dexterity_too_low: "敏捷不足",
    endurance_too_low: "耐力不足",
    intelligence_too_low: "智力不足",
    luck_too_low: "幸运不足",
    charm_too_low: "魅力不足",
    invalid_stage: "当前成长阶段无法进行此行动",
    prerequisite_not_met: "前置课程未完成",
    too_hungry: "太饿了",
    mood_too_low: "心情不好",
    too_dirty: "太脏了",
    too_sick: "生病了",
    not_enough_coins: "元宝不足",
    not_enough_items: "物品不足",
    work_not_found: "找不到该工作",
    study_not_found: "找不到该课程",
    item_not_found: "找不到该物品",

    auto_feed: "太饿了，自动吃了{item}",
    auto_buy_feed: "太饿了，自动购买并吃了{item}",
    auto_clean: "太脏了，自动使用了{item}",
    auto_buy_clean: "太脏了，自动购买并使用了{item}",
    auto_work: "没钱了，自动开始打工: {job}",
    pet_is_busy: "正在{action}中...",
    busy_same_action: "正在{action}呢，请稍后再试",
    busy_other_action: "正在{action}，暂时不能{incoming}"
  },
  rare: {
    title: "★ 异色稀有变种 ★",
    tag: "✦ RARE ✦",
    info: "64×64 像素 · 鎏金异色",
    legend: {
      gold: "鎏金",
      light_purple: "浅紫",
      silver: "浅银",
      dark_purple: "深紫"
    }
  },
  adventure_results: {
    unknown_location: "未知地点",
    level_low: "等级不足",
    str_low: "力量不足",
    dex_low: "敏捷不足",
    end_low: "耐力不足",
    int_low: "智力不足",
    luk_low: "幸运不足",
    cha_low: "魅力不足",
    too_hungry: "太饿了，没力气去探险...",
    sick: "身体不舒服，还是休息吧...",
    
    forest_lost: "迷路了...转了好久才出来，感觉身体被掏空。",
    forest_berry: "发现了一些野生浆果，味道不错。",
    forest_herb: "找到了一株散发着微光的神秘草药！",
    forest_elf: "误入精灵的聚会，不仅被治愈了，还得到了款待！",

    ruins_trap: "不小心触发了陷阱，灰头土脸地逃了出来。",
    ruins_coin: "在瓦砾堆中发现了一些古老的金币。",
    ruins_text: "解读了墙上的古文字，感觉智慧增长了。",
    ruins_feather: "发现了传说中的金羽毛！它散发着迷人的光芒。",

    park_stroll: "在公园散步，心情变好了。",
    park_flower: "在花丛中发现了一些零钱。",
    park_friend: "遇到了其他宠物，玩得很开心！",
    park_toy: "竟然捡到了别人遗失的玩具！",

    city_noise: "噪音太大，感觉头晕眼花...",
    city_splash: "不仅迷路了，还被路过的洒水车溅了一身...",
    city_work: "帮路边的店铺发传单，赚了一点钱。",
    city_tech: "捡到了一个奇怪的电子零件。",
    city_arcade: "在电玩城打破了最高记录！",
    city_casino: "在电玩城运气爆棚！赢了一大笔！",

    space_rad: "受到宇宙射线辐射，感觉不太舒服。",
    space_guard: "因为没有通行证被保安赶了出来，还被嘲笑了一番。",
    space_training: "体验了失重训练，感觉身体素质提升了。",
    space_view: "从舷窗眺望地球，心灵受到了震撼。",
    space_tech: "拾获了外星文明丢弃的垃圾（也是宝贝！）。",
    space_contact: "与外星生命进行了第三类接触！"
  },
  itemSelector: {
    title: "选择物品",
    empty: "没有可用物品",
    price: "价格: {price}",
    count: "拥有: {count}",
    buy: "购买",
    use: "使用",
    map: {
      all: "全部",
      food: "喂食",
      clean: "清洁",
      toy: "玩耍",
      medicine: "药品",
      special: "特殊",
      work: "工作",
      study: "学习"
    }
  },
  contextMenu: {
    title: "菜单",
    select: "选择 {label}",
    loading: "加载中...",
    no_jobs: "暂无工作",
    no_studies: "暂无课程",
    no_items: "暂无商品",
    empty_bag: "背包为空",
    load_error: "加载失败",
    items: {
      status: "状态面板",
      hide: "隐藏到托盘",
      alwaysOnTop: "置顶显示",
      feed: "喂食",
      clean: "洗澡",
      play: "玩耍",
      adventure: "探险",
      work: "打工",
      study: "学习",
      shop: "商店",
      bag: "背包",
      settings: "设置",
      debug: "测试模式",
      quit: "退出"
    },
    shop: {
      balance: "余额",
      all: "全部",
      food: "食物",
      clean: "清洁",
      toy: "玩具",
      special: "特殊",
      bought: "已购买 {name}",
      no_money: "余额不足"
    }
  },
  themes: {
    purple: "💜 紫色",
    green: "💚 绿色",
    blue: "💙 蓝色",
    pink: "💗 粉色",
    orange: "🧡 橙色",
    settings: "⚙️ 更多设置..."
  },
  overlay: {
    status: "状",
    study: "学",
    work: "工",
    shop: "店",
    bag: "包",
    settings: "设"
  },
  debug: {
    title: "测试模式",
    stats: "状态调整",
    full_stats: "状态全满",
    low_stats: "状态极低",
    add_coins: "加1000金币",
    reset_coins: "重置金币",
    evolution: "进化测试",
    egg: "蛋",
    baby: "幼年期",
    adult: "成年期",
    rare: "稀有形态",
    others: "其他功能",
    unlock_all: "全部解锁",
    action_done: "操作已执行"
  }
}
