# `/zoom-in verify [scope]` — Post-Fix Verification Pass

Lightweight verification that recent fixes (from `/zoom-in refactor`, `/zoom-in harden`, or manual changes) achieved their goal without introducing new violations. Unlike a full audit, verify is **targeted and fast** — checks only the areas that changed.

## When to Use

| Situation | Command |
|-----------|---------|
| Full health check across all lenses | `/zoom-in audit` |
| Deep-dive on one weak lens | `/zoom-in focus [lens]` |
| Fix findings from an audit | `/zoom-in refactor` |
| **Confirm fixes are valid and no new violations** | **`/zoom-in verify`** |
| Confirm project is healthy before a release | `/zoom-in audit` (full) |

## Prerequisites

A previous fix activity must be available — either: (1) a persisted refactor result, (2) a persisted audit with findings in `.zoom-in/context/audits/<scope>/`, or (3) fixes mentioned in current conversation (less reliable). If none → fail: "No previous audit or refactor found. Run `/zoom-in audit [scope]` first."

## Scope

| Scope | Meaning |
|-------|---------|
| *(none)* | Verify all fixes from the most recent audit/refactor |
| `module_name` | Verify fixes in a specific module |
| `path/to/file` | Verify fixes in a specific file |

Scope narrows which fixes to verify — doesn't re-audit the whole project.

## 1. Load Fix Context

1. Locate the most recent audit for the scope (from `.zoom-in/context/audits/`)
2. If a refactor ran after the audit, load its results (from conversation or persisted notes)
3. Extract findings marked "Fixed" or "Skipped"
4. Load ARCHITECTURE.md to check Known Exceptions added during refactor

(The audit has original findings; the refactor has fix claims. Verify checks claims match reality.)

## 2. Verify Each Fixed Finding

For every finding marked "Fixed", run 5 checks:
1. Read the code at the original location — does the finding still exist?
2. Check the fix matches the suggestion — was the right approach used?
3. Check house-style conformance — does the fix follow the golden reference?
4. Check ANTI-PATTERNS.md compliance — does the fix use a banned pattern?
5. Check DECISIONS.md compliance — does the fix contradict an Active decision?

**Result per finding**:
- ✅ **Confirmed** — resolved; fix follows conventions
- ⚠️ **Partial** — partially resolved (e.g. fixed in one location but a similar pattern exists nearby)
- 🔴 **Regressed** — fix introduced a new problem (different finding at same location)
- ❌ **Not Fixed** — original finding still exists (fix didn't work or wasn't applied)

## 3. Scan for New Violations (change zones only, not the whole project)

For each area where code changed, quick scan against all 7 lenses (not full audit depth — check for obvious new violations):
- **Clarity**: inconsistent naming, missing types, duplication?
- **Structure**: wrong-direction dependency, layer violation?
- **Performance**: N+1 query, unnecessary DB hit?
- **Security**: data exposure, removed auth, injection risk?
- **Resilience**: removed error handling, skipped tests, fragility?
- **Domain Integrity**: bypassed state machine, broken tenant isolation, violated invariant?
- **Observability**: removed logging, broken health checks/metrics/tracing?

A fix that resolves one finding but introduces another is net zero/negative — verify catches this before the user assumes the problem is solved.

## 4. Backlog Side-Effect Check

Load `.zoom-in/context/backlog.md` (if exists). For each Open backlog item in verify scope:
1. **Was its location touched by the recent refactor?** (any changed file overlaps the backlog item's finding location)
2. **If yes — does the finding still exist?** Read the code:
   - **Gone** → refactor fixed this debt as a side effect. Update `backlog.md`: Status → "Resolved", note "Resolved as side effect of [finding-id] fix on [date]". Report "✅ Backlog item [PF-07] resolved as side effect of [CL-04] fix."
   - **Still exists** → no change to backlog. Note "[PF-07] still open despite nearby changes."
3. **If no overlap** → skip (refactor didn't touch this area)

See `references/backlog.md`.

## 5. Estimate Score Improvement

Estimate impact on each lens score (this is an **estimate, not a formal score** — only a full audit produces authoritative scores; the estimate shows trajectory):
```
## Score Estimate
| Lens | Audit Score | Estimated After Fixes | Change |
| Clarity | 6/10 | 8/10 | +2 |
| ... | ... | ... | ... |
| **Total** | **37/70** | **45/70** | **+8** |
```

## 6. Produce the Verification Report

```
# Zoom-in Verify: [scope]

## Fix Verification
| Finding ID | Severity | Status | Notes |
| CL-1 | 🔴 Critical | ✅ Confirmed | Silent None replaced with typed Result |
| DI-1 | 🔴 Critical | 🔴 Regressed | Tenant filter added but broke batch export |

## New Violations Detected
- 🔴 [NEW-1] [principle] Batch export bypasses tenant filter → path:line
  Introduced by: DI-1 fix → Fix: Add tenant-aware export method

## Skipped Findings
- SE-1: Partially fixed — remaining endpoint needs auth guard
- RS-1: Not fixed — retry logic deferred

## Backlog Side-Effects
- ✅ [PF-07] Resolved as side effect of [CL-04] fix
- [RE-03] Still open — adapter tests not touched

## Score Estimate
(table from §5)

## Recommended Next Steps
1. `/zoom-in refactor` — Fix [NEW-1] regression and complete SE-1
2. `/zoom-in audit` — Full re-audit for authoritative scores
3. Security still 3/10 — `/zoom-in harden` recommended before next release
```

## 7. Recommend Next Step

| Condition | Recommendation |
|-----------|---------------|
| All ✅ Confirmed, no new violations | `/zoom-in audit` — confirm with authoritative scores |
| Any 🔴 Regressed | `/zoom-in refactor` — fix the regression immediately |
| Any ⚠️ Partial | `/zoom-in refactor` — complete the partial fix |
| New violations detected | `/zoom-in refactor` — address new violations |
| Security still ≤ 3 | `/zoom-in harden` — security still critical |
| All ✅ but score estimate < 40/70 | `/zoom-in focus [weakest-lens]` — systemic issues may remain |

## Failure Modes

| Situation | Response |
|---|---|
| No previous audit or refactor found | Fail: "Run `/zoom-in audit [scope]` first" |
| All findings already ✅ Confirmed | Report: "All previous fixes verified. Run `/zoom-in audit` for full evaluation." |
| Refactor was very recent (same session) | Verify inline — no need to reload audit from disk |
| Cannot locate fix changes (no git diff, no refactor record) | Verify against audit findings directly — check if each still exists in code |
| Too many regressed findings (≥ 3) | Warn: "Multiple regressions detected. Consider `/zoom-in audit` for full reassessment." |
