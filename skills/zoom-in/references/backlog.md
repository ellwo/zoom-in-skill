# Technical Debt Backlog — Persisting Deferred Fixes

> Not every finding gets fixed immediately. Some need infrastructure that doesn't
> exist yet. Some are low priority. Some need team discussion first. The backlog
> gives deferred items a home — so they don't vanish into forgetfulness.

---

## 1. File Location

```
.zoom-in/
└── context/
    └── backlog.md
```

- Created on first deferral (by `/zoom-in refactor` or `/zoom-in audit`)
- Machine-managed, not hand-edited
- Tracked in git (same strategy as audits — see `audit-storage.md` §6)

---

## 2. File Format

```markdown
# Technical Debt Backlog

> Items deferred during refactor or audit.
> Checked by /zoom-in audit — reports which are still relevant.
> Checked by /zoom-in verify — detects items resolved as side effects.

## <scope>

| Finding | Description | Severity | Deferred On | Reason | Ticket/Ref | Status |
|---------|-------------|----------|-------------|--------|------------|--------|
| PF-07 | Sync HTTP in connect | 🟠 | 2026-06-19 | Needs async infra | GH-123 | Open |
| RE-03 | Adapters untested | 🟠 | 2026-06-19 | Next sprint | — | Open |
| CL-02 | Inconsistent naming | ⚠️ | 2026-06-19 | Low priority | — | Open |
```

### Columns

| Column | Purpose |
|---|---|
| Finding | The audit finding ID (e.g., PF-07, SE-04) |
| Description | Short description of the issue |
| Severity | 🔴 / 🟠 / ⚠️ / 💡 — from the audit |
| Deferred On | Date the item was added to the backlog |
| Reason | Why it was deferred (e.g., "Needs async infra", "Next sprint", "Low priority") |
| Ticket/Ref | Optional link to GitHub Issue, Jira ticket, or other tracker (e.g., GH-123, JIRA-456) |
| Status | Open / Resolved / Worsened |

### Status values

| Status | Meaning | Who sets it |
|---|---|---|
| Open | Deferred, not yet fixed | `/zoom-in refactor` (on deferral) |
| Resolved | Fixed (directly or as side effect) | `/zoom-in verify` or `/zoom-in audit` |
| Worsened | Severity increased since deferral | `/zoom-in audit` (Backlog Review) |

---

## 3. How Items Enter the Backlog

### Via `/zoom-in refactor`

When the user chooses to defer (skip) a finding during refactor:

1. The finding is NOT fixed
2. A row is added to `backlog.md` under the finding's scope
3. Fields populated: Finding, Description, Severity, Deferred On (today's date),
   Reason (user's stated reason or "Low priority"), Ticket/Ref (if provided)
4. Status: Open

**User interaction**: When a finding is skipped, ask:
> "Defer this finding to the tech debt backlog? Reason? (e.g., 'needs async infra',
> 'next sprint', 'low priority'). Optional: ticket reference (e.g., GH-123)."

If the user says "just skip" without a reason → use "User skipped" as the reason.

### Via `/zoom-in audit` (triage step)

When the user chooses "defer" for findings during the audit's triage questions
(Step 5c), those findings are noted as backlog candidates. The actual backlog
entry is written by the next `/zoom-in refactor` that processes them. The audit
notes them in the report's Backlog Status section as "New deferred this cycle."

---

## 4. How Items Leave the Backlog

### Via `/zoom-in audit` (Backlog Review — Step 5.5)

For each Open item in the backlog within the audit scope:

1. Check if the finding still appears in the current audit's results
2. If the finding is **absent** → mark as "✅ Resolved" in the audit report
   and update `backlog.md` Status to "Resolved" with the resolution date
3. If the finding is **still present** → keep as "Open", note in audit report
4. If the finding's **severity increased** → update Status to "Worsened",
   update Severity column, note in audit report

### Via `/zoom-in verify`

After a refactor + verify cycle:

1. For each Open backlog item: check if the finding's location was touched
   by the recent refactor (directly or as a dependency)
2. If the finding appears fixed → mark as "✅ Resolved (side effect of [finding-id])"
3. Update `backlog.md` Status and add a note about which fix resolved it

---

## 5. Integration with Other Commands

| Command | Reads Backlog? | Writes Backlog? |
|---|---|---|
| `/zoom-in audit` | Yes — Step 5.5 Backlog Review | Yes — marks Resolved/Worsened |
| `/zoom-in refactor` | No (works from audit findings) | Yes — adds deferred items |
| `/zoom-in verify` | Yes — checks for side-effect resolutions | Yes — marks Resolved |
| `/zoom-in focus` | No | No |
| `/zoom-in harden` | No | No |
| `/zoom-in plan` | Optional — can reference backlog to know what NOT to plan around | No |
| `/zoom-in adopt` | No | No |

---

## 6. Cleanup

Backlog items with Status "Resolved" are kept for historical reference but can
be cleaned up periodically:

- **Auto-cleanup**: When a resolved item is older than 90 days, it can be removed
  during the next `/zoom-in audit` (configurable via `backlog_retention_days` in
  SYSTEM.md, default 90)
- **Manual cleanup**: The team can remove resolved items at any time
- **Never remove Open items** — they represent unresolved debt

---

## 7. Relationship to Audits

The backlog and audit history work together:

- **Audits** snapshot the project's health at a point in time
- **Backlog** tracks what the team knowingly deferred and why
- **Audit + Backlog** = complete picture: what's wrong (audit) + what we know about
  and chose to defer (backlog) + what we didn't know (new audit findings)

Without the backlog, deferred findings are invisible between audits. With it,
the team can see: "We knew about PF-07 for 3 months and chose to defer it each
time — is it time to fix it?"
