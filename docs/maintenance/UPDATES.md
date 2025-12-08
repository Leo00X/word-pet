- 支持部位：头部、身体、左手、右手、左脚、右脚
- 每个部位可独立点击/长按，触发不同 AI 响应
- 部位动画：摇头、点头、挥手、击掌、踢腿、跺脚

**技术架构**:
- 新增 `usePetParts.js` Composable (240行)
  - 部位配置与 AI Prompt 模板
  - 心情/亲密度变化计算
  - 触摸统计和持久化
- `pet.html` 分层宠物支持 (+310行)
  - CSS 部位定位与动画 (+160行)
  - HTML 6部位结构 (+22行)
  - JS 部位点击检测 (+130行)
- `usePetInteraction.js` 集成部位系统 (+40行)

**皮肤系统扩展**:
- 新增 `static/skins/default-ghost/` 目录
- 创建 `skin.json` 分层皮肤配置文件
- 支持 Emoji 和图片双模式部位资源

**消息协议扩展**:
- 类型 97: 切换分层模式
- 类型 98: 部位动画指令 (扩展)
- 类型 100: 部位点击事件 (PART_TAP / PART_LONG_PRESS)

**相关文件**:
- `pages/index/composables/usePetParts.js` (新建)
- `pages/index/composables/usePetInteraction.js` (修改)
- `static/pet.html` (大幅修改)
- `static/skins/default-ghost/skin.json` (新建)

---

## 🎉 2025-12-08 (Live2D) - Live2D 系统集成与 UI 重构

### ✨ 新增功能

**Live2D 动态立绘系统**:
- **本地加载引擎 (Object URL)**: 独创方案解决 `File` 对象加载限制，无需 Web Server 即可运行。
- **双内核支持**: 兼容 Cubism 2.1 (Shizuku) 和 Cubism 4.0 (Hiyori) 模型。
- **情感交互**: AI `angry`/`happy` 标签实时驱动模型表情和动作。
- **动态气泡 UI**: 
  - 气泡显示时悬浮窗自动向上伸展。
  - 模型固定底部显示，气泡显示在顶部扩展区。
  - 支持 `angry` 红色警示样式。

**点击穿透优化**:
- 悬浮窗非交互区域（透明背景）完全点击穿透。
- 仅 Live2D Canvas 接收点击事件。

**相关模块**:
- `static/pet-live2d.html` - 新版渲染容器 (320行)
- `pages/index/composables/useLive2dLoader.js` - 本地加载器
- `pages/index/composables/useFloatWindow.js` - 动态尺寸调整

### 🐛 Bug 修复

修复了 2 个相关问题：
- **"Unknown settings JSON"**: 使用 Object URL 映射彻底解决本地加载路径解析问题。
- **气泡截断**: 通过动态调整悬浮窗高度（普通 220px -> 气泡显示 280px）解决模型被遮挡问题。

详细修复记录请查阅 [BUG.md](./BUG.md)

---

## 🎉 2025-12-08 - 热区 AI 混合响应系统上线

### ✨ 新增功能

**热区 AI 混合响应 (Hybrid AI Interaction)**:
- **精准热区**: 重新映射 622x646 像素热区，支持头部/身体/四肢独立交互
- **混合策略**:
  - 本地快速响应 (0-7 Click): 零延迟本地回复，带心情分级
  - 随机 AI 介入 (30% + Mood Bonus): 增加不确定性惊喜
  - 强制 AI 深度对话 (>8 Click): 触发联网 AI 完整人格对话
- **API 修复**: 修复 H5 与 uni-app 通信问题，确保点击事件 100% 传达

**相关模块**:
- `usePetInteraction.js` - 策略控制引擎
- `usePetParts.js` - 本地词库与心情加成逻辑
- `pet-v2.html` - 通信层重构 (`uniapp.sendDataToUni`)

### 🐛 Bug 修复

修复了 3 个相关问题：
- Bug #111 [悬浮窗] 回桌面几秒消失 (onHide 逻辑修复)
- 热区点击仅显示"被点击"硬编码文本 (移除冗余代码)
- H5 点击事件无法传递给 App (API 兼容性修复)

详细修复记录请查阅 [BUG.md](./BUG.md)

---

## 🎉 2025-12-07 (晚间) - AI 系统增强 + Bug 修复

### ✨ 新增功能

