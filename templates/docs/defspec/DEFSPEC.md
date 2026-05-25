# DefSpec AI 指令

> 当前项目使用 DefSpec 进行定义驱动开发。目标是让 Codex 在开发前先理解项目定义和需求定义，再做方案、实施和复核。

---

## 入口顺序

每次处理非平凡需求时，先阅读：

1. `docs/defspec/project.md`：人工维护的项目约定
2. `docs/defspec/project-guide.md`：当前项目技术指南
3. `docs/defspec/requirements/index.md`：需求索引
4. 当前 `REQ-xxx` 的 draft/design/tasks 文件

---

## 何时使用 DefSpec

需要使用：

- 新增功能或能力
- 修改现有业务行为
- 跨模块改动
- 数据模型、接口、worker、定时任务、部署配置等有连锁影响的改动
- 用户明确提到 `defspec`、`REQ-xxx`、需求、方案、规格

可以跳过完整流程：

- 恢复预期行为的 bug 修复
- 文档、注释、格式、拼写修正
- 给现有行为补测试
- 简单配置改动

---

## 标准流程

### 1. 新建需求

当用户说要提新需求或使用 `/defspec:new`：

- 读取 `requirements/index.md` 获取下一个编号
- 创建 `requirements/REQ-xxx-draft.md`
- 在索引中新增一行，状态为 `draft`
- 草稿只记录用户原始需求，不擅自扩展范围

### 2. 需求确认

当用户使用 `/defspec:confirm REQ-xxx`：

- 阅读草稿、项目指南和相关代码
- 梳理术语、业务规则、调用链路、边界条件、测试用例
- 有关键不确定点时先提问
- 确认后写入草稿的【需求确认】章节
- 更新索引状态为 `confirmed`

### 3. 方案设计

当用户使用 `/defspec:exec REQ-xxx` 且执行模式为“先出方案”：

- 基于【需求确认】输出技术方案
- 覆盖改动范围、数据流、关键实现、风险、测试策略
- 等待用户明确确认后再编码
- 确认后写入 `REQ-xxx-design.md` 或草稿的【技术方案】章节

### 4. 实施开发

实施时：

- 按已确认方案做最小改动
- 保持当前项目既有架构、分层、依赖注入、数据访问和异步处理模式
- 必要时更新任务清单
- 不修改无关文件或本地配置
- 完成后运行合适测试

### 5. 自审与归档

开发完成后：

- 对照需求和测试用例自审
- 记录测试结果、风险、未覆盖项
- 更新需求状态为 `dev_completed`
- 用户要求归档时再更新为 `completed`，并补充经验总结

---

## 执行模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| 先出方案 | 先设计，用户确认后实施 | 新功能、复杂改动、跨模块改动 |
| 直接实施 | 直接开发并记录结果 | 小 bug、小范围配置或文档改动 |

未填写时默认“先出方案”。

---

## 文档结构

```
docs/defspec/
├── DEFSPEC.md
├── QUICKREF.md
├── README.md
├── project.md
├── project-guide.md
├── project-guide-template.md
├── commands/
├── specs/
└── requirements/
    ├── index.md
    ├── REQ-000-template.md
    ├── TASKS-template.md
    └── DESIGN-template.md
```
