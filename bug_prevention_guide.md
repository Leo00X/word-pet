# 常见易错问题及多轮审查方法

> **目的**：总结本次重构中出现的9个BUG，提炼规律，制定标准化的审查流程，防止未来出现类似问题。

---

## 📊 BUG统计与分类

### 本次对话解决的BUG列表

| BUG编号 | 问题描述 | 严重程度 | 根本原因类别 |
|---------|---------|---------|-------------|
| #1 | 运行时错误：`setupMessageHandler is not a function` | 🔴 致命 | 初始化逻辑错误 |
| #2 | 数据全部丢失（等级、金币、日志、成就） | 🔴 致命 | 生命周期遗漏 |
| #3 | UI颜色变化（字体颜色缺失） | 🟡 中等 | 样式变量缺失 |
| #4 | 皮肤购买后不显示 | 🔴 致命 | 功能未实现(TODO) |
| #5 | 皮肤商城无法滚动 | 🟢 轻微 | 布局配置不完整 |
| #6 | 皮肤不自动应用 | 🟡 中等 | 状态同步遗漏 |
| #7 | 摇一摇乱触发 | 🟡 中等 | 参数设置不合理 |
| #8 | 皮肤ID和图片不对应 | 🟡 中等 | 数据映射缺失 |
| #9 | 悬浮窗皮肤不同步 | 🟡 中等 | 状态同步遗漏 |
| **#10** | **成就系统创建但从未触发** | 🔴 致命 | **功能不闭环** | ⚠️ NEW
| **#11** | **interact()返回值类型错误** | 🔴 致命 | **数据结构不一致** | ⚠️ NEW
| **#12** | **SCSS变量$bg-main未定义** | 🟡 中等 | **样式配置不完整** | ⚠️ NEW
| **#13** | **resetDailyStats从未调用** | 🟡 中等 | **功能不闭环** | ⚠️ NEW
| **#14** | **growthLogs 响应式绑定错误** | 🔴 致命 | **Composable 数据源混淆** | ⚠️ Index 重构 |
| **#15** | **成长日志不记录新互动** | 🔴 致命 | **集成参数缺失** | ⚠️ Index 重构 |
| **#16** | **Markdown 加粗不渲染** | 🟡 中等 | **富文本处理缺失** | ⚠️ Index 重构 |
| **#17** | **聊天换行符不显示** | 🟡 中等 | **字符转义缺失** | ⚠️ Index 重构 |
| **#18** | **日志数字颜色单调** | 🟢 轻微 | **UI 展示逻辑不完整** | ⚠️ Index 重构 |

---

## 🎯 六大易错规律与根因分析

### 规律1：初始化/生命周期逻辑遗漏 ⚠️

**表现形式**：
- ✅ 功能代码存在，但未在正确的生命周期调用
- ✅ 重构时移除了关键的初始化逻辑
- ✅ 组件挂载/显示时缺少必要的数据加载

**典型案例**：
```javascript
// ❌ 错误：重构后的代码
onShow(() => {
    permissions.checkPermissions();  // 只检查权限
});

// ✅ 正确：应包含完整的数据加载
onShow(() => {
    permissions.checkPermissions();
    growth.loadData();               // 加载成长数据
    growthLog.loadCachedData();      // 加载日志
    chat.loadMessages();             // 加载聊天
    achievements.loadData();         // 加载成就
});
```

**审查清单**：
- [ ] `onLoad()` 中是否包含路由参数接收？
- [ ] `onShow()` 中是否包含所有必要的数据加载？
- [ ] composable初始化时是否执行了必要的同步逻辑？
- [ ] 组件挂载时是否触发了必要的副作用？

---

### 规律2：TODO注释未实现 / 功能不闭环 🚧

**表现形式**：
- ✅ 代码中存在 `// TODO:` 注释但未实现
- ✅ 定义了函数但从未调用
- ✅ 事件绑定了但处理函数是空的
- ✅ **Composable方法创建但在组件中从未触发** ⚠️ NEW

**典型案例**：
```javascript
// ❌ 错误：有TODO但未实现
const handleSkinPurchase = (data) => {
    growth.changeCoins(-data.price);
    // TODO: 添加皮肤到本地列表
    // skins.addSkin(data.skinData);  // 注释掉了！
};

// ✅ 正确：实现完整功能
const handleSkinPurchase = (data) => {
    growth.changeCoins(-data.price);
    skins.addSkin(data.skinData);  // 实现了
};
```

