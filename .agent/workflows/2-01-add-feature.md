---
description: 新增功能标准流程
---

# 新增功能工作流

## 使用场景
需要添加新功能（如新的 UI 面板、新的业务逻辑等）

---

## 📋 标准流程

### Step 1: 规划设计

**需要明确**:
- 功能名称和用途
- 是否需要新的 Composable？
- 是否需要新的 Component？
- 数据存储方案
- 与现有功能的关联

### Step 2: 创建 Composable（业务逻辑）

**位置**: `pages/index/composables/useXxx.js`

**模板**:
```javascript
// useXxx.js
import { ref } from 'vue';

export function useXxx() {
  // 1. 状态定义
  const data = ref(null);
  
  // 2. 数据加载
  const loadData = () => {
    const cached = uni.getStorageSync('xxx_data');
    if (cached) data.value = cached;
  };
  
  // 3. 数据保存
  const saveData = () => {
    uni.setStorageSync('xxx_data', data.value);
  };
  
  // 4. 业务方法
  const doSomething = () => {
    // 业务逻辑
    saveData();
  };
  
  // 5. 返回
  return {
    data,
    loadData,
    saveData,
    doSomething
  };
}
```

**检查清单**:
- [ ] 文件行数 < 450 行
- [ ] 使用 uni API 而非 Web API
- [ ] 返回所有必要的状态和方法

### Step 3: 创建 Component（UI 组件）

**位置**: `pages/index/components/XxxPanel.vue`

**模板**:
```vue
<template>
  <view class="xxx-panel">
    <!-- UI 内容 -->
  </view>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  data: Object
});

// Emits
const emit = defineEmits(['update', 'close']);

// 计算属性
const displayText = computed(() => props.data?.text || '');

// 方法
const handleClick = () => {
  emit('update', { /* data */ });
};
</script>

<style lang="scss" scoped>
.xxx-panel {
  // 样式
}
</style>
```

**检查清单**:
- [ ] 文件行数 < 350 行
- [ ] Props 和 Emits 清晰定义
- [ ] 无业务逻辑（只有 UI 交互）

### Step 4: 集成到 index.vue

```vue
<script setup>
// 导入
import XxxPanel from './components/XxxPanel.vue';
import { useXxx } from './composables/useXxx.js';

// 初始化
const xxx = useXxx();

// 生命周期
onShow(() => {
  xxx.loadData();  // 加载数据
});

// 事件处理
const handleXxxUpdate = (data) => {
  xxx.doSomething(data);
};
</script>

<template>
  <xxx-panel 
    :data="xxx.data.value"
    @update="handleXxxUpdate"
  />
</template>
```

**检查清单**:
- [ ] Composable 正确初始化
- [ ] onShow 中加载数据
- [ ] 事件正确绑定

### Step 5: 测试验证

**逻辑闭环检查**:
- [ ] Composable 的方法都有调用点？
- [ ] watch 监听是否正确？
- [ ] 数据持久化是否正常？

**真机测试**:
- [ ] 功能正常运行
- [ ] 重启后数据保持
- [ ] 与其他功能无冲突

### Step 6: 更新文档

```markdown
// FEATURES.md
- ✅ **新功能名称** - 功能说明 ✅ 日期

// README.md - Roadmap
[x] 新功能名称 ✅ 2025-12-06
```

---

## ⚠️ 常见错误

1. **Dead Code** - 创建了 Composable 但忘记调用
2. **响应式丢失** - ref 被解包
3. **数据未加载** - onShow 中忘记 loadData()
4. **index.vue 臃肿** - 把业务逻辑写在 index.vue 中

---

## 📖 参考

- [DEVELOPMENT.md](../../DEVELOPMENT.md#composable-使用模式)
- [Bug 防范指南](../../docs/maintenance/bug_prevention_guide.md)
