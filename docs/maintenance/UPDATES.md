> **文档定位**: 记录功能发布和重大更新  
> **Bug 追踪**: 详细的 Bug 修复记录请查阅 [BUG.md](./BUG.md)

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

**最后更新**: 2025年12月6日
