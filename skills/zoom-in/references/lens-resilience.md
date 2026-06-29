# Resilience Lens — Testability & Maintainability

## What this lens evaluates

Test coverage and quality, migration/schema-change hygiene, error handling, and
documentation — the things that determine how safely this codebase can change over
time. Like Performance, many findings here are `[principle]` (an untested payment
flow is a risk regardless of house style), but the *shape* of tests (test framework,
factories vs fixtures, colocated vs centralized) is a house-style question.

## Three conceptual layers

| Layer | Source | What it checks |
|-------|--------|----------------|
| **Universal** | This file | Test presence for critical logic, bare catch-all + pass, irreversible data migrations, docs-code divergence |
| **Framework** | `references/frameworks/<detected>.md` | Test client conventions, mock patterns, migration safety APIs, framework-specific test utilities |
| **House-Style** | `ARCHITECTURE.md` §2 (Resilience patterns) | Test layout conventions, factory patterns, how background tasks are tested, documentation expectations |

An untested financial flow is `[principle]` always. Whether tests use pytest or
unittest is `[house-style]`.

## Calibrating against house style

Read `ARCHITECTURE.md` §2 ("Resilience" under Established Patterns) for: test
framework and layout conventions, factory patterns, and how background tasks are
tested (e.g. eager execution in test settings vs. calling the underlying function
directly).

## Signals to check

### Test coverage (presence, not percentage)
- For each module in scope, check whether test files exist at all, and roughly
  which source files have a corresponding test file. Don't compute exact coverage
  percentages unless a coverage tool is already configured and has a recent report
  — presence/absence of test files for key modules (services, controllers, tasks)
  is a sufficient signal.
- **Prioritize by risk, not raw coverage**: an untested service function that
  mutates financial/state data is a more severe finding than an untested simple
  schema. Read the function, not just its existence, before deciding severity.

### Test quality
- Do tests for controllers use the project's established test client (check
  `ARCHITECTURE.md`) rather than calling handler methods directly? Either can be
  fine — check what's Established.
- External dependencies (HTTP calls, payment gateways, email) — are they mocked
  in tests, or do tests appear to hit real external services? If a source file
  makes external calls and its test file has no corresponding mock, that's a
  finding.
- Background task tests: is task *logic* tested independent of the broker (e.g.
  calling the underlying function directly), or only tested via eager execution
  in test settings? Either is reasonable; absence of both for a non-trivial task
  is the finding.
- Layered test structure: if the project has a layered architecture (domain/
  application/infrastructure), check whether tests follow the same layering. A
  flat test directory for a layered module is a `[house-style]` finding.

### Migration / schema-change safety
- Count migrations/changes per module. A very high count relative to model
  complexity can indicate frequent schema churn — not necessarily bad, but worth
  noting if it correlates with other findings about that module's stability.
- For each data migration using custom code (not just schema changes), check
  whether a rollback/reverse path is provided. Irreversible data migrations are
  a deployment-rollback risk — `[principle]` finding, severity depends on what
  the migration does.
- Squashed/consolidated migrations: presence suggests the team manages migration
  debt; absence in a module with very many migrations might be worth a passing
  mention.
- See `references/frameworks/<detected>.md` for framework-specific migration
  safety patterns.

### Distributed resilience patterns
- **Circuit breakers on external calls**: Any code that makes HTTP calls, connects
  to external services, or depends on third-party APIs should use a circuit
  breaker pattern. Without it, a slow or failing dependency can cascade: threads
  block waiting for timeouts, resources exhaust, and the calling service degrades
  alongside the failing one. A circuit breaker lets the calling service fail fast
  and recover autonomously.
- **Timeouts on all external calls**: Every outbound HTTP call, database query
  with external routing, and message queue publish should have an explicit timeout.
  Missing timeouts mean a single hung connection can block a worker indefinitely.
  Default framework timeouts (often 30+ seconds) are usually too long for
  synchronous request paths.
- **Retry with exponential backoff + jitter**: For transient failures (network
  glitches, rate-limited APIs), retry logic should use exponential backoff with
  random jitter to avoid thundering herd. Retrying immediately or at fixed
  intervals can amplify load on a struggling dependency.
