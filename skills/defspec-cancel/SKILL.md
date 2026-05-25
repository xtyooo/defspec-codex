---
name: defspec-cancel
description: Use this skill when the user says /defspec:cancel REQ-xxx, wants to cancel a draft or in-progress DefSpec requirement, or mark a requirement as no longer planned in the current project.
metadata:
  short-description: Cancel a requirement
---

# DefSpec Cancel

Cancel a current project requirement.

## Steps

1. Read `docs/defspec/requirements/index.md` and the target `REQ-xxx` files.
2. Update the target requirement status to `cancelled`.
3. Add a brief cancellation reason when the user provides one.
4. Update `requirements/index.md`.
5. Do not delete requirement files unless the user explicitly asks.
