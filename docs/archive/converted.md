# 智能桌面伴侣与语言习得系统的深度技术架构解析：Word\-Pet 项目范式研究

## 1\. 绪论：从桌面虚拟化到认知型伴侣的演进

### 1\.1 桌面代理（Desktop Agents）的历史沿革与技术迭代

在人机交互（HCI）的发展长河中，桌面代理软件始终占据着一个独特的生态位。从微软早期的 Microsoft Agent（如 Clippy 和 Peedy）到基于 Java 的 Shimeji（桌面桌宠），这些应用不仅仅是屏幕上的装饰，更是用户界面从“命令\-控制”向“代理\-交互”范式转变的尝试。然而，早期的桌面代理受限于当时的算力与渲染技术，往往只能提供预设的、线性的交互体验。Clippy 的失败在很大程度上归咎于其侵入性的交互设计与缺乏情感连接的功利性逻辑。

随着图形处理单元（GPU）算力的普及以及 Python 生态在图形用户界面（GUI）与人工智能（AI）领域的爆发式增长，新一代的智能桌面伴侣应运而生。word\-pet 项目 1 正是这一技术浪潮中的典型代表。它不再是一个单纯的屏幕精灵，而是一个集成了实时渲染技术（Live2D）、认知科学算法（间隔重复系统 FSRS）以及生成式人工智能（LLM）的复杂软件系统。

### 1\.2 Word\-Pet 范式的核心定义

在此报告中，我们将“Word\-Pet 范式”定义为一种利用 Python 语言栈构建的，驻留于操作系统桌面层之上的，具备以下三个核心特征的应用程序：

1. __视觉持久性与透明渲染__：利用 PyQt5 或类似框架实现的无边框、背景透明、点击穿透（Click\-Through）的高性能渲染窗口，搭载 Live2D Cubism SDK 实现细腻的 2D 网格变形动画。
2. __认知辅助与语言习得__：内置基于遗忘曲线理论的算法引擎（如 FSRS），将词汇记忆过程游戏化，通过宠物的状态变化（如心情、健康度）反馈用户的学习表现。
3. __生成式交互能力__：通过 API 接口（如 SillyTavern 协议）连接本地或云端的大语言模型，赋予伴侣动态对话、角色扮演及语境生成的智能。

本报告将基于 word\-pet 项目的技术语境，结合 live2d\-py 2、SillyTavern 3 以及现代 SRS 算法 4 的相关研究，对构建此类系统所需的技术栈进行详尽的解构与分析。

## 2\. 视觉层架构：Python 环境下的 Live2D 渲染与窗口管理

视觉层是 word\-pet 与用户接触的第一界面。与传统的矩形窗口应用不同，桌面伴侣要求极高的渲染保真度与对操作系统窗口管理器的深度控制。

### 2\.1 渲染引擎选型：Python GUI 框架的性能博弈

在 Python 生态中，实现桌面级透明渲染主要有三种路径：Tkinter、PyQt5/PySide6 以及基于 Web 技术的 Electron（配合 Python 后端）。

#### 2\.1\.1 Tkinter 的局限性分析

虽然 Tkinter 是 Python 的标准库，但在处理高性能桌面宠儿时显得力不从心。

- __透明度实现的缺陷__：Tkinter 在 Windows 平台上仅支持基于颜色键（Color\-Key）的透明处理（root\.wm\_attributes\('\-transparentcolor', 'black'\)）5。这种技术不支持 Alpha 通道混合，导致渲染出的 Live2D 模型边缘会出现严重的锯齿（Aliasing）和伪影，无法完美融合于复杂的桌面壁纸背景中。
- __渲染循环的阻塞__：Tkinter 的主事件循环（MainLoop）是单线程的，且缺乏对 GPU 硬件加速的原生支持。在高帧率（60 FPS）刷新 Live2D 网格时，极易造成 UI 冻结。

#### 2\.1\.2 PyQt5/PySide6 与 OpenGL 的深度整合

PyQt5 是构建 word\-pet 类应用的首选方案，这在 live2d\-py 的技术文档中得到了印证 2。Qt 框架提供了对底层窗口系统的直接访问权限，允许开发者创建具备真 Alpha 通道的透明窗口。

技术实现路径：

