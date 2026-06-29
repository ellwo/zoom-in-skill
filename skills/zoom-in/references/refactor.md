# `/zoom-in refactor [scope]` — Apply Fixes from a Previous Audit

> Don't refactor without evidence. Let the audit guide the work.

---

## Purpose

Take the findings from a previous `/zoom-in audit` and systematically fix them in priority order. This command is the bridge between diagnosis and treatment — it ensures refactoring is targeted, justified, and conformant to house style.

**Why this matters**: Refactoring without a prior audit is guessing. You might fix something that wasn't actually a problem, or introduce a new violation while fixing an old one. A structured refactor traces every change back to a specific finding with a specific severity and classification.

---

## Chain of Thought

1. **Analyze** — Load the audit findings. Which problems exist and how severe are they?
2. **Critique** — Are the findings still valid? Has the code changed since the audit? Is the proposed fix appropriate?
3. **Propose** — Order the fixes by priority. Present the refactor plan.
4. **Execute** — Apply fixes one at a time, verifying each against house style.

---

## Prerequisites

A previous `/zoom-in audit` (or `/zoom-in focus` or `/zoom-in harden`) must be available. The tool looks for audit results in this order:

1. **Persisted audits** — `.zoom-in/context/audits/<scope>/` (most recent file)
2. **Current conversation** — if an audit was run in this session

If no audit is found in either location, fail with: "No audit found. Run `/zoom-in audit [scope]` first."

**Why this is a hard prerequisite**: Without audit findings, there is no evidence base for refactoring. The refactor command is not a general-purpose "clean up code" tool — it is a systematic response to specific, classified, severity-rated findings.

---

## Scope

Refactor supports the same scope as audit:

| Scope | Meaning |
|-------|---------|
| *(none)* | Fix all findings from the most recent audit |
| `module_name` | Fix findings in a specific module only |
| `path/to/file` | Fix findings in a specific file only |
| `@lens-name` | Fix findings from a specific lens only (e.g., `@clarity`) |

**Why scope matters**: Not every refactor needs to address the entire audit. A developer
fixing one module can scope refactor to that module, verify, and iterate without
touching unrelated findings.

---

## Step-by-Step Process

### Step 1: Locate the Most Recent Audit

1. Check `.zoom-in/context/audits/` for persisted audits:
   - If scope was specified: look in `.zoom-in/context/audits/<scope>/`
   - If no scope: look in `.zoom-in/context/audits/full/` first, then other scopes
   - Read the most recent file (sorted by date in filename)
2. If no persisted audit found: check current conversation for audit results
3. If neither exists: fail with "No audit found"

**Why persisted first**: Conversation history is ephemeral. Persisted audits survive across sessions, making `/zoom-in refactor` work even in new conversations.

Once the audit is located, load its findings:

**Extract from the audit**:
- All findings with their IDs (e.g., CL-1, ST-2, SE-1)
- Each finding's lens, classification, severity, location, and suggested fix
- The overall scores per lens

**Also load**:
- **DECISIONS.md** — To ensure refactoring respects Active decisions (a fix must not contradict an adopted decision)
- **ANTI-PATTERNS.md** — To ensure refactoring doesn't introduce any banned patterns (a fix that uses a banned approach is worse than the original problem)

**If the audit is stale** (code has changed significantly since the audit was run): Warn the user and suggest re-running `/zoom-in audit` first. A refactor based on outdated findings can introduce new problems.

### Step 2: Load House-Style Context

Load:
1. **SYSTEM.md** — Domain context and critical flows (some fixes may touch these areas)
2. **ARCHITECTURE.md** — Established patterns, adopted decisions, golden references

**Why load context**: A fix that doesn't conform to house style replaces one violation with another. Every refactor must be calibrated against the project's own conventions.

### Step 3: Prioritize Findings

Sort findings by severity, then by classification:

**Priority order**:
1. 🔴 Critical + `[principle]` — Non-negotiable violations with production risk
2. 🔴 Critical + `[conflict]` — Conflicting conventions that need resolution
3. 🟠 High + `[principle]` — Architectural violations without immediate production risk
4. 🟠 High + `[conflict]` — Structural conflicts
5. ⚠️ Medium + `[principle]` — Convention violations that weaken architecture
6. ⚠️ Medium + `[house-style]` — Style inconsistencies
7. 💡 Low — Minor improvements (often skipped in practice)

**Why this order**: Critical findings with principle violations are the most damaging — they represent both risk and rule-breaking. Fixing them first provides the highest return on effort.

### Step 4: Validate Each Finding Before Fixing

Before applying any fix, confirm the finding is still valid:

1. Read the code at the location specified in the finding
2. Verify the problem still exists (code may have been changed since the audit)
3. Verify the suggested fix is still appropriate (surrounding context may have changed)
4. Check that fixing this finding won't break something the audit didn't catch

**Why validation matters**: An audit captures a snapshot. Code evolves. A finding that was valid last week may have been fixed by another developer, or the surrounding code may have changed such that the original suggested fix is now wrong. Blindly applying stale fixes creates new bugs.

**If a finding is no longer valid**: Mark it as "resolved externally" and skip it. Do not attempt to fix something that's already fixed.

