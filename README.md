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
npx zoom-in doctor                  Diagnose the local install (cache, symlinks, version drift)
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

### Troubleshooting

If an editor doesn't see the skill, or after moving your home directory, run:

```bash
npx zoom-in doctor
```

It checks the staged cache, the manifest, and every recorded target (presence, symlink validity, copy integrity, and version drift), then tells you exactly which command fixes each problem (`update` / `install`). It exits non-zero if anything is wrong, so you can use it in scripts too.

---

## Requirements

- Node.js 18 or newer (only for `npx` usage; the curl installer needs only `git` + `bash`)
- `npx` ships with npm

The CLI has **zero runtime dependencies** — it uses only Node built-ins, so `npx zoom-in ...` works instantly with nothing to install.

---

## For contributors

```bash
git clone git@github.com:ellwo/zoom-in-skill.git
cd zoom-in-skill
npm test                    # version-sync + smoke tests (sandboxed fake HOME)
node bin/zoom-in.js targets # try it locally
```

The skill content lives in [`skills/zoom-in/`](skills/zoom-in/). The installer code is plain CommonJS in [`bin/`](bin/) and [`src/`](src/) with no dependencies.

Use **Conventional Commits** (`feat:`, `fix:`, `feat!:` for breaking, `docs:`/`chore:`/`ci:` for no-release) so the automated release pipeline can version and changelog your work.

## Releasing (automated)

Releases are fully automated via GitHub Actions — no manual `npm publish`:

1. **You merge feature/fix PRs to `main`** (using Conventional Commit titles).
2. **[release-please](https://github.com/googleapis/release-please)** opens a running "release PR" that bumps `package.json`, `skills/zoom-in/SKILL.md`, and `CHANGELOG.md` based on the commits since the last release.
3. **You merge the release PR** (one click — see "Fully hands-off auto-merge" below to automate this too). release-please then creates the `vX.Y.Z` tag and a GitHub Release with the auto-generated changelog.
4. **A `publish` job in the same [release-please.yml](.github/workflows/release-please.yml) workflow** then publishes `zoom-in@X.Y.Z` to npm **with provenance** (idempotent — skips if the version is already published; skips gracefully if `NPM_TOKEN` isn't set yet).

> The publish step lives *inside* `release-please.yml` (as a job dependency) rather than in a separate tag-triggered workflow. That's because GitHub's default `GITHUB_TOKEN` can create tags/releases but **cannot trigger other workflows** — a separate `on: push: tags` publisher would never fire for release-please tags. [publish.yml](.github/workflows/publish.yml) remains for manual/first releases and `workflow_dispatch` re-runs.

CI (`.github/workflows/ci.yml`) gates every PR with the version-sync check, the smoke test, and a tarball check.

### One-time setup

1. **Create an npm automation token** at <https://www.npmjs.com/settings/~/tokens> (Granular Access or Classic "Automation" token — it publishes without requiring your 2FA OTP). Scope it to publish `zoom-in`.
2. **Add it as a repository secret** named `NPM_TOKEN`:
   `Settings → Secrets and variables → Actions → New repository secret`.
   Until this is set, releases still cut tags + GitHub Releases, but npm publish is skipped (the workflow stays green with a notice).
3. The repo is **public** (required for npm provenance) and **"Allow GitHub Actions to create and approve pull requests"** is enabled under `Settings → Actions → General → Workflow permissions` (already configured).

### Publishing an already-tagged version

If a tag was cut before `NPM_TOKEN` was set (e.g. `v1.0.0`), publish it manually after adding the secret:

- Actions UI → **Publish (manual)** workflow → **Run workflow** → enter the tag (e.g. `v1.0.0`), or
- `git tag vX.Y.Z && git push origin vX.Y.Z` for a brand-new tag.

### Fully hands-off auto-merge (optional)

By default the release PR is merged by a maintainer (one click) — a useful human gate. To make every `feat:`/`fix:` merge produce a release with **no** clicking:

1. Add a branch protection rule on `main` (`Settings → Branches → Add rule`) requiring the **Smoke + packaging gates** check.
2. Ensure **Allow auto-merge** is on (`Settings → General → Pull Requests`) — already enabled.

With those, release-please's release PRs auto-merge once CI passes, and the publish job then ships to npm automatically. Without branch protection, GitHub won't allow auto-merge, so the release PR stays open until you merge it.

### Bumping the skill

The version lives in **two** places that must stay in sync (enforced by `test/version-sync.js` and CI): `package.json` and the `version:` frontmatter of [`skills/zoom-in/SKILL.md`](skills/zoom-in/SKILL.md). release-please bumps both automatically — [`release-please-config.json`](release-please-config.json) lists `skills/zoom-in/SKILL.md` under `extra-files` (type `generic`), and the `# x-release-please-version` annotation on the skill's `version:` line tells release-please's Generic updater which value to bump. If you ever bump by hand, update both.

## License

Apache-2.0 — see [LICENSE](LICENSE).
