# Performance Lens — Performance & Scalability

## What this lens evaluates

Database query efficiency, caching strategy, background task design (idempotency,
retries, queue routing, granularity), and async correctness. Unlike Structure,
many findings here are `[principle]` regardless of house style — an N+1 query is
an N+1 query whether or not the rest of the codebase has the same problem.
House-style calibration still matters for *how things are fixed* (e.g. does this
project solve N+1 via custom query methods, or via eager-loading directives in
the controller?).

## Three conceptual layers

| Layer | Source | What it checks |
|-------|--------|----------------|
| **Universal** | This file | N+1 queries, unbounded queries, bulk vs per-record saves, cache without invalidation, blocking calls in async |
| **Framework** | `references/frameworks/<detected>.md` | ORM eager-loading APIs, framework-specific query optimization, framework pagination, task queue config patterns |
| **House-Style** | `ARCHITECTURE.md` §2 (Performance patterns) | Where query optimization lives (managers/repositories vs inline), pagination defaults, bulk operation conventions |

An N+1 query is `[principle]` always. Whether you fix it with a custom query
method or inline eager-loading is `[house-style]`.

## Calibrating against house style

Read `ARCHITECTURE.md` §2 ("Performance" under Established Patterns) for the
project's preferred *fix patterns* — e.g. "query optimization lives in repository/
query modules, not inline in controllers" — so that suggested fixes match how the
rest of the codebase solves the same problem.

## Signals to check

### N+1 queries — the most common and highest-impact finding
- **Serialization/rendering**: any field that accesses a related object's
  attributes — computed fields that call data-access methods or traverse
  `obj.related.field`, or nested schemas for a relation that isn't eagerly
  loaded.
- For each nested/related schema field found, check the corresponding
  controller/queryset for a matching eager-load directive (framework-specific:
  see `references/frameworks/<detected>.md`). A nested schema field with no
  corresponding eager-load is the single highest-value finding this lens
  produces.
- Computed fields that run data-access queries per record — these execute once
  per object rendered, so any query inside is N+1 by construction.

### Query efficiency
- Unbounded queries on list endpoints without pagination — check that pagination
  is configured globally or per-endpoint.
- Large result sets with all columns when only a few are used — candidates for
  column-limited queries, especially in list (not detail) endpoints.
- Loading full result sets for count/exists checks where a count or exists query
  would avoid loading all rows.
- Loops calling save per object where bulk operations or a single update query
  would work.
- Missing field-level update scoping on save calls — writes all columns when only
  a few changed. If house style Established scoped updates consistently, flag
  deviations. See `references/frameworks/<detected>.md` for framework-specific
  update scoping APIs.

### Indexing
- Fields used in frequent filter/order/exclude calls (especially foreign keys
  already indexed by default, but also status fields, date ranges, and fields
  used in composite uniqueness constraints) — check for database indexes. This
  requires correlating query patterns (from controllers/query functions) with
  model/field definitions; don't flag indexes speculatively without a
  corresponding query pattern that would benefit.

### Caching
- Is a production-grade cache backend configured (Redis, Memcached, etc.) or
  only a local/dev cache? If the project has expensive computed properties or
  aggregation queries, check whether caching is used, and whether usage is
  consistent with house style.
- Cache without invalidation: if caching is used, is there a corresponding
  invalidation path (event handler clearing cache key on model change, or short
  TTL)? Caching without any invalidation strategy is a `[principle]` finding
  even if it matches house style — surface it as a risk either way.

### Background task design
- **Retry policy**: check each task for retry configuration (backoff, max
  retries, retry-on exception types). Tasks that call external services (HTTP,
  email, payment) without retry config are a `[principle]` finding — transient
  failures become permanent failures.
- **Idempotency**: does the task's logic produce the same end state if run twice
  with the same arguments? Look for lookup-before-create patterns, state checks
  before side effects. Tasks with retries but without idempotency are a
  higher-severity version of the same finding — retries will *cause* duplicate
  side effects.
- **Granularity**: a single task doing multiple unrelated side effects (e.g.
  "process_order" that charges payment, sends email, AND updates inventory) —
  if any one step fails, the retry re-runs all of them. Compare to how other
  tasks in the project are scoped.
- **Queue routing**: every task should specify its target queue explicitly.
  Missing queue routing means the task lands on the default queue, which may
  have different worker config and priority. If house style Established explicit
  queues, flag deviations as `[house-style]`.
- See `references/frameworks/<detected>.md` for framework-specific task retry,
  queue, and idempotency patterns.

### Async handlers (if used)
- For each async handler, check for blocking data-access calls (sync DB/IO
  inside async functions without proper bridging) — this is a correctness bug
  as much as a performance one, and should be flagged at high severity
  (`[principle]`).

## What not to flag

- In-memory caching used for genuinely per-request-instance computation — this
  is correct and doesn't need a cross-request cache.
- N+1 patterns in code paths explicitly marked in `ARCHITECTURE.md` §4 (Known
  Exceptions) as low-traffic admin/internal tooling.
- Missing indexes on fields with no corresponding query pattern in the sampled
  code — speculative indexing has its own cost (write overhead, migration churn).
- Bulk operations in code paths where the record count is always small (e.g.
  config tables with <10 rows) — the optimization cost outweighs the benefit.

## Scoring rubric

- **9–10** — No N+1 patterns found in sampled schemas/controllers; pagination and
  query optimization consistent; background tasks have retry policy and look
  idempotent; no async/blocking misuse.
- **7–8** — One or two minor N+1 cases in low-traffic endpoints, or a couple of
  tasks missing retry config on non-critical side effects.
- **5–6** — N+1 present in at least one frequently-used endpoint, or caching
  used without any invalidation strategy, or several tasks lack retry
  configuration.
- **3–4** — Multiple N+1 issues in core endpoints, missing pagination on
  large list endpoints, and/or background tasks that are neither idempotent nor
  retried (real risk of duplicate side effects or silent task failure).
- **1–2** — Performance issues likely to cause production incidents:
  unbounded queries on hot paths, async handlers with blocking data-access calls,
  or task design that will cause duplicate financial/state-changing operations
  on retry.

## Example findings format

- `[principle]` `modules/orders/schemas.py:OrderSchema.items` is a nested
  schema rendering related items, but the controller's query
  (`modules/orders/handlers.py:22`) doesn't eager-load the items relation —
  every order in a list response triggers a separate query for its items.
  → Fix: add eager-load directive per `references/frameworks/<detected>.md`.
- `[principle]` `modules/billing/tasks.py:charge_payment` has no retry
  configuration and calls an external payment API directly. A transient network
  error fails the task permanently with no automatic retry.
  → Fix: add retry policy with exponential backoff for connection errors.
- `[house-style]` `modules/notifications/tasks.py:send_digest` performs the
  query for "users to notify" inline with a filter chain. `modules/orders` and
  `modules/billing` (Established) put equivalent query logic in read-access
  functions — recommend a `get_digest_recipients()` query function for
  consistency and reuse in tests.
