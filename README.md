# specpilot-codex（规格领航 · Codex 适配版）

> 让 Codex 在写代码前先读规格、建需求、确认边界、出方案，再进入实现。

`specpilot-codex` 是一套面向 Codex 的 SpecPilot skills 安装器。它参考 superpowers 的安装方式，把 SpecPilot 能力安装到当前项目的 `.codex/skills/`，并初始化 `docs/specpilot/` 需求文档体系。

当前版本采用 **skills-only** 模式：不再安装 Codex plugin、marketplace 或 `commands/`。这样可以避开本地插件缓存链路不稳定的问题，让 SpecPilot 像 superpowers 一样通过 skills 被 Codex 发现和使用。

---

## 核心能力

| 能力 | 说明 |
|------|------|
| SpecPilot skills | 安装 9 个 `specpilot-*` skills 到 `.codex/skills/` |
| 需求文档体系 | 初始化 `docs/specpilot/requirements/`、`specs/`、项目指南模板 |
| 项目级上下文 | 通过 `docs/specpilot/project.md` 和 `project-guide.md` 承载项目差异 |
| 可重复安装 | 重复运行会更新 `.codex/skills/specpilot-*`，复用已有 `docs/specpilot/` |
| 可检查 | `--check` 检查 skills 和项目文档安装状态 |
| 可卸载 | `--uninstall` 清理项目 skills 和 SpecPilot 文档 |

---

## Skills 列表

| Skill | 触发场景 |
|------|----------|
| `specpilot-new` | 创建新需求草稿 |
| `specpilot-list` | 查看需求列表和状态 |
| `specpilot-confirm` | 确认需求、业务规则、边界条件 |
| `specpilot-exec` | 设计方案并在确认后实施 |
| `specpilot-check` | 深度复核需求、方案、实现、测试和风险 |
| `specpilot-show` | 查看需求或能力规格详情 |
| `specpilot-update` | 处理需求变更 |
| `specpilot-archive` | 归档已完成需求 |
| `specpilot-cancel` | 取消需求但保留记录 |

这些 skills 的描述包含 `/specpilot:new`、`/specpilot:exec REQ-xxx` 等触发语，因此你仍然可以在 Codex 里直接输入类似命令文本；区别是它们不再依赖 Codex slash commands 插件菜单。

---

## 快速开始

在目标项目根目录运行：

```bash
npx github:xtyooo/specpilot-codex
```

安装完成后，如果 Codex 没有立即加载新 skills，请完整退出并重新打开 Codex。

之后可以直接告诉 Codex：

```text
/specpilot:new 增加导出报表功能
```

或：

```text
用 SpecPilot 新建一个需求，内容是增加导出报表功能
```

检查安装状态：

```bash
npx github:xtyooo/specpilot-codex --check
```

检查结果应该能看到 `.codex/skills/specpilot-*` 都是 `OK`。

> 发布到 npm 后，也可以使用更短的命令：`npx specpilot-codex`

---

## 安装模式

完整安装：安装当前项目 Codex skills，并初始化 `docs/specpilot/`。

```bash
npx github:xtyooo/specpilot-codex
```

只安装或更新当前项目 skills，不改项目文档：

```bash
npx github:xtyooo/specpilot-codex --skills-only
```

`--integration-only` 是同义别名：

```bash
npx github:xtyooo/specpilot-codex --integration-only
```

只初始化当前项目文档，不安装 skills：

```bash
npx github:xtyooo/specpilot-codex --init-only
```

默认不会写入 `AGENTS.md`。如果你希望某个项目显式保留 SpecPilot bootstrap，可以加：

```bash
npx github:xtyooo/specpilot-codex --with-agents
```

卸载当前项目 SpecPilot 文件和 skills：

```bash
npx github:xtyooo/specpilot-codex --uninstall
```

只卸载当前项目 skills：

```bash
npx github:xtyooo/specpilot-codex --uninstall --skills-only
```

脚本或 CI 中跳过 `project-guide.md` 初始化提示：

```bash
npx github:xtyooo/specpilot-codex --no-guide-prompt
```

---

## 安装内容

当前项目 skills：

```text
.codex/skills/
├── specpilot-new/SKILL.md
├── specpilot-confirm/SKILL.md
├── specpilot-exec/SKILL.md
├── specpilot-check/SKILL.md
├── specpilot-show/SKILL.md
├── specpilot-update/SKILL.md
├── specpilot-archive/SKILL.md
├── specpilot-cancel/SKILL.md
└── specpilot-list/SKILL.md
```

当前项目文档：

```text
docs/specpilot/
├── SPECPILOT.md
├── QUICKREF.md
├── README.md
├── project.md
├── project-guide.md
├── requirements/
└── specs/
```

安装器会清理旧版本遗留的 SpecPilot/DefSpec plugin、marketplace 配置和全局重复 skills，但不再创建新的 plugin 或 marketplace。

---

## 工作流

```text
SpecPilot New
  -> 创建 REQ-xxx-draft.md
  -> 更新 requirements/index.md

SpecPilot Confirm
  -> 分析需求和相关代码
  -> 确认术语、规则、边界、测试用例

SpecPilot Exec
  -> 先出技术方案
  -> 用户确认后实施
  -> 记录测试、审查、实施结果

SpecPilot Archive
  -> 归档完成需求
  -> 保留可追溯的需求历史
```

---

## 初始化 project-guide.md

`docs/specpilot/project-guide.md` 是 SpecPilot 的项目级上下文。后续使用 `specpilot-new`、`specpilot-confirm`、`specpilot-exec`、`specpilot-check` 时，Codex 会先读取它来理解项目结构和开发约束。

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

---

## 手动安装

如果无法使用 `npx`，可以手动运行：

```bash
git clone https://github.com/xtyooo/specpilot-codex.git
cd specpilot-codex
node bin/specpilot-codex.js --skills-only
node bin/specpilot-codex.js --init-only
```

---

## 安全说明

- 默认拒绝在用户主目录初始化项目，避免污染全局环境。
- 已存在 `docs/specpilot/` 时默认不覆盖，除非传入 `--yes`。
- 默认不写入 `AGENTS.md`；旧版本写入的 SpecPilot 哨兵段落会在安装时自动清理。需要保留时可使用 `--with-agents`。
- 安装时只清理名称为 `specpilot-*` 或 `defspec-*` 且包含 `SKILL.md` 的旧技能目录，不会删除其他用户 skills。
- 卸载不会删除你的业务代码。

---

## Roadmap

- 发布 npm 包，支持 `npx specpilot-codex`。
- 支持 Claude Code、Cursor、Kiro 等更多工具的安装目标。
- 自动生成项目专属 `project-guide.md` 初稿。
- 增强能力规格 `specs/` 的维护和引用流程。

---

## License

MIT
