---
name: defspec-confirm
description: Use this skill when the user says /defspec:confirm REQ-xxx, wants to confirm a DefSpec requirement, clarify scope, analyze business rules, or turn a draft into a confirmed requirement in the current project.
metadata:
  short-description: Confirm a DefSpec requirement
---

# DefSpec Confirm

Analyze and confirm a current project requirement.

## Steps

1. Read the required DefSpec context from `AGENTS.md` and `docs/defspec/`.
2. Read the target `REQ-xxx-draft.md` and any referenced requirements.
3. Inspect relevant code paths before writing the confirmation.
4. Ask only blocking clarification questions; prefer concise choices.
5. Fill【需求确认】with terminology, business rules, data flow, boundaries, affected files, and test cases.
6. Update `requirements/index.md` status to `confirmed`.
7. Do not implement code during confirmation.