要实现一个既透明又能显示 Live2D 模型的窗口，需要组合多个 Qt 窗口标志（Window Flags）与属性（Attributes）：

Python

\# PyQt5 窗口初始化伪代码示例  
class PetWindow\(QMainWindow\):  
    def \_\_init\_\_\(self\):  
        super\(\)\.\_\_init\_\_\(\)  
        \# 移除标题栏与边框  
        self\.setWindowFlags\(Qt\.FramelessWindowHint | Qt\.WindowStaysOnTopHint | Qt\.Tool\)  
        \# 启用透明背景支持  
        self\.setAttribute\(Qt\.WA\_TranslucentBackground\)  
        \# 初始化 OpenGL Widget  
        self\.gl\_widget = Live2DWidget\(self\)  
        self\.setCentralWidget\(self\.gl\_widget\)  


在此架构中，QOpenGLWidget 充当了渲染画布。live2d\-py 库通过 Python 的 C 扩展接口调用 Live2D Cubism Core 的 C\+\+ 函数，将计算好的顶点数据直接传递给 OpenGL 上下文进行绘制。这种方式绕过了 Python 的解释器性能瓶颈，利用 GPU 进行繁重的网格形变计算，确保了动画的流畅性 2。

### 2\.2 Live2D Cubism 核心技术解析

Live2D 技术的核心在于将静态的 2D 图像拆分为多个部件（Parts），并将其映射到网格（Mesh）上。

#### 2\.2\.1 模型数据结构 \(\.model3\.json\)

word\-pet 加载的模型通常包含以下关键文件：

- __\.moc3__：二进制模型核心文件，包含顶点、网格和参数的定义。这是 Cubism SDK 运行时必须加载的核心。
- __\.model3\.json__：模型的配置文件，定义了纹理路径、物理计算设置（Physics）、动作组（Motions）以及表情（Expressions）。
- __\.motion3\.json__：具体的动作数据，记录了参数随时间变化的曲线（Bezier Curves）。

#### 2\.2\.2 动态参数控制与交互

为了让“宠物”活起来，word\-pet 必须实时更新模型的参数（Parameters）。Live2D 模型通常包含数十个标准参数，如 ParamAngleX（头部左右转动）、ParamEyeLOpen（左眼开合）等。

__交互逻辑实现：__

1. __视线追踪（Eye Tracking）__：程序需要捕获鼠标在屏幕上的全局坐标，将其转换为模型相对于窗口中心的局部坐标系（\-1\.0 到 1\.0）。
	- *数学映射*：$P\_\{model\} = \\frac\{P\_\{mouse\} \- P\_\{window\\\_center\}\}\{W\_\{window\} / 2\}$
	- 将计算出的 $P\_\{model\}$ 实时传递给 ParamAngleX 和 ParamAngleY，实现宠物眼神跟随鼠标的效果。
2. __点击检测（Hit Testing）__：Live2D 模型定义了“碰撞检测区”（HitAreas）。当用户点击窗口时，程序必须进行射线检测（Raycasting），判断点击位置是否落在某个定义的 Mesh 上。
	- 若点击“头部（Head）”区域 $\\rightarrow$ 触发 TapHead 动作（如摸头动画）。
	- 若点击“身体（Body）”区域 $\\rightarrow$ 触发 TapBody 动作（如惊吓动画）。

### 2\.3 窗口穿透技术的深度剖析

“点击穿透”（Click\-Through）是桌面宠物体验的关键。用户希望在不操作宠物时，鼠标能直接穿过宠物窗口操作下方的文档或浏览器；而当鼠标悬停在宠物实体上时，又能与宠物交互。

在 Windows 平台上，这涉及到对 user32\.dll 的底层调用。

- __完全穿透__：设置窗口扩展样式 WS\_EX\_TRANSPARENT 和 WS\_EX\_LAYERED。此时窗口对鼠标事件完全不可见。
- __像素级精确控制__：这是 word\-pet 追求的高级目标。由于 PyQt 本身不直接支持基于 Alpha 通道的点击遮罩（Pixel\-perfect mask）的动态更新（因为 Live2D 模型每帧都在变），开发者通常采用一种混合策略：
	- __策略 A__：维护一个低分辨率的遮罩位图，随动画更新，利用 setMask\(\)。但这极其消耗 CPU。
	- __策略 B（推荐）__：利用全局鼠标钩子（Global Mouse Hook）或 Qt 的 QHoverEvent。当鼠标移动时，检测当前坐标下 framebuffer 中的像素 Alpha 值。如果 Alpha > 阈值（如 10），则动态移除 WS\_EX\_TRANSPARENT 样式，使窗口捕获输入；反之则添加该样式，使鼠标穿透。

