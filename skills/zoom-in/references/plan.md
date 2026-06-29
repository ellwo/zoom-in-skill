# `/zoom-in plan [feature]` — Architectural Plan for a New Feature

Plan a feature that conforms to house style and avoids anti-patterns **before** any code is written. Architectural tool — ensures new code strengthens the project rather than adding to debt. Forces the question: "Where does this belong, and how does it fit?"

## Guiding Principle: Explore First

Before writing any plan, read the actual code — never assume, verify. The plan's quality depends entirely on accurate understanding of the existing system. Read relevant models/services/controllers/tests; understand current patterns, base classes, utilities; flag broken/inconsistent code in the plan; if a better approach exists than requested, propose it with reasoning.

## Prerequisites (load in order)

1. `SYSTEM.md` — domain context, critical flows, register selection
2. `ARCHITECTURE.md` — house-style, established patterns, adopted decisions, golden references
3. `DECISIONS.md` — Active decisions that constrain the plan
4. `ANTI-PATTERNS.md` — No-Go patterns the plan must not violate
5. Framework reference — language/framework conventions (ORM, auth, middleware)
6. Register reference(s) — domain-specific rules (SaaS multi-tenancy, Enterprise compliance, etc.)

Planning without context produces generic plans that ignore project conventions. A plan that violates an Active Decision is invalid on arrival.

## 1. Explore

Read all files relevant to the feature before writing a single line of the plan.

**What to read**: models/services the feature will interact with; existing patterns for the target layer (controller/service/model); tests covering adjacent functionality; any doc describing the domain area.

**What to look for**: how existing code solves similar problems; base classes/mixins/utilities to reuse; inconsistencies/broken patterns not to replicate; opportunities to improve existing code within the feature's scope.

A plan written against assumptions produces friction during implementation — ten minutes of reading saves hours of rework.

## 2. Analyze Feature Placement

**Questions**: Does this belong in an existing module, or warrant a new one? If existing: which module, does its responsibility naturally extend to include this? If new: what's its dependency boundary — what does it need from others, what will need from it?

**Module placement heuristics**:
- Core logic about the same domain as an existing module → add to that module
- Crosses multiple domains → orchestration/use-case layer, not a domain module
- Infrastructure (email sending, file storage) → infrastructure module
- Nothing fits → new module, but justify *why* new and not an extension

The most damaging architectural mistake is putting code in the wrong module — once there, moving is expensive and every line written makes it harder.

## 3. Critique — Risk and Invariant Analysis (before designing)

**Against anti-patterns** (ANTI-PATTERNS.md): creates a cross-module dependency that could become circular? bypasses an established layer (e.g. DB directly from controller)? duplicates existing logic? introduces a new way of doing something the project already patterns?

**Against active decisions** (DECISIONS.md): conflicts with any Active Decision? needs to conform to a decision that changes the "obvious" approach?

**Invariant check**: what business rules must never be violated? (reference SYSTEM.md critical flows) what data consistency guarantees must hold? what security boundaries must be respected?

Easier to avoid a mistake than fix one — identifying risks first means the plan incorporates safeguards rather than bolting them on.

## 4. Propose the Plan

Generate a structured plan following the Output Format below. **Key design decisions must include reasoning** — not just WHAT but WHY this approach over alternatives, and what trade-offs were accepted. **Detailed enough** for a developer with zero context to implement without asking questions; if it can't meet this bar, list missing info under Open Questions.

## 5. Anti-Pattern Verification

Review the proposed plan against every No-Go in ANTI-PATTERNS.md. For each: "Does this plan, as designed, violate this pattern?" If yes → redesign that section; do not present a plan with known violations.

**Common traps**: business logic in a controller ("just one rule"); utility function that belongs in a domain service; bypassing the service layer ("the model already has the method"); a new error response format ("this case is different").

The plan is the last chance to catch structural mistakes before they become code — a plan violating a No-Go produces code that fails `/zoom-in audit`.

## 6. Present for Approval

Show the complete plan; wait for explicit approval before any code changes. If user rejects part: revise only the rejected section, keeping approved sections; don't start over unless rejection invalidates the core placement decision.

## Output Format (exact structure)

```
## /zoom-in plan: [Feature Name]

### 1. Exploration Findings
[What you found in the codebase relevant to this feature — existing modules,
services, models, patterns the feature must integrate with]

### 2. Flagged Risks
- 🔴 Critical: [risks that must be addressed in the plan]
- 🟠 High: [risks that should be addressed]
- ⚠️ Medium: [risks to be aware of]

### 3. Architecture Decision
- Decision: [what was decided]
- Reasoning: [why this approach over alternatives]
- Trade-offs: [what was accepted]

### 4. Step-by-Step Plan
[Detailed enough for a developer with zero context to implement without asking
questions. If the plan cannot meet this bar, list what information is missing.]

#### Layer Structure
- Model/Entity changes: [...]
- Service layer: [...]
- Controller/Handler: [...]
- Background tasks: [...]
- Tests: [...]

### 5. Anti-Pattern Check
- ✅ No N+1 queries in proposed design
- ✅ Business logic in service layer, not handlers
- ✅ No secrets in source
- [If any violation: 🚫 Plan violates Anti-Pattern #N — redesign required]

### 6. Open Questions
- [Question 1]
- [Question 2]
```

## Quality Bar

The plan must be detailed enough that a developer with zero context can implement it without asking questions — if it can't meet this bar, list missing info under "Open Questions" rather than proceeding with ambiguous instructions.

**A plan that violates any Anti-Pattern is INVALID** — must be redesigned before presentation. **A plan that ignores an Active Decision from DECISIONS.md is also INVALID** — must conform.

## Failure Modes

| Situation | Response |
|---|---|
| Feature doesn't fit anywhere | Propose a new module with clear boundaries; don't shoehorn |
| Feature conflicts with an Active Decision | Flag the conflict; ask whether to revise the plan or amend the decision |
| No ANTI-PATTERNS.md found | Use universal anti-patterns only; note framework-specific checks skipped |
| No DECISIONS.md found | Proceed but note decision-conformance checks skipped |
| Feature is too large for one plan | Break into sub-features; plan each separately with shared context |
| Exploration reveals broken existing code | Flag in Exploration Findings; propose fix scope (in-plan or separate) |
