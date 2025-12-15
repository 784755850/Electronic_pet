export default {
  status: {
    title: "Pet Status",
    tabs: {
      basic: "Basic",
      abilities: "Stats",
      info: "Info"
    },
    labels: {
      hunger: "Hunger",
      clean: "Hygiene",
      mood: "Mood",
      health: "Health",
      energy: "Energy",
      level: "Level",
      exp: "Exp",
      stage: "Stage",
      action: "Action",
      timeLeft: "Time Left",
      money: "Gold",
      strength: "STR",
      dexterity: "DEX",
      endurance: "END",
      intelligence: "INT",
      luck: "LUK",
      charm: "CHR"
    },
    picker: {
      study: "Choose Subject",
      work: "Choose Job"
    }
  },
  dialog: {
    hunger_high: ["I'm hungry", "Feed me please", "Tummy rumbling"],
    clean_low: ["I need a bath", "Feeling dirty"],
    mood_low: ["Play with me", "Bored"],
    sick: ["Not feeling well", "Need medicine"],
    generic: ["Nice weather today", "I'm happy", "You're the best"]
  },
  settings: {
    title: "Pet Settings",
    tabs: {
      appearance: "Appearance",
      general: "General"
    },
    appearance: {
      bodyColor: "Body Color",
      outlineColor: "Outline Color",
      random: "Randomize",
      apply: "Apply Now"
    },
    theme: "Theme Color",
    custom: "Custom",
    themes: {
      purple: "Purple",
      green: "Green",
      blue: "Blue",
      pink: "Pink",
      orange: "Orange",
      red: "Red",
      cyan: "Cyan",
      gold: "Gold",
      darkPurple: "Dark Purple",
      darkBlue: "Dark Blue",
      darkGreen: "Dark Green",
      darkRed: "Dark Red",
      darkBrown: "Dark Brown",
      pureBlack: "Pure Black",
      darkGray: "Dark Gray",
      darkGreen2: "Dark Green 2"
    },
    dnd: {
      title: "Do Not Disturb",
      desc: "No popups during this period",
      start: "Start",
      end: "End",
      enable: "Enable DND"
    },
    name: {
      title: "Pet Name"
    },
    general: {
      title: "General Settings",
      language: "Language",
      tickInterval: "Tick Interval (ms)",
      dialogInterval: "Dialog Interval (ms)",
      save: "Save Settings",
      reset: "Reset Data",
      bubble: "Show Bubbles",
      desktop_notify: "Windows Notification",
      autosave: "Auto Save",
      default_mode: "Default Mode"
    }
  },
  actions: {
    feed: "Feed",
    clean: "Clean",
    play: "Play",
    sleep: "Sleep",
    work: "Work",
    study: "Study",
    adventure: "Explore",
    shop: "Shop",
    inventory: "Inventory",
    item: "Item",
    end_work: "End"
  },
    adventure: {
      title: "Adventure",
      loading: "Loading...",
      back: "Back",
      empty: "Low level, no locations available",
      error: "Load Failed",
      error_generic: "Error occurred",
      adventuring: "Adventuring...",
      risk: {
        low: "Safe",
        medium: "Normal",
        high: "Risky"
      },
      labels: {
        cost: "Cost: {amount} Hunger",
        risk: "Risk: {level}"
      },
      rewards: {
        coins: "Coins +{amount}",
        exp: "Exp +{amount}",
        item: "Item: {name} x{count}",
        stat: "{key} +{value}"
      },
      locations: {
        park: { name: "Nearby Park", desc: "A peaceful park, good for a walk." },
        forest: { name: "Misty Forest", desc: "Unknown forest, might find rare herbs." },
        city: { name: "Cyber City", desc: "Bustling but dangerous city. Opportunity and risk." },
        ruins: { name: "Ancient Ruins", desc: "Sleeping ruins, legends say ancient coins and feathers are buried here." },
        space_station: { name: "Space Station", desc: "Gateway to the universe, might have alien tech." }
      }
    },
    stages: {
      title: "◆ Growth Stages ◆",
    egg: "Egg",
    baby: "Baby",
      teen: "Teen",
      adult: "Adult",
      rare: "Rare",
      tabs: {
        baby: "Baby",
        teen: "Teen",
        adult: "Adult",
        rare: "Rare"
      },
      labels: {
        baby: "Baby",
        teen: "Teen",
        adult: "Adult",
        rare: "Rare Adult"
      },
      pixels: "{size}×{size} Pixels",
      legend: {
        title: "Color Legend",
        dark_outline: "Dark Outline",
        mid_body: "Mid Body",
        light_highlight: "Light Highlight",
        pink_heart: "Pink Heart",
        yellow_decor: "Yellow Decor"
      },
      moods: {
        happy: "Happy(4)",
        bored: "Bored(2-3)",
        hungry: "Hungry(3)",
        angry: "Angry(4)",
        tired: "Tired(2)",
        rare_prefix: "Rare "
      }
    },
    actionStatus: {
    idle: "Idle",
    eating: "Eating",
    cleaning: "Cleaning",
    playing: "Playing",
    sleeping: "Sleeping",
    working: "Working",
    studying: "Studying"
  },
  tray: {
    tooltip: "{name} - Electronic Pet",
    work_remaining: "Work left: {time}",
    study_remaining: "Study left: {time}",
    mode: "Mode: {mode}",
    coins: "Coins: {coins}",
    earned_money: "Earned {amount} gold",
    unlock_achievement: "Achievement Unlocked: {name}",
    study_complete: "Study Complete",
    finish_work: "Finish Work & Collect",
    shop_quick: "Shop (Quick Buy)",
    inventory: "Inventory (Use Item)",
    settings: "Settings",
    dnd_settings: "Do Not Disturb Settings...",
    open_settings: "Open Settings",
    show_pet: "Show Pet",
    hide_pet: "Hide Pet",
    save_game: "Save Game",
    quit: "Quit"
  },
  modes: {
    quiet: "Quiet",
    roam: "Roam",
    mischief: "Mischief"
  },
  messages: {
    action_done: "Done!",
    eating_done: "I'm full!",
    cleaning_done: "Squeaky clean!",
    playing_done: "That was fun!",
    evolution: "Congratulations! Evolved to {stage} stage!",
    saved: "Saved",
    colors_saved: "Colors saved",
    quiet_saved: "DND settings saved",
    settings_saved: "Settings saved",
    greeting: "Hello, I'm {name}",
    work_started: "Started working: {job} ({duration}s)",
    work_failed: "Cannot start working",
    work_not_working: "Not currently working",
    work_income: "Collected {amount} gold",
    work_unlock_achievement: "\nAchievement Unlocked: {names}",
    achievement_unlocked: "🏆 Achievement Unlocked: {name}!",
    study_started: "Started studying",
    study_failed: "Cannot start studying",
    shop_buy_success: "Purchase Successful",
    shop_buy_failed: "Purchase Failed",
    item_use_success: "Used Successfully",
    item_use_failed: "Failed to use",
    pet_touch: "❤",
    pet_touch_log: "Pet touched",
    
    // Action failures
    pet_busy_now: "Pet is busy right now",
    pet_too_sick: "Pet is too sick",
    level_too_low: "Level too low",
    strength_too_low: "Not enough Strength",
    dexterity_too_low: "Not enough Dexterity",
    endurance_too_low: "Not enough Endurance",
    intelligence_too_low: "Not enough Intelligence",
    luck_too_low: "Not enough Luck",
    charm_too_low: "Not enough Charm",
    invalid_stage: "Cannot perform this action in current stage",
    prerequisite_not_met: "Prerequisite not met",
    too_hungry: "Too hungry",
    mood_too_low: "Mood too low",
    too_dirty: "Too dirty",
    too_sick: "Too sick",
    not_enough_coins: "Not enough coins",
    not_enough_items: "Not enough items",
    work_not_found: "Job not found",
    study_not_found: "Course not found",
    item_not_found: "Item not found",
    
    auto_feed: "Too hungry, automatically ate {item}",
    auto_buy_feed: "Too hungry, automatically bought and ate {item}",
    auto_clean: "Too dirty, automatically used {item}",
    auto_buy_clean: "Too dirty, automatically bought and used {item}",
    auto_work: "Out of money, automatically started working: {job}",
    pet_is_busy: "Busy with {action}...",
    busy_same_action: "I'm already {action}!",
    busy_other_action: "I'm {action}, can't {incoming} right now."
  },
  rare: {
    title: "★ RARE VARIANT ★",
    tag: "✦ RARE ✦",
    info: "64×64 Pixels · Gilded Variant",
    legend: {
      gold: "Gilded",
      light_purple: "Light Purple",
      silver: "Silver",
      dark_purple: "Dark Purple"
    }
  },
  adventure_results: {
      unknown_location: "Unknown Location",
      level_low: "Level too low",
      str_low: "Not enough Strength",
      dex_low: "Not enough Dexterity",
      end_low: "Not enough Endurance",
      int_low: "Not enough Intelligence",
      luk_low: "Not enough Luck",
      cha_low: "Not enough Charm",
      too_hungry: "Too hungry to adventure...",
      sick: "Not feeling well, better rest...",
      
      forest_lost: "Got lost... wandered for a long time, feeling drained.",
      forest_berry: "Found some wild berries, tasty!",
      forest_herb: "Found a mysterious glowing herb!",
      forest_elf: "Stumbled upon an elf gathering, got healed and treated!",
  
      ruins_trap: "Triggered a trap! Escaped covered in dust.",
      ruins_coin: "Found some ancient coins in the rubble.",
      ruins_text: "Deciphered ancient text, felt smarter.",
      ruins_feather: "Found the legendary Golden Feather! It glows mesmerisingly.",
  
      park_stroll: "Strolled in the park, mood improved.",
      park_flower: "Found some loose change in the flowers.",
      park_friend: "Met another pet and played happily!",
      park_toy: "Found a toy someone lost!",
  
      city_noise: "Too noisy, feeling dizzy...",
      city_splash: "Got lost and splashed by a street cleaner...",
      city_work: "Helped distribute flyers, earned some money.",
      city_tech: "Picked up a strange electronic part.",
      city_arcade: "Broke the high score at the arcade!",
      city_casino: "Hit the jackpot at the arcade! Won big!",
  
      space_rad: "Hit by cosmic radiation, feeling sick.",
      space_guard: "Kicked out by security for no pass, and got mocked.",
      space_training: "Experienced zero-gravity training, physique improved.",
      space_view: "Gazed at the Earth from the window, soul touched.",
      space_tech: "Found alien space junk (it's treasure!).",
      space_contact: "Made Third Kind contact with aliens!"
    },
    itemSelector: {
    title: "Select Item",
    empty: "No items available",
    price: "Price: {price}",
    count: "Count: {count}",
    buy: "Buy",
    use: "Use",
    map: {
      all: "All",
      food: "Food",
      clean: "Clean",
      toy: "Toy",
      medicine: "Medicine",
      special: "Special",
      work: "Work",
      study: "Study"
    }
  },
  contextMenu: {
      title: "Menu",
      select: "Select {label}",
      loading: "Loading...",
      no_jobs: "No jobs available",
      no_studies: "No courses available",
      no_items: "No items available",
      empty_bag: "Bag is empty",
      load_error: "Load failed",
      items: {
      status: "Status",
      hide: "Hide to Tray",
      alwaysOnTop: "Always on Top",
      feed: "Feed",
      clean: "Clean",
      play: "Play",
      adventure: "Adventure",
      work: "Work",
      study: "Study",
      shop: "Shop",
      bag: "Bag",
      settings: "Settings",
      debug: "Debug Mode",
      quit: "Quit"
    },
    shop: {
      balance: "Balance",
      all: "All",
      food: "Food",
      clean: "Clean",
      toy: "Toy",
      special: "Special",
      bought: "Bought {name}",
      no_money: "Not enough money"
    }
  },
  jobs: {
    flyer_distributor: "Flyer Distributor",
    miner: "Miner",
    programmer: "Programmer",
    thief: "Thief"
  },
  studies: {
    kindergarten_basic: "Kindergarten Basics",
    primary_school_math: "Primary Math",
    middle_school_physics: "Middle School Physics",
    gym_basic: "Basic Gym",
    gym_advanced: "Advanced Combat"
  },
  themes: {
    purple: "💜 Purple",
    green: "💚 Green",
    blue: "💙 Blue",
    pink: "💗 Pink",
    orange: "🧡 Orange",
    settings: "⚙️ More..."
  },
  overlay: {
    status: "S",
    study: "L",
    work: "W",
    shop: "$",
    bag: "B",
    settings: "C"
  },
  debug: {
    title: "TEST MODE",
    stats: "Stats",
    full_stats: "Full Stats",
    low_stats: "Low Stats",
    add_coins: "+1000 Coins",
    reset_coins: "Reset Coins",
    evolution: "Evolution",
    egg: "Egg",
    baby: "Baby",
    adult: "Adult",
    rare: "Rare",
    others: "Others",
    unlock_all: "Unlock All",
    action_done: "Action Done"
  }
}