**本次对话案例 - 成就系统从未触发** ⚠️：
```javascript
// ❌ 错误：创建了composable但从未调用关键方法
// useAchievements.js
export function useAchievements() {
    const checkAndUnlock = (stats) => {
        // 完整的成就检测逻辑
        return newlyUnlocked;
    };
    return { checkAndUnlock };  // 导出了
}

// index.vue - 但从未调用！
const achievements = useAchievements();  // 只创建实例
// 没有任何地方调用 achievements.checkAndUnlock()

// ✅ 正确：在关键时机触发检查
const achievements = useAchievements();

onShow(() => {
    setTimeout(() => checkAchievements(), 500);  // 页面显示时检查
});

const handleSendMessage = async (content) => {
    await chat.sendMessage(content, ...);
    checkAchievements();  // 发送消息后检查
};

const checkAchievements = () => {
    const stats = { /* 收集统计数据 */ };
    achievements.checkAndUnlock(stats);  // 实际调用
};
```

**逻辑闭环协议** ⚠️ NEW：
1. **触发器审查**：每个新功能必须回答"由什么触发？"
   - 用户交互？→ 绑定 `@click` 等事件
   - 数据变化？→ 使用 `watch()` 监听
   - 生命周期？→ 在 `onShow/onLoad` 中调用
   
2. **三维绑定检查**：
   ```
   功能定义 → 实例创建 → 触发调用
      ↓           ↓           ↓
   composable   const xxx   handleXxx()
                = useXxx()   xxx.method()
   ```

**审查清单**：
- [ ] 搜索项目中所有 `TODO` 注释，确认是否已实现
- [ ] 检查所有导出的函数/方法是否有调用点
- [ ] 验证事件处理器是否有完整逻辑
- [ ] 确认新增功能的触发路径完整
- [ ] **检查composable的所有方法是否都有调用点** ⚠️ NEW
- [ ] **对于异步/定时功能，确认是否有明确的触发时机** ⚠️ NEW

**自动化检查脚本**：
```bash
# 查找所有TODO
rg "TODO|FIXME" --type vue --type js

# 查找未使用的导出函数
rg "export (function|const)" --type js

# 查找composable但未调用的模式（需人工检查）
rg "= use[A-Z]\w+\(\)" pages/index/index.vue
```

---

### 规律3：状态同步遗漏 🔄

**表现形式**：
- ✅ A组件状态改变，但B组件未同步
- ✅ 显示/隐藏切换时未更新关联状态
- ✅ 数据修改后未刷新UI

**典型案例**：
```javascript
// ❌ 错误：切换皮肤后未同步到悬浮窗
const handleSkinSelect = (skinId) => {
    skins.applySkin(skinId);  // 只改了本地状态
};

// ✅ 正确：同步到悬浮窗
const handleSkinSelect = (skinId) => {
    skins.applySkin(skinId);
    const skin = skins.currentSkin.value;
    skins.syncSkinToFloat(skin);  // 同步到悬浮窗
};
```

**同步检查矩阵**：

| 操作 | 需要同步的关联状态 |
|------|------------------|
| 切换皮肤 | → 悬浮窗皮肤 |
| 显示悬浮窗 | → 当前皮肤、待发送消息 |
| 购买物品 | → 本地存储、UI列表 |
| 数据修改 | → 相关UI组件 |

**审查清单**：
- [ ] 关键状态改变时，是否触发了所有依赖刷新？
- [ ] 组件显示/隐藏时，是否同步了必要的状态？
- [ ] 多端数据（本地/云端/UI）是否保持一致？

---

### 规律4：数据结构不一致 / 字段映射缺失 / Composable 数据源混淆 📦

**表现形式**：
- ✅ 不同来源的数据有不同字段名
- ✅ 缺少字段兼容处理
- ✅ 数据转换时丢失字段
- ✅ **重构时误用了相似名称的 Composable** ⚠️ NEW
- ✅ **集成参数传递时缺少关键依赖** ⚠️ NEW

