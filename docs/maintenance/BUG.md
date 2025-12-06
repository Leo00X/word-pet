# 已知问题 (Known Issues)

记录待修复的 Bug 和问题。

> **最后更新**: 2025-12-06  
> **分类**: 🔴 高优先级 | 🟡 中优先级 | 🟢 低优先级 | ⏸️ 待观察

---

## � 高优先级（影响核心功能）

### #101 【悬浮窗】点击宠物没有AI响应气泡
**发现时间**: 2025-12-06  
**严重程度**: 🔴 高  
**状态**: ✅ 已修复，待测试  
**测试设备**: Android真机

**问题描述**:  
点击悬浮窗宠物后，只有跳跃动画，没有显示 AI 生成的文本气泡。用户期望看到宠物的对话回复。

**期望行为**:  
点击宠物 → 跳跃动画 + AI文本气泡（如"嘿嘿~"、"想我了？"）

**根本原因**:  
🔥 **功能不闭环**：`usePetInteraction.js` 已创建但从未在 `index.vue` 中导入和集成！
- `useFloatWindow` 有 `onGestureEvent` 回调，但 index.vue 未传入
- 手势事件无法转发到 `usePetInteraction.handleFloatMessage`
- `sendResponseToFloat` 的 `onSendToFloat` 回调未连接

**修复方案**:  
1. 在 index.vue 中导入 `usePetInteraction`
2. 创建 `petInteraction` 实例并传入：
   - `floatWindowInstance`: 悬浮窗实例引用
   - `onSendToFloat`: 消息发送回调
   - `addLog`: 日志回调
3. 在 `useFloatWindow` 初始化时传入 `onGestureEvent` 回调
4. 回调内部调用 `petInteraction.handleFloatMessage(100, gestureData)`

**相关文件**:
- ✏️ `pages/index/index.vue` (已修改)
- `pages/index/composables/usePetInteraction.js`
- `pages/index/composables/useFloatWindow.js`

---

### #102 【悬浮窗】长按显示系统菜单而非自定义气泡
**发现时间**: 2025-12-06  
**严重程度**: 🔴 高  
**状态**: ✅ 已修复，待测试  
**测试设备**: Android真机

**问题描述**:  
长按宠物时，显示的是"长按菜单"（系统默认菜单），而不是预期的自定义气泡。

**期望行为**:  
长按宠物2秒 → 显示随机气泡文本（"别按太久~" / "痒痒的！"）

**根本原因**:  
1. touchstart 使用 `passive: true` 导致无法调用 `preventDefault()`
2. 未阻止 `contextmenu` 事件（系统长按菜单）
3. `onLongPress` 函数硬编码显示"📋 长按菜单"文本

**修复方案**:  
1. touchstart 改为 `passive: false`
2. 在 `onDragStart` 中调用 `e.preventDefault()`
3. 添加 `contextmenu` 事件监听器阻止系统菜单
4. 移除 `onLongPress` 中的硬编码文本，改为播放害羞动画等待 AI 响应
5. 添加 `type: 'LONGPRESS'` 字段供手势识别器使用

**相关文件**:
- ✏️ `static/pet.html` (已修改)

---

### #103 【悬浮窗】拖拽到边缘无吸附效果
**发现时间**: 2025-12-06  
**严重程度**: 🟡 中  
**状态**: 🔧 修复中，再次测试  
**测试设备**: Android真机

**问题描述**:  
拖拽悬浮窗到屏幕边缘时，没有出现预期的吸附（磁吸）效果。

**期望行为**:  
拖拽悬浮窗靠近屏幕边缘 → 自动吸附到左边或右边

**测试记录**:
- `setSidePattern(12)` = 四角吸附，效果不明显
- `setSidePattern(1)` = ❌ **仅左侧吸附**，无法移到右边
- `setSidePattern(3)` = 🧪 **测试中** (四边吸附)

**修复方案**:  
改为 `setSidePattern(3)`（四边吸附），期望左右上下都能吸附

**相关文件**:
- ✏️ `pages/index/composables/useFloatWindow.js` (已修改)

---

### #104 【悬浮窗】 空白尺寸
**发现时间**: 2025-12-06  
**严重程度**: 🟡 中  
**状态**: ✅ 已修复，待测试 
**测试设备**: Android真机

**问题描述**:  
悬浮窗尺寸不正确，导致很多空白区域。同时，使宠物不能靠边。

