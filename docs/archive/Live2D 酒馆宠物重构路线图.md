# **The Word-Pet Paradigm: A Definitive Technical Analysis of AI-Driven Desktop Companion Architectures**

## **1\. Executive Summary**

The convergence of real-time 2D rendering, desktop compositing, and large language models (LLMs) has catalyzed a new genre of software: the "Cognitive Desktop Companion." While traditional desktop pets, exemplified by the "Shimeji" of the Web 2.0 era, were defined by their programmed randomness and lack of internal state, the modern archetype—conceptualized here as the "Word-Pet"—represents a fundamental shift towards agentic, context-aware interfaces. This report provides an exhaustive architectural reconstruction and engineering analysis of such a system, predicated on the technological footprint of Python-based rendering (Live2D), neural backend integration (SillyTavern), and advanced window management.

Although specific repositories such as Leo00X/word-pet may be transient or inaccessible 1, the technological stack they imply serves as a standardized blueprint for current development. This analysis posits that the optimal architecture for a Word-Pet relies on a hybrid rendering pipeline using live2d-py for high-fidelity Cubism playback 3, PyQt6 for cross-platform window composition 4, and standard HTTP protocols for interfacing with orchestrator backends like SillyTavern.5 This document serves as a comprehensive guide to reconstructing this architecture, addressing critical challenges in transparency masking, inter-process communication, and multimodal synchronization.

The analysis reveals that the primary engineering challenge lies not in the AI processing, which is effectively offloaded to API endpoints, but in the seamless integration of the "living" character into the operating system's window stack. We explore the implementation of "click-through" transparency, the parsing of the Character Card V2 data standard, and the synchronization of generated audio streams with visual phonemes. The result is a holistic view of how a static desktop mascot evolves into a persistent, conversing entity capable of nuanced human-computer interaction.

## **2\. Introduction: The Evolution of the Digital Companion**

### **2.1 From Novelty to Presence**

The history of the desktop companion is a history of user interface experimentation. In the late 1990s, Microsoft Agent introduced the concept of the "Assistant," most famously realized as Clippy. These agents were technologically impressive for their time, utilizing pre-rendered sprites and basic text-to-speech engines to guide user interaction. However, they were functionally modal; they existed primarily to interrupt the user with specific tasks. They lacked "presence"—the quality of existing within the digital space as an independent entity rather than a functional tool.

The "Shimeji" phenomenon of the late 2000s shifted this paradigm. These Java-based applications placed characters on the screen that interacted with windows—climbing borders, throwing windows off-screen, and multiplying. While they achieved a sense of presence through autonomy, they lacked cognitive depth. A Shimeji did not know who the user was, nor could it converse. It was a visual automaton, a piece of chaotic screen candy with no memory or state.

The "Word-Pet" represents the synthesis of these two lineages. It inherits the autonomy and visual presence of the Shimeji, utilizing modern Live2D technology to achieve fluid, breathing animation that far surpasses the rigid sprite sheets of the past. Simultaneously, it reclaims the communicative aspect of the Microsoft Agent but replaces the rigid decision trees with the probabilistic reasoning of Large Language Models (LLMs). This creates a companion that does not merely wait for a command but "lives" on the screen, observing context (if permitted) and engaging in open-ended dialogue.

### **2.2 The Technical Imperative for Python**

The choice of Python as the foundational language for the Word-Pet architecture is not merely a matter of convenience but a strategic engineering decision. While frameworks like Electron are popular for cross-platform UI development, they introduce significant memory overhead—often consuming 150MB to 300MB of RAM for a simple "Hello World" application due to the bundled Chromium instance.6 For a desktop pet intended to run persistently in the background, such resource consumption is prohibitive.

Python, particularly when paired with C-extension libraries like live2d-py and robust GUI toolkits like PyQt6, offers a superior resource profile. A compiled Python application utilizing direct OpenGL bindings can maintain a memory footprint of under 80MB while delivering 60 FPS animation.3 Furthermore, Python's dominance in the AI ecosystem ensures seamless integration with libraries for local inference (llama.cpp), text-to-speech (Edge-TTS), and audio analysis, minimizing the friction between the rendering layer and the cognitive backend.

