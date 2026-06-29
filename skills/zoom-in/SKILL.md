---
name: zoom-in
description: Strict architectural audit, planning, and enforcement for backend systems. Scores code across 7 lenses (Clarity, Structure, Performance, Security, Resilience, Domain Integrity, Observability), enforces golden-pattern laws, and generates an adaptive ARCHITECTURE.md house-style file. Use this skill whenever the user wants to audit code quality, review architecture, plan a feature with strict conventions, harden security, optimize performance, refactor code, or establish/evolve project conventions — even if they don't explicitly say "zoom-in" or "audit." Also use when the user asks about code quality, technical debt, best practices for their backend project, or wants to enforce consistency across modules.
version: 1.0.1 # x-release-please-version
user-invocable: true
argument-hint: "[init|re-init|map · audit|focus|harden · refactor|verify · adopt|plan] [scope]"
license: Apache 2.0
---

# Zoom-in — Adaptive Architectural Audit & Enforcement

Zoom-in is a strict, adaptive code quality system for any backend project. It discovers conventions from the actual codebase ("golden references"), enforces them, and evolves as the team makes new decisions.

## Philosophy

1. **The project is the authority.** Conventions are discovered from the actual codebase, not imposed from outside. The skill builds a living `ARCHITECTURE.md` that captures what THIS project does well.

2. **Strict enforcement, justified findings.** Every finding classified as `[principle]` (universal law), `[house-style]` (project convention), or `[conflict]` (contradicts established pattern). No finding without a reason. No rule without a "why."

3. **The skill evolves.** `/zoom-in adopt` lets teams register new decisions that become law. ARCHITECTURE.md grows with the project. Audits today check conventions that didn't exist last month.

4. **Explore First.** Read the code before auditing or planning. Never assume what the codebase does — verify from the actual files. A plan or audit based on assumptions is worse than no plan at all.

5. **Diagnose, then prescribe.** An audit without a clear next step is diagnosis without treatment. Every evaluation produces not just findings, but a prioritized action path — which command to run next, in what order, and why.

6. **Close the loop.** Fixing without verifying is hoping. Every fix cycle ends with verification, and every verification ends with the option to re-audit. The project's health is a closed feedback loop, not a one-shot report.

## Context Files

| File | Purpose | Created by |
|------|---------|------------|
| `SYSTEM.md` | Strategic context: system type, framework, tenancy, auth, registers, **decision structure** | `/zoom-in init` |
| `ARCHITECTURE.md` | Adaptive house-style: established patterns, summary decisions index, known exceptions, golden references | `/zoom-in init`, updated by `/zoom-in adopt` |
| `DECISIONS.md` | Architectural constitution: full ADR records (global decisions; all decisions if Flat structure) | `/zoom-in init`, updated by `/zoom-in adopt` |
| `.zoom-in/context/decisions/<module>.md` | Module-specific ADR records (Modular structure only) | `/zoom-in adopt` |
| `ANTI-PATTERNS.md` | Project-specific rejection rules: universal + framework + register + discovered + team-added bans | `/zoom-in init`, updated by `/zoom-in adopt --ban` |
| `.zoom-in/context/audits/` | Persisted audit history with delta tracking + change detection | `/zoom-in audit` |
| `.zoom-in/context/backlog.md` | Technical debt backlog: deferred findings, reasons, ticket refs, resolution tracking | `/zoom-in refactor`, checked by `/zoom-in audit` and `/zoom-in verify` |

**Audit persistence**: Every `/zoom-in audit` automatically writes results to `.zoom-in/context/audits/<scope>/YYYY-MM-DD--score-XX.md`. This enables:
- Delta tracking (current vs previous score per lens)
- Change detection (git diff between audit commits — committed + uncommitted changes)
- `/zoom-in refactor` to work across sessions
- Trend analysis over time

Auto-cleanup keeps only the 2 most recent audits per scope. See `references/audit-storage.md` for full details.

**Decision structure**: SYSTEM.md records whether the project uses Flat (single
DECISIONS.md) or Modular (global DECISIONS.md + per-module files in
`.zoom-in/context/decisions/`). This choice is made during `/zoom-in init` and
is permanent. See `references/decisions-template.md` § "Modular Decision Structure".

**Technical debt backlog**: `.zoom-in/context/backlog.md` tracks findings that
were intentionally deferred during refactor. `/zoom-in audit` reviews the backlog
and reports which items are still open, resolved, or worsened. `/zoom-in verify`
detects items resolved as side effects of other fixes. See `references/backlog.md`.

