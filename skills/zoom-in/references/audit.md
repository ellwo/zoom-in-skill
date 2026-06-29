# `/zoom-in audit [scope]` — Full 7-Lens Evaluation

> The core command. Everything else supports or consumes its output.

---

## Purpose

Comprehensive architectural health check across seven lenses, calibrated against the project's own house-style. Produce scored findings that drive prioritized action.

**Why this matters**: Without systematic evaluation, "improvements" are subjective. An audit provides an objective baseline: every finding has a lens, classification, severity, and location. Teams prioritize with evidence, not opinions.

> Audits are automatically persisted to `.zoom-in/context/audits/` so they survive across sessions. This enables delta tracking, `/zoom-in refactor` without re-auditing, and trend analysis over time. See `references/audit-storage.md` for full details.

---

## Chain of Thought

1. **Analyze** — Scan the target scope against all seven lenses and their signals.
2. **Critique** — Classify every signal as [principle], [house-style], or [conflict]. Assign severity.
3. **Propose** — Identify top-priority findings and their remediation paths.
4. **Execute** — Produce the structured audit report.

---

## Prerequisites

1. **SYSTEM.md must exist** — Strategic context (domain, register, critical flows).
2. **ARCHITECTURE.md must exist** — House-style calibration (established patterns, adopted decisions, known exceptions).
3. **DECISIONS.md must exist** — ADR records (enforced decisions). If missing, **warn** but do not fail — decisions may not have been adopted yet.
4. **ANTI-PATTERNS.md must exist** — Project-specific rejection rules. If missing, load `references/anti-patterns.md` as fallback.

If SYSTEM.md or ARCHITECTURE.md is missing, **fail** with a message directing the user to run `/zoom-in init` first. An uncalibrated audit is worse than no audit — it produces findings that fight the project's own conventions.

---

## Scope Selection

When the user runs `/zoom-in audit` without specifying a scope:

1. Ask: "Full project audit? This may take time. Confirm, or specify a scope:
   - Module name (e.g., billing)
   - Lens only (e.g., @security)
   - File path (e.g., src/orders/services.py)"

2. If the user confirms full audit → use sub-agent strategy (see below)
3. If the user specifies a scope → run inline (single agent, faster)

**Why ask first**: A full audit on a large codebase generates hundreds of findings.
Scoped audits are faster and more actionable. The user should choose deliberately.

---

## Scope Options

| Scope | Meaning |
|---|---|
| *(none)* | Entire project (prompts scope selection above) |
| `module_name` | Specific module/app |
| `path/to/file` | Specific file or directory |
| `@lens-name` | Only that lens (e.g., `@security`, `@clarity`) |

Multiple scopes combine: `/zoom-in audit billing @security` audits only Security lens for the billing module.

---

## Step-by-Step Process

### Step 1: Load Calibration Documents

Load in order:
1. SYSTEM.md — domain context, register, critical flows, **decision structure** (Flat/Modular)
2. ARCHITECTURE.md — house-style, established patterns, exceptions
3. DECISIONS.md — ADR records (enforced decisions from Adopted Decisions)
4. **If Decision Structure = Modular AND scope is a module**: Also load `.zoom-in/context/decisions/<scope>.md` for module-specific decisions. Ignore other modules' decision files.
5. ANTI-PATTERNS.md — project-specific rejection rules
6. Register reference(s) — domain-specific rules based on register selection
7. Framework reference — framework-specific signals and conventions
8. All seven lens files — Clarity, Structure, Performance, Security, Resilience, Domain Integrity, Observability

**Why loading order matters**: Later documents override earlier ones. A framework-specific signal that contradicts a universal one respects the framework's convention. An Adopted Decision overrides a general recommendation. A project-specific anti-pattern ban overrides a general allowance.

**Modular decision loading**: When SYSTEM.md specifies `Decision Structure: Modular`,
global decisions (Scope: global) live in DECISIONS.md, and module-specific decisions
(Scope: <module>) live in `.zoom-in/context/decisions/<module>.md`. A scoped audit
(e.g., `audit integrations`) loads only:
- Global decisions from DECISIONS.md
- `integrations` decisions from `.zoom-in/context/decisions/integrations.md`
- **Ignores** decisions for other modules (e.g., `subscription_management.md`)
A full audit loads ALL decision files. In Flat mode, DECISIONS.md contains
everything and no per-module files exist.

### Step 1.5: Change Detection (if previous audit exists)

**Purpose**: Avoid re-scanning files that haven't changed since the last audit.
Focus deep scanning on files that changed (committed or uncommitted) and files
that depend on them. Carry forward findings from unchanged files.

**Why this matters**: A full re-scan of 50+ files when only 3 changed wastes time
and may miss that 47 findings are still identical. Change detection makes the
audit faster and more focused — and catches uncommitted changes that `git log`
alone would miss.

**Prerequisite**: A previous audit must exist in `.zoom-in/context/audits/<scope>/`
with `audit_commit_sha` in its frontmatter. If no previous audit exists, skip this
step and perform a full scan (baseline audit).

#### 1.5a: Detect committed changes

```bash
git diff --name-only <previous_audit_commit_sha>..HEAD -- <scope_path>
```

This lists files changed between the last audit's commit and the current HEAD.

#### 1.5b: Detect uncommitted changes

```bash
git diff --name-only HEAD -- <scope_path>
```

This lists files modified in the working directory that haven't been committed yet.
**Critical**: `git log` alone misses these — a developer who wrote bad code but
hasn't committed would be invisible without this step.

#### 1.5c: Detect untracked files

```bash
git ls-files --others --exclude-standard -- <scope_path>
```

New files not yet tracked by git. These are always "changed" (new code to scan).

#### 1.5d: Build the changed files list

Merge the three lists (committed + uncommitted + untracked) into `changed_files`.

#### 1.5e: Dependency Graph Awareness

Files that didn't change but **depend on** changed files may be affected. Build
a one-level dependency graph:

For each file in `changed_files`:
1. Read its `import` / `require` / `use` statements
2. Find files that **import this file** (reverse dependency search within the scope)
3. Add those reverse-dependency files to `affected_files`

**Example**: If `models.py` changed → `views.py` and `serializers.py` that import
models become `affected_files` even if they didn't change.

**One level only**: Don't recurse transitively. If A→B→C and A changed, B is
affected (one hop), but C is only affected if B also changed. This prevents
over-expansion.

**Framework-agnostic**: Works with Python `import`, JS `import/require`, Java
`import`, Go `import`, Rust `use` — all use the same principle: read the import
statement, search for files that reference the changed file's module path.

#### 1.5f: Determine scan strategy

| File Category | Scan Strategy |
|---|---|
| `changed_files` | **Deep scan** — full 7-lens examination (may have new issues) |
| `affected_files` (dependency-linked) | **Deep scan** — dependencies changed, behavior may differ |
| All other files in scope | **Carry forward** — findings from previous audit still valid; no re-scan needed |

**Edge case — all files changed**: If >80% of files are changed/affected, skip
the optimization and do a full scan. The overhead of tracking which findings to
carry forward exceeds the savings.

**Edge case — no git repository**: If the project is not a git repo, skip Change
Detection entirely and perform a full scan. The feature is an optimization, not
a requirement.

**Edge case — previous audit lacks `audit_commit_sha`**: Fall back to
`git log --since=<previous_audit_date> --name-only -- <scope_path>` as a
best-effort detection. Note in the report that Change Detection used date-based
fallback (less precise than SHA-based).

#### 1.5g: Record in audit report

Include a Change Detection section in the audit report:

```
## Change Detection

Previous audit commit: <sha>
Current commit: <sha>

Committed changes: N files
Uncommitted changes: M files
Untracked files: K files
Dependency-affected: J files
Total deep-scanned: N+M+K+J files
Carried forward from previous audit: X files (unchanged)
```

**Why record this**: Transparency. The user can see which files were deep-scanned
vs. carried forward. If they suspect a carried-forward finding is stale, they know
to request a full re-scan.