### **2.3 System Interaction Philosophy**

The defining characteristic of a Word-Pet is its relationship with the window manager. Unlike a standard application that resides in a rectangular frame with a title bar, the Word-Pet must maintain the illusion of being "frameless." It occupies a transparent overlay window that floats above all other applications (AlwaysOnTop).

This necessitates complex handling of user input. The application must be "transparent" to mouse clicks when the user is working on the document behind the pet, but "opaque" to clicks when the user intends to interact with the pet itself. This dynamic toggling of window states—shifting between a "ghost" layer and an "interactive" layer—is a core technical challenge that defines the usability of the system. If the pet constantly blocks clicks, the user will terminate the application. If the pet cannot be clicked, it ceases to be interactive. Balancing these states requires deep integration with OS-level APIs, specifically the Windows User32 library or Linux X11/Wayland compositors.8

## **3\. The Visual Subsystem: Live2D Cubism and Python Rendering**

The visual fidelity of the Word-Pet is paramount. Users have moved beyond simple GIFs; they expect characters that breathe, blink, and track visual targets. Live2D Cubism provides the industry-standard solution for this, allowing 2D illustrations to move with 3D-like fluidity without the computational cost of actual 3D rendering.

### **3.1 The Live2D Architecture**

Live2D does not use traditional frame-by-frame animation. Instead, it employs a technique involving "ArtMeshes" and "Parameters." An illustrator separates a character into distinct parts (eyes, mouth, hair strands), which are then mapped to polygonal meshes.

* **Deformers:** These meshes are controlled by a hierarchy of deformers. "Warp Deformers" allow for soft tissue deformation (e.g., the expansion of a chest during breathing), while "Rotation Deformers" handle rigid body mechanics (e.g., the rotation of an arm or neck).  
* **Parameters:** The state of the model at any given millisecond is defined by a vector of floating-point values, typically ranging from 0.0 to 1.0 or \-30.0 to \+30.0. A standard model might have parameters for ParamAngleX (head turning), ParamEyeLOpen (left eye blink), and ParamMouthOpen (lip movement).  
* **Motion Files:** Animation is not a video file but a .motion3.json file containing Bézier curves that dictate how these parameter values change over time.

This architecture allows for procedural animation. The Word-Pet engine does not just "play" an animation; it *synthesizes* movement. It can blend a "Breathing" idle motion with a "Head Tracking" physics calculation and a "Lip Sync" override simultaneously. The result is a character that feels alive because its movement is never purely repetitive.10

### **3.2 Implementing live2d-py**

Historically, integrating Live2D into Python applications was impossible because the official SDKs were restricted to Unity, Web, and Native C++. The live2d-py library bridges this gap by providing Python bindings for the Live2D Cubism Native SDK.3

The library operates by wrapping the C++ shared libraries, exposing the necessary classes to load models (.moc3), textures, and physics settings (.physics3.json). Crucially, live2d-py does not provide its own window; it outputs vertex data that must be drawn to an OpenGL context. This decoupling allows it to be embedded in various GUI frameworks, with PyQt6 being the optimal choice for desktop applications due to its advanced widget system.

#### **3.2.1 Rendering Pipeline**

The reconstruction of a Word-Pet rendering loop involves several distinct stages occurring within the paintGL cycle of a QOpenGLWidget.

1. **Context Initialization:** Upon startup, the application creates a standard OpenGL context. It initializes the Live2D::Cubism::Framework and loads the model resources into GPU memory. Textures are bound to OpenGL texture IDs.  
2. **Time Management:** The system calculates deltaTime (the time elapsed since the last frame). This is critical for frame-rate independent animation. If the computer lags, the animation logic must advance by the correct amount of time to prevent the character from moving in slow motion.  
3. **Parameter Updates:** Before drawing, the model's parameters are updated.  
   * **Motion Manager:** Advances the current animation (e.g., "Idle").  
   * **Physics:** Calculates the sway of hair and clothes based on the movement of parent deformers.  
   * **Eye Blink:** A separate internal timer triggers eye blinking to ensure the character doesn't stare blankly.  
   * **Lip Sync:** If audio is playing, the ParamMouthOpen parameter is overridden by the current audio amplitude.  