## 3\. 认知层架构：FSRS 算法与词汇记忆引擎

word\-pet 与普通电子宠物最大的区别在于其“教育”属性。它通过引入间隔重复系统（Spaced Repetition System, SRS），将宠物的生存状态与用户的记忆效率挂钩。

### 3\.1 记忆算法的演进：从 SM\-2 到 FSRS

传统的 Anki 软件使用的是 SM\-2 算法 6。该算法虽然经典，但在适应个体差异和处理长周期遗忘上存在局限性。word\-pet 的架构设计更倾向于集成先进的 FSRS（Free Spaced Repetition Scheduler）算法 4。

#### 3\.1\.1 FSRS 算法的数学模型

FSRS 基于“记忆三要素”模型：稳定性（Stability, S）、可提取性（Retrievability, R）和难度（Difficulty, D）。

- 可提取性 \(R\)：表示用户在某一时刻成功回忆起知识点的概率。随时间呈指数衰减：  
  
$$R\(t\) = \(1 \+ \\text\{factor\} \\times \\frac\{t\}\{S\}\)^\{\-1\}$$
- __稳定性 \(S\)__：表示记忆保持的时间长度（即 R 下降到 90% 所需的时间）。
- __难度 \(D\)__：表示该知识点本身的复杂程度。

在 Python 实现中，通过 fsrs 库，开发者可以精确计算每一张词汇卡片的下一次复习时间。

__算法特性__

__SM\-2 \(Anki 传统\)__

__FSRS \(Word\-Pet 推荐\)__

__参数优化__

固定公式，手动调整因子

基于历史复习日志（Log）的机器学习优化

__遗忘预测__

粗略估计

极其精准，支持自定义保留率（Retention Rate）

__灵活性__

较低，难以处理提前/推迟复习

高，自适应调整后续间隔

__代码复杂度__

低 \(~40行 Python\)

中 \(~1000行，依赖 fsrs 包\)

#### 3\.1\.2 数据库设计与持久化

为了支撑 SRS 算法，word\-pet 需要一个健壮的后端数据库，通常选用 SQLite。

__数据表结构设计建议：__

1. __Cards 表__：存储词汇本体。
	- id \(Primary Key\)
	- front \(单词拼写，如 "Serendipity"\)
	- back \(定义/释义\)
	- deck\_id \(所属词库，如 TOEFL, GRE\)
2. __ReviewLogs 表__：记录每一次学习行为，用于 FSRS 权重优化。
	- card\_id
	- rating \(1=Again, 2=Hard, 3=Good, 4=Easy\)
	- review\_time \(Timestamp\)
	- state \(New, Learning, Review, Relearning\)
3. __PetState 表__：存储宠物的状态，实现游戏化逻辑。
	- exp \(经验值\)
	- mood \(心情值\)
	- hunger \(饥饿度\)

### 3\.2 游戏化反馈回路（Gamification Loop）

word\-pet 的核心交互逻辑在于将 SRS 的学习结果实时映射到 Live2D 模型的表现层。

- __正向反馈__：
	- 用户选择 Good/Easy $\\rightarrow$ 调用 FSRS\.next\_interval\(\) 计算新间隔 $\\rightarrow$ 数据库更新 $\\rightarrow$ 触发 Pet\.add\_exp\(\) $\\rightarrow$ Live2D 播放 Motion: Happy $\\rightarrow$ 播放音效 Success\.wav。
- __负向反馈__：
	- 用户选择 Again $\\rightarrow$ 间隔重置 $\\rightarrow$ Pet\.decrease\_mood\(\) $\\rightarrow$ Live2D 播放 Motion: Sad/Disappointed。

这种机制利用了用户的同理心（Empathy），将枯燥的背单词转化为“照顾宠物”的情感劳动，显著提升了用户的粘性和学习动力。

