---
description: 监控告警系统
---

# 监控告警工作流

## 使用场景
生产环境监控、错误追踪、用户行为分析、性能监控

---

## 📊 监控体系

### 三层监控

```
1. 错误监控 - 捕获崩溃和异常
2. 性能监控 - 追踪响应时间和资源使用
3. 行为监控 - 分析用户操作路径
```

---

## 🔴 错误日志收集

### Step 1: 全局错误捕获

**App.vue 错误拦截**:
```javascript
// App.vue
export default {
  onError(err) {
    // 记录错误
    reportError({
      type: 'js_error',
      message: err.message,
      stack: err.stack,
      page: getCurrentPages()[0]?.route
    });
  },
  
  onUnhandledRejection(reason) {
    // Promise 错误
    reportError({
      type: 'promise_error',
      message: reason.toString()
    });
  }
}
```

### Step 2: 手动错误上报

```javascript
// utils/errorReport.js
export function reportError(error) {
  const errorLog = {
    timestamp: Date.now(),
    device: getDeviceInfo(),
    version: getAppVersion(),
    ...error
  };
  
  // 本地存储
  saveErrorLog(errorLog);
  
  // 上报服务器
  uploadErrorLog(errorLog);
}

function getDeviceInfo() {
  const info = uni.getSystemInfoSync();
  return {
    platform: info.platform,
    system: info.system,
    model: info.model
  };
}

function getAppVersion() {
  return uni.getStorageSync('app_version') || '1.0.0';
}
```

### Step 3: 错误日志查看

**本地查看**:
```javascript
// pages/dev-tools/error-logs.vue
export default {
  data() {
    return {
      errors: []
    };
  },
  
  onLoad() {
    const logs = uni.getStorageSync('error_logs') || [];
    this.errors = logs.slice(-100); // 最近100条
  }
}
```

---

## 💥 崩溃率监控

### UTS 插件集成

**Android 崩溃捕获**:
```kotlin
// uts/crash-reporter/index.uts
class CrashHandler : Thread.UncaughtExceptionHandler {
  override fun uncaughtException(t: Thread, e: Throwable) {
    // 保存崩溃日志
    saveCrashLog(e.stackTraceToString())
    
    // 重启应用
    restartApp()
  }
}
```

**崩溃率计算**:
```javascript
// utils/crashMonitor.js
export function calculateCrashRate() {
  const totalLaunches = uni.getStorageSync('total_launches') || 0;
  const crashes = uni.getStorageSync('crash_count') || 0;
  
  return crashes / totalLaunches;
}

// 启动时记录
onLaunch(() => {
  const total = uni.getStorageSync('total_launches') || 0;
  uni.setStorageSync('total_launches', total + 1);
});
```

---

## 📈 用户行为分析

### Step 1: 埋点设计

**关键埋点**:
```javascript
// utils/analytics.js
export const EVENTS = {
  // 页面访问
  PAGE_VIEW: 'page_view',
  
  // 功能使用
  FEATURE_CLICK: 'feature_click',
  MONITOR_START: 'monitor_start',
  MONITOR_STOP: 'monitor_stop',
  
  // 商业转化
  SKIN_PURCHASE: 'skin_purchase',
  AD_CLICK: 'ad_click'
};

export function trackEvent(eventName, params = {}) {
  const event = {
    name: eventName,
    timestamp: Date.now(),
    userId: getUserId(),
    ...params
  };
  
  // 保存
  saveEvent(event);
  
  // 上报
  uploadEvent(event);
}
```

### Step 2: 使用埋点

```javascript
// pages/index/index.vue
export default {
  methods: {
    startMonitor() {
      trackEvent(EVENTS.MONITOR_START, {
        from: 'main_page'
      });
      
      // 业务逻辑
      monitor.start();
    },
    
    purchaseSkin(skinId) {
      trackEvent(EVENTS.SKIN_PURCHASE, {
        skinId,
        price: skin.price,
        coins: growth.coins.value
      });
      
      // 购买逻辑
    }
  }
}
```

### Step 3: 数据分析