4. **Draw Call:** The LAppModel::Update and LAppModel::Draw methods are called. The C++ backend calculates the vertex positions for the current parameter state and issues draw calls to the OpenGL pipeline.3

### **3.3 Physics and Interaction**

One of the most engaging features of Live2D is the physics engine. A Word-Pet isn't static; if the user drags the window across the screen, the character's hair and clothes should sway in the opposite direction, simulating inertia.

To implement this in Python, the application must feed the "Model Position" into the Live2D physics system.

* **Input:** The window's X and Y coordinates on the screen.  
* **Differential:** The system calculates the difference in position between the current frame and the previous frame.  
* **Physics Injection:** This delta is passed to the CubismPhysics module as a simulated force.  
* **Output:** The physics engine adjusts the parameters for hair and clothing deformers, creating a realistic "drag" effect.

Furthermore, mouse interaction requires coordinate transformation. Screen coordinates (e.g., mouse at pixel 1920x1080) must be normalized to the Live2D device coordinate system (-1.0 to 1.0). When the user clicks, live2d-py performs a hit test against meshes defined with specific IDs (e.g., HitAreaBody, HitAreaHead). This allows the pet to react differently to being patted on the head versus poked on the belly.12

## **4\. Window Management Subsystem: The Transparency Architecture**

The defining technical feature of the Word-Pet is its "frameless" nature. Standard operating system windows are rectangular and opaque. Creating a window that appears to be an irregularly shaped character standing on the desktop requires exploiting specific compositing features of the OS window manager.

### **4.1 The Challenge of Alpha Blending**

Simply setting a window to be "transparent" is insufficient. In PyQt6, setting the WA\_TranslucentBackground attribute allows the window background to be clear, but the window itself remains a rectangular recipient of mouse events. If the user clicks on the empty space 20 pixels to the left of the character's ear, the click will be intercepted by the transparent window rather than passing through to the desktop icon below it.13

To achieve the illusion of a free-standing character, the application must manage two distinct properties: **Visual Transparency** and **Input Transparency**.

### **4.2 Windows Implementation (WinAPI)**

On Microsoft Windows, the User32 library provides the WS\_EX\_LAYERED extended window style, which is the key to this functionality.

* **Layered Windows:** By applying the WS\_EX\_LAYERED style, the application signals to the Desktop Window Manager (DWM) that this window intends to use per-pixel alpha blending. This handles the visual transparency.  
* **Input Passthrough:** To allow clicks to pass through, the WS\_EX\_TRANSPARENT style is used. However, this style makes the *entire* window click-through, rendering the pet interactive-less.8

**The Hybrid Solution:** A robust Word-Pet implementation uses a dynamic approach.

