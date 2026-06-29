# Init Version Changelog

> Tracks what features/fields each init version introduces.
> `/zoom-in re-init` reads this to determine what gaps exist between the
> project's `init_version` (in SYSTEM.md) and the current skill version.
>
> **When to bump the version**: Any time a change to the skill adds a new field
> to SYSTEM.md, ARCHITECTURE.md, DECISIONS.md, or ANTI-PATTERNS.md that `/zoom-in
> init` should generate, bump the version and document what changed here.

---

## How re-init Uses This File

1. Read `init_version` from the project's SYSTEM.md (default: 1 if absent)
2. Read this changelog to find all versions newer than the project's
3. Collect all "Added" entries from those versions → these are the gaps
4. For each gap: verify whether the field/feature actually exists in the
   project's context files (field detection — the "Hybrid" approach)
5. Report: present vs missing, and offer to fill the gaps

---

## Version History

### Version 2 — 2026-06-19

**Added to SYSTEM.md:**
- `Decision Structure` field (Flat / Modular) — determines where ADRs are stored

**Added to DECISIONS.md (per ADR record):**
- `Scope` field (global / `<module-name>`) — required for Modular structure

**Added to audit frontmatter:**
- `audit_commit_sha` — git HEAD SHA at audit time, for Change Detection
- `previous_audit_commit_sha` — from previous audit, for `git diff` between audits

**Added to audit workflow:**
- Step 1.5: Change Detection — git diff (committed + uncommitted + untracked) + dependency graph
- Step 5.5: Backlog Review — checks `.zoom-in/context/backlog.md` for open/resolved items

**Added to adopt workflow:**
- Step 5: Draft Gate — mandatory user confirmation before writing any decision to files
- Decision Structure awareness — writes to per-module files when Modular

**Added to refactor workflow:**
- Backlog deferral — skipped findings can be tracked in `.zoom-in/context/backlog.md`

**Added to verify workflow:**
- Step 3.5: Backlog Side-Effect Check — detects deferred items resolved by other fixes

**New context files:**
- `.zoom-in/context/backlog.md` — technical debt backlog
- `.zoom-in/context/decisions/<module>.md` — per-module ADRs (Modular mode only)

**New reference files:**
- `references/backlog.md` — backlog format and lifecycle documentation
- `references/re-init.md` — re-init command documentation
- `references/init-changelog.md` — this file

---

### Version 1 — 2026-06-14

**Original init — created:**
- `SYSTEM.md` — strategic context (system type, framework, tenancy, auth, registers)
- `ARCHITECTURE.md` — house-style (§1-§6: profile, patterns, decisions, exceptions, evolving, golden refs)
- `DECISIONS.md` — architectural constitution (ADR records)
- `ANTI-PATTERNS.md` — rejection rules (§1-§5: universal, framework, register, project, team)

**Audit persistence:**
- `.zoom-in/context/audits/<scope>/YYYY-MM-DD--score-XX.md`
- `.zoom-in/context/audits/index.md`

---

## Rules for Adding New Versions

1. **Increment by 1** — no skipping (v3, not v5)
2. **Document every field/feature change** — re-init uses this to detect gaps
3. **Categorize by file** — which context file does the change affect?
4. **Distinguish "Added" vs "Changed"** — "Added" means new field/feature;
   "Changed" means existing field modified (re-init may need to update, not just add)
5. **Date the version** — when was it released
6. **Keep it readable** — a new team member should understand what each version brought
