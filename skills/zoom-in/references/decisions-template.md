# DECISIONS.md Template

This template defines the structure of `DECISIONS.md` (the Architectural
Constitution) at the project root. When `/zoom-in init` generates the file,
it follows this structure. This file records architectural decisions in ADR
(Architecture Decision Record) format — not just *what* was decided, but
*why*, *under what circumstances*, and *what the consequences are*.

---

> **This file is LIVING.** It grows with every `/zoom-in adopt` decision and
> shrinks only when decisions are superseded. It is the authoritative record
> of what this project has agreed to and why.

---

```markdown
# DECISIONS.md — Architectural Constitution

> Every decision here is enforced by `/zoom-in audit`.
> To add a decision: `/zoom-in adopt "<decision>"`
> To supersede a decision: `/zoom-in adopt "<new decision>"` (reference the old AD-ID)
> Decisions here are referenced by ARCHITECTURE.md §3 (summary index).

---

## Active Decisions

<!-- INIT INSTRUCTION:
     During init, the model populates this section from two sources:
     1. Interview answers: If the user provides "existing architectural decisions
        the team has already agreed on," each one becomes an Active Decision.
     2. Discovered conventions: If the init scan finds patterns that are
        Established (3+ modules, consistent), the model may propose them as
        Active Decisions. The user must confirm before they are written.

     For each decision, fill in ALL fields. No field may be left as a placeholder.
     If context is unknown, write "Context not fully documented — captured during init"
     rather than leaving a bracket placeholder.
-->

### AD-1: [Decision Title]

- **Status**: Accepted
- **Date**: [YYYY-MM-DD — date of init or date the decision was originally made]
- **Scope**: [global / <module-name>] — global applies to all modules; module-name means this decision is stored in `.zoom-in/context/decisions/<module-name>.md` (Modular structure only — see SYSTEM.md Decision Structure)
- **Context**: [Why was this decision needed? What problem existed? What forces were in tension? Be specific enough that a future reader understands the situation without asking anyone.]
- **Decision**: [What was decided? Be specific enough to enforce. "Use a service layer" is too vague — "All business logic lives in named service classes under `services/`; ViewSets and serializers delegate to services and contain zero domain logic" is enforceable.]
- **Consequences**:
  - Positive: [what improves — e.g., "Business logic becomes testable in isolation, reusable from CLI/tasks/webhooks"]
  - Negative: [what tradeoff was accepted — e.g., "More files per feature; indirection between view and service"]
- **Affected Lenses**: [Which of the 7 lenses this decision impacts: Clarity / Structure / Performance / Security / Resilience / Domain Integrity / Observability — list all that apply]
- **Golden Reference**: [file path to an implementation that exemplifies this decision, or "Pending implementation" if no module yet follows it correctly]

---

### AD-2: [Decision Title]

- **Status**: Accepted
- **Date**: [YYYY-MM-DD]
- **Context**: [...]
- **Decision**: [...]
- **Consequences**:
  - Positive: [...]
  - Negative: [...]
- **Affected Lenses**: [...]
- **Golden Reference**: [... or "Pending implementation"]

---

[Continue for each discovered/interviewed decision. If no decisions exist at
 init time, include a single placeholder entry marked "No decisions captured
 during init. Use `/zoom-in adopt` to register architectural decisions."]

---

## Superseded Decisions

<!-- INIT INSTRUCTION:
     This section is typically empty at init time. It is populated when
     `/zoom-in adopt` is used to replace an existing Active Decision with a
     new one. The old decision is NOT deleted — it is moved here with a
     reference to the decision that replaced it.

     During init, if the team mentions "we used to do X but switched to Y,"
     record the old approach as a Superseded Decision with the reason it was
     replaced.
-->

[If none at init: "No superseded decisions. Decisions that are replaced by newer
 ones will be moved here with a reference to the superseding AD-ID."]

### AD-0: [Old Decision Title]

- **Status**: Superseded by AD-N
- **Date**: [original date, or "Prior to init" if exact date unknown]
- **Superseded Date**: [date it was replaced, or "Prior to init" if replaced before init]
- **Original Context**: [why the original decision was made]
- **Original Decision**: [what was originally decided]
- **Why Superseded**: [what changed that made this decision obsolete — new requirement, learned lesson, framework change, etc.]

---

## Draft Decisions

<!-- INIT INSTRUCTION:
     This section is typically empty at init time. It is populated by
     `/zoom-in adopt --draft` or when a decision needs team discussion,
     proof of concept, or validation before becoming enforceable.

     Draft decisions are VISIBLE in this file but are NOT enforced by
     `/zoom-in audit` until their status changes to Accepted.
-->

[If none at init: "No draft decisions. Proposed decisions will appear here until
 confirmed by the team."]

### AD-D1: [Proposed Decision Title]

- **Status**: Draft
- **Proposed By**: [who suggested it — person name, role, or "zoom-in audit finding"]
- **Context**: [...]
- **Decision**: [...]
- **Needs**: [what must happen before this becomes Active — team discussion, proof of concept, benchmark, security review, etc.]

---

## Decision Index

<!-- INIT INSTRUCTION:
     This table mirrors ARCHITECTURE.md §3 (Adopted Decisions). During init,
     populate it with the same decisions entered above. The ARCHITECTURE.md §3
     table is a SUMMARY (Date, Decision, Lens, Rationale) — this table adds
     the AD-ID and Status for cross-referencing.

     When `/zoom-in adopt` adds a new decision, BOTH this table and
     ARCHITECTURE.md §3 are updated to stay in sync.
-->

| ID | Title | Status | Date | Lenses |
|---|---|---|---|---|
| AD-1 | [title] | Accepted | [date] | [lenses] |
| AD-2 | [title] | Accepted | [date] | [lenses] |

[Superseded and Draft decisions are NOT listed in this index — they have their
 own sections above. This index is for quick lookup of Active decisions only.]
```