## 4\. 智能层架构：LLM 集成与 SillyTavern 协议

为了解决传统背单词软件“语境缺失”的痛点，word\-pet 引入了大语言模型（LLM）。通过集成 SillyTavern 的 API 范式 8，桌面宠物可以变身为具备高度语境感知能力的语言导师。

### 4\.1 LLM 后端选型与连接

考虑到桌面应用的隐私性与离线需求，word\-pet 架构通常支持连接本地运行的 LLM 推理引擎，如 Ollama、KoboldCpp 或 Text\-Generation\-WebUI 9。

#### 4\.1\.1 API 通信协议

行业标准目前趋向于 OpenAI 兼容的 Chat Completions API。

- __Endpoint__: POST /v1/chat/completions
- __Payload 结构__：  
JSON  
\{  
    "model": "llama\-3\-8b\-instruct",  
    "messages": \[  
        \{  
            "role": "system",  
            "content": "你是一个名为 'Momo' 的桌面助手，性格活泼，喜欢用 emoji。请帮助用户理解单词。"  
        \},  
        \{  
            "role": "user",  
            "content": "请用 'Ephemeral' 造一个关于樱花的句子。"  
        \}  
    \],  
    "stream": true,  
    "temperature": 0\.7  
\}  


#### 4\.1\.2 流式传输（Streaming）的处理

为了获得即时的响应体验，Python 客户端必须处理 Server\-Sent Events \(SSE\)。通过设置 stream=True，响应会以数据块（Chunks）的形式回传。

- __技术挑战__：Live2D 的口型同步（Lip\-Sync）需要音频流。如果是纯文本生成，系统需要先将文本流式传输给 TTS 引擎（如 Edge\-TTS），再由 TTS 生成音频流驱动口型。这要求极其高效的并发处理（asyncio/threading）。

### 4\.2 角色卡（Character Cards）与个性化

word\-pet 支持导入标准的“角色卡”（V2 Spec PNG/JSON）10。这是一种将角色元数据（姓名、描述、性格、示例对话）隐写在 PNG 图片中的技术。

- __解析逻辑__：Python 的 Pillow 库读取 PNG 的 tEXt 块，解码 Base64 字符串，提取 JSON 数据。
- __Prompt 注入__：解析出的 description 和 personality 字段会被动态注入到 LLM 的 System Prompt 中。这意味着用户只需拖入一张新的图片，桌面上宠物的性格、说话方式甚至 Live2D 模型（如果卡片关联了模型文件）都会瞬间切换。

### 4\.3 动态语境生成

当用户在复习单词卡片“Serendipity”时，传统的 APP 只显示死板的例句。集成了 LLM 的 word\-pet 可以：

1. 读取用户的兴趣标签（如“科幻”、“烹饪”）。
2. 构造 Prompt：“请结合\[科幻\]主题，用这个词造一个简短的例句，风格要\[幽默\]。”
3. LLM 生成：“Finding a habitable planet while your warp drive is malfunctioning? Now that's what I call pure serendipity\! 🚀”  
这种高度个性化、动态生成的语境极大地加深了记忆编码的深度。

## 5\. 听觉层架构：语音合成与口型同步

听觉反馈是沉浸感的重要来源。

### 5\.1 文本转语音（TTS）

- __在线方案__：edge\-tts \(Python库\) 提供了高质量、免费的神经网络语音，但需要联网。
- __离线方案__：pyttsx3（质量较差）或本地运行的 VITS / Coqui TTS 12。对于二次元风格的 word\-pet，VITS 是最佳选择，因为它可以生成类似动漫角色的声线。

### 5\.2 实时口型同步（Lip\-Sync）算法

Live2D 模型通过 ParamMouthOpen 参数控制嘴巴开合。如何让这个参数随 TTS 音频跳动？

1. __振幅分析法（RMS）__：
	- 以 60Hz 的频率采样音频缓冲区的均方根振幅（Root Mean Square Amplitude）。
	- 将振幅映射到 0\.0 \- 1\.0 的区间。
	- 优点：计算量极小。缺点：嘴巴只是单纯开合，无法表现元音口型（A, I, U, E, O）。
