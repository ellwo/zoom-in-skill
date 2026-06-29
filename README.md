# zoom-in

> Installable architectural-audit skill for AI coding agents.
> Score backend code across 7 lenses, enforce golden-pattern laws, and evolve an adaptive `ARCHITECTURE.md` — then install it once into **every** editor you use.

`zoom-in` ships as a single npm package. Run `npx zoom-in install` and the skill lands in every AI coding agent on your machine (Cursor, Claude Code, GitHub Copilot, Cline, Gemini CLI, …). No more copy-pasting a `SKILL.md` into every project and editor.

```bash
npx zoom-in install        # install into every detected editor
npx zoom-in update         # refresh every installed copy with the latest version
npx zoom-in list           # show where it's installed
npx zoom-in uninstall      # remove it everywhere
```

---

## Why this package exists

The `zoom-in` skill itself is a strict, adaptive code-quality system: it discovers conventions from your actual codebase ("golden references"), enforces them across 7 lenses (Clarity, Structure, Performance, Security, Resilience, Domain Integrity, Observability), and writes a living `ARCHITECTURE.md` that grows with your team. See [`skills/zoom-in/SKILL.md`](skills/zoom-in/SKILL.md) for the full skill docs.

The problem: the skill is just a folder of Markdown files, and every agent loads skills from a **different** directory. So you had to copy-paste it into `~/.cursor/skills`, `~/.claude/skills`, `.cursor/skills` in each repo, … and do it again for every update.

This package fixes that. One command, every editor, easy updates.

---

## Quick start

```bash
# Install into every editor detected on your machine
npx zoom-in install

# Or pick specific editors
npx zoom-in install cursor claude

# See what would happen first
npx zoom-in install --dry-run
```

Then **restart your editor/CLI** so it picks up the new skill. In Cursor or Claude Code you can now run:

```
/zoom-in init
/zoom-in audit
/zoom-in refactor
...
```

(See the skill's command list in [`skills/zoom-in/SKILL.md`](skills/zoom-in/SKILL.md).)

### Update

```bash
npx zoom-in update          # refresh all installed copies to the latest published version
```

If you installed with `--link`, the linked copies update instantly from a single staged cache — no per-target copy needed.

### Uninstall

```bash
npx zoom-in uninstall       # remove from every recorded target
npx zoom-in uninstall cursor  # remove from one target
rm -rf ~/.zoom-in           # also drop the staged cache + manifest (optional)
```

---

## Supported editors

| Target id | Editor | Skills directory |
|-----------|--------|------------------|
| `cursor` | Cursor | `~/.cursor/skills` |
| `claude` | Claude Code | `~/.claude/skills` |
| `agents` | Generic agents (Gemini CLI, Codex, OpenCode, Pi) | `~/.agents/skills` |
| `copilot` | GitHub Copilot / VS Code | `~/.copilot/skills` |
| `cline` | Cline | `~/.cline/skills` |
| `gemini` | Gemini CLI (standalone) | `~/.gemini/skills |

Run `npx zoom-in targets` to see which are detected on your machine and where the skill would go.

> Don't see your editor? It's a one-line addition in [`src/targets.js`](src/targets.js). PRs welcome.

---

## Global vs project installs

**Global** (default) installs into your home directory, so the skill is available in *every* project for that editor:

```bash
npx zoom-in install          # ~/.cursor/skills, ~/.claude/skills, ...
```

**Project** installs into the current repo, so the skill is **shared with anyone who clones it**:

```bash
npx zoom-in install --project   # ./.cursor/skills, ./.claude/skills, ...
```

Commit the resulting `.cursor/skills/zoom-in/` (etc.) and your whole team gets the skill automatically. Combine with `--link` for a single source of truth that updates with `npx zoom-in update`.

---

## Copy vs symlink (`--link`)

By default `zoom-in` **copies** the skill into each target directory. This is the most portable option (works on Windows without admin rights, no broken links if you move the cache).

Add `--link` to **symlink** each target to a single staged cache at `~/.zoom-in/skills/zoom-in`. Then `npx zoom-in update` refreshes the cache once and every linked target reflects the change immediately.

```bash
npx zoom-in install --link
```

If your OS refuses to create a symlink (e.g. Windows without Developer Mode / admin), `zoom-in` automatically falls back to a copy and tells you.

---

## Commands

```
npx zoom-in install [targets...]   Install the skill (default: all detected editors)
npx zoom-in update   [targets...]   Re-apply the latest version to installed targets
npx zoom-in uninstall [targets...]  Remove the skill (default: all recorded targets)
npx zoom-in list                    Show where the skill is currently installed
npx zoom-in targets                 List supported editors + detection status
npx zoom-in --version               Show the installed skill version
npx zoom-in --help                  Full usage help
```

### Options

| Flag | Description |
|------|-------------|
| `--project` | Install/uninstall into the current repo (`./.cursor/skills`, …) |
| `--all` | Install into *every* known target, detected or not |
| `--link` | Symlink to the staged cache instead of copying |
| `--force` | Overwrite a target that already holds a foreign skill |
| `--dry-run` | Show what would happen without changing anything |
| `--project-root <dir>` | Project root for `--project` (default: current directory) |

---

## Alternative: curl-pipe installer (no Node required)

For machines without Node, use the bash installer which clones the repo and symlinks the skill into each detected editor:

```bash
curl -fsSL https://raw.githubusercontent.com/ellwo/zoom-in-skill/main/install.sh | bash
```

Update with `~/.zoom-in-skill/install.sh --update`, uninstall with `--uninstall`.

---

## Where things live

| Path | Purpose |
|------|---------|
| `~/.zoom-in/manifest.json` | Record of every install (target, method, timestamp) |
| `~/.zoom-in/skills/zoom-in/` | Staged copy of the skill (source of truth for links + updates) |
| `~/.cursor/skills/zoom-in/` | Installed skill for Cursor (one of several targets) |

`~/.zoom-in/` is the **installer's** home and never conflicts with the per-project `.zoom-in/` context directory the skill itself writes during audits.

---

## Requirements

- Node.js 18 or newer (only for `npx` usage; the curl installer needs only `git` + `bash`)
- `npx` ships with npm

The CLI has **zero runtime dependencies** — it uses only Node built-ins, so `npx zoom-in ...` works instantly with nothing to install.

---

## For contributors / publishing

```bash
git clone git@github.com:ellwo/zoom-in-skill.git
cd zoom-in-skill
node test/smoke.js          # run the CLI smoke tests (sandboxed fake HOME)
node bin/zoom-in.js targets # try it locally
npm publish                 # publish a new version (maintainers)
```

The skill content lives in [`skills/zoom-in/`](skills/zoom-in/). The installer code is plain CommonJS in [`bin/`](bin/) and [`src/`](src/) with no dependencies.

When bumping the skill, update `version:` in both [`package.json`](package.json) and the [`skills/zoom-in/SKILL.md`](skills/zoom-in/SKILL.md) frontmatter so `npx zoom-in --version` and `update` report the same number.

## License

Apache-2.0 — see [LICENSE](LICENSE).
