# Security Lens — Security & Data Protection

## What this lens evaluates

Authentication/permission consistency, secrets and settings management, input
validation, CSRF/CORS configuration, and data exposure risks (e.g. sensitive data
in background task arguments or logs). Security findings skew heavily toward
`[principle]` — a missing permission check is a problem regardless of how the
rest of the codebase handles permissions — but **consistency** still matters: an
inconsistent permission scheme is itself a security risk (the inconsistency is
where mistakes hide), so house-style calibration is used to find *which endpoints
are the outliers*.

**Principle foundations**: This lens is grounded in REST security constraints and
Twelve-Factor App configuration principles. See `references/principles/rest-constraints.md`
for stateless/auth constraint theory and `references/principles/twelve-factor.md`
for config/secrets management principles.

## Three conceptual layers

| Layer | Source | What it checks |
|-------|--------|----------------|
| **Universal** | This file | Hardcoded secrets, missing permission checks, unparameterized queries, mass-assignment, sensitive data in task args/logs |
| **Framework** | `references/frameworks/<detected>.md` | Framework auth/permission classes, CSRF/session config, ORM injection patterns, framework-specific security middleware |
| **House-Style** | `ARCHITECTURE.md` §2 (Security patterns) | Default permission posture, RBAC/action map conventions, throttling expectations, secret loading approach |

A missing permission check is `[principle]` regardless of house style. Whether
the project uses a specific permission class pattern is `[house-style]`.

## Calibrating against house style

Read `ARCHITECTURE.md` §2 ("Security" under Established Patterns) for: the
project's default permission posture (e.g. authenticated-only globally, with
specific handlers opting into public access for designated endpoints), how secrets
are loaded, and whether throttling is expected on certain endpoint types (auth,
password reset, etc.).

## Signals to check

### Permissions & access control
- Default permission posture in settings/config — what's the baseline? Then
  check per-handler permission overrides: which ones *loosen* the default (e.g.
  allow unauthenticated access)? Each loosening is worth individually
  understanding — is it a deliberately public endpoint (health check, public
  listing) or a forgotten permission?
- **Object-level permissions**: for endpoints where a user should only access
  their *own* resources (orders, profile, etc.), is there a consistent pattern —
  a permission check verifying ownership, or query scoping filtered by the
  requesting user? Check whether query scoping is consistent across handlers
  that represent user-owned resources — a handler returning unfiltered queries
  for a user-owned resource while sibling handlers scope by user is a significant
  finding.
- **RBAC action maps**: if an action-based permission map is Established, check
  that every handler action is covered, including custom actions. An uncovered
  action inherits the handler's general permission which may be too permissive.
- **Admin/staff-only actions**: custom actions that perform privileged operations
  (refunds, status overrides) — do they have their own permission check, or do
  they inherit the handler's general permission?
- **Tenant isolation**: in multi-tenant projects, check that queries are filtered
  by the current tenant context. A handler returning unfiltered queries on a
  multi-tenant model is a critical data leak. See also the Domain Integrity lens
  for deeper tenant isolation checks.

### Secrets & settings
- Any hardcoded value (vs. environment variables / config loader) for
  `SECRET_KEY`, `PASSWORD`, `API_KEY`, `TOKEN`, or similar secret names is a
  finding. Pay attention to whether it's in a file that would be committed to
  version control (vs. a `.env.example` showing the *shape* of expected vars,
  which is fine and good practice).
- Debug mode — is it enabled in any settings file that could plausibly be used
  in production (i.e. not clearly isolated to a dev-only config that's
  gitignored)?
- Wildcard allowed hosts/origins in non-dev settings.
- Permissive CORS configuration in production settings.

### Input validation
- Input schemas that expose all model fields — check whether write-protected
  fields (e.g. `is_admin`, `status`, `user`, computed/internal fields) are
  excluded from client-writable input. An open schema on a model with
  privilege-related fields and no write-protection is a mass-assignment risk.
- Raw SQL: check that any user input reaching raw queries is parameterized
  (using the framework's parameter placeholder style), not string-interpolated.
- File uploads: is there validation on content type and/or size?
- Missing type coercion on user-supplied parameters (e.g. string IDs passed to
  integer-expecting queries without conversion).

### Background tasks & data exposure
- Check task signatures for arguments named (or clearly containing) `password`,
  `token`, `secret`, `card`, `ssn`, or similar — these get stored in the
  message broker and potentially the result backend, and often end up in worker
  logs at INFO/DEBUG level via argument logging.
- Exception logging: check whether full request bodies/user objects are logged
  on error (potential PII/secret leakage into logs).

### Authentication
- Password hashing: check that password hashing is configured with a strong
  algorithm — flag only if overridden to something weak; framework defaults are
  usually fine.
- Token/session config: is there token rotation/expiry configured? Long-lived
  or non-expiring tokens on sensitive APIs are worth flagging.
- CSRF protection: verify CSRF is enabled for session-based auth paths.
- See `references/frameworks/<detected>.md` for framework-specific auth
  configuration checks.

## What not to flag

- Public access on endpoints that are clearly meant to be public (health checks,
  public product listings, login/registration endpoints themselves) — confirm
  the endpoint's purpose before flagging permission config.
- Secrets loaded via environment in a way that differs stylistically between
  `os.environ.get` and a config library — this is a Clarity/house-style
  question, not a Security one, as long as *both* avoid hardcoding.
- Raw queries with properly parameterized placeholders — these are sometimes
  the right tool for complex queries and aren't inherently a finding.
- Framework-default security settings that are already secure (e.g. don't flag
  a framework's default password hasher — only flag if it's been weakened).

## Scoring rubric

- **9–10** — Permission scheme is consistent and matches house style; no
  hardcoded secrets; settings clearly separate dev/prod; input validation
  present where mass-assignment or injection risk exists; no sensitive data in
  task signatures/logs.
- **7–8** — One isolated permission inconsistency on a low-sensitivity
  endpoint, or a minor settings hygiene issue — nothing exploitable.
- **5–6** — At least one endpoint with a permission gap relative to its sibling
  endpoints (e.g. missing object-level filtering), or an open input schema on a
  model with sensitive fields.
- **3–4** — Multiple permission gaps on user-owned resources, debug mode or
  wildcard hosts reachable outside clearly-dev settings, or sensitive values
  passed as background task arguments.
- **1–2** — Direct, exploitable issues: unparameterized raw queries with user
  input, hardcoded production secrets committed to the repo, or an authorization
  bypass (any user can access/modify any other user's data via unfiltered
  queries).

## Example findings format

- `[principle]` `modules/orders/handlers.py:OrderHandler.get_queryset` returns
  unfiltered queries with no tenant filter, while
  `modules/billing/handlers.py:InvoiceHandler.get_queryset` (Established pattern)
  filters by current tenant. Any authenticated user can currently list/retrieve
  any order across tenants.
- `[principle]` `modules/notifications/tasks.py:send_password_reset_email(user_id,
  reset_token)` passes `reset_token` as a task argument — this value will be
  stored in the message broker and potentially the result store. Consider passing
  only `user_id` and regenerating/looking up the token inside the task.
- `[conflict]` `modules/inventory/schemas.py:ProductSchema` exposes all fields
  including `cost_price` (internal field) with no write-protection;
  `modules/orders` and `modules/billing` (Established) explicitly list permitted
  input fields. Candidate for `/zoom-in adopt`.
