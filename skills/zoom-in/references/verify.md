# `/zoom-in verify [scope]` — Post-Fix Verification Pass

> Fixing without verifying is hoping. Verify confirms the fix worked and broke nothing else.

---

## Purpose

Lightweight verification that recent fixes (from `/zoom-in refactor`, `/zoom-in harden`,
or manual changes) achieved their goal without introducing new violations. Unlike a full
`/zoom-in audit`, verify is **targeted and fast** — it checks only the areas that changed.

**Why this matters**: Refactoring can introduce new violations. A fix for a Clarity finding
might break a Domain Integrity invariant. A Security harden might add a performance
regression. Without verification, the fix cycle is open — you don't know if you're
better off or worse.

**When to use** (vs. alternatives):

| Situation | Command |
|-----------|---------|
| Full health check across all lenses | `/zoom-in audit` |
| Deep-dive on one weak lens | `/zoom-in focus [lens]` |
| Fix findings from an audit | `/zoom-in refactor` |
| **Confirm fixes are valid and no new violations** | **`/zoom-in verify`** |
| Confirm project is healthy before a release | `/zoom-in audit` (full) |

---

## Chain of Thought

1. **Locate** — Find the most recent refactor/fix results and the audit that drove them.
2. **Verify** — For each claimed fix, confirm the finding is actually resolved.
3. **Scan** — Check the surrounding code for new violations introduced by the fixes.
4. **Estimate** — Quick lens-by-lens score estimate to show improvement trajectory.
5. **Recommend** — Whether a full re-audit is warranted or the project is stable.

---

## Prerequisites

A previous fix activity must be available — either:

1. **A persisted refactor result** — the summary from `/zoom-in refactor`
2. **A persisted audit with findings** — `.zoom-in/context/audits/<scope>/`
3. **Fixes mentioned in current conversation** — less reliable, but works

If none exists, fail with: "No previous audit or refactor found. Run `/zoom-in audit
[scope]` first."

---

## Scope

| Scope | Meaning |
|-------|---------|
| *(none)* | Verify all fixes from the most recent audit/refactor |
| `module_name` | Verify fixes in a specific module |
| `path/to/file` | Verify fixes in a specific file |

Scope narrows which fixes to verify — it doesn't re-audit the whole project.

---

## Step-by-Step Process

### Step 1: Load Fix Context

1. Locate the most recent audit for the scope (from `.zoom-in/context/audits/`)
2. If a refactor was run after the audit, load its results (from conversation or
   any persisted notes)
3. Extract the list of findings that were marked as "Fixed" or "Skipped"
4. Load ARCHITECTURE.md to check Known Exceptions added during refactor

**Why load both audit and refactor**: The audit has the original findings; the refactor
has the fix claims. Verify checks that the claims match reality.

### Step 2: Verify Each Fixed Finding

For every finding marked as "Fixed":

1. **Read the code at the original location** — does the finding still exist?
2. **Check the fix matches the suggestion** — was the right approach used?
3. **Check house-style conformance** — does the fix follow the golden reference?
4. **Check ANTI-PATTERNS.md compliance** — does the fix use a banned pattern?
5. **Check DECISIONS.md compliance** — does the fix contradict an Active decision?

**Result per finding**:
- ✅ **Confirmed** — finding is resolved; fix follows conventions
- ⚠️ **Partial** — finding is partially resolved (e.g., fixed in one location but a
  similar pattern exists nearby that wasn't addressed)
- 🔴 **Regressed** — fix introduced a new problem (different finding at same location)
- ❌ **Not Fixed** — original finding still exists (fix didn't work or wasn't applied)

### Step 3: Scan for New Violations

For each area where code was changed:

1. **Quick scan against all 7 lenses** — not the full audit depth, but a check for
   obvious new violations:
   - **Clarity**: Did the fix add inconsistent naming, missing types, or duplication?
   - **Structure**: Did the fix add a wrong-direction dependency or layer violation?
   - **Performance**: Did the fix add an N+1 query or unnecessary database hit?
   - **Security**: Did the fix expose data, remove auth, or add injection risk?
   - **Resilience**: Did the fix remove error handling, skip tests, or add fragility?
   - **Domain Integrity**: Did the fix bypass a state machine, break tenant isolation,
     or violate a business invariant?
   - **Observability**: Did the fix remove logging, break health checks, remove metrics,
     or break tracing?

2. **Focus on change zones** — don't scan the entire project, only the files and modules
   that were modified during the fix cycle.

**Why scan for new violations**: A fix that resolves one finding but introduces another
is a net zero or net negative. The verify step catches this before the user assumes
the problem is solved.

### Step 3.5: Backlog Side-Effect Check

Load `.zoom-in/context/backlog.md` (if it exists). For each Open backlog item
within the verify scope:

1. **Was the backlog item's location touched by the recent refactor?**
   Check if any changed file overlaps with the backlog item's finding location.
2. **If yes — does the finding still exist?** Read the code at the backlog item's location.
   - **Finding is gone** → The refactor fixed this debt as a side effect!
     - Update `backlog.md`: Status → "Resolved", add note: "Resolved as side effect of [finding-id] fix on [date]"
     - Report: "✅ Backlog item [PF-07] resolved as side effect of [CL-04] fix"
   - **Finding still exists** → No change to backlog. Note in report: "Backlog item [PF-07] still open despite nearby changes."
3. **If no overlap** → Skip (the refactor didn't touch this area)

**Why this matters**: Refactors sometimes fix deferred issues accidentally — a fix
for finding A also resolves a deferred finding B. Without this check, the backlog
keeps growing even though items were resolved. See `references/backlog.md`.

### Step 4: Estimate Score Improvement

Based on the verified fixes, estimate the impact on each lens score:

```
## Score Estimate

