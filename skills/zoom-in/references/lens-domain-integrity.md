# Domain Integrity Lens — State Machines, Business Invariants & Tenant Isolation

## What this lens evaluates

Whether the domain logic is correct, complete, and protected: state machine
transitions, business rule enforcement, multi-tenant isolation, and financial/
data-critical flow correctness. This lens catches the bugs that don't crash the
server but silently corrupt data, leak between tenants, or allow impossible
states.

**Principle foundations**: This lens is grounded in Domain-Driven Design aggregate
and invariant patterns. See `references/principles/ddd.md` for the theoretical
basis behind state machine enforcement, bounded context isolation, and invariant
placement rules.

## Three conceptual layers

| Layer | Source | What it checks |
|-------|--------|----------------|
| **Universal** | This file | Direct state mutation outside facade, impossible transitions, unfiltered tenant queries, financial idempotency, invariant enforcement location |
| **Framework** | `references/frameworks/<detected>.md` | Framework-specific state machine patterns, ORM constraint enforcement, framework event/signal patterns for side effects |
| **House-Style** | `ARCHITECTURE.md` §2 (Domain Integrity patterns) | Which facade/lifecycle service manages transitions, tenant isolation mechanism, financial flow patterns, audit trail conventions |

Unlike other lenses, Domain Integrity findings are almost always `[principle]`
and high severity — a state machine violation or tenant leak is a correctness
bug, not a style preference. House style matters only for *how* the project
chooses to enforce these invariants (facade pattern, events, model methods, etc.).

## Calibrating against house style

Read `ARCHITECTURE.md` §2 ("Domain Integrity" under Established Patterns) for:

- The project's state machine enforcement mechanism (facade service? model
  validation? events? direct status assignment?)
- Business invariant enforcement pattern (service-layer validation? input schema
  validation? model constraints?)
- Tenant isolation mechanism (middleware + context vars? query filtering? custom
  data-access layer?)
- Financial flow pattern (two-step preview/confirm? idempotency keys? audit
  trail via history model?)

## Signals to check

### State machine correctness
- **Direct status mutation**: any code that sets `obj.status = ...` or
  `obj.state = NEW_VALUE` outside the designated state machine service/facade.
  If the project has a lifecycle facade, any direct status write anywhere else
  is a `[principle]` finding — the facade's guards, side effects, and audit
  trail are bypassed.
- **Impossible transitions**: check whether the state machine allows transitions
  that shouldn't exist (e.g. EXPIRED → ACTIVE without going through reactivate,
  or DRAFT → CANCELLED skipping required validation). If the facade has an
  explicit transition matrix, compare actual code paths against it.
- **Missing transition guards**: methods that change state without checking the
  current state first. A `reactivate` method should verify the entity is in a
  reactivatable state before mutating. Missing guards mean the method can
  produce impossible states if called in the wrong context.
- **State-machine drift**: if multiple code paths can change the same status
  field (e.g. both a background task AND a webhook handler can set ACTIVE), they
  may race or disagree. Check for single-writer enforcement — one authoritative
  path per transition.

### Business invariants
- **One-active-per-constraint violations**: e.g. "one active subscription per
  service per client" — check that creation/activation code enforces this before
  allowing a new active record. If a `create` method doesn't check for existing
  active records first, it can violate the invariant.
- **Financial calculation correctness**: any code that computes amounts, taxes,
  discounts, or prorations — are edge cases handled? Zero-amount upgrades,
  negative quantities, currency mismatches. Check for explicit handling or
  validation; absence is a `[principle]` finding on financial paths.
- **Idempotency on critical operations**: payment charges, subscription
  activations, quota resets — if these operations are retried (background tasks,
  webhook retries), they must be idempotent. A `charge_payment` task that
  creates a new Payment record on every invocation (instead of lookup-before-
  create by idempotency key) will charge the customer multiple times on retry.
- **Invariant enforcement location**: are business rules enforced in the right
  layer? Rules in input schemas that only apply to API input (not admin actions
  or background tasks) are incomplete enforcement — the invariant can be violated
  through a non-API code path. This is a `[principle]` finding.

### Multi-tenant isolation
- **Unfiltered queries**: any handler, data-access method, or service that
  queries a tenant-scoped model without filtering by the current tenant. This
  includes:
  - Unfiltered queries in a handler for a tenant-scoped model
  - Service functions that accept no tenant parameter but operate on
    tenant-scoped data
  - Background tasks that query tenant-scoped models without a tenant filter
    (if the task is triggered per-tenant, it should scope its queries)
- **Cross-tenant data leakage in responses**: schemas that include related
  objects from other tenants (e.g. a nested schema that follows a relationship
  to a model not scoped by tenant). Check that eager-load chains don't
  accidentally pull in data from other tenants.
