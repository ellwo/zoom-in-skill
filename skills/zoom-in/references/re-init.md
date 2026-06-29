# `/zoom-in re-init` — Evolution Sync for Existing Projects

> The skill evolves. The codebase evolves. The context files captured a snapshot
> at init time — but snapshots go stale. `re-init` synchronizes the context with
> both the current skill version and the current codebase, without losing the
> team's existing decisions and patterns.

---

## Purpose

Detect and repair three types of drift in an already-initialized project:

1. **Schema drift** — The skill added new fields/features since the last `init`.
   The project's context files are missing them.
2. **Codebase drift** — The code changed since `init` (patterns emerged, golden
   references deleted, modules added/removed). ARCHITECTURE.md §2/§6 is stale.
3. **Untracked changes** — Decisions or patterns were written to context files
   without proper process (e.g., `adopt` without Draft Gate, manual edits).
   `re-init` uses git diff to identify these and asks the user to confirm or reject.

**Why this matters**: Without `re-init`, a project initialized at skill v1 never
gets the benefits of v2 features (Decision Structure, Scope fields, Backlog
support, Change Detection). And as the codebase evolves, ARCHITECTURE.md's golden
references may point to deleted files, and §2 patterns may no longer reflect
what the code actually does. The context becomes a liability — enforcing rules
that don't match reality.

---

## When to Use

| Situation | Command |
|-----------|---------|
| New project, no context files | `/zoom-in init` |
| Skill upgraded with new features | **`/zoom-in re-init`** |
| Major refactor changed module structure | **`/zoom-in re-init`** |
| Context files feel stale (golden refs point to deleted code) | **`/zoom-in re-init`** |
| Want to switch Flat ↔ Modular decision structure | **`/zoom-in re-init`** |
| Suspect decisions were added without confirmation | **`/zoom-in re-init`** |
| Routine health check of context accuracy | **`/zoom-in re-init`** (quarterly) |
| Finding code violations | `/zoom-in audit` (not re-init) |
| Adding a new decision | `/zoom-in adopt` (not re-init) |

**re-init vs audit**: Audit checks the *code* against the *context* (finds violations).
Re-init checks the *context* against the *code + skill* (finds staleness). They are
complementary — audit says "your code breaks your rules", re-init says "your rules
don't match your code anymore."

---

## Prerequisites

1. **Context files must exist** — SYSTEM.md, ARCHITECTURE.md at minimum.
   If they don't exist, fail with: "No context files found. Run `/zoom-in init` first."
2. **DECISIONS.md should exist** — if missing, warn but proceed (may be a fresh
   project that only has SYSTEM.md + ARCHITECTURE.md).
3. **ANTI-PATTERNS.md should exist** — if missing, warn but proceed.

---

## Chain of Thought

1. **Detect** — What changed in the skill? In the code? In the context files?
2. **Analyze** — Which changes are legitimate (committed) vs untracked (uncommitted)?
3. **Report** — Present all drift findings in a structured report.
4. **Repair** — Interactive confirmation for each issue (Draft Gate for decisions).
5. **Apply** — Write only confirmed changes. Preserve legitimate history.

---

## Step-by-Step Process

### Step 1: Load Existing Context

Load in order:
1. SYSTEM.md — read `init_version` (default: 1 if absent), Decision Structure, all fields
2. ARCHITECTURE.md — §1-§6 (profile, patterns, decisions, exceptions, evolving, golden refs)
3. DECISIONS.md — all Active, Superseded, and Draft decisions
4. ANTI-PATTERNS.md — all sections (§1-§5)
5. `.zoom-in/context/audits/index.md` — audit history (if exists)
6. `.zoom-in/context/backlog.md` — tech debt backlog (if exists)
7. `references/init-changelog.md` — version history (what features each version adds)
8. Framework reference + register reference(s) — for drift check calibration

**Why load everything**: Re-init needs the full picture — existing decisions to
check for orphans, patterns to verify against code, schema to check for gaps.

---

### Step 2: Git Diff — Detect Untracked Changes

**Purpose**: Identify changes to context files that were not made through the
proper process (init, adopt with Draft Gate, audit persistence).

