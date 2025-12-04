👾 WordParasite (单词寄生兽) | Desktop AI Companion

"It watches you. It judges you. It forces you to learn."

一个基于 Android 原生能力的桌面 AI 伴侣。它不是单词书，它是住在你手机桌面上、在你摸鱼时“重拳出击”的毒舌监督者与陪伴。

📖 项目背景与定位 (Concept)

💡 **核心理念：从“内容提供”转向“行为监督”**

市面上已经有足够优秀的背单词 App（如“词根单词”、“墨墨”）。WordParasite 不重复造轮子去维护海量词库，而是定位为 **“学习伴侣/监督者” (Study Companion/Tracker)**。

* **它的角色**：不教你背单词，但逼你去背单词。
* **它的形态**：一只寄生在手机桌面的像素宠物，拥有 Gemini AI 赋予的“毒舌”人格。

---

📱 App 界面与功能指南 (User Guide)

本项目采用 **赛博朋克/复古像素 (Cyberpunk/Pixel)** 设计风格，将手机视为“宿主”，App 为“控制终端”。

### 1. 主控台 (Main Dashboard)
进入 App 首页，您将看到模拟掌机的操作界面：
* **状态监视屏**：
    * **宠物投影**：显示当前寄生兽的形象（悬浮/静止）。
    * **HP (心情)**：根据您的行为变化。摸鱼扣血，学习回血。
    * **XP (经验)**：积累学习时长升级。
    * **实时交互**：点击屏幕中的宠物，它会随机弹出气泡对话。

### 2. 状态监控 (Status Tab)
点击下方 **“状态监控”** 切换卡片：
* **系统连接指示灯**：
    * `悬浮窗`：检测悬浮权限状态（🟢正常 / 🔴断开）。
    * `监控权`：检测 UsageStats 权限状态。
* **核心操作键**：
    * **🟢 召唤寄生兽 (SUMMON)**：在桌面生成悬浮窗。
    * **🔴 收回寄生兽 (RECALL)**：关闭悬浮窗。
    * **👁 开启全域监控 (START MONITOR)**：启动后台轮询服务，开始记录应用使用情况。
* **📝 成长日记 (Growth Log)**：
    * 实时显示最近 3 条行为记录（如“投喂成功”、“误食毒药”）。
    * 点击 **“查看全部档案”** 可进入历史记录页，查看所有过往数据（支持本地持久化存储）。

### 3. 系统设置 (Config Tab)
点击下方 **“系统设置”** 切换卡片：
* **🍖 投喂规则 (Whitelist / 白名单)**：
    * 点击进入 **应用选择器**。
    * 勾选您的学习软件（如：墨墨背单词、多邻国）。
    * **效果**：使用这些软件时，宠物心情增加，经验增加。
* **☠️ 禁忌物品 (Blacklist / 黑名单)**：
    * 点击进入 **应用选择器**。
    * 勾选您的娱乐软件（如：抖音、王者荣耀）。
    * **效果**：使用这些软件时，宠物心情大减，触发毒舌警告或红色暴怒模式。
* **⚡ 扫描频率 (Power Saving)**：
    * **极速 (3s)**：反应最快，但耗电。
    * **省电 (60s)**：仅用于统计时长，适合后台挂机。
* **🖥️ 监控终端 (Terminal)**：
    * 点击打开黑客风格的 **日志控制台**，查看底层 Native.js 的实时扫描日志与报错信息。

---

🌟 核心功能 (Key Features)

1. **👻 真·桌面悬浮宠物 (Global Floating Window)**
    * 利用 Android 系统级悬浮窗权限，让宠物始终“寄生”在屏幕边缘。
    * **情绪反馈**：
        * **开心模式**：检测到白名单应用（背单词），宠物发送鼓励气泡（“好耶！是精神食粮！”）。
        * **暴怒模式**：检测到黑名单应用（摸鱼），宠物变身并发送警告（“你在干什么？！快去背单词！💢”）。

2. **👁️ 上帝之眼：无感监控 (Usage Stats Monitor)**
    * **技术原理**：通过 Native.js 调用 Android `UsageStatsManager`，毫秒级轮询当前前台应用包名。
    * **智能判别**：自动识别用户是在“学习”还是“摸鱼”，并根据黑白名单配置进行奖惩。

3. **🧠 AI 注入灵魂 (Gemini Persona)** [WIP]
    * 接入 Google Gemini API，让宠物拥有记忆。
    * **Prompt 设定**：“你是一只傲娇的电子猫。看到用户今天刷了2小时抖音只背了5分钟单词。请生成一句50字以内的毒舌嘲讽。”