2. __元音识别法（Viseme Analysis）__ 13：
	- 对音频进行短时傅里叶变换（STFT）或使用预训练的 wav2lip 模型。
	- 识别当前发音的共振峰（Formants），判断是哪个元音。
	- 设置 Live2D 的 ParamMouthForm 参数，实现真实的口型变化。

## 6\. Word\-Pet 项目的工程结构重构

基于 live2d\-py 和现代 Python 工程的最佳实践，我们可以重构出 word\-pet 理想的工程目录结构，以弥补 1 中无法读取的遗憾。

### 6\.1 目录结构推荐

word\-pet/

├── assets/

│ ├── models/ \# Live2D 模型文件 \(\.moc3,\.json\)

│ │ └── potion\-maker/

│ ├── characters/ \# 角色卡图片 \(\.png\)

│ ├── sounds/ \# 音效文件

│ └── database/ \# user\_data\.db

├── src/

│ ├── core/

│ │ ├── live2d\_render\.py \# 封装 live2d\-py 的 QOpenGLWidget

│ │ ├── motion\_manager\.py\# 动作优先级管理

│ │ └── lipsync\.py \# 音频分析

│ ├── cognitive/

│ │ ├── srs\_engine\.py \# FSRS 算法封装

│ │ └── database\.py \# ORM \(SQLAlchemy\)

│ ├── llm/

│ │ ├── client\.py \# OpenAI/Ollama API 客户端

│ │ └── prompt\.py \# 角色卡解析与 Prompt 构建

│ └── gui/

│ ├── main\_window\.py \# PyQt5 透明窗口实现

│ └── tray\_icon\.py \# 系统托盘逻辑

├── config\.py \# 用户配置 14

├── main\.py \# 程序入口 15

└── requirements\.txt \# 依赖列表 16

### 6\.2 关键依赖解析 \(requirements\.txt\)

PyQt5>=5\.15\.0 \# GUI 框架

live2d\-py>=0\.3\.1 \# Live2D 渲染核心

fsrs>=1\.0\.0 \# 记忆算法

requests>=2\.28\.0 \# 网络请求

numpy>=1\.24\.0 \# 数学运算（音频/图像）

Pillow>=9\.5\.0 \# 图像处理（角色卡）

sounddevice>=0\.4\.6 \# 音频播放流

openai>=1\.0\.0 \# LLM 客户端

SQLAlchemy>=2\.0\.0 \# 数据库 ORM

## 7\. 深入洞察与未来展望

### 7\.1 从“工具”到“存在”的范式转移

word\-pet 代表了软件工程的一个重要趋势：__存在感计算（Presence Computing）__。传统的学习软件（如 Anki）是工具，用户需要“打开”它及“使用”它。而 word\-pet 是“存在”于桌面上的。它利用了人类的边缘注意力（Peripheral Attention）。用户在工作间隙瞥一眼屏幕角落，看到宠物正在打瞌睡或玩耍，这种__非侵入式的陪伴感__降低了启动学习任务的心理门槛。

### 7\.2 情感计算与教育的融合

通过将 SRS 的硬核算法隐藏在“照顾宠物”的软性交互之下，word\-pet 实际上是在利用__多巴胺回路__来对抗学习中的__认知阻力__。当用户为了让宠物开心而背单词时，外部动机（考试、分数）转化为了内部动机（情感连接）。这种机制在教育心理学上被称为“情感支架（Affective Scaffolding）”。

### 7\.3 技术壁垒与突破

目前，Python 在桌面 Live2D 渲染上仍面临分发困难的问题。PyInstaller 打包含有 C 扩展和动态链接库（DLL/SO）的 Python 项目极易出错。未来的发展方向可能是 word\-pet 社区开发出更标准化的 Docker 容器化部署方案，或者基于 WebAssembly \(Wasm\) 将 Python 逻辑移植到更轻量级的 Web 运行时中，实现跨平台的无缝体验。

## 8\. 结论

word\-pet 不仅仅是一个代码仓库，它是一整套技术栈的集成实验场。它要求开发者同时精通图形学（OpenGL/Live2D）、认知科学算法（FSRS）、人工智能工程（LLM Ops）以及底层系统编程（Win32 API/X11）。对于 Leo00X 及社区开发者而言，完善这一系统的关键在于打通“视觉\-认知\-情感”的闭环，让每一个单词的记忆都成为一次与数字生命的情感交互。

