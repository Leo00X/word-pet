---
description: 文件重构优化流程
---

# 文件重构优化工作流

## 使用场景
文件变得臃肿（超过行数限制）或复杂度过高时，需要重构优化

---

## 📊 识别需要重构的文件

### 自动检查

**检查 Composable 行数**:
```powershell
Get-ChildItem -Path "pages\index\composables\*.js" | ForEach-Object { 
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  if ($lines -gt 400) { 
    Write-Host "$($_.Name): $lines 行 $(if($lines -gt 450){'🔴 必须拆分'}else{'⚠️ 警告'})" 
  }
}
```

**检查 Vue 组件行数**:
```powershell
Get-ChildItem -Path "pages\index\components\*.vue" | ForEach-Object { 
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  if ($lines -gt 300) { 
    Write-Host "$($_.Name): $lines 行 $(if($lines -gt 350){'🔴 必须拆分'}else{'⚠️ 警告'})" 
  }
}
```

### 行数限制参考

| 文件类型 | 理想 | 警告 | 必须拆分 |
|---------|------|------|---------|
| **Composable** | < 250 行 | 250-400 行 | > 450 行 |
| **index.vue** | < 250 行 | 250-400 行 | > 450 行 |
| **简单组件** | < 200 行 | 200-300 行 | > 350 行 |
| **复杂组件** | < 400 行 | 400-500 行 | > 550 行 |

> **注意**: 对于 `.vue` 文件，请使用 **有效行数 (eLOC)** 判断 (排除 `<style>` 块)。
> 脚本统计的是总行数，实际判断时请人工排除样式代码的影响。

---

## 📋 重构流程

### Step 1: 分析文件结构

**使用大文件分析 workflow**:
```
/7-analyze-large-file @[臃肿的文件]
重点关注：
- 功能模块划分
- 可拆分的部分
- 重复代码
```

**分析要点**:
- [ ] 文件承担了几个职责？
- [ ] 有哪些独立的功能模块？
- [ ] 是否有可以提取的工具函数？
- [ ] 是否有重复代码？

---

### Step 2: 制定重构方案

**拆分策略**:

#### 策略 A: 按功能拆分

**适用**: Composable 承担多个职责

**示例**: `useSkins.js` (509行) 拆分为：
```
useSkins.js (核心管理，200行)
  ├─ useSkinLoader.js (加载逻辑，150行)
  ├─ useSkinMarket.js (商城逻辑，100行)
  └─ skinUtils.js (工具函数，50行)
```

#### 策略 B: 提取子组件

**适用**: Vue 组件 template 或逻辑过长

**示例**: `ChatPanel.vue` (400行) 拆分为：
```
ChatPanel.vue (容器，150行)
  ├─ MessageList.vue (消息列表，100行)
  ├─ InputArea.vue (输入区域，80行)
  └─ QuickReply.vue (快捷回复，70行)
```

#### 策略 C: 提取工具函数

**适用**: 有大量工具函数

**示例**: 从 Composable 提取到 `utils/`:
```javascript
// 从 useGrowth.js 提取
utils/growthFormula.js  // 计算公式
utils/petForms.js       // 宠物形态配置
```

---

### Step 3: 创建重构计划

**计划模板**:
```markdown
# [文件名] 重构计划

## 现状
- 当前行数: XXX 行
- 主要问题: [臃肿/职责不清/重复代码]

## 拆分方案

### 新文件 1: [文件名]
- **职责**: [单一职责]
- **预计行数**: XXX 行
- **包含内容**:
  - [功能1]
  - [功能2]

### 新文件 2: [文件名]
- **职责**: [单一职责]
- **预计行数**: XXX 行
- **包含内容**:
  - [功能1]
  - [功能2]

## 迁移步骤
1. [步骤1]
2. [步骤2]

## 风险评估
- [风险1]
- [风险2]

## 验收标准
- [ ] 所有原有功能正常
- [ ] 各文件行数符合规范
- [ ] 无 Dead Code
- [ ] 测试通过
```

---

### Step 4: 执行重构

#### 4.1 创建新文件

**顺序**: 从底层到上层

```
1. 创建工具文件 (utils)
2. 创建独立 Composable
3. 创建子组件
4. 修改主文件
```

#### 4.2 迁移代码

**原则**:
- ✅ 一次迁移一个功能模块
- ✅ 迁移后立即测试
- ✅ 保持 Git 提交粒度（每个新文件一次提交）

**示例**（拆分 Composable）:

**步骤 1**: 创建新 Composable
```javascript
// pages/index/composables/useSkinLoader.js
import { ref } from 'vue';

export function useSkinLoader() {
  // 从 useSkins.js 迁移加载相关代码
  const loadBuiltInSkins = () => { /* ... */ };
  const loadOnlineSkins = () => { /* ... */ };
  
  return {
    loadBuiltInSkins,
    loadOnlineSkins
  };
}
```

**步骤 2**: 在原文件中使用
```javascript
// pages/index/composables/useSkins.js
import { useSkinLoader } from './useSkinLoader.js';

export function useSkins() {
  const skinLoader = useSkinLoader();
  
  // 使用 skinLoader 的方法
  const loadAllSkins = () => {
    skinLoader.loadBuiltInSkins();
    skinLoader.loadOnlineSkins();
  };
  
  return { /* ... */ };
}
```

