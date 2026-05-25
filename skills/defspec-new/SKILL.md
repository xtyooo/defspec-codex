---
name: defspec-new
description: Use this skill when the user wants to create a new DefSpec requirement in the current project, says /defspec:new, starts a new requirement, or wants to record a feature/change request before implementation.
metadata:
  short-description: Create a DefSpec requirement draft
---

# DefSpec New

Create the next requirement draft for the current project.

## Steps

1. Read `AGENTS.md`, `docs/defspec/DEFSPEC.md`, `docs/defspec/project.md`, `docs/defspec/project-guide.md`, and `docs/defspec/requirements/index.md`.
2. Determine the next `REQ-xxx` number from `requirements/index.md`.
3. Create `docs/defspec/requirements/REQ-xxx-draft.md` from `REQ-000-template.md`.
4. Preserve the user's original requirement text in【原始需求】.
5. Insert the new row above `REQ-000` in `requirements/index.md` with status `draft`.
6. Do not implement code during this step.