**Search order:** project root, `.agents/context/`, `docs/`, `ZOOMIN_CONTEXT_DIR` env var.

**Missing files behavior:**

- If `SYSTEM.md` or `ARCHITECTURE.md` is missing → fail, suggest `/zoom-in init`
- If `DECISIONS.md` is missing → warn but proceed (no decisions adopted yet)
- If `ANTI-PATTERNS.md` is missing → fall back to `references/anti-patterns.md` (universal only)
- If `.zoom-in/context/backlog.md` is missing → skip backlog review (no deferred items yet)
- If SYSTEM.md `Decision Structure` is missing → default to Flat (single DECISIONS.md)

## Framework Detection (auto)

Detected automatically during `/zoom-in init`. Loads `references/frameworks/<name>.md` for framework-specific signals.

| Signals | Framework |
|---------|-----------|
| `manage.py` + `settings.py` + `requirements.txt` | Django |
| `main.py` + `fastapi` in dependencies | FastAPI |
| `package.json` + `express`/`nest` | Express/NestJS |
| `pom.xml`/`build.gradle` + `@SpringBootApplication` | Spring Boot |
| `composer.json` + `artisan` | Laravel |
| `go.mod` + `main.go` | Go |
| `Gemfile` + `config/routes.rb` | Rails |
| `Cargo.toml` + `src/main.rs` | Rust |

If no framework matches, proceeds with generic backend signals.

## Register System

Every project falls into one or more registers that add specialized checks. Determined during `/zoom-in init`.

| Register | Signals | Reference |
|----------|---------|-----------|
| **SaaS** | Multi-tenant, subscriptions, billing, tenant isolation | `references/registers/saas.md` |
| **Enterprise** | Compliance, RBAC/ABAC, audit trails, integrations | `references/registers/enterprise.md` |
| **API Service** | REST/GraphQL, versioning, documentation | `references/registers/api-service.md` |
| **Default** | Lean, pragmatic, no special requirements | `references/registers/default.md` |

A project can be in multiple registers (e.g. SaaS + API Service).

## Seven Lenses

Each lens has a reference file with detailed signals, rubrics, and example findings. Load only what's needed.

| Lens | Reference | Focus |
|------|-----------|-------|
| 1. Clarity | `references/lens-clarity.md` | Naming, typing, DRY, dead code, code smells, formatting consistency |
| 2. Structure | `references/lens-structure.md` | Layering, separation of concerns, module boundaries, contract integrity, task structure |
| 3. Performance | `references/lens-performance.md` | N+1 queries, query efficiency, indexing, caching, async |
| 4. Security | `references/lens-security.md` | Permissions, secrets, input validation, data exposure, auth |
| 5. Resilience | `references/lens-resilience.md` | Test coverage/quality, migration hygiene, error handling, distributed resilience patterns, documentation |
| 6. Domain Integrity | `references/lens-domain-integrity.md` | State machines, business invariants, tenant isolation, financial correctness |
| 7. Observability | `references/lens-observability.md` | Structured logging, health checks, metrics, distributed tracing, alerting, error tracking |

## Commands

Commands are organized into four categories. Every evaluation command (Discover, Evaluate)
produces a clear next-step recommendation. Every fix command (Fix, Evolve) is followed
by verification.

### Category: Discover

#### `/zoom-in init` — Discover project context