**日记 AI 自动降级系统**:
- 新增 `chatWithFallback()` 方法
- 15秒超时自动切换下一个 AI 模型
- 轮询所有已配置的可用模型
- 优先使用 Gemini 系列

**向量记忆系统 (HCDS Phase 5)**:
- 新增 `useVectorMemory.js` Composable
- 集成到 index.vue

**每日心情记录**:
- 新增 `todayMoodStart` 状态
- 自动跨天检测和重置
- 日记面板显示真实心情变化

### 🐛 Bug 修复

- **API Key 加密问题**: 使用 `WPEN_` 前缀可靠识别加密数据
- **日记心情数据**: 修复 moodStart 硬编码为 50 的问题

**相关文件**:
- `utils/aiService.js` - 新增 chatWithFallback、getAvailableModels、withTimeout
- `utils/encryptStorage.js` - 修复加密识别逻辑
- `composables/useGrowth.js` - 新增 todayMoodStart、checkDayChange
- `composables/useVectorMemory.js` - 向量记忆系统（新建）

---

## 🎉 2025-12-07 - 代码质量审查与重构完成

### ✅ 代码审查

**全项目扫描**:
- 审查 53 个代码文件
- 识别 8 个潜在问题（3高优先级，5低风险）
- 生成完整审查报告

### 🐛 Bug 修复（7个）

**高优先级 Bug**:
- #NEW-1: usePetInteraction 数据不一致 - 参数注入修复
- #NEW-4: AI 上下文消息顺序错误 - 移除 reverse()
- #107: 日记历史功能缺失 - 创建 diary-history.vue
- #108: 弹窗无法打开（回归） - computed 赋值修复
- #101: 悬浮窗互动无响应 - 功能集成

**中/低优先级 Bug**:
- #109: 皮肤同步丢失（回归） - 添加 syncSkinToFloat
- #NEW-6: 调试代码清理 - 替换为 debugLog

**相关文件**:
- `usePetInteraction.js`, `useChat.js`, `useIndexHandlers.js`
- `pages/diary/diary-history.vue` (新建，236行)
- `index.vue`, `BUG.md`

### 🔧 index.vue 重构

**重构成果**:
- **Before**: 832 行（业务逻辑混杂）
- **After**: 419 行（清晰简洁）
- **减少**: 413 行 (-50%)

**新增 Composables**:
- `usePageLifecycle.js` (117行) - 页面生命周期管理
- `useChatHandlers.js` (90行) - 聊天事件处理
- *(集成)* `useIndexState.js`, `useIndexHandlers.js`

**架构改进**:
- ✅ 完全符合 "Index净化协议"
- ✅ 业务逻辑全部提取到 Composables
- ✅ index.vue 仅作组件容器

### 📈 质量指标

- ✅ Bug 修复率: 7/7 (100%)
- ✅ 真机验证: 全部通过
- ✅ 架构合规: 符合 Composable+Component 模式
- ✅ 文件行数: index.vue < 450行限制

详细修复记录请查阅 [BUG.md](./BUG.md) 和 [walkthrough.md](../../brain/ed71bc37-bd83-4abe-80e6-d440036c0689/walkthrough.md)

---

## 📚 2025-12-06 - 文档体系优化完成

### ✨ 新增功能

**文档分类体系**:
- 创建 `docs/guides/` - 用户指南
- 创建 `docs/maintenance/` - 维护文档
- 创建 `docs/archive/` - 历史文档
- 整理根目录文档（13个→4个核心文档）

**标准化开发流程**:
- 创建 8 个 workflows（完整开发周期）
  - 学习指南（2个）
  - 开发流程（3个）
  - 质量保证（1个）
  - 文档管理（1个）
  - 版本管理（1个）

**AI 协作优化**:
- 精简 Rules 文件（150行，聚焦核心原则）
- 明确文档引用优先级
- 创建《项目文档基础搭建指南》

**相关优化**:
- `bug_prevention_guide.md` - 756行→249行（倒金字塔结构）
- `UPDATES.md` - 410行→219行（职责分离）
- workflows 命名规范化（数字前缀分类）

**技术亮点**:
- 倒金字塔原则：重要信息前置（前50行包含核心内容）
- 文档职责清晰分工：各司其职，不重复
- AI 友好设计：快速定位关键信息

---

## 🎉 2025-12-06 - 悬浮窗交互系统完成

### ✨ 新增功能