**用户行为漏斗**:
```javascript
// 分析转化率
function analyzeFunnel() {
  const events = getStoredEvents();
  
  const pageViews = events.filter(e => e.name === 'page_view').length;
  const featureClicks = events.filter(e => e.name === 'feature_click').length;
  const purchases = events.filter(e => e.name === 'skin_purchase').length;
  
  return {
    clickRate: (featureClicks / pageViews * 100).toFixed(2) + '%',
    conversionRate: (purchases / featureClicks * 100).toFixed(2) + '%'
  };
}
```

---

## ⚡ 性能监控

### 启动时间监控

```javascript
// App.vue
let launchTime = 0;

onLaunch(() => {
  launchTime = Date.now();
});

onShow(() => {
  const startupTime = Date.now() - launchTime;
  
  trackEvent('app_startup', {
    duration: startupTime
  });
  
  // 告警：启动时间 > 3秒
  if (startupTime > 3000) {
    reportSlowStartup(startupTime);
  }
});
```

### 接口响应时间

```javascript
// utils/request.js
http.interceptors.request.use(config => {
  config.startTime = Date.now();
  return config;
});

http.interceptors.response.use(response => {
  const duration = Date.now() - response.config.startTime;
  
  // 记录响应时间
  trackEvent('api_response', {
    url: response.config.url,
    duration,
    status: response.statusCode
  });
  
  // 告警：响应时间 > 2秒
  if (duration > 2000) {
    reportSlowAPI(response.config.url, duration);
  }
  
  return response;
});
```

---

## 🔔 告警配置

### 告警规则

| 指标 | 阈值 | 告警级别 |
|------|------|---------|
| 崩溃率 | > 1% | 🔴 严重 |
| 错误率 | > 5% | 🟡 警告 |
| 启动时间 | > 3s | 🟡 警告 |
| API 响应 | > 2s | 🟡 警告 |
| 内存占用 | > 200MB | 🟢 提示 |

### 告警通知

**本地通知**:
```javascript
// utils/alert.js
export function sendAlert(level, message) {
  if (level === 'critical') {
    uni.showModal({
      title: '严重告警',
      content: message,
      showCancel: false
    });
  }
  
  // 保存告警历史
  saveAlert({ level, message, timestamp: Date.now() });
}
```

**远程通知** (如有服务器):
```javascript
export function sendRemoteAlert(alert) {
  uni.request({
    url: 'https://api.example.com/alerts',
    method: 'POST',
    data: alert
  });
}
```

---

## 📊 Dashboard 搭建

### 数据可视化

**本地 Dashboard**:
```vue
<!-- pages/dev-tools/dashboard.vue -->
<template>
  <view class="dashboard">
    <view class="card">
      <text class="title">崩溃率</text>
      <text class="value">{{ crashRate }}%</text>
    </view>
    
    <view class="card">
      <text class="title">错误数</text>
      <text class="value">{{ errorCount }}</text>
    </view>
    
    <view class="card">
      <text class="title">日活用户</text>
      <text class="value">{{ dau }}</text>
    </view>
    
    <!-- 图表 -->
    <qiun-ucharts 
      :opts="errorTrendOpts"
      :chartData="errorTrendData"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      crashRate: 0,
      errorCount: 0,
      dau: 0
    };
  },
  
  onLoad() {
    this.loadMetrics();
  },
  
  methods: {
    loadMetrics() {
      // 加载监控指标
      this.crashRate = this.calculateCrashRate();
      this.errorCount = this.getErrorCount();
      this.dau = this.getDAU();
    }
  }
}
</script>
```

---

## 🔧 实施步骤

### Step 1: 基础收集

- [ ] 全局错误拦截
- [ ] 崩溃日志收集
- [ ] 性能数据记录

### Step 2: 埋点接入

- [ ] 定义埋点事件
- [ ] 关键页面埋点
- [ ] 关键功能埋点

### Step 3: 告警配置

- [ ] 定义告警阈值
- [ ] 配置告警通知
- [ ] 测试告警触发

### Step 4: Dashboard

- [ ] 开发数据展示页面
- [ ] 接入可视化图表
- [ ] 定期查看分析

---

## 📖 参考资源

- [uni 统计](https://tongji.dcloud.net.cn/)
- [友盟+](https://www.umeng.com/)
- [Sentry](https://sentry.io/)

---

**创建时间**: 2025-12-06  
**建议**: 从简单的错误收集开始，逐步完善
