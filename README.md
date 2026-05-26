# defspec-codex（定义驱动开发 · Codex 适配版）

> 让 Codex 在写代码前先读定义、建需求、确认边界、出方案，再进入实现。

`defspec-codex` 是一套面向 Codex 的 DefSpec 工作流安装器。它会安装 Codex 本地插件命令，并在当前项目中初始化 `docs/defspec/` 需求文档体系。

当前版本采用 **commands-only** 模式：唯一推荐入口是 `/defspec:*`，不会再把 DefSpec 同时注册成全局 skills、项目 skills 或插件 skills，避免 `/` 菜单出现多组重复项。

---

## 没装 defspec-codex

你可能会这样和 Codex 协作：

```text
用户：帮我加一个新功能
Codex：直接开始翻代码、改文件、补一点测试
结果：需求边界散落在聊天里，方案不可追踪，下一次迭代又要重新解释
```

---

## 装了 defspec-codex

你可以这样工作：

```text
用户：/defspec
Codex：展示 DefSpec New / Confirm / Exec / Check / Update / Archive 等动作

用户：选择 DefSpec New
Codex：创建 REQ-001 草稿、更新需求索引

用户：选择 DefSpec Confirm
Codex：分析代码链路、确认业务规则和边界条件

用户：选择 DefSpec Exec
Codex：先出技术方案，确认后再编码、测试、记录结果
```

需求、方案、测试和复盘都留在项目里，而不是只留在一次会话上下文中。

---

## 核心能力

| 能力 | 说明 |
|------|------|
| `/defspec:*` 命令 | 安装 8 个 Codex slash commands，输入 `/defspec` 可筛选动作 |
| 唯一入口 | 默认清理旧版本遗留的 DefSpec skills，只保留 `/defspec:*` 命令入口 |
| 需求文档体系 | 初始化 `docs/defspec/requirements/`、`specs/`、项目指南模板 |
| 项目级上下文 | 通过 `docs/defspec/project.md` 和 `project-guide.md` 承载项目差异 |
| 可重复安装 | 重复运行会复用已有 `docs/defspec/`，不会重复堆叠入口 |
| 可检查 | `--check` 检查 commands、历史重复入口、插件启用状态和当前项目初始化状态 |
| 可卸载 | `--uninstall` 清理安装的项目段落和模板 |

---

## 命令列表

| Slash command | 触发场景 |
|------|----------|
| `/defspec:new` | 创建新需求草稿 |
| `/defspec:list` | 查看需求列表和状态 |
| `/defspec:confirm` | 确认需求、业务规则、边界条件 |
| `/defspec:exec` | 设计方案并在确认后实施 |
| `/defspec:check` | 深度复核需求、方案、实现、测试和风险 |
| `/defspec:update` | 处理需求变更 |
| `/defspec:archive` | 归档已完成需求 |
| `/defspec:cancel` | 取消需求但保留记录 |

---

## 快速开始

在目标项目根目录运行：

```bash
npx github:xtyooo/defspec-codex
```

安装完成后重启 Codex，然后在输入框输入：

```text
/defspec
```

你应该能看到 `/defspec:new`、`/defspec:list`、`/defspec:confirm`、`/defspec:exec`、`/defspec:check` 等候选项。

如果没有出现，先确认已经完全退出并重新打开 Codex，再运行：

```bash
npx github:xtyooo/defspec-codex --check
```

检查结果里这些项应该是绿色：`plugin manifest`、`marketplace entry`、`Codex plugin enabled`、`command /defspec:*`。

安装器还会提示你初始化 `docs/defspec/project-guide.md`。这个文件是后续 DefSpec 工作的项目地图，建议首次安装后按提示让 Codex 分析项目并补全。

> 发布到 npm 后，也可以使用更短的命令：`npx defspec-codex`

---

## `/` 和 `$` 的区别

在 Codex 里，`/` 更适合做日常命令入口。它会展示 slash commands，也可能展示项目、个人或插件作用域里的可发现 skills。

`$` 更偏向显式引用某个 skill。它适合在对话里点名加载能力，但不适合作为 DefSpec 的主入口。

旧版本同时安装了多份 DefSpec：

- 项目内 `.codex/skills/defspec-*`
- 个人目录 `~/.agents/skills/defspec/defspec-*`
- 插件目录 `~/plugins/defspec/skills/defspec-*`
- 插件命令 `~/plugins/defspec/commands/*.md`

因此输入 `/` 时会看到多组重复的 `DefSpec New`、`DefSpec Check` 等入口。现在安装器会主动清理前三类历史 skills，只保留插件命令。最终你只需要记住一个入口：

```text
/defspec
```

如果升级后仍看到重复项，请先完整退出并重新打开 Codex，再运行：

```bash
npx github:xtyooo/defspec-codex --check
```

`--check` 会确认历史 DefSpec skills 是否已经清理干净，以及 `/defspec:*` 命令是否可用。

---

## 安装模式

完整安装：安装 Codex 本地插件命令、清理旧版重复 skills，并初始化当前项目。

```bash
npx github:xtyooo/defspec-codex
```

只安装 `/defspec:*` 命令并清理旧版重复 skills，不改当前项目：

```bash
npx github:xtyooo/defspec-codex --skills-only
```

`--skills-only` 为兼容旧命令名保留，实际含义是「只更新全局 Codex 集成」。也可以使用更直观的别名：

```bash
npx github:xtyooo/defspec-codex --integration-only
```

只初始化当前项目，不改全局 Codex 集成：

```bash
npx github:xtyooo/defspec-codex --init-only
```

默认不会写入 `AGENTS.md`。如果你希望某个项目显式保留 DefSpec bootstrap，可以加：

```bash
npx github:xtyooo/defspec-codex --with-agents
```

检查安装状态：

```bash
npx github:xtyooo/defspec-codex --check
```

卸载当前项目 DefSpec 文件，并移除全局 Codex 集成：

```bash
npx github:xtyooo/defspec-codex --uninstall
```

只卸载全局 Codex 集成：

```bash
npx github:xtyooo/defspec-codex --uninstall --skills-only
```

脚本或 CI 中跳过 `project-guide.md` 初始化提示：

```bash
npx github:xtyooo/defspec-codex --no-guide-prompt
```

---

## 安装内容

Codex 本地插件：

```text
~/plugins/defspec/
├── .codex-plugin/plugin.json
├── commands/
└── assets/
```

Codex marketplace 注册：

```text
~/.agents/plugins/marketplace.json
~/.codex/config.toml
```

当前项目文件：

```text
docs/defspec/
├── DEFSPEC.md
├── QUICKREF.md
├── README.md
├── project.md
├── project-guide.md
├── requirements/
└── specs/
```

---

## 初始化 project-guide.md

`docs/defspec/project-guide.md` 是 DefSpec 的项目级上下文。后续使用 `/defspec:new`、`/defspec:confirm`、`/defspec:exec`、`/defspec:check` 时，Codex 会先读取它来理解项目结构和开发约束。

`AGENTS.md` 不是必需入口。8 个 `/defspec:*` 命令是全局固定的，不需要每个项目各写一份；项目差异主要放在 `docs/defspec/project.md` 和 `docs/defspec/project-guide.md`。如果项目原本就有 `AGENTS.md`，Codex 仍可把它作为补充上下文读取。

首次安装后，如果这个文件仍是模板，安装器会询问：

```text
Start project-guide initialization now? [Y/n]
```

选择 `Y` 后，安装器会输出一段可直接发给 Codex 的初始化指令。Codex 会根据当前仓库补全：

- 项目概述、技术栈和目录职责。
- 主要业务链路、分层模式和依赖方向。
- 配置、生成代码、数据库、缓存、队列和外部服务。
- 测试、构建、运行命令。
- 后续需求开发时的约束、风险和不要修改的文件。

如果暂时跳过，也可以之后在 Codex 里发送：

```text
请初始化当前项目的 DefSpec project-guide。
```

---

## 工作流

```text
DefSpec New
  -> 创建 REQ-xxx-draft.md
  -> 更新 requirements/index.md

DefSpec Confirm
  -> 分析需求和相关代码
  -> 确认术语、规则、边界、测试用例

DefSpec Exec
  -> 先出技术方案
  -> 用户确认后实施
  -> 记录测试、审查、实施结果

DefSpec Archive
  -> 归档完成需求
  -> 保留可追溯的需求历史
```

---

## DefSpec Check：高频复核入口

`DefSpec Check` 是日常开发中最适合反复使用的动作。它不是简单查看状态，而是让 Codex 对照需求文档、技术方案、当前代码和测试记录做一次结构化复核。

适合使用的时机：

- **需求确认后**：检查需求是否还有模糊点、遗漏边界、缺少测试用例。
- **方案实施前**：检查技术方案是否覆盖数据流、错误处理、兼容性和回归范围。
- **开发过程中**：检查当前改动是否偏离 `REQ-xxx`，是否引入无关重构。
- **提交前**：检查代码、测试、文档、需求索引是否一致。
- **需求变更后**：检查变更是否需要更新设计、任务清单或关联需求。

它重点检查：

- 需求确认是否完整：术语、业务规则、边界条件、测试用例。
- 技术方案是否可执行：改动范围、数据流、风险和回滚点。
- 实现是否对齐需求：没有漏做、超做或破坏现有行为。
- 测试是否匹配风险：正常场景、边界场景、异常场景是否覆盖。
- 文档是否同步：`requirements/index.md`、`REQ-xxx-draft.md`、`REQ-xxx-design.md` 是否一致。

典型用法：

```text
/defspec:check REQ-001
```

或直接说：

```text
用 DefSpec Check 复核 REQ-001，重点看实现是否偏离需求、测试是否缺失。
```

---

## 手动安装

如果无法使用 `npx`，可以手动复制，但不推荐作为长期方式：

```bash
git clone https://github.com/xtyooo/defspec-codex.git
cd defspec-codex
node bin/defspec-codex.js --skills-only
node bin/defspec-codex.js --init-only
```

---

## 安全说明

- 默认拒绝在用户主目录初始化项目，避免污染全局环境。
- 已存在 `docs/defspec/` 时默认不覆盖，除非传入 `--yes`。
- 默认不写入 `AGENTS.md`；旧版本写入的 DefSpec 哨兵段落会在安装时自动清理。需要保留时可使用 `--with-agents`。
- 安装时只清理名称为 `defspec-*` 且包含 `SKILL.md` 的历史 DefSpec skill 目录，不会删除其他用户 skills。
- 卸载不会删除你的业务代码。

---

## Roadmap

- 发布 npm 包，支持 `npx defspec-codex`。
- 支持 Claude Code、Cursor、Kiro 等更多工具的安装目标。
- 自动生成项目专属 `project-guide.md` 初稿。
- 增强能力规格 `specs/` 的维护和引用流程。
- 提供 GitHub Action 或检查命令验证 DefSpec 文档完整性。

---

## License

MIT
