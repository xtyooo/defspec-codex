---
description: Design and execute a confirmed DefSpec requirement with approval gates.
argument-hint: REQ-xxx
---

# DefSpec Exec

The user invoked this command with: $ARGUMENTS

Use this command to design and implement a confirmed requirement.

## Preflight

1. Read the required DefSpec context files.
2. Read the target requirement and any existing design or task records.
3. Inspect relevant code before proposing implementation.
4. Check the working tree for unrelated changes and avoid reverting user work.

## Plan

1. If the requirement says `先出方案`, produce a technical design first and wait for explicit approval before coding.
2. If the requirement says `直接实施`, still state a concise implementation plan before editing.
3. Keep changes scoped to the requirement.
4. Define verification commands before implementation.

## Commands

1. Implement the approved design using existing project patterns.
2. Update requirement records with design, tasks, implementation notes, and test evidence where appropriate.
3. Avoid unrelated refactors.
4. Preserve generated-file and project-specific rules from `docs/defspec/project.md`, `docs/defspec/project-guide.md`, and `AGENTS.md` if it exists.

## Verification

1. Run focused tests or checks matching the changed area.
2. Re-read changed files and requirement records.
3. Report any tests that could not be run.

## Summary

Report implemented scope, changed areas, validation evidence, and residual risks.

## Next Steps

Suggest `/defspec:check REQ-xxx` before commit or `/defspec:archive REQ-xxx` after acceptance.