---

## How `/zoom-in init` populates this file

1. **Active Decisions**: Populated from interview answers. When the user says
   "we've already agreed on X," each agreement becomes an Active Decision with
   full ADR context. The model must ask: "What problem led to this decision?"
   and "What tradeoff did you accept?" — never leave Context or Consequences
   as placeholders.

2. **Superseded Decisions**: Only populated if the team mentions past decisions
   that were replaced ("we used to do X but switched to Y"). The model records
   the old approach with the reason for replacement.

3. **Draft Decisions**: Typically empty at init. If the interview surfaces an
   *unresolved* debate ("we're considering X but haven't decided"), it can be
   recorded as Draft with a note on what needs to happen before it becomes
   Active.

4. **Decision Index**: Mirrors the Active Decisions section in tabular form.
   Must stay in sync with ARCHITECTURE.md §3.

---

## How `/zoom-in adopt` interacts with this file

### Adding a new Active Decision

When the user runs `/zoom-in adopt "decision description"`:

1. Parse the decision string. Determine which lenses it affects.
2. Ask for rationale if not provided (Context field).
3. Check for conflicts with existing Active Decisions.
4. Assign the next AD-ID (AD-N where N = current max + 1).
5. Add a full ADR entry in the **Active Decisions** section.
6. Add a row to the **Decision Index** table.
7. Update **ARCHITECTURE.md §3** with the summary row.
8. If the decision promotes an Emerging pattern, update ARCHITECTURE.md §2.

### Superseding an existing Decision

When the user runs `/zoom-in adopt "new decision"` and references an old AD-ID:

1. Move the old ADR entry from **Active Decisions** to **Superseded Decisions**.
2. Set the old entry's Status to "Superseded by AD-N" (the new ID).
3. Add the "Why Superseded" field explaining what changed.
4. Create the new ADR entry in **Active Decisions** with full context.
5. Update the **Decision Index** (remove old row, add new row).
6. Update **ARCHITECTURE.md §3** (replace old row with new row).
7. Check if the superseded decision's Golden Reference is still valid.

### Adding a Draft Decision

When the user runs `/zoom-in adopt --draft "proposed decision"`:

