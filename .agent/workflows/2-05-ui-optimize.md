---
description: UI/UX 优化工作流
---

# UI/UX 优化工作流

## 使用场景
界面美化、用户体验提升、色彩主题调整

---

## 🎨 色彩主题优化

### Step 1: 定义色彩系统

**CSS 变量方式**:
```css
/* styles/theme.css */
:root {
  /* 主色调 */
  --color-primary: #00D4FF;
  --color-primary-light: #33DDFF;
  --color-primary-dark: #00A3CC;
  
  /* 功能色 */
  --color-success: #00FF94;
  --color-warning: #FFB800;
  --color-danger: #FF4444;
  
  /* 中性色 */
  --color-bg: #0A0E27;
  --color-card: #1A1F3A;
  --color-text: #E0E6ED;
  --color-text-secondary: #8B92A6;
}
```

### Step 2: 暗色模式支持

**自动切换**:
```javascript
// composables/useTheme.js
import { ref } from 'vue';

export function useTheme() {
  const isDark = ref(true);
  
  const toggleTheme = () => {
    isDark.value = !isDark.value;
    updateThemeVars();
  };
  
  const updateThemeVars = () => {
    if (isDark.value) {
      document.documentElement.style.setProperty('--color-bg', '#0A0E27');
    } else {
      document.documentElement.style.setProperty('--color-bg', '#FFFFFF');
    }
  };
  
  return { isDark, toggleTheme };
}
```

### Step 3: 渐变效果

**赛博朋克风格**:
```css
.gradient-bg {
  background: linear-gradient(135deg, 
    rgba(0, 212, 255, 0.1) 0%,
    rgba(0, 255, 148, 0.1) 100%
  );
}

.neon-border {
  border: 1px solid var(--color-primary);
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}
```

---

## ✨ 动画效果优化

### 流畅度优化

**使用 transform 而非 position**:
```css
/* ❌ 性能差 */
.bad-animation {
  transition: left 0.3s;
}

/* ✅ 性能好 */
.good-animation {
  transition: transform 0.3s;
}
```

**GPU 加速**:
```css
.smooth {
  will-change: transform;
  transform: translateZ(0);
}
```

### 微动画

**按钮点击反馈**:
```vue
<style>
.btn {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn:active {
  transform: scale(0.95);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}
</style>
```

**页面切换动画**:
```vue
<template>
  <transition name="fade-slide">
    <view class="page">
      <!-- 内容 -->
    </view>
  </transition>
</template>

<style>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
```

---

## 🔄 交互流程优化

### 操作路径简化

**优化前** (3步):
```
主页 → 设置 → 皮肤管理 → 选择皮肤
```

**优化后** (2步):
```
主页 → 长按宠物 → 快速换肤菜单
```

### 手势优化

**添加更多快捷手势**:
```javascript
// composables/useGestures.js
export function useQuickActions() {
  // 双击 - 快速互动
  const handleDoubleTap = () => {
    growth.interact();
  };
  
  // 长按 - 快捷菜单
  const handleLongPress = () => {
    showQuickMenu();
  };
  
  // 两指捏合 - 调整大小
  const handlePinch = (scale) => {
    floatWindow.setSize(scale);
  };
}
```

---

## 📱 响应式布局优化

### 适配不同屏幕

```css
/* 使用 rpx 单位 */
.container {
  width: 100%;
  padding: 30rpx;
}

/* 大屏优化 */
@media (min-width: 750rpx) {
  .container {
    max-width: 1200rpx;
    margin: 0 auto;
  }
}

/* 小屏优化 */
@media (max-width: 375rpx) {
  .text {
    font-size: 28rpx;
  }
}
```

---

## ♿ 无障碍优化

### ARIA 标签

```vue
<button 
  :aria-label="isMonitoring ? '停止监控' : '开启监控'"
  role="button"
  @click="toggleMonitor"
>
  {{ isMonitoring ? '停止' : '开启' }}
</button>
```

### 对比度检查

**文字对比度** (WCAG AA 标准):
- 正文: 至少 4.5:1
- 大字: 至少 3:1

```css
/* 确保足够对比度 */
.text-primary {
  color: #E0E6ED; /* 浅色文字 */
  background: #0A0E27; /* 深色背景 */
  /* 对比度: 12.7:1 ✅ */
}
```

---

## 🎯 视觉层次优化

### 卡片设计

```css
.card {
  background: var(--color-card);
  border-radius: 16rpx;
  padding: 30rpx;
  
  /* 层次感 */
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    0 0 1px rgba(0, 212, 255, 0.1);
}

.card-elevated {
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 0 2px rgba(0, 212, 255, 0.2);
}
```

### 排版优化

```css
/* 黄金比例 */
.heading {
  font-size: 48rpx;
  line-height: 1.2;
  margin-bottom: 24rpx; /* 48 * 0.5 */
}

.body {
  font-size: 30rpx;
  line-height: 1.6;
  margin-bottom: 18rpx; /* 30 * 0.6 */
}
```

