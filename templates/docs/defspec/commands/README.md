# DefSpec 命令说明

原版 DefSpec 使用 Claude Code 斜杠命令。当前项目面向 Codex 使用，由 `defspec-codex` 安装全局 `/defspec:*` 命令。

在 Codex 中直接输入以下文本即可触发对应流程：

- `/defspec:new`
- `/defspec:confirm REQ-xxx`
- `/defspec:exec REQ-xxx`
- `/defspec:check REQ-xxx`
- `/defspec:update REQ-xxx`
- `/defspec:archive REQ-xxx`
- `/defspec:list`

具体流程见 `docs/defspec/DEFSPEC.md`、`project.md` 和 `project-guide.md`。
