# `/zoom-in refactor [scope]` — Apply Fixes from a Previous Audit

Take findings from a previous `/zoom-in audit` (or `focus`/`harden`) and systematically fix them in priority order. The bridge between diagnosis and treatment — refactoring is targeted, justified, and conformant to house style. Not a general-purpose "clean up code" tool.

## Prerequisites

A previous audit/focus/harden must be available: (1) **persisted** in `.zoom-in/context/audits/<scope>/` (most recent file), or (2) **current conversation**. If neither → fail: "No audit found. Run `/zoom-in audit [scope]` first." Without findings, there's no evidence base.

## Scope

Same as audit: *(none)* = all findings from most recent audit · `module_name` · `path/to/file` · `@lens-name` (e.g. `@clarity`).

## 1. Locate the Most Recent Audit

1. Check `.zoom-in/context/audits/` — if scope specified, look in `<scope>/`; if no scope, `full/` first then others; read most recent file (sorted by date in filename)
2. If no persisted audit: check current conversation
3. If neither: fail "No audit found"

Persisted first — conversation history is ephemeral; persisted audits survive across sessions.

**Extract from audit**: all findings with IDs (CL-1, ST-2, SE-1...), each finding's lens/classification/severity/location/suggested fix, overall scores per lens.

**Also load**: `DECISIONS.md` (fix must not contradict an Active decision) · `ANTI-PATTERNS.md` (fix must not introduce a banned pattern — a banned fix is worse than the original problem).

**If audit is stale** (code changed significantly since): warn user, suggest re-running `/zoom-in audit` first.

## 2. Load House-Style Context

1. `SYSTEM.md` — domain context, critical flows (some fixes touch these)
2. `ARCHITECTURE.md` — established patterns, adopted decisions, golden references

A fix that doesn't conform to house style replaces one violation with another.

## 3. Prioritize Findings (severity, then classification)

1. 🔴 Critical + `[principle]` — non-negotiable, production risk
2. 🔴 Critical + `[conflict]` — conflicting conventions needing resolution
3. 🟠 High + `[principle]` — architectural violations, no immediate prod risk
4. 🟠 High + `[conflict]` — structural conflicts
5. ⚠️ Medium + `[principle]` — convention violations weakening architecture
6. ⚠️ Medium + `[house-style]` — style inconsistencies
7. 💡 Low — minor improvements (often skipped in practice)

## 4. Validate Each Finding Before Fixing

1. Read the code at the finding's location
2. Verify the problem still exists (code may have changed since audit)
3. Verify the suggested fix is still appropriate (surrounding context may have changed)
4. Check that fixing won't break something the audit didn't catch

**If no longer valid**: mark "resolved externally" and skip — don't fix what's already fixed. Blindly applying stale fixes creates new bugs.

## 5. Apply Fixes

For each validated finding:
1. Read the target file, understand current code
2. Implement using patterns from golden references in ARCHITECTURE.md
3. **Before applying**: verify the fix doesn't violate ANTI-PATTERNS.md (banned pattern is never an acceptable fix)
4. **After applying**: verify the result conforms to Active Decisions in DECISIONS.md
5. Quick mental check against each lens — ensure no new violations
6. Multi-file fixes applied together — don't leave the codebase in an inconsistent intermediate state

**Pattern adherence**: if audit says "follow established pattern from [golden reference]", read it first. If the fix creates a new pattern (no existing pattern covers this case), implement close to existing style and flag for `/zoom-in adopt` review.

**Each fix is a coherent, self-contained change traceable to its finding ID.** Don't bundle unrelated fixes.

## 6. Update ARCHITECTURE.md If Patterns Evolve

If refactor establishes a previously-undocumented pattern:
- Matches an Emerging pattern (§2) → consider promoting to Established
- Entirely new → add as Emerging
- Becomes a reference implementation → add to §6 Golden References

(Recording new patterns means the next audit enforces them — house-style must evolve with the codebase.)

## 7. Summarize Results

```
# Zoom-in Refactor: [scope]

## Findings Addressed
| ID | Severity | Status |
| CL-1 | 🔴 Critical | ✅ Fixed |
| SE-1 | 🟠 High | ⏭️ Skipped — code changed since audit |
| CL-2 | 💡 Low | ⏭️ Deferred — low priority |

## Remaining Findings
- SE-1: Re-audit recommended before fixing
- CL-2: address in next refactor cycle

## ARCHITECTURE.md Updates
- §2: Promoted "service layer returns typed result objects" Emerging → Established
- §6: Added services/order_service.py as golden reference
```

## 8. Update Audit Status & Backlog

**For each successfully fixed finding**: note as "resolved" (next audit detects it as "Resolved from Previous").

**For each finding intentionally left unfixed**: add to ARCHITECTURE.md §4 (Known Exceptions) with reason; note as "acknowledged"; **add to Technical Debt Backlog** (`.zoom-in/context/backlog.md`):
- Ask: "Defer this finding to the tech debt backlog? What's the reason? Optional: ticket reference (e.g. GH-123)."
- If confirm deferral → add row to `backlog.md` under the finding's scope: Finding ID, Description, Severity, Deferred On (today), Reason, Ticket/Ref, Status: Open
- If "just skip, don't track" → add to Known Exceptions only, not backlog
- See `references/backlog.md` for full format/lifecycle

**Do NOT modify the persisted audit file** — it's a historical record. The next audit naturally reflects current state.

## 9. Close the Loop (non-negotiable)

The refactor is not complete until verification confirms the fixes. Append:
```
## Next Steps
- /zoom-in verify — confirm fixes valid, no new violations
- /zoom-in audit — authoritative scores after verification
- /zoom-in adopt — resolve any remaining [conflict] findings
```
A fix that resolves one finding but introduces another is net negative — verify catches this before the user assumes the project is healthier than it is.

## Failure Modes

| Situation | Response |
|---|---|
| No persisted audit and no conversation audit | Fail: "Run `/zoom-in audit [scope]` first" |
| Persisted audit is stale (>30 days) | Warn: "Last audit was on [date]. Consider re-running `/zoom-in audit`." |
| Audit is very stale | Warn and suggest re-auditing; proceed only if user confirms |
| Fix would break existing tests | Stop; do not apply. Suggest updating tests first or re-planning the fix |
| Fix conflicts with an Adopted Decision | Flag the conflict; ask whether to amend the decision or revise the fix |
| Too many findings for one session | Apply only 🔴 Critical and 🟠 High; defer the rest |
