---
description: Git 提交和推送工作流
---

# Git 提交推送工作流

## 使用场景
完成一个功能或修复后，需要提交代码到 GitHub。

## 执行步骤

// turbo-all

### 1. 检查状态
```bash
git status
```

### 2. 查看变更
```bash
git diff --stat
```

### 3. 添加文件
```bash
git add .
```

### 4. 生成 Commit 信息

**格式**: `<type>(<scope>): <subject>`

**类型**:
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式调整
- `refactor` - 重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建/工具变动

**示例**:
```
feat(chat): 添加聊天历史分页加载功能
fix(skin): 修复皮肤切换后悬浮窗不同步的问题
docs: 更新 DEVELOPMENT.md 添加文件行数规范
refactor(index): 重构 index.vue 使用 Composable 模式
```

### 5. 提交
```bash
git commit -m "提交信息"
```

### 6. 推送
```bash
git push
```

---

## ⚠️ 注意事项

- 提交前确保代码已通过测试
- Commit 信息要清晰描述改动内容
- 避免提交 `node_modules` 等无关文件
