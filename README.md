# defspec-codex（定义驱动开发 · Codex 适配版）

> 让 Codex 在写代码前先读定义、建需求、确认边界、出方案，再进入实现。

`defspec-codex` 是一套面向 Codex 的 DefSpec 工作流安装器。它会安装一组可在 Codex `/` 面板中发现的 DefSpec skills，并在当前项目中初始化 `docs/defspec/` 需求文档体系。

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
| `/defspec` 候选项 | 安装 8 个 Codex skills，输入 `/defspec` 可筛选动作 |
| 需求文档体系 | 初始化 `docs/defspec/requirements/`、`specs/`、项目指南模板 |
| Codex 项目引导 | 向 `AGENTS.md` 写入 DefSpec bootstrap 段落 |
| 可重复安装 | 使用哨兵注释更新 `AGENTS.md`，重复运行不会无限追加 |
| 可检查 | `--check` 检查全局 skills 和当前项目初始化状态 |
| 可卸载 | `--uninstall` 清理安装的项目段落和模板 |

---

## Skills 列表

| Skill | 触发场景 |
|------|----------|
| `DefSpec New` | 创建新需求草稿 |
| `DefSpec List` | 查看需求列表和状态 |
| `DefSpec Confirm` | 确认需求、业务规则、边界条件 |
| `DefSpec Exec` | 设计方案并在确认后实施 |
| `DefSpec Check` | 深度复核需求、方案、实现、测试和风险 |
| `DefSpec Update` | 处理需求变更 |
| `DefSpec Archive` | 归档已完成需求 |
| `DefSpec Cancel` | 取消需求但保留记录 |

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

你应该能看到 `DefSpec New`、`DefSpec List`、`DefSpec Confirm`、`DefSpec Exec` 等候选项。

> 发布到 npm 后，也可以使用更短的命令：`npx defspec-codex`

---

## 安装模式

完整安装：安装全局 Codex skills，并初始化当前项目。

```bash
npx github:xtyooo/defspec-codex
```

只安装 `/defspec` skills，不改当前项目：

```bash
npx github:xtyooo/defspec-codex --skills-only
```

只初始化当前项目，不改全局 skills：

```bash
npx github:xtyooo/defspec-codex --init-only
```

检查安装状态：

```bash
npx github:xtyooo/defspec-codex --check
```

卸载当前项目 DefSpec 文件，并移除全局 skills：

```bash
npx github:xtyooo/defspec-codex --uninstall
```

只卸载全局 skills：

```bash
npx github:xtyooo/defspec-codex --uninstall --skills-only
```

---

## 安装内容

全局 Codex skills：

```text
~/.agents/skills/defspec/defspec-*
```

当前项目文件：

```text
AGENTS.md
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
/defspec
选择 DefSpec Check
输入：检查 REQ-001
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
- `AGENTS.md` 使用 `defspec-codex:begin/end` 哨兵注释，便于重复安装和卸载。
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