| Lens | Audit Score | Estimated After Fixes | Change |
|------|-------------|----------------------|--------|
| Clarity | 6/10 | 8/10 | +2 |
| Structure | 5/10 | 7/10 | +2 |
| Performance | 4/10 | 6/10 | +2 |
| Security | 3/10 | 3/10 | 0 |
| Resilience | 7/10 | 8/10 | +1 |
| Domain Integrity | 8/10 | 8/10 | 0 |
| Observability | 4/10 | 5/10 | +1 |
| **Total** | **37/70** | **45/70** | **+8** |
```

**This is an estimate, not a formal score** — only a full `/zoom-in audit` produces
authoritative scores. The estimate shows trajectory: are we heading in the right
direction?

### Step 5: Produce the Verification Report

```
# Zoom-in Verify: [scope]

## Fix Verification

| Finding ID | Severity | Status | Notes |
|------------|----------|--------|-------|
| CL-1 | 🔴 Critical | ✅ Confirmed | Silent None replaced with typed Result |
| ST-1 | 🟠 High | ✅ Confirmed | Dependency direction reversed |
| SE-1 | 🟠 High | ⚠️ Partial | Auth added to 3/4 endpoints; one remains |
| PF-1 | ⚠️ Medium | ✅ Confirmed | Eager loading added |
| RS-1 | ⚠️ Medium | ❌ Not Fixed | Retry logic not applied; code unchanged |
| DI-1 | 🔴 Critical | 🔴 Regressed | Tenant filter added but broke batch export |

## New Violations Detected

- 🔴 [NEW-1] [principle] Batch export bypasses tenant filter → `path:line`
  Introduced by: DI-1 fix (tenant filter broke export logic)
  → Fix: Add tenant-aware export method

## Skipped Findings
- SE-1: Partially fixed — remaining endpoint needs auth guard
- RS-1: Not fixed — retry logic deferred

## Backlog Side-Effects
- ✅ [PF-07] Resolved as side effect of [CL-04] fix (exclusivity extraction cleaned up sync HTTP)
- [RE-03] Still open — adapter tests not touched by this refactor

## Score Estimate
| Lens | Before | Estimated | Change |
|------|--------|-----------|--------|
| ... | ... | ... | ... |
| **Total** | **37/70** | **45/70** | **+8** |

## Recommended Next Steps
1. `/zoom-in refactor` — Fix [NEW-1] regression and complete SE-1 (partial fix)
2. `/zoom-in audit` — Full re-audit for authoritative scores after all fixes are stable
3. Security remains at 3/10 — `/zoom-in harden` recommended before next release
```

### Step 6: Recommend Next Step

Based on the verification results:

| Condition | Recommendation |
|-----------|---------------|
| All findings ✅ Confirmed, no new violations | `/zoom-in audit` — confirm with authoritative scores |
| Any 🔴 Regressed finding | `/zoom-in refactor` — fix the regression immediately |
| Any ⚠️ Partial finding | `/zoom-in refactor` — complete the partial fix |
| New violations detected | `/zoom-in refactor` — address new violations |
| Security still ≤ 3 | `/zoom-in harden` — security still critical |
| All ✅ but score estimate < 40/70 | `/zoom-in focus [weakest-lens]` — systemic issues may remain |

---

## Integration with Other Commands

| Command | How Verify Relates |
|----------|-------------------|
| `/zoom-in refactor` | Refactor applies fixes; verify confirms they worked |
| `/zoom-in audit` | Audit produces baseline scores; verify estimates improvement |
| `/zoom-in harden` | Verify can check harden fixes the same as refactor fixes |
| `/zoom-in focus` | Focus provides root causes; verify confirms root-cause fixes resolved them |
| `/zoom-in adopt` | Verify confirms adopted conventions are being followed in new code |

---

## Failure Modes

| Situation | Response |
|-----------|----------|
| No previous audit or refactor found | Fail: "Run `/zoom-in audit [scope]` first" |
| All findings already ✅ Confirmed (no work needed) | Report: "All previous fixes verified. Run `/zoom-in audit` for full evaluation." |
| Refactor was very recent (same session) | Verify inline — no need to reload audit from disk |
| Cannot locate fix changes (no git diff, no refactor record) | Verify against audit findings directly — check if each still exists in code |
| Too many regressed findings (≥ 3) | Warn: "Multiple regressions detected. Consider `/zoom-in audit` for full reassessment." |
