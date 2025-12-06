# 测试清单 (Testing Checklist)

> **文档定位**: 记录需要测试验证的功能  
> **Bug 追踪**: 未修复的问题请查阅 [BUG.md](./BUG.md)

---

## 🧪 待测试功能

### #T3 每日统计重置

**状态**: 新增  
**触发条件**: `checkAndResetDailyStats()` 在 onShow 检测日期变化

**测试要点**:
- 跨天后检查统计是否重置
- 验证日期判断逻辑

**相关文件**: `useGrowth.js`

---

### #T4 睡眠/唤醒系统

**状态**: 未测试  
**来源**: 悬浮窗交互系统 Phase 2

**待验证**:
- 验证睡眠/唤醒时机准确性
- 测试梦境生成功能
- 验证自动唤醒条件

**相关文件**: `useSleepWake.js`, `useBehaviorTree.js`

---

### #T5 AI降级策略

**状态**: 未测试  
**来源**: 悬浮窗交互系统 Phase 3

**待验证**:
- 测试 AI 降级策略触发条件
- 验证 4 级降级策略正确切换
- 测试网络超时检测

**相关文件**: `useAIFallback.js`, `useAIController.js`

---

### #T6 互动链步骤

**状态**: 未测试  
**来源**: 悬浮窗交互系统 Phase 4

**待验证**:
- 验证早晨问候链
- 测试摸鱼警告升级机制
- 测试学习里程碑庆祝
- 调整互动链步骤时长和文案

**相关文件**: `useInteractionChain.js`

---

### #T7 index.vue 集成

**状态**: 部分完成

**待完成**:
- 添加降级状态显示 (开发者工具)
- 添加行为树状态可视化

**相关文件**: `pages/index/index.vue`

---

### #T8 性能优化

**状态**: 未开始

**待完成**:
- 优化 Prompt 长度以减少 token 消耗
- 实现记忆精简机制
- 添加请求缓存策略

**相关文件**: `useAIContextBuilder.js`, `useMemory.js`

---

### #T9 缺失的手势功能

**状态**: 未实现  
**来源**: FLOAT_WINDOW_GUIDE.md

**文档描述但未实现的功能**:
- **滑动 (SWIPE)**: 快速滑动 → 躲闪动画 + "嘿！" / "好快！⚡"
- **甩动 (THROW)**: 大力甩动 → 抗议动画 + "呜哇！" / "别甩我！"

**实现建议**:
- 在 `pet.html` 添加滑动/甩动手势检测
- 在 `useGestureRecognizer.js` 添加 SWIPE/THROW 类型
- 添加对应的动画和文案

**相关文件**: 
- `static/pet.html`
- `pages/index/composables/useGestureRecognizer.js`

---

### #T10 躲避动画触发

**状态**: 未实现

**待实现**:
- 快速拖拽宠物向上 → 触发"躲避"动画

**相关文件**: 
- `static/pet.html` (拖拽事件检测)
- `pages/index/composables/useAnimations.js`

---

### #T11 AI动作字段匹配验证

**状态**: 未测试  
**依赖**: 需要先修复 BUG#101 (AI响应气泡)

**待验证**:
- 验证宠物动作是否与 AI 返回的 `action` 字段匹配
- 测试不同 action 值的动画响应

**相关文件**: 
- `pages/index/composables/usePetInteraction.js`
- `pages/index/composables/useAnimations.js`

---

### #T12 Lottie 动画集成

**状态**: 未实现  
**来源**: technical_supplements.md

**文档建议但未实现**:
- 使用 Lottie 动画替代当前 Emoji 宠物
- 预加载动画文件 (idle/jump/angry/sleep/celebrate/wave)
- 实现 `playAnimation()` 函数控制动画播放

**实现建议**:
- 在 `static/pet.html` 集成 lottie-web
- 创建 `static/animations/` 目录存放动画文件
- 替换 Emoji with Lottie animations

**相关文件**: 
- `static/pet.html`
- `static/animations/*.json` (需创建)

---

### #T13 高级手势模式匹配

**状态**: 未实现  
**来源**: technical_supplements.md

**文档建议但未实现**:
- 双击检测 (DOUBLE_TAP)
- 长按+滑动组合手势 (HOLD_AND_THROW)
- 连续手势历史追踪

**实现建议**:
- 在 `useGestureRecognizer.js` 添加 `GesturePatternMatcher` 类
- 实现手势历史记录和模式匹配算法

**相关文件**: 
- `pages/index/composables/useGestureRecognizer.js`

---

## 📋 测试优先级

### P0 (重要且影响体验)
- #T3 每日统计重置
- #T4 睡眠/唤醒系统
- #T5 AI降级策略

### P1 (重要但不紧急)
- #T6 互动链步骤
- #T11 AI动作字段匹配

### P2 (功能增强)
- #T9 缺失的手势功能
- #T12 Lottie 动画集成
- #T13 高级手势模式匹配

---

**更新时间**: 2025-12-06  
**总数**: 11 个待测试项