**悬浮窗交互优化**:
- 手势识别系统（点击、长按、拖拽）
- AI 响应气泡显示
- 智能尺寸切换（默认小尺寸，显示气泡时自动扩大）
- 边缘吸附效果

**相关模块**:
- `usePetInteraction.js` - 宠物互动逻辑
- `useGestureRecognizer.js` - 手势识别
- `pet.html` - 悬浮窗 WebView

### 🐛 Bug 修复

修复了 5 个悬浮窗相关问题：
- 点击宠物 AI 响应气泡不显示
- 长按出现系统菜单而非自定义气泡
- 气泡被窗口边界截断
- 尺寸配置不合理

详细修复记录请查阅 [BUG.md](./BUG.md)

---

## 🎉 2025-12-05 01:45 - 聊天对话窗口升级

### ✨ 新增功能

**相对时间显示**:
- 智能时间格式（刚刚/5分钟前/昨天/12-04）

**聊天历史分页加载**:
- 默认显示最近 3 条消息
- 点击按钮加载更早的 10 条消息

**多轮对话上下文记忆**:
- AI 可以基于之前的对话内容做出更连贯的回复
- 支持 DeepSeek/Gemini/自定义模型

### 🐛 Bug 修复

- 修复聊天输入框响应式丢失
- 修复历史消息显示混乱
- 优化消息存储顺序

---

## 🤖 2025-12-05 01:45 - AI 多模型系统

### ✨ 核心成果

**支持的 AI 模型**:
1. **DeepSeek V3.2** - 高性价比国产模型
2. **Gemini 2.5 Flash** - Google 快速响应模型
3. **Gemini 2.5 Pro** - Google 高级推理模型
4. **自定义模型** - 兼容 OpenAI API 格式

**安全特性**:
- API Key 使用 XOR 加密存储
- 一键切换模型
- 连接测试功能

**新增文件**:
- `utils/aiService.js` - AI 服务统一入口
- `utils/aiAdapters.js` - AI 适配器
- `utils/encryptStorage.js` - 加密存储工具
- `pages/index/composables/useAIConfig.js` - AI 配置管理
- `pages/config/ai-selector.vue` - AI 模型选择页面
- `AI_GUIDE.md` - AI 系统使用指南

### 🎨 技术亮点

Gemini 已支持 OpenAI 兼容端点，代码极大简化：
```javascript
// 使用标准 OpenAI 格式
const url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
```

---

## 💬 2025-12-04 - 聊天对话窗口功能

### ✨ 核心特性

- 💬 App 内独立聊天 Tab
- 🤖 AI 对话（携带宠物状态上下文）
- 💾 消息历史持久化（最近100条）
- ⚡ 4 个快捷回复按钮
- 🎨 赛博朋克风格 UI

**新增文件**:
- `pages/index/composables/useChat.js` - 聊天系统逻辑
- `pages/index/components/ChatPanel.vue` - 聊天面板
- `pages/index/components/ChatBubble.vue` - 消息气泡组件

---

## 📊 宠物成长系统（代码层面）

### ⚠️ 重要提示
虽然成长系统的代码已创建，但**尚未集成到主界面和监控系统**，用户暂时无法看到数值变化效果。

### 已创建的功能代码

**核心数值模型**:
- 等级 (Level): 1-99
- 经验值 (XP): 通过学习获得
- 心情值 (Mood): 0-100
- 金币 (Coins): 学习奖励
- 饥饿度 (Hunger): 0-100
- 亲密度 (Bond): 0-100

**宠物形态系统**:
- 4 种宠物类型（幽灵、中华田园犬、玄凤鹦鹉、和尚鹦鹉）
- 6 种形态状态（蛋形态、幼年、成年、邪恶、天使、机械）

**奖惩机制**:
- 学习奖励（5-60分钟不同奖励）
- 摸鱼惩罚（10-180分钟不同惩罚）
- 自然衰减（每小时饥饿度 -5）

**已创建文件**:
- `pages/index/composables/useGrowth.js` - 成长系统核心逻辑
- `pages/index/utils/growthFormula.js` - 数值计算公式
- `pages/index/utils/petForms.js` - 宠物形态配置

---

## 📚 相关文档

- **[BUG.md](./BUG.md)** - 详细的 Bug 追踪和修复记录
- **[AI_GUIDE.md](../guides/AI_GUIDE.md)** - AI 多模型系统使用指南
- **[README.md](../../README.md)** - 项目总体介绍

---

**最后更新**: 2025年12月7日
