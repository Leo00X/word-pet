👾 WordParasite (单词寄生兽) | Desktop AI Companion

"It watches you. It judges you. It forces you to learn."

一个基于 Android 原生能力的桌面 AI 伴侣。它不是单词书，它是住在你手机桌面上、在你摸鱼时“重拳出击”的毒舌监督者。

📖 项目背景与定位 (Concept)

💡 核心理念：从“内容提供”转向“行为监督”

市面上已经有足够优秀的背单词 App（如“词根单词”、“墨墨”）。WordParasite 不重复造轮子去维护海量词库，而是定位为 “学习伴侣/监督者” (Study Companion/Tracker)。

它的角色：不教你背单词，但逼你去背单词。

它的形态：一只寄生在手机桌面的像素宠物，拥有 Gemini AI 赋予的“毒舌”人格。

🌟 核心功能 (Key Features)

1. 👻 真·桌面悬浮宠物 (Global Floating Window)

利用 Android 系统级悬浮窗权限，让宠物始终“寄生”在屏幕边缘，无法被轻易忽视。

动态交互：基于 WebView 渲染，支持 GIF/Lottie 动画，宠物会眨眼、跳动。

情绪系统：

开心模式：检测到前台是背单词软件时，宠物转圈圈加经验。

暴怒模式：检测到你在刷抖音/B站超过 10 分钟，宠物变身“恶魔”，挡住字幕或弹窗警告。

2. 👁️ 上帝之眼：无感监控 (Usage Stats Monitor)

无需手动打卡，App 拥有“上帝视角”。

技术原理：通过 Native.js 调用 Android UsageStatsManager，毫秒级轮询当前前台应用包名。

场景：

你在背单词 -> 自动记录专注时长。

你在摸鱼 -> 记录摸鱼时长并发送给 AI 告状。

3. 🧠 AI 注入灵魂 (Gemini Persona)

接入 Google Gemini API，让宠物拥有记忆和性格。

数据投喂：{ study_time: 5min, play_time: 2h, app: "TikTok" }

Prompt 设定：“你是一只傲娇的电子猫。看到用户今天刷了2小时抖音只背了5分钟单词。请生成一句50字以内的毒舌嘲讽。”

反馈：点击宠物，它会气泡弹窗：“哟，大忙人，刷抖音的手指头不酸吗？单词书都落灰了！(￣^￣)”

4. ⚡ 极速交互与强力催促

一键唤起：通过 HTML5Plus API (plus.runtime.openURL) 直接从宠物菜单跳转到“词根单词”App，无缝切换。

日历寄生：利用系统日历权限，直接向手机日历写入复习计划。即使 App 被杀后台，系统日历也会按时弹窗提醒。

🛠️ 技术架构 (Tech Stack)

本项目完全基于 HBuilderX 生态构建，充分利用 uni-app 的跨平台能力与 Android 原生能力。

模块

技术方案

关键说明

IDE

HBuilderX

强依赖其 AST 语法提示与 schema2code 生成能力

框架

uni-app (Vue3)

核心逻辑层

视觉层

UTS 插件

android-floatwindow (处理悬浮窗与 WebView)

监控层

Native.js

直接调用 Java 层 UsageStatsManager，无需第三方保活插件

数据层

uniCloud

承载 Gemini API 调用与用户数据同步

表单生成

Schema2Code

利用 uniCloud DB Schema 秒级生成打卡统计页

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


📂 目录结构 | Project Structure

WordParasite/
├── pages/
│   └── index/
│       └── index.vue       # 控制台主页 (宠物开关、监控开关)
├── static/
│   ├── logo.png            # 应用图标
│   └── pet.html            # 宠物的“肉体” (本地 HTML/CSS 动画)
├── uni_modules/
│   └── android-floatwindow # [核心] 悬浮窗 UTS 插件 (含 utssdk/encrypt)
├── utils/
│   └── monitor.js          # [核心] Native.js 监控逻辑 (Java反射调用)
├── App.vue                 # 应用入口 (生命周期管理)
├── main.js                 # Vue 初始化入口
├── manifest.json           # 权限配置 (SYSTEM_ALERT_WINDOW, PACKAGE_USAGE_STATS)
├── pages.json              # 页面路由配置
└── README.md



🚀 快速开始 | Getting Started

⚠️ 注意：本项目无法使用标准基座运行，必须制作自定义调试基座。

1. 环境准备

下载并安装 HBuilderX (最新版)。

拥有一台开启“开发者模式”的 Android 手机。

2. 导入项目

Clone 本仓库到本地。

在 HBuilderX 中打开项目文件夹。

3. 插件配置 (关键步骤)

由于本项目使用了付费/试用插件 android-floatwindow，你需要：

在 manifest.json 中重新获取你的 DCloud AppID。

前往 DCloud 插件市场 找到该插件。

点击“试用”并绑定你的 AppID。

在 HBuilderX manifest.json -> App原生插件配置 中勾选该云端插件。

4. 运行项目

连接手机。

菜单栏：运行 -> 运行到手机 -> 制作自定义调试基座 (打包需要几分钟)。

基座制作完成后，在手机上安装。

菜单栏：运行 -> 运行到手机 -> 运行基座选择 -> 勾选 自定义调试基座。

点击运行。

✅ 开发进度 | Roadmap

[x] 基础设施搭建

[x] HBuilderX Vue3 项目初始化

[x] 自定义基座环境配置

[x] 核心能力实现

[x] 原生权限申请 (悬浮窗、应用统计)

[x] Native.js 获取当前前台包名 (监控逻辑)

[x] 悬浮窗插件集成 & 本地 HTML 渲染

[ ] 初步优化APP界面 (Doing)

[ ] AI 接入 

[ ] uniCloud 云函数开发

[ ] 对接 Gemini API

[ ] 交互升级

[ ] 宠物情绪系统 (根据应用包名改变表情)

[ ] 单词数据本地化存储

📄 License

MIT License.

Created by WordParasite Team with HBuilderX & uni-app.


---

### 给你的 GitHub 上传建议

现在你的项目在本地已经跑通了，上传到 GitHub 时有几个小技巧：

1.  **忽略文件 (.gitignore)**：
    HBuilderX 产生了很多编译缓存，**千万不要**上传到 GitHub，否则别人下载下来会报错。
    请确保你的项目根目录下有一个 `.gitignore` 文件，内容至少包含：
    ```text
    node_modules/
    unpackage/
    .hbuilderx/
    *.apk
    ```

2.  **关于付费插件**：
    你在 `uni_modules` 里的 `android-floatwindow` 可能是加密的或者包含试用证书。
    * **原则上**：你可以上传 `uni_modules` 目录结构，但是别人下载后，因为 AppID 变了，他们必须自己去 DCloud 市场点“试用”并重新打基座才能跑起来。
    * **建议**：在 README 的“快速开始”部分，我已经特意加粗了关于插件试用的说明，这非常关键。

3.  **如何上传**：
    如果你电脑上装了 Git，直接在项目文件夹右键打开终端：
    ```bash
    git init
    git add .
    git commit -m "feat: 完成悬浮窗本地渲染与应用监控核心逻辑"
    git branch -M main
    git remote add origin <你的GitHub仓库地址>
    git push -u origin main
