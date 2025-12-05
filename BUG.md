# 已知问题 (Known Issues)

记录待修复的 Bug 和问题。

---

## 🔴 待修复

### 1. 每日问候在悬浮窗启动后才显示
**发现时间**: 2024-12-05  
**严重程度**: 低  
**状态**: 临时解决

**问题描述**:  
用户首次打开应用时，如果悬浮窗尚未开启，每日问候只会添加到聊天记录中。用户之后开启悬浮窗时，问候才会弹出显示。

**期望行为**:  
问候应该在悬浮窗开启的第一时间显示，或者提供更好的用户体验方案。

**临时解决方案**:  
- 将问候保存到 `pending_greeting` 存储
- 开启悬浮窗时检查并显示待发送问候
- 详见 `index.vue` 的 `checkDailyGreeting()` 和 `handleTogglePet()`

**相关文件**:
- `pages/index/index.vue`

---

## 🟡 待观察/待测试

### 1. 成就解锁触发
**状态**: 刚修复  
**修复内容**: 添加 `checkAchievements()` 触发点
- onShow 延迟 500ms
- sendMessage 后
- sendQuickReply 后

### 2. 抚摸互动效果
**状态**: 刚修复  
**修复内容**: `interact()` 返回 `{mood, bond}` 对象  
**预期效果**: Toast 提示 + 成长日志

### 3. 每日统计重置
**状态**: 新增  
**触发条件**: `checkAndResetDailyStats()` 在 onShow 检测日期变化

---

## 🟢 已修复

（暂无）
