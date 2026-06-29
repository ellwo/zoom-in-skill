# `/zoom-in adopt` — Register Architectural Decisions and Banned Patterns

> Every adopted decision makes the next audit stricter. Every adopted ban adds a rejection rule. Standards evolve upward.

---

## Two Modes

| Mode | Command | Writes To |
|---|---|---|
| **Decision (ADR)** | `/zoom-in adopt "<decision>"` | DECISIONS.md + ARCHITECTURE.md §3 |
| **Ban** | `/zoom-in adopt --ban "<anti-pattern>"` | ANTI-PATTERNS.md §5 |

**Why two modes**: Decisions capture what the team *chooses* to do. Bans capture what the team *refuses* to allow. Both deserve enforcement weight, but they serve different purposes and live in different files.

---

## Mode 1: Decision (ADR) — `/zoom-in adopt "<decision>"`

### Purpose

Let teams evolve their architecture by recording decisions that become enforced on future audits. Without `/zoom-in adopt`, decisions live in Slack threads, meeting notes, and tribal knowledge — invisible to automated enforcement. This command makes them real, trackable, and enforceable.

### Chain of Thought

1. **Analyze** — Parse the decision string. Determine which lens(es) it affects and where it fits in DECISIONS.md.
2. **Critique** — Does this decision conflict with existing Active decisions or Established patterns? Is it specific enough to enforce?
3. **Propose** — Draft the ADR entry. Ask for rationale if not provided.
4. **Present as Draft** — Show the proposed decision(s) to the user. **Do NOT write to any file yet.**
5. **Confirm** — Wait for explicit user confirmation (adopt / modify / reject / defer) for each decision.
6. **Execute** — Only after confirmation, update DECISIONS.md (full ADR) and ARCHITECTURE.md §3 (summary index row).

### Step-by-Step

#### Step 1: Load Files

Load DECISIONS.md, ANTI-PATTERNS.md, and ARCHITECTURE.md. If any don't exist, fail with "Run `/zoom-in init` first."

**Why load all three**: A new decision might conflict with an existing decision, a banned pattern, or an established pattern in ARCHITECTURE.md. You need full context to understand the impact.

#### Step 2: Parse the Decision String

The user provides a decision in natural language. Parse it to determine:

- **What the decision is**: The core rule or convention
- **Which lens(es) it affects**: Most decisions touch 1-3 lenses
- **Scope**: Project-wide or module-specific

**Decision → Lens mapping examples**:
| Decision | Lens(es) Affected |
|---|---|
| "All new services must return typed result objects" | Structure, Clarity |
| "Use event-driven communication between modules" | Structure, Resilience |
| "All API endpoints must validate input with schema" | Security, Clarity |
| "No raw SQL queries outside the repository layer" | Structure, Security, Performance |
| "Every external API call must have a circuit breaker" | Resilience, Structure |
| "Business rules live in domain services, never in controllers" | Domain Integrity, Structure |
| "All billing state changes must be logged with before/after" | Observability, Domain Integrity |

**Why lens mapping matters**: When `/zoom-in audit` runs, it checks Active decisions against the relevant lenses. Mapping ensures the audit enforces the decision through the right lens.

#### Step 3: Ask for Rationale

If the user didn't provide rationale, ask: "Why was this decision made? What problem does it solve?"

**Why rationale is required**:
1. Future team members need to understand the *why*, not just the *what*. A decision without rationale is a rule without reason, and rules without reason get ignored.
2. If the decision is later challenged, the rationale provides the original context for evaluation.
3. Rationale distinguishes a deliberate architectural choice from a temporary workaround.

Record the rationale in the ADR — it's part of the decision, not a footnote.

#### Step 4: Check for Conflicts

Compare the new decision against:
- **Active Decisions** in DECISIONS.md: Does the new decision contradict any previous decision?
- **Established Patterns** (ARCHITECTURE.md §2): Does it override or modify an established pattern?
- **Banned Patterns** in ANTI-PATTERNS.md: Does the decision implicitly allow something that's banned?
- **Known Exceptions** (ARCHITECTURE.md §4): Does it invalidate a previously allowed exception?

**If a conflict exists**:
- Flag it explicitly
- Ask whether this decision *supersedes* the conflicting one or if there's a nuance they're missing
- Do not silently override — conflicting records are worse than no records

#### Step 5: Present as Draft → Await Confirmation (MANDATORY)

