---
name: specpilot-cancel
description: "当用户输入 /specpilot:cancel REQ-xxx，想取消草稿或进行中的 SpecPilot 需求，或将当前项目中的需求标记为不再计划时使用。"
---

# SpecPilot: 取消需求

取消需求，更新状态并询问是否删除草稿文件。

**参数**
- `the user-provided arguments after the command text` - 要取消的需求编号（如 REQ-001）

**规则约束**
- 只能取消 draft 或 in_progress 状态的需求
- 必须更新 index.md 状态
- 删除文件前需要用户确认

**执行步骤**

## 步骤一：确定需求编号

1. 从 `the user-provided arguments after the command text` 解析需求编号（去除空格）
2. 如果未提供编号：
   - 读取 `docs/specpilot/requirements/index.md`
   - 列出 draft 和 in_progress 状态的需求
   - 询问用户要取消哪个需求
3. 如果无法确定编号，停止并告知用户

## 步骤二：验证状态

1. 读取 `docs/specpilot/requirements/index.md`
2. 检查需求状态是否为 draft 或 in_progress
3. 如果状态为 completed 或其他，提示用户该需求不能取消

## 步骤三：更新索引

1. 更新 `docs/specpilot/requirements/index.md`：
   - 将需求状态改为 `❌ cancelled`

## 步骤四：处理相关文件

1. 检查以下文件是否存在：
   - `docs/specpilot/requirements/REQ-{编号}-draft.md`
   - `docs/specpilot/requirements/REQ-{编号}-tasks.md`
   - `docs/specpilot/requirements/REQ-{编号}-design.md`

2. 询问用户：
```
需求 REQ-{编号} 已标记为取消。

发现以下相关文件：
- REQ-{编号}-draft.md
- REQ-{编号}-tasks.md（如果存在）
- REQ-{编号}-design.md（如果存在）

是否删除这些文件？（是/否）
```

3. 根据用户回复处理文件

## 步骤五：输出总结

```
需求 REQ-{编号} 已取消。

索引已更新：docs/specpilot/requirements/index.md
{文件处理结果}
```

**参考文档**
- 完整规范见 `docs/specpilot/README.md`
