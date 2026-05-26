# SpecPilot 快速参考

## 常用指令

| 指令 | 用途 |
|------|------|
| `/specpilot:new` | 创建新需求草稿 |
| `/specpilot:confirm REQ-xxx` | 确认需求，补齐业务规则和边界 |
| `/specpilot:exec REQ-xxx` | 设计并执行需求 |
| `/specpilot:check REQ-xxx` | 检查需求和实现状态 |
| `/specpilot:show REQ-xxx` | 查看需求或能力规格详情 |
| `/specpilot:update REQ-xxx` | 处理需求变更 |
| `/specpilot:archive REQ-xxx` | 归档已完成需求 |
| `/specpilot:list` | 查看需求列表 |

在 Codex App 中，`specpilot-codex` 提供全局 slash commands。输入 `/specpilot` 后可选择 `SpecPilot New`、`SpecPilot List`、`SpecPilot Confirm`、`SpecPilot Exec` 等动作。

## 标准节奏

1. 新建草稿：`/specpilot:new`
2. 填写原始需求
3. 确认需求：`/specpilot:confirm REQ-xxx`
4. 设计方案：`/specpilot:exec REQ-xxx`
5. 用户确认方案后实施
6. 自审、测试、记录结果
7. 归档：`/specpilot:archive REQ-xxx`

## 状态

| 状态 | 含义 |
|------|------|
| `draft` | 草稿 |
| `confirming` | 确认中 |
| `confirmed` | 已确认 |
| `in_progress` | 开发中 |
| `dev_completed` | 开发完成待归档 |
| `completed` | 已归档完成 |
| `cancelled` | 已取消 |
| `iterated` | 已被后续需求迭代 |

## 当前项目验证命令

```bash
go test -mod=vendor ./...
make wire-g
make proto
make run
```

按改动范围选择命令，不需要每次都全量执行。
