# SpecPilot 命令说明

原版 SpecPilot 使用 Claude Code 斜杠命令。当前项目面向 Codex 使用，由 `specpilot-codex` 安装全局 `/specpilot:*` 命令。

在 Codex 中直接输入以下文本即可触发对应流程：

- `/specpilot:new`
- `/specpilot:confirm REQ-xxx`
- `/specpilot:exec REQ-xxx`
- `/specpilot:check REQ-xxx`
- `/specpilot:update REQ-xxx`
- `/specpilot:archive REQ-xxx`
- `/specpilot:list`

具体流程见 `docs/specpilot/specpilot.md`、`project.md` 和 `project-guide.md`。