**典型案例 1 - 字段映射**：
```javascript
// ❌ 错误：只根据petType获取emoji
getSkinEmoji(skin) {
    const typeConfig = PET_TYPES.find(t => t.id === skin.petType);
    return typeConfig?.emoji || '👻';  // 忽略了skin.emoji字段
}

// ✅ 正确：优先使用自带emoji
getSkinEmoji(skin) {
    if (skin.emoji) {  // 优先
        return skin.emoji;
    }
    const typeConfig = PET_TYPES.find(t => t.id === skin.petType);
    return typeConfig?.emoji || '👻';
}
```
**数据结构审查表**：

| 数据源 | 必需字段 | 可选字段 | 兼容处理 |
|--------|---------|---------|---------|
| 内置皮肤 | id, name, petType | emoji, styles | 通过petType映射emoji |
| 商城皮肤 | id, name, emoji | petType, category | 保留原始emoji |
| 用户数据 | id, name | - | 合并两者逻辑 |

**本次对话案例 2 - Composable 数据源混淆** ⚠️：
```javascript
// ❌ 错误：growthLogs 在 useGrowthLog 而非 useGrowth
const growth = useGrowth();
// ...
:growthLogs="growth.growthLogs.value"  // ❌ growth 没有 growthLogs

// ✅ 正确：引入正确的 Composable
const growth = useGrowth();
const growthLog = useGrowthLog();  // 新增
// ...
:growthLogs="growthLog.growthLogs.value"  // ✅ 正确

onShow(() => {
    growth.loadData();
    growthLog.loadCachedData();  // 别忘记加载
});
```

**本次对话案例 3 - 集成参数缺失** ⚠️：
```javascript
// ❌ 错误：useMonitor 缺少 growthLog 集成
const monitor = useMonitor({
    useGrowthIntegration: growth,
    useAIIntegration: ai,
    // 缺少 useGrowthLogIntegration
});

// useMonitor 内部无法记录日志
const handleGoodApp = (appName) => {
    if (useGrowthIntegration) {
        useGrowthIntegration.rewardStudy(10);
    }
    // ❌ 没有日志记录
};

// ✅ 正确：传递完整的依赖
const monitor = useMonitor({
    useGrowthIntegration: growth,
    useGrowthLogIntegration: growthLog,  // 新增
    useAIIntegration: ai,
});

// useMonitor 内部可以记录日志
const handleGoodApp = (appName) => {
    if (useGrowthIntegration) {
        useGrowthIntegration.rewardStudy(10);
    }
    if (useGrowthLogIntegration) {  // 新增
        useGrowthLogIntegration.addGrowthLog(`学习 (${appName})`, 10);
    }
};
```

**审查清单**：
- [ ] 不同来源的数据是否有统一的处理逻辑？
- [ ] 是否做了字段兼容处理（优先级、默认值）？
- [ ] 数据转换时是否保留了必要字段？
- [ ] **重构时是否检查了 Composable 的导出内容？** ⚠️ NEW
- [ ] **集成多个 Composable 时是否传递了完整依赖？** ⚠️ NEW
- [ ] **相似名称的 Composable 是否容易混淆？** ⚠️ NEW

---

### 规律5：UI/样式/布局配置不完整 / 富文本渲染缺失 🎨

**表现形式**：
- ✅ 缺少CSS变量定义
- ✅ 容器高度/overflow未设置
- ✅ flex布局不完整
- ✅ **新增样式引用了未定义的SCSS变量** ⚠️ NEW

**典型案例**：
```scss
/* ❌ 错误：缺少容器布局 */
.skins-list {
    padding: 15px;
    /* 没有高度限制，无法滚动 */
}

/* ✅ 正确：完整的滚动容器 */
.skin-market {
    display: flex;
    flex-direction: column;
    max-height: 70vh;
    overflow: hidden;
}

.skins-list {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    max-height: calc(70vh - 200px);
}
```

**本次对话案例 - SCSS变量未定义** ⚠️：
```scss
/* ❌ 错误：使用了未定义的变量 */
<style lang="scss">
.modal-content {
    background: $bg-main;  // ❌ Undefined variable
}
</style>

/* ✅ 正确方案1：先定义变量 */
<style lang="scss">
$bg-color: #1a1a2e;
$bg-main: #1a1a2e;  // 添加变量定义
$card-bg: #16213e;

.modal-content {
    background: $bg-main;  // ✅ 可用
}
</style>

/* ✅ 正确方案2：使用已有变量 */
<style lang="scss">
$bg-color: #1a1a2e;

.modal-content {
    background: $bg-color;  // 使用已有变量
}
</style>
```

