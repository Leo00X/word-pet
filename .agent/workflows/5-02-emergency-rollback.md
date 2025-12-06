---
description: 紧急回滚流程
---

# 紧急回滚工作流

## 使用场景
生产环境出现严重Bug、数据安全问题、应用不可用等紧急情况

---

## 🚨 回滚决策

### 何时需要回滚？

| 情况 | 严重程度 | 是否回滚 |
|------|---------|---------|
| 应用无法启动 | 🔴 严重 | ✅ 立即回滚 |
| 数据丢失风险 | 🔴 严重 | ✅ 立即回滚 |
| 核心功能不可用 | 🔴 严重 | ✅ 立即回滚 |
| 严重性能下降 | 🟡 中等 | ⚠️ 考虑回滚 |
| UI 显示问题 | 🟢 轻微 | ❌ 热修复 |

---

## 📋 回滚流程

### Step 1: 确认问题严重程度

**快速评估**:
- 影响范围：所有用户 / 部分用户 / 个别用户
- 数据安全：是否有数据丢失风险
- 可用性：核心功能是否完全不可用

**决策**:
```
严重程度 = 高 && 影响范围 = 广
→ 立即回滚，不等修复
```

---

### Step 2: Git 回滚到稳定版本

**查看最近提交**:
```bash
git log --oneline -n 10
```

**找到最后一个稳定版本**:
```bash
# 查看某个commit的详情
git show <commit-hash>

# 确定稳定版本（如 abc1234）
```

**回滚方式 A: 创建回退commit**:
```bash
# 推荐方式（保留历史）
git revert HEAD --no-edit

# 或回退到特定版本
git revert HEAD~3..HEAD --no-edit
```

**回滚方式 B: 硬回退** (谨慎):
```bash
# 本地回退
git reset --hard abc1234

# 强制推送（需要权限）
git push --force
```

---

### Step 3: 快速测试验证

**测试清单**:
- [ ] 应用能正常启动
- [ ] 核心功能可用
- [ ] 数据加载正常
- [ ] 无明显错误

**快速测试脚本**:
```bash
# 编译
npm run build:app

# 真机测试
# 安装到测试设备
# 验证核心功能
```

---

### Step 4: 重新发布

**uni-app 发布**:
```bash
# 打包
HBuilderX → 发行 → 原生App-云打包

# 或使用 CLI
vue-cli-service uni-build --platform app-plus
```

**发布到应用商店**:
- 上传新版本
- 标记为"紧急修复"
- 加快审核（如有渠道）

---

### Step 5: 用户通知

**应用内通知**:
```javascript
// 紧急公告
uni.showModal({
  title: '系统通知',
  content: '检测到版本异常，请立即更新到最新版本',
  showCancel: false,
  success: () => {
    // 跳转到更新页面
  }
});
```

**推送通知** (如有):
```javascript
// 使用推送服务
uni.push.sendMessage({
  title: '紧急更新',
  content: '请立即更新应用至最新版本',
  payload: {
    type: 'force_update'
  }
});
```

---

## 💾 数据兼容性处理

### 版本回退导致的数据问题

**场景**: 新版本 v2.0 改了数据结构，现在回退到 v1.9

**问题**: v1.9 无法识别 v2.0 的数据格式

**解决方案：数据降级**:
```javascript
// utils/dataDowngrade.js
export function downgradeData() {
  const version = uni.getStorageSync('app_version');
  
  if (version === '2.0') {
    // 将 v2.0 数据转换为 v1.9 格式
    const v2Data = uni.getStorageSync('user_data_v2');
    const v1Data = convertV2ToV1(v2Data);
    uni.setStorageSync('user_data', v1Data);
  }
}

function convertV2ToV1(v2Data) {
  // 转换逻辑
  return {
    name: v2Data.profile.name, // v2的嵌套结构
    age: v2Data.profile.age,
    // v2新增的字段丢弃
  };
}
```

**启动时检查**:
```javascript
// App.vue - onLaunch
onLaunch(() => {
  downgradeData();
});
```

---

## 🔄 回滚后的恢复计划

### Step 1: 修复原

Bug

**分析失败原因**:
- 为什么没在测试时发现？
- 哪个环节出了问题？

**修复流程**:
```
1. 在本地分支修复 Bug
2. 充分测试（包括之前遗漏的场景）
3. 代码审查
4. 小范围灰度测试
5. 正式发布
```

---

### Step 2: 更新 BUG.md

```markdown
## [已回滚] 严重Bug - 问题描述

**发生时间**: 2025-12-06
**影响版本**: v2.0.0
**回滚版本**: v1.9.5

**问题描述**: [详细描述]

**回滚决策**: 
- 影响范围: 100% 用户
- 严重程度: 应用无法启动
- 决策: 立即回滚

**修复计划**: 
1. 修复 Bug
2. 增加测试用例
3. 重新发布
```

---

### Step 3: 事后分析

**召开复盘会议**:
- 问题根源
- 为什么测试没发现
- 流程改进建议

**更新流程**:
- 加强测试覆盖
- 增加审查环节
- 建立灰度发布机制

---

## 🛡️ 预防措施

### 1. 灰度发布

**逐步放量**:
```
Day 1: 5% 用户
Day 2: 20% 用户（无问题）
Day 3: 50% 用户
Day 4: 100% 用户
```

### 2. 金丝雀发布

**保留旧版本**:
- 50% 用户使用新版本
- 50% 用户继续使用旧版本
- 监控对比数据
- 确认无问题后全量发布

### 3. 回滚演练

**定期演练**:
- 每季度进行一次回滚演练
- 确保所有人熟悉流程
- 验证回滚机制可用

---

## ⚡ 快速回滚命令

**一键回滚脚本**:
```bash
# rollback.sh
#!/bin/bash

# 1. 回退代码
git reset --hard $1  # $1 = 稳定版本hash

# 2. 重新编译
npm run build

# 3. 自动测试
npm run test

echo "回滚完成，请进行人工验证"
```

**使用**:
```bash
./rollback.sh abc1234
```

---

## 📖 参考文档

- [Git 官方文档 - 撤销](https://git-scm.com/book/zh/v2)
- [5-01-git-commit.md](./5-01-git-commit.md) - Git 提交规范

---

**创建时间**: 2025-12-06  
**重要性**: 🔴 关键（建议打印并张贴）
