# Structure Lens — Architecture & Separation of Concerns

## What this lens evaluates

How responsibilities are distributed across the request/task lifecycle: models,
data-access layers, input schemas, controllers/handlers, services, and background
tasks. This is the lens where the adaptive philosophy matters most — many
frameworks don't mandate a service layer or any particular layering, so "correct"
structure here is almost entirely about **what this project has already chosen**
and **whether it's applied consistently**.

**Principle foundations**: This lens is grounded in Clean Architecture dependency
rules and SOLID Single Responsibility / Dependency Inversion principles. See
`references/principles/clean-architecture.md` and `references/principles/solid.md`
for the theoretical basis behind the signals below.

## Three conceptual layers

| Layer | Source | What it checks |
|-------|--------|----------------|
| **Universal** | This file | Dependency cycles, inversion of control, controller thickness, task chaining depth |
| **Framework** | `references/frameworks/<detected>.md` | Framework-specific layering conventions, middleware patterns, ORM model vs service patterns |
| **House-Style** | `ARCHITECTURE.md` §2 (Structure patterns) | Which layers exist, naming conventions, read/write separation, singleton accessor patterns |

A dependency cycle is `[principle]` regardless of house style. Whether a project
uses a service layer at all is `[house-style]`.

## Calibrating against house style

Read `ARCHITECTURE.md` §2 ("Structure" under Established Patterns) first. The most
load-bearing question for every finding in this lens is: **does this project have
an established layering convention, and does the code under review follow it?**

- If **Established**: deviations are `[house-style]`.
- If **Emerging** (1-2 modules do it, others don't): don't flag older modules for
  not following the emerging pattern — instead note the divergence itself.
- If **Inconsistent** or absent: fall back to `[principle]` findings based on
  general separation-of-concerns reasoning, and note in the audit that this module
  would benefit from `/zoom-in init` + `/zoom-in adopt` to establish a baseline.

## Signals to check

### Controller/Handler thickness
- Look at create, update, and custom action methods on controllers/handlers.
  Methods doing more than ~10-15 lines of actual logic (beyond input validation
  + a single service call) are doing business logic in the controller layer.
- Specifically watch for: multiple model/DB saves across different models in one
  handler method (a transaction/orchestration concern that often belongs in a
  service), conditional branching on business state directly in the handler,
  direct calls to external APIs mixed with DB writes.

### Data layer thickness
- Create/update overrides that do more than map validated data to model fields —
  e.g. creating related objects, triggering side effects, calling external
  services. Whether this is a finding depends entirely on house style. Check
  `ARCHITECTURE.md` before flagging.
- Validate methods containing business rules that reference other models' state
  (e.g. checking inventory levels) — this couples the data layer to cross-model
  business logic; note whether other modules do this too.

### Service layer (if established)
- If service files exist and are Established: do new/changed files follow the same
  shape (module-level functions vs. classes, naming conventions like
  `create_x`/`get_x_for_y`)? Are services called from controllers (correct
  direction) or do services import from controllers (inversion — flag regardless
  of house style, this is a `[principle]` issue almost always)?
- Read/write separation: if a read layer is established, check whether write
  paths ever do ad-hoc queries that duplicate logic that should live in a
  read-access function.
- Singleton accessor pattern: if `get_*_service()` is Established, check that
  services are accessed through it rather than direct instantiation.

### Module boundaries & dependency direction
- Build a rough dependency map per module by examining import statements. Look for:
  - **Cycles**: module A imports from module B, and B imports from A. Always a
    `[principle]` finding — cycles cause real problems (import errors, testing
    difficulty) regardless of house style.
  - **A "god module"** that everything imports from but that itself imports from
    nothing — often fine if it's a deliberate `core`/`common` module (check
    `ARCHITECTURE.md`), but worth confirming it stays that way.
  - **Domain importing infrastructure** — domain/business modules should not import
    from infrastructure modules (framework, external API clients, message broker
    config). This is `[principle]` regardless of house style.

