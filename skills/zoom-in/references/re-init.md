# `/zoom-in re-init` — Evolution Sync for Existing Projects

**Purpose**: Synchronize existing context files with the current skill version AND the current codebase, without losing the team's existing decisions. Detects and repairs three drift types:

1. **Schema drift** — skill added new fields/features since last `init`; context files missing them
2. **Codebase drift** — code changed since `init` (patterns emerged, golden refs deleted, modules added/removed); ARCHITECTURE.md §2/§6 stale
3. **Untracked changes** — decisions/bans written without proper process (e.g. `adopt` without Draft Gate, manual edits); detected via git diff

## When to Use

| Situation | Command |
|-----------|---------|
| New project, no context files | `/zoom-in init` |
| Skill upgraded with new features | **`/zoom-in re-init`** |
| Major refactor changed module structure | **`/zoom-in re-init`** |
| Context files feel stale (golden refs → deleted code) | **`/zoom-in re-init`** |
| Switch Flat ↔ Modular decision structure | **`/zoom-in re-init`** |
| Suspect decisions added without confirmation | **`/zoom-in re-init`** |
| Routine context-accuracy check (quarterly) | **`/zoom-in re-init`** |
| Finding code violations | `/zoom-in audit` (not re-init) |
| Adding a new decision | `/zoom-in adopt` (not re-init) |

**re-init vs audit**: audit checks code against context (finds violations); re-init checks context against code+skill (finds staleness). Complementary.

## Prerequisites

**Fail** if no `SYSTEM.md` or `ARCHITECTURE.md` → "No context files found. Run `/zoom-in init` first." **Warn** if `DECISIONS.md` or `ANTI-PATTERNS.md` missing (proceed — may be a fresh project).

## 1. Load Existing Context (in order)

1. `SYSTEM.md` — read `init_version` (default 1 if absent), Decision Structure, all fields
2. `ARCHITECTURE.md` — §1-§6 (profile, patterns, decisions, exceptions, evolving, golden refs)
3. `DECISIONS.md` — all Active, Superseded, Draft decisions
4. `ANTI-PATTERNS.md` — §1-§5
5. `.zoom-in/context/audits/index.md` — audit history (if exists)
6. `.zoom-in/context/backlog.md` — tech debt backlog (if exists)
7. `references/init-changelog.md` — version history (what features each version adds)
8. Framework reference + register reference(s) — for drift-check calibration

## 2. Git Diff — Detect Untracked Changes

Identify context-file changes NOT made through proper process (init, adopt with Draft Gate, audit persistence):
```bash
git diff --name-only HEAD -- SYSTEM.md ARCHITECTURE.md DECISIONS.md ANTI-PATTERNS.md
git diff --stat HEAD -- SYSTEM.md ARCHITECTURE.md DECISIONS.md ANTI-PATTERNS.md
```

