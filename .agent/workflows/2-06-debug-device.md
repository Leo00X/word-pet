---
description: HBuilderX 真机调试指南
---

# 真机调试工作流

## 使用场景
需要在真机上测试 WordParasite 项目（必须真机调试）

---

## ⚠️ 重要提示

WordParasite 项目**必须真机调试**，因为：
- 使用了 UTS 插件 (`android-floatwindow`)
- 使用了 Native.js 原生能力
- 标准基座不包含这些插件

---

## 📱 Step 1: 准备工作

### 1.1 手机准备
- [ ] 手机开启开发者模式
- [ ] 开启 USB 调试
- [ ] 连接电脑（USB 数据线）

### 1.2 HBuilderX 配置
- [ ] 打开 HBuilderX
- [ ] 打开 WordParasite 项目
- [ ] 确认 `manifest.json` 中有 AppID

---

## 🔨 Step 2: 制作自定义基座

### 2.1 首次制作基座

```
菜单: 运行 → 运行到手机或模拟器 → 制作自定义调试基座
```

**等待时间**: 3-5 分钟（首次较慢）

### 2.2 基座制作完成

会在 `unpackage/debug/` 生成 APK 文件

---

## 🚀 Step 3: 运行调试

### 3.1 选择自定义基座

```
菜单: 运行 → 运行到手机或模拟器 → 运行到 Android App 基座 → 自定义调试基座
```

### 3.2 等待安装

HBuilderX 会自动：
1. 安装自定义基座到手机
2. 启动应用
3. 建立 HMR 热更新连接

---

## 🔍 Step 4: 调试技巧

### 4.1 查看日志

**HBuilderX 控制台**:
- 自动显示 `console.log` 输出
- 显示错误堆栈

**真机日志面板**:
```vue
<terminal-modal v-if="showTerminal" />
```
→ App 内查看实时日志

### 4.2 常用调试方法

**1. 使用 debugLog 工具**
```javascript
import { logUserAction, logAI, logError } from '@/utils/debugLog.js';

logUserAction('点击功能', { detail });
logAI('AI 响应', { response });
logError('组件名', error);
```

**2. 查看存储数据**
```javascript
// 查看某个 key 的值
const data = uni.getStorageSync('pet_growth_data');
console.log('成长数据:', data);

// 查看所有 storage keys
const info = uni.getStorageInfoSync();
console.log('所有 keys:', info.keys);
```

**3. 测试功能**
```javascript
// 临时修改数据测试
growth.petLevel.value = 10;
growth.coins.value = 999;
growth.saveData();
```

---

## 🐛 Step 5: 常见问题

### 问题 1: 基座安装失败
**解决**: 
1. 检查手机存储空间
2. 手动卸载旧版本
3. 重新制作基座

### 问题 2: 热更新不生效
**解决**:
1. 检查手机和电脑是否同一网络
2. 重启 HBuilderX
3. 重新运行

### 问题 3: 悬浮窗权限问题
**解决**:
```javascript
// 检查权限
const hasPermission = await checkFloatPermission();
if (!hasPermission) {
  // 引导用户授权
  requestPermission('float');
}
```

### 问题 4: 应用监控权限
**解决**:
```javascript
// 检查 UsageStats 权限
const hasPermission = await checkUsagePermission();
if (!hasPermission) {
  requestPermission('usage');
}
```

---

## 📋 调试检查清单

### 核心功能测试
- [ ] 悬浮窗显示/隐藏
- [ ] 应用监控开启/关闭
- [ ] 数据加载（等级、心情、金币）
- [ ] 皮肤切换和同步
- [ ] 聊天对话
- [ ] 成就解锁

### 数据持久化测试
- [ ] 完全关闭应用
- [ ] 重新打开
- [ ] 检查数据是否保留

### 权限测试
- [ ] 悬浮窗权限
- [ ] UsageStats 权限
- [ ] 权限被拒绝后的处理

---

## 🎯 调试技巧总结

### 高效调试方法

1. **使用开发者按钮** - 快速修改数据测试
2. **查看终端日志** - 实时监控事件
3. **断点调试** - HBuilderX 支持真机断点
4. **模拟场景** - 手动触发各种情况

### 调试工具

```javascript
// 全局暴露调试方法（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  globalThis.debug = {
    growth,
    skins,
    chat,
    // ...
  };
}

// 在控制台调用
// debug.growth.addXP(100);
```

---

## 📖 参考文档

- [DEVELOPMENT.md](../../DEVELOPMENT.md#调试与测试) - 调试方法详解
- HBuilderX 官方文档 - 真机运行指南
