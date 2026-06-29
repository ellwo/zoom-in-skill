# 12-Factor App — Backend Audit Context

The 12-Factor methodology defines practices for building
software-as-a-service that are declarative, portable, and scalable.
Each factor maps to specific audit signals in a backend codebase.

---

## 1. Codebase

**Rule:** One codebase tracked in revision control, many deploys.

**What to check:** The project has a single repository (or a
well-defined monorepo structure). There are no copied-and-pasted
codebases for different environments.

**Anti-pattern:** A separate repo or branch for staging/production
with divergent code.

**Why it matters:** Divergent codebases create deployment drift.
Bugs fixed in one environment may not exist in another. One codebase
ensures every deploy is a known commit.

---

## 2. Dependencies

**Rule:** Explicitly declare and isolate dependencies.

**What to check:** All dependencies are listed in a manifest file
(requirements.txt, pyproject.toml, package.json). No implicit system
packages.

**Anti-pattern:** "Works on my machine" — code that imports a
package not listed in the manifest.

**Why it matters:** Undeclared dependencies create fragile deploys.
A missing library on a new server causes runtime failures with no
clear root cause.

---

## 3. Config

**Rule:** Store configuration in the environment. Secrets never in
code.

**What to check:** All environment-specific values (database URLs,
API keys, feature flags) come from environment variables or a config
service. No credentials in source.

**Anti-pattern:** Database URL hardcoded in a settings file committed
to version control.

**Why it matters:** Config in code couples deploys. Secrets in code
are permanently compromised — even after deletion, they persist in
version history.

---

## 4. Backing Services

**Rule:** Treat backing services (database, cache, queue, storage)
as attached resources, swappable via config.

**What to check:** Connection strings are configurable. The codebase
does not assume a specific provider.

**Anti-pattern:** Vendor-specific SQL dialect in business logic, or
a cache client constructed with a hardcoded host.

**Why it matters:** Swappable backing services enable zero-downtime
migrations, failover to alternates, and environment parity.

---

## 5. Build, Release, Run

**Rule:** Strictly separate build, release, and run stages.

**What to check:** The build produces a self-contained artifact. The
release combines the artifact with config. The run starts the
release.

**Anti-pattern:** Code compiled at runtime, or config fetched during
build.

**Why it matters:** Mixing stages makes reproduction impossible. A
broken release cannot be rolled back if build and run are entangled.

---

## 6. Processes

**Rule:** Execute the app as one or more stateless, share-nothing
processes.

**What to check:** No in-memory state that survives across requests.
Session data, file uploads, and job state live in backing services.

**Anti-pattern:** A global dictionary used as a cache across worker
processes.

**Why it matters:** Stateful processes cannot be restarted or scaled
without data loss. Stateless processes are disposable and
horizontally scalable.

---

## 7. Port Binding

**Rule:** Export services via port binding. No dependency on runtime
injection of a webserver.

**What to check:** The application starts its own HTTP server. No
requirement for an external application server to inject the app.

**Anti-pattern:** Code that can only run when imported by a specific
server process.

**Why it matters:** Self-binding services are portable across hosts
and orchestration platforms without adapter configuration.

---

## 8. Concurrency

**Rule:** Scale out via the process model.

**What to check:** Work is divided by process type (web, worker,
scheduler). Each type scales independently.

**Anti-pattern:** A single process that handles HTTP requests, runs
scheduled jobs, and processes background work.

**Why it matters:** Mixed-concern processes create resource
contention. Scaling one concern scales all, wasting resources or
bottlenecking.

---

## 9. Disposability

**Rule:** Fast startup and graceful shutdown.

**What to check:** Workers drain in-progress tasks on SIGTERM. Web
processes close connections cleanly. Startup completes in seconds.

**Anti-pattern:** A worker that loses in-progress jobs on restart, or
a server that takes minutes to boot.

**Why it matters:** Slow or unclean shutdowns cause data loss and
delay deployments. Fast disposability enables elastic scaling and
zero-downtime deploys.

---

## 10. Dev/Prod Parity

**Rule:** Keep development, staging, and production as similar as
possible.

**What to check:** Same backing-service types across environments.
Same dependency versions. Same deployment mechanism.

**Anti-pattern:** SQLite in development, PostgreSQL in production;
different cache libraries per environment.

**Why it matters:** Parity gaps cause bugs that only surface in
production. The smaller the gap, the fewer "works in dev" surprises.

---

## 11. Logs

**Rule:** Treat logs as event streams. Never manage log files.

**What to check:** The app writes to stdout. Log routing and
persistence are handled by the execution environment.

**Anti-pattern:** A custom log-rotation script, or logs written to a
fixed file path.

**Why it matters:** Environment-managed logs aggregate across
processes, survive process restarts, and feed centralized monitoring
without application changes.

---

## 12. Admin Processes

**Rule:** Run admin/management tasks as one-off processes.

**What to check:** Migrations, data fixes, and batch jobs run in
identical environments to the app. Same codebase, same config.

**Anti-pattern:** A cron job on a server running a different version
of the code with different dependencies.

**Why it matters:** Admin processes against different code or config
can corrupt data or apply incompatible schema changes.