Scans the project, detects framework, interviews user, creates `SYSTEM.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and `ANTI-PATTERNS.md`. See `references/init.md`.

**Workflow:**

1. Detect framework using signal table above
2. Interview user: system type, registers, tenancy model, auth approach
3. Scan project structure: entry points, config, modules, dependency files
4. For each module: examine models/views/controllers/services/tasks as applicable
5. Compare discovered patterns across modules:
   - 3+ modules do the same thing consistently → **Established**
   - 1-2 modules do it, others don't → **Emerging**
   - Different modules do it differently → **Inconsistent**
6. Identify **Golden References** — files that best embody each Established pattern
7. Write `SYSTEM.md` and `ARCHITECTURE.md`
8. Generate `ANTI-PATTERNS.md` from universal bans + framework-specific bans + register-specific bans + discovered violations
9. Generate `DECISIONS.md` (initially empty ADR index; populated as decisions are adopted)
10. If any file already exists: merge, don't overwrite. Preserve §3 Adopted Decisions, §4 Known Exceptions, and any existing ADR records or bans.

**After init completes**: Suggest `/zoom-in map` to understand the dependency graph, then `/zoom-in audit` for a baseline health check.

---

#### `/zoom-in re-init` — Evolution sync for existing projects

Synchronizes existing context files with the current skill version and codebase state. Detects schema gaps (new skill features missing from context), codebase drift (patterns/golden references that went stale), and untracked changes (edits made outside proper process). See `references/re-init.md`.

**When to use**: After skill updates, major refactors, or when context files feel stale. Not for new projects — use `/zoom-in init` instead.

**Workflow:**

1. Load existing context files (SYSTEM.md, ARCHITECTURE.md, DECISIONS.md, ANTI-PATTERNS.md)
2. Git diff — detect uncommitted changes to context files (unchecked)
3. Schema version gap analysis — compare project's `init_version` to current skill version using `references/init-changelog.md`; verify each new feature via field detection
4. Deep drift check — rescan codebase: verify §2 patterns still hold, §6 golden references still exist, discover new patterns, check for orphaned decisions
5. Auto-detect Scope — if switching to Modular, infer Scope for each ADR from title/context/golden reference
6. Present full Gap & Drift Report (schema gaps, untracked changes, pattern drift, orphaned decisions, anti-pattern drift)
7. Interactive repair — confirm/modify/reject each issue (Draft Gate mandatory for any decision/ban changes)
8. Apply confirmed changes only — update files, never touch audit history
9. Report results (what changed, what was preserved, what was rejected)

**After re-init completes**: Suggest `/zoom-in audit` for authoritative scores with the now-accurate context.

---

#### `/zoom-in map` — Analyze project structure

Draws dependency graph, detects SRP violations and circular dependencies. See `references/map.md`.

**Workflow:**

1. Read `SYSTEM.md` and `ARCHITECTURE.md`
2. Trace import/dependency graph across modules
3. Identify: circular dependencies, god modules, leaky abstractions
4. Map data flow: entry points → business logic → data access
5. Produce structural map with findings

**When to re-run**: After structural changes that add, remove, or reorganize modules. Not needed after every refactor — only when the dependency graph itself changes.

---

### Category: Evaluate

#### `/zoom-in audit [scope]` — Full 7-lens evaluation

The core command. Produces a scored report across all seven lenses, then presents a **triaged action path** — not just findings, but which command to run next and in what order. See `references/audit.md`.

**Scope:** module name, file path, package, `@lens-name`, or omit for full project.

**Workflow:**

1. Read `SYSTEM.md` and `ARCHITECTURE.md` (fail if missing, suggest `/zoom-in init`)
2. Read relevant register reference(s)
3. Read relevant framework reference
4. Read all seven lens reference files
5. For each lens, examine the code in scope against its signals
6. Classify every finding: `[principle]`, `[house-style]`, or `[conflict]`
7. Score each lens 1-10 per its rubric
8. If Security ≤ 3 or Domain Integrity ≤ 3: flag 🔴 HARDEN REQUIRED / 🔴 DOMAIN INTEGRITY CRITICAL
9. If Observability ≤ 3: flag 🔴 BLIND SPOT — production issues undetectable
10. Produce the audit report
11. **Triage**: apply lens triage rules to determine the recommended action sequence
12. **Ask the user**: 2-3 targeted questions about priorities and scope
13. Present **Recommended Actions** — ordered command list based on findings and user answers

**After audit completes:**
14. Compare with previous audit (if exists) — calculate deltas per lens
15. Persist to `.zoom-in/context/audits/<scope>/YYYY-MM-DD--score-XX.md`
16. Update `.zoom-in/context/audits/index.md`
17. Auto-cleanup: keep only 2 most recent audits per scope
18. Report: "Previous: X/70 → Current: Y/70 (Delta: +N)"

**Lens triage rules** (applied in order):

| Condition | Primary Action |
|-----------|---------------|
| Security ≤ 3 | `/zoom-in harden` first |
| Domain Integrity ≤ 3 | `/zoom-in focus domain-integrity` first |
| Observability ≤ 3 | `/zoom-in focus observability` first — blind spot in production |
| Any `[conflict]` finding | `/zoom-in adopt` first |
| Any lens ≤ 5 with 🔴 | `/zoom-in focus [lens]` then `/zoom-in refactor` |
| All lenses ≥ 6, only 🟠/⚠️/💡 | `/zoom-in refactor` directly |
| All lenses ≥ 8 | `/zoom-in verify` (light touch — project is healthy) |

**Report format:**

```
## Audit: [scope]

