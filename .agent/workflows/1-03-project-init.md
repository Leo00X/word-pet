---
description: 项目初始化指南
---

# 项目初始化工作流

## 使用场景
基于现有项目模板（如WordParasite）创建新项目，或为不同技术栈建立标准化工作流

---

## 🎯 核心理念

**复用 WordParasite 的最佳实践**:
- 完善的文档体系
- 标准化 workflows
- AI 协作规则
- 质量保证机制

**适用不同技术栈**:
- uni-app 移动端项目
- Keil5 单片机项目  
- Vue/React 前端项目
- Node.js 后端项目

---

## 📋  uni-app 项目初始化

### Step 1: 创建项目结构

```bash
# HBuilderX 创建项目
# 或使用 CLI
npx degit dcloudio/uni-preset-vue#vite my-project
cd my-project
npm install
```

### Step 2: 复制 Workflows

```bash
# 从 WordParasite 复制 .agent 目录
cp -r path/to/word-pet/.agent ./

# 修改 Rules 文件
# 将 word

pet 相关内容替换为新项目名称
```

### Step 3: 建立文档体系

```bash
# 创建核心文档
touch DEVELOPMENT.md ARCHITECTURE.md FEATURES.md

# 创建 docs 目录
mkdir -p docs/guides docs/maintenance docs/archive

# 创建维护文档
touch docs/maintenance/BUG.md
touch docs/maintenance/UPDATES.md
touch docs/maintenance/bug_prevention_guide.md
```

### Step 4: 配置开发环境

```javascript
// manifest.json - 配置 AppID
{
  "appid": "your-app-id",
  "name": "项目名称",
  // ...
}

// pages.json - 配置页面
{
  "pages": [
    {
      "path": "pages/index/index"
    }
  ]
}
```

### Step 5: 首次运行验证

- [ ] HBuilderX 能正常打开项目
- [ ] 运行到浏览器成功
- [ ] 运行到真机成功（如需要）

---

## 🔧 Keil5 单片机项目初始化

### Step 1: 创建项目骨架

```bash
# 创建项目目录
mkdir my-mcu-project
cd my-mcu-project

# 创建标准目录结构
mkdir -p Hardware User System Drivers .agent
```

### Step 2: 复制核心 Workflows

**从 WordParasite 复制并调整**:

```bash
# 复制 workflows
cp -r path/to/word-pet/.agent/workflows ./.agent/

# 需要保留的 workflows:
# 1-01-quick-start.md
# 2-01-add-feature.md
# 2-02-fix-bug.md
# 3-01-code-review.md
# 4-01-docs-update.md
# 5-01-git-commit.md
# 6-01-report-bug.md

# 删除不适用的:
# - 真机调试（改为Keil调试）
# - UI优化（单片机无UI）
```

### Step 3: 创建单片机专用 Workflows

**新建**: `2-07-keil-debug.md`
```markdown
# Keil 调试工作流

## 硬件连接
- JLINK/STLINK 连接
- 供电检查
- 下载配置

## 断点调试
- Watch 窗口
- 寄存器查看
- 内存查看

## 常见问题
- 下载失败
- 无法进入调试
```

**新建**: `2-08-hardware-test.md`
```markdown
# 硬件测试工作流

## 外设测试
- GPIO 测试
- UART 测试
- I2C/SPI 测试

## 性能测试
- 中断响应时间
- 功耗测量
```

### Step 4: 建立文档体系

```markdown
# DEVELOPMENT.md

## 硬件平台
- MCU: STM32F103C8T6
- 主频: 72MHz
- Flash: 64KB

## 开发环境
- Keil MDK 5.xx
- JLINK/STLINK
- Pack 版本: xxx

## 编译配置
- C99 标准
- 优化等级: -O2

## 调试方法
[参考 2-07-keil-debug.md]
```

### Step 5: 首次编译验证

- [ ] Keil 工程能正常打开
- [ ] 编译无错误
- [ ] 下载到硬件成功
- [ ] 基础功能正常（LED闪烁等）

---

## 💻 Vue/React 前端项目初始化

### Step 1: 创建项目

```bash
# Vue 3
npm create vite@latest my-vue-app -- --template vue

# React
npx create-react-app my-react-app
```

### Step 2: 复用 Workflows

**保留的 workflows**:
- 学习指南（全部）
- 开发流程（add-feature, fix-bug, refactor, performance, ui-optimize）
- 质量保证（code-review, security-audit）
- 文档管理（全部）
- 版本管理（全部）
- 工具辅助（report-bug）

**删除**:
- 真机调试（改为浏览器调试）

### Step 3: 调整 Rules 文件

```markdown
# [项目名]-dev-rules.md

## 架构约束
- 组件设计原则
- 状态管理规范
- API 调用规范

## 技术栈约束
- Vue 3 Composition API / React Hooks
- TypeScript
- 单元测试(Vitest/Jest)

## 文件行数限制
- 组件: < 300 行
- 工具函数: < 200 行
```

---

## 📦 通用初始化清单

### 文档体系 ✅

- [ ] `README.md` - 项目介绍
- [ ] `DEVELOPMENT.md` - 开发指南
- [ ] `ARCHITECTURE.md` - 架构设计
- [ ] `FEATURES.md` - 功能清单
- [ ] `docs/maintenance/BUG.md` - Bug 追踪
- [ ] `docs/maintenance/UPDATES.md` - 更新日志

### Workflows ✅

- [ ] 复制 `.agent/workflows/` 目录
- [ ] 根据技术栈删除不适用的 workflows
- [ ] 创建技术栈专用的 workflows
- [ ] 测试 workflows 可用性

### AI 协作 ✅

- [ ] 创建 `.agent/rules/[项目名]-dev-rules.md`
- [ ] 调整架构约束
- [ ] 调整技术栈约束
- [ ] 调整文件行数限制

### Git 配置 ✅

- [ ] 初始化 Git 仓库
- [ ] 配置 `.gitignore`
- [ ] 首次提交

```bash
git init
git add .
git commit -m "chore: 项目初始化

- 建立文档体系
- 复用 WordParasite workflows
- 配置 AI 协作规则
"
```

---

## 🎓 最佳实践

### 不要重新发明轮子

**复用 WordParasite 的**:
- ✅ 完整的 workflows 体系
- ✅ 文档分类结构
- ✅ AI 协作机制
- ✅ Bug 防范指南

**根据项目调整**:
- ✅ 技术栈相关内容
- ✅ 开发规范细节
- ✅ 特定领域的 workflows

### Workflows 复用优先级

| 优先级 | Workflows | 适用性 |
|--------|-----------|--------|
| **必须** | 学习指南、文档管理、版本管理 | 所有项目 |
| **推荐** | 开发流程、质量保证 | 大部分项目 |
| **可选** | 工具辅助、运维监控 | 按需选择 |

---

## 📖 参考文档

- [项目基础搭建指南](../../../project-foundation-guide.md) - 完整的方法论
- [WordParasite workflows](../../.agent/workflows/) - 参考模板

---

**创建时间**: 2025-12-06  
**维护**: 每个新项目都应该基于这个模板
