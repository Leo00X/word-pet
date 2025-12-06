---
description: Bug 修复标准流程
---

# Bug 修复工作流

## 使用场景
发现 Bug 需要修复时的标准流程

---

## 🔍 Step 1: 问题诊断

### 描述 Bug

**记录信息**:
- 现象：[详细描述问题表现]
- 复现步骤：
  1. 打开 xxx 页面
  2. 点击 xxx 按钮
  3. 观察到 xxx
- 期望行为：[应该是什么样的]

### 使用决策树定位

参考 [Bug 防范指南](../../docs/maintenance/bug_prevention_guide.md) 的决策树：

```
发现 BUG
  └─→ 数据问题？
      ├─→ 是 → 检查 onShow、响应式、Composable 数据源
      └─→ 否 → UI 问题？
          ├─→ 是 → 检查 CSS 变量、富文本、布局
          └─→ 否 → 功能问题？
              ├─→ 是 → 检查 TODO、调用链、逻辑闭环
              └─→ 否 → 状态同步问题
```

---

## 🔧 Step 2: 定位代码

### 常见问题自查

**问题类型 1: 数据丢失**
```bash
# 检查 onShow 是否完整
rg "onShow" pages/index/index.vue
```
→ 查看是否有 `loadData()` 调用

**问题类型 2: UI 不更新**
→ 检查 ref 引用是否正确
→ 查看 Composable 数据源是否混淆

**问题类型 3: 功能不生效**
```bash
# 查找 TODO
rg "TODO|FIXME" --type vue --type js
```
→ 检查方法是否有调用点

**问题类型 4: 状态不同步**
→ 检查关联组件是否同步更新

---

## ✏️ Step 3: 修复代码

### 修复原则

1. **最小化修改** - 只改必要的部分
2. **遵循规范** - 符合 Composable + Component 架构
3. **添加注释** - 说明修复内容

### 常见修复模式

**模式 1: 补充数据加载**
```javascript
// 修复前
onShow(() => {
    permissions.checkPermissions();
});

// 修复后
onShow(() => {
    permissions.checkPermissions();
    growth.loadData();           // 补充
    growthLog.loadCachedData(); // 补充
});
```

**模式 2: 修复响应式**
```javascript
// 修复前
this.userInput = chat.userInput; // ref 被解包

// 修复后
this.userInput = chat.userInput; // 保持 ref 引用
```

**模式 3: 补充逻辑闭环**
```javascript
// 修复前
const achievements = useAchievements();
// 没有调用

// 修复后
const achievements = useAchievements();
watch(() => growth.petLevel.value, () => {
    achievements.checkAndUnlock();
});
```

---

## ✅ Step 4: 验证修复

### 测试清单

- [ ] 复现步骤不再出现问题
- [ ] 重启应用，问题不复现
- [ ] 相关功能正常
- [ ] 无新的 Bug 产生

### 真机测试

- [ ] 在真机上测试通过
- [ ] 数据持久化正常
- [ ] 性能无明显下降

---

## 📝 Step 5: 更新文档

### 更新 BUG.md

```markdown
## [已修复] BUG #XX - 问题描述

**修复时间**: 2025-12-06
**修复方案**: 简要说明
**相关 Commit**: feat(xxx): 修复 xxx 问题
```

### 如果是新的易错模式

考虑补充到 `bug_prevention_guide.md`

---

## 📖 参考文档

- [Bug 防范指南](../../docs/maintenance/bug_prevention_guide.md) - 快速决策树
- [BUG.md](../../docs/maintenance/BUG.md) - 已知问题列表
- [DEVELOPMENT.md](../../DEVELOPMENT.md) - 开发规范

---

## ⚡ 修复后流程

1. 运行 `/code-review` - 代码审查
2. 运行 `/git-commit` - 提交代码
