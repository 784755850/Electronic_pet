# 电子宠物 MOD 开发指南

本游戏支持通过 JSON 文件自定义游戏数据，包括物品、工作、学习课程和探险地点。你可以通过添加或修改这些文件来扩展游戏内容，甚至覆盖游戏原有的数据。

## 📂 MOD 文件位置

游戏启动时会按顺序扫描以下目录，后加载的数据会覆盖先加载的数据（基于 `id`）：

1. **游戏安装目录下的 `data` 文件夹**
   - 适用于绿色版/便携版。
   - 路径示例：`D:\Games\ElectronicPet\data\`

2. **用户数据目录下的 `game-data` 文件夹** (推荐)
   - 适用于安装版，或不想修改游戏本体的情况。
   - Windows 路径：`%APPDATA%\ElectronicPet\game-data\`
     - (通常是 `C:\Users\你的用户名\AppData\Roaming\ElectronicPet\game-data\`)

## 📝 文件命名规则

你可以在上述目录下创建以下 JSON 文件（或者同名文件夹）：

- **物品**: `items.json` 或 `items/*.json`
- **工作**: `jobs.json` 或 `jobs/*.json`
- **学习**: `studies.json` 或 `studies/*.json`
- **探险**: `adventures.json` 或 `adventures/*.json`
- **成就**: `achievements.json` 或 `achievements/*.json`

> **提示**：如果数据量较大，建议创建一个文件夹（如 `items/`），在里面放入多个 json 文件（如 `food_mod.json`, `toys_mod.json`），游戏会自动加载文件夹内所有 `.json` 文件。

## 🛠️ 数据格式详解

### 1. 物品 (Items)

物品包括食物、清洁用品、玩具、药品等。

**基本结构**:
```json
[
  {
    "id": "my_custom_apple",          // 唯一ID，如果与原版相同则覆盖原版
    "name": "金苹果",                 // 显示名称
    "type": "food",                   // 类型: food, clean, toy, medicine, special
    "price": 100,                     // 商店售价
    "duration": 5,                    // 使用消耗时间(秒)
    "effects": {                      // 物品效果
      "hunger": -50,                  // 饥饿度变化 (负数表示减少饥饿/吃饱)
      "mood": 20,                     // 心情变化
      "health": 5                     // 健康变化
    },
    "description": "传说中的金苹果。", // 描述文本
    "locales": {                      // 多语言支持 (可选)
      "en-US": {
        "name": "Golden Apple",
        "description": "A legendary golden apple."
      }
    }
  }
]
```

**支持的效果字段 (`effects`)**:
- `hunger`: 饥饿度 (通常为负数，表示减少饥饿感)
- `clean`: 清洁度 (正数表示增加)
- `mood`: 心情 (正数表示增加)
- `health`: 健康 (正数表示增加)
- `cure`: `true`/`false` (是否治病)
- 以及属性加成: `strength`, `dexterity`, `endurance`, `intelligence`, `luck`, `charm`

---

### 2. 工作 (Jobs)

定义宠物可以进行的打工项目。

**基本结构**:
```json
[
  {
    "id": "programmer",
    "name": "写代码",
    "income": 50,                     // 获得的金币
    "duration": 30,                   // 持续时间(秒)
    "requirement": {                  // 工作要求 (可选)
      "intelligence": 20,             // 智力要求
      "level": 5                      // 等级要求
    },
    "description": "通过编写代码赚钱。",
    "locales": {
      "en-US": { "name": "Coding", "description": "Earn money by coding." }
    }
  }
]
```

**支持的要求字段 (`requirement`)**:
- `level`: 最低等级
- 属性要求: `strength`, `dexterity`, `endurance`, `intelligence`, `luck`, `charm`
- `stages`: 允许的阶段数组，例如 `["baby", "adult"]`

---

### 3. 学习 (Studies)

定义宠物可以进行的学习课程，用于提升属性。

**基本结构**:
```json
[
  {
    "id": "math_class",
    "name": "数学课",
    "cost": 20,                       // 学习花费金币
    "duration": 20,                   // 持续时间(秒)
    "effect": {                       // 学习获得的属性
      "intelligence": 5,
      "exp": 10                       // 获得经验值
    },
    "cost_stats": {                   // 学习消耗的状态 (可选)
      "hunger": 10,                   // 增加饥饿
      "mood": 5                       // 减少心情
    },
    "description": "学习基础数学知识。",
    "locales": {
      "en-US": { "name": "Math Class" }
    }
  }
]
```

---

### 4. 探险地点 (Adventures)

定义探险地图上的地点。

**基本结构**:
```json
[
  {
    "id": "mysterious_cave",
    "name": "神秘洞穴",
    "description": "阴暗潮湿的洞穴，可能有宝藏。",
    "cost": 30,                       // 消耗饥饿度
    "riskLevel": "high",              // 风险等级: low, medium, high
    "requirements": {                 // 探险门槛 (可选)
      "strength": 50
    },
    "locales": {
      "en-US": { "name": "Mysterious Cave" }
    }
  }
]
```

## 🌍 国际化 (I18n)

每个数据项都支持 `locales` 字段。如果游戏当前的语言设置匹配 `locales` 中的键（如 `en-US`），游戏将优先使用 `locales` 中的 `name` 和 `description`。

支持的语言代码：
- `zh-CN`: 简体中文
- `en-US`: 英语

## ⚠️ 注意事项

1. **ID 冲突**: 如果你的 MOD 使用了与原版相同的 `id`（例如 `bread`），你的数据将完全覆盖原版数据。利用这一点可以修改原版物品属性。
2. **JSON 格式**: 请确保 JSON 格式正确，不支持注释（虽然示例中为了说明加了注释，实际文件中请勿包含 `//`）。可以使用在线 JSON 校验工具检查。
3. **备份**: 修改数据前建议备份存档，以免数据错误导致无法加载。