Overall: XX/70

### 1. Clarity — X/10
⚠ [house-style] `path:line` — description
   Why: concrete consequence of this violation
   Reference: [golden reference or principle]
   → Fix: specific, actionable suggestion

### 2. Structure — X/10
🔴 [principle] `path:line` — description
   → Fix: specific suggestion
...

## Recommended Actions
1. `/zoom-in harden` — [SE-1], [SE-3]: security scored 3/10, active risk
2. `/zoom-in adopt` — [CL-5], [ST-3]: [conflict] findings need resolution
3. `/zoom-in refactor` — Apply remaining 🔴/🟠 fixes (7 findings)
4. `/zoom-in verify` — After fixes, confirm no new violations
5. `/zoom-in audit` — Re-audit to validate score improvement
```

**Severity markers:**

- 🔴 Critical — must fix before next release (security holes, data corruption, state machine violations)
- 🟠 High — should fix soon (N+1 on hot paths, missing tests for financial logic, tenant leaks)
- ⚠️ Medium — worth fixing (style inconsistencies, missing docs, minor duplication)
- 💡 Low — nice to have (emerging pattern not yet adopted, legacy code noted)

**Scoring is strict:** 3/10 means real problems. 6/10 means acceptable but needs work. 8/10 means well-executed. 10/10 is nearly impossible — no findings at all in the lens.

---

#### `/zoom-in focus [lens] [scope]` — Deep-dive on one lens

Dedicated depth on a single lens that the audit flagged as weak. Traces root causes, maps
causal chains between findings, and proposes systemic fixes instead of symptom patches. See `references/focus.md`.

**Lens names:** `clarity`, `structure`, `performance`, `security`, `resilience`, `domain-integrity`, `observability`

**When to use**: When a lens scored ≤ 5 in audit, or when you need root-cause analysis before refactoring. `/zoom-in focus security` is valid but `/zoom-in harden` provides richer security-specific workflow.

**Workflow:**

1. Load context + the single lens reference file (faster than full audit)
2. Deep-scan: read every file relevant to the lens in scope (more thorough than audit)
3. Root cause analysis: trace each finding to its causal category (missing convention, wrong convention, missing abstraction, knowledge gap, legacy, isolated)
4. Map causal chains: multiple surface findings sharing a root cause → one systemic fix
5. Score the lens (may differ from audit score due to deeper scan)
6. Produce focus report with root causes, causal chains, and remediation plan
7. Recommend next steps: adopt missing conventions → refactor point fixes → verify

---

#### `/zoom-in harden [scope]` — Deep security review

Focused Security assessment beyond what the general audit's Security lens covers. OWASP + tenant isolation + compliance. See `references/harden.md`.

**Workflow:**

1. Read `ARCHITECTURE.md` §2 Security patterns
2. Read `references/lens-security.md`
3. Read relevant register reference (SaaS/Enterprise add extra checks)
4. OWASP Top 10 systematic checklist
5. Deep-dive: permissions, secrets, validation, data exposure, auth
6. For each permission gap: trace the full endpoint → handler → data access chain
7. Produce security-focused report with severity ratings and immediate fixes
8. Recommend: `/zoom-in refactor` for fixes → `/zoom-in verify` for confirmation

---

### Category: Fix

#### `/zoom-in refactor [scope]` — Apply audit fixes

Applies fixes from a previous audit or focus. Not a new evaluation — an execution step. See `references/refactor.md`.

**Scope:** supports the same scope as audit — module name, file path, or omit for all findings from the most recent audit.

**Workflow:**

1. Locate audit: check `.zoom-in/context/audits/` first, then conversation history
2. Sort findings by severity (🔴 first, then 🟠, then ⚠️)
3. Validate each finding is still current before fixing
4. For each finding in scope: implement the suggested fix following house style
5. After fixes: run project-specific verification (lint, typecheck, tests as applicable)
6. Update `ARCHITECTURE.md` §4 (Known Exceptions) for any finding intentionally left unfixed
7. If any `[conflict]` findings remain unresolved → recommend `/zoom-in adopt`
8. **After refactor completes**: recommend `/zoom-in verify` to confirm fixes, then `/zoom-in audit` for authoritative scores

---

#### `/zoom-in verify [scope]` — Post-fix verification pass

Lightweight check that recent fixes achieved their goal without introducing new violations.
Targeted and fast — checks only the areas that changed, not the whole project. See `references/verify.md`.

**Workflow:**

1. Load the most recent audit + refactor results
2. For each "Fixed" finding: verify the fix is valid in current code
3. Scan change zones for new violations across all 7 lenses (quick, not full depth)
4. Estimate score improvement per lens
5. Produce verification report: ✅ Confirmed / ⚠️ Partial / 🔴 Regressed / ❌ Not Fixed
6. Recommend next step based on verification results

**Verification outcomes drive the next action:**

| Result | Next Step |
|--------|-----------|
| All ✅ Confirmed, no new violations | `/zoom-in audit` for authoritative scores |
| Any 🔴 Regressed | `/zoom-in refactor` — fix the regression immediately |
| Any ⚠️ Partial | `/zoom-in refactor` — complete the partial fix |
| New violations detected | `/zoom-in refactor` — address new violations |

---

### Category: Evolve

#### `/zoom-in adopt "<decision>"` — Register a new architectural decision

Adds a team decision to ARCHITECTURE.md and DECISIONS.md that becomes enforced in future audits. See `references/adopt.md`.

**Auto-trigger**: When any evaluation command (audit, focus, harden) produces a `[conflict]` finding, the recommended actions include `/zoom-in adopt` to settle the conflict before refactoring.

**Workflow:**

1. Parse the decision statement
2. Determine which lens(es) it affects
3. Add full ADR to `DECISIONS.md` with context, reasoning, and consequences
4. Add summary entry to `ARCHITECTURE.md` §3 (Adopted Decisions) with date and rationale
5. If the decision establishes a new pattern → update §2 (Established Patterns) for the relevant lens
6. If the decision conflicts with an existing Established pattern → flag the conflict and ask for confirmation before updating
7. Add a golden reference if the decision specifies one

**Variant:** `/zoom-in adopt --ban "<pattern>"` — Add a project-specific anti-pattern ban to `ANTI-PATTERNS.md`. This registers a pattern the team has decided to reject. The ban is enforced in all future audits and plan commands.

**Example decisions:**

- `/zoom-in adopt "all new services must return structured result objects, not raw dicts"` → Structure + Clarity
- `/zoom-in adopt "every background job must have retry policy and idempotency key"` → Performance + Resilience
- `/zoom-in adopt "API handlers must validate input with schema, never trust raw payload"` → Security + Clarity
- `/zoom-in adopt --ban "direct ORM calls in API handlers — all data access through repository layer"` → adds ban to ANTI-PATTERNS.md

---

#### `/zoom-in plan [feature]` — Architectural plan for a new feature

Designs a feature following established house style so it won't need an audit later. See `references/plan.md`.

**Workflow:**

1. Read `ARCHITECTURE.md` §2 (Established Patterns) and §6 (Golden References)
2. Read `SYSTEM.md` for register and framework context
3. Design the feature across all applicable layers (models → controllers/handlers → services → tasks/jobs → tests)
4. Every design decision justified by: "because Established pattern in [golden reference] does X"
5. Check the plan against each lens preemptively (will this design pass a future audit?)
6. Produce the plan

---

## Recommended Workflow

The workflow is **branching, not linear**. The audit's triage step determines which path
to follow based on what was actually found.

```
/zoom-in init              ← First time in project
      ↓
