# 常见易错问题与防范指南

> ⚡ **快速参考**: 如果时间有限，只读本章的「五大黄金法则」和「决策树」即可掌握核心要点  
> 📖 **完整规范**: 详细开发规范请查阅 [DEVELOPMENT.md](../../DEVELOPMENT.md)

---

## 🎯 核心要点速览

### 五大黄金法则⭐⭐⭐⭐⭐

| # | 法则 | 说明 | 典型错误 |
|---|------|------|---------|
| **1** | **初始化必完整** | `onShow()` 必须加载所有必要数据 | onShow 只检查权限，忘记加载数据 |
| **2** | **逻辑必闭环** | 定义的方法必须有调用点，禁止 Dead Code | 创建 useAchievements 但从不调用 |
| **3** | **状态必同步** | 状态改变必须同步到关联组件/存储 | 切换皮肤后未同步悬浮窗 |
| **4** | **数据需兼容** | 处理不同来源数据的字段差异 | 只用 petType 忽略 emoji 字段 |
| **5** | **响应式不丢失** | 保持 `ref` 引用，避免解包 | `this.x = chat.userInput` 丢失响应性 |

### 快速排查决策树

```
发现 BUG
  └─→ 数据问题？
      ├─→ 是 → 检查 onShow 数据加载
      │        检查响应式绑定 (ref 是否丢失)
      │        检查 Composable 数据源 (是否混淆)
      └─→ 否 → UI 问题？
          ├─→ 是 → 检查 CSS 变量 (是否未定义)
          │        检查富文本渲染 (**加粗**, \n 换行)
          │        检查布局配置 (高度/overflow)
          └─→ 否 → 功能问题？
              ├─→ 是 → 检查 TODO 注释 (是否已实现)
              │        检查函数调用链 (是否有触发点)
              │        检查逻辑闭环 (三维绑定)
              └─→ 否 → 状态同步问题？
                  └─→ 检查关联状态是否同步
                      检查集成参数是否完整
```

### 四大核心规律

| 规律 | 表现 | 关键检查 |
|------|------|---------|
| **生命周期与初始化** | 数据丢失、功能不生效 | onShow 是否完整？composable 是否初始化？ |
| **逻辑闭环与状态同步** | Dead Code、状态不一致 | 方法有调用吗？状态同步了吗？ |
| **数据与配置** | 字段错误、Composable 混淆 | 数据源正确吗？字段兼容了吗？ |
| **UI 与样式** | 样式失效、文本不渲染 | CSS 变量定义了吗？富文本处理了吗？ |

---

## 🔍 三轮审查方法

### 审查流程总览

| 轮次 | 时机 | 目标 | 核心检查项 |
|------|------|------|-----------|
| **第一轮** | 代码编写后 | 静态审查 | onShow 完整性、TODO 清零、函数调用链、响应式绑定 |
| **第二轮** | 真机运行时 | 功能测试 | 数据加载、状态同步、交互响应、边界情况 |
| **第三轮** | 提交前 | 对比审查 | 与备份对比关键逻辑、样式、事件绑定 |

### 第一轮：静态代码审查

**核心检查清单**:
- [ ] **生命周期完整性** - `onShow()` 包含所有数据加载？
- [ ] **TODO 清零** - 无 `TODO/FIXME` 注释？
- [ ] **逻辑闭环** - Composable 方法有调用点？
- [ ] **响应式检查** - ref 是否保持引用（未被解包）？
- [ ] **Composable 数据源** - 是否混淆了相似名称的 Composable？
- [ ] **集成参数完整** - 集成时是否传递了完整依赖？

**快速检查脚本**:
```bash
# 查找 TODO
rg "TODO|FIXME" --type vue --type js

# 检查 onShow
rg "onShow" pages/index/index.vue
```

### 第二轮：功能测试（真机）

**核心测试用例**:
- [ ] 启动应用，数据是否加载？
- [ ] 重启应用，数据是否保留？
- [ ] 切换皮肤，悬浮窗是否同步？
- [ ] 触发功能，日志是否记录？

### 第三轮：对比审查（与备份）

**重点对比**:
- [ ] `onShow` 逻辑是否完整？
- [ ] 样式变量是否一致？
- [ ] 事件处理器是否都存在？

---

## 📋 标准化审查清单

### ✅ 重构前准备
```markdown
[ ] 创建完整备份
[ ] 列出要修改的文件清单
```

### ✅ 代码编写中
```markdown
[ ] 保持文件简洁 (Composable < 450 行, index.vue < 450 行)
[ ] 组件化可视块 (>50 行独立)
[ ] 实时标记 TODO 并立即实现或移除
```

### ✅ 提交前检查（必做）
```markdown
[ ] 运行 `rg "TODO|FIXME"` 确认无遗留
[ ] 真机运行核心功能测试
[ ] 对比备份文件关键部分
```

---

## 💡 典型错误案例精选

### 规律 1: 初始化遗漏

**案例 #1 - onShow 数据未加载** ⚠️
```javascript
// ❌ 错误
onShow(() => {
    permissions.checkPermissions();  // 只检查权限
});

// ✅ 正确
onShow(() => {
    permissions.checkPermissions();
    growth.loadData();          // 加载成长数据
    growthLog.loadCachedData(); // 加载日志
    chat.loadMessages();        // 加载聊天
});
```