---

## 📊 UI 审查清单

### 视觉一致性

- [ ] 色彩使用一致（使用 CSS 变量）
- [ ] 间距统一（8px 倍数）
- [ ] 圆角统一（8rpx/16rpx）
- [ ] 字体大小层级清晰

### 交互反馈

- [ ] 所有按钮有点击反馈
- [ ] 加载状态有提示
- [ ] 错误有友好提示
- [ ] 成功有确认反馈

### 性能

- [ ] 动画流畅（60 FPS）
- [ ] 无卡顿
- [ ] 图片加载快（懒加载）

---

## 🎨 设计系统

### 建立组件库

**按钮系统**:
```vue
<!-- components/BaseButton.vue -->
<template>
  <button 
    :class="['btn', `btn-${type}`, `btn-${size}`]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary' // primary, secondary, danger
  },
  size: {
    type: String,
    default: 'medium' // small, medium, large
  }
});
</script>

<style scoped>
.btn {
  border-radius: 12rpx;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-small { padding: 10rpx 20rpx; }
.btn-medium { padding: 16rpx 32rpx; }
.btn-large { padding: 24rpx 48rpx; }
</style>
```


---

## ✅ 优化效果验证

### Step 1: 视觉验证

**色彩系统检查**:
- [ ] 色彩对比度符合 WCAG AA 标准（文字至少 4.5:1）
- [ ] 暗色模式切换流畅无闪烁
- [ ] 所有色彩使用 CSS 变量（无硬编码）
- [ ] 渐变效果在不同设备显示一致

**工具**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**动画检查**:
- [ ] 所有动画帧率 ≥ 60 FPS
- [ ] 无卡顿或延迟感
- [ ] transition 使用 transform（非 position）
- [ ] 启用 GPU 加速（will-change）

**响应式检查**:
- [ ] 375px 小屏正常显示
- [ ] 750px+ 大屏正常显示
- [ ] 横屏模式正常显示

---

### Step 2: 性能验证

**加载性能**:
```powershell
# 测试页面加载时间
Measure-Command { 
  # 刷新页面，记录时间
}
```

**验证标准**:
- [ ] 首屏加载 < 1s
- [ ] 交互响应 < 100ms
- [ ] 页面切换 < 300ms

**内存检查**:
- [ ] 优化前后内存对比
- [ ] 长时间使用无内存泄漏
- [ ] 动画结束后内存释放

**工具**: Chrome DevTools → Performance

---

### Step 3: 无障碍验证

**键盘导航**:
- [ ] Tab 键可访问所有交互元素
- [ ] 焦点顺序逻辑正确
- [ ] Enter/Space 可触发操作

**屏幕阅读器**:
- [ ] 所有按钮有 aria-label
- [ ] 图片有 alt 描述
- [ ] 页面标题正确

---

### Step 4: 用户测试（可选但推荐）

**测试方案**:
```markdown
## UI 优化用户测试

### 测试目标
验证新 UI 的用户接受度和可用性

### 测试人员
- 至少 5 个用户
- 包含新用户和老用户

### 测试步骤
1. 展示优化前后的对比
2. 让用户试用新 UI（10分钟）
3. 收集反馈问卷

### 问卷模板
1. 新 UI 的整体印象？（1-5分）
2. 色彩主题喜欢吗？（是/否）
3. 动画效果流畅吗？（是/否）
4. 还有什么建议？（开放问题）

### 接受标准
- 平均分 ≥ 4 分
- 至少 80% 用户喜欢新 UI
- 无严重可用性问题
```

**记录位置**: `docs/ux/ui-test-YYYY-MM-DD.md`

---

### Step 5: 对比报告

**模板**:
```markdown
# UI 优化效果报告 - 2025-12-07

## 优化内容
- 色彩主题升级（赛博朋克风格）
- 动画效果优化（60 FPS）
- 交互流程简化（3步→2步）

## 性能对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 首屏加载 | 1.2s | 0.8s | ⬆️ 33% |
| 动画帧率 | 45 FPS | 60 FPS | ⬆️ 33% |
| 内存占用 | 65MB | 60MB | ⬇️ 8% |

## 用户反馈
- 参与人数: 8 人
- 平均评分: 4.5/5
- 接受率: 87.5%

## 主要改进点
1. ✅ 色彩对比度提升 20%
2. ✅ 动画流畅度显著提升
3. ✅ 操作路径减少 1 步

## 待优化
1. 部分用户建议字体再大一点
2. 动画速度可以再快一点

## 结论
✅ 优化达到预期目标，建议正式发布
```

---

## 📖 参考资源

- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/)
- [uni-app UI组件](https://uniapp.dcloud.net.cn/component/)

---

**创建时间**: 2025-12-06