1. **Default State:** The window allows mouse inputs (WS\_EX\_LAYERED is set, WS\_EX\_TRANSPARENT is NOT set).  
2. **The Masking Problem:** A naive approach uses setMask() to define the clickable region. However, setMask() uses a 1-bit bitmap (black/white). Live2D characters use 8-bit alpha channels for soft edges (anti-aliasing). Using setMask() on a Live2D character results in ugly, jagged edges because partially transparent pixels must either be fully opaque or fully transparent.14  
3. **The Advanced Solution:** The application maintains the full alpha-blended visual window. It runs a lightweight "mouse polling" thread or utilizes the mouseMoveEvent in Qt.  
   * The system constantly checks if the mouse cursor is hovering over a non-transparent pixel of the rendered Live2D model.  
   * This requires raycasting the mouse position against the Live2D mesh logic (using live2d-py's hit testing).  
   * **Case A (Mouse over Character):** The application ensures the window is interactable.  
   * **Case B (Mouse over Empty Space):** The application dynamically modifies the window flags via ctypes or pywin32 to apply WS\_EX\_TRANSPARENT or otherwise forwards the click to the window below.

This sophisticated handling ensures that the user can click *through* the gaps between the character's arm and body, but still click *on* the arm itself.

### **4.3 Linux and macOS Considerations**

The implementation varies significantly on UNIX-like systems.

* **Linux (X11):** The X Shape Extension allows for non-rectangular windows, but suffers from the same aliasing issues as Windows masking. Modern compositors (Wayland) generally restrict applications from controlling their own input region shapes for security reasons, making "always-on-top click-through" overlays significantly harder to implement without specific compositor extensions or KWin scripts.9  
* **macOS:** The Cocoa API (NSWindow) handles transparency natively and elegantly. An NSWindow with a clear background color and ignoresMouseEvents \= false generally behaves as expected, though "click-through" logic often requires overriding the hitTest method of the NSView to return nil for transparent pixels.

## **5\. The Cognitive Core: LLM and SillyTavern Integration**

A "Word-Pet" is distinct from a "Tamagotchi" because of its language capability. It is not driven by a simple state machine (Hunger \> 50 \-\> Eat) but by a Large Language Model (LLM) that can parse complex intent and generate novel text.

### **5.1 The SillyTavern API Gateway**

Developing a proprietary LLM backend is redundant and resource-intensive. The optimal architecture leverages **SillyTavern** as the cognitive backend.5 SillyTavern is a highly advanced frontend for LLMs that normalizes the connection to dozens of inference sources (OpenAI, Claude, KoboldCPP, Oobabooga).

By connecting the Word-Pet to SillyTavern via API, the desktop application gains immediate access to:

1. **Unified API:** The pet app only needs to speak one protocol (SillyTavern's API), yet it gains compatibility with virtually every LLM in existence.  
2. **Context Management:** SillyTavern handles the sliding context window, token counting, and chat history storage. The pet app can be "stateless," simply sending the user's latest input and receiving the reply.  
3. **Lorebooks (World Info):** SillyTavern's robust keyword-trigger system allows the pet to have "knowledge." If the user mentions "The Park," SillyTavern can inject a description of the park into the LLM's context, allowing the pet to react appropriately without the pet app needing to manage a vector database itself.

### **5.2 Interaction Logic**

The communication loop is as follows:

1. **User Input:** The user types "Good morning\!" into the pet's chat box.  
2. **API Request:** The Python application sends a POST request to SillyTavern's /api/generate (or chat/completions) endpoint.  
   JSON  
   {  
     "prompt": "User: Good morning\!\\nChar:",  
     "use\_story": true,  
     "use\_memory": true,  
     "use\_authors\_note": true,  
     "use\_world\_info": true  
   }

3. **Prompt Engineering:** The request includes specific "System Prompts" tailored for a desktop pet. Unlike a standard chat bot, a pet must be concise.  
   * *Instruction:* "Write a short response (1-2 sentences). Include an action in asterisks describing your physical reaction."  
   * *Example Output:* "*Wags tail happily* Good morning\! Did you sleep well?"  
4. **Response Processing:** The Python app receives the JSON response. It splits the text into "Speech" and "Action."  
   * **Action:** \*Wags tail happily\* is parsed. A sentiment analyzer (or simple keyword matcher) maps "happily" to the Live2D motion file Motion\_Happy\_01.motion3.json.  
   * **Speech:** "Good morning\! Did you sleep well?" is sent to the Text-to-Speech engine.

### **5.3 Sentiment Analysis and Emotion Mapping**

To bridge the gap between text and animation, the system requires an **Emotion Engine**.

* **Keyword Extraction:** The system scans the LLM's output for emotive keywords (happy, sad, angry, surprised) or action descriptors (sighs, laughs, cries).  
* **Expression Triggering:** These keywords map to Live2D Expression files (.exp3.json). If the LLM writes "*sighs*", the application triggers the Expression\_Sad file, which might lower the eyebrows and eyelids.  
* **Motion Triggering:** Simpler actions trigger full body motions. "*Jumps*" triggers Motion\_Jump.

This creates a seamless feedback loop where the character's physical state mirrors its cognitive state.12

## **6\. Data Persistence: The Character Card V2 Standard**

For a Word-Pet to be viable, it must support the ecosystem of existing AI characters. The **Tavern Character Card V2** format is the de facto standard for sharing character definitions.17

### **6.1 The PNG Steganography**

A Character Card appears to be a simple PNG image of the character. However, the data defining the character (Name, Description, Personality, First Message) is embedded inside the image file itself.

* **Chunk Structure:** The V2 spec uses a tEXt chunk (for uncompressed text) or more commonly a chara field embedded within a standard metadata chunk.  
* **Encoding:** The payload is a Base64-encoded string. When decoded, it reveals a JSON object containing the character definition.

### **6.2 Data Parsing in Python**

Implementing a reader for this format in Python requires accessing the raw PNG chunks, as standard image libraries like cv2 often discard metadata. Pillow (PIL) or the png module are essential here.

The parsing logic involves:

1. **Image Loading:** Image.open("card.png")  
2. **Metadata Extraction:** Accessing im.info or iterating through the PNG chunks to find the chara key.19  
3. **Decoding:**  
   Python  
   raw\_data \= image.info.get('chara')  
   json\_string \= base64.b64decode(raw\_data).decode('utf-8')  
   character\_data \= json.loads(json\_string)

4. **Validation:** The V2 spec nests data inside a data object and includes fields like spec\_version: "2.0". The parser must validate this structure to differentiate it from V1 cards (which stored data in separate name, description fields).18

### **6.3 Field Mapping**

The extracted data maps directly to the Word-Pet's runtime state:

* data.name: Sets the window title and the name used in LLM prompts.  
* data.description & data.personality: Sent to SillyTavern to define the "System Prompt" for the session.  
* data.first\_mes: Displayed in the chat bubble upon first launch.  
* data.character\_book: Parsed to load Lorebook entries into SillyTavern, ensuring the pet "knows" its own backstory.

## **7\. The Auditory Subsystem: TTS and Lip Sync**

A "Word-Pet" that speaks adds a dimension of immersion that text alone cannot achieve.

### **7.1 Text-to-Speech (TTS) Strategies**

The choice of TTS engine is a trade-off between quality, latency, and resource usage.

* **Edge-TTS:** The edge-tts Python library 20 is the superior choice for a lightweight desktop pet. It taps into the Microsoft Edge online TTS API, which offers high-quality "Neural" voices for free. It requires internet access but offloads the heavy processing to the cloud, saving local CPU/GPU cycles.  
* **Local TTS:** For users demanding offline functionality, libraries like pyttsx3 (robotic) or Coqui TTS (high quality but heavy) can be used. However, running a local neural TTS model alongside an LLM and the rendering engine may strain average hardware.

### **7.2 Lip Synchronization (LipSync)**

Syncing the character's mouth to the audio is critical for realism. There are two primary methods:

Method A: Phoneme Extraction (Visemes)  
This method analyzes the audio to detect specific sounds (A, I, U, E, O). It is highly accurate but computationally expensive, requiring Fast Fourier Transform (FFT) analysis in real-time. It maps specific sounds to specific mouth shapes.21  
Method B: RMS Volume Mapping (The live2d-py Approach)  
For a desktop pet, strict phoneme accuracy is often unnecessary. A "Muppet-style" mouth movement, where the mouth opens wider as the volume increases, is sufficient and computationally cheap.

* **Implementation:** The application buffers the audio stream. As the audio plays, the system calculates the Root Mean Square (RMS) amplitude of the current chunk (every \~30ms).  
* **Normalization:** This RMS value is normalized to a 0.0 \- 1.0 range.  
* **Parameter Injection:** This value is fed directly into the Live2D parameter ParamMouthOpen.  
* **Smoothing:** A smoothing function (linear interpolation) is applied to prevent the mouth from jittering erratically on noisy audio.22

The live2d-py library natively supports this RMS-based approach, making it the practical choice for the Word-Pet architecture.

## **8\. Interaction Design and User Experience**

The user experience of a Word-Pet is defined by how it handles the "peripheral" vs "focused" states.

### **8.1 The Chat Interface**

The chat interface should not be permanently visible. It should be a collapsible overlay.

* **Bubbles:** When the pet speaks, a speech bubble should appear near the character. This can be implemented as a separate generic Qt widget that follows the main window's coordinates.  
* **Input:** Clicking the pet opens a text input field.  
* **Drag and Drop:** A high-value interaction is the ability to drag files onto the pet. If the user drags a text file onto the character, the application should parse the file content and send it to the LLM with a prompt like "User just gave you this file: \[Content\]. React to it."

### **8.2 Context Menus and Configuration**

Right-clicking the character should open a context menu (Qt QMenu) allowing the user to:

* **Change Model:** Load a different V2 card or Live2D model.  
* **Scale:** Adjust the size of the pet (0.5x to 2.0x).  
* **Opacity:** Make the pet semi-transparent if it is distracting.  
* **Mute:** Disable TTS output.

## **9\. Future Outlook: The Autonomous Agent**

The current "Word-Pet" architecture relies on the user initiating interaction (Chat). The next evolution, driven by advancements in Small Language Models (SLMs) and Multimodal AI, is **Autonomy**.

* **Screen Awareness:** By integrating vision-language models (like LLaVA or GPT-4o), the pet could "see" the user's screen. It could proactively comment: "I see you're writing code\! Don't forget to handle that exception."  
* **Local Inference:** As hardware accelerators (NPU) become standard, the dependency on SillyTavern or cloud APIs will diminish. The Word-Pet will run a quantized 3B parameter model (e.g., Phi-3) entirely locally, ensuring total privacy and zero latency.  
* **Agency:** Integration with tools (via Function Calling) would allow the pet to perform tasks: "Remind me in 10 minutes to stretch," or "Play some lo-fi music."

## **10\. Conclusion**

The reconstruction of the Leo00X/word-pet concept reveals a sophisticated intersection of modern software engineering disciplines. It is not merely a "toy" but a complex real-time system that must balance rendering performance (live2d-py), OS-level window management (PyQt6/WinAPI), and neural network integration (SillyTavern).

By adhering to the architectural standards outlined in this report—specifically the use of native Python bindings for Live2D, the implementation of click-through transparency via OS flags, and the adoption of the Character Card V2 standard—developers can create a desktop companion that is robust, extensible, and deeply engaging. This technology lays the groundwork for the future of the operating system interface, where our digital tools are no longer passive windows, but active, personified collaborators.

## **11\. Appendix: Comparison of Technology Stacks**

The following table summarizes the trade-offs between different architectural approaches for building a Desktop Pet.

| Feature | Electron / Web-Based | Python (PyQt \+ live2d-py) | Unity (Native C\#) |
| :---- | :---- | :---- | :---- |
| **Memory Footprint** | **High** (150MB \- 400MB) | **Low** (40MB \- 80MB) | **Medium** (100MB+) |
| **Rendering Engine** | WebGL (via PixiJS/Live2D Web SDK) | Native OpenGL (via live2d-py) | Native Unity Engine |
| **Transparency** | Native support, but heavy | Native via Qt \+ WinAPI | Requires paid assets or complex setup |
| **Click-Through** | Difficult (Requires IPC/Plugins) | **Excellent** (Direct OS API access) | Moderate (OS dependent) |
| **LLM Integration** | Easy (JS ecosystem) | **Excellent** (Native Python ecosystem) | Moderate (C\# adapters required) |
| **Dev Velocity** | Fast (Web technologies) | **Medium** (Requires C-binding knowledge) | Medium (Game engine overhead) |
| **Card V2 Parsing** | Easy (JSON/JS native) | **Easy** (Python Dictionary/JSON) | Moderate (JSON parsing in C\#) |
| **Lip Sync** | Web Audio API (High latency potential) | **Native Audio** (Low latency RMS) | Native Audio (High quality) |

Data synthesized from comparative analysis of snippets.3

#### **引用的著作**

1. 访问时间为 一月 1, 1970， [https://github.com/Leo00X/word-pet/blob/main/AI\_GUIDE.md](https://github.com/Leo00X/word-pet/blob/main/AI_GUIDE.md)  
2. 访问时间为 一月 1, 1970， [https://github.com/Leo00X/word-pet/blob/main/README.md](https://github.com/Leo00X/word-pet/blob/main/README.md)  
3. live2d-py/README.en.md at main \- GitHub, 访问时间为 十二月 8, 2025， [https://github.com/EasyLive2D/live2d-py/blob/main/README.en.md](https://github.com/EasyLive2D/live2d-py/blob/main/README.en.md)  
4. pyQT6 create a transparent Normal framed window, always on top, can be resized, can be dragged with top bar (Windows ONLY) \- Stack Overflow, 访问时间为 十二月 8, 2025， [https://stackoverflow.com/questions/76025048/pyqt6-create-a-transparent-normal-framed-window-always-on-top-can-be-resized](https://stackoverflow.com/questions/76025048/pyqt6-create-a-transparent-normal-framed-window-always-on-top-can-be-resized)  
5. SillyTavern \- AI/ML API Documentation, 访问时间为 十二月 8, 2025， [https://docs.aimlapi.com/integrations/sillytavern](https://docs.aimlapi.com/integrations/sillytavern)  
6. Is electron a good one with python backend? : r/electronjs \- Reddit, 访问时间为 十二月 8, 2025， [https://www.reddit.com/r/electronjs/comments/171616e/is\_electron\_a\_good\_one\_with\_python\_backend/](https://www.reddit.com/r/electronjs/comments/171616e/is_electron_a_good_one_with_python_backend/)  
7. Creating a transparent overlay with qt \- python \- Stack Overflow, 访问时间为 十二月 8, 2025， [https://stackoverflow.com/questions/25950049/creating-a-transparent-overlay-with-qt](https://stackoverflow.com/questions/25950049/creating-a-transparent-overlay-with-qt)  
8. Pygame: allow clicks to go through the window \- Stack Overflow, 访问时间为 十二月 8, 2025， [https://stackoverflow.com/questions/37166320/pygame-allow-clicks-to-go-through-the-window](https://stackoverflow.com/questions/37166320/pygame-allow-clicks-to-go-through-the-window)  
9. Creating a transparent, click-through window? · Issue \#200 · python-xlib/python-xlib \- GitHub, 访问时间为 十二月 8, 2025， [https://github.com/python-xlib/python-xlib/issues/200](https://github.com/python-xlib/python-xlib/issues/200)  
10. Live2D Cubism SDK, 访问时间为 十二月 8, 2025， [https://www.live2d.com/en/sdk/about/](https://www.live2d.com/en/sdk/about/)  
11. GitHub \- GitHub, 访问时间为 十二月 8, 2025， [https://github.com/EasyLive2D/live2d-py](https://github.com/EasyLive2D/live2d-py)  
12. Live2D Guide \- Open LLM Vtuber, 访问时间为 十二月 8, 2025， [http://docs.llmvtuber.com/en/docs/user-guide/live2d/](http://docs.llmvtuber.com/en/docs/user-guide/live2d/)  
13. How to make QPainter elements clickable-through using PyQt \- Qt Forum, 访问时间为 十二月 8, 2025， [https://forum.qt.io/topic/127517/how-to-make-qpainter-elements-clickable-through-using-pyqt](https://forum.qt.io/topic/127517/how-to-make-qpainter-elements-clickable-through-using-pyqt)  
14. Rounding the edges of the PyQT6 window Web interface, web widget web Python, 访问时间为 十二月 8, 2025， [https://stackoverflow.com/questions/79049845/rounding-the-edges-of-the-pyqt6-window-web-interface-web-widget-web-python](https://stackoverflow.com/questions/79049845/rounding-the-edges-of-the-pyqt6-window-web-interface-web-widget-web-python)  
15. OS X: Clicks on fully transparent parts of windows no longer passes through in Qt 5.6, 访问时间为 十二月 8, 2025， [https://forum.qt.io/topic/63067/os-x-clicks-on-fully-transparent-parts-of-windows-no-longer-passes-through-in-qt-5-6](https://forum.qt.io/topic/63067/os-x-clicks-on-fully-transparent-parts-of-windows-no-longer-passes-through-in-qt-5-6)  
16. Chat Completions | docs.ST.app \- SillyTavern Documentation, 访问时间为 十二月 8, 2025， [https://docs.sillytavern.app/usage/api-connections/openai/](https://docs.sillytavern.app/usage/api-connections/openai/)  
17. character-card-spec-v2/spec\_v2.md at main \- GitHub, 访问时间为 十二月 8, 2025， [https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec\_v2.md](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md)  
18. malfoyslastname/character-card-spec-v2 \- GitHub, 访问时间为 十二月 8, 2025， [https://github.com/malfoyslastname/character-card-spec-v2](https://github.com/malfoyslastname/character-card-spec-v2)  
19. Python: Extract Metadata from PNG \- Stack Overflow, 访问时间为 十二月 8, 2025， [https://stackoverflow.com/questions/48631908/python-extract-metadata-from-png](https://stackoverflow.com/questions/48631908/python-extract-metadata-from-png)  
20. edge-tts \- PyPI, 访问时间为 十二月 8, 2025， [https://pypi.org/project/edge-tts/](https://pypi.org/project/edge-tts/)  
21. Lipsync · DenchiSoft/VTubeStudio Wiki · GitHub, 访问时间为 十二月 8, 2025， [https://github.com/DenchiSoft/VTubeStudio/wiki/Lipsync/74165a6fd4ed44cc1174a01e464635cbc648bf59](https://github.com/DenchiSoft/VTubeStudio/wiki/Lipsync/74165a6fd4ed44cc1174a01e464635cbc648bf59)  
22. Live2D on the Web (Part 2): Integrating Lip Sync for Custom Audio Files in Vue.js \- Medium, 访问时间为 十二月 8, 2025， [https://medium.com/@mizutori/live2d-on-the-web-part-2-integrating-lip-sync-for-custom-audio-files-in-vue-js-4e521e57e49c](https://medium.com/@mizutori/live2d-on-the-web-part-2-integrating-lip-sync-for-custom-audio-files-in-vue-js-4e521e57e49c)  
23. Lip-sync Based on Volume of Wav Files (Native) | SDK Tutorial \- Live2D Cubism, 访问时间为 十二月 8, 2025， [https://docs.live2d.com/en/cubism-sdk-tutorials/native-lipsync-from-wav-native/](https://docs.live2d.com/en/cubism-sdk-tutorials/native-lipsync-from-wav-native/)  
24. Is Electron a good choice for adding a front-end to my python programs? \- Reddit, 访问时间为 十二月 8, 2025， [https://www.reddit.com/r/learnprogramming/comments/1gg0hn0/is\_electron\_a\_good\_choice\_for\_adding\_a\_frontend/](https://www.reddit.com/r/learnprogramming/comments/1gg0hn0/is_electron_a_good_choice_for_adding_a_frontend/)  
25. Support for Window Transparency · Issue \#488 · r0x0r/pywebview \- GitHub, 访问时间为 十二月 8, 2025， [https://github.com/r0x0r/pywebview/issues/488](https://github.com/r0x0r/pywebview/issues/488)