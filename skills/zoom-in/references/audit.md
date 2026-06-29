# `/zoom-in audit [scope]` — Core 7-Lens Evaluation

**Purpose**: Objective, scored architectural health check across 7 lenses, calibrated against the project's own house-style. Persisted to `.zoom-in/context/audits/`.

## 1. Prerequisites & Context Loading (Strict Order)

**Fail** if `SYSTEM.md` or `ARCHITECTURE.md` missing → prompt `/zoom-in init`. **Warn** if `DECISIONS.md` missing (decision signals disabled). **Fallback** to `references/anti-patterns.md` if `ANTI-PATTERNS.md` missing.

**Load order** (later overrides earlier):
1. `SYSTEM.md` — domain, register, Flat/Modular structure
2. `ARCHITECTURE.md` — house-style, exceptions
3. `DECISIONS.md` — global ADRs
4. `.zoom-in/context/decisions/<scope>.md` — only if Modular AND scope is a module (ignore other modules' files; full audit loads ALL decision files)
5. `ANTI-PATTERNS.md` — rejection rules
6. Register + Framework references
7. Lens files — all 7 for full audit, specific lens for `@lens` scope

## 2. Scope Selection

If no scope specified, ask: "Full project audit? This may take time. Confirm, or specify: module name, `@lens`, or file path." Full → sub-agent strategy (§8). Scoped → inline single agent.

Scopes combine: `/zoom-in audit billing @security` audits only Security lens for the billing module.

## 3. Change Detection (Skip if no previous audit, not a git repo, or >80% of scope files changed)

**Prerequisite**: previous audit with `audit_commit_sha` in frontmatter. If previous audit lacks SHA → fall back to `git log --since=<previous_audit_date> --name-only -- <scope_path>` (less precise; note "date-based fallback" in report).

**Detect changes** (run exactly):
```bash
git diff --name-only <previous_audit_commit_sha>..HEAD -- <scope_path>   # committed
git diff --name-only HEAD -- <scope_path>                                # uncommitted (git log alone misses these)
git ls-files --others --exclude-standard -- <scope_path>                 # untracked
```
Merge all three into `changed_files`.

**Build `affected_files`**: read imports of each `changed_files` entry; add files that import it (1-level reverse deps, within scope, no transitive recursion). Framework-agnostic — works with Python `import`, JS `import/require`, Java/Go/Rust imports.

**Strategy**: deep-scan `changed_files` + `affected_files`; carry forward findings for all other unchanged files.

## 4. Scan — What to Check Against

- **Universal signals**: naming clarity, layering/dependency direction, no unnecessary work, input validation, error handling, business rule enforcement
- **Framework signals**: ORM/middleware/task-queue patterns, convention-over-config, DI/service-layer conventions
- **House-style** (from ARCHITECTURE.md): §2 Established patterns — deviations are findings; §3 Adopted Decisions — violations are `[principle]`; §4 Known Exceptions — must NOT be flagged
- **DECISIONS.md**: each Active AD is a `[principle]` rule if violated; Superseded/Draft ADs are NOT enforced
- **ANTI-PATTERNS.md**: any code matching a ban in any section is `[principle]` 🔴 or 🟠

## 5. Filter & Validate

**Do NOT flag**: Known Exceptions (§4), Superseded/Draft ADRs, generated code/migrations/third-party packages, house-style preferences with no established convention (don't invent rules), framework conventions deliberately overridden (check Adopted Decisions).

**Validate**: every 🔴 Critical finding must be verified by reading actual code context (a `delete_all` in a test helper ≠ one in production).

## 6. Classify, Severity & Score

**Classification** (determines enforcement):
| Class | Meaning | Severity floor |
|---|---|---|
| `[principle]` | Violates universal/register/Active-AD rule — non-negotiable | ⚠️ Medium |
| `[house-style]` | Violates project convention — should follow | 💡 Low |
| `[conflict]` | Two conventions clash — needs resolution | ⚠️ Medium |

**Severity** (determines priority):
| Severity | Criteria | Penalty |
|---|---|---|
| 🔴 Critical | Data loss, security breach, production outage risk | −3 |
| 🟠 High | Architectural decay, significant tech debt, testability failure | −2 |
| ⚠️ Medium | Inconsistency, maintainability reduction, minor violation | −1 |
| 💡 Low | Style preference, minor improvement, emerging pattern | −0.5 |

**Lens score**: 10 − sum(penalties), floor 1. **Total**: sum of 7 lens scores, max 70. A few 🔴 are worse than many 💡 — the model rewards absence of critical issues.

## 7. Triage & Recommended Actions (First match wins)

1. Security ≤ 3 → `/zoom-in harden` first (active risk)
2. Domain Integrity ≤ 3 → `/zoom-in focus domain-integrity` first (business invariant risk)
3. Any `[conflict]` → `/zoom-in adopt` first (resolve clashing conventions before fixing)
4. Any lens ≤ 5 with 🔴 → `/zoom-in focus [lens]` then `/zoom-in refactor`
5. All lenses ≥ 6 (only 🟠/⚠️/💡) → `/zoom-in refactor` directly
6. All lenses ≥ 8 → `/zoom-in verify` (confirm health, light touch)

Multiple conditions can match → present all applicable, in the order above.

**Build Recommended Actions**: every line references specific finding IDs; order follows triage above; end with `/zoom-in verify` then `/zoom-in audit` if any fixes recommended; skip actions addressing zero findings; scope recommendations to the audit's scope.

**Ask the user** 2-3 targeted questions (skip if only 1-2 straightforward findings):
- *Priority*: "Security scored [X]/10 with [N] critical. Harden first, or alongside refactor?" — Harden first / Fix alongside / Defer
- *Conflicts*: "[N] `[conflict]` findings — adopt to settle before fixing, or defer?" — Adopt first / Defer / Let me review
- *Scope*: "Address all [N] findings, or top [M] critical/high?" — Critical+High only / All / Top 5
- *Off-limits* (only if relevant): "Any modules/areas to stay untouched this cycle?"

Reorder Recommended Actions if answers change priority.

## 8. Sub-Agent Strategy (Full Audit Only)

Dispatch 7 parallel sub-agents, one per lens.
- **Payload each**: `SYSTEM.md` + `ARCHITECTURE.md` + `DECISIONS.md` + `ANTI-PATTERNS.md` + that lens's file + framework/register files
- **Task**: "Audit through [Lens Name]. Return: score (1-10), findings with [classification], severity, location, fix suggestion."
- **Each returns**: `## [Lens] — X/10` + findings list (`🔴 [principle] path:line — desc → Fix: suggestion`; 💡 [conflict] → "Resolve via /zoom-in adopt")
- **Main agent merges**: sum scores (max 70), merge findings into severity-ordered list, identify cross-lens patterns (e.g. a Security finding caused by a Structure issue), produce top 5 Priority Actions, generate unified report, **perform delta comparison at main level** (sub-agents don't see previous audits), persist.

**Scoped audit**: inline, single agent, load only relevant lens file(s) and the specified scope. Faster for targeted checks.

## 9. Backlog Review

Load `.zoom-in/context/backlog.md` (if exists). For each item in scope:
- Still present in this audit? → "Still open"
- Gone? → "✅ Resolved"
- Severity increased? → flag "Worsened"
- User deferred findings this cycle (§7 questions)? → note as "New deferred" (written to backlog by `/zoom-in refactor`, not by audit)

## 10. Delta Comparison (If previous audit exists for this scope)

1. Read most recent previous audit file
2. Compare lens scores (current vs previous)
3. **Match findings by (location + classification)** → Resolved (in previous only), New (in current only), Persistent (in both)
4. Add Delta column to Scores table; add "Resolved from Previous Audit" + "New Findings" sections

If no previous audit → first audit = baseline, no deltas.

## 11. Report Format

```
# Zoom-in Audit: [scope]

## Scores (max 70)
| Lens | Score | Previous | Delta | Findings |
| Clarity | X/10 | Y/10 | +N | a 🔴, b 🟠, c ⚠️, d 💡 |
| Structure | X/10 | — | — | ... |
... (all 7 rows) ...
| **Total** | **X/70** | **Y/70** | **+N** | |

## Findings by Severity
### 🔴 Critical
- [CL-1] [principle] Silent None return hides errors → path:42 → Return typed result or raise
### 🟠 High
- [ST-1] [principle] Service imports from view → path:7 → Reverse dependency direction
### ⚠️ Medium / 💡 Low (same one-line format)

## Resolved from Previous Audit
- [PF-2] Missing connection pooling → path:30 → ✅ Fixed

## New Findings
- [SE-3] [principle] New endpoint lacks auth guard → path:55 → Add permission check

## Change Detection
Previous commit: <sha> | Current: <sha>
Committed: N | Uncommitted: M | Untracked: K | Dependency-affected: J
Deep-scanned: N+M+K+J | Carried forward: X

## Backlog Status
Open: X | Resolved: Y ✅ | Worsened: Z | New deferred: W

## Priority Actions (Top 5)
1. [CL-1] Fix silent error handling — data loss risk
2. [SE-1] Add input validation — injection risk
...

## Recommended Actions
1. `/zoom-in harden` — [SE-1], [SE-3]: security 3/10, active risk
2. `/zoom-in adopt` — [CL-5], [ST-3]: [conflict] findings need resolution
3. `/zoom-in refactor` — remaining 🔴/🟠 fixes (7 findings)
4. `/zoom-in verify` — confirm no new violations
5. `/zoom-in audit` — validate score improvement
```

## 12. Persistence (CRITICAL — do not omit frontmatter fields)

Write to `.zoom-in/context/audits/<scope>/YYYY-MM-DD--score-XX.md` (scope name: "full" / module name / @lens / path-with-dashes). Include the full audit report from §11.

**YAML frontmatter MUST include all fields** (the SHA fields are what make next run's Change Detection work):
```yaml
---
scope: <scope>
date: YYYY-MM-DD
score: XX/70
critical: N
high: N
medium: N
low: N
previous_score: YY/70
delta: +N
framework: <detected>
registers: <selected>
audit_commit_sha: <current `git rev-parse HEAD`, or "non-git">
previous_audit_commit_sha: <from previous audit's frontmatter, or omit if first audit>
---
```

Update `index.md`: add row to the scope's table with Delta column (— for first audit), sort by date descending.

Auto-cleanup: keep `audit_history_depth` most recent audits per scope (default 2, configurable in SYSTEM.md); delete oldest; update index.md to remove deleted entries.

Print: "Audit persisted: <path>. Previous: X/70 → Current: Y/70 (Delta: +N). Next: /zoom-in refactor | /zoom-in harden | /zoom-in focus [lens] | /zoom-in verify."

## 13. Failure Modes

| Situation | Response |
|---|---|
| No SYSTEM.md / ARCHITECTURE.md | Fail: "Run `/zoom-in init` first" |
| No DECISIONS.md | Warn: "No DECISIONS.md found — decision signals disabled" |
| No ANTI-PATTERNS.md | Fallback: load `references/anti-patterns.md` as generic rules |
| Scope doesn't exist | Fail: "Not found"; suggest alternatives |
| Score <20/70 | Flag "Structural Intervention Needed" — incremental fixes may not suffice |
| Too many findings | Show all 🔴 🟠; summarize ⚠️ 💡 by count only |
| Cannot write to .zoom-in/ | Warn: "Could not persist audit. Results are in this conversation only." |
| Previous audit file corrupted | Skip delta comparison; treat as first audit |