**SCSS变量管理规范** ⚠️ NEW：
1. **集中定义**：在文件顶部统一定义所有变量
2. **命名规范**：`$[类别]-[用途]`，如 `$bg-main`, `$text-light`
3. **使用前检查**：在当前文件搜索 `$变量名` 确认已定义
4. **全局变量**：考虑抽离到 `uni.scss` 中共享

**本次对话案例 4 - 富文本渲染缺失** ⚠️：
```vue
<!-- ❌ 错误：直接显示富文本，不处理特殊字符 -->
<template>
  <view class="bubble-text">
    {{ content }}  <!-- AI回复: "学习**很重要**\n继续加油" -->
  </view>            <!-- 显示: 学习**很重要** 继续加油 (无换行/加粗) -->
</template>

<!-- ✅ 正确：使用 rich-text 并转换格式 -->
<template>
  <view class="bubble-text">
    <rich-text :nodes="formattedContent"></rich-text>
  </view>
</template>

<script>
computed: {
  formattedContent() {
    let text = this.content;
    // 1. 处理 Markdown 加粗
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // 2. 处理换行符
    text = text.replace(/\n/g, '<br>');
    // 3. 处理列表符号 (可选)
    text = text.replace(/^[\*\-]\s+(.+)$/gm, 
      '<span style="color:#00d9ff;">●</span> $1');
    return text;
  }
}
</script>
```

**富文本渲染清单** ⚠️ NEW：
- [ ] AI 回复是否包含 Markdown 格式？（`**粗体**`、`*斜体*`）
- [ ] 是否需要支持换行符 `\n` → `<br>`？
- [ ] 是否需要支持列表符号 `*` 或 `-`？
- [ ] 是否使用 `<rich-text>` 组件渲染?
- [ ] 正则替换是否考虑了边界情况（多个空格、嵌套）？

**样式审查清单**：
- [ ] 滚动容器是否设置了高度限制？
- [ ] 是否定义了必要的CSS变量（颜色、尺寸）？
- [ ] flex布局是否完整（父容器display/direction，子元素flex）？
- [ ] 是否有必要的overflow设置？
- [ ] **新增的SCSS变量是否在使用前已定义？** ⚠️ NEW
- [ ] **是否复用了已有的变量或直接硬编码？** ⚠️ NEW
- [ ] **富文本内容是否正确渲染（加粗/换行/列表）？** ⚠️ NEW

---

### 规律6：用户输入参数不合理 ⚙️

**表现形式**：
- ✅ 阈值设置过于敏感/迟钝
- ✅ 冷却时间过短/过长
- ✅ 缺少参数验证

**典型案例**：
```javascript
// ❌ 错误：阈值太低，走路就触发
const shakeThreshold = 15;
if (now - lastShakeTime > 1000) { ... }  // 1秒冷却

// ✅ 正确：参数合理
const shakeThreshold = 25;  // 需要明显摇动
if (now - lastShakeTime > 3000) { ... }  // 3秒冷却
```

**参数审查表**：

| 参数类型 | 推荐范围 | 验证方法 |
|---------|---------|---------|
| 摇动阈值 | 20-30 | 真机测试走路/摇动 |
| 冷却时间 | 2-5秒 | 用户体验测试 |
| 长按时长 | 500-1000ms | 触摸测试 |

**审查清单**：
- [ ] 所有阈值/时间参数是否经过真机测试？
- [ ] 是否有参数说明注释？
- [ ] 边界情况是否考虑（0、负数、极大值）？

---

## 🔍 三轮审查方法论

### 第一轮：静态代码审查（重构后立即执行）

**目标**：发现语法错误、逻辑遗漏、TODO未实现

#### 检查项清单

**1. 生命周期完整性**
```bash
# 检查onShow/onLoad是否包含必要逻辑
rg "onShow|onLoad" pages/index/index.vue
```

- [ ] `onLoad` 是否接收参数？
- [ ] `onShow` 是否包含数据加载调用？
- [ ] composable初始化是否完整？

