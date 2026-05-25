---
name: defspec-exec
description: Use this skill when the user says /defspec:exec REQ-xxx, wants to execute a confirmed DefSpec requirement, asks for a technical design, or approves a DefSpec plan for implementation in the current project.
metadata:
  short-description: Design or execute a requirement
---

# DefSpec Exec

Design and execute a confirmed current project requirement.

## Steps

1. Read the required DefSpec context and target `REQ-xxx` files.
2. If mode is `先出方案`, produce the technical design first and wait for explicit user approval before coding.
3. After approval, write or update `REQ-xxx-design.md` when the change is cross-module, data-related, or complex.
4. Implement the approved scope with minimal code changes.
5. Update requirement records with implementation notes, review notes, and test results.
6. Run appropriate verification for the change.
7. Update `requirements/index.md` to `in_progress` during work and `dev_completed` after implementation passes review.
