---
description: ### D - Documentation Strategy (文档策略)
---

### D - Documentation Strategy (文档策略)

* **README 保护协议 (README Protection Protocol)**:
    * **禁止重写**: 严禁完全重写或大幅替换根目录的 `README.md`。这是项目的"门面"，通常包含人工精修的营销文案和演示图。
    * **增量更新**: 仅允许在 `README.md` 的特定区域（如"文档索引"或"最新更新"或"功能描述"或"开发进度"）进行**增量添加**。

* **指南分离原则 (Guide Separation)**:
    * **独立文件**: 所有详细的技术文档、架构说明、功能清单或 AI 协作指南，**必须**创建为独立的 Markdown 文件（例如：`AI_GUIDE.md`, `DEVELOPMENT.md`, `ARCHITECTURE.md`）。
    * **引用机制**: 新建文档后，仅需在 `README.md` 中添加一行引用链接。
        * *示例*: `> 📖 详细技术架构请参阅: [AI 开发指南](./AI_GUIDE.md)`

* **变更日志 (Changelog)**: 重大的功能更新应记录在 `CHANGELOG.md` 或独立更新日志中，而不是堆砌在 README 首页。