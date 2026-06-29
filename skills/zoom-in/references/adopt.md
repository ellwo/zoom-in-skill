# `/zoom-in adopt` — Register Architectural Decisions and Banned Patterns

Every adopted decision makes the next audit stricter; every adopted ban adds a rejection rule. Standards evolve upward.

## Two Modes

| Mode | Command | Writes To |
|---|---|---|
| **Decision (ADR)** | `/zoom-in adopt "<decision>"` | DECISIONS.md + ARCHITECTURE.md §3 |
| **Ban** | `/zoom-in adopt --ban "<anti-pattern>"` | ANTI-PATTERNS.md §5 |

---

## Mode 1: Decision (ADR)

### Step 1: Load Files

Load `DECISIONS.md`, `ANTI-PATTERNS.md`, `ARCHITECTURE.md`. Also read `SYSTEM.md` for Decision Structure (Flat/Modular — determines write target in Step 7). If any don't exist → fail: "Run `/zoom-in init` first."

### Step 2: Parse the Decision String

Parse the natural-language decision into: **what** (core rule), **which lens(es)** (1-3 typically), **Scope** (global or module).

**Decision → Lens mapping examples:**
| Decision | Lens(es) |
|---|---|
| "All new services must return typed result objects" | Structure, Clarity |
| "Use event-driven communication between modules" | Structure, Resilience |
| "All API endpoints must validate input with schema" | Security, Clarity |
| "No raw SQL queries outside the repository layer" | Structure, Security, Performance |
| "Every external API call must have a circuit breaker" | Resilience, Structure |
| "Business rules live in domain services, never in controllers" | Domain Integrity, Structure |
| "All billing state changes must be logged with before/after" | Observability, Domain Integrity |

### Step 3: Ask for Rationale

If not provided, ask: "Why was this decision made? What problem does it solve?" **Rationale is required** — record it in the ADR (part of the decision, not a footnote). Without it, a challenged decision has no original context and a deliberate choice is indistinguishable from a temporary workaround.

### Step 4: Check for Conflicts

Compare the new decision against 4 sources:
- **Active Decisions** (DECISIONS.md) — does it contradict a previous decision?
- **Established Patterns** (ARCHITECTURE.md §2) — does it override/modify one?
- **Banned Patterns** (ANTI-PATTERNS.md) — does it implicitly allow something banned?
- **Known Exceptions** (ARCHITECTURE.md §4) — does it invalidate an allowed exception?

**If conflict**: flag explicitly; ask whether this decision *supersedes* the conflicting one or there's a nuance they're missing; **never silently override** — conflicting records are worse than no records.

### Step 5: Present as Draft → Await Confirmation (MANDATORY Draft Gate)

**Non-negotiable.** No decision is written to any file until the user explicitly confirms it. Applies to both direct invocation (`/zoom-in adopt "..."`) and auto-triggered (audit/focus/harden `[conflict]` findings → proposed decisions are **drafts, not commands**).

**Present each proposed decision as a formatted draft:**
```
### DRAFT: AD-N — [Decision Title]
- **Scope**: [global / <module-name>]
- **Affected Lenses**: [lenses]
- **Context**: [why this decision is needed]
- **Decision**: [what was decided — specific enough to enforce]
- **Consequences**:
  - Positive: [what improves]
  - Negative: [what tradeoff was accepted]
- **Golden Reference**: [file path or "Pending implementation"]
- **Conflicts resolved** (if auto-triggered): [list of finding IDs this settles]
```

**Ask per decision**: "Adopt / Modify / Reject / Defer?"
- **Adopt** → proceed to Step 7 (write to Active Decisions)
- **Modify** → update draft from feedback → re-present → repeat Step 5
- **Reject** → discard (continue with other drafts if any)
- **Defer** → write to "Draft Decisions" section only (NOT Active, NOT Index, NOT §3)

**Batch mode**: if multiple decisions proposed (e.g. 6 conflicts from an audit), present ALL drafts first, then confirm/reject each — write nothing until all reviewed.

**The Architect's Rule**: the tool proposes, the user disposes. A decision in DECISIONS.md is law — only the team can make law. The tool drafts well; it does not decide unilaterally.

### Step 6: Determine Cascading Changes