4. **⚡ 本地化存储与缓存**
    * **应用列表缓存**：首次扫描后自动缓存已安装应用列表，实现“秒开”选择页。
    * **数据持久化**：心情值、经验值、历史日记均写入本地 Storage，杀后台不丢失。

---

🛠️ 技术架构 (Tech Stack)

* **IDE**: HBuilderX (强依赖 AST 语法提示)
* **框架**: uni-app (Vue3) + UTS
* **核心插件**:
    * `android-floatwindow` (UTS): 处理悬浮窗与 WebView 通信。
    * Native.js: 处理 Android 原生权限申请、应用列表扫描、前台应用监控。

📂 目录结构 | Project Structure

```text

word-pet/                          # 项目根目录
├── .hbuilderx/                    # IDE 配置文件
├── pages/
│   ├── config/
│   │   └── app-selector.vue       # [配置] 应用选择器页面
│   ├── index/                     # [核心] 主控台模块
│   │   ├── components/            # [UI] 视图组件层
│   │   │   ├── ConfigPanel.vue    # 设置面板
│   │   │   ├── PetScreen.vue      # 宠物主屏幕 (动画/交互)
│   │   │   ├── StatusBar.vue      # 顶部状态栏
│   │   │   ├── StatusPanel.vue    # 监控数据面板
│   │   │   ├── TabSwitch.vue      # 底部功能切换
│   │   │   └── TerminalModal.vue  # 伪终端日志弹窗
│   │   ├── composables/           # [逻辑] 组合式函数 (Hooks)
│   │   │   ├── useAI.js           # AI 对话与交互逻辑
│   │   │   ├── useFloatWindow.js  # 安卓悬浮窗控制
│   │   │   ├── useGrowthLog.js    # 电子宠物成长日志
│   │   │   ├── useMonitor.js      # 应用监控核心逻辑
│   │   │   └── usePermissions.js  # 权限申请与校验
│   │   ├── utils/                 # [工具] 局部工具
│   │   │   └── appMapper.js       # 应用包名映射表
│   │   └── index.vue              # 主控台入口 (聚合层)
│   └── log/
│       └── log-history.vue        # [日志] 历史记录页面
├── static/
│   ├── logo.png                   # 应用图标
│   └── pet.html                   # 宠物 Webview 本地文件
├── uni_modules/
│   └── android-floatwindow/       # 安卓悬浮窗原生插件
├── unpackage/                     # 编译输出目录
├── utils/                         # [全局] 通用工具库
│   ├── appTool.js                 # 安卓应用扫描/工具集
│   ├── deepseek.js                # [新] DeepSeek API 接口封装
│   └── monitor.js                 # 监控辅助逻辑 (旧版/通用)
├── App.vue                        # 应用生命周期管理
├── index.html                     # H5 宿主页面模板
├── main.js                        # Vue 初始化入口
├── manifest.json                  # 应用配置 (权限/图标等)
├── pages.json                     # 路由与窗口样式配置
├── README.md                      # 项目说明文档
├── REFACTORING.md                 # [新] 重构计划与进度记录
├── uni.promisify.adaptor.js       # Promise 适配器
└── uni.scss                       # 全局 SCSS 变量/样式
````

🚀 快速开始 | Getting Started

⚠️ **注意：本项目必须制作自定义调试基座才能运行。**

1.  **环境准备**

      * 下载 HBuilderX。
      * 准备 Android 手机（开启开发者模式）。

2.  **插件配置**

      * 在 `manifest.json` 中获取 DCloud AppID。
      * 去插件市场绑定 `android-floatwindow` 试用。

3.  **运行项目**

      * 连接手机。
      * 菜单栏：运行 -\> 运行到手机 -\> **制作自定义调试基座**。
      * 基座制作完成后，选择 **“自定义调试基座”** 运行。



✅ 开发进度 | Roadmap

[x] 基础设施搭建 (Vue3 + Native.js)
[x] 核心能力实现 (悬浮窗 + 应用统计权限)
[x] 界面重构 (赛博朋克像素风 UI)
[x] 黑白名单系统 (应用扫描 + 本地存储)
[x] 成长日记 (数据持久化 + 历史回顾)
[x] AI 接入 (Deepseek-V3.2 API)
[ ] 交互与视觉升级 (Chat & UI) NEW
    [ ] 悬浮窗双层渲染架构 (Avatar常驻层 + ChatBox交互层) —— 实现气泡对话与输入
    [ ] Uni-app 与 WebView 双向通信桥接 (Event Bridge)
    [ ] 宠物状态可视化映射 (基于等级/心情切换 Egg -> Teen -> Adult 贴图)
[ ] 游戏化成长系统 (Gamification) NEW
    [ ] 核心数值系统 (XP/金币/等级) 与持久化存储
    [ ] 摸鱼惩罚机制 (监控数据联动心情值 Mood Decay)
    [ ] 奖励反馈循环 (背单词 +Coin/XP)
[ ] 数字灵魂架构 (Digital Soul - HCDS) From Doc
    [ ] 混合记忆引擎：基于 SQLite 的本地向量存储 (Vector) + 简易知识图谱 (Graph)
    [ ] 认知循环 (PMRA Loop)：实现感知-记忆-反思-行动的自主闭环
    [ ] 睡眠与反思机制：在充电/闲置时触发记忆整理与摘要 (Reflection Job)
    [ ] 动态人格演化：基于大五人格 (Big Five) 的性格向量，随交互历史动态改变 Prompt
[ ] 新增联网宠物（github）、本地宠物的选择
[ ] 优化宠物情绪动画及情绪系统 (根据应用包名改变表情)
[ ] 屏幕强制干扰功能（宠物变大）

📄 License

MIT License.

Created by WordParasite Team with HBuilderX & uni-app.


---

📂 核心代码逻辑索引

A. 监控逻辑 (Monitor)

位于 utils/monitor.js。

// Native.js 调用 Android 原生 API 获取前台包名
var usm = context.getSystemService(Context.USAGE_STATS_SERVICE);
var stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, ...);
// ...遍历获取 lastTimeUsed 最大的应用...


B. 悬浮窗渲染 (Visual)

位于 pages/index/index.vue 及 static/pet.html。
使用 plus.io.convertLocalFileSystemURL 加载本地 HTML 资源，确保离线可用。

C. App 跳转 (Launcher)

plus.runtime.openURL("package-name://...", (err) => {
    uni.showToast({title: "请先安装背单词软件"});
});


📄 License

MIT License.
Created by WordParasite Team.

---

## 🎉 代码重构成就 (2025-12-04)

### ✅ 模块化重构完成

原始 `pages/index/index.vue` (761行) 已成功拆分为组件化架构：

**新增文件结构**：
```
pages/index/
├── index.vue (~350行)          # 主控台（集成所有业务逻辑）
├── components/                  # UI 组件层（6个组件）
│   ├── StatusBar.vue           # 顶部状态栏（等级、金币）
│   ├── PetScreen.vue           # 宠物显示屏（头像、气泡、属性条）
│   ├── TabSwitch.vue           # Tab 切换器
│   ├── StatusPanel.vue         # 状态监控面板
│   ├── ConfigPanel.vue         # 配置面板
│   └── TerminalModal.vue       # 终端弹窗
├── composables/                 # 业务逻辑层
│   └── useAI.js                # AI 评论系统
└── utils/                       # 工具函数
    └── appMapper.js            # 应用名称映射