### Step 5: Apply Fixes

For each validated finding, apply the fix following house style:

**Method**:
1. Read the target file and understand the current code
2. Implement the fix using patterns from golden references in ARCHITECTURE.md
3. **Before applying**: Verify the fix doesn't violate ANTI-PATTERNS.md — a banned pattern is never an acceptable fix
4. **After applying**: Verify the result conforms to Active Decisions in DECISIONS.md
5. Ensure the fix doesn't introduce new violations (quick mental check against each lens)
6. If the fix requires changes to multiple files, apply them together — don't leave the codebase in an inconsistent intermediate state

**Pattern adherence**:
- If the audit says "follow established pattern from [golden reference]", read that reference first
- If the fix creates a new pattern (because no existing pattern covers this case), implement it as close to existing style as possible and flag it for `/zoom-in adopt` review

**Important**: Each fix should be a coherent, self-contained change. Don't bundle unrelated fixes into one change — each should be traceable to its finding ID.

### Step 6: Update ARCHITECTURE.md If Patterns Evolve

If a refactor establishes a pattern that wasn't previously documented:

- If it matches an Emerging pattern from ARCHITECTURE.md §2 → consider promoting it to Established
- If it's entirely new → add it as an Emerging pattern
- If it becomes a reference implementation → add it to §6 Golden References

**Why update ARCHITECTURE.md**: Refactoring that establishes new patterns without recording them means the next audit won't enforce them. The house-style document must evolve with the codebase.

### Step 7: Summarize Results

After all fixes are applied, produce a summary:

```
# Zoom-in Refactor: [scope]

## Findings Addressed
| ID | Severity | Status |
|----|----------|--------|
| CL-1 | 🔴 Critical | ✅ Fixed |
| ST-1 | 🟠 High | ✅ Fixed |
| SE-1 | 🟠 High | ⏭️ Skipped — code changed since audit |
| PF-1 | ⚠️ Medium | ✅ Fixed |
| CL-2 | 💡 Low | ⏭️ Deferred — low priority |

## Remaining Findings
- SE-1: Re-audit recommended before fixing
- CL-2: Low priority; address in next refactor cycle

## ARCHITECTURE.md Updates
- §2: Promoted "service layer returns typed result objects" from Emerging to Established
- §6: Added `services/order_service.py` as golden reference for result object pattern
```

### After Fixes: Update Audit Status

For each finding that was successfully fixed:
- Note it as "resolved" (the next `/zoom-in audit` will detect it as "Resolved from Previous")

For each finding intentionally left unfixed:
- Add to ARCHITECTURE.md §4 (Known Exceptions) with reason
- Note it as "acknowledged"
- **Add to Technical Debt Backlog** (`.zoom-in/context/backlog.md`):
  - Ask the user: "Defer this finding to the tech debt backlog? What's the reason?
    Optional: ticket reference (e.g., GH-123)."
  - If user confirms deferral → add a row to `backlog.md` under the finding's scope
    with: Finding ID, Description, Severity, Deferred On (today), Reason, Ticket/Ref, Status: Open
  - If user says "just skip, don't track" → add to Known Exceptions only, not backlog
  - See `references/backlog.md` for full format and lifecycle

Do NOT modify the persisted audit file — it is a historical record. The next `/zoom-in audit` will naturally reflect the current state.

### After Refactor: Close the Loop

The refactor is not complete until verification confirms the fixes. Append to the summary:

```
## Next Steps
- Run `/zoom-in verify` to confirm fixes are valid and no new violations introduced
- Run `/zoom-in audit` for authoritative scores after verification
- Run `/zoom-in adopt` to resolve any remaining [conflict] findings
```

**Why verification is non-negotiable**: A fix that resolves one finding but introduces
another is a net negative. The verify step catches this before the user assumes the
project is healthier than it is.

---

## Integration with Other Commands

- `/zoom-in audit` produces the findings this command consumes
- `/zoom-in focus` provides root-cause context that makes refactoring more effective
- `/zoom-in harden` produces security findings that refactor can address
- Persisted audits enable `/zoom-in refactor` to work across sessions
- After refactoring, `/zoom-in verify` confirms fixes are valid (recommended, not optional)
- After verification, `/zoom-in audit` shows resolved findings and authoritative scores
- `/zoom-in adopt` records new patterns established during refactoring
- `/zoom-in adopt --ban` may be triggered when refactoring discovers a new anti-pattern
- If `[conflict]` findings remain unresolved after refactor, recommend `/zoom-in adopt` to settle

---

## Failure Modes

| Situation | Response |
|---|---|
| No persisted audit and no conversation audit | Fail: "Run `/zoom-in audit [scope]` first" |
| Persisted audit is stale (>30 days old) | Warn: "Last audit was on [date]. Consider re-running `/zoom-in audit` for current state." |
| Audit is very stale | Warn and suggest re-auditing; proceed only if user confirms |
| Fix would break existing tests | Stop; do not apply. Suggest updating tests first or re-planning the fix |
| Fix conflicts with an Adopted Decision | Flag the conflict; ask user whether to amend the decision or revise the fix |
| Too many findings for one session | Apply only 🔴 Critical and 🟠 High; defer the rest |
