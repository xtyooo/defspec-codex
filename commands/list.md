---
description: List SpecPilot requirements or capability specs.
argument-hint: [reqs|specs]
---

# SpecPilot: 查看列表

查看当前需求列表和系统能力规格。

**参数**
- `$ARGUMENTS` - 可选，指定查看类型：`reqs`（需求）或 `specs`（规格）

**执行步骤**

## 如果参数为空或 "reqs"：

1. 读取 `docs/specpilot/requirements/index.md`
2. 输出需求列表：

```
## 需求列表

### 进行中 (in_progress)
| 编号 | 描述 | 创建时间 |
|------|------|----------|
| REQ-xxx | xxx | xxxx-xx-xx |

### 草稿 (draft)
| 编号 | 描述 | 创建时间 |
|------|------|----------|
| REQ-xxx | xxx | xxxx-xx-xx |

### 最近完成 (completed)
| 编号 | 描述 | 完成时间 |
|------|------|----------|
| REQ-xxx | xxx | xxxx-xx-xx |

---
共 {总数} 个需求：{进行中数} 进行中，{草稿数} 草稿，{完成数} 已完成
```

## 如果参数为 "specs"：

1. 读取 `docs/specpilot/specs/` 目录
2. 列出所有能力规格：

```
## 系统能力规格

| 能力 | 描述 | 文件 |
|------|------|------|
| auth | 认证授权 | specs/auth/spec.md |
| payment | 支付系统 | specs/payment/spec.md |
| ... | ... | ... |

---
共 {总数} 个能力规格
```

3. 如果 `docs/specpilot/specs/` 目录不存在或为空：
```
暂无系统能力规格。

如需添加，请在 docs/specpilot/specs/ 目录下创建：
  specs/{能力名}/spec.md
```

**快捷用法**
- `/specpilot:list` - 查看需求列表
- `/specpilot:list reqs` - 查看需求列表
- `/specpilot:list specs` - 查看能力规格

**参考文档**
- 完整规范见 `docs/specpilot/README.md`