**步骤 3**: 删除原文件中已迁移的代码

---

#### 4.3 更新引用

**检查清单**:
- [ ] index.vue 的导入和使用
- [ ] 其他组件的引用
- [ ] 测试文件的引用

---

### Step 5: 验证重构

**功能测试**:
- [ ] 原有功能全部正常
- [ ] 无新增 Bug
- [ ] 性能无明显下降

**代码检查**:
```powershell
# 检查新文件行数
Get-ChildItem -Path "新文件路径" | ForEach-Object {
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  Write-Host "$($_.Name): $lines 行"
}
```

**逻辑闭环检查**:
- [ ] 新创建的方法都有调用点？
- [ ] 没有 Dead Code？
- [ ] 数据流完整？

---

### Step 6: 更新文档

**更新 DEVELOPMENT.md**:
```markdown
#### X. useXxx.js - 新拆分的模块
```

**更新 UPDATES.md**:
```markdown
## 🔧 代码重构

**[原文件名] 拆分优化**:
- 拆分为 X 个文件
- 优化前：XXX 行
- 优化后：每个文件 < 250 行
```

---

## 💡 重构模式参考

### 模式 1: 功能模块拆分

**适用**: 一个文件承担多个职责

**Before**:
```
useXxx.js (600 行)
  - 功能 A (200 行)
  - 功能 B (200 行)
  - 功能 C (200 行)
```

**After**:
```
useXxxA.js (220 行) - 功能 A
useXxxB.js (220 行) - 功能 B
useXxxC.js (220 行) - 功能 C
useXxx.js (100 行)  - 组合和导出
```

---

### 模式 2: 工具函数提取

**Before**:
```javascript
// useGrowth.js (500 行)
export function useGrowth() {
  // 大量计算公式 (200 行)
  const calculateXP = () => { /* ... */ };
  const calculateLevel = () => { /* ... */ };
  
  // 业务逻辑 (300 行)
  const addXP = () => { /* ... */ };
}
```

**After**:
```javascript
// utils/growthFormula.js (200 行)
export const calculateXP = () => { /* ... */ };
export const calculateLevel = () => { /* ... */ };

// composables/useGrowth.js (300 行)
import { calculateXP, calculateLevel } from '@/utils/growthFormula.js';

export function useGrowth() {
  const addXP = () => {
    const xp = calculateXP(/* ... */);
    // 业务逻辑
  };
}
```

---

### 模式 3: 组件分层

**Before**:
```vue
<!-- ChatPanel.vue (400 行) -->
<template>
  <!-- 消息列表 (100 行) -->
  <!-- 输入区域 (50 行) -->
  <!-- 快捷回复 (50 行) -->
</template>

<script setup>
// 所有逻辑 (200 行)
</script>
```

**After**:
```vue
<!-- ChatPanel.vue (150 行) -->
<template>
  <message-list :messages="messages" />
  <input-area @send="handleSend" />
  <quick-reply @select="handleQuick" />
</template>

<script setup>
import MessageList from './MessageList.vue';
import InputArea from './InputArea.vue';
import QuickReply from './QuickReply.vue';

// 容器逻辑 (100 行)
</script>
```

---

## ⚠️ 重构注意事项

### 避免过度拆分

**不好的拆分**:
```
useSkins.js (100 行) - 太小，维护成本高
useSkinA.js (50 行)
useSkinB.js (50 行)
```

**好的拆分**:
```
useSkins.js (250 行) - 合适，职责清晰
useSkinMarket.js (200 行)
```

---

### 保持单一职责

**错误示例**:
```javascript
// useDataManager.js (拆分后仍然承担多个职责)
export function useDataManager() {
  // 成长数据
  // 皮肤数据
  // 成就数据
  // ❌ 仍然职责不清
}
```

**正确示例**:
```javascript
// useGrowth.js - 只管成长
// useSkins.js - 只管皮肤
// useAchievements.js - 只管成就
```

---

### 保持数据流清晰

**重构后确保**:
- 数据定义在哪里？
- 数据如何传递？
- 数据如何更新？

---

## 📊 重构效果评估

**重构前**:
- 文件行数: 600 行
- 可维护性: ⭐⭐
- 测试覆盖: 50%

**重构后**:
- 文件行数: 3 个文件，各 200 行
- 可维护性: ⭐⭐⭐⭐⭐
- 测试覆盖: 80%

---

## 📖 参考文档

- [DEVELOPMENT.md](../../DEVELOPMENT.md#开发规范) - 文件行数限制
- [ARCHITECTURE.md](../../ARCHITECTURE.md#设计模式) - Composable 设计模式
- [bug_prevention_guide.md](../../docs/maintenance/bug_prevention_guide.md) - 逻辑闭环检查

---

## ⚡ 快速命令

**检查需要重构的文件**:
```powershell
# 运行上面的检查脚本
```

**开始重构**:
```
/2-dev-refactor @[臃肿的文件]
```

**结合大文件分析**:
```
/7-analyze-large-file @[臃肿的文件]
重点：可拆分的功能模块
```
