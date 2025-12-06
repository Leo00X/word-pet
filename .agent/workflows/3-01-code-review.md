---
description: 代码提交前审查清单
---

# 提交前完整检查清单

> 在提交代码前，执行完整的代码和文档审查

---

## 📋 快速检查（5分钟）

### ✅ 核心检查项

- [ ] 文件行数符合规范？(Composable < 450行, index.vue < 450行)
- [ ] 无 TODO/FIXME 注释？
- [ ] 新功能有调用点？(逻辑闭环)
- [ ] README 只做增量更新？(未重写)
- [ ] 真机测试通过？

---

## 🔍 详细审查（三轮）

### 第一轮：静态代码审查

**1. 文件行数检查**
```powershell
# Composable 行数
Get-ChildItem -Path "pages\index\composables\*.js" | ForEach-Object { 
  $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
  if ($lines -gt 450) { Write-Host "$($_.Name): $lines 行 ⚠️" }
}

# index.vue 行数
$lines = (Get-Content "pages\index\index.vue" | Measure-Object -Line).Lines
if ($lines -gt 450) { Write-Host "index.vue: $lines 行 ⚠️" }
```

**2. TODO 扫描**
```bash
rg "TODO|FIXME|XXX" --type vue --type js
```

**3. 逻辑闭环检查**
- [ ] 新建的 Composable 方法有调用点？
- [ ] 新建的组件有被引用？
- [ ] TODO 都已实现或删除？

**4. 响应式检查**
- [ ] ref 是否保持引用（未被解包）？
- [ ] Composable 数据源是否正确？
- [ ] watch 监听是否正确？

### 第二轮：架构合规检查

**Composable + Component 模式**:
- [ ] 业务逻辑都在 Composable 中？
- [ ] UI 组件都独立封装？
- [ ] index.vue 只做组装和绑定？

**数据对接检查**:
- [ ] 成长数据（等级、经验、心情、饥饿、亲密度）
- [ ] 皮肤数据（当前皮肤、已购买列表）
- [ ] 聊天数据（消息历史、上下文）
- [ ] 成就数据（已解锁成就）

### 第三轮：功能测试

**真机测试清单**:
- [ ] 启动应用，数据正常加载
- [ ] 重启应用，数据持久化正常
- [ ] 切换 Tab，所有功能正常
- [ ] 核心功能流程测试通过

---

## 🚨 常见问题自检

### 问题 1: 数据丢失
→ 检查 `onShow()` 是否加载了所有数据

### 问题 2: UI 不更新
→ 检查 ref 是否正确引用

### 问题 3: 功能不生效  
→ 检查方法是否有调用点

---

## 📖 参考文档

- [Bug 防范指南](../../docs/maintenance/bug_prevention_guide.md) - 详细审查方法
- [DEVELOPMENT.md](../../DEVELOPMENT.md) - 开发规范
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - 架构设计

---

## ⚡ 下一步流程

代码审查通过后：

1. **更新文档** - 使用 `/4-docs-update` 同步更新项目文档
2. **提交代码** - 使用 `/5-git-commit` 提交到 Git
