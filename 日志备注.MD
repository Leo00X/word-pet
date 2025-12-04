### 可用的日志函数
如果您想在其他地方添加日志，可以导入并使用：

```javascript
import { debugLog, logUserAction, logAI, logMonitor, logError, logSuccess } from '@/utils/debugLog.js';

// 记录用户操作
logUserAction('操作名称', { 详细信息 });

// AI 相关日志
logAI('AI 请求成功', { 回复内容 });

// 监控相关
logMonitor('检测到应用', { appName: '微信' });

// 错误日志
logError('组件名', error);

// 成功提示
logSuccess('操作成功！');
```

### 关闭日志
如果不需要调试日志，可以编辑 
utils/debugLog.js
文件：

```javascript
const DEBUG_ENABLED = false; // 设置为 false 关闭所有日志
```