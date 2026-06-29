# SYSTEM.md Template

This template defines the structure of `SYSTEM.md` at the project root.
When `/zoom-in init` creates the file, it follows this structure. This file captures
STRATEGIC context about the system — not code-level patterns (those live in
`ARCHITECTURE.md`), but the architectural decisions and constraints that shape
everything built on top.

---

> **This file should be reviewed by the team and updated when architectural
> decisions change.** It is not auto-regenerated on every `/zoom-in init` — it is
> a hand-curated strategic document that `/zoom-in init` bootstraps and humans
> maintain.

---

```markdown
# SYSTEM.md — [Project Name] Strategic Context

> Bootstrapped by `/zoom-in init`. Maintained by the team.
> Last updated: [DATE]

---

## System Type

[Monolith / Microservice / Serverless / Multi-tenant SaaS / API Gateway / Other]

---

## Framework

[auto-detected — e.g., Django, Spring Boot, Express, FastAPI, Rails, Laravel]

---

## Primary Language

[auto-detected — e.g., Python, Java, TypeScript, Go, Ruby, PHP]

---

## Database

[auto-detected — e.g., PostgreSQL, MySQL, MongoDB, DynamoDB, SQLite]

---

## Cache

[auto-detected or N/A — e.g., Redis, Memcached, N/A]

---

## Message Queue

[auto-detected or N/A — e.g., RabbitMQ, Redis (as broker), SQS, Kafka, N/A]

---

## Register(s)

[SaaS / Enterprise / API Service / Default]

The register determines how the system is categorized for audit severity
weighting and which lens defaults are most important.

- **SaaS** — Multi-tenant, billing/subscription critical, tenant isolation
  paramount. Security and Domain Integrity lenses carry extra weight.
- **Enterprise** — Single or few tenants, compliance-heavy, audit trails
  mandatory. Resilience and Domain Integrity lenses carry extra weight.
- **API Service** — Consumed by other services, contract stability critical.
  Clarity and Structure lenses carry extra weight.
- **Default** — General-purpose application. All lenses weighted equally.

---

## Multi-Tenancy Model

[Shared DB / Schema per Tenant / DB per Tenant / N/A]

This determines the data isolation strategy and informs Security + Domain
Integrity audit severity.

- **Shared DB** — All tenants share tables; isolation is by row-level filtering.
  Tenant filter bugs cause cross-tenant data leaks (Anti-Pattern #10).
- **Schema per Tenant** — Each tenant gets its own DB schema; isolation is at
  the DDL level. Migration management is the primary complexity.
- **DB per Tenant** — Each tenant gets its own database; strongest isolation,
  highest operational cost.
- **N/A** — Single-tenant system; tenant isolation is not a concern.

---

## Authentication

[JWT / OAuth / Session / API Key / Custom / N/A]

Brief notes on the auth mechanism. This informs Security lens checks.

---

## Authorization Model

[RBAC / ABAC / Simple Roles / None]

Brief notes on how permissions are structured. This informs Security lens checks.

---

## Decision Structure

[Flat / Modular]

Determines where architectural decisions (ADRs) are stored.

- **Flat** — All decisions in a single `DECISIONS.md` file at project root.
  Simplest setup. Best for small projects, monoliths, or projects with few
  architectural decisions. Every `/zoom-in adopt` writes to this one file.
- **Modular** — Global decisions in `DECISIONS.md` at project root; module-specific
  decisions in `.zoom-in/context/decisions/<module>.md`. Best for large projects
  with many modules where decisions are domain-specific. `/zoom-in audit <module>`
  reads only global + that module's decisions, ignoring other modules' decisions.

This choice is made during `/zoom-in init` and is permanent — it does not change
automatically. To switch, re-run `/zoom-in init`.

---

## Deployment Target

[Docker / K8s / Serverless / VM / Unknown]

Brief notes on deployment. This informs Resilience and Performance lens checks
(e.g., container-aware caching, stateless design requirements).

---

## Key Business Domains

[discovered during init]

List the core business domains the system handles. These are the areas where
Domain Integrity findings carry the highest severity.

Examples:
- Subscription / billing lifecycle
- Order management
- User authentication and identity
- Content / media management
- Inventory and fulfillment

---

## Critical Flows

[discovered during init]

List the end-to-end flows where bugs have the highest business impact. These
flows are priority targets for Domain Integrity audits.

Examples:
- Payment processing (charge → settle → refund)
- Subscription lifecycle (create → activate → renew → cancel → expire)
- User onboarding (sign up → verify → provision → first use)
- Data import/export (validate → transform → persist → confirm)
- Multi-tenant resource allocation (check quota → reserve → provision → record)

---

## Notes

[Additional strategic context discovered during init or added by the team.
This section is free-form and grows organically.]

---

## Init Version

[NUMBER — set by `/zoom-in init` to the current skill version from
`references/init-changelog.md`. Used by `/zoom-in re-init` to detect
schema gaps when the skill is updated. Do not edit manually —
`/zoom-in re-init` updates this after syncing.]
```

---

## How `/zoom-in init` populates this file

1. **Auto-detected fields** (Framework, Primary Language, Database, Cache,
   Message Queue): Determined by scanning dependency files, config files,
   and project structure. No manual input needed.

2. **Inferred fields** (System Type, Register, Multi-Tenancy Model, Auth,
   Authorization, Deployment): Determined by examining middleware, settings,
   model structure, and deployment configuration. Presented to the user for
   confirmation before writing.

3. **Discovered fields** (Key Business Domains, Critical Flows): Determined
   by analyzing model relationships, service methods, and URL patterns.
   Presented to the user for review and amendment.

4. **Interview fields** (Decision Structure): Set from user's choice during
   the init interview (Flat or Modular). See `/zoom-in init` Step 3, question #5.

5. **Init Version**: Set to the current skill version from
   `references/init-changelog.md`. Updated by `/zoom-in re-init` after syncing.

6. **Notes:** Left empty for the team to fill in.

After `/zoom-in init` generates the file, **the team should review every field**
and correct or supplement as needed. This file is the foundation for
audit severity weighting — incorrect entries lead to mis-prioritized findings.

---

## Relationship to ARCHITECTURE.md

| File | Scope | Updated by |
|------|-------|-----------|
| `SYSTEM.md` | Strategic — what the system IS | `/zoom-in init` (bootstrap), `/zoom-in re-init` (sync), then team manually |
| `ARCHITECTURE.md` | Tactical — how the system is BUILT | `/zoom-in init`, `/zoom-in adopt`, `/zoom-in audit`, `/zoom-in refactor` |

`SYSTEM.md` answers: "What kind of system is this? What matters most?"
`ARCHITECTURE.md` answers: "What patterns does this system follow? Where are they done best?"

Both files are read at the start of every zoom-in command.