**期望行为**:  
只显示宠物大小，对于显示文字评论对话区域，需要的时候才显示。

**根本原因**:  
- `FLOAT_SIZES.NORMAL` 设为 200x200（太大）
- pet.html 容器固定 160x180，气泡占用固定空间
- 即使气泡隐藏，空间仍被保留

**修复方案**:  
1. **useFloatWindow.js**: 减小 `NORMAL` 尺寸为 100x100
2. **pet.html**: 
   - 容器改为 100x100
   - 气泡使用 `position: absolute` + `bottom: 100%` 悬浮在宠物上方
   - 隐藏时不占用空间

**相关文件**:

---

### #105 【悬浮窗】气泡被截断无法显示
**发现时间**: 2025-12-06  
**严重程度**: 🟡 中  
**状态**: ✅ 已修复，待测试
**测试设备**: Android真机

**问题描述**:  
悬浮窗尺寸改为 100x100 后，气泡无法显示（被悬浮窗边界截断）。

**期望行为**:  
- 默认显示小尺寸宠物（不拦截屏幕点击）
- 显示气泡时自动扩大悬浮窗
- 气泡消失后恢复小尺寸

**修复方案** (已实现):  
1. `showBubble()` 发送 `type=50, size='BUBBLE'` 扩大窗口
2. `hideBubble()` 发送 `type=50, size='NORMAL'` 恢复小尺寸
3. `handleWebMessage` 添加 `case 50` 调用 `setFloatSize()`

**相关文件**:
- ✏️ `static/pet.html` (showBubble/hideBubble)
- ✏️ `pages/index/composables/useFloatWindow.js` (case 50)



## 🟡 中优先级（影响用户体验）

### #4 成就系统数据丢失
**发现时间**: 2025-12-05  
**严重程度**: 🟡 中  
**状态**: 已修复

**问题描述**: 
成就、奖项、徽章等全部丢失。

**相关文件**: 待查

---

### #5 数据全部丢失
**发现时间**: 2025-12-05  
**严重程度**: 🟡 中  
**状态**: 已修复

**问题描述**: 
用户数据全部丢失（需进一步明确是哪些数据）。

**相关文件**: Storage相关

---

### #7 皮肤不会自动应用
**发现时间**: 2025-12-05  
**严重程度**: 🟡 中  
**状态**: 已修复

**问题描述**: 
每次打开应用时，皮肤不会自动应用，一直是默认皮肤。但是"皮肤管理"里显示已切换。

**相关文件**: 
- `pages/index/index.vue`
- `pages/index/composables/useSkin.js`

---

### #9 皮肤切换后按钮皮肤未更新
**发现时间**: 2025-12-05  
**严重程度**: 🟡 中  
**状态**: 已修复

**问题描述**: 
皮肤切换后，点击"收回"和"召唤"按钮的皮肤没有更新。

**日志**:
```
00:11:40.070 [用户操作] 切换宠物显示, {"当前状态":"显示中"}
00:11:40.724 [用户操作] 切换宠物显示, {"当前状态":"隐藏"}
```

**相关文件**: `pages/index/index.vue`

---

### #106 重新编译后，【召唤寄生兽】按键点会报错
**发现时间**: 2025-12-06  
**严重程度**: 🟡 中  
**状态**: 🔧 未修复
**测试设备**: Android真机

**问题描述**:  
现在重新编译会出现，之前【召唤寄生兽】的宠物会仍然存在，但是重新点击【召唤寄生兽】会报错。同时新编译的内容可能不会更新。

**期望行为**:  
【召唤寄生兽】按键点不会报错。

**根本原因**:  

**修复方案**:  



---

## 🟢 低优先级（轻微问题）

### #1 每日问候在悬浮窗启动后没有显示
**发现时间**: 2025-12-05  
**严重程度**: 🟢 低  
**状态**: ✅ 已修复，待测试

**问题描述**:  
用户首次打开应用时，如果悬浮窗尚未开启，每日问候只会添加到聊天记录中。开启悬浮窗时，问候与初始化消息冲突导致快速闪过。

**根本原因**:  
- pet.html 在 800ms 后自动显示 "已寄生..." 消息
- index.vue 在 500ms 后发送待发送问候
- 两者时机冲突

**修复方案**:  
1. 移除 pet.html 中的自动初始化消息
2. 由 index.vue 统一控制初始消息（问候或默认）
3. 将延迟改为 1000ms