/zoom-in map               ← Understand current state (existing projects)
      ↓
/zoom-in audit             ← Full evaluation + triage
      ↓
   [triage branches based on findings]
      │
      ├─ Security ≤ 3? ────→ /zoom-in harden ──→ /zoom-in refactor ──→ /zoom-in verify
      │
      ├─ [conflict] found? ─→ /zoom-in adopt ──→ /zoom-in refactor ──→ /zoom-in verify
      │
      ├─ Lens ≤ 5? ────────→ /zoom-in focus [lens] ──→ /zoom-in refactor ──→ /zoom-in verify
      │
      └─ Straightforward? ──→ /zoom-in refactor ──→ /zoom-in verify
                                   ↓
                             /zoom-in audit ──→ (loop or stable)

/zoom-in re-init           ← When skill updates or context goes stale
      ↓                        (syncs context with code + skill)
/zoom-in audit             ← Re-audit with accurate context
```

**After any fix cycle** (refactor → verify), re-run `/zoom-in audit` to confirm score
improvement with authoritative scores. If the audit shows further issues, the loop
continues. If all lenses ≥ 8, the project is stable.

**For new features**, run `/zoom-in plan` before implementation to ensure the feature
conforms to house style and won't introduce new audit findings.

## Finding Format

Every finding must include:

- **Location**: File and line/module
- **Classification**: [principle] | [house-style] | [conflict]
- **Why it matters**: Concrete consequence (not "it's bad practice")
- **Golden reference**: Established pattern or universal principle
- **Fix suggestion**: Specific, actionable change

For `[conflict]` findings, don't pick a side — present both approaches and suggest `/zoom-in adopt` to settle. **Auto-recommend** `/zoom-in adopt` when any `[conflict]` finding appears in audit, focus, or harden results. **When adopt is auto-triggered, proposed decisions are DRAFTS** — the user must confirm each one before it is written to any file (see `references/adopt.md` Step 5: Draft Gate).

## Anti-Pattern Rejection (Backend AI Slop)

The skill maintains project-specific rejection rules in `ANTI-PATTERNS.md` (generated by `/zoom-in init`). Universal No-Gos are in `references/anti-patterns.md`. If code violates any ban, the skill refuses to write/approve it and provides the correct alternative.

Common slop patterns include: God classes that mix routing/business/data-access, direct state mutation bypassing lifecycle gates, unchecked raw input deserialization, hardcoded secrets or credentials in source, catch-all exception handlers that swallow errors silently, and "TODO" placeholders in production code paths.

## What zoom-in does NOT do

- Doesn't rewrite code unless `/zoom-in refactor`
- Doesn't enforce stylistic preferences with no basis in the project
- Doesn't flag Known Exceptions listed in ARCHITECTURE.md §4
- Doesn't run tests/CI — suggests what to test, execution is the developer's responsibility
- Doesn't skip verification after fixes — always recommends `/zoom-in verify` then `/zoom-in audit`
- Doesn't present findings without a clear next step — every evaluation includes recommended actions
- Doesn't write decisions to files without explicit user confirmation — adopt always presents drafts first and waits for approval (Draft Gate)
- Doesn't modify audit history — `.zoom-in/context/audits/` is never touched by any command except audit itself
- Doesn't run re-init automatically — it's always user-initiated when context feels stale or skill was updated

## Reading order for the model

SKILL.md → SYSTEM.md → ARCHITECTURE.md → DECISIONS.md → (`.zoom-in/context/decisions/<scope>.md` if Modular) → ANTI-PATTERNS.md → `.zoom-in/context/audits/` (if exists) → `.zoom-in/context/backlog.md` (if exists) → relevant register(s) → relevant framework reference → lens files (only those needed for the command)

| Command | Lens files | Other references |
|---------|-----------|-----------------|
| `/zoom-in init` | all 7 | framework reference, system-template, architecture-template, decisions-template, anti-patterns-template, relevant registers |
| `/zoom-in re-init` | all 7 | init-changelog.md, re-init.md, framework reference, system-template, decisions-template, all existing context files |
| `/zoom-in map` | Structure only | framework reference, DECISIONS.md |
| `/zoom-in audit` | all 7 | register(s), framework reference, DECISIONS.md (+ module decisions if Modular), ANTI-PATTERNS.md, audit-storage.md, backlog.md |
| `/zoom-in focus [lens]` | 1 (specified lens) | register(s), framework reference, DECISIONS.md (+ module decisions if Modular), ANTI-PATTERNS.md, audit-storage.md |
| `/zoom-in plan` | all 7 | register(s), framework reference, DECISIONS.md (+ module decisions if Modular), ANTI-PATTERNS.md |
| `/zoom-in refactor` | as covered by previous audit | ANTI-PATTERNS.md, DECISIONS.md, audit-storage.md, backlog.md |
| `/zoom-in harden` | Security only | register(s), framework reference, ANTI-PATTERNS.md |
| `/zoom-in verify` | all 7 (quick scan only) | audit-storage.md (previous audit + refactor results), backlog.md |
| `/zoom-in adopt` | none | DECISIONS.md, ANTI-PATTERNS.md (if --ban), SYSTEM.md (Decision Structure) |
