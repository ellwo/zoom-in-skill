# `/zoom-in plan [feature]` — Architectural Plan for a New Feature

> Design before you code. A plan that follows house-style is a plan that survives review.

---

## Guiding Principle: Explore First

Before writing any plan, read the actual code. Never assume what the codebase does — verify. The plan's quality depends entirely on the accuracy of your understanding of the existing system.

Specifically:
- Read relevant models, services, controllers, and tests before planning
- Understand current patterns, conventions, base classes, and utilities
- If you find something broken or inconsistent, flag it in the plan
- If a better approach exists than what the user requested, propose it with reasoning

---

## Purpose

Plan a feature that conforms to house style and avoids anti-patterns **before** any code is written. This is not a project management tool — it's an architectural tool that ensures new code strengthens the project rather than adding to its debt.

**Why this matters**: Features added without architectural consideration are the primary source of technical debt. Each "quick fix" or "just put it here for now" decision compounds. `/zoom-in plan` forces the question: "Where does this belong, and how does it fit?"

---

## Chain of Thought

1. **Explore** — Read the code. Understand what exists before planning what's new.
2. **Analyze** — Where does this feature fit in the existing architecture? What does it need to interact with?
3. **Critique** — What could go wrong? What invariants must be maintained? What anti-patterns might this feature accidentally introduce?
4. **Propose** — Generate a structured plan that respects house-style and avoids No-Go patterns.
5. **Verify** — Check the plan against anti-patterns and active decisions before presenting.
6. **Execute** — Present the plan for user approval before any code changes.

---

## Prerequisites

Load in order:
1. **SYSTEM.md** — Domain context, critical flows, register selection
2. **ARCHITECTURE.md** — House-style, established patterns, adopted decisions, golden references
3. **DECISIONS.md** — Active decisions that constrain the plan
4. **ANTI-PATTERNS.md** — No-Go patterns that the plan must not violate
5. **Framework reference** — Language/framework conventions (ORM patterns, auth, middleware)
6. **Register reference(s)** — Domain-specific rules (SaaS multi-tenancy, Enterprise compliance, etc.)

**Why prerequisites matter**: Planning without context produces generic plans that ignore the project's specific conventions. A plan that says "add a service layer" is useless if the project already has a service layer with specific patterns to follow. A plan that violates an Active Decision from DECISIONS.md is invalid on arrival.

---

## Step-by-Step Process

### Step 0: Explore

Read all files relevant to the feature before writing a single line of the plan.

**What to read**:
- Models and services the feature will interact with
- Existing patterns for the layer the feature targets (controller, service, model)
- Tests that cover adjacent functionality
- Any doc that describes the domain area

**What to look for**:
- How existing code solves similar problems
- Base classes, mixins, or utilities the feature should reuse
- Inconsistencies or broken patterns that the feature should not replicate
- Opportunities to improve existing code as part of the feature's scope

**Why explore first**: A plan written against assumptions instead of actual code is a plan that will produce friction during implementation. Ten minutes of reading saves hours of rework.

### Step 1: Analyze Feature Placement

Determine where the feature fits in the existing architecture.

**Questions to answer**:
- Does this feature belong in an existing module, or does it warrant a new one?
- If existing: which module, and does the module's current responsibility naturally extend to include this?
- If new: what is its dependency boundary? What does it need from other modules? What will need from it?

**Module placement heuristics**:
- If the feature's core logic is about the same domain as an existing module → add to that module
- If the feature crosses multiple domains → it may be an orchestration/use-case layer, not a domain module
- If the feature is infrastructure (email sending, file storage) → it belongs in an infrastructure module
- If nothing fits → new module, but justify *why* it's new and not an extension

**Why placement matters first**: The most damaging architectural mistake is putting code in the wrong module. Once a feature is in the wrong place, moving it is expensive and every line of code written makes it harder.

### Step 2: Critique — Risk and Invariant Analysis

Before designing the solution, identify what could go wrong.

**Check against anti-patterns** (from ANTI-PATTERNS.md):
- Does this feature create a new cross-module dependency that could become circular?
- Does the feature bypass an established layer (e.g., calling the database directly from a controller)?
- Does the feature duplicate logic that already exists elsewhere?
- Does the feature introduce a new way of doing something the project already has a pattern for?

**Check against active decisions** (from DECISIONS.md):
- Does this feature conflict with any Active Decision?
- Does this feature need to conform to a decision that changes the "obvious" approach?

**Invariant check**:
- What business rules must never be violated by this feature? (Reference SYSTEM.md critical flows)
- What data consistency guarantees must be maintained?
- What security boundaries must be respected?

**Why critique before propose**: It's easier to avoid a mistake than to fix one. Identifying risks first means the plan can incorporate safeguards rather than bolt them on afterward.

### Step 3: Propose the Plan

Generate a structured plan following the Output Format below.

**Key design decisions must include reasoning** — not just WHAT was decided, but WHY this approach over alternatives, and what trade-offs were accepted.

**The plan must be detailed enough** for a developer with zero context to implement without asking questions. If the plan cannot meet this bar, list what information is missing under Open Questions.

### Step 4: Anti-Pattern Verification

Review the proposed plan against every No-Go pattern in ANTI-PATTERNS.md.

**For each No-Go pattern, ask**: "Does this plan, as designed, violate this pattern?"

If yes → redesign that section. Do not present a plan with known violations.

**Common traps**:
- Adding business logic to a controller because "it's just one rule"
- Creating a utility function that actually belongs in a domain service
- Bypassing the service layer because "the model already has the method"
- Adding a new error response format because "this case is different"

**Why this verification matters**: The plan is the last chance to catch structural mistakes before they become code. A plan that violates a No-Go pattern will produce code that fails `/zoom-in audit`.

### Step 5: Present for Approval

Show the complete plan to the user. Wait for explicit approval before any code changes.

**If the user rejects part of the plan**: Revise only the rejected section, keeping the approved sections. Do not start over unless the rejection invalidates the core placement decision.

---

## Output Format

Every `/zoom-in plan` must produce output in this exact structure:

```
## /zoom-in plan: [Feature Name]

### 1. Exploration Findings
[What you found in the codebase relevant to this feature — existing modules,
services, models, patterns that the feature must integrate with]

### 2. Flagged Risks
[What could go wrong — existing code that may conflict, invariants that must
be maintained, performance concerns, security implications]
- 🔴 Critical: [risks that must be addressed in the plan]
- 🟠 High: [risks that should be addressed]
- ⚠️ Medium: [risks to be aware of]

### 3. Architecture Decision
[Key design decisions with clear reasoning — WHY this approach, not just WHAT]
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
[Explicit verification that the plan does not violate any No-Go from ANTI-PATTERNS.md]
- ✅ No N+1 queries in proposed design
- ✅ Business logic in service layer, not handlers
- ✅ No secrets in source
- [If any violation is found: 🚫 Plan violates Anti-Pattern #N — redesign required]

### 6. Open Questions
[Anything that needs clarification before or during implementation]
- [Question 1]
- [Question 2]
```

---

## Integration with Other Commands

- `/zoom-in init` provides the context the plan is built on
- `/zoom-in map` provides the dependency graph that informs placement
- `/zoom-in focus [lens]` can provide root-cause context for weak areas that the plan should address
- `/zoom-in audit` after implementation validates the code matches the plan
- `/zoom-in verify` after implementation confirms no new violations introduced
- `/zoom-in adopt` can record decisions made during planning as enforced rules

---

## Failure Modes

| Situation | Response |
|---|---|
| Feature doesn't fit anywhere | Propose a new module with clear boundaries; don't shoehorn |
| Feature conflicts with an Active Decision | Flag the conflict; ask whether to revise the plan or amend the decision |
| No ANTI-PATTERNS.md found | Use universal anti-patterns only; note that framework-specific checks were skipped |
| No DECISIONS.md found | Proceed but note that decision-conformance checks were skipped |
| Feature is too large for one plan | Break into sub-features; plan each separately with shared context |
| Exploration reveals broken existing code | Flag in Exploration Findings; propose fix scope (in-plan or separate) |

---

## Quality Bar

The plan must be detailed enough that a developer with zero context can implement it without asking questions. If the plan cannot meet this bar, list what information is missing under "Open Questions" rather than proceeding with ambiguous instructions.

A plan that violates any Anti-Pattern is INVALID — it must be redesigned before presentation. A plan that ignores an Active Decision from DECISIONS.md is also INVALID — it must conform.
