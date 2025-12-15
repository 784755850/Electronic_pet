# 桌面电子宠物技术文档

## 技术总览
- **目标**：复刻QQ宠物的桌面养成体验，聚焦"打工赚钱 + 养成消费 + 桌面互动"
- **技术栈**：Electron + TypeScript，Canvas 2D渲染，本地JSON存储
- **运行环境**：Windows 10/11 桌面，单机离线运行
- **核心特性**：透明窗口、桌面漫步、经济系统、属性养成、边缘停靠

## 架构设计

### 模块划分
```
src/
  app/               # Electron主进程逻辑
    movement.ts      # 窗口移动与自动漫步逻辑
    modeDetection.ts # 全屏应用检测（免打扰模式）
  core/              # 核心业务逻辑 (无UI依赖)
    pet.ts           # 宠物状态（属性、等级、阶段）
    economy.ts       # 经济系统（元宝、打工、购物）
    growth.ts        # 成长系统（经验、属性提升、进化）
    events.ts        # 随机事件（生病、对话触发）
    action-system.ts # 统一动作系统
    adventure.ts     # 探险系统逻辑
    i18n.ts          # 国际化处理
  data/              # 静态配置数据
    json/            # JSON配置文件 (items, jobs, studies...)
  locales/           # 翻译文件 (en-US, zh-CN)
  renderer/          # 前端渲染层
    index.html       # 宠物主窗口
    renderer.js      # 主窗口逻辑
    sprites.js       # Canvas精灵图绘制
    status.html      # 状态面板
    context-menu.js  # 右键菜单逻辑
    interaction.js   # 交互窗口通用逻辑 (商店/背包/打工)
  types/             # TypeScript类型定义
  main.ts            # Electron入口，IPC通信，窗口管理
  preload.ts         # 预加载脚本，ContextBridge安全暴露
  storage.ts         # 存档读写管理
```

### 关键技术点

#### 1. 透明窗口与点击穿透
使用 Electron 的 `transparent: true` 和 `frame: false` 创建透明窗口。
为了实现"点击宠物有效，点击背景穿透"，采用了忽略鼠标事件的策略：
- 默认 `win.setIgnoreMouseEvents(true, { forward: true })`
- 当鼠标移动到非透明像素区域时（在 Renderer 进程检测），通知 Main 进程捕获鼠标。

#### 2. 边缘停靠 (Edge Docking)
在 `movement.ts` 和 `main.ts` 中实现了屏幕边缘检测：
- 当用户拖拽宠物到屏幕左/右边缘并释放时，宠物会自动吸附并隐藏大部分身体。
- 鼠标悬停在露出的部分时，宠物会自动弹出。

#### 3. 状态管理与IPC
- **Main Process**: 维护核心 `Pet` 和 `Player` 对象，执行 `tick()` 循环（每秒）。
- **Renderer Process**: 只负责显示，通过 IPC (`electronAPI`) 获取数据和发送指令。
- **数据同步**: Main 进程通过 `pet-update` 和 `status-update` 事件广播状态变更。

#### 4. 国际化 (i18n)
支持动态语言切换，语言包位于 `src/locales`。
Main 进程加载语言包，通过 IPC 发送给 Renderer 渲染界面文本。

## 数据结构

### Pet 实体
```typescript
interface Pet {
  id: string
  name: string
  stage: 'egg' | 'baby' | 'adult'
  level: number
  // 基础属性
  hunger: number
  clean: number
  mood: number
  health: number
  // 核心属性
  strength: number
  dexterity: number
  intelligence: number
  charm: number
  // 状态
  currentAction: string
  sick: boolean
}
```