**相关文件**:
- ✏️ `static/pet.html` (已修改)
- ✏️ `pages/index/index.vue` (已修改)

---

### #2 聊天心情值不同步
**发现时间**: 2025-12-05  
**严重程度**: 🟢 低  
**状态**: 未修复

**问题描述**:  
【对话】窗口，AI发来心情值减少的消息，但是宠物的状态栏里心情值没有变化。

**相关文件**: 待查

---

### #3 皮肤管理窗口无法滚动
**发现时间**: 2025-12-05  
**严重程度**: 🟢 低  
**状态**: 已修复

**问题描述**: 
皮肤管理 & 皮肤商城窗口大小不适应，无法往下滚动。

**相关文件**: `pages/skin/`

---

### #8 "摇一摇"互动乱触发
**发现时间**: 2025-12-05  
**严重程度**: 🟢 低  
**状态**: 已修复

**问题描述**: 
摇一摇功能过于敏感，容易误触发。

**相关文件**: 
- `static/pet.html` (摇一摇检测逻辑)

**建议**: 提高触发阈值或增加防抖

---

## ⏸️ 待观察/待测试

### #T1 成就解锁触发
**状态**: 刚修复  
**修复内容**: 添加 `checkAchievements()` 触发点
- onShow 延迟 500ms
- sendMessage 后
- sendQuickReply 后

**测试要点**: 验证成就是否正常解锁

---

### #T2 抚摸互动效果
**状态**: 刚修复  
**修复内容**: `interact()` 返回 `{mood, bond}` 对象  
**预期效果**: Toast 提示 + 成长日志

**测试要点**: 点击主界面宠物，检查Toast和日志

---

### #T3 每日统计重置
**状态**: 新增  
**触发条件**: `checkAndResetDailyStats()` 在 onShow 检测日期变化

**测试要点**: 跨天后检查统计是否重置

---

### #T4 睡眠/唤醒系统
**状态**: 未测试  
**来源**: walkthrough.md - Phase 2

**待验证**:
- 验证睡眠/唤醒时机准确性
- 测试梦境生成功能
- 验证自动唤醒条件

**相关文件**: `useSleepWake.js`, `useBehaviorTree.js`

---

### #T5 AI降级策略
**状态**: 未测试  
**来源**: walkthrough.md - Phase 3

**待验证**:
- 测试 AI 降级策略触发条件
- 验证 4 级降级策略正确切换
- 测试网络超时检测

**相关文件**: `useAIFallback.js`, `useAIController.js`

---

### #T6 互动链步骤
**状态**: 未测试  
**来源**: walkthrough.md - Phase 4

**待验证**:
- 验证早晨问候链
- 测试摸鱼警告升级机制
- 测试学习里程碑庆祝
- 调整互动链步骤时长和文案

**相关文件**: `useInteractionChain.js`

---

### #T7 index.vue 集成
**状态**: 部分完成  
**来源**: walkthrough.md

**待完成**:
- 添加降级状态显示 (开发者工具)
- 添加行为树状态可视化

**相关文件**: `pages/index/index.vue`

---

### #T8 性能优化
**状态**: 未开始  
**来源**: walkthrough.md

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
**来源**: implementation_plan.md - 手动测试步骤

**待实现**:
- 快速拖拽宠物向上 → 触发"躲避"动画

**相关文件**: 
- `static/pet.html` (拖拽事件检测)
- `pages/index/composables/useAnimations.js`

---

### #T11 AI动作字段匹配验证
**状态**: 未测试  
**来源**: implementation_plan.md - 手动测试步骤

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
- 替换current Emoji with Lottie animations

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

## 🟢 已修复

（暂无）

---

## 📋 修复优先级建议

1. **P0 (立即修复)**: #101, #102
2. **P1 (本周修复)**: #103, #4, #7
3. **P2 (下次迭代)**: #1, #2, #3, #8, #9

---

## 📝 Bug 报告模板

复制以下模板来报告新 Bug：

```markdown
### #xxx 【模块名】简短描述
**发现时间**: YYYY-MM-DD  
**严重程度**: 🔴/🟡/🟢  
**状态**: 未修复  

**问题描述**:  
详细描述问题现象

**期望行为**:  
正确的表现应该是什么

**复现步骤**:
1. 打开xxx
2. 点击xxx
3. 观察到xxx

**可能原因**:  
初步分析

**相关文件**:
- 文件路径1
- 文件路径2
```