1. Assign AD-DN ID (D1, D2, etc.).
2. Add the entry to **Draft Decisions** with Status: Draft.
3. Record the "Needs" field (what must happen before Active).
4. Do NOT add to the Decision Index — Drafts are not enforced.
5. Do NOT update ARCHITECTURE.md §3 — Drafts are not yet Adopted.

---

## Relationship to ARCHITECTURE.md

| File | What It Contains | Level of Detail |
|---|---|---|
| `DECISIONS.md` (this template) | Full ADR records — context, decision, consequences, golden reference | Complete — the WHY and the WHAT |
| `ARCHITECTURE.md §3` | Decision summary table — Date, Decision, Lens, Rationale | Summary — the WHAT only, linked by AD-ID |

**ARCHITECTURE.md §3 is the quick-reference index.** It shows what decisions exist
at a glance. **DECISIONS.md is the full record.** It shows why each decision was
made, what tradeoffs were accepted, and what the consequences are.

When `/zoom-in audit` encounters a potential violation, it:
1. Checks ARCHITECTURE.md §3 for the summary
2. Cross-references the AD-ID in DECISIONS.md for full context
3. Uses the Consequences and Affected Lenses to determine severity

This two-file structure ensures the audit can quickly find relevant decisions
(summary in §3) while preserving the reasoning needed for nuanced judgment
(full record in DECISIONS.md).

---

## Update Rules

| Event | DECISIONS.md | ARCHITECTURE.md §3 |
|---|---|---|
| `/zoom-in init` | Creates Active + Superseded sections from interview | Creates summary rows |
| `/zoom-in adopt "decision"` | Adds ADR in Active + row in Index | Adds summary row |
| `/zoom-in adopt "new" (supersedes AD-N)` | Moves old to Superseded, adds new to Active | Replaces old summary row |
| `/zoom-in adopt --draft "proposed"` | Adds to Draft section only | No change (not enforced) |
| Team confirms Draft → Active | Moves from Draft to Active, adds to Index | Adds summary row |
| `/zoom-in audit` references a decision | Read-only — uses ADR context for severity | Read-only — uses summary for lookup |

---

## Modular Decision Structure

When SYSTEM.md `Decision Structure` is set to `Modular`, decisions are split
across multiple files:

```
DECISIONS.md                                    # Global decisions only
.zoom-in/
└── context/
    └── decisions/
        ├── integrations.md                     # integrations-specific ADRs
        ├── subscription_management.md          # subscription-specific ADRs
        └── payment_management.md               # payment-specific ADRs
```

### Which file does a decision go to?

| Decision Scope | File Location | Read by `/zoom-in audit` |
|---|---|---|
| `Scope: global` | `DECISIONS.md` | All audits |
| `Scope: <module>` | `.zoom-in/context/decisions/<module>.md` | Only `audit <module>` and `audit full` |
| `Scope: <other-module>` | `.zoom-in/context/decisions/<other-module>.md` | NOT read by `audit <module>` |

### Module decision file format

Each `.zoom-in/context/decisions/<module>.md` file uses the same ADR format as
DECISIONS.md (Active Decisions, Superseded Decisions, Draft Decisions, Index).
The only difference is that it contains only decisions with `Scope: <module>`.

### ARCHITECTURE.md §3 in Modular mode

ARCHITECTURE.md §3 (Adopted Decisions summary table) contains ALL decisions —
both global and module-specific — with a `Scope` column added:

```markdown
| Date | Decision | Scope | Affects Lens | AD-ID | Rationale |
|------|----------|-------|-------------|-------|-----------|
| 2026-06-19 | Domain Layer Purity | global | Structure, Clarity | AD-12 | ... |
| 2026-06-19 | Adapter revoke_access | integrations | Domain Integrity | AD-13 | ... |
```

This ensures the summary table is still a single quick-reference for all decisions,
while the full ADR records are distributed by module.

### Flat mode (default)

When `Decision Structure = Flat`, all decisions go to `DECISIONS.md` regardless
of scope. The `Scope` field is still recorded in each ADR but does not affect
file placement. This is the simplest setup and the default when SYSTEM.md does
not specify a Decision Structure.
