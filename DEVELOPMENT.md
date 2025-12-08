# WordParasite 开发者指南

> **版本**: v2.0  
> **更新日期**: 2025-12-06  
> **目标读者**: 新加入的开发者、AI 助手

---

## 📚 目录

- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [核心模块详解](#核心模块详解)
- [开发规范](#开发规范)
- [调试与测试](#调试与测试)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 环境要求

- **开发工具**: HBuilderX (标准版 3.0+)
- **框架版本**: uni-app Vue3
- **测试设备**: Android 手机（开发者模式）
- **必需权限**: 悬浮窗权限、应用使用统计权限

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd word-pet
   ```

2. **配置 AppID**
   - 打开 `manifest.json`
   - 获取或配置 DCloud AppID

3. **安装插件**
   - 去 DCloud 插件市场绑定 `android-floatwindow` 插件试用

4. **制作调试基座**
   ```
   HBuilderX 菜单栏 → 运行 → 运行到手机 → 制作自定义调试基座
   ```
   > ⚠️ **重要**: 本项目依赖原生插件，必须使用自定义基座运行

5. **运行项目**
   ```
   运行 → 运行到手机 → 选择自定义调试基座
   ```

---

## 📂 项目结构

### 根目录结构

```
word-pet/
├── pages/                    # 页面目录
│   ├── index/               # [核心] 主控台模块
│   ├── config/              # [配置] 应用/AI 选择器
│   └── log/                 # [日志] 历史记录
├── static/                   # 静态资源
│   ├── logo.png             # 应用图标
│   └── pet.html             # 悬浮窗 WebView 文件
├── uni_modules/             # 原生插件
│   └── android-floatwindow/ # 安卓悬浮窗插件
├── utils/                    # [全局] 通用工具库
├── manifest.json            # 应用配置
├── pages.json               # 路由配置
└── main.js                  # Vue 入口
```

### 核心目录详解

#### 1. `pages/index/` - 主控台模块

采用 **"Composable + Component"** 架构模式：

```
pages/index/
├── components/              # [UI 层] 视图组件
│   ├── ChatPanel.vue       # 聊天面板
│   ├── PetScreen.vue       # 宠物主屏幕
│   ├── StatusPanel.vue     # 状态监控面板
│   ├── ConfigPanel.vue     # 系统设置面板
│   ├── AchievementPanel.vue # 成就弹窗
│   ├── SkinSelector.vue    # 皮肤选择器
│   └── ...                 # 其他组件 (共22个)
├── composables/            # [逻辑层] 组合式函数
│   ├── useFloatWindow.js   # 悬浮窗控制
│   ├── useMonitor.js       # 应用监控
│   ├── useAI.js            # AI 对话
│   ├── useGrowth.js        # 成长系统
│   ├── useSkins.js         # 皮肤管理
│   └── ...                 # 其他模块 (共26个)
├── utils/                  # [工具] 局部工具
│   └── appMapper.js        # 应用包名映射
└── index.vue               # [聚合层] 页面入口
```

#### 2. `utils/` - 全局工具库

```
utils/
├── aiService.js            # AI 服务统一入口
├── aiAdapters.js           # AI 适配器 (DeepSeek/Gemini/Custom)
├── encryptStorage.js       # 加密存储工具
├── debugLog.js             # 调试日志工具
├── appTool.js              # 安卓应用扫描
└── monitor.js              # 监控辅助逻辑
```

---

## 🧩 核心模块详解

### 逻辑层 (Composables)

#### 架构原则

> **S.T.A.C.K.D. 六步思考模型**（详见 uni-app.md 规范）

1. **Structure & Configuration** - 架构与配置优先
2. **Tech Stack Constraints** - 技术栈约束
3. **Adaptability** - 跨端兼容性
4. **Cloud Native** - uniCloud 云原生
5. **Knowledge Verification** - 排错与验证
6. **Documentation Strategy** - 文档策略

#### 核心 Composables 清单

| Composable | 职责 | 行数 | 关键功能 |
|-----------|------|------|---------|
| `useFloatWindow.js` | 悬浮窗控制 | 200 | 显示/隐藏、消息通信、尺寸调整 |
| `useMonitor.js` | 应用监控 | 448 | 前台应用检测、黑白名单、统计 |
| `useGrowth.js` | 成长系统 | 311 | 等级/经验/心情/饥饿/亲密度 |
| `useSkins.js` | 皮肤管理 | 509 | 皮肤扫描/下载/切换/解锁 |
| `useAI.js` | AI 评论 | 200 | 触发宠物评论、聊天对话 |
| `useAIController.js` | AI 控制器 | 250 | 降级策略、上下文构建 |
| `useChat.js` | 聊天系统 | 150 | 消息管理、快捷回复 |
| `useMemory.js` | 记忆系统 | 350 | 对话记录、事实提取 |
| `usePetInteraction.js` | 宠物互动 | 300 | 手势响应、互动链编排 |
| `useBehaviorTree.js` | 行为树 | 287 | 状态管理 (5根+12子状态) |
| `useGestureRecognizer.js` | 手势识别 | 197 | TAP/LONG_PRESS/SWIPE 检测 |
| `useSleepWake.js` | 睡眠系统 | 248 | 自动睡眠/唤醒/做梦 |
| `useAchievements.js` | 成就系统 | 130 | 解锁判定、奖励发放 |
| `useAnimations.js` | 动画管理 | 280 | 状态动画、悬浮窗同步 |
| `usePermissions.js` | 权限管理 | 80 | 悬浮窗/使用统计权限检查 |
| `useTerminal.js` | 伪终端 | 50 | 日志显示 |
| `useVectorMemory.js` | 向量记忆 | 360 | 语义搜索 (Embedding)、知识提取 |
| `useLive2dLoader.js` | Live2D 加载 | 320 | 本地模型加载(Object URL)、表情动作驱动 |

#### Composable 使用模式

**标准初始化流程（以 useFloatWindow 为例）**:

```javascript
// 1. 导入 Composable
import { useFloatWindow } from './composables/useFloatWindow.js';

// 2. 在 setup 中初始化（传入回调）
const floatWindow = useFloatWindow({
  onGestureEvent: (gestureData) => {
    console.log('手势事件:', gestureData);
  },
  addLog: (msg) => {
    console.log('[Float]', msg);
  }
});

// 3. 使用返回的响应式状态和方法
const { 
  isPetShown,           // 状态: 是否显示
  showFloatWindow,      // 方法: 显示悬浮窗
  sendMessageToFloat    // 方法: 发送消息
} = floatWindow;

// 4. 在模板中绑定
```

**Composable 间的依赖注入**:

```javascript
// useMonitor 依赖其他 Composable 实例
const monitor = useMonitor({
  useGrowthIntegration: growth,          // 成长系统实例
  useAIIntegration: ai,                  // AI 实例
  sendToFloat: floatWindow.sendMessageToFloat  // 悬浮窗方法
});
```

---

### 视图层 (Components)

#### 组件分类

**面板组件** (6个):
- `StatusPanel.vue` - 监控数据面板
- `ConfigPanel.vue` - 系统设置面板
- `ChatPanel.vue` - 聊天对话面板
- `AchievementPanel.vue` - 成就展示
- `DiaryPanel.vue` - 成长日记
- `BackpackPanel.vue` - 背包系统

**弹窗组件** (5个):
- `TerminalModal.vue` - 伪终端日志
- `SkinSelector.vue` - 皮肤选择器
- `SkinMarket.vue` - 皮肤商城
- `WordGuessGame.vue` - 单词猜谜小游戏
- `ModalWrapper.vue` - 通用弹窗容器

**核心组件** (3个):
- `PetScreen.vue` - 宠物主屏幕
- `ChatBubble.vue` - 消息气泡
- `StatusBar.vue` - 顶部状态栏

**布局组件** (2个):
- `IndexLayout.vue` - 主页面布局
- `ModalsContainer.vue` - 弹窗容器

#### 组件通信规范

1. **Props Down, Events Up**
   ```vue
   <!-- 父组件 -->
   <ChatPanel 
     :messages="chatMessages"
     @send="handleSendMessage"
   />
   ```

2. **Composable 共享状态**
   ```javascript
   // 多个组件共享同一个 Composable 实例
   provide('growth', growth);
   const growth = inject('growth');
   ```

---

### 工具层 (Utils)

#### AI 系统架构

**适配器模式**:

```
aiService.js (统一接口)
    ├── aiAdapters.js (适配器集合)
    │   ├── DeepSeekAdapter
    │   ├── GeminiAdapter
    │   └── CustomAdapter
    └── encryptStorage.js (密钥加密存储)
```

**调用示例**:

```javascript
import { chatWithAI } from '@/utils/aiService.js';

// 自动使用当前选中的模型
const reply = await chatWithAI(userMessage, systemPrompt, history);
```

#### 调试工具

**debugLog.js** - 分类日志系统:

```javascript
import { logUserAction, logAI, logMonitor, logError } from '@/utils/debugLog.js';

logUserAction('点击宠物', { mood: 80 });
logAI('AI 回复成功', { content: '你好~' });
logMonitor('检测到应用', { appName: '微信' });
logError('组件名', error);
```

> 💡 **关闭日志**: 编辑 `debugLog.js` 设置 `DEBUG_ENABLED = false`

---

## 📐 开发规范

### 1. 文件行数限制

> **防臃肿协议**: 保持文件简洁易维护

#### 分级标准

| 文件类型 | 🎯 理想 | ⚠️ 警告 | ❌ 必须拆分 |
|---------|--------|---------|-----------|
| **Composable** | < 250 行 | 250-400 行 | > 450 行 |
| **index.vue** | < 250 行 | 250-400 行 | > 450 行 |
| **简单组件** | < 200 行 | 200-300 行 | > 350 行 |
| **复杂组件** | < 400 行 | 400-500 行 | > 550 行 |

| **复杂组件** | < 400 行 | 400-500 行 | > 550 行 |

**游戏、商城等功能确实复杂的组件可适当放宽至 600-700 行**

#### 2.1 有效行数 (eLOC) 定义
对于 `.vue` 文件，行数计算采用 **"Effective Lines of Code" (eLOC)** 标准：
- **包含**: `<template>`, `<script>`, `<script setup>`
- **排除**: `<style>` (样式块), 空行 (可选)

> 💡 **提示**: 遇到 Vue 文件行数警告时，请先检查是否是样式代码过多。如果是，请忽略警告或提取 CSS 文件。

**检查清单**:
- ✅ Composable 是否单一职责？
- ✅ index.vue 是否只做组装和绑定？
- ✅ 复杂逻辑是否已封装到 Composable？
- ✅ 是否可以拆分为多个子组件？

### 2. Index 净化协议

`pages/index/index.vue` **仅作为组装容器**:

```vue
<script setup>
// ✅ 正确: 只做引入和简单绑定
import { useFloatWindow } from './composables/useFloatWindow.js';
import { useMonitor } from './composables/useMonitor.js';

const floatWindow = useFloatWindow({ /* ... */ });
const monitor = useMonitor({ /* ... */ });

// ❌ 错误: 不应在这里写业务逻辑
const handleComplexLogic = () => {
  // 复杂的计算...
  // 应该封装到 Composable 中
};
</script>
```

### 3. 逻辑闭环协议

**触发器审查**: 每个新功能必须有调用代码

```javascript
// ❌ 错误: 只定义，不调用（Dead Code）
const { checkAchievements } = useAchievements();

// ✅ 正确: 在适当时机调用
onShow(() => {
  checkAchievements();
});

watch(() => growth.petXP.value, () => {
  checkAchievements(); // 升级时检查
});
```

### 4. 生命周期规范

| 场景 | 使用 | 禁止 |
|------|------|------|
| **页面组件** | `onLoad`, `onShow` | `onMounted` |
| **普通组件** | `onMounted` | `onLoad` |
| **接收路由参数** | `onLoad((options) => {})` | `onMounted` |

```javascript
// ✅ 页面组件 - 正确
onLoad((options) => {
  const { id } = options; // 获取路由参数
});

onShow(() => {
  // 页面显示时的逻辑
});

// ❌ 页面组件 - 错误
onMounted(() => {
  // 无法获取路由参数！
});
```

### 5. API 兼容性规范

| Web API (❌) | uni-app API (✅) |
|-------------|-----------------|
| `localStorage.setItem()` | `uni.setStorageSync()` |
| `window.location.href` | `uni.navigateTo()` |
| `alert()` | `uni.showModal()` |
| `fetch()` / `axios` | `uni.request()` |

### 6. 条件编译

跨端差异使用条件编译包裹:

```javascript
// #ifdef APP-PLUS
// 仅 App 端代码
const context = plus.android.runtimeMainActivity();
// #endif

// #ifdef H5
// 仅 H5 端代码
window.addEventListener('resize', handler);
// #endif

// #ifdef MP-WEIXIN
// 仅微信小程序代码
wx.login();
// #endif
```

### 7. 响应式数据规范

```javascript
// ✅ 正确: 使用 ref/reactive
const mood = ref(80);
const state = reactive({ level: 1 });

// 修改值
mood.value = 90;
state.level = 2;

// ✅ 传递给子组件时解构
const { petLevel, petXP } = useGrowth();

// ❌ 错误: 解构后丢失响应性
const { value: moodValue } = ref(80); // 变成普通值
```

---

## 🐛 调试与测试

### 1. 使用终端日志

**打开方式**: 
```
主页 → 系统设置 → 🖥️ 监控终端
```

**实时查看**:
- Native.js 调用日志
- 应用监控事件
- 成长系统变化

### 2. 开发者测试功能

**快速升级宠物**:
```javascript
// 在 ConfigPanel.vue 中
const testLevelUp = () => {
  for (let i = 0; i < 10; i++) {
    growth.addXP(100);
  }
};
```

**快速增加金币**:
```javascript
const testAddCoins = () => {
  growth.changeCoins(1000);
};
```

### 3. 真机调试

**必须真机测试的功能**:
- ✅ 悬浮窗显示
- ✅ 应用监控
- ✅ 手势识别
- ✅ 权限申请

**模拟器可测试**:
- ✅ UI 布局
- ✅ AI 对话
- ✅ 聊天系统

### 4. 常用调试命令

```javascript
// 查看当前存储
console.log('宠物数据:', uni.getStorageSync('pet_growth_data'));

// 清空所有数据
uni.clearStorageSync();

// 检查权限状态
permissions.checkPermissions();
```

---

## ❓ 常见问题

### Q1: 编译后悬浮窗无法显示？

**原因**: 插件未重新打包到基座

**解决**:
1. 删除旧的自定义基座
2. 重新制作自定义调试基座
3. 运行时选择新基座

### Q2: Native.js 报错 "Class not found"？

**原因**: 未在真机运行或权限不足

**解决**:
1. 确保在真机运行
2. 检查 `manifest.json` 权限配置
3. 查看终端日志详细错误

### Q3: 数据丢失怎么办？

**原因**: 存储 key 冲突或编码问题

**解决**:
1. 使用 `encryptStorage.js` 统一存储
2. 检查 key 命名（避免特殊字符）
3. 定期备份数据

### Q4: 如何新增一个功能模块？

**标准流程**:

1. **创建 Composable** (如果有业务逻辑)
   ```bash
   pages/index/composables/useNewFeature.js
   ```

2. **创建 Component** (如果有 UI)
   ```bash
   pages/index/components/NewFeaturePanel.vue
   ```

3. **在 index.vue 中集成**
   ```javascript
   import { useNewFeature } from './composables/useNewFeature.js';
   const newFeature = useNewFeature();
   ```

4. **更新文档**
   - `FEATURES.md` - 添加功能说明
   - `ARCHITECTURE.md` - 更新架构图
   - `UPDATES.md` - 记录更新日志

### Q5: 为什么有些功能在 H5 不生效?

**原因**: 依赖原生 API (Native.js)

**不支持 H5 的功能**:
- ❌ 悬浮窗
- ❌ 应用监控
- ❌ 系统权限申请

**解决**: 使用条件编译提供降级方案

---

## 📚 扩展阅读

- 📖 [架构设计文档](./ARCHITECTURE.md) - 深入理解系统设计
- ✨ [功能清单](./FEATURES.md) - 完整功能说明
- 🤖 [AI 使用指南](./AI_GUIDE.md) - AI 系统配置
- 🛡️ [Bug 防范指南](./bug_prevention_guide.md) - 18 个易错案例
- 🎮 [悬浮窗用户指南](./FLOAT_WINDOW_GUIDE.md) - 互动系统说明

---

**更新时间**: 2025-12-06  
**维护者**: WordParasite Team  
**License**: MIT

---

## 💻 核心代码逻辑索引

### A. 监控逻辑 (Monitor)

位于 `utils/monitor.js`。

**核心实现**:
```javascript
// Native.js 调用 Android 原生 API 获取前台包名
var usm = context.getSystemService(Context.USAGE_STATS_SERVICE);
var stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, ...);
// 遍历获取 lastTimeUsed 最大的应用
```

详见 `useMonitor.js` 的 `checkCurrentApp()` 方法。

### B. 悬浮窗渲染 (Visual)

位于 `pages/index/index.vue` 及 `static/pet.html`。

**关键代码**:
```javascript
// 使用 plus.io.convertLocalFileSystemURL 加载本地 HTML
const htmlPath = plus.io.convertLocalFileSystemURL('_www/static/pet.html');
```

确保离线可用，无需网络请求。

### C. App 跳转 (Launcher)

**唤起外部应用**:
```javascript
plus.runtime.openURL("package-name://...", (err) => {
  uni.showModal({ content: "请先安装背单词软件" });
});
```

---

## 📚 扩展阅读

- 📖 [架构设计文档](./ARCHITECTURE.md) - 深入理解系统设计
- ✨ [功能清单](./FEATURES.md) - 完整功能说明
- 🤖 [AI 使用指南](./AI_GUIDE.md) - AI 系统配置
- 🛡️ [Bug 防范指南](./bug_prevention_guide.md) - 18 个易错案例
- 🎮 [悬浮窗用户指南](./FLOAT_WINDOW_GUIDE.md) - 互动系统说明

---

**更新时间**: 2025-12-06  
**维护者**: WordParasite Team  
**License**: MIT
