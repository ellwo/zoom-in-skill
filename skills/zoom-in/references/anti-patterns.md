# Anti-Patterns — Backend AI Slop Rejection Engine

Like impeccable's Anti-Slop bans lazy AI frontend patterns (Inter, Fraunces,
glassmorphism), this document bans lazy AI backend patterns. These are not style
preferences — they are universal engineering failures that any backend framework,
language, or architecture can commit.

Every pattern below is a **No-Go**: zoom-in REFUSES to write or approve code that
violates these, and instead proposes the correct alternative.

---

## 10 Absolute No-Go Patterns

### 1. Database Queries Inside Loops (N+1)

**The Anti-Pattern:** Querying the database inside a `for` / `while` / map callback,
issuing one query per iteration instead of one query for all items.

```python
for order in orders:
    customer = Customer.objects.get(id=order.customer_id)  # N queries
```

**Why it's harmful:** 100 items = 100+ round-trips to the database. Under load,
this degrades from "slow" to "outage" — connection pool exhaustion, DB CPU spike,
and cascading timeouts across the system.

**The Correct Alternative:** Batch the query outside the loop. Use eager loading,
`IN` clauses, bulk fetches, or ORM `select_related` / `prefetch_related` equivalents.

```python
customer_ids = [o.customer_id for o in orders]
customers = Customer.objects.filter(id__in=customer_ids)
customer_map = {c.id: c for c in customers}
```

**Detection signal:** Any DB access (ORM query, raw SQL, repository call) inside a
loop body, comprehension, or callback applied to a collection.

---

### 2. Business Logic in Controllers / Views

**The Anti-Pattern:** Putting domain rules, calculations, state mutations, or
multi-step workflows directly inside a route handler, controller action, or view
method.

```python
def create_order(request):
    order = Order.objects.create(...)
    inventory.decrement(order.items)      # domain logic
    payment_gateway.charge(order.total)   # domain logic
    notification.send(order_confirmation) # domain logic
    return Response(order)
```

**Why it's harmful:** The controller becomes untestable in isolation, impossible
to reuse from other entry points (CLI, async task, API, webhook), and grows
without bound. Each new requirement adds another block of logic to the same
function.

**The Correct Alternative:** Extract a service layer (or use case / command
handler). The controller's only job is: parse input → call service → return
output. All domain logic lives in the service.

```python
def create_order(request):
    result = order_service.create(...)
    return custom_response(data=result)
```

**Detection signal:** A controller/view function longer than ~15 lines; any
branching on domain rules; any call to an external service, payment gateway, or
state machine from inside a controller.

---

### 3. Stack Traces in API Responses

**The Anti-Pattern:** Returning raw exception messages, stack traces, or internal
error details to API consumers.

```json
{
  "error": "KeyError: 'user_id'",
  "traceback": "File \"services/auth.py\", line 42, in get_user\n    ..."
}
```

**Why it's harmful:** Leaks internal structure (file paths, class names, library
versions, SQL queries) to attackers. Stack traces are reconnaissance gold — they
reveal the tech stack, entry points, and often the specific vulnerability to
exploit.

