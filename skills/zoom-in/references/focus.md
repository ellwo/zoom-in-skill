# `/zoom-in focus [lens] [scope]` — Deep-Dive on a Single Lens

> When the audit says a lens scored 4/10, it identified symptoms. Focus finds the root causes.

---

## Purpose

Dedicated depth on a single lens that the audit flagged as weak. While `/zoom-in audit`
covers all seven lenses at survey depth, `/zoom-in focus` dedicates full attention to one
lens — tracing root causes, mapping causal chains between findings, and producing
remediation paths that address the disease, not just the symptoms.

**Why this matters**: A general audit might flag "N+1 queries in 4 endpoints" as 🟠 High.
`/zoom-in focus performance` would trace each back to a shared root cause (e.g., "the
project has no eager-loading convention; every new endpoint repeats the same mistake")
and propose a systemic fix (adopt eager-loading as a pattern) instead of patching four
endpoints independently.

**When to use** (vs. alternatives):

| Situation | Command |
|-----------|---------|
| General health check across all lenses | `/zoom-in audit` |
| Security deserves dedicated OWASP-level depth | `/zoom-in harden` |
| A specific lens scored low and needs root-cause analysis | **`/zoom-in focus [lens]`** |
| Fix findings from an existing audit | `/zoom-in refactor` |
| Confirm fixes didn't introduce new problems | `/zoom-in verify` |

---

## Chain of Thought

1. **Explore** — Read the code relevant to this lens more thoroughly than audit did.
2. **Analyze** — Trace each finding to its root cause. Are they independent or connected?
3. **Critique** — Evaluate whether surface-level fixes would suffice or systemic change is needed.
4. **Propose** — Rank by impact. Distinguish root-cause fixes from symptom patches.
5. **Connect** — Show how fixing one root cause may resolve multiple surface findings.

---

## Prerequisites

1. **SYSTEM.md must exist** — Domain context for the lens area.
2. **ARCHITECTURE.md must exist** — House-style calibration.
3. **A previous `/zoom-in audit` is strongly recommended** — Focus works best when
   targeting a lens that the audit identified as weak. Without a prior audit, focus
   still works but lacks the baseline context that makes it most valuable.

If SYSTEM.md or ARCHITECTURE.md is missing, fail with: "Run `/zoom-in init` first."

---

## Lens Names

| Argument | Lens | Reference File |
|----------|------|----------------|
| `clarity` | Clarity | `references/lens-clarity.md` |
| `structure` | Structure | `references/lens-structure.md` |
| `performance` | Performance | `references/lens-performance.md` |
| `security` | Security | `references/lens-security.md` |
| `resilience` | Resilience | `references/lens-resilience.md` |
| `domain-integrity` | Domain Integrity | `references/lens-domain-integrity.md` |
| `observability` | Observability | `references/lens-observability.md` |

**Note**: `/zoom-in focus security` is valid but `/zoom-in harden` provides a richer
security-specific workflow (OWASP checklist, compliance, attack chains). Use `focus
security` when you want root-cause analysis of security patterns; use `harden` for a
full security assessment.

---

## Scope

Same as `/zoom-in audit`:

| Scope | Meaning |
|-------|---------|
| *(none)* | Entire project through this lens |
| `module_name` | Specific module/app |
| `path/to/file` | Specific file or directory |

---

## Step-by-Step Process

### Step 1: Load Context

Load in order:
1. **SYSTEM.md** — Domain context, register selection, critical flows
2. **ARCHITECTURE.md** — Established patterns, adopted decisions, known exceptions for this lens
3. **DECISIONS.md** — Active decisions tagged with this lens
4. **ANTI-PATTERNS.md** — Bans relevant to this lens
5. **The single lens reference file** — Full signals, rubrics, and examples
6. **Register reference(s)** — Domain-specific rules that intersect with this lens
7. **Framework reference** — Framework-specific signals for this lens

**Why focused loading**: Only one lens reference file is needed. This makes focus faster
than audit while going deeper into the selected area.

### Step 2: Deep Scan

For the selected lens, scan **more thoroughly** than audit did:

**What audit does**: Sample key files per module, flag surface signals.
**What focus does**: Read every file relevant to the lens in the target scope.

**Depth per lens**:

| Lens | Deep-scan targets |
|------|-------------------|
| Clarity | All service/data-access/handler files — naming, typing, docstrings, duplication |
| Structure | All module directories — imports, dependency direction, layer boundaries |
| Performance | All query-bearing files, task definitions, cache usage, hot-path handlers |
| Security | All auth/permission/validation files, all endpoints, all data-access with user input |
| Resilience | All test files, all error handlers, all task retry configs, all migration files |
| Domain Integrity | All model/state-machine files, all service files with business rules, all tenant-scoped queries |
| Observability | All logging config, health check endpoints, metric instrumentation, tracing setup, error tracking integration |

### Step 3: Root Cause Analysis

For each finding, trace **why** it exists rather than just **what** it is:

**Causal categories**:

| Root Cause | Signal | Fix Type |
|------------|--------|----------|
| **Missing convention** | Same mistake repeated independently across modules | Systemic: adopt a pattern via `/zoom-in adopt` |
| **Wrong convention** | A pattern exists but causes the problem | Systemic: adopt a replacement via `/zoom-in adopt` |
| **Missing abstraction** | Logic duplicated because no shared utility exists | Structural: create shared module/class |
| **Knowledge gap** | Correct pattern exists in one module but isn't followed elsewhere | Adoption: promote Emerging to Established |
| **Legacy code** | Code predates current conventions | Incremental: update when touched, add to Known Exceptions |
| **Isolated mistake** | One-off error in otherwise consistent code | Point fix: correct the specific code |

**Causal chains**: When multiple surface findings share a root cause, document the chain:

```
Root cause: No eager-loading convention
├── [PF-1] N+1 in orders list endpoint → Symptom
├── [PF-2] N+1 in billing list endpoint → Symptom
├── [PF-3] N+1 in subscriptions list endpoint → Symptom
└── Fix: /zoom-in adopt "all list endpoints must use select_related/prefetch_related"
    → Resolves PF-1, PF-2, PF-3 simultaneously
```

### Step 4: Score and Classify

Score the lens 1-10 using the same rubric as audit, but with the deeper findings:

- The focus score may differ from the audit score (usually lower, because focus finds
  issues audit missed at survey depth)
- Record both: "Audit score: 6/10 → Focus score: 4/10 (deeper scan found 3 additional issues)"

Classify every finding using the same system: `[principle]`, `[house-style]`, `[conflict]`.

### Step 5: Produce the Focus Report

```
# Zoom-in Focus: [lens-name] — [scope]

## Score
Audit: X/10 | Focus (deeper): Y/10

## Root Causes
### RC-1: [root cause description]
- Type: [Missing convention / Wrong convention / Missing abstraction / Knowledge gap / Legacy / Isolated]
- Surface findings: [PF-1], [PF-2], [PF-3]
- Fix: [specific remediation]
- Expected resolution: [N] findings resolved by this fix

### RC-2: [root cause description]
...

## All Findings

### 🔴 Critical
- [PF-5] [principle] Root SQL query without parameterization → `path:line` → Parameterize
  Root cause: RC-1 (Missing convention for data access layer)

### 🟠 High
- [PF-1] [house-style] N+1 query pattern → `path:line` → Use eager loading
  Root cause: RC-1 (Missing convention for query optimization)

### ⚠️ Medium
...

### 💡 Low
...

## Remediation Plan

### Systemic Fixes (resolve multiple findings at once)
1. [RC-1] Adopt eager-loading convention → resolves PF-1, PF-2, PF-3
   Command: `/zoom-in adopt "all list endpoints must use select_related/prefetch_related"`
2. [RC-2] Create shared validation module → resolves PF-6, PF-7
   Command: `/zoom-in refactor` after pattern is established

### Point Fixes (individual corrections)
3. [PF-5] Parameterize raw SQL → `path:line`
4. [PF-8] Add retry logic to payment callback → `path:line`

## Recommended Next Steps
1. `/zoom-in adopt` — Establish missing conventions (RC-1, RC-2)
2. `/zoom-in refactor` — Apply point fixes and implement new conventions
3. `/zoom-in verify` — Confirm fixes didn't introduce new violations
4. `/zoom-in audit` — Full re-audit to validate score improvement
```

### Step 6: Persist Alongside Audit

Focus results are **appended** to the most recent audit file for this scope as a
supplementary section, not stored as a separate file. This keeps all diagnostic
information for a scope in one place.

If no audit exists for this scope, write a standalone file:
`.zoom-in/context/audits/<scope>/YYYY-MM-DD--focus-<lens>.md`

---

## Integration with Other Commands

| Command | How Focus Relates |
|----------|-------------------|
| `/zoom-in audit` | Audit identifies weak lenses; focus deep-dives on them |
| `/zoom-in harden` | Harden is focus-security-plus-OWASP; use harden for full security, focus for root-cause |
| `/zoom-in refactor` | Focus provides root-cause context that makes refactoring more effective |
| `/zoom-in adopt` | Focus often reveals missing conventions → adopt establishes them |
| `/zoom-in verify` | Verify after refactor confirms focus-driven fixes are valid |
| `/zoom-in plan` | Focus findings inform where new features need extra attention |

---

## Failure Modes

| Situation | Response |
|-----------|----------|
| No SYSTEM.md or ARCHITECTURE.md | Fail: "Run `/zoom-in init` first" |
| Invalid lens name | Fail: list valid lens names with brief descriptions |
| No previous audit | Proceed; note "no baseline audit — focus may miss cross-lens patterns" |
| Scope doesn't exist | Fail: "Not found"; suggest alternatives |
| Lens already scored ≥ 8 in audit | Warn: "This lens scored well ([X]/10). Focus may not find much. Confirm?" |
| All findings are isolated (no shared root cause) | Report as-is; note "no systemic root cause found — point fixes sufficient" |
