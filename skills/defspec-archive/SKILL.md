---
name: defspec-archive
description: Use this skill when the user says /defspec:archive REQ-xxx, wants to archive a completed DefSpec requirement, finalize implementation records, or mark a requirement completed in the current project.
metadata:
  short-description: Archive a completed requirement
---

# DefSpec Archive

Finalize and archive a current project requirement.

## Steps

1. Read the required DefSpec context and target `REQ-xxx` files.
2. Confirm implementation and verification records are present.
3. Update `requirements/index.md` status to `completed`, with completion date and module.
4. Add relationship records if applicable.
5. Create a concise archive summary only when useful or requested.
6. Do not modify business code during archive unless the user explicitly asks.