**The Correct Alternative:** Return structured error payloads following RFC 7807
Problem Details (or your framework's equivalent). Internal details are logged
server-side only; the client gets a correlation ID and a human-readable message.

```json
{
  "type": "https://example.com/probs/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "The 'user_id' field is required.",
  "instance": "/api/v1/orders/req-abc123"
}
```

**Detection signal:** `str(exception)` or `repr(exception)` in response bodies;
`traceback.format_exc()` anywhere near a response; debug middleware enabled in
production; any `error.message` that contains file paths or class names.

---

### 4. Synchronous Long-Running Operations

**The Anti-Pattern:** Performing expensive work (report generation, bulk imports,
ML inference, third-party API chains) synchronously within the request-response
cycle.

```python
def generate_report(request):
    data = analyze_ten_million_rows()   # takes 45 seconds
    return Response(data)
```

**Why it's harmful:** The client times out. The server thread is blocked. Under
concurrency, a handful of these requests exhausts the worker pool and denies
service to all other requests — a self-inflicted DoS.

**The Correct Alternative:** Accept the job asynchronously. Return `202 Accepted`
with a job/poll URL. Process in a background worker (message queue, task runner,
async job). Client polls or receives a webhook on completion.

```python
def generate_report(request):
    job_id = task_queue.enqueue(analyze_ten_million_rows)
    return Response({"job_id": job_id}, status=202)
```

**Detection signal:** Any request handler that calls a function documented or
observed to take >2 seconds; any `time.sleep()` in a request handler; any
loop over a large dataset (>1000 items) inside a request.

---

### 5. Secrets Hardcoded in Source

**The Anti-Pattern:** API keys, database passwords, JWT secrets, private keys,
or any credential embedded directly in source code.

```python
DATABASE_URL = "postgres://admin:P@ssw0rd!@db.example.com:5432/prod"
STRIPE_SECRET = "sk_live_<redacted-example-key>"
```

**Why it's harmful:** Secrets in source end up in version control. From version
control they spread to every clone, fork, CI log, and backup. Revocation requires
rotating the secret everywhere — a process that is always incomplete. Git history
is permanent.

**The Correct Alternative:** 12-Factor Config — all secrets from environment
variables, secret managers, or encrypted config. Source code contains only
placeholder references.

```python
DATABASE_URL = config("DATABASE_URL")
STRIPE_SECRET = config("STRIPE_SECRET_KEY")
```

**Detection signal:** String literals containing patterns like `password=`,
`secret=`, `key=`, `token=` followed by a non-placeholder value; URLs with
embedded credentials (`user:pass@host`); any `sk_live_`, `AKIA`, or similar
key prefixes in source.

---

### 6. DEBUG Mode in Production

**The Anti-Pattern:** Running the application with debug/development mode enabled
in production environments.

```python
DEBUG = True
APP_ENV = "development"
VERBOSE_ERRORS = True
```

**Why it's harmful:** Debug mode exposes detailed error pages, auto-reloads code
changes, runs with permissive security defaults, and often disables rate limits
and caching. It is the single most common enabler of information disclosure and
remote code execution in web frameworks.

**The Correct Alternative:** Environment-based configuration. Debug mode is set
from an environment variable and is always `False` / off in production.

```python
DEBUG = config("DEBUG", default=False, cast=bool)
```

**Detection signal:** `DEBUG = True` without an environment variable guard; any
`app.run(debug=True)` in production entry points; verbose logging level set
unconditionally; development middleware in production middleware stack.

---

### 7. Unpaginated List Endpoints

**The Anti-Pattern:** A public (or internal) API endpoint that returns all records
from a table without pagination.

```python
def list_orders(request):
    return Response(Order.objects.all())  # could be 10 million rows
```

**Why it's harmful:** An unpaginated endpoint is a memory bomb and a performance
bomb. As data grows, each request consumes more RAM, more serialization time,
and more bandwidth. A table with 100K rows can OOM the process or take 30+
seconds to serialize. Attackers can use it to extract the entire dataset.

**The Correct Alternative:** Paginate all list endpoints. Default page size is
bounded (e.g., 20–50). Clients can request larger pages up to a hard cap.

```python
def list_orders(request):
    return paginated_response(queryset, request)
```

**Detection signal:** `Model.objects.all()` returned directly from a view;
`Response(list(...))` with no pagination wrapper; list endpoints with no
`page`, `limit`, `offset`, or `cursor` parameter.

---

### 8. Bare Catch-All Exception Swallowing

**The Anti-Pattern:** Catching the base exception type (or overly broad
categories) and silently ignoring or discarding the error.

```python
try:
    process_payment(order)
except Exception:
    pass  # or: except: pass
```

**Why it's harmful:** The failure is invisible. No log, no metric, no alert.
The system continues as if nothing happened — orders are "processed" but payment
was never taken. These silent failures are the hardest bugs to diagnose because
there is no evidence they occurred.

**The Correct Alternative:** Catch specific exception types. Always log the
error (at minimum). If recovery is possible, do it explicitly. If not, let the
exception propagate or convert to a domain-specific error.

```python
try:
    process_payment(order)
except PaymentGatewayError as e:
    logger.error("Payment failed for order %s: %s", order.id, e)
    raise OrderProcessingError("Payment could not be processed") from e
```

**Detection signal:** `except Exception:` with `pass` or only a comment;
`except:` (bare except); `except Exception as e:` where `e` is never logged
or re-raised; empty `catch` blocks in any language.

---

### 9. Direct State Mutation Outside Facade

**The Anti-Pattern:** Directly modifying the status, phase, or lifecycle field of
an entity from outside its designated state machine service or facade.

```python
subscription.status = "active"          # direct mutation
subscription.save()
order.state = "fulfilled"               # direct mutation
order.save()
```

**Why it's harmful:** State machines have guards, side effects, and invariants
that must fire on every transition. Direct mutation bypasses all of them — no
audit trail, no validation, no notifications, no derived field updates. The
entity enters an illegal state that no code path expects, causing cascading
failures downstream.

**The Correct Alternative:** Route every state change through the designated
facade/service. The facade is the single writer — it enforces valid transitions,
triggers side effects, records history, and maintains invariants.

```python
lifecycle_service.activate(subscription)
order_service.fulfill(order)
```

**Detection signal:** Direct assignment to a status/state/phase field outside
the entity's own module; `entity.status = ...` in a view, task, signal, or
unrelated service; `save()` calls that modify lifecycle fields without going
through the facade.

---

### 10. Missing Tenant/Context Filter on Scoped Data

**The Anti-Pattern:** Querying a multi-tenant or context-scoped table without
filtering by the current tenant or context.

```python
def list_projects(request):
    return Project.objects.all()  # returns EVERY tenant's projects
```

**Why it's harmful:** Cross-tenant data leakage. One tenant sees another tenant's
data. In regulated industries (healthcare, finance, SaaS with enterprise
customers), this is a reportable breach. It happens silently — no error, no
crash, just the wrong data shown to the wrong person.

**The Correct Alternative:** Always scope queries by the current tenant or
context. Enforce this at the framework level (middleware, queryset defaults,
repository base class) so developers can't forget.

```python
def list_projects(request):
    return Project.objects.filter(tenant_id=get_current_tenant_id())
```

**Detection signal:** `Model.objects.all()` on a tenant-scoped model; any
queryset on a shared-table model without a `.filter(tenant=...)` or equivalent;
`get_queryset()` that doesn't apply tenant scoping; raw SQL without a
`WHERE tenant_id = ?` clause.

---

## Framework-Specific Rejection Signals

The 10 patterns above are universal — they apply to any backend framework in any
language. However, each framework has its own expression of these patterns and
additional framework-specific anti-patterns.

Framework-specific bans are documented in:

- `references/frameworks/django.md` — Django/DRF-specific anti-patterns
  (e.g., `select_related` misuse, middleware ordering, `AUTO_FIELD` defaults)
- `references/frameworks/<name>.md` — Additional framework reference files as
  they are added

When auditing a project, load BOTH this file AND the matching framework file.
Findings that match a framework-specific ban are classified the same way as the
universal No-Gos: `[principle]`, severity 🔴 Critical or 🟠 High.

---

## How to Use This in Audit

When a finding matches one of the 10 No-Go patterns:

1. **Classify as `[principle]`** — never `[house-style]`. These are not
   project-specific conventions; they are universal engineering principles.

2. **Mark severity 🔴 Critical or 🟠 High:**
   - 🔴 Critical — if the violation is actively exploitable or causes data
     corruption in production (patterns 3, 5, 6, 9, 10)
   - 🟠 High — if the violation causes performance degradation or latent
     failures that will surface under load or at scale (patterns 1, 2, 4, 7, 8)

3. **REFUSE to write or approve code that violates these.** When generating
   code, planning a feature, or reviewing a diff, zoom-in must not produce or
   endorse any No-Go pattern. Instead, propose the correct alternative from
   the list above.

4. **Reference this document in the finding.** Every No-Go finding should
   include: "Violates Anti-Pattern #N: [name]" with a link to the pattern's
   correct alternative.

5. **No exceptions in ARCHITECTURE.md §4.** The 10 No-Go patterns cannot be
   listed as "Known Exceptions / Legacy." They are never acceptable, even
   as temporary workarounds. If legacy code violates them, the finding is
   🔴 Critical with a remediation plan, not an acknowledged exception.