# 附录：核心组件技术实现参考

## 附录 A: 窗口穿透与鼠标钩子 \(PyQt5 实现\)

为了实现像素级的点击穿透，我们需要在 Windows 平台拦截 WM\_NCHITTEST 消息。

Python

\# src/gui/transparent\_window\.py  
import win32api  
import win32gui  
import win32con  
from PyQt5\.QtWidgets import QMainWindow  
from PyQt5\.QtCore import Qt  
  
class OverlayWindow\(QMainWindow\):  
    def \_\_init\_\_\(self\):  
        super\(\)\.\_\_init\_\_\(\)  
        self\.setWindowFlags\(Qt\.FramelessWindowHint | Qt\.WindowStaysOnTopHint | Qt\.Tool\)  
        self\.setAttribute\(Qt\.WA\_TranslucentBackground\)  
        self\.setMouseTracking\(True\)  
  
    def nativeEvent\(self, eventType, message\):  
        msg = ctypes\.wintypes\.MSG\.from\_address\(message\.\_\_int\_\_\(\)\)  
        if msg\.message == win32con\.WM\_NCHITTEST:  
            \# 获取鼠标位置  
            x = win32api\.LoWord\(msg\.lParam\)  
            y = win32api\.HiWord\(msg\.lParam\)  
            \# 将全局坐标转换为窗口局部坐标  
            local\_pos = self\.mapFromGlobal\(QPoint\(x, y\)\)  
              
            \# 检查 Live2D 模型在该坐标是否有像素渲染  
            \# 这需要调用 Live2D 渲染器的 hitTest 方法  
            if self\.live2d\_renderer\.is\_hit\(local\_pos\.x\(\), local\_pos\.y\(\)\):  
                return True, win32con\.HTCLIENT \# 捕获点击  
            else:  
                return True, win32con\.HTTRANSPARENT \# 穿透点击  
          
        return super\(\)\.nativeEvent\(eventType, message\)  


## 附录 B: FSRS 调度器调用示例

Python

\# src/cognitive/srs\_engine\.py  
from fsrs import Scheduler, Card, Rating  
from datetime import datetime, timezone  
  
class WordScheduler:  
    def \_\_init\_\_\(self\):  
        self\.scheduler = Scheduler\(\)  
  
    def review\_word\(self, card\_obj, user\_rating\):  
        """  
        user\_rating: 1 \(Again\), 2 \(Hard\), 3 \(Good\), 4 \(Easy\)  
        """  
        rating\_enum = Rating\(user\_rating\)  
        \# 获取当前时间（UTC）  
        now = datetime\.now\(timezone\.utc\)  
          
        \# FSRS 核心计算  
        scheduling\_cards = self\.scheduler\.repeat\(card\_obj, now\)  
          
        \# 根据用户评分选择下一次的调度信息  
        next\_card = scheduling\_cards\[rating\_enum\]\.card  
          
        \# 返回下一次复习的时间间隔（天）  
        interval = \(next\_card\.due \- now\)\.days  
        return next\_card, interval  


## 附录 C: SillyTavern 风格的 Prompt 构建

为了让 LLM 扮演好宠物角色，System Prompt 的构建至关重要。

Python

\# src/llm/prompt\.py  
def build\_system\_prompt\(char\_card\):  
    base\_prompt = \(  
        f"You are \{char\_card\['name'\]\}, \{char\_card\['description'\]\}\.\\n"  
        f"Personality: \{char\_card\['personality'\]\}\.\\n"  
        "Current Scenario: You are a desktop companion helping the user learn vocabulary\.\\n"  
        "Guidelines:\\n"  
        "1\. Keep responses short \(under 50 words\) to fit in the speech bubble\.\\n"  
        "2\. Be encouraging and emotive\.\\n"  
        "3\. Use the user's provided examples to explain words\.\\n"  
        "4\. Always stay in character\."  
    \)  
    if char\_card\['mes\_example'\]:  
        base\_prompt \+= f"\\nExample Dialogue:\\n\{char\_card\['mes\_example'\]\}"  
      
    return base\_prompt  


#### 引用的著作