```bash
git diff --name-only HEAD -- SYSTEM.md ARCHITECTURE.md DECISIONS.md ANTI-PATTERNS.md
```

Also check:
```bash
git diff --stat HEAD -- SYSTEM.md ARCHITECTURE.md DECISIONS.md ANTI-PATTERNS.md
```

**Classification**:
- **Uncommitted modifications** → "unchecked" — need user confirmation
- **Committed changes** (in git history) → "legitimate" — part of the project's
  record, do not question them (they went through review/commit)

**If not a git repository**: Skip this step. Rely on Steps 3-5 for drift detection.
Note in the report: "Git not available — cannot detect untracked changes."

**If all context files are uncommitted (never committed)**: Treat all content as
"unchecked" — ask the user to confirm the existing state before making changes.

---

### Step 3: Schema Version Gap Analysis (Hybrid Approach)

**Purpose**: Determine what features the current skill expects that the project's
context files don't have yet.

#### 3a: Read the project's init version

```markdown
# From SYSTEM.md:
## Init Version
1
```

If `init_version` is absent → assume version 1.

#### 3b: Read the changelog

Load `references/init-changelog.md`. Collect all "Added" entries from versions
newer than the project's `init_version`.

#### 3c: Field detection (verify each gap)

For each feature from the changelog, check whether it actually exists in the
project's context files:

| Feature from changelog | Detection check |
|---|---|
| Decision Structure field in SYSTEM.md | `grep "Decision Structure" SYSTEM.md` |
| Scope field in ADR records | Check any ADR in DECISIONS.md for `Scope:` field |
| audit_commit_sha in audit frontmatter | Read latest audit file's YAML frontmatter |
| Backlog support | Check if `.zoom-in/context/backlog.md` exists (optional — OK if absent) |
| Draft Gate | Skill-level feature, no context file change — always OK |
| Modular decision files | Check if `.zoom-in/context/decisions/` exists (absent = Flat, which is valid) |

#### 3d: Build the gap report

```
Schema Gaps (init_version 1 → current 2):
  ❌ Decision Structure field missing from SYSTEM.md
  ❌ Scope field missing from ADR records in DECISIONS.md
  ✅ audit_commit_sha: present in latest audit frontmatter
  ✅ Backlog: no backlog.md (OK — created on first deferral)
  ✅ Draft Gate: skill-level, no context change needed
  ✅ Modular files: no .zoom-in/context/decisions/ (OK — Flat by default)
```

For each ❌ (missing): this is a gap that re-init can fill.
For each ✅ (present): already up to date — no action needed.

---

### Step 4: Deep Drift Check — Rescan Codebase

**Purpose**: Compare ARCHITECTURE.md §2 (Established Patterns) and §6 (Golden
References) against the actual codebase to find staleness.

**Depth**: Deep — same scan depth as `/zoom-in init` Step 2. This includes
discovering new patterns that emerged since init.

#### 4a: Pattern verification (ARCHITECTURE.md §2)

For each pattern in §2 (all lenses):

1. **Is the golden reference file still present?**
   - If deleted → pattern is stale (🔴)
   - If present → continue verification

2. **Does the pattern still hold across modules?**
   - Rescan the modules that originally exhibited the pattern
   - Check if the pattern is still followed (3+ modules = Established, 1-2 = Emerging)
   - If modules dropped the pattern → status may need downgrading
   - If more modules adopted it → status may need upgrading

3. **Is the pattern description still accurate?**
   - Compare the §2 description with what the code actually does
   - If the code evolved (e.g., pattern was refined) → description is stale

**Classification**:
- ✅ **Current** — pattern still holds, golden reference valid
- ⚠️ **Drifted** — pattern partially holds or description is outdated
- 🔴 **Stale** — golden reference deleted or pattern no longer followed
- 💡 **New** — new pattern detected in code, not in §2 (candidate for addition)

#### 4b: Pattern discovery (new patterns)

Scan the codebase for patterns that are NOT in §2 but are consistently applied
across 3+ modules. These are candidates for "Emerging" or "Established" status.

**Why discover new patterns**: Since init, the team may have adopted new
conventions. Re-init captures them so the next audit enforces them.

#### 4c: Golden Reference verification (ARCHITECTURE.md §6)