### 规律 2: 逻辑不闭环

**案例 #2 - 成就系统从未触发** ⚠️
```javascript
// ❌ 错误：只创建实例，从未调用
const achievements = useAchievements();
// 没有任何地方调用 checkAndUnlock()

// ✅ 正确：在关键时机触发
onShow(() => {
    setTimeout(() => checkAchievements(), 500);
});
const checkAchievements = () => {
    achievements.checkAndUnlock({ /* stats */ });
};
```

**案例 #3 - TODO 注释未实现** ⚠️
```javascript
// ❌ 错误
const handlePurchase = (data) => {
    growth.changeCoins(-data.price);
    // TODO: 添加皮肤到本地列表  ← 注释掉了！
};

// ✅ 正确
const handlePurchase = (data) => {
    growth.changeCoins(-data.price);
    skins.addSkin(data.skinData);  // 实现了
};
```

### 规律 3: 状态同步遗漏

**案例 #4 - 皮肤切换未同步** ⚠️
```javascript
// ❌ 错误
const handleSkinSelect = (skinId) => {
    skins.applySkin(skinId);  // 只改本地
};

// ✅ 正确
const handleSkinSelect = (skinId) => {
    skins.applySkin(skinId);
    skins.syncSkinToFloat(skins.currentSkin.value);
};
```

### 规律 4: 数据源混淆

**案例 #5 - Composable 数据源错误** ⚠️
```javascript
// ❌ 错误：growthLogs 在 useGrowthLog 而非 useGrowth
const growth = useGrowth();
:growthLogs="growth.growthLogs.value"  // growth 没有此属性

// ✅ 正确
const growth = useGrowth();
const growthLog = useGrowthLog();  // 新增
:growthLogs="growthLog.growthLogs.value"
```

**案例 #6 - 集成参数缺失** ⚠️
```javascript
// ❌ 错误
const monitor = useMonitor({
    useGrowthIntegration: growth,
    // 缺少 useGrowthLogIntegration
});

// ✅ 正确
const monitor = useMonitor({
    useGrowthIntegration: growth,
    useGrowthLogIntegration: growthLog,  // 传递完整依赖
});
```

### 规律 5: 响应式丢失

**案例 #7 - ref 被解包** ⚠️
```javascript
// ❌ 错误
const chat = useChat();
this.userInput = chat.userInput;  // 丢失响应性

// ✅ 正确
this.userInput = chat.userInput;  // 保持 Ref<string>
```

### 规律 6: UI 配置不完整

**案例 #8 - SCSS 变量未定义** ⚠️
```scss
/* ❌ 错误 */
.modal {
    background: $bg-main;  // Undefined variable
}

/* ✅ 正确 */
$bg-main: #1a1a2e;  // 先定义
.modal {
    background: $bg-main;
}
```

**案例 #9 - 富文本不渲染** ⚠️
```vue
<!-- ❌ 错误：直接显示，不处理格式 -->
<view>{{ content }}</view>  <!-- "学习**很重要**\n加油" -->

<!-- ✅ 正确：使用 rich-text -->
<rich-text :nodes="formattedContent"></rich-text>
<script>
formattedContent() {
  return this.content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}
</script>
```

---

## 📊 BUG 统计概览

本文档总结了 **18 个**实际 BUG 案例，分为 4 大类：

| 类别 | 数量 | 严重度分布 |
|------|------|-----------|
| **生命周期与初始化** | 5 个 | 🔴 致命 × 3, 🟡 中等 × 2 |
| **逻辑闭环与状态同步** | 6 个 | 🔴 致命 × 3, 🟡 中等 × 3 |
| **数据与配置** | 4 个 | 🔴 致命 × 2, 🟡 中等 × 2 |
| **UI 与样式** | 3 个 | 🟡 中等 × 2, 🟢 轻微 × 1 |

---

## 🛠️ 补充资料

### 逻辑闭环协议 ⚠️

创建新功能时，必须回答"由什么触发？"

```
功能定义 → 实例创建 → 触发调用
   ↓           ↓           ↓
composable   const xxx   handleXxx()
             = useXxx()   xxx.method()
```

**三维绑定检查**:
1. **数据驱动** - 是否需要 `watch()` 监听？
2. **生命周期** - 是否在 `onShow/onLoad` 调用？
3. **用户交互** - 是否绑定 `@click` 事件？

### 状态同步矩阵

| 操作 | 需要同步的关联状态 | 方法 |
|------|-------------------|------|
| 切换皮肤 | → 悬浮窗、本地存储 | `syncSkinToFloat()` + `setStorageSync()` |
| 显示悬浮窗 | → 当前皮肤、待发送消息 | `syncSkinToFloat()` + `sendMessage()` |
| 购买皮肤 | → 本地列表、本地存储 | `addSkin()` + `savePurchasedSkins()` |

### 参数参考值

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| 摇一摇阈值 | 25 | 需要明显摇动 |
| 摇一摇冷却 | 3000ms | 防止连续触发 |
| 长按时长 | 800ms | 用户感知舒适 |

---

**文档版本**: v2.0 (倒金字塔优化版)  
**最后更新**: 2025-12-06  
**适用范围**: uni-app + Vue3 + Composition API 项目  
**总结**: 18 个 BUG 案例，5 大黄金法则，3 轮审查方法
