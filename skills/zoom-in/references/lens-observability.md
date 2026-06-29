# Observability Lens — Production Visibility & Operational Insight

## What this lens evaluates

Whether the team can understand what the system is doing in production: structured
logging, health checks, metrics, distributed tracing, and alerting. Observability
determines whether problems are found in minutes or days, and whether resilience
mechanisms (circuit breakers, retries) are actually working as intended.

This lens is distinct from Resilience. Resilience asks "can the system withstand
failure?" Observability asks "can the team know about failure, diagnose it, and
verify the fix?" A resilient system without observability is a black box — it
survives but nobody knows why or how.

**Principle foundations**: This lens is grounded in the Three Pillars of
Observability and the Fallacies of Distributed Computing. See
`references/principles/observability.md` for the theoretical basis.

## Three conceptual layers

| Layer | Source | What it checks |
|-------|--------|----------------|
| **Universal** | This file | Structured logging, health endpoints, correlation IDs, error tracking, metric coverage on hot paths |
| **Framework** | `references/frameworks/<detected>.md` | Framework-specific logging config, health check libraries, middleware for request tracing |
| **House-Style** | `ARCHITECTURE.md` §2 (Observability patterns) | Logging format conventions, metric naming, alerting thresholds, dashboard expectations |

A missing health check is `[principle]` regardless of house style. Whether the project
uses Prometheus or StatsD for metrics is `[house-style]`.

## Calibrating against house style

Read `ARCHITECTURE.md` §2 ("Observability" under Established Patterns) for:
- The project's logging format and level conventions
- Metric naming and labeling conventions
- Health check endpoint expectations (liveness vs readiness)
- Alerting rules and where they're defined
- Distributed tracing setup and propagation format