For each entry in §6:
- Does the file still exist?
- Does it still exemplify the pattern?
- Is there a better example now (a newer module that does it cleaner)?

**Result**:
- ✅ **Valid** — file exists and exemplifies the pattern
- ❌ **Deleted** — file no longer exists
- ⚠️ **Degraded** — file exists but no longer exemplifies the pattern (code changed)

#### 4d: Anti-pattern verification (ANTI-PATTERNS.md §4, §5)

For each project-specific ban (§4) and team-added ban (§5):
- Is the ban still relevant? (The anti-pattern may have been fixed everywhere)
- Are there new anti-patterns in the code not yet banned?

---

### Step 5: Orphaned Decision Detection

**Purpose**: Find ADRs in DECISIONS.md that reference code that no longer exists
or patterns that are no longer followed.

For each Active ADR in DECISIONS.md:

1. **Golden Reference check**:
   - Does the referenced file still exist?
   - Does it still implement the decision correctly?
   - If not → the decision is "orphaned" (its reference is stale)

2. **Decision relevance check**:
   - Is the decision still being followed in the codebase?
   - Or has the code silently diverged (violating the decision without superseding it)?
   - If the code diverged → either the code needs fixing (audit's job) or the
     decision needs superseding (re-init flags it for the user to decide)

3. **Superseded check**:
   - Has another ADR implicitly superseded this one without a formal record?
   - If so → flag for formal superseding

**Result per ADR**:
- ✅ **Healthy** — golden reference valid, decision followed
- ⚠️ **Reference stale** — golden reference deleted/changed, decision may still be valid
- ❌ **Orphaned** — decision references deleted code and is no longer applicable
- 🔴 **Silently violated** — code diverged from decision without superseding

---

### Step 6: Auto-Detect Scope (if switching to Modular)

**Trigger**: User chooses to switch from Flat to Modular during Step 8.

For each ADR that lacks a `Scope` field:

**Auto-detect algorithm**:

1. **Extract keywords from the ADR**:
   - Title: e.g., "Adapter revoke_access Must Not Transition Channel State"
     → keywords: adapter, revoke, channel → module: integrations
   - Context field: e.g., "The integrations module's tasks use..."
     → module: integrations
   - Golden Reference path: e.g., "integrations/adapters/base.py"
     → module: integrations
   - Affected Lenses + any module mentions

2. **Match against module names**:
   - Get the list of modules from the project's directory structure
   - Score each module by keyword match count
   - If one module scores significantly higher → suggest `Scope: <that module>`
   - If no clear winner or tie → suggest `Scope: global`

3. **Present suggestion to user** (Draft Gate):
   > "AD-13 'Adapter revoke_access Must Not Transition Channel State'
   > Auto-detected Scope: integrations (matched: title, context, golden reference)
   > Correct? [Yes / Change to global / Change to <other module>]"

4. **For ADRs that auto-detect as global**:
   > "AD-3 'Uniform API Response Shape'
   > No module-specific keywords found — suggesting Scope: global.
   > Correct? [Yes / Change to <module>]"

---

### Step 7: Present Findings — Full Re-Init Report

Combine all findings into a structured report:

```
# Zoom-in Re-Init: Gap & Drift Report

## Schema Version
Project init_version: 1 → Current skill version: 2
Gaps: 2 missing, 4 present

### Missing (re-init can fill):
❌ Decision Structure field in SYSTEM.md
❌ Scope field in ADR records (DECISIONS.md)

### Present (no action needed):
✅ audit_commit_sha in audit frontmatter
✅ Backlog support (no backlog.md — OK)
✅ Draft Gate (skill-level — no context change)
✅ Modular decision files (none — OK for Flat)

---

## Untracked Changes (git diff)
4 context files modified since last commit:

### DECISIONS.md (uncommitted):
  + AD-12 through AD-17 (6 new ADRs) — NOT confirmed via Draft Gate
  → Action needed: confirm or reject each (Step 8)

### ARCHITECTURE.md (uncommitted):
  §2: 4 pattern descriptions modified
  §3: 6 new decision rows added (AD-12 to AD-17)
  → Action: depends on ADR confirmation (linked to DECISIONS.md)

### ANTI-PATTERNS.md (uncommitted):
  §5: T-4 ban added
  → Action: confirm or reject (Step 8)

---

## Pattern Drift (ARCHITECTURE.md §2)

### Clarity:
  ✅ API response envelope — still Established (8 modules)
  ✅ ViewSet naming — still Established (8 modules)
  ⚠️ Enum/constants for status — description outdated (now covers comparisons per AD-14)
  💡 New: "Repository per aggregate" pattern detected in 3 modules — candidate for Established

### Structure:
  ✅ Service layer — still Established (5 modules)
  ✅ Clean architecture — still Emerging (2 modules)
  🔴 Factory pattern — golden reference deleted (bot.IntegrationChannel removed per AD-11)

### [Other lenses...]

---

## Golden References (§6)
  ✅ 18/20 files still exist and exemplify patterns
  ❌ 'bot/tasks.py' — retry pattern was removed; no longer a golden reference for AD-7
  ❌ 'integrations/services/oauth_service.py' — file exists but deprecated (§4 Known Exception)

---

## Orphaned Decisions
  ⚠️ AD-7: Golden reference 'bot/tasks.py' no longer exemplifies retry pattern
  ❌ AD-11: References 'bot.IntegrationChannel' — code deleted, decision is stale
  🔴 AD-9: State machine guard — 2 new models have state machines without guards (silent violation)

---

## Anti-Pattern Drift
  ✅ All §1-§3 bans still valid
  ⚠️ §4 P-4 "Celery tasks without queue=" — 3 new violations in code
  💡 New anti-pattern detected: "Adapter calling lifecycle service" (3 instances) — candidate for ban

---

## Summary
  Schema gaps: 2 to fill
  Untracked changes: 8 items to confirm/reject
  Pattern drift: 1 stale, 1 outdated, 1 new candidate
  Golden references: 2 invalid
  Orphaned decisions: 3
  Anti-pattern drift: 1 outdated, 1 new candidate
  Total issues: 16
```

---

### Step 8: Interactive Repair (with Draft Gate)

Present each issue to the user for confirmation. **Draft Gate is mandatory**
for any change to DECISIONS.md or ANTI-PATTERNS.md — re-init never writes
decisions or bans without explicit per-item confirmation.

#### 8a: Schema Gaps (fill missing fields)

> **Decision Structure field missing from SYSTEM.md**
> Flat (single DECISIONS.md) or Modular (global + per-module files)?
> Options: **Flat** / **Modular**

If Modular is chosen and existing ADRs lack Scope fields → trigger Step 6
(auto-detect Scope for each ADR, with user confirmation).

> **Scope field missing from ADR records**
> Auto-detect suggests:
> - AD-1: global (no module-specific keywords)
> - AD-2: global
> - AD-11: integrations (matched: title, context, golden reference)
> Confirm all? [Yes / Review each individually]

After filling: update `init_version` in SYSTEM.md to current version.

#### 8b: Untracked Changes (confirm or reject)

For each untracked ADR (from git diff):

> **DRAFT: AD-12 — Domain Layer Purity**
> Added to DECISIONS.md (uncommitted). This decision was not confirmed via
> Draft Gate. Adopt / Modify / Reject / Defer?
> - **Adopt**: Keep as Active Decision — enforced by future audits
> - **Modify**: Edit the decision before adopting
> - **Reject**: Remove from DECISIONS.md — revert to pre-change state
> - **Defer**: Move to Draft Decisions — not enforced, revisit later

For untracked §2/§3 changes:

> **ARCHITECTURE.md §2 modified (4 patterns)**
> These changes are linked to untracked ADRs. They will be kept or reverted
> based on your ADR decisions above.

For untracked bans:

> **DRAFT: T-4 — Adapter methods calling lifecycle service**
> Added to ANTI-PATTERNS.md §5 (uncommitted). Adopt / Reject?
> - **Adopt**: Keep the ban — enforced as [principle] 🟠 High
> - **Reject**: Remove — revert to pre-change state

#### 8c: Pattern Drift (update or remove)

> **🔴 Factory pattern — golden reference deleted**
> 'bot/tasks.py' was the golden reference but the pattern was removed.
> Options: **Remove from §2** / **Update golden reference** / **Mark as Emerging**

> **💡 New pattern: "Repository per aggregate" (3 modules)**
> Detected in: client_management, integrations, ticket_management
> Add to §2 as Emerging? [Yes / No / Need more evidence]

#### 8d: Golden Reference Repair (§6)

> **❌ 'bot/tasks.py' — no longer a golden reference for Celery retry**
> Options: **Remove from §6** / **Replace with new reference** / **Keep with note**

#### 8e: Orphaned Decision Repair

> **❌ AD-11 — references deleted code (bot.IntegrationChannel)**
> The decision unified on v2, but the code migration is complete.
> Options: **Supersede (mark as done)** / **Update golden reference** / **Keep as-is**

> **🔴 AD-9 — 2 new models have state machines without guards**
> The code diverged from the decision without superseding.
> Options: **File as audit finding** (code needs fixing) / **Amend the decision** (exclude those models) / **Keep as-is** (audit will catch it)

#### 8f: Anti-Pattern Drift

> **💡 New anti-pattern: "Adapter calling lifecycle service" (3 instances)**
> Add as project-specific ban (§4) or team ban (§5)?
> Options: **Add to §5 (team ban)** / **Add to §4 (project ban)** / **Skip**

---

### Step 9: Apply Confirmed Changes

After the user has confirmed/rejected every item:

**Write only confirmed changes** — never write anything the user didn't explicitly approve.

#### Files that may be updated:

| File | What changes | Condition |
|---|---|---|
| SYSTEM.md | Add Decision Structure, update init_version | Schema gap confirmed |
| ARCHITECTURE.md §2 | Add/remove/update patterns | Drift confirmed |
| ARCHITECTURE.md §3 | Add/remove decision rows | ADR changes confirmed |
| ARCHITECTURE.md §6 | Add/remove/update golden refs | Golden ref drift confirmed |
| DECISIONS.md | Add Scope fields, add/remove ADRs, supersede orphans | ADR changes confirmed (Draft Gate) |
| ANTI-PATTERNS.md | Add/remove bans | Ban changes confirmed (Draft Gate) |

#### Files that are NEVER touched:

| File | Why |
|---|---|
| `.zoom-in/context/audits/` | Historical record — never modified |
| `.zoom-in/context/backlog.md` | Managed by refactor/verify — re-init only reports on it |

#### If switching Flat → Modular:

1. For each ADR with confirmed Scope:
   - `Scope: global` → stays in DECISIONS.md
   - `Scope: <module>` → move to `.zoom-in/context/decisions/<module>.md`
2. Create `.zoom-in/context/decisions/` directory
3. Create per-module files with same ADR format (Active, Superseded, Draft, Index)
4. Update ARCHITECTURE.md §3: add Scope column

#### If switching Modular → Flat:

1. Read all `.zoom-in/context/decisions/*.md` files
2. Merge all ADRs into DECISIONS.md (preserve Active/Superseded/Draft sections)
3. Delete `.zoom-in/context/decisions/` directory and files
4. Update ARCHITECTURE.md §3: remove Scope column

#### Update init_version:

Set `init_version` in SYSTEM.md to the current skill version (from
`references/init-changelog.md`).

---

### Step 10: Report Results

```
# Zoom-in Re-Init: Results

## Schema Updated
  ✅ Decision Structure: Modular (added to SYSTEM.md)
  ✅ Scope fields: added to 17 ADRs (12 global, 5 module-specific)
  ✅ init_version: 1 → 2

## Untracked Changes Resolved
  ✅ AD-12: Adopted (Domain Layer Purity)
  ✅ AD-13: Adopted (Adapter revoke_access)
  ❌ AD-14: Rejected (Enum-Only Comparisons) — removed from DECISIONS.md
  ✅ AD-15: Adopted (ViewSet RBAC Coverage)
  ❌ AD-16: Rejected (Celery retry_backoff) — removed from DECISIONS.md
  ✅ AD-17: Adopted (Views No Lifecycle)
  ✅ T-4: Adopted (Adapter lifecycle ban)
  → ARCHITECTURE.md §2/§3 synced with confirmed ADRs

## Pattern Drift Resolved
  🔴 Factory pattern: Removed from §2 (golden reference deleted)
  💡 Repository per aggregate: Added to §2 as Emerging

## Golden References Updated
  ❌ 'bot/tasks.py': Removed (retry pattern gone)
  ✅ 'integrations/adapters/base.py': Added (replaces factory pattern ref)

## Orphaned Decisions Resolved
  ❌ AD-11: Superseded (migration complete)
  🔴 AD-9: Filed as audit finding (code needs fixing, not decision change)

## Anti-Patterns Updated
  ✅ T-4: Adopted (adapter lifecycle ban)
  💡 "Adapter calling lifecycle service": Added to §5

## Files Modified
  - SYSTEM.md (Decision Structure, init_version)
  - ARCHITECTURE.md (§2, §3, §6)
  - DECISIONS.md (Scope fields, AD-14/16 removed, AD-11 superseded)
  - ANTI-PATTERNS.md (T-4 confirmed)
  - .zoom-in/context/decisions/integrations.md (created — 5 ADRs moved)

## Files Preserved
  - .zoom-in/context/audits/ (untouched)
  - .zoom-in/context/backlog.md (untouched)
```

---

## Edge Cases

| Situation | Response |
|---|---|
| Not a git repository | Skip git diff (Step 2). Rely on field detection + drift check. Note: "Git not available — cannot detect untracked changes." |
| No context files found | Fail: "No SYSTEM.md or ARCHITECTURE.md found. Run `/zoom-in init` first." |
| No `init_version` in SYSTEM.md | Assume version 1. Note: "init_version not found — assuming v1." |
| All context files uncommitted (never committed) | Treat all content as "unchecked" — present the full state for confirmation |
| No drift detected (everything in sync) | Short report: "Context is in sync with codebase. Schema version up to date. No issues found." |
| Switching Modular → Flat | Merge all per-module files into DECISIONS.md, delete module files |
| ADR without Scope + auto-detect fails | Ask user directly: "global or <module>?" (never guess silently) |
| User rejects all untracked changes | Revert context files to last committed state via `git checkout` |
| Backlog has resolved items | Note in report: "X backlog items resolved since last audit" — but do not modify backlog (that's verify/audit's job) |

---

## Integration with Other Commands

| Command | Relationship to re-init |
|---------|------------------------|
| `/zoom-in init` | init creates context from scratch; re-init updates existing context. If no context exists, suggest init. |
| `/zoom-in audit` | audit checks code vs context; re-init checks context vs code+skill. Run re-init first to ensure context is accurate, then audit for authoritative scores. |
| `/zoom-in adopt` | adopt adds decisions with Draft Gate; re-init verifies existing decisions are still valid. Both use Draft Gate for any decision changes. |
| `/zoom-in refactor` | refactor fixes code; re-init fixes context. If refactor changes architecture significantly, run re-init afterwards to sync §2/§6. |
| `/zoom-in verify` | verify checks fixes; re-init checks context freshness. Independent. |
| `/zoom-in plan` | plan uses context to design features; re-init ensures that context is accurate so plan doesn't design against stale rules. |

---

## Failure Modes

| Situation | Response |
|---|---|
| No SYSTEM.md or ARCHITECTURE.md | Fail: "Run `/zoom-in init` first" |
| init-changelog.md missing | Warn: "Cannot determine schema version gaps. Running drift check only." |
| Git not available | Skip untracked-change detection. Note in report. |
| User rejects everything | Revert context files to last committed state. Report: "All untracked changes rejected. Context restored to last commit." |
| Drift check finds >20 issues | Summarize by category: "5 stale patterns, 3 orphaned decisions, 12 new pattern candidates. Review each?" |
| Switching to Modular but all ADRs are global | Proceed — Modular with zero module-specific ADRs is valid. Per-module files created on first module-specific adopt. |

---

## After Re-Init

Once complete, the project's context files are synchronized with:
- The current skill version (schema fields filled, init_version updated)
- The current codebase (patterns, golden references, decisions verified)
- The team's actual decisions (untracked changes confirmed or rejected)

**Recommended next steps**:
- `/zoom-in audit` — now that context is accurate, get authoritative scores
- `/zoom-in adopt` — any new decisions identified during re-init can be formally adopted
- Run re-init again after major skill updates or significant codebase changes
