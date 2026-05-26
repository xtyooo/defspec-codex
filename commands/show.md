---
description: Show details for a SpecPilot requirement or capability spec.
argument-hint: REQ-xxx|spec-name
---

# SpecPilot: 查看详情

查看需求或能力规格的详细内容。

**参数**
- `$ARGUMENTS` - 要查看的编号（如 REQ-001）或能力名（如 user-auth）

**执行步骤**

## 步骤一：解析参数

1. 从 `$ARGUMENTS` 获取要查看的内容（去除空格）
2. 如果未提供参数，进入交互模式

## 步骤二：判断类型

根据参数格式判断类型：
- 以 `REQ-` 开头 → 查看需求
- 其他 → 查看能力规格

---

## 查看需求

### 如果是查看需求（REQ-xxx）：

1. 读取 `docs/specpilot/requirements/index.md` 获取需求基本信息

2. 查找需求文件：
   - 先查找存档文件：`REQ-xxx-*.md`（排除 draft/tasks/design）
   - 如果没有存档，查找草稿：`REQ-xxx-draft.md`

3. 读取需求文件内容

4. 检查是否存在附加文件：
   - `REQ-xxx-tasks.md` 任务清单
   - `REQ-xxx-design.md` 技术设计

5. 输出格式：

```markdown
## 需求详情：REQ-xxx

### 基本信息
| 字段 | 值 |
|------|-----|
| 编号 | REQ-xxx |
| 描述 | xxx |
| 状态 | {状态} |
| 创建时间 | xxxx-xx-xx |
| 完成时间 | xxxx-xx-xx |
| 关联需求 | xxx |
| 业务模块 | xxx |

### 需求内容
[需求文件的主要内容]

### 附加文件
- tasks.md: {存在/不存在}
- design.md: {存在/不存在}

### 相关文件
- 需求文件：docs/specpilot/requirements/REQ-xxx-{描述}.md
- 任务清单：docs/specpilot/requirements/REQ-xxx-tasks.md（如存在）
- 技术设计：docs/specpilot/requirements/REQ-xxx-design.md（如存在）
```

---

## 查看能力规格

### 如果是查看能力规格：

1. 检查规格目录是否存在：`docs/specpilot/specs/{能力名}/`

2. 如果存在，读取规格文件：
   - `docs/specpilot/specs/{能力名}/spec.md`
   - `docs/specpilot/specs/{能力名}/design.md`（如有）

3. 输出格式：

```markdown
## 能力规格：{能力名}

### 规格内容
[spec.md 的内容]

### 技术设计
[design.md 的内容，如有]

### 相关文件
- 规格文件：docs/specpilot/specs/{能力名}/spec.md
- 设计文件：docs/specpilot/specs/{能力名}/design.md（如存在）
```

4. 如果规格不存在，输出：
```
能力规格 "{能力名}" 不存在。

现有能力规格：
[列出 docs/specpilot/specs/ 下的目录]

如需创建，请参考模板：docs/specpilot/specs/SPEC-template.md
```

---

## 交互模式

### 如果未提供参数：

1. 读取 `docs/specpilot/requirements/index.md`
2. 列出所有需求和能力规格供选择

```markdown
请指定要查看的内容：

## 需求列表
| 编号 | 描述 | 状态 |
|------|------|------|
| REQ-001 | xxx | ✅ completed |
| REQ-002 | xxx | 🚧 in_progress |

## 能力规格
| 能力 | 描述 |
|------|------|
| user-auth | 用户认证 |

请输入编号或能力名查看详情，例如：
- /specpilot:show REQ-001
- /specpilot:show user-auth
```

**参考文档**
- 完整规范见 `docs/specpilot/README.md`
- AI指令见 `docs/specpilot/SPECPILOT.md`