**This step is non-negotiable.** No decision is written to any file until the user
explicitly confirms it. This applies to both:
- **Direct invocation**: `/zoom-in adopt "decision text"` — user provided the decision
- **Auto-triggered**: audit/focus/harden produced `[conflict]` findings → adopt
  recommends settling them. The proposed decisions are **drafts**, not commands.

**Why this gate exists**: The tool is a *consultant*, not an *autonomous agent*.
Writing decisions to DECISIONS.md without confirmation is acting on behalf of the
user — the user owns the architecture, not the tool. See "The Architect's Rule" below.

**What to do**:

1. **Present each proposed decision** as a formatted draft in the conversation:

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

2. **For each decision, ask the user**:

> "Adopt this decision? Options: **Adopt** / **Modify** / **Reject** / **Defer**"
> - **Adopt**: Write to Active Decisions — enforced by future audits
> - **Modify**: Tell me what to change, I'll present the revised draft
> - **Reject**: Discard this draft — nothing is written
> - **Defer**: Save to Draft Decisions section — not enforced, revisited later

3. **Handle each response**:
   - **Adopt** → Proceed to Step 7 (Update Files) for this decision only
   - **Modify** → Update the draft based on user feedback → re-present → repeat Step 5
   - **Reject** → Discard. If other drafts remain, continue with those
   - **Defer** → Proceed to Step 7 but write to "Draft Decisions" section only
     (NOT Active, NOT Decision Index, NOT ARCHITECTURE.md §3)

4. **Batch mode**: If multiple decisions are proposed at once (e.g., 6 conflicts
   from an audit), present ALL drafts first, then ask the user to confirm/reject
   each one. Do not write any until all are reviewed.

**The Architect's Rule**: The tool proposes, the user disposes. A decision in
DECISIONS.md is law — only the team can make law. The tool's role is to identify
what *could* be decided and draft it well, not to decide unilaterally.

---

#### Step 6: Determine Cascading Changes

A new decision may trigger updates beyond DECISIONS.md.

**Check if the decision**:

**Supersedes an older decision** (update DECISIONS.md):
- Move the old AD to "Superseded Decisions" section
- Update old AD's Status to "Superseded by AD-N"
- Add the Superseded Date
- Keep the full record — don't delete. Future readers need to understand what was decided and why it changed.

**Promotes an Emerging pattern to Established** (update ARCHITECTURE.md §2):
- Move the pattern from Emerging to Established
- Reference the AD-ID in the description

**Creates a new Golden Reference** (update ARCHITECTURE.md §6):
- If an existing module exemplifies this decision, add it as a golden reference
- If none exists yet, note "no reference implementation yet"

**Invalidates a Known Exception** (update ARCHITECTURE.md §4):
- Ask the user whether the decision overrides the exception before removing it

**Changes house-style calibration** (update ARCHITECTURE.md §5):
- If the decision raises the standard for a lens, update §5 to reflect the new baseline

#### Step 7: Update Files

**Precondition**: Step 5 (Draft Gate) must have been completed with explicit
user confirmation for each decision being written. If no confirmation was
received, STOP — do not write anything.

**Decision Structure awareness**: Read SYSTEM.md to determine the project's
decision structure (Flat or Modular — see `/zoom-in init` Step 3).

**If Decision Structure = Flat** (single DECISIONS.md):
→ Write all decisions to `DECISIONS.md` (the behavior described below).

