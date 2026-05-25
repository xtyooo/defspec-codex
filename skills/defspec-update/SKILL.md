---
name: defspec-update
description: Use this skill when the user says /defspec:update REQ-xxx, changes a requirement, adds new constraints, or wants to revise a completed or in-progress DefSpec item in the current project.
metadata:
  short-description: Update an existing requirement
---

# DefSpec Update

Handle changes to an existing current project requirement.

## Steps

1. Read the required DefSpec context and target `REQ-xxx` files.
2. Record the requested change in the requirement's change/history section.
3. Re-check scope, affected files, business rules, and tests.
4. If the change affects the approved design, update design/tasks before implementation.
5. In `先出方案` mode, wait for approval before coding.
6. Implement only the approved delta and update test records.
7. Update `requirements/index.md` status as needed.