### Step 2: Scan the Target Scope

For each lens, apply signal categories:

**Universal signals** — Every project:
- Naming clarity, consistent patterns, obvious intent
- Proper layering, dependency direction, module boundaries
- No unnecessary work, efficient data access, appropriate caching
- Input validation, output filtering, auth coverage
- Error handling, retry logic, graceful degradation
- Business rule enforcement, invariant protection, domain boundary

**Framework-specific signals** — Based on detected framework:
- ORM usage patterns, middleware configuration, task queue practices
- Convention-over-configuration adherence
- Framework-recommended patterns (DI, service layers, etc.)

**House-style calibration** — From ARCHITECTURE.md:
- Established patterns §2 (must be followed — deviations are findings)
- Adopted Decisions §3 (enforced rules — violations are [principle])
- Known Exceptions §4 (must NOT be flagged — explicitly allowed)

**Additional decision signals** — From DECISIONS.md:
- Adopted Decisions — each Active AD is a [principle] rule if violated
- ANTI-PATTERNS.md — any code matching a ban in any section is [principle] 🔴 or 🟠

### Step 3: Classify and Score

**Classification** (determines enforcement):
| Classification | Meaning | Severity Floor |
|---|---|---|
| `[principle]` | Violates universal or register rule — non-negotiable | ⚠️ Medium |
| `[house-style]` | Violates established project convention — should follow | 💡 Low |
| `[conflict]` | Two conflicting conventions — needs resolution | ⚠️ Medium |

**Severity** (determines priority):
| Severity | Criteria |
|---|---|
| 🔴 Critical | Data loss, security breach, production outage risk |
| 🟠 High | Architectural decay, significant tech debt, testability failure |
| ⚠️ Medium | Inconsistency, maintainability reduction, minor convention violation |
| 💡 Low | Style preference, minor improvement, emerging pattern opportunity |

**Lens scoring** (1-10 each): Start at 10; subtract 🔴=-3, 🟠=-2, ⚠️=-1, 💡=-0.5; floor of 1.

**Why this model**: A few critical issues are worse than many low-severity ones. Total score (max 70) gives teams a single metric to track over time.

### Step 4: Filter and Validate

**What NOT to flag**:
- Known Exceptions from §4 — explicitly allowed
- Superseded decisions from DECISIONS.md (Status: Superseded)
- Draft decisions from DECISIONS.md (Status: Draft — not yet enforced)
- House-style preferences where no established convention exists — don't invent rules
- Framework conventions deliberately overridden (check Adopted Decisions)
- Generated code, migration files, third-party packages

**Validation**: For each 🔴 Critical finding, verify by reading actual code. A function named `delete_all` in a test helper is not the same as one in production.

### Step 5: Triage & Recommended Actions

After producing findings and scores, **do not simply dump the report and stop**. An audit
without prescription is diagnosis without treatment. Present the user with a clear,
actionable path forward based on what was actually found.

**Why this matters**: Users facing 30+ findings across 7 lenses don't know whether to
refactor, harden, adopt, or focus. The triage step converts raw findings into a
prioritized command sequence tailored to the actual audit results.

#### 5a: Lens Triage Rules

Apply these rules **in order** — the first matching rule determines the primary action:

| Condition | Primary Action | Rationale |
|-----------|---------------|-----------|
| Security ≤ 3 | `/zoom-in harden` first | Active security risk; production data at stake |
| Domain Integrity ≤ 3 | `/zoom-in focus domain-integrity` first | Business invariants violated; financial/correctness risk |
| Any `[conflict]` finding exists | `/zoom-in adopt` first | Conflicting conventions make all other fixes ambiguous |
| Any lens ≤ 5 with 🔴 findings | `/zoom-in focus [lens]` then `/zoom-in refactor` | Deep-dive before fixing ensures the fix is right |
| All lenses ≥ 6, only 🟠/⚠️/💡 | `/zoom-in refactor` directly | Straightforward fixes, no deep-dive needed |
| All lenses ≥ 8 | `/zoom-in verify` (light touch) | Project is healthy; confirm, don't overhaul |