If no Observability patterns are recorded in ARCHITECTURE.md (first run or this
area wasn't sampled), evaluate against general conventions but tag findings as
`[principle]` and note that house style hasn't been established here yet.

## Signals to check

### Structured logging
- **Log format**: Are logs structured (JSON with consistent fields) or unstructured
  (free-text lines)? Unstructured logs are unsearchable at scale — a `[principle]`
  finding for any project with more than one service.
- **Correlation IDs**: Is a request/trace ID propagated across service boundaries
  and included in every log entry? Without correlation IDs, tracing a request
  through multiple services requires manual timestamp matching.
- **Log levels**: Are log levels used correctly? `ERROR` for actual failures,
  `WARNING` for degraded behavior, `INFO` for significant events, `DEBUG` for
  development detail. Common problems: using `ERROR` for expected conditions
  (causes alert fatigue), using `INFO` for actual errors (invisible in monitoring).
- **Sensitive data in logs**: PII, tokens, passwords, or secrets logged at any
  level. This is also a Security finding, but the Observability lens checks it
  from the "what goes into the log pipeline" angle.

### Health checks
- **Liveness endpoint**: Does the service expose an endpoint that indicates the
  process is alive and not deadlocked? Missing liveness check means orchestrators
  (Kubernetes, Docker) can't restart hung processes.
- **Readiness endpoint**: Does the service expose an endpoint that indicates it
  can handle requests (database connected, cache available, dependencies reachable)?
  Missing readiness check means traffic routes to instances that aren't ready.
- **Depth of health checks**: A health check that always returns 200 is worse than
  no health check — it gives false confidence. Health checks should verify critical
  dependencies (database, cache, message broker).

### Metrics
- **Coverage on hot paths**: Do critical endpoints and background tasks emit
  metrics (request count, latency, error rate)? Missing metrics on hot paths
  means performance degradation is invisible until users complain.
- **RED method for endpoints**: For each API endpoint, are there metrics for
  **R**ate (requests/second), **E**rrors (error rate), and **D**uration (latency
  histogram)? This is the standard observability pattern for HTTP services.
- **USE method for resources**: For infrastructure resources (databases, caches,
  message queues), are there metrics for **U**tilization, **S**aturation, and
  **E**rrors? Missing resource metrics means capacity planning is guesswork.
- **Business metrics**: For domain-critical operations (payments processed,
  subscriptions activated, orders fulfilled), are there counter/gauge metrics?
  Business metrics catch logic errors that technical metrics can't.

### Distributed tracing
- **Trace propagation**: For systems with multiple services or async boundaries,
  is trace context propagated across service calls and message queue boundaries?
  Without propagation, a request that spans three services produces three
  disconnected traces.
- **Span coverage**: Are external calls (HTTP, database, cache, message queue)
  instrumented as spans? Missing spans create blind spots in the trace.
- **Trace sampling**: Is there a sampling strategy? 100% sampling on high-traffic
  services may overwhelm the trace backend. No sampling may mean traces are
  missing for rare but critical paths.

### Error tracking
- **Exception aggregation**: Are unhandled exceptions captured and aggregated
  (e.g., Sentry, Rollbar, Cloud Error Reporting)? Without aggregation, the same
  error appears in logs dozens of times without triage or deduplication.
- **Stack trace preservation**: Do error tracking systems capture and display
  full stack traces, not just error messages? An error message without a trace
  is often unactionable.
- **Error assignment and tracking**: Can errors be assigned, tagged, and tracked
  to resolution? Ad-hoc error tracking (grep the logs) doesn't scale.

### Alerting
- **Alert rules for critical conditions**: Are there alerting rules for the most
  critical conditions (error rate spikes, latency degradation, health check
  failures, queue backlog growth)? No alerts means problems are discovered by
  users, not by the team.
- **Alert quality**: Are alerts actionable (they tell you what's wrong and where)
  vs. noisy (they fire frequently for non-critical conditions)? Alert fatigue is
  worse than no alerts — the team learns to ignore all of them.
- **On-call documentation**: For each alert, is there runbook documentation
  describing the likely cause and remediation steps? An alert without a runbook
  is a pager that goes off with no instructions.

## What not to flag

- Projects with a single service and low traffic — distributed tracing and
  complex sampling strategies are premature for a monolith with <100 RPS.
- Missing metrics on internal-only admin endpoints that see <10 requests/day.
- Logging format inconsistencies in test fixtures or development-only config.
- Absence of business metrics in early-stage projects where the domain is still
  evolving rapidly.

## Scoring rubric

- **9–10** — Structured logging with correlation IDs throughout; health checks
  verify critical dependencies; RED metrics on all hot paths; distributed tracing
  spans cover external calls; error tracking with runbooks; alerts are actionable
  and documented.
- **7–8** — Structured logging present; health checks exist but may be shallow;
  metrics cover most hot paths; error tracking configured; some alerting gaps.
- **5–6** — Logging is structured in some services but inconsistent; health
  checks exist but are shallow or unreliable; metrics are sparse on hot paths;
  no distributed tracing or error tracking.
- **3–4** — Unstructured logging throughout; no health checks or shallow-only;
  no metrics on critical paths; errors discovered only through log grep; no
  alerting or alerting is consistently noisy.
- **1–2** — No structured logging; no health checks; no metrics; no error
  tracking; no alerting; problems are discovered exclusively by user reports.

## Example findings format

- `[principle]` `modules/billing/services.py:process_payment` — no structured
  logging on the payment processing path. When a payment fails, the only log is
  `print(f"Payment failed: {e}")`. This is unsearchable in production log
  aggregation, making payment failure diagnosis a manual log-grep exercise.
  → Fix: use the project's logger with structured fields (payment_id, amount,
  provider, error_code).
- `[principle]` No health check endpoint exists — the service runs in Kubernetes
  but has no `/health/` or `/readiness/` endpoint. Kubernetes will route traffic
  to instances regardless of their actual state, and won't restart hung processes.
  → Fix: add liveness and readiness endpoints; verify database and cache
  connectivity in readiness.
- `[house-style]` `modules/orders/tasks.py:fulfill_order` emits `logger.info`
  without a correlation ID. `modules/billing` (Established) includes `request_id`
  in every log entry via logging filter. The orders module's logs are untraceable
  when multiple fulfillments run concurrently.
  → Fix: add the project's correlation ID logging filter to the orders module.