A new decision may trigger updates beyond DECISIONS.md:
- **Supersedes an older AD** (DECISIONS.md): move old AD to "Superseded Decisions"; set Status "Superseded by AD-N"; add Superseded Date; **keep the full record** (don't delete — future readers need what was decided and why it changed)
- **Promotes Emerging → Established** (ARCHITECTURE.md §2): move pattern, reference the AD-ID
- **Creates a Golden Reference** (§6): add if an existing module exemplifies it; else note "no reference implementation yet"
- **Invalidates a Known Exception** (§4): ask the user before removing
- **Changes house-style calibration** (§5): if the decision raises a lens's standard, update §5

### Step 7: Update Files

**Precondition**: Step 5 Draft Gate completed with explicit confirmation. If no confirmation received → **STOP, write nothing**.

**Decision Structure awareness** (from SYSTEM.md):
- **Flat** → write all decisions to `DECISIONS.md`
- **Modular** → `Scope: global` → `DECISIONS.md`; `Scope: <module>` → `.zoom-in/context/decisions/<module>.md` (create if doesn't exist, same ADR format)

**DECISIONS.md — full ADR record:**
```
## Active Decisions

### AD-N: [Decision Title]
- **Status**: Active
- **Date**: YYYY-MM-DD
- **Scope**: [global / <module>]
- **Context**: [why needed]
- **Decision**: [what was decided — specific enough to enforce]
- **Consequences**: [what becomes easier/harder/irreversible]
- **Affected Lenses**: [lenses]
- **Golden Reference**: [file path or "(none yet)"]
```

**ARCHITECTURE.md §3 — summary index row:**
```
| AD-N | [Decision Title] | [Lenses] | YYYY-MM-DD |
```

**If superseding an older AD**, also update the old record:
```
## Superseded Decisions
### AD-3: [old title]
- **Status**: Superseded by AD-N
- **Superseded Date**: YYYY-MM-DD
- (original record preserved)
```

**Draft decisions** (user defers): add to "Draft Decisions" section, Status: Draft — NOT enforced by audit until confirmed and moved to Active.

---

## Mode 2: Ban — `/zoom-in adopt --ban "<anti-pattern>"`

### Step 1: Parse the Anti-Pattern

Load `ANTI-PATTERNS.md`; check for duplicates or conflicts with the `--ban` argument.

### Step 2: Ask for Justification (2 questions, both required)

1. **"Why is this pattern banned? What should be done instead?"** — both reason AND correct alternative must be recorded (a ban without an alternative leaves developers without guidance).
2. **"What's the detection signal? How would audit identify this in code?"** — a ban that can't be detected can't be enforced.

### Step 3: Add to ANTI-PATTERNS.md §5 (Team-Added Bans)

```
| T-N | [pattern] | [reason] | [correct alternative] | team | YYYY-MM-DD |
```
Example: `| T-1 | Raw SQL outside repository layer | Bypasses ORM audit trail; untestable | Use ORM or repository methods only | team | 2024-06-14 |`

This ban is now enforced by `/zoom-in audit` as `[principle]` 🟠 High — same severity as universal bans.

---

## The Escalation Principle

Every `/zoom-in adopt` makes the next audit stricter — by design.

| State | Deviation severity |
|---|---|
| Before a decision is adopted | Emerging pattern → deviations 💡 Low or ⚠️ Medium max |
| After a decision is adopted | Same deviation → `[principle]` ⚠️ Medium minimum (violates Active AD) |
| After a ban is adopted | Code matching the banned pattern → `[principle]` 🟠 High (ANTI-PATTERNS.md rejects it) |

Code that passed audit last month might not pass this month — the architecture evolves with the team's understanding.

## Auto-Trigger Rule

When any evaluation command (audit, focus, harden) produces a `[conflict]` finding, the recommended actions **must include** `/zoom-in adopt` to settle the conflict before refactoring. Refactoring a `[conflict]` without adopting means the fix direction is ambiguous — both approaches have equal standing until the team chooses.

**Auto-trigger produces DRAFTS, not commands**: present proposed decisions as drafts (Step 5 Draft Gate). The user confirms/modifies/rejects/defers each. Never write decisions without explicit per-decision confirmation.

## Failure Modes

| Situation | Response |
|---|---|
| No DECISIONS.md or ANTI-PATTERNS.md | Fail: "Run `/zoom-in init` first" |
| Decision is too vague to enforce | Ask: "What exactly should be checked? Give a concrete rule." |
| Decision conflicts with existing Active decision | Flag; ask whether it supersedes or amends the existing decision |
| Decision contradicts framework convention | Flag; suggest whether it should be a Known Exception instead |
| Ban duplicates an existing ban in ANTI-PATTERNS.md | Flag the duplicate; ask whether to strengthen or replace |
| Ban contradicts an Active decision | Flag the conflict; resolve before adding |
| User adopts a decision that weakens standards | Allow it — the team owns the architecture — but flag the impact in the ADR |
| Tool attempts to write without Draft Gate confirmation | **HARD STOP** — design violation. Return to Step 5 and present drafts. Never write unconfirmed decisions. |
| SYSTEM.md Decision Structure field missing | Default to Flat (single DECISIONS.md). Warn: "Decision Structure not set — defaulting to Flat. Re-run /zoom-in init to configure." |
