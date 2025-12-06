---
description: 如何高效地与 AI 协作开发 WordParasite
---

# 与 AI 协作开发 WordParasite 工作流

本指南适用于使用 Antigravity 或其他 AI 助手开发 WordParasite 项目。

---

## 🚀 首次对话必读

### Step 1: 引用核心文档（必需）

在**首次对话**或**开启新会话**时，必须让 AI 阅读以下文档：

```
@[word-pet/DEVELOPMENT.md]
@[word-pet/ARCHITECTURE.md]
```

**为什么？**
- `DEVELOPMENT.md` - 让 AI 了解开发规范、目录结构、Composable 使用模式
- `ARCHITECTURE.md` - 让 AI 理解系统架构、设计模式、数据流

### Step 2: 根据任务类型引用额外文档

**新增功能**：
```
@[word-pet/FEATURES.md]
```
→ 了解已有功能，避免重复开发

**修复 Bug**：
```
@[word-pet/docs/maintenance/BUG.md]
@[word-pet/docs/maintenance/bug_prevention_guide.md]
```
→ 了解已知问题和防范规范

**UI 调整**：
```
@[word-pet/pages/index/components/]
```
→ 查看现有组件结构

---

## ✨ 新增功能标准流程

### 1. 明确需求
```
我想添加一个【功能名称】，具体需求是：
1. [需求点 1]
2. [需求点 2]
3. [需求点 3]

请先帮我分析：
- 这个功能属于哪个模块？
- 需要创建哪些 Composable/Component？
- 是否与现有功能冲突？
```

### 2. 让 AI 制定计划
```
请创建一个实施计划（implementation_plan.md），包括：
1. 需要新建的文件
2. 需要修改的文件
3. 可能的风险点
```

### 3. 审查计划后执行
审查 AI 生成的 `implementation_plan.md`，确认无误后：
```
计划看起来不错，请开始实施
```

### 4. 验证结果
```
请创建 walkthrough.md 总结这次的改动
```

---

## 🐛 修复 Bug 标准流程

### 1. 描述问题（越详细越好）
```
遇到一个 Bug：

**现象**：[详细描述问题表现]
**复现步骤**：
1. 打开 xxx 页面
2. 点击 xxx 按钮
3. 观察到 xxx

**期望行为**：[应该是什么样的]

**相关文件**（如果知道）：
@[word-pet/pages/xxx/xxx.vue]
```

### 2. 引用 Bug 防范指南
```
请参考 @[word-pet/docs/maintenance/bug_prevention_guide.md]
检查是否属于已知的易错模式
```

### 3. 让 AI 诊断
AI 会：
1. 分析可能的原因
2. 定位相关代码
3. 提出修复方案

### 4. 修复后更新文档
```
修复完成后，请：
1. 更新 @[word-pet/docs/maintenance/BUG.md]
2. 如果是新发现的易错模式，补充到 bug_prevention_guide.md
```

---

## 📝 最佳实践

### ✅ DO（推荐做法）

1. **使用 @ 引用文件**
   ```
   @[word-pet/pages/index/composables/useFloatWindow.js]
   这个文件的 xxx 函数有问题
   ```

2. **引用整个目录**（查看组件结构）
   ```
   @[word-pet/pages/index/components/]
   显示这个目录的所有组件
   ```

3. **明确指定修改范围**
   ```
   只修改 useMonitor.js 的 checkCurrentApp 函数，
   不要动其他文件
   ```

4. **要求遵循规范**
   ```
   请遵循 DEVELOPMENT.md 中的开发规范：
   - Composable: 理想 < 250 行，警告 250-400 行，超过 450 行必须拆分
   - index.vue: 理想 < 250 行，警告 250-400 行，超过 450 行必须重构
   - 逻辑必须封装到 Composable
   - 遵循逻辑闭环协议
   ```

### ❌ DON'T（避免做法）

1. **不要一次性要求太多功能**
   ❌ "帮我加上 A、B、C、D 四个功能"
   ✅ "先帮我实现功能 A"

2. **不要省略上下文**
   ❌ "这个 bug 怎么修？"
   ✅ "useMonitor.js 的 checkCurrentApp 函数在检测应用时出错..."

3. **不要跳过审查环节**
   ❌ 直接让 AI 写代码
   ✅ 先让 AI 出计划，审查后再实施

---

## 🎯 常用对话模板

### 模板 1: 新增 Composable
```
我需要添加一个 useXxx.js 的 Composable，功能是【描述】

请参考：
@[word-pet/DEVELOPMENT.md] - 了解 Composable 规范
@[word-pet/pages/index/composables/useMonitor.js] - 参考现有模式

要求：
1. 理想情况下 < 250 行，最多不超过 400 行
2. 使用 Vue 3 Composition API
3. 返回响应式状态和方法
4. 单一职责原则
```

### 模板 2: 修复响应式问题
```
遇到 UI 不更新的问题：
@[word-pet/pages/index/index.vue]
@[word-pet/docs/maintenance/bug_prevention_guide.md]

请检查是否是响应式数据丢失导致的
```

### 模板 3: 优化性能
```
@[word-pet/ARCHITECTURE.md] - 查看性能优化章节

我想优化 xxx 功能的性能，目前的问题是【描述】
请提出优化方案
```

---

## 🔍 文件引用优先级

| 优先级 | 文档 | 用途 |
|--------|------|------|
| **P0** | `DEVELOPMENT.md` | 开发规范、目录结构 |
| **P0** | `ARCHITECTURE.md` | 系统架构、设计模式 |
| P1 | `FEATURES.md` | 功能清单（新增功能时） |
| P1 | `bug_prevention_guide.md` | Bug 防范（修 bug 时） |
| P2 | `BUG.md` | 已知问题列表 |
| P2 | 具体的 `.vue` / `.js` 文件 | 针对性修改 |

---

## 💡 高级技巧

### 1. 让 AI 执行三轮审查
```
实施这个功能前，请执行三轮审查：
1. 逻辑闭环审查（是否有调用代码）
2. 响应式审查（ref 是否丢失）
3. 架构合规审查（是否符合 Composable + Component 模式）
```

### 2. 批量处理相似问题
```
我有 3 个类似的 Bug 要修：
@[word-pet/docs/maintenance/BUG.md]

请一起分析 #101、#102、#103，看是否有共同原因
```

### 3. 请求架构建议
```
@[word-pet/ARCHITECTURE.md]

我计划添加【功能】，请根据现有架构给出最佳的实现方案
```

---

## 📚 相关资源

- 📖 [开发者指南](../../DEVELOPMENT.md)
- 🏗️ [架构设计](../../ARCHITECTURE.md)
- ✨ [功能清单](../../FEATURES.md)
- 🛡️ [Bug 防范指南](../../docs/maintenance/bug_prevention_guide.md)

---

**更新时间**: 2025-12-06
**适用 AI**: Antigravity, Claude, ChatGPT
