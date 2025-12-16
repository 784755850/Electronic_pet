# 小智 AI (XiaoZhi) 接入方案

本文档整理自 [XiaoZhi AI 开发文档](https://xiaozhi.dev/docs/development/)，旨在为电子宠物接入小智 AI 协议提供技术参考。

## 1. 概述

小智 AI 是一个基于 ESP32 的语音机器人项目，其核心通信协议和情绪表达机制（Emoji）非常适合用于驱动电子宠物的行为和状态。通过接入该协议，电子宠物可以：
1.  作为一个虚拟的小智客户端存在。
2.  通过 WebSocket 接收来自小智服务端（或兼容服务端）的指令。
3.  利用 LLM 输出的 Emoji 自动切换宠物的动画状态（如开心、睡觉、学习等）。

## 2. 通信协议 (WebSocket)

设备与服务端之间通过 WebSocket 进行实时通信。

### 2.1 连接建立
*   **URL**: `wss://api.xiaozhi.me/v1/ws` (或本地服务端地址)
*   **Headers**:
    *   `Authorization`: `Bearer <token>` (用于鉴权)
    *   `Protocol-Version`: `1` (与协议版本保持一致)

### 2.2 握手流程
连接建立后，服务端会发送 `hello` 消息：
```json
{
  "type": "hello",
  "transport": "websocket",
  "version": 1
}
```

### 2.3 消息格式
通信采用 JSON 文本帧。常见字段：
*   `type`: 消息类型 (如 `listen`, `stt`, `tts`, `llm` 等)。
*   `state`: 状态指示 (如 `start`, `stop`, `detect` 等)。
*   `text`: 文本内容 (用于 STT/TTS/LLM)。

## 3. Emoji 心情/动作映射系统

小智 AI 利用大语言模型输出的 **单个 Emoji** 来表达当前的情绪或状态。我们可以将这些 Emoji 映射到电子宠物的具体动作 (`currentAction`) 和心情值 (`mood`)。

### 3.1 建议映射表

| Emoji | 含义 | 宠物动作 (`currentAction`) | 宠物状态变化 | 触发动画 |
| :--- | :--- | :--- | :--- | :--- |
| 😐/😶 | 平静/发呆 | `idle` | Mood = 50 | 默认待机 |
| 😊/😄/😁 | 开心 | `playing` | Mood += 10 | 跳跃/玩球 |
| 😢/😭/😞 | 难过 | `idle` | Mood -= 10 | 垂头丧气 |
| 😠/😡 | 生气 | `idle` | Mood -= 5 | 拒绝互动 |
| 💤/😴 | 睡觉 | `sleep` | Energy += 20 | 闭眼/Zzz |
| 🍎/🍔/🍗 | 进食 | `eating` | Hunger -= 20 | 吃苹果动画 |
| 💼/👔 | 工作 | `work` | Money += 10 | 公文包/流汗 |
| 📚/📖 | 学习 | `study` | Wisdom += 5 | 戴眼镜/看书 |
| 🛁/🧼 | 洗澡 | `cleaning` | Clean += 20 | 泡泡/刷子 |
| ❤️/🥰 | 喜爱 | `playing` | Mood = 100 | 爱心特效 |

### 3.2 处理逻辑
1.  **监听 LLM 消息**: 在接收到的 LLM 文本流中检测 Emoji 字符。
2.  **过滤**: TTS 语音合成时应 **忽略** 这些 Emoji，不读出来。
3.  **驱动**: 提取 Emoji，根据映射表调用 `pet.updateState()` 或直接设置 `pet.currentAction`。

## 4. 接入计划 (Roadmap)

### 第一阶段：协议层实现
- [ ] 在 `src/main/` 中添加 WebSocket Client 模块。
- [ ] 实现基础的连接、鉴权和心跳保活机制。
- [ ] 实现消息解析器，能够区分 `hello`, `tts`, `llm` 等消息类型。

### 第二阶段：状态驱动
- [ ] 在 `src/core/pet.ts` 中添加 `handleEmojiCommand(emoji: string)` 方法。
- [ ] 将 WebSocket 接收到的 Emoji 转发给 Pet Core。
- [ ] 验证 Emoji 是否能正确触发前端的新增动画 (v0.2.3)。

### 第三阶段：双向交互 (可选)
- [ ] 允许电子宠物通过麦克风采集音频发送给小智服务端（模拟小智硬件）。
- [ ] 或者仅作为“显示端”，配合实体小智硬件使用（通过服务端转发状态）。

## 5. 参考资料
*   [XiaoZhi 开发文档](https://xiaozhi.dev/docs/development/)
*   [WebSocket 协议详情](https://github.com/78/xiaozhi-esp32/blob/main/docs/websocket.md)
