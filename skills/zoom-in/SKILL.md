---
name: zoom-in
description: Strict architectural audit, planning, and enforcement for backend systems. Scores code across 7 lenses (Clarity, Structure, Performance, Security, Resilience, Domain Integrity, Observability), enforces golden-pattern laws, and generates an adaptive ARCHITECTURE.md house-style file. Use this skill whenever the user wants to audit code quality, review architecture, plan a feature with strict conventions, harden security, optimize performance, refactor code, or establish/evolve project conventions — even if they don't explicitly say "zoom-in" or "audit." Also use when the user asks about code quality, technical debt, best practices for their backend project, or wants to enforce consistency across modules.
version: 1.1.0 # x-release-please-version
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

Scans the project, detects framework, interviews the user, and generates four foundational documents: `SYSTEM.md`, `ARCHITECTURE.md`, `DECISIONS.md`, and `ANTI-PATTERNS.md`. Everything else depends on these files.

**Produces:** `SYSTEM.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `ANTI-PATTERNS.md` at project root.

Framework detection, golden reference discovery, interview, output file generation, merge-on-existing behavior, after-init next steps: see `references/init.md`.

---

#### `/zoom-in re-init` — Evolution sync for existing projects

Synchronizes existing context files with the current skill version and codebase state. Detects schema gaps (new skill features missing from context), codebase drift (patterns/golden references that went stale), and untracked changes (edits made outside proper process). Not for new projects — use `/zoom-in init`.

**Fails if:** no `SYSTEM.md` or `ARCHITECTURE.md` → suggest `/zoom-in init`.

When to use, gap analysis, drift check, orphaned decisions, interactive repair, Flat↔Modular switching: see `references/re-init.md`.

---

#### `/zoom-in map` — Analyze project structure

Draws the dependency graph, detects SRP violations, circular dependencies, and layer breaches. The diagnostic foundation for audits, plans, and refactors.

**Produces:** structural map — module inventory, dependency graph, violations, technical debt summary.

Module inventory, dependency tracing, violation detection, layer analysis, when to re-run: see `references/map.md`.

---

### Category: Evaluate

#### `/zoom-in audit [scope]` — Full 7-lens evaluation

The core command. Scored report across all seven lenses + triaged action path — not just findings, but which command to run next and in what order.

**Scope:** module name, file path, package, `@lens-name`, or omit for full project.
**Produces:** scored report (max 70), recommended action sequence, persisted audit in `.zoom-in/context/audits/<scope>/`.
**Fails if:** `SYSTEM.md` or `ARCHITECTURE.md` missing → suggest `/zoom-in init`.

Full workflow, lens triage rules, report format, severity markers, scoring, change detection, backlog review, delta comparison, persistence, sub-agent strategy: see `references/audit.md`.

---

#### `/zoom-in focus [lens] [scope]` — Deep-dive on one lens

Dedicated depth on a single lens that the audit flagged as weak. Traces root causes, maps causal chains between findings, and proposes systemic fixes instead of symptom patches.

**Scope:** one of `clarity`, `structure`, `performance`, `security`, `resilience`, `domain-integrity`, `observability` + optional module/file scope.
**Produces:** focus report with root causes, causal chains, remediation plan; appended to the most recent audit for the scope.
**Fails if:** `SYSTEM.md` or `ARCHITECTURE.md` missing → suggest `/zoom-in init`; invalid lens name.

When to use, deep scan, root cause categories, causal chains, focus report format, persistence: see `references/focus.md`.

---

#### `/zoom-in harden [scope]` — Deep security review

Focused security assessment beyond the audit's Security lens: OWASP Top 10, tenant isolation, compliance. Always recommended when Security ≤ 3.

**Scope:** module, file path, or omit for full project.
**Produces:** security-focused report with OWASP-categorized findings, severity ratings, remediation priority.

OWASP checklist, deep checks (auth, authz, input, data exposure, config, dependencies, compliance), decision/ban compliance, report format: see `references/harden.md`.

---

### Category: Fix

#### `/zoom-in refactor [scope]` — Apply audit fixes

Applies fixes from a previous audit, focus, or harden. Not a new evaluation — an execution step. Each fix traces back to a specific finding.

**Scope:** module, file path, `@lens-name`, or omit for all findings from the most recent audit.
**Produces:** fix summary (per-finding status), `ARCHITECTURE.md` updates for evolved patterns, backlog entries for deferred findings.
**Fails if:** no previous audit found (persisted or in conversation) → suggest `/zoom-in audit`.

Finding prioritization, validation, fix application, house-style conformance, ARCHITECTURE.md updates, backlog deferral, close-the-loop: see `references/refactor.md`.

---

#### `/zoom-in verify [scope]` — Post-fix verification pass

Lightweight check that recent fixes achieved their goal without introducing new violations. Targeted and fast — checks only the areas that changed, not the whole project.

**Scope:** module, file path, or omit for all fixes from the most recent audit/refactor.
**Produces:** verification report (✅ Confirmed / ⚠️ Partial / 🔴 Regressed / ❌ Not Fixed), new-violation scan, score estimate.
**Fails if:** no previous audit or refactor found → suggest `/zoom-in audit`.

Fix verification, new-violation scan, backlog side-effect check, score estimate, outcome→next-step table: see `references/verify.md`.

---

### Category: Evolve

#### `/zoom-in adopt "<decision>"` — Register a new architectural decision

Adds a team decision to `DECISIONS.md` and `ARCHITECTURE.md` §3 that becomes enforced in future audits. **Draft Gate mandatory**: nothing is written until the user confirms each decision.

**Variant:** `/zoom-in adopt --ban "<pattern>"` — add a project-specific anti-pattern ban to `ANTI-PATTERNS.md` §5.

**Produces:** ADR record in `DECISIONS.md`, summary row in `ARCHITECTURE.md` §3, optional golden reference; or a new ban row in `ANTI-PATTERNS.md` §5.
**Fails if:** no `DECISIONS.md` or `ANTI-PATTERNS.md` → suggest `/zoom-in init`.
**Auto-trigger:** when any evaluation command produces a `[conflict]` finding, recommended actions include `/zoom-in adopt` (proposed decisions are drafts, not commands).

Decision parsing, lens mapping, conflict detection, Draft Gate, cascading changes, Flat/Modular write targets, ban mode, escalation principle: see `references/adopt.md`.

---

#### `/zoom-in plan [feature]` — Architectural plan for a new feature

Designs a feature following established house style so it won't need an audit later. Reads the code first (Explore First), then designs across all applicable layers.

**Produces:** structured plan — exploration findings, flagged risks, architecture decision, step-by-step plan, anti-pattern check, open questions.

Explore-first, feature placement, risk/invariant analysis, anti-pattern verification, output format, quality bar: see `references/plan.md`.

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
| `/zoom-in init` | all 7 | **init.md**, framework reference, system-template, architecture-template, decisions-template, anti-patterns-template, relevant registers |
| `/zoom-in re-init` | all 7 | **re-init.md**, init-changelog.md, framework reference, system-template, decisions-template, all existing context files |
| `/zoom-in map` | Structure only | **map.md**, framework reference, DECISIONS.md |
| `/zoom-in audit` | all 7 | **audit.md**, register(s), framework reference, DECISIONS.md (+ module decisions if Modular), ANTI-PATTERNS.md, audit-storage.md, backlog.md |
| `/zoom-in focus [lens]` | 1 (specified lens) | **focus.md**, register(s), framework reference, DECISIONS.md (+ module decisions if Modular), ANTI-PATTERNS.md, audit-storage.md |
| `/zoom-in plan` | all 7 | **plan.md**, register(s), framework reference, DECISIONS.md (+ module decisions if Modular), ANTI-PATTERNS.md |
| `/zoom-in refactor` | as covered by previous audit | **refactor.md**, ANTI-PATTERNS.md, DECISIONS.md, audit-storage.md, backlog.md |
| `/zoom-in harden` | Security only | **harden.md**, register(s), framework reference, ANTI-PATTERNS.md |
| `/zoom-in verify` | all 7 (quick scan only) | **verify.md**, audit-storage.md (previous audit + refactor results), backlog.md |
| `/zoom-in adopt` | none | **adopt.md**, DECISIONS.md, ANTI-PATTERNS.md (if --ban), SYSTEM.md (Decision Structure) |
