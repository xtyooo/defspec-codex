# defspec-codex

DefSpec requirement-driven development for Codex.

It installs slash-discoverable Codex skills such as `DefSpec New`, `DefSpec Confirm`, and `DefSpec Exec`, then initializes the current project with `docs/defspec/` templates and an `AGENTS.md` bootstrap section.

## Usage

Install or update both Codex skills and the current project:

```bash
npx github:xtyooo/defspec-codex
```

After publishing to npm, the shorter command will also work:

```bash
npx defspec-codex
```

Install only global Codex skills:

```bash
npx github:xtyooo/defspec-codex --skills-only
```

Initialize only the current project:

```bash
npx github:xtyooo/defspec-codex --init-only
```

Check installation:

```bash
npx github:xtyooo/defspec-codex --check
```

Uninstall project files and/or global skills:

```bash
npx github:xtyooo/defspec-codex --uninstall
npx github:xtyooo/defspec-codex --uninstall --skills-only
```

## What Gets Installed

- Global Codex skills: `~/.agents/skills/defspec/defspec-*`
- Project docs: `docs/defspec/`
- Project bootstrap: `AGENTS.md`

After installing, restart Codex and type `/defspec` in the composer to find the action skills.

## Safety

- The installer refuses to initialize a home directory unless `--force` is passed.
- Existing files are not overwritten unless `--yes` is passed.
- `AGENTS.md` updates are wrapped in sentinel comments for safe re-run and uninstall.
