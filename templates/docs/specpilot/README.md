# SpecPilot

SpecPilot 是本项目用于后续需求开发的规格领航流程。它把“需求是什么”和“怎么实现”分开记录，让 Codex 在编码前拥有稳定上下文。

## 核心目标

- 需求有编号、状态和历史记录
- 方案先于复杂实现
- 改动范围、测试结果和风险可追踪
- 后续需求可以引用已有需求和能力规格

## 四层定义

| 层级 | 文件 | 作用 |
|------|------|------|
| 项目定义 | `project.md`、`project-guide.md` | 记录项目约定、架构、开发模式 |
| 能力规格 | `specs/` | 记录系统已实现的核心能力 |
| 需求定义 | `requirements/REQ-xxx-draft.md` | 记录原始需求、确认结果、测试用例 |
| 技术实现 | `requirements/REQ-xxx-design.md`、`REQ-xxx-tasks.md` | 记录方案、任务、审查和测试 |

## 使用方式

当前项目使用 `specpilot-codex` 提供的全局 `/specpilot:*` 命令。安装后，输入 `/specpilot` 可以筛选出 9 个固定动作。也可以直接输入文本指令，例如：

```text
/specpilot:new
/specpilot:confirm REQ-001
/specpilot:exec REQ-001
方案确认，请开始实施
/specpilot:archive REQ-001
```

Codex 会根据 `SPECPILOT.md`、`project.md`、`project-guide.md` 和需求记录将这些指令作为项目内工作流处理。`AGENTS.md` 不是必需文件；如果项目已有该文件，可作为补充上下文。

## 文件约定

- 新需求文件命名：`REQ-001-draft.md`
- 复杂技术方案：`REQ-001-design.md`
- 多步骤任务拆分：`REQ-001-tasks.md`
- 完成后可创建精简存档：`REQ-001-short-description.md`

## 执行原则

- 优先最小改动
- 先确认需求，再设计方案
- “先出方案”模式必须等待用户明确批准后再编码
- 不把示例需求或外部项目上下文带入本项目
- 文档和代码保持同步，避免需求文档变成摆设