**If Decision Structure = Modular** (global + per-module files):
→ Read the `Scope` field of the decision:
  - `Scope: global` → Write to `DECISIONS.md`
  - `Scope: <module-name>` → Write to `.zoom-in/context/decisions/<module-name>.md`
    (create the file if it doesn't exist, using the same ADR format)

Write the following updates:

**DECISIONS.md** — Full ADR record:
```
## Active Decisions

### AD-7: All services must return typed result objects

- **Status**: Active
- **Date**: 2024-06-14
- **Scope**: global
- **Context**: Services raise exceptions for validation errors, causing unpredictable error handling across the codebase
- **Decision**: All services must return typed result objects (e.g., Result<T, E>). Exceptions reserved for truly unexpected failures.
- **Consequences**: More explicit error handling at call sites; initial migration effort for existing services
- **Affected Lenses**: Structure, Clarity
- **Golden Reference**: (none yet)
```

**ARCHITECTURE.md §3** — Summary index row:
```
| AD-7 | All services must return typed result objects | Structure, Clarity | 2024-06-14 |
```

If the decision supersedes an older one, also update the old record in DECISIONS.md:
```
## Superseded Decisions

### AD-3: Services may raise exceptions for validation errors

- **Status**: Superseded by AD-7
- **Superseded Date**: 2024-06-14
- (original record preserved)
```

**Draft decisions**: If the user proposes a decision but is not ready to confirm:
- Add to "Draft Decisions" section in DECISIONS.md
- Status: Draft
- NOT enforced by audit until confirmed and moved to Active

---

## Mode 2: Ban — `/zoom-in adopt --ban "<anti-pattern>"`

### Purpose

Teams discover project-specific anti-patterns over time that aren't in the universal or framework lists. For example: "Never use raw SQL in this project" or "Don't add new endpoints without rate limiting." These are team conventions that deserve the same enforcement weight as universal bans. `/zoom-in adopt --ban` gives them that weight.

### Step-by-Step

#### Step 1: Parse the Anti-Pattern

The `--ban` argument provides the anti-pattern description. Load ANTI-PATTERNS.md to check for duplicates or conflicts.

#### Step 2: Ask for Justification

1. **"Why is this pattern banned? What should be done instead?"** — Both the reason and the correct alternative must be recorded. A ban without an alternative leaves developers without guidance.

2. **"What's the detection signal? How would audit identify this in code?"** — A ban that can't be detected can't be enforced. The detection signal makes it actionable.

#### Step 3: Add to ANTI-PATTERNS.md §5

Add a new row to the "Team-Added Bans" table:
```
| T-1 | Raw SQL outside repository layer | Bypasses ORM audit trail; untestable | Use ORM or repository methods only | team | 2024-06-14 |
```

This ban is now enforced by `/zoom-in audit` as `[principle]` 🟠 High — the same severity as universal bans.

---

## The Escalation Principle

Every `/zoom-in adopt` makes the next `/zoom-in audit` stricter. This is by design.

**Before a decision is adopted**: A pattern is Emerging, and deviations are flagged as 💡 Low or ⚠️ Medium at most.

**After a decision is adopted**: The same deviation becomes a `[principle]` violation at ⚠️ Medium minimum, because it now violates an Active decision in DECISIONS.md.

**After a ban is adopted**: Any code matching the banned pattern becomes a `[principle]` 🟠 High violation, because ANTI-PATTERNS.md now explicitly rejects it.

**This creates upward pressure**: The project's standards tighten over time as the team learns and records better practices. Code that passed audit last month might not pass this month — and that's the point. The architecture evolves with the team's understanding.

---

## Integration with Other Commands

- `/zoom-in init` creates initial DECISIONS.md, ANTI-PATTERNS.md, and ARCHITECTURE.md
- `/zoom-in audit` enforces Active decisions from DECISIONS.md + all bans from ANTI-PATTERNS.md
- `/zoom-in focus` may reveal missing conventions that should be adopted as decisions
- `/zoom-in plan` checks Active decisions and bans to ensure new features conform
- `/zoom-in refactor` may trigger `/zoom-in adopt` (decision) or `/zoom-in adopt --ban` (pattern discovered during refactoring)
- `/zoom-in harden` may trigger `/zoom-in adopt` for security-related decisions or `/zoom-in adopt --ban` for security anti-patterns
- `/zoom-in verify` may flag partial fixes that need `/zoom-in adopt` to settle conflicts

**Auto-trigger rule**: When any evaluation command (audit, focus, harden) produces a
`[conflict]` finding, the recommended actions must include `/zoom-in adopt` to settle
the conflict before refactoring. Refactoring a [conflict] without adopting a decision
means the fix direction is ambiguous — both approaches have equal standing until the
team chooses.

**Auto-trigger produces DRAFTS, not commands**: When `adopt` is triggered by
`[conflict]` findings, it must present proposed decisions as **drafts** (Step 5:
Draft Gate). The user confirms, modifies, rejects, or defers each one. The tool
must never write decisions to files without explicit per-decision confirmation.

**Decision Structure awareness**: When loading files in Step 1, also read SYSTEM.md
to determine whether the project uses Flat or Modular decision structure (see
`/zoom-in init` Step 3). This determines where decisions are written in Step 7.

---

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
| Tool attempts to write without Draft Gate confirmation | **HARD STOP** — this is a design violation. Return to Step 5 and present drafts. Never write unconfirmed decisions. |
| SYSTEM.md Decision Structure field missing | Default to Flat (single DECISIONS.md). Warn: "Decision Structure not set in SYSTEM.md — defaulting to Flat. Re-run /zoom-in init to configure." |
