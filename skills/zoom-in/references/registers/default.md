# Default Register

For lean, pragmatic projects without special compliance, multi-tenant,
or API-first requirements. This register applies when no other
register is selected. It is intentionally minimal — the seven lenses
already cover fundamental concerns.

## Additional Signals Per Lens

### Structure

- **Basic separation of concerns.** Business logic, data access, and
  presentation are in separate modules or layers. Mixing them in a
  single file or function makes the system harder to navigate and
  test.
- **Configuration separated from code.** Environment-specific values
  (database URLs, feature flags, API keys) live outside the source.
  Hardcoded configuration couples deployments and leaks secrets.

### Security

- **Basic error handling.** Unhandled exceptions return raw tracebacks
  to users. A global exception handler prevents information leakage
  and provides predictable error responses.
- **No secrets in source code.** Credentials, API keys, and tokens
  committed to version control are permanently compromised even after
  deletion.

### Domain Integrity

- **Basic test presence.** Critical paths have automated tests. Zero
  test coverage means every change is a gamble.
- **Constants/enums for known states.** String literals for states
  and types create typo-prone comparisons. Named constants make the
  domain vocabulary explicit.

### Performance

- **Database queries avoid N+1 patterns.** The most common
  performance problem in ORM-based systems. One query per row in a
  loop degrades linearly with data size.

### Resilience

- **Basic documentation exists.** A README with setup instructions
  and a brief architecture description. Undocumented projects require
  tribal knowledge to operate.

### Clarity

- **Naming follows project convention consistently.** Mixed
  conventions (camelCase and snake_case in the same module) force
  readers to context-switch and increase typo rates.

## Why Minimal Is Enough

The seven lenses already check for:

- **Clarity**: naming, structure, readability
- **Structure**: layering, coupling, module boundaries
- **Performance**: query patterns, caching, indexing
- **Security**: auth, validation, data protection
- **Resilience**: error handling, testing, recovery
- **Domain Integrity**: state management, business rule enforcement
- **Observability**: logging, health checks, metrics, tracing, alerting

The Default Register adds only the lightest signals on top. When a
project grows into a SaaS, enterprise, or API-first system, switch to
the corresponding register for deeper checks.

## Anti-Patterns

| Anti-Pattern | Severity | Detection |
|---|---|---|
| Business logic mixed with data access | Medium | Query calls inside business functions |
| Secrets in source code | Critical | Hardcoded credentials in tracked files |
| No tests for critical paths | High | Zero test coverage on core modules |
| N+1 query pattern | High | ORM loop without prefetch/eager load |
| Hardcoded configuration values | Medium | URL or host literals in source |
| Mixed naming conventions | Low | camelCase and snake_case in same module |