1. github\.com, 访问时间为 十二月 8, 2025， [https://github\.com/Leo00X/word\-pet](https://github.com/Leo00X/word-pet)
2. live2d\-py/README\.en\.md at main \- GitHub, 访问时间为 十二月 8, 2025， [https://github\.com/EasyLive2D/live2d\-py/blob/main/README\.en\.md](https://github.com/EasyLive2D/live2d-py/blob/main/README.en.md)
3. Creating a Full Visual Novel Game in SillyTavern \- Is Technology There Yet? \- Reddit, 访问时间为 十二月 8, 2025， [https://www\.reddit\.com/r/SillyTavernAI/comments/1iy61cb/creating\_a\_full\_visual\_novel\_game\_in\_sillytavern/](https://www.reddit.com/r/SillyTavernAI/comments/1iy61cb/creating_a_full_visual_novel_game_in_sillytavern/)
4. fsrs \- PyPI, 访问时间为 十二月 8, 2025， [https://pypi\.org/project/fsrs/](https://pypi.org/project/fsrs/)
5. Creating the desktop pet | python desktop pet tutorial, 访问时间为 十二月 8, 2025， [https://seebass22\.github\.io/python\-desktop\-pet\-tutorial/2021/05/16/desktop\-pet\.html](https://seebass22.github.io/python-desktop-pet-tutorial/2021/05/16/desktop-pet.html)
6. Open sourced simple\-spaced\-repetition Python module implementing classic Anki algorithm, 访问时间为 十二月 8, 2025， [https://www\.reddit\.com/r/Anki/comments/193cea1/open\_sourced\_simplespacedrepetition\_python\_module/](https://www.reddit.com/r/Anki/comments/193cea1/open_sourced_simplespacedrepetition_python_module/)
7. open\-spaced\-repetition/awesome\-fsrs \- GitHub, 访问时间为 十二月 8, 2025， [https://github\.com/open\-spaced\-repetition/awesome\-fsrs](https://github.com/open-spaced-repetition/awesome-fsrs)
8. SillyTavern \- AI/ML API Documentation, 访问时间为 十二月 8, 2025， [https://docs\.aimlapi\.com/integrations/sillytavern](https://docs.aimlapi.com/integrations/sillytavern)
9. Self\-hosted AI models | docs\.ST\.app \- SillyTavern Documentation, 访问时间为 十二月 8, 2025， [https://docs\.sillytavern\.app/usage/how\-to\-use\-a\-self\-hosted\-model/](https://docs.sillytavern.app/usage/how-to-use-a-self-hosted-model/)
10. \{\{"Improved Character Creation Tool"\}\} Now Supports JSON & PNG Export, and More\! : r/SillyTavernAI \- Reddit, 访问时间为 十二月 8, 2025， [https://www\.reddit\.com/r/SillyTavernAI/comments/1j7c83n/improved\_character\_creation\_tool\_now\_supports/](https://www.reddit.com/r/SillyTavernAI/comments/1j7c83n/improved_character_creation_tool_now_supports/)
11. aichar \- PyPI, 访问时间为 十二月 8, 2025， [https://pypi\.org/project/aichar/](https://pypi.org/project/aichar/)
12. Extras Installation | docs\.ST\.app \- SillyTavern Documentation, 访问时间为 十二月 8, 2025， [https://docs\.sillytavern\.app/extensions/extras/installation/](https://docs.sillytavern.app/extensions/extras/installation/)
13. organics2016/pymouth: Live2D lip sync library based on Python \- GitHub, 访问时间为 十二月 8, 2025， [https://github\.com/organics2016/pymouth](https://github.com/organics2016/pymouth)
14. 访问时间为 一月 1, 1970， [https://github\.com/Leo00X/word\-pet/blob/main/config\.py](https://github.com/Leo00X/word-pet/blob/main/config.py)
15. 访问时间为 一月 1, 1970， [https://github\.com/Leo00X/word\-pet/blob/main/main\.py](https://github.com/Leo00X/word-pet/blob/main/main.py)
16. 访问时间为 一月 1, 1970， [https://github\.com/Leo00X/word\-pet/blob/main/requirements\.txt](https://github.com/Leo00X/word-pet/blob/main/requirements.txt)