Multiple conditions can match simultaneously. When they do, present all applicable
actions in the order above (security first, then domain integrity, then conflicts,
then focus, then refactor).

#### 5b: Build the Recommended Actions List

For each applicable action, write one line referencing **specific findings**:

```
## Recommended Actions

1. `/zoom-in harden` — [SE-1] SQL injection at orders/views.py:112, [SE-3] missing auth guard
   on 2 endpoints. Security scored 3/10 — active risk.
2. `/zoom-in adopt` — [CL-5] and [ST-3] are [conflict] findings. Resolve conventions before
   refactoring to avoid fixing in the wrong direction.
3. `/zoom-in focus performance` — Performance scored 4/10 with 2 🔴 findings. Deep-dive
   before refactor to ensure fixes target root causes.
4. `/zoom-in refactor` — Apply remaining 🔴/🟠 fixes from Clarity and Structure lenses
   (7 findings).
5. `/zoom-in verify` — After fixes, verify no new violations introduced.
6. `/zoom-in audit` — Full re-audit to confirm score improvement.
```

**Rules for recommendations**:
- Every recommendation must reference specific finding IDs from this audit
- Order follows the triage rules above (security → domain integrity → conflicts → focus → refactor)
- Always end with `/zoom-in verify` then `/zoom-in audit` if any fixes are recommended
- Skip actions that would address zero findings (don't pad the list)
- If the user ran a scoped audit, scope the recommendations accordingly

#### 5c: Ask the User

After presenting the Recommended Actions, ask **2-3 targeted questions** about priorities
and scope. Not generic questions — questions tied to the actual findings.

**Question templates** (adapt to findings; do not ask all of them):

1. **Priority direction**: "Security scored [X]/10 with [N] critical findings. Harden
   first, or address alongside refactor?" Options: "Harden first", "Fix alongside
   refactor", "Defer security to next cycle".

2. **Conflict resolution**: "Found [N] [conflict] findings — these mean two different
   conventions coexist. Adopt a decision to settle them before fixing, or defer?"
   Options: "Adopt first", "Defer conflicts", "Let me review the conflicts first".

3. **Scope**: "This audit has [N] findings. Address all of them, or focus on the top
   [M] critical/high ones?" Options: "Critical + High only", "All findings",
   "Top 5 only".

4. **Off-limits** (only if relevant): "Should any modules or areas stay untouched in
   this fix cycle?"

**Rules**:
- Every question must reference specific findings or scores from this audit
- Keep to 2-3 questions maximum
- Offer concrete options, not open-ended prompts
- If findings are straightforward (1-2 clear issues), skip questions and go directly
  to Recommended Actions
- If the user's answers change the priority order, reorder the Recommended Actions
  to match

### Step 5.5: Backlog Review

After producing findings and triage, check the Technical Debt Backlog for items
in this scope. See `references/backlog.md` for full details.

**Load**: `.zoom-in/context/backlog.md` (if it exists)

For each backlog item within the audit scope:
1. **Is it still present?** Check if the finding still appears in this audit's results.
   - **Yes** → Mark as "Still open" in the audit report. The debt persists.
   - **No** → Mark as "✅ Resolved" in the audit report. Celebrate progress.
2. **Has severity changed?** If a backlog item's severity increased (e.g., 🟠→🔴),
   flag it — the debt is getting worse, not better.
3. **New deferrals**: If the user chose to defer findings during this audit's
   triage (Step 5c), note them as candidates for the backlog (written by
   `/zoom-in refactor`, not by audit — see `references/backlog.md`).

Add to the audit report:

```
## Backlog Status

Open: X items still present
Resolved since last audit: Y items ✅
Worsened: Z items (severity increased)
New deferred this cycle: W items (pending refactor to add to backlog)
```

**If no backlog file exists**: Skip this step silently. First audit or no
deferrals have happened yet.

### Step 6: Produce the Audit Report

```
# Zoom-in Audit: [scope]

## Scores (max 70)
| Lens | Score | Previous | Delta | Findings |
|------|-------|----------|-------|----------|
| Clarity | X/10 | Y/10 | +N | N 🔴, M 🟠, K ⚠️, J 💡 |
| Structure | X/10 | Y/10 | +N | ... |
| Performance | X/10 | Y/10 | +N | ... |
| Security | X/10 | Y/10 | +N | ... |
| Resilience | X/10 | Y/10 | +N | ... |
| Domain Integrity | X/10 | Y/10 | +N | ... |
| Observability | X/10 | Y/10 | +N | ... |
| **Total** | **X/70** | **Y/70** | **+N** | |

*(If no previous audit, Previous and Delta columns show "—")*

## Findings by Severity

### 🔴 Critical
- [CL-1] [principle] Silent None return hides errors → `path/to/file:42` → Return typed result or raise

### 🟠 High
- [ST-1] [principle] Service imports from view → `path/to/file:7` → Reverse dependency direction

### ⚠️ Medium
- [PF-1] [house-style] N+1 query in list endpoint → `path/to/file:89` → Use eager loading

### 💡 Low
- [CL-2] [house-style] Inconsistent error key naming → `path/to/file:15` → Follow golden reference

## Resolved from Previous Audit
- [PF-2] Missing connection pooling → `path/to/file:30` → ✅ Fixed

## New Findings
- [SE-3] [principle] New endpoint lacks auth guard → `path/to/file:55` → Add permission check

## Change Detection
Previous audit commit: <sha>
Current commit: <sha>
Committed changes: N files | Uncommitted: M files | Untracked: K files
Dependency-affected: J files | Total deep-scanned: N+M+K+J | Carried forward: X files

## Backlog Status
Open: X items still present | Resolved since last audit: Y items ✅
Worsened: Z items | New deferred this cycle: W items

## Priority Actions (top 5)
1. [CL-1] Fix silent error handling — data loss risk
2. [SE-1] Add input validation — injection risk
3. [ST-1] Reverse service→view dependency — architectural decay
4. [RS-1] Add retry logic to external call — outage risk
5. [DI-1] Enforce tenant isolation — data breach risk

## Recommended Actions
1. `/zoom-in harden` — [SE-1], [SE-3]: security scored 3/10, active risk
2. `/zoom-in adopt` — [CL-5], [ST-3]: [conflict] findings need resolution
3. `/zoom-in refactor` — Apply remaining 🔴/🟠 fixes (7 findings)
4. `/zoom-in verify` — After fixes, confirm no new violations
5. `/zoom-in audit` — Re-audit to validate score improvement
```

### Step 7: Compare with Previous Audit (Delta)

If a previous audit exists for this scope in `.zoom-in/context/audits/<scope>/`:

1. Read the most recent previous audit file
2. Compare lens scores: current vs previous
3. Match findings by (location + classification) to identify:
   - Resolved findings (in previous, not in current)
   - New findings (in current, not in previous)
   - Persistent findings (in both)
4. Add Score Progression table to the report (with Delta column)
5. Add "Resolved from Previous Audit" section
6. Add "New Findings" section

If no previous audit exists, skip delta comparison. First audit = baseline with no deltas.

### Step 8: Persist the Audit

1. Create directories if they don't exist:
   - `.zoom-in/context/audits/`
   - `.zoom-in/context/audits/<scope>/` (scope name: "full" for full project, module name, @lens, or path-with-dashes)
2. Write the audit file:
   - Filename: `YYYY-MM-DD--score-XX.md` (use current date and total score)
    - Include YAML frontmatter: scope, date, score, critical/high/medium/low counts, previous_score, delta, framework, registers, **audit_commit_sha** (current `git rev-parse HEAD`, or "non-git" if not a git repo), **previous_audit_commit_sha** (from previous audit's frontmatter, or omitted if first audit)
    - Include full audit report with Score Progression table (with Delta), findings, resolved items, new findings, Change Detection section, Backlog Status section
3. Update `index.md`:
   - Add new row to the scope's table
   - Include Delta column (— for first audit)
   - Sort by date descending
4. Run auto-cleanup:
   - List files in the scope directory
   - If more than 2 files: delete oldest files (keep 2 most recent)
   - Update index.md to remove deleted entries
   - Default depth: 2 (configurable via `audit_history_depth` in SYSTEM.md)

### Step 9: Report Persistence Info

After persisting, inform the user:
```
Audit persisted: .zoom-in/context/audits/<scope>/YYYY-MM-DD--score-XX.md
Previous score: X/70 → Current: Y/70 (Delta: +N)

Next steps:
- Run /zoom-in refactor to apply fixes from this audit
- Run /zoom-in harden for deep security review
- Run /zoom-in focus [lens] for targeted deep-dive on weak lenses
- Run /zoom-in verify after fixes to confirm no regressions
```

---

## Sub-Agent Strategy (Full Audit Only)

When running a full project audit, divide the work across 7 parallel sub-agents —
one per lens. This dramatically improves performance and depth.

### How to dispatch

For each lens, spawn a sub-agent with:
- **Context files**: SYSTEM.md + ARCHITECTURE.md + DECISIONS.md + ANTI-PATTERNS.md
- **Lens file**: references/lens-<name>.md (only that one lens)
- **Framework file**: references/frameworks/<detected>.md
- **Register file(s)**: references/registers/<selected>.md
- **Scope**: full project
- **Task**: "Audit this project through the [Lens Name] lens. Return: score (1-10),
  all findings with [classification], severity, location, and fix suggestion."

### What each sub-agent returns

```
## [Lens Name] Lens — X/10

### Findings
- 🔴 [principle] path:line — description → Fix: suggestion
- 🟠 [principle] path:line — description → Fix: suggestion
- ⚠️ [house-style] path:line — description → Fix: suggestion
- 💡 [conflict] path:line — description → Resolve via /zoom-in adopt
```

### Merging results

The main agent collects all 7 sub-agent reports and:
1. Calculates total score (sum of all lens scores, max 70)
2. Merges findings into a single severity-ordered list
3. Identifies cross-lens patterns (e.g., a Security finding caused by a Structure issue)
4. Produces the top 5 Priority Actions
5. Generates the unified audit report
6. **Performs delta comparison** with previous audit (if any) — at the main-agent level after merging, not in sub-agents
7. **Persists the audit** per Steps 6-8

Sub-agents don't need to know about previous audits. Delta comparison happens at the main agent level after all lens results are merged.

### Scoped audits (inline)

When the user specifies a scope (module, @lens, file path), run inline without
sub-agents. Load only the relevant lens file(s) and scan the specified scope.
This is faster for targeted checks.

---

## Integration with Other Commands

- `/zoom-in refactor` consumes findings and fixes them in priority order
- `/zoom-in harden` provides depth for Security findings; always recommended when Security ≤ 3
- `/zoom-in focus [lens]` provides depth for any weak lens (score ≤ 5)
- `/zoom-in adopt` resolves [conflict] findings — run before refactor when conflicts exist
- `/zoom-in verify` confirms fixes after refactor without a full re-audit
- `/zoom-in plan` uses scores to know which lenses need attention
- Re-running `/zoom-in audit` after any fix cycle validates improvement

---

## Failure Modes

| Situation | Response |
|---|---|
| No SYSTEM.md / ARCHITECTURE.md | Fail: "Run `/zoom-in init` first" |
| No DECISIONS.md | Warn: "No DECISIONS.md found — decision signals disabled" |
| No ANTI-PATTERNS.md | Fallback: load `references/anti-patterns.md` as generic rules |
| Scope doesn't exist | Fail: "Not found"; suggest alternatives |
| Score <20/70 | Add "Structural Intervention Needed" — incremental fixes may not suffice |
| Too many findings | Show all 🔴 🟠; summarize ⚠️ 💡 by count |
| Cannot write to .zoom-in/ | Warn: "Could not persist audit. Results are in this conversation only." |
| Previous audit file corrupted | Skip delta comparison; treat as first audit |
