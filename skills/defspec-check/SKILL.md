---
name: defspec-check
description: Use this skill when the user says /defspec:check REQ-xxx, wants to review a DefSpec requirement, inspect implementation progress, verify tests, or find missing requirement records in the current project.
metadata:
  short-description: Check requirement status and risks
---

# DefSpec Check

Review a current project requirement and implementation state.

## Steps

1. Read the required DefSpec context and target `REQ-xxx` files.
2. Check whether the requirement, design, tasks, code, and tests are consistent.
3. Inspect relevant changed files and status.
4. Report findings first: bugs, missed scope, missing tests, missing docs, or risks.
5. If no findings exist, say so and list residual risks.
6. Do not make changes unless the user asks to fix issues.