**Classify**: uncommitted modifications → "unchecked" (need user confirmation); committed changes → "legitimate" (part of project record, don't question — went through review/commit).

**Not a git repo**: skip this step, rely on Steps 3-5; note "Git not available — cannot detect untracked changes." **All context files uncommitted (never committed)**: treat all content as "unchecked" — ask user to confirm existing state before changes.

## 3. Schema Version Gap Analysis

**3a** Read project's `init_version` from SYSTEM.md (default 1 if absent).
**3b** Load `references/init-changelog.md`; collect all "Added" entries from versions newer than `init_version`.
**3c** Field-detect each feature (verify the gap is real, not just version-mismatched):

| Feature from changelog | Detection check |
|---|---|
| Decision Structure field in SYSTEM.md | `grep "Decision Structure" SYSTEM.md` |
| Scope field in ADR records | Check any ADR in DECISIONS.md for `Scope:` field |
| audit_commit_sha in audit frontmatter | Read latest audit file's YAML frontmatter |
| Backlog support | `.zoom-in/context/backlog.md` exists (optional — OK if absent) |
| Draft Gate | Skill-level, no context change — always OK |
| Modular decision files | `.zoom-in/context/decisions/` exists (absent = Flat, valid) |

**3d** Build gap report: `❌ <feature> missing from <file>` (re-init can fill) / `✅ <feature> present` (no action).

## 4. Deep Drift Check — Rescan Codebase

Compare ARCHITECTURE.md §2 (Established Patterns) and §6 (Golden References) against actual codebase. Depth = same as `/zoom-in init` Step 2, including discovering new patterns.

**4a Pattern verification (§2)** — for each pattern, check: (1) golden ref file still present? (deleted → 🔴 Stale); (2) pattern still holds across modules? (rescan original modules; 3+ = Established, 1-2 = Emerging; dropped → downgrade, more adopted → upgrade); (3) description still accurate? (code evolved → description stale). Classify: ✅ Current / ⚠️ Drifted / 🔴 Stale / 💡 New (not in §2, candidate).

**4b Pattern discovery** — scan for patterns NOT in §2 but consistently applied across 3+ modules → Emerging/Established candidates.

**4c Golden Reference verification (§6)** — for each: file still exists? still exemplifies the pattern? better example now? Result: ✅ Valid / ❌ Deleted / ⚠️ Degraded (exists but no longer exemplifies).

**4d Anti-pattern verification (§4, §5)** — for each ban: still relevant (anti-pattern may be fixed everywhere)? new anti-patterns in code not yet banned?

## 5. Orphaned Decision Detection

For each Active ADR in DECISIONS.md, run 3 checks:
1. **Golden Reference**: referenced file still exists? still implements the decision? (no → orphaned)
2. **Relevance**: still followed in codebase? or silently diverged (violating without superseding)? (diverged → audit's job to fix code, or re-init flags for superseding)
3. **Superseded**: has another ADR implicitly superseded this one without formal record? (yes → flag for formal superseding)

**Result per ADR**: ✅ Healthy / ⚠️ Reference stale (golden ref deleted/changed, decision may still hold) / ❌ Orphaned (references deleted code, no longer applicable) / 🔴 Silently violated (code diverged without superseding).

## 6. Auto-Detect Scope (only if switching Flat → Modular)

**Trigger**: user chooses Modular in Step 8a. For each ADR lacking a `Scope` field:

1. **Extract keywords**: title (e.g. "Adapter revoke_access..." → adapter, revoke, channel), context field ("the integrations module's tasks..." → integrations), golden reference path (integrations/adapters/base.py → integrations), affected lenses + module mentions
2. **Match against module names** from project directory structure; score each module by keyword-match count; clear winner → `Scope: <module>`; tie/no winner → `Scope: global`
3. **Present suggestion (Draft Gate)**: "AD-13 ... Auto-detected Scope: integrations (matched: title, context, golden reference). Correct? [Yes / Change to global / Change to <other module>]"
4. **Global fallback**: "AD-3 ... No module-specific keywords — suggesting Scope: global. Correct? [Yes / Change to <module>]"

## 7. Present Findings — Gap & Drift Report

Combine all findings into a structured report with these sections:
- **Schema Version**: project init_version → current skill version; gaps (missing/present)
- **Untracked Changes (git diff)**: per file — what was modified uncommitted, action needed (confirm/reject)
- **Pattern Drift (§2)**: per lens — Current/Drifted/Stale/New with module counts
- **Golden References (§6)**: Valid count, Deleted/Degraded entries with reasons
- **Orphaned Decisions**: per ADR — Healthy/Reference stale/Orphaned/Silently violated
- **Anti-Pattern Drift**: §1-§3 validity, §4/§5 outdated, new candidates
- **Summary**: counts per category + total issues

## 8. Interactive Repair (Draft Gate mandatory for DECISIONS.md / ANTI-PATTERNS.md)

Re-init never writes decisions or bans without explicit per-item confirmation.

**8a Schema gaps** — "Decision Structure field missing. Flat or Modular?" Options: Flat / Modular. If Modular + ADRs lack Scope → trigger Step 6. "Scope field missing from ADR records. Auto-detect suggests: AD-1: global, AD-11: integrations. Confirm all? [Yes / Review each]." After filling: update `init_version` to current version.

**8b Untracked changes** — for each untracked ADR: "DRAFT: AD-N — <title>. Added uncommitted, not confirmed via Draft Gate. Adopt / Modify / Reject / Defer?" (Adopt=Active Decision enforced; Modify=edit then re-present; Reject=remove, revert; Defer=Draft section, not enforced). Untracked §2/§3 changes: linked to ADR decisions (kept/reverted accordingly). Untracked bans: "DRAFT: T-N. Adopt / Reject?"

**8c Pattern drift** — 🔴 Stale: "Remove from §2 / Update golden reference / Mark as Emerging." 💡 New: "Add to §2 as Emerging? [Yes / No / Need more evidence]."

**8d Golden reference repair (§6)** — "Remove from §6 / Replace with new reference / Keep with note."

**8e Orphaned decision repair** — ❌ Orphaned: "Supersede (mark done) / Update golden reference / Keep as-is." 🔴 Silently violated: "File as audit finding (code needs fixing) / Amend decision (exclude those models) / Keep as-is (audit will catch it)."

**8f Anti-pattern drift** — 💡 New anti-pattern: "Add to §5 (team ban) / Add to §4 (project ban) / Skip."

## 9. Apply Confirmed Changes

**Write only confirmed changes** — never write anything the user didn't explicitly approve.

**Files that may be updated:**

| File | What changes | Condition |
|---|---|---|
| SYSTEM.md | Add Decision Structure, update init_version | Schema gap confirmed |
| ARCHITECTURE.md §2 | Add/remove/update patterns | Drift confirmed |
| ARCHITECTURE.md §3 | Add/remove decision rows | ADR changes confirmed |
| ARCHITECTURE.md §6 | Add/remove/update golden refs | Golden ref drift confirmed |
| DECISIONS.md | Add Scope fields, add/remove ADRs, supersede orphans | ADR changes confirmed (Draft Gate) |
| ANTI-PATTERNS.md | Add/remove bans | Ban changes confirmed (Draft Gate) |

**Files NEVER touched:**

| File | Why |
|---|---|
| `.zoom-in/context/audits/` | Historical record — never modified |
| `.zoom-in/context/backlog.md` | Managed by refactor/verify — re-init only reports on it |

**Flat → Modular**: for each ADR with confirmed Scope: `global` → stays in DECISIONS.md; `<module>` → move to `.zoom-in/context/decisions/<module>.md`. Create `.zoom-in/context/decisions/` dir. Create per-module files with same ADR format (Active/Superseded/Draft/Index). Update ARCHITECTURE.md §3: add Scope column.

**Modular → Flat**: read all `.zoom-in/context/decisions/*.md`; merge ADRs into DECISIONS.md (preserve Active/Superseded/Draft sections); delete `.zoom-in/context/decisions/` dir + files; update ARCHITECTURE.md §3: remove Scope column.

**Update init_version**: set in SYSTEM.md to current skill version (from `references/init-changelog.md`).

## 10. Report Results

Structured report with these sections:
- **Schema Updated**: Decision Structure chosen, Scope fields added (count + global/module split), init_version old → new
- **Untracked Changes Resolved**: per ADR/ban — Adopted/Rejected (with title), ARCHITECTURE.md sync note
- **Pattern Drift Resolved**: per pattern — Removed/Added/Updated
- **Golden References Updated**: per ref — Removed/Added (with replacement)
- **Orphaned Decisions Resolved**: per ADR — Superseded / Filed as audit finding
- **Anti-Patterns Updated**: per ban — Adopted/Added to §5
- **Files Modified**: list
- **Files Preserved**: audits/, backlog.md (untouched)

## 11. Edge Cases

| Situation | Response |
|---|---|
| Not a git repository | Skip git diff (Step 2). Rely on field detection + drift check. Note: "Git not available — cannot detect untracked changes." |
| No context files found | Fail: "No SYSTEM.md or ARCHITECTURE.md found. Run `/zoom-in init` first." |
| No `init_version` in SYSTEM.md | Assume version 1. Note: "init_version not found — assuming v1." |
| All context files uncommitted (never committed) | Treat all content as "unchecked" — present full state for confirmation |
| No drift detected (everything in sync) | Short report: "Context is in sync with codebase. Schema version up to date. No issues found." |
| Switching Modular → Flat | Merge all per-module files into DECISIONS.md, delete module files |
| ADR without Scope + auto-detect fails | Ask user directly: "global or <module>?" (never guess silently) |
| User rejects all untracked changes | Revert context files to last committed state via `git checkout` |
| Backlog has resolved items | Note in report: "X backlog items resolved since last audit" — but do not modify backlog (verify/audit's job) |

## 12. Failure Modes

| Situation | Response |
|---|---|
| No SYSTEM.md or ARCHITECTURE.md | Fail: "Run `/zoom-in init` first" |
| init-changelog.md missing | Warn: "Cannot determine schema version gaps. Running drift check only." |
| Git not available | Skip untracked-change detection. Note in report. |
| User rejects everything | Revert context files to last committed state. Report: "All untracked changes rejected. Context restored to last commit." |
| Drift check finds >20 issues | Summarize by category: "5 stale patterns, 3 orphaned decisions, 12 new pattern candidates. Review each?" |
| Switching to Modular but all ADRs are global | Proceed — Modular with zero module-specific ADRs is valid. Per-module files created on first module-specific adopt. |

## After Re-Init

Context files are now synchronized with: current skill version (schema fields filled, init_version updated), current codebase (patterns/golden refs/decisions verified), team's actual decisions (untracked changes confirmed or rejected).

**Next steps**: `/zoom-in audit` (authoritative scores with accurate context) · `/zoom-in adopt` (formalize any new decisions identified) · re-run re-init after major skill updates or significant codebase changes.
