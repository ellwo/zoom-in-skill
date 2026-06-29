# Observability Principles — The Three Pillars & Distributed Systems

The theoretical basis for the Observability lens. These principles govern whether
a team can understand system behavior in production without deploying new code.

---

## The Three Pillars of Observability

Observability rests on three complementary data sources. Missing any pillar
creates a specific class of blind spot.

### Logs — The "What Happened" Pillar

**Definition:** Discrete, timestamped records of events that occurred in the system.

**Why it matters:** Logs answer "what happened at this moment?" They are the
primary diagnostic tool for individual incidents. Without logs, post-mortem
analysis relies on memory and guesswork.

**Structured vs. unstructured**: Unstructured logs (free-text lines) require
regex parsing and are fragile across format changes. Structured logs (JSON with
consistent fields) are machine-parseable, searchable, and aggregatable. For any
project with more than one service, structured logging is non-negotiable.

**Key fields every log entry should include**:
- `timestamp` — when the event occurred
- `level` — severity (ERROR, WARNING, INFO, DEBUG)
- `message` — human-readable description
- `correlation_id` / `trace_id` — links this entry to the request it belongs to
- `service` / `module` — which component produced it

### Metrics — The "How Much / How Fast" Pillar

**Definition:** Numeric measurements aggregated over time (counters, gauges,
histograms).

**Why it matters:** Metrics answer "how often does this happen?" and "how long
does it take?" They detect degradation before it becomes an incident. Without
metrics, the team discovers performance problems through user complaints.

**Two standard methods**:

**RED method** (for request-driven components):
- **R**ate — requests per second
- **E**rrors — failed requests per second
- **D**uration — latency distribution (histogram, not average)

**USE method** (for infrastructure resources):
- **U**tilization — percentage of resource busy
- **S**aturation — queue depth / backlog
- **E**rrors — error count

### Traces — The "Where Did It Go?" Pillar

**Definition:** End-to-end record of a request's journey through the system,
composed of spans (one per operation).

**Why it matters:** Traces answer "where did the time go?" and "which service
caused the error?" Without traces, diagnosing latency in a multi-service
request requires correlating logs by timestamp — fragile and time-consuming.

**Key concepts**:
- **Span** — one operation within a trace (HTTP call, DB query, cache lookup)
- **Propagation** — trace context passed across service boundaries (HTTP headers,
  message metadata)
- **Sampling** — capturing 100% of traces vs. a percentage (high-traffic systems
  need sampling to control cost)

---

## The Fallacies of Distributed Computing

Originally by Peter Deutsch (1994), augmented by others. These eight assumptions
are almost always wrong in distributed systems, and each one creates a specific
observability requirement.

| Fallacy | Why It's Wrong | What Observability Needs |
|---------|---------------|------------------------|
| The network is reliable | Networks drop packets, DNS fails, cables get cut | Retry metrics, circuit breaker state, connection error logging |
| Latency is zero | Every network hop adds milliseconds; cold connections add more | Latency histograms per dependency, timeout alerts |
| Bandwidth is infinite | Large payloads saturate links; shared infrastructure contends | Payload size metrics, bandwidth utilization |
| The topology doesn't change | Services are redeployed, DNS records change, IPs shift | Service discovery health, endpoint version tracking |
| There is one administrator | Multiple teams manage different parts | Correlation IDs, centralized logging, cross-team tracing |
| Transport cost is zero | Encryption, serialization, and network calls consume CPU | CPU metrics on serialization hot spots, payload compression |
| The network is homogeneous | Different protocols, frameworks, and middleware coexist | Protocol-specific error tracking, version compatibility metrics |
| The network is secure | Attackers, misconfigurations, and insider threats exist | Auth failure metrics, anomaly detection, access logging |

**Audit implication**: For each external call in the codebase, check whether the
code assumes the call will succeed, return quickly, and be secure. If it does,
the fallacy is in play and the observability gap is real.

---

## Health Check Principles

### Liveness vs. Readiness

**Liveness** ("am I alive?"): Indicates the process is running and not deadlocked.
A failed liveness check triggers a process restart.

**Readiness** ("can I handle requests?"): Indicates the process can serve traffic
(database connected, cache warm, dependencies reachable). A failed readiness
check triggers traffic removal from load balancers.

**Anti-pattern**: A single `/health/` endpoint that always returns 200. This
convinces orchestrators that everything is fine when the database is down, the
cache is unreachable, and every request would fail.

**Correct pattern**: Separate liveness (cheap, process-level) from readiness
(expensive, dependency-checking). Readiness checks should verify every critical
dependency.

---

## Alerting Principles

### Actionable Alerts

Every alert must answer three questions:
1. **What is broken?** (specific service, endpoint, or dependency)
2. **How do I find out more?** (link to dashboard, trace, or log query)
3. **What do I do about it?** (runbook with remediation steps)

If an alert can't answer all three, it's noise. Noisy alerts train teams to
ignore all alerts, including the critical ones.

### Alert Fatigue

Alert fatigue is the single biggest failure mode in monitoring systems. It occurs
when:
- Alerts fire for non-critical conditions (warning-level logged as error-level)
- Alerts are too sensitive (1-minute windows with no dampening)
- Alerts have no runbook (team doesn't know what to do, dismisses them)
- Alerts fire for known/transient conditions without suppression

**Remediation**: Every alert should have a documented runbook. If no runbook
exists, the alert should be removed until one is written.