### Signal/Event handling
- Signals/events that perform meaningful side effects (sending emails, updating
  related models, triggering background tasks) make control flow hard to follow
  because the trigger and the effect are in different files with no explicit call.
  - This is a common `[principle]` finding even if the project uses signals
    consistently (consistency doesn't fix the readability cost) — but phrase it
    as a tradeoff, not a mandate: signals are sometimes the right tool (e.g.
    decoupling truly independent side effects), the finding should describe
    *what's hard to trace*, not declare signals wrong.

### Contract integrity & API evolution
- **API versioning strategy**: If the project exposes APIs, does it have a
  versioning strategy (URL path versioning, header versioning, or content
  negotiation)? No versioning strategy means breaking changes are deployed
  without coordination, and clients have no way to control when they adopt
  changes. This is a `[principle]` finding for any API consumed by external
  clients, and a `[house-style]` finding for internal-only APIs.
- **Backward compatibility**: When a serializer, response shape, or endpoint
  contract changes, does the code preserve backward compatibility or provide a
  migration path? Removing a field from a response without a deprecation period
  breaks existing clients. This is a `[principle]` finding for external APIs.
- **Schema evolution patterns**: For projects using event-driven communication
  or shared data contracts, do events/messages carry version identifiers or use
  schema registries? Unversioned events create coupling between producer and
  consumer that makes independent deployment impossible.
- **Contract tests**: If the project has separate producer/consumer services,
  do consumer tests verify the contract they depend on (not just the producer's
  internal behavior)? Missing contract tests mean producer changes can break
  consumers without detection until production.

### Background task structure
- Are tasks thin orchestrators (task calls a service function, handles retry/error
  translation) or do they contain business logic directly? Compare against house
  style. Either is fine; **inconsistency between tasks** (some thin, some fat,
  with no pattern) is the finding.
- Task chaining: complex workflows using explicit composition primitives vs. tasks
  that call other tasks by enqueuing them inside their body (the latter makes the
  actual workflow hard to see and test) — flag the latter as `[principle]` if it
  spans more than 2 levels.
- See `references/frameworks/<detected>.md` for framework-specific task patterns
  (e.g., task retry config, queue routing conventions).

## What not to flag

- A layering choice this project has clearly and consistently made, even if it
  differs from "typical" advice (e.g. a deliberately fat-model project with no
  service layer at all, applied uniformly, is internally consistent — don't push
  it toward services unless asked).
- Small utility/shared modules that don't fit the layering pattern of feature
  modules — these often legitimately don't need services or separate read layers.
- Signal/event use for genuinely independent side effects (audit logging,
  notification dispatch) where the trigger doesn't need to know about the effect.

## Scoring rubric

- **9–10** — Layering is consistent with house style across the scope; dependency
  direction is clean (no cycles); signals/tasks used deliberately and legibly.
- **7–8** — Generally consistent; one or two handler methods are thicker than the
  established norm but isolated.
- **5–6** — Mixed signals: roughly half the scope follows an established or
  emerging layering pattern, half doesn't, without a clear "this part is legacy"
  explanation.
- **3–4** — Significant business logic in handlers/data-layer where house style
  (or general principle, if no house style) suggests otherwise; at least one
  cross-module dependency cycle.
- **1–2** — No discernible separation of concerns; control flow is hard to trace
  across multiple signals/tasks; circular dependencies actively causing issues
  (e.g. import workarounds used to avoid cycles).

## Example findings format

- `[house-style]` `modules/inventory/handlers.py:StockHandler.create` builds and
  saves three related models inline (35 lines). `modules/orders` and
  `modules/billing` (Established) delegate this to `services.create_x(...)` —
  recommend extracting to `modules/inventory/services.py` following the same shape.
- `[principle]` `modules/billing/services.py` imports input schema from
  `modules/orders/schemas.py` to reuse a validation method, and
  `modules/orders/services.py` imports `calculate_total` from
  `modules/billing/services.py` — this is a dependency cycle between billing and
  orders regardless of either module's internal conventions.
- `[conflict]` `modules/notifications` triggers all its background tasks via
  post-save events on five different models; `modules/orders` and
  `modules/billing` (Established) enqueue tasks explicitly from services after
  the relevant action. No documented reason for the difference — candidate for
  `/zoom-in adopt`.