- **Bulkheads on resource pools**: Critical operations that depend on shared
  resources (thread pools, connection pools, queue capacity) should be isolated
  so that one slow consumer can't starve others. Without bulkheads, a single
  misbehaving background task can consume all database connections and block
  API requests.
- **Rate limiting on sensitive endpoints**: Auth, password reset, and
  payment-processing endpoints should enforce rate limits. Missing rate limits
  allow brute-force attacks and accidental load spikes to overwhelm the system.
- **Graceful degradation / fallback**: When a non-critical dependency is
  unavailable, can the system still serve requests in a degraded mode? A product
  listing page that crashes because the recommendation engine is down could
  instead show products without recommendations. Total failure is worse than
  degraded service.

### Error handling
- Bare catch-all exception handlers followed by `pass` or a bare log with no
  re-raise or user-facing error — silent failure modes. In controllers, this
  can mean a user gets a success response while an operation silently failed.
  In background tasks, this can mean a task reports success while having done
  nothing.
- Consistent error handling: is there a custom error handler for consistent
  response shapes, or does the API return framework defaults? Check it's
  consistent — not a mix of custom error shapes from some handlers and defaults
  from others.
- Custom exception classes: if the project has a custom exception pattern (e.g.
  dual-compat exceptions for admin + API), check that new exceptions follow this
  pattern rather than creating standalone exceptions that won't work in all
  contexts.

### Documentation
- API documentation: schema generators or manual docs — present and reasonably
  current (spot-check that a few documented endpoints match actual handler
  behavior)?
- Project-level docs (README, contribution guide, agent context files) — do they
  describe the conventions found in `ARCHITECTURE.md` §2-4? If `ARCHITECTURE.md`
  and other docs contradict each other, that's worth surfacing (one of them is
  stale).
- Module-level docs: does each module have at least a brief description of its
  purpose and key patterns?

## What not to flag

- Missing tests for thin, framework-generated code (e.g. a default CRUD handler
  with no custom logic beyond basic config) — the framework itself is well-tested;
  the value of a test here is low.
- High migration counts in modules under active early-stage development — churn
  is expected; only note it if it correlates with other stability findings.
- Irreversible migrations explicitly noted in `ARCHITECTURE.md` §4 as
  intentional (e.g. "we don't support rollback past migration 0042 by policy").
- Documentation style differences that don't affect accuracy (e.g. Markdown vs
  RST, or docstring format, if not contradicted by a configured tool).

## Scoring rubric

- **9–10** — Test layout matches house style; core business logic (services/tasks
  touching money, inventory, auth) has tests with external dependencies mocked;
  schema changes are reversible or intentionally documented otherwise; consistent
  error handling; docs in sync with code.
- **7–8** — Solid coverage of core logic; a few peripheral modules untested but
  low-risk; minor doc staleness.
- **5–6** — Core business logic has *some* tests but with gaps (e.g. happy path
  only, no edge cases for financial calculations); one or two irreversible data
  changes without documentation; occasional silent exception handling.
- **3–4** — Significant untested business logic in services/tasks that mutate
  important state; tests that exist hit real external services or are unreliable;
  multiple silent failure modes found.
- **1–2** — Core financial/state-changing logic has no tests at all; schema
  changes show evidence of past data-loss-risk patterns (irreversible custom code
  on production-critical models); errors are swallowed broadly enough that
  failures would go unnoticed.

## Example findings format

- `[principle]` `modules/billing/services.py:apply_discount` (handles discount
  stacking logic, ~40 lines, multiple conditionals) has no corresponding test
  in `modules/billing/tests/` — `test_services.py` exists and covers three
  other functions in the same file, so this looks like a gap.
  → Fix: add tests for discount stacking edge cases (zero, negative, overflow).
- `[principle]` `modules/orders/migrations/0017_backfill_totals.py` uses custom
  data code with a no-op reverse — this migration cannot be reversed; if 0017
  needs rolling back after deploy, the backfilled data will remain.
  → Fix: provide a reverse_code that removes or marks the backfilled data.
- `[house-style]` `modules/inventory/tasks.py:sync_stock_levels` calls an
  external API directly with no mock in `modules/inventory/tests/` (test file
  doesn't exist). `modules/orders` and `modules/billing` (Established) mock all
  external HTTP calls in tests — recommend the same pattern here.
