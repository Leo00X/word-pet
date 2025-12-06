---
description: 安全审计工作流
---

# 安全审计工作流

## 使用场景
发布前安全检查、定期安全审计、处理安全漏洞

---

## 🔒 安全审计清单

### 1. API 密钥安全检查

#### ❌ 危险：硬编码密钥

```javascript
// ❌ 绝对不要这样做
const API_KEY = 'sk-1234567890abcdef';
const GEMINI_KEY = 'AIzaSyXXXXXXXXX';
```

#### ✅ 正确：加密存储

```javascript
// ✅ 使用加密存储
import { encryptStorage } from '@/utils/encryptStorage.js';

// 保存
encryptStorage.setItem('gemini_api_key', userInputKey);

// 读取
const key = encryptStorage.getItem('gemini_api_key');
```

#### 检查命令

```bash
# 搜索可能的硬编码密钥
rg "API_KEY|api_key|API-KEY" --type js --type vue
rg "sk-[a-zA-Z0-9]+" --type js --type vue
rg "AIzaSy[a-zA-Z0-9_-]+" --type js --type vue
```

---

### 2. 权限最小化检查

#### Android 权限审计

**manifest.json**:
```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "permissions": [
          // 只申请必要权限
          "android.permission.INTERNET",
          "android.permission.READ_EXTERNAL_STORAGE",
          // ❌ 删除不需要的
          // "android.permission.CAMERA",
          // "android.permission.RECORD_AUDIO"
        ]
      }
    }
  }
}
```

#### 检查清单

| 权限 | 是否需要 | 用途 |
|------|---------|------|
| `INTERNET` | ✅ 必需 | API 请求 |
| `SYSTEM_ALERT_WINDOW` | ✅ 需要 | 悬浮窗 |
| `PACKAGE_USAGE_STATS` | ✅ 需要 | 应用监控 |
| `CAMERA` | ❓ 按需 | 扫码功能 |
| `RECORD_AUDIO` | ❌ 不需要 | 无语音功能 |
| `READ_CONTACTS` | ❌ 不需要 | 无联系人功能 |

---

### 3. 数据加密验证

#### 敏感数据检查

**必须加密的数据**:
- [ ] API 密钥
- [ ] 用户密码（如有）
- [ ] 支付信息（如有）
- [ ] 个人隐私数据

**加密方法验证**:
```javascript
// 检查是否使用了加密存储
import { encryptStorage } from '@/utils/encryptStorage.js';

// ✅ 正确
encryptStorage.setItem('sensitive_data', data);

// ❌ 错误
uni.setStorageSync('sensitive_data', data);
```

---

### 4. XSS 防范检查

#### 用户输入处理

**危险场景**:
```vue
<!-- ❌ 危险：直接渲染 HTML -->
<view v-html="userInput"></view>
```

**安全做法**:
```vue
<!-- ✅ 安全：文本渲染 -->
<view>{{ userInput }}</view>

<!-- ✅ 安全：富文本需要过滤 -->
<rich-text :nodes="sanitizeHTML(userInput)"></rich-text>
```

**XSS 过滤函数**:
```javascript
// utils/security.js
export function sanitizeHTML(html) {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

---

### 5. 数据传输安全

#### HTTPS 检查

```javascript
// ✅ 所有 API 请求必须使用 HTTPS
const baseURL = 'https://api.example.com'; // ✅

// ❌ 禁止使用 HTTP
const baseURL = 'http://api.example.com'; // ❌
```

#### 检查命令

```bash
# 搜索 HTTP URL
rg "http://[^/]" --type js --type vue
```

---

### 6. 本地存储安全

#### Storage 数据审计

**检查存储内容**:
```javascript
// 查看所有 storage keys
const storageInfo = uni.getStorageInfoSync();
console.log('存储的 keys:', storageInfo.keys);

// 审计每个 key
storageInfo.keys.forEach(key => {
  const value = uni.getStorageSync(key);
  console.log(key, ':', value);
  // 检查是否有敏感信息未加密
});
```

---

## 🛡️ 安全最佳实践

### 1. API 密钥管理

**原则**:
- ✅ 永远不要提交到 Git
- ✅ 使用环境变量或加密存储
- ✅ 定期轮换密钥

**.gitignore**:
```
# 环境变量
.env
.env.local

# 配置文件（如含密钥）
config/secrets.js
```

---

### 2. 代码混淆

**uni-app 发布配置**:
```json
{
  "app-plus": {
    "distribute": {
      "android": {
        "minifyJS": true,
        "obfuscation": true
      }
    }
  }
}
```

---

### 3. 安全通信

**请求拦截器**:
```javascript
// utils/request.js
import luchRequest from 'luch-request';

const http = new luchRequest({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  // SSL 证书验证
  sslVerify: true
});

// 请求拦截
http.interceptors.request.use(
  config => {
    // 添加签名
    config.data.sign = generateSign(config.data);
    return config;
  }
);
```

---

### 4. 输入验证

**前端验证**:
```javascript
// 验证电子邮件
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 验证手机号
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// 验证 SQL 注入
function containsSQLInjection(input) {
  const patterns = /'|"|;|--|\*|DROP|INSERT|UPDATE|DELETE/gi;
  return patterns.test(input);
}
```

---

## 🔍 安全扫描工具

### 自动扫描脚本

**检查硬编码密钥**:
```powershell
# scan-secrets.ps1
$patterns = @(
  "sk-[a-zA-Z0-9]+",
  "AIzaSy[a-zA-Z0-9_-]+",
  "ghp_[a-zA-Z0-9]+"
)

foreach ($pattern in $patterns) {
  Write-Host "搜索: $pattern"
  rg $pattern --type js --type vue
}
```

**检查不安全的 API**:
```powershell
# 检查使用了 eval
rg "eval\(" --type js

# 检查使用了 innerHTML
rg "innerHTML" --type js --type vue

# 检查 HTTP URL
rg "http://[^/]" --type js --type vue
```

---

## ✅ 安全审计报告模板

```markdown
# 安全审计报告

**审计时间**: 2025-12-06
**审计人**: [姓名]

## 审计结果

### 1. API 密钥安全
- [x] 无硬编码密钥
- [x] 使用加密存储

### 2. 权限检查
- [x] 权限最小化
- [x] 无不必要权限

### 3. 数据加密
- [x] 敏感数据已加密
- [x] HTTPS 传输

### 4. XSS 防范
- [x] 用户输入过滤
- [x] 无 v-html 危险使用

### 5. 发现的问题
- [ ] 问题1：[描述]
- [ ] 问题2：[描述]

## 建议
1. [建议1]
2. [建议2]
```

---

## 📖 参考文档

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [uni-app 安全指南](https://uniapp.dcloud.net.cn/)

---

**创建时间**: 2025-12-06  
**审计周期**: 建议每月一次