**2. TODO/FIXME扫描**
```bash
# 扫描所有待办事项
rg "TODO|FIXME|XXX" --type vue --type js -g '!node_modules'
```

- [ ] 所有TODO是否已实现或标记为已知问题？
- [ ] 注释掉的关键代码是否需要恢复？

**3. 函数调用链检查**
- [ ] 所有导出的函数是否有调用点？
- [ ] 事件处理器是否有完整实现？
- [ ] composable方法是否在组件中被调用？

**4. 数据流追踪**
```javascript
// 对于关键数据，检查完整流程：
// 存储 → 加载 → 显示 → 修改 → 保存
```

- [ ] 数据加载：`loadData()` 是否被调用？
- [ ] 数据保存：修改后是否持久化？
- [ ] UI绑定：是否正确绑定响应式数据？

---

### 第二轮：功能测试（真机运行）

**目标**：发现运行时错误、UI问题、交互问题

#### 测试用例模板

**核心功能测试**
```markdown
[ ] 启动应用，检查数据是否加载
[ ] 完全关闭后重新打开，数据是否保留
[ ] 切换Tab，所有面板是否正常显示
[ ] 显示/隐藏悬浮窗，状态是否同步
```

**皮肤系统测试**
```markdown
[ ] 切换皮肤，悬浮窗是否更新
[ ] 收回再召唤悬浮窗，皮肤是否保持
[ ] 购买皮肤，是否出现在皮肤管理
[ ] 重启应用，皮肤是否自动应用
```

**交互测试**
```markdown
[ ] 正常走路，摇一摇是否误触发
[ ] 用力摇手机，摇一摇是否正确触发
[ ] 滚动皮肤商城，是否能看到所有皮肤
[ ] 点击开发者按钮，数据是否立即更新
```

**边界测试**
```markdown
[ ] 金币为0时购买，是否有提示
[ ] 等级1时查看高等级皮肤，是否正确锁定
[ ] 网络断开时使用AI功能，是否有降级处理
```

---

### 第三轮：对比审查（与备份对比）

**目标**：确认重构没有遗漏关键功能

#### 对比检查清单

**1. 关键文件对比**
```bash
# 对比index.vue的关键部分
diff backup_index.vue index.vue
```

**重点检查**：
- [ ] `onShow` 中的逻辑是否完整？
- [ ] 样式变量是否一致？
- [ ] 事件处理器是否都存在？

**2. 功能完整性对比**

| 功能模块 | 备份版 | 当前版 | 状态 |
|---------|--------|--------|------|
| 数据加载 | ✅ 完整 | ❓ 检查 | |
| 皮肤同步 | ✅ 完整 | ❓ 检查 | |
| 交互事件 | ✅ 完整 | ❓ 检查 | |

**3. 样式一致性检查**
- [ ] 颜色是否一致？
- [ ] 布局是否一致？
- [ ] 字体大小是否一致？

---

## 📋 标准化审查表（可复用）

### ✅ 重构前准备

```markdown
[ ] 创建完整备份
[ ] 记录当前版本号
[ ] 列出要修改的文件清单
[ ] 制定回滚方案
```

### ✅ 代码编写中

```markdown
[ ] 保持 index.vue 简洁（<500行）
[ ] 组件化所有可视块（>50行独立）
[ ] composable化所有业务逻辑
[ ] 实时标记TODO并立即实现或移除
```

### ✅ 提交前检查（必做）

```markdown
[ ] 运行 `rg "TODO|FIXME"` 确认无遗留
[ ] 运行 `npm run lint` 检查语法
[ ] 真机运行核心功能测试
[ ] 对比备份文件关键部分
[ ] 更新 BUG.md 记录已知问题
```

### ✅ 发布前验证

```markdown
[ ] 完全卸载重装测试
[ ] 跨天数据重置测试
[ ] 长时间运行稳定性测试
[ ] 所有Tab切换流畅性测试
```

---

## 🛠️ 实用工具脚本

### 1. TODO扫描器
```bash
#!/bin/bash
# scan_todos.sh
echo "=== Scanning TODOs ==="
rg "TODO|FIXME|XXX|HACK" \
   --type vue --type js \
   -g '!node_modules' \
   -g '!dist' \
   --line-number \
   --color always
```

### 2. 函数调用检查
```bash
#!/bin/bash
# check_unused_exports.sh
# 查找可能未使用的导出函数
echo "=== Checking Exported Functions ==="
rg "export (function|const)" --type js -A 1
```

### 3. 生命周期审查
```bash
#!/bin/bash
# check_lifecycle.sh
echo "=== Checking Lifecycle Hooks ==="
rg "onShow|onLoad|onMounted" pages/ --type vue
```

---

## 💡 最佳实践与经验总结

### 1. 初始化逻辑速查

**组件初始化检查点**：
```javascript
// 页面组件必须包含
onLoad()   // 接收参数
onShow()   // 数据加载、状态同步
onHide()   // 清理定时器

// Composable必须包含
初始化时：  // 加载缓存、设置监听
返回时：    // 导出所有必要方法
```

### 2. 状态同步矩阵

| 触发点 | 需要同步的状态 | 方法 |
|--------|--------------|------|
| 切换皮肤 | 悬浮窗、本地存储 | `syncSkinToFloat()` + `setStorageSync()` |
| 显示悬浮窗 | 当前皮肤、待发送消息 | `syncSkinToFloat()` + `sendMessage()` |
| 购买皮肤 | 本地列表、本地存储 | `addSkin()` + `savePurchasedSkins()` |
| 数据修改 | 相关UI组件 | 响应式更新 |

### 3. 数据加载标准模板

```javascript
// 标准的onShow实现
onShow(() => {
    // 1. 权限检查
    permissions.checkPermissions();
    
    // 2. 状态恢复
    floatWindow.reinitInstance();
    
    // 3. 数据加载（按依赖顺序）
    growth.loadData();           // 基础数据
    growthLog.loadCachedData(); // 依赖基础数据
    chat.loadMessages();        // 独立数据
    achievements.loadData();    // 独立数据
    
    // 4. 特殊处理
    checkAndResetDailyStats();
    checkDailyGreeting();
    
    // 5. 延迟任务
    setTimeout(() => checkAchievements(), 500);
});
```

### 4. 参数设置参考值

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 摇一摇阈值 | 25 | 需要明显摇动 |
| 摇一摇冷却 | 3000ms | 防止连续触发 |
| 长按时长 | 800ms | 用户感知舒适 |
| toast时长 | 2000ms | 标准提示时间 |
| 动画延迟 | 300-500ms | 状态切换缓冲 |

---

## 🎓 总结：防止BUG的5个黄金法则

### 法则1：初始化必完整
> 任何需要数据加载的地方，都必须在正确的生命周期调用加载方法

### 法则2：TODO零容忍
> 提交前必须解决或删除所有TODO，不允许带TODO注释的代码上线

### 法则3：状态必同步
> 任何状态改变，都必须检查是否需要同步到关联组件/存储

### 法则4：数据需兼容
> 处理数据时必须考虑不同来源的字段差异，做好兼容处理

### 法则5：参数经测试
> 所有用户输入相关的参数（阈值、时间）必须经过真机测试验证

---

## 📌 快速参考：问题排查决策树

```
发现BUG
  └─→ 数据问题？
      ├─→ 是 → 检查onShow数据加载
      │        检查本地存储读写
      │        检查响应式绑定
      └─→ 否 → UI问题？
          ├─→ 是 → 检查CSS变量
          │        检查布局配置
          │        检查样式继承
          └─→ 否 → 功能问题？
              ├─→ 是 → 检查TODO注释
              │        检查函数调用链
              │        检查事件绑定
              └─→ 否 → 交互问题？
                  └─→ 检查参数设置
                      检查状态同步
                      检查边界处理
```

---

**文档版本**：v1.2 (新增 Index.vue 重构中的 5 个 BUG 案例)  
**最后更新**：2025-12-06  
**适用范围**：uni-app + Vue3 + Composition API 项目  
**本次更新**：  
  - 补充 "Composable 数据源混淆" 易错模式  
  - 补充 "集成参数缺失" 检查清单  
  - 补充 "富文本渲染缺失" 完整案例  
  - 新增字符转义审查规范（`\n` → `<br>`）  
  - 总计 18 个 BUG 案例提炼

