---
name: specpilot-new
description: "当用户输入 /specpilot:new，想创建新的 SpecPilot 需求、开始新功能或变更请求，或希望在实施前先记录需求时使用。"
---

# SpecPilot: 新建需求

按照 SpecPilot 规范创建新的需求草稿。

**规则约束**
- 首先读取 `docs/specpilot/project-guide.md` 了解项目规范
- 检查 `docs/specpilot/requirements/index.md` 获取下一个需求编号
- 此阶段不编写任何代码，只创建需求文档
- 如果需求描述模糊，先提问澄清

**执行步骤**

1. 读取 `docs/specpilot/requirements/index.md`，找到当前最大需求编号
2. 计算下一个编号（如最大是 REQ-003，则下一个是 REQ-004）
3. 创建草稿文件 `docs/specpilot/requirements/REQ-{编号}-draft.md`，内容如下：

```markdown
# REQ-{编号}-[待填写描述]

> 状态：📝 草稿

---

## 【执行模式】

<!-- 请选择一个，删除另一个。不填默认"先出方案" -->
- 先出方案
- 直接实施

---

## 【关联需求】

<!-- 如无关联可删除此章节 -->
- 迭代自：REQ-xxx
- 参考：REQ-xxx

---

## 【代码位置说明】

<!-- 如无可删除此章节 -->

---

## 【需求内容】

<!-- 请填写具体需求描述 -->

---

## 【业务规则】

<!-- 如无可删除此章节 -->

---

## 【上下文信息】

<!-- 可选，不填则AI自行分析代码 -->

---

<!-- 以下章节由 AI 在执行过程中填写 -->

## 【需求确认】

<!-- /specpilot:confirm 执行后填写 -->

---

## 【技术方案】

<!-- /specpilot:exec 方案确认后填写 -->

---

## 【技术方案审查记录】

<!-- 代码审查过程中发现的问题和修正记录 -->

---

## 【实施提交记录】

<!-- git commit 记录 -->

---

## 【经验总结】

<!-- 踩坑点和技术要点 -->
```

4. 更新 `docs/specpilot/requirements/index.md`：
   - 在 REQ-000 行上方添加新行（7列，与表头一致）：
   ```
   | REQ-{编号} | [待填写] | 📝 draft | {当前日期} | - | - | - |
   ```
   - 列说明：编号 | 描述 | 状态 | 创建时间 | 完成时间 | 关联需求 | 业务模块

5. 如果需求较复杂，同时创建：
   - `docs/specpilot/requirements/REQ-{编号}-tasks.md` 任务分解
   - `docs/specpilot/requirements/REQ-{编号}-design.md` 技术决策（涉及架构/跨模块时）

6. 输出总结：
```
已创建需求草稿：docs/specpilot/requirements/REQ-{编号}-draft.md
已更新索引：docs/specpilot/requirements/index.md

下一步：
1. 编辑草稿文件填写需求详情
2. 需求确认：/specpilot:confirm REQ-{编号}
3. 执行开发：/specpilot:exec REQ-{编号}
```

**参考文档**
- 完整规范见 `docs/specpilot/README.md`
