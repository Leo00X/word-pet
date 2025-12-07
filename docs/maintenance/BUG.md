# 已知问题 (Known Issues)

> **文档定位**: 追踪未修复的 Bug  
> **已修复**: 详细记录请查阅 [UPDATES.md](./UPDATES.md)  
> **测试清单**: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)


---

## 📊 快速概览

| 优先级 | 未修复 | 修复中 | 已修复待测试 |
|--------|--------|--------|--------------|
| 🔴 高 | 0 | 1 | 4 |
| 🟡 中 | 1 | 0 | 0 |
| 🟢 低 | 3 | 0 | 0 |

**总计**: 9 个活跃问题

---

- [🔴 高优先级](#-高优先级影响核心功能) - #109, #108, #107, #101, #102, #103, #104, #105
- [🟡 中优先级](#-中优先级影响用户体验) - #2
- [🟢 低优先级](#-低优先级轻微问题) - #1, #3, #8


---

## 🔴 高优先级（影响核心功能）

### #109 【皮肤系统】召唤/收回悬浮窗时皮肤重置为默认（回归Bug）
**发现时间**: 2025-12-07  
**严重程度**: 🟡 中  
**状态**: ✅ 已修复 
**修复时间**: 2025-12-07
**验证时间**: 2025-12-07
**测试设备**: Android真机

**问题描述**:  
在皮肤管理中选择了非默认皮肤后，召唤或收回悬浮窗，悬浮窗中的宠物皮肤会重置为默认皮肤。

**期望行为**:  
悬浮窗显示时应保持用户选择的皮肤。

**复现步骤**:
1. 打开皮肤管理，选择非默认皮肤
2. 点击"收回寄生兽"收回悬浮窗
3. 点击"召唤寄生兽"再次召唤
4. 观察到悬浮窗显示默认皮肤

**根本原因**:  
重构时 `handleTogglePet` 函数丢失了皮肤同步逻辑：
```javascript
// 原 index.vue 有此逻辑，但重构到 useIndexHandlers.js 时遗漏了
skins.syncSkinToFloat(currentSkin);
```

**修复方案**:  
在 `useIndexHandlers.js` 的 `handleTogglePet` 中添加皮肤同步：
```javascript
if (floatWindow.isPetShown.value) {
    // 同步当前皮肤到悬浮窗
    if (skins.currentSkin?.value?.id !== 'default') {
        skins.syncSkinToFloat(skins.currentSkin.value);
    }
}
```

**相关文件**:
- `pages/index/composables/useIndexHandlers.js` (L71-86)

---

### #108 【皮肤系统】皮肤管理和商城弹窗无法打开（回归Bug）
**发现时间**: 2025-12-07  
**严重程度**: 🔴 高  
**状态**: ✅ 已修复
**修复时间**: 2025-12-07
**测试设备**: Android真机

**问题描述**:
在 #107 修复后，点击"皮肤管理"和"皮肤商城"按钮无响应，弹窗无法打开。

**根本原因**:  
重构时将弹窗状态从 `ref()` 改为 `computed()` 只读属性，但模板中仍使用直接赋值：
```javascript
// ❌ 错误：computed 是只读的
const showSkinModal = computed(() => modals.skin);
// 模板中
@open-skin-selector="showSkinModal = true"  // 静默失败
```

**修复方案**:  
将所有弹窗操作改为调用 `openModal()`/`closeModal()` 方法：
```javascript
// ✅ 正确
@open-skin-selector="openModal('skin')"
@tap="closeModal('skin')"
```

**修改范围**: 11 处模板事件绑定

**相关文件**:
- `pages/index/index.vue` (L39, L51-53, L103-164)
- `pages/index/composables/useIndexState.js`

---

### #107 【日记系统】历史日记无法访问，日记数据正常保存但无查看功能
**发现时间**: 2025-12-07  
**严重程度**: 🔴 高  
**状态**: ✅ 已修复
**修复时间**: 2025-12-07
**测试设备**: Android真机

**问题描述**:  
1. 点击"历史日记"按钮后跳转失败（404）
2. 写今日日记功能正常，数据成功保存到 `pet_diaries`
3. 但无法查看历史日记列表

**期望行为**:  
点击"历史日记"按钮后，应显示保存的日记列表，支持查看每天的日记内容。

**复现步骤**:
1. 打开主界面 → 日记 Tab
2. 点击"✏️ 写今日日记"（AI 生成成功，保存到 storage）
3. 点击"📖 历史日记"按钮
4. 观察到页面跳转失败

**根本原因**:  
1. **页面缺失**: `DiaryPanel.vue:226` 跳转到 `/pages/diary/diary-history`，但该页面不存在
2. **路径混淆**: 
   - `log-history.vue` 显示的是成长日志 (`pet_growth_logs`)
   - 日记数据保存在 `pet_diaries`，但没有对应的展示页面

**修复方案**:  
✅ 已创建 `pages/diary/diary-history.vue` 页面：
1. ✅ 读取 `pet_diaries` storage
2. ✅ 展示日记列表（日期、预览、元数据）
3. ✅ 支持点击查看完整日记内容
4. ✅ 支持清空所有日记

**相关文件**:
- `pages/index/components/DiaryPanel.vue` (L196-227: 保存逻辑)
- `pages/diary/diary-history.vue` (✅ 新建，236行)
- `pages.json` (✅ 已添加路由)

---

### #101 【悬浮窗】点击宠物没有AI响应气泡
**发现时间**: 2025-12-06  
**状态**: ✅ 已修复
**测试设备**: Android真机

**问题描述**:  
点击悬浮窗宠物后，只有跳跃动画，没有显示 AI 生成的文本气泡。

**根本原因**:  
🔥 **功能不闭环**：`usePetInteraction.js` 已创建但从未在 `index.vue` 中导入和集成！

**修复方案**:  
在 index.vue 中集成 `usePetInteraction` 并连接回调链路。

**相关文件**:
- `pages/index/index.vue`
- `pages/index/composables/usePetInteraction.js`
- `pages/index/composables/useFloatWindow.js`

---

### #102 【悬浮窗】长按显示系统菜单而非自定义气泡
**发现时间**: 2025-12-06  
**状态**: ✅ 已修复 
**测试设备**: Android真机

**问题描述**:  
长按宠物时，显示的是系统默认菜单，而不是预期的自定义气泡。

**根本原因**:  
1. touchstart 使用 `passive: true` 导致无法 `preventDefault()`
2. 未阻止 `contextmenu` 事件

**修复方案**:  
修改 `passive: false` 并添加 contextmenu 事件监听器。

**相关文件**:
- `static/pet.html`

---

### #103 【悬浮窗】拖拽到边缘无吸附效果
**发现时间**: 2025-12-06  
**状态**: 🔧 修复中，再次测试  
**测试设备**: Android真机

**问题描述**:  
拖拽悬浮窗到屏幕边缘时，没有出现预期的吸附（磁吸）效果。

**修复方案**:  
改为 `setSidePattern(3)`（四边吸附）。

**相关文件**:
- `pages/index/composables/useFloatWindow.js`

---

### #104 【悬浮窗】空白尺寸
**发现时间**: 2025-12-06  
**状态**: ✅ 已修复
**测试设备**: Android真机

**问题描述**:  
悬浮窗尺寸不正确，导致很多空白区域。

**根本原因**:  
- `FLOAT_SIZES.NORMAL` 设为 200x200（太大）
- 气泡占用固定空间，即使隐藏

**修复方案**:  
1. 减小 `NORMAL` 尺寸为 100x100
2. 气泡使用 `position: absolute` 悬浮在宠物上方

**相关文件**:
- `pages/index/composables/useFloatWindow.js`
- `static/pet.html`

---

### #105 【悬浮窗】气泡被截断无法显示
**发现时间**: 2025-12-06  
**状态**: ✅ 已修复 
**测试设备**: Android真机

**问题描述**:  
悬浮窗尺寸改为 100x100 后，气泡无法显示（被悬浮窗边界截断）。

**修复方案**:  
显示气泡时自动扩大悬浮窗，气泡消失后恢复小尺寸。

**相关文件**:
- `static/pet.html`
- `pages/index/composables/useFloatWindow.js`

---

## 🟡 中优先级（影响用户体验）

### #2 聊天心情值不同步
**发现时间**: 2025-12-05  
**状态**: 🔧 未修复

**问题描述**:  
【对话】窗口，跟AI对话的时候，它有时候会发来心情值（如类似 心情值：60/100）的消息，但是宠物的状态栏里心情值没有变化。

**期望行为**:  
解析 AI 发来的消息，如果包含但不限于心情值，就更新宠物的状态栏。

**相关文件**:
- `pages/index/composables/useChat.js`
- `pages/index/composables/useGrowth.js`

---

## 🟢 低优先级（轻微问题）

### #1 每日问候在悬浮窗启动后没有显示
**发现时间**: 2025-12-05  
**状态**: ✅ 已修复，待测试

**问题描述**:  
用户首次打开应用时，如果悬浮窗尚未开启，每日问候只会添加到聊天记录中。开启悬浮窗时，问候与初始化消息冲突导致快速闪过。

**修复方案**:  
移除 pet.html 中的自动初始化消息，由 index.vue 统一控制。

**相关文件**:
- `static/pet.html`
- `pages/index/index.vue`

---

### #3 皮肤管理窗口无法滚动
**发现时间**: 2025-12-05  
**状态**: ✅ 已修复

**问题描述**: 
皮肤管理 & 皮肤商城窗口大小不适应，无法往下滚动。

**相关文件**: `pages/skin/`

---

### #8 "摇一摇"互动乱触发
**发现时间**: 2025-12-05  
**状态**: ✅ 已修复

**问题描述**: 
摇一摇功能过于敏感，容易误触发。

**修复方案**:  
提高触发阈值，增加防抖机制。

**相关文件**: 
- `static/pet.html` (摇一摇检测逻辑)

---

## 📋 修复优先级

### 本周重点
1. **#101, #102, #104, #105** - 悬浮窗相关（已修复，待真机测试）
2. **#103** - 边缘吸附（修复中，再次测试）
3. **#107, #108, #109** - 皮肤/日记系统（已修复，待测试）

### 下一阶段
1. **#2** - 聊天心情值同步（未修复）

---

**更新时间**: 2025-12-07  
**总数**: 12 个问题（10 已修复待测试，1 修复中，1 未修复）

---

## 🔍 代码审查新发现 (2025-12-06)

### #NEW-1 【数据一致性】usePetInteraction 独立实例导致数据不同步
**发现时间**: 2025-12-06 23:30  
**状态**: ✅ 已修复，待测试

**问题描述**:  
`usePetInteraction.js` 内部调用 `useGrowth()` 创建独立实例，导致互动修改的 `mood/bond` 数据与主页面不同步。

**修复方案**:  
添加 `growthInstance` 参数支持，优先使用注入的实例。

**相关文件**:
- `pages/index/composables/usePetInteraction.js`
- `pages/index/index.vue`

---

### #NEW-4 【AI上下文】getContextMessages 返回顺序错误
**发现时间**: 2025-12-06 23:30  
**状态**: ✅ 已修复，待测试

**问题描述**:  
`useChat.getContextMessages()` 中使用 `.reverse()` 导致消息顺序错误（最新的在前面），而 AI 期望时间正序。

**修复方案**:  
移除 `.reverse()` 调用。

**相关文件**:
- `pages/index/composables/useChat.js`

---

### #NEW-6 【调试代码】生产环境 console.log 残留
**发现时间**: 2025-12-06 23:30  
**状态**: ✅ 已修复

**问题描述**:  
4处调试 `console.log` 未清理。

**修复方案**:  
移除或替换为注释。

**相关文件**:
- `pages/index/index.vue`
- `pages/index/composables/useChat.js`



---

## 📝 Bug 报告模板

复制以下模板来报告新 Bug：

```markdown
### #xxx 【模块名】简短描述
**发现时间**: YYYY-MM-DD  
**严重程度**: 🔴/🟡/🟢  
**状态**: 未修复  

**问题描述**:  
详细描述问题现象

**期望行为**:  
正确的表现应该是什么

**复现步骤**:
1. 打开xxx
2. 点击xxx
3. 观察到xxx

**可能原因**:  
初步分析

**相关文件**:
- 文件路径1
- 文件路径2