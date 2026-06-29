# `/zoom-in focus [lens] [scope]` — Deep-Dive on a Single Lens

Dedicated depth on a single lens the audit flagged as weak. While audit covers all 7 lenses at survey depth, focus dedicates full attention to one lens — tracing root causes, mapping causal chains between findings, and producing remediation paths that address the disease, not just the symptoms.

## When to Use

| Situation | Command |
|-----------|---------|
| General health check across all lenses | `/zoom-in audit` |
| Security deserves dedicated OWASP-level depth | `/zoom-in harden` |
| A specific lens scored low and needs root-cause analysis | **`/zoom-in focus [lens]`** |
| Fix findings from an existing audit | `/zoom-in refactor` |
| Confirm fixes didn't introduce new problems | `/zoom-in verify` |

## Prerequisites

**Fail** if `SYSTEM.md` or `ARCHITECTURE.md` missing → "Run `/zoom-in init` first." A previous `/zoom-in audit` is strongly recommended (focus works best targeting a lens the audit flagged weak; without it, focus still works but lacks baseline context).

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

**Note**: `focus security` is valid but `/zoom-in harden` provides a richer security-specific workflow (OWASP, compliance, attack chains). Use `focus security` for root-cause analysis of security patterns; use `harden` for a full security assessment.

## Scope

Same as audit: *(none)* = entire project through this lens · `module_name` · `path/to/file`.

## 1. Load Context (in order)

1. `SYSTEM.md` — domain context, register, critical flows
2. `ARCHITECTURE.md` — established patterns, adopted decisions, known exceptions for this lens
3. `DECISIONS.md` — Active decisions tagged with this lens
4. `ANTI-PATTERNS.md` — bans relevant to this lens
5. **The single lens reference file** — full signals, rubrics, examples (only one lens file → focus is faster than audit while going deeper)
6. Register reference(s) — domain rules intersecting this lens
7. Framework reference — framework-specific signals for this lens

## 2. Deep Scan (more thorough than audit)

Audit samples key files per module and flags surface signals. **Focus reads every file relevant to the lens in the target scope.**

| Lens | Deep-scan targets |
|------|-------------------|
| Clarity | All service/data-access/handler files — naming, typing, docstrings, duplication |
| Structure | All module directories — imports, dependency direction, layer boundaries |
| Performance | All query-bearing files, task definitions, cache usage, hot-path handlers |
| Security | All auth/permission/validation files, all endpoints, all data-access with user input |
| Resilience | All test files, error handlers, task retry configs, migration files |
| Domain Integrity | All model/state-machine files, services with business rules, tenant-scoped queries |
| Observability | All logging config, health check endpoints, metric instrumentation, tracing setup, error tracking |

## 3. Root Cause Analysis

For each finding, trace **why** it exists, not just **what**.

**Causal categories:**
| Root Cause | Signal | Fix Type |
|------------|--------|----------|
| **Missing convention** | Same mistake repeated independently across modules | Systemic: adopt a pattern via `/zoom-in adopt` |
| **Wrong convention** | A pattern exists but causes the problem | Systemic: adopt a replacement via `/zoom-in adopt` |
| **Missing abstraction** | Logic duplicated because no shared utility exists | Structural: create shared module/class |
| **Knowledge gap** | Correct pattern exists in one module but isn't followed elsewhere | Adoption: promote Emerging → Established |
| **Legacy code** | Code predates current conventions | Incremental: update when touched, add to Known Exceptions |
| **Isolated mistake** | One-off error in otherwise consistent code | Point fix: correct the specific code |

**Causal chains**: when multiple surface findings share a root cause, document the chain:
```
Root cause: No eager-loading convention
├── [PF-1] N+1 in orders list endpoint → Symptom
├── [PF-2] N+1 in billing list endpoint → Symptom
├── [PF-3] N+1 in subscriptions list endpoint → Symptom
└── Fix: /zoom-in adopt "all list endpoints must use select_related/prefetch_related"
    → Resolves PF-1, PF-2, PF-3 simultaneously
```

## 4. Score and Classify

Score the lens 1-10 using the same rubric as audit, but with deeper findings. The focus score may differ from the audit score (usually lower — focus finds issues audit missed at survey depth). Record both: "Audit score: 6/10 → Focus score: 4/10 (deeper scan found 3 additional issues)." Classify every finding using the same system: `[principle]`, `[house-style]`, `[conflict]`.

## 5. Produce the Focus Report

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

## All Findings
### 🔴 Critical
- [PF-5] [principle] Root SQL without parameterization → path:line → Parameterize
  Root cause: RC-1 (Missing convention for data access layer)
### 🟠 High / ⚠️ Medium / 💡 Low (same format, each tagged with its RC)

## Remediation Plan
### Systemic Fixes (resolve multiple findings at once)
1. [RC-1] Adopt eager-loading convention → resolves PF-1, PF-2, PF-3
   Command: `/zoom-in adopt "all list endpoints must use select_related/prefetch_related"`
### Point Fixes (individual corrections)
2. [PF-5] Parameterize raw SQL → path:line

## Recommended Next Steps
1. `/zoom-in adopt` — establish missing conventions
2. `/zoom-in refactor` — apply point fixes and implement new conventions
3. `/zoom-in verify` — confirm no new violations
4. `/zoom-in audit` — full re-audit to validate score improvement
```

## 6. Persist Alongside Audit

Focus results are **appended** to the most recent audit file for this scope as a supplementary section (keeps all diagnostic info for a scope in one place). If no audit exists for this scope, write a standalone file: `.zoom-in/context/audits/<scope>/YYYY-MM-DD--focus-<lens>.md`.

## Failure Modes

| Situation | Response |
|---|---|
| No SYSTEM.md or ARCHITECTURE.md | Fail: "Run `/zoom-in init` first" |
| Invalid lens name | Fail: list valid lens names with brief descriptions |
| No previous audit | Proceed; note "no baseline audit — focus may miss cross-lens patterns" |
| Scope doesn't exist | Fail: "Not found"; suggest alternatives |
| Lens already scored ≥ 8 in audit | Warn: "This lens scored well ([X]/10). Focus may not find much. Confirm?" |
| All findings isolated (no shared root cause) | Report as-is; note "no systemic root cause found — point fixes sufficient" |
