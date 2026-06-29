# SaaS Register

For multi-tenant SaaS systems. Add this register when the system serves
multiple tenants on shared infrastructure and includes subscription,
billing, or quota-based access control.

## Additional Signals Per Lens

### Structure

- **Tenant isolation layer exists.** A dedicated module or middleware
  sets the active tenant context for every request. Without this,
  tenant data leaks between customers.
- **Subscription/billing module separated from core.** Billing logic
  changes at a different cadence than product logic. Mixing them
  couples deployments and makes both harder to reason about.
- **Onboarding flow separated from in-app flow.** Onboarding has
  distinct state machines and failure modes. Interleaving it with
  in-app code creates tangled conditionals.

### Security

- **Every tenant-scoped query filters by tenant ID.** A single
  unfiltered query can expose one tenant's data to another. This is
  the highest-severity SaaS vulnerability.
- **Tenant context propagated to background tasks.** Async jobs that
  lose tenant scope operate on the wrong data or, worse, on all data.
- **No cross-tenant data leakage in nested serialization.** Related
  objects serialized without tenant checks can pull in data from other
  tenants.
- **Admin actions respect tenant scope.** Superuser endpoints that
  bypass tenant filters must be explicit and auditable.

### Domain Integrity

- **Subscription lifecycle facade enforced.** All subscription state
  changes route through a single service. Direct mutations create
  billing inconsistencies that are expensive to reconcile.
- **Quota checks before resource creation.** Creating resources
  without quota validation leads to overages and revenue leakage.
- **Quota decrement on resource deletion.** Failing to release quota
  on deletion causes artificial limits and customer frustration.
- **Billing state aligns with subscription state.** A cancelled
  subscription still charging is a trust-destroying event.
- **Payment flow uses preview/confirm pattern.** Charging without
  preview creates disputes and chargebacks.

### Performance

- **Tenant-scoped queries use composite indexes.** Indexes on
  (tenant_id, other_filters) prevent full-table scans that degrade
  as tenant count grows.
- **Caching is tenant-aware.** Cache keys must include a tenant
  prefix. Shared cache entries cause data cross-contamination.

### Resilience

- **Subscription/billing code has dedicated tests.** Billing errors
  directly impact revenue. Untested billing code is an unacceptable
  risk.
- **Tenant provisioning has rollback.** Partially provisioned tenants
  leave orphaned data. Rollback ensures atomicity.
- **Data migration respects tenant boundaries.** Migrations that
  process all tenants in one transaction lock the entire system.

### Clarity

- **Subscription states use enum/constants.** String literals for
  states create typo-driven bugs and make state-machine reasoning
  fragile.
- **Tenant ID field named consistently across models.** Mixed naming
  (tenant_id, client_id, org_id) forces readers to map names
  mentally, slowing review and debugging.

### Observability

- **Tenant-scoped logging on all billing events.** Billing errors
  that cannot be traced to a tenant are impossible to reconcile.
- **Subscription state transitions are logged with before/after.**
  Silent state changes make billing disputes unresolvable.
- **Health checks cover external billing integrations.** A broken
  Lago/Stripe connection must surface before customers report it.

## Key Anti-Patterns

| Anti-Pattern | Severity | Detection |
|---|---|---|
| Missing tenant filter on any tenant-scoped query | Critical | ORM query without tenant filter |
| Background task without tenant context | High | Task signature lacks tenant param |
| Subscription status mutated outside lifecycle facade | High | Direct status assignment |
| Quota check missing before resource creation | High | Resource creation without quota call |
| Cache key without tenant prefix | Medium | Cache key constructed without tenant |
| Inconsistent tenant ID field name | Low | Different field names for same concept |