```

**重构成果**：
- 📉 主文件代码量减少 **54%** (761行 → 350行)
- 🧩 创建 **6个可复用UI组件**
- ✅ 保持 **100%功能完整性**
- 📚 提升代码可维护性和可读性
- 🎯 每个组件职责单一，易于测试和调试

```
---
### 增加一个聊天对话窗口功能和宠物成长系统

聊天系统
💬 App内独立聊天Tab
🤖 AI对话（携带宠物状态上下文）
💾 消息历史持久化（最近100条）
⚡ 4个快捷回复按钮
成长系统
📊 6维数值模型（等级/经验/心情/金币/饥饿/亲密）
🎭 4种宠物类型（幽灵🐕🦜，使用emoji显示）
🌟 6种形态状态（蛋→幼年→成年→特殊形态）
🎮 完整奖惩机制（学习奖励/摸鱼惩罚/自然衰减）
📝 新增/修改文件
新增6个文件：

useGrowth.js, useChat.js
growthFormula.js, petForms.js
ChatPanel.vue, ChatBubble.vue
修改4个文件：

index.vue, PetScreen.vue, TabSwitch.vue, useAI.js
📖 如何使用
查看聊天：切换到"💬 对话"Tab，与宠物AI对话
查看数值：主屏幕显示4个进度条（心情/经验/饥饿/亲密）
宠物emoji：会根据等级和心情自动切换形态

---
### 可用的日志函数
如果您想在其他地方添加日志，可以导入并使用：

```javascript
import { debugLog, logUserAction, logAI, logMonitor, logError, logSuccess } from '@/utils/debugLog.js';

// 记录用户操作
logUserAction('操作名称', { 详细信息 });

// AI 相关日志
logAI('AI 请求成功', { 回复内容 });

// 监控相关
logMonitor('检测到应用', { appName: '微信' });

// 错误日志
logError('组件名', error);

// 成功提示
logSuccess('操作成功！');
```

### 关闭日志
如果不需要调试日志，可以编辑 
utils/debugLog.js
文件：

```javascript
const DEBUG_ENABLED = false; // 设置为 false 关闭所有日志
```