- **Tenant context propagation**: in background tasks and jobs, is the tenant
  context passed explicitly (via arguments) or relied upon implicitly (context
  variables that may not be available in the worker process)? Relying on
  request-scoped context in a background worker is a `[principle]` finding —
  the context is set by middleware during HTTP requests, not in async workers.
- **Admin actions bypassing tenant scope**: admin actions that operate on
  bulk selections without tenant filtering — an admin selecting "all" and
  performing a bulk action could affect all tenants.

### Financial flow correctness
- **Two-step flows**: for operations with financial implications (plan upgrades,
  addon purchases), does the project use a two-step preview/confirm pattern?
  Single-step flows that immediately charge and change state are a `[principle]`
  finding — they don't allow the user to review before committing.
- **Payment-status alignment**: is the business status kept in sync with payment
  status? If a payment fails, does the entity move to a past-due state? If a
  payment succeeds, does the entity activate? Check that the integration between
  payment webhooks and business lifecycle is complete.
- **Audit trail**: for any state-changing financial operation, is there a
  history/log record created? If a history/audit model is Established, any
  financial state change without a history row is a `[house-style]` finding and
  a `[principle]` audit concern.
- **Draft state cleanup**: if the project uses DRAFT states for pending
  operations (draft subscriptions, draft upgrades, draft purchases), are there
  cleanup mechanisms (scheduled tasks, expiry logic) for stale drafts? DRAFTs
  that never expire accumulate forever.

### Resource lifecycle
- **Single-writer for lifecycle transitions**: if a period/phase manager is the
  single writer for lifecycle transitions, any direct status mutation or save
  outside the manager is a `[principle]` finding.
- **Quota/resource check before consume**: any code that creates a resource
  without first checking quota availability. If the project has a
  check-and-consume pattern, creation without quota check is a `[principle]`
  finding — the resource is created even if the quota is exceeded.
- **Quota decrement on deletion**: if resources are deleted, does the quota get
  decremented? Missing decrement means the tenant is permanently charged for
  resources that no longer exist.

## What not to flag

- State transitions explicitly documented in `ARCHITECTURE.md` §4 as known
  exceptions or legacy behavior.
- Admin-only paths that bypass the standard state machine — if this is
  documented and intentional (e.g. "superadmins can force any transition"), it's
  acceptable.
- Test code that directly sets status for setup purposes — test fixtures
  bypassing the facade is normal.
- Multi-tenant queries in code paths explicitly designed to be cross-tenant
  (e.g. a super-admin dashboard that legitimately needs to see all tenants),
  provided they have appropriate permission guards.

## Scoring rubric

- **9–10** — State machine enforced through designated facade with no bypasses;
  business invariants checked in the correct layer; tenant isolation complete
  (no unfiltered queries on tenant-scoped models); financial flows use two-step
  pattern with audit trail; resource lifecycle follows single-writer rules.
- **7–8** — One or two isolated tenant-scoping gaps on low-sensitivity models,
  or a financial path missing idempotency but with low retry risk.
- **5–6** — At least one state machine bypass allowing impossible transitions,
  or a tenant-scoped handler without tenant filtering, or a financial operation
  without idempotency that gets retried.
- **3–4** — Multiple state machine bypasses; unfiltered queries on tenant-scoped
  models with real data-leak risk; financial operations that will double-charge
  on retry; missing quota checks allowing over-consumption.
- **1–2** — Systemic domain integrity failures: any user can access any
  tenant's data; state machines have no enforcement (status set freely from any
  code path); financial flows have no idempotency and will corrupt on retry; no
  audit trail for critical operations.

## Example findings format

- `[principle]` `modules/orders/handlers.py:OrderHandler.cancel` sets
  `order.status = 'cancelled'` directly instead of calling the lifecycle
  facade's `cancel_order(order)`. This bypasses the cancel-at-period-end guard
  and the history audit trail that the facade provides.
  → Fix: route through the lifecycle facade for all state transitions.
- `[principle]` `modules/billing/handlers.py:InvoiceHandler.get_queryset`
  filters by tenant but `InvoiceHandler.retrieve` doesn't — any authenticated
  user can retrieve any invoice by ID, regardless of tenant.
  → Fix: apply tenant filter consistently across all actions.
- `[principle]` `modules/billing/tasks.py:process_recurring_billing` creates
  a new Payment record on every invocation with no idempotency check. If this
  task is retried, the customer will be charged multiple times for the same
  billing period.
  → Fix: use lookup-before-create with an idempotency key.
- `[house-style]` `modules/inventory/services.py:adjust_stock` performs a quota
  check via `check_available` but the project (Established) uses `check_and_consume`
  for atomic check+consume. The separate check creates a TOCTOU race — the quota
  might be available at check time but consumed by the time the adjustment runs.
  → Fix: use the atomic check_and_consume pattern per the golden reference.
