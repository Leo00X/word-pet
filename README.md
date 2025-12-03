👾 WordParasite (单词寄生兽)

"It watches you. It judges you. It forces you to learn."
一个基于 Android 系统层的桌面 AI 伴侣，在你摸鱼时“重拳出击”的背单词监督工具。

📖 项目简介 | Introduction

WordParasite 是一个反传统的背单词应用。它不提供枯燥的单词书，而是一个**“寄生”在手机桌面的电子宠物**。

利用 Android 原生权限，它实时监控你的应用使用情况。当你长时间沉迷于短视频或游戏时，桌面宠物会通过 AI (Gemini) 生成毒舌评论，甚至挡住屏幕，强制你完成背单词任务才能解锁手机。

核心理念：与其依赖自律，不如依赖“寄生兽”的他律。

🌟 核心特性 | Features

👻 全局桌面悬浮 (Global Floating Window)

基于 Webview 的高性能悬浮窗，支持 HTML5/CSS3 动画。

宠物始终悬浮在所有应用之上，无法被轻易忽视。

👁️ 上帝之眼 (App Usage Monitor)

利用 Native.js 直接调用 Android UsageStatsManager。

毫秒级检测当前前台应用（如抖音、王者荣耀），无需后台保活插件。

🧠 AI 毒舌内核 (Gemini Powered) [WIP]

接入 Google Gemini API。

根据你的摸鱼时长和行为，生成个性化的嘲讽或鼓励语录。

🔒 强制锁定机制 [Planned]

达到摸鱼阈值后，宠物变大覆盖屏幕，必须答对单词才能恢复。

🛠️ 技术栈 | Tech Stack

IDE: HBuilderX

Framework: uni-app (Vue 3)

Platform: Android Only (由于涉及底层权限)

Plugins:

android-floatwindow (UTS插件): 处理悬浮窗核心逻辑。

Native.js: 处理 Android 原生权限申请与应用统计。

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

[x] AI 接入 (Doing)

[ ] uniCloud 云函数开发

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
