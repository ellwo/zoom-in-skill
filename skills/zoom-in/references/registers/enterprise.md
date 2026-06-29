# Enterprise Register

For systems requiring compliance, audit trails, role-based or
attribute-based access control, and formal change governance. Add this
register when the system operates in regulated industries or serves
enterprise clients with strict security requirements.

## Additional Signals Per Lens

### Security

- **RBAC/ABAC implementation complete.** Every action is gated by an
  authorization check that references a defined role or attribute
  policy. Incomplete authorization leaves dormant privilege-escalation
  paths.
- **Every mutation has an audit trail.** Enterprise systems must
  answer "who changed what, when." Missing audit records create
  compliance gaps and make incident investigation impossible.
- **PII handling follows compliance rules.** Personally identifiable
  information must be encrypted at rest, masked in logs, and
  deletable on request. Mishandling PII creates legal liability.
- **Rate limiting on sensitive endpoints.** Authentication, password
  reset, and data-export endpoints without rate limiting are targets
  for credential stuffing and data harvesting.

### Domain Integrity

- **Authorization checks on every state transition.** State changes
  without authorization checks allow unauthorized users to move
  resources through workflows they should not control.
- **No privilege escalation paths.** A regular user should never be
  able to reach admin-only operations through parameter manipulation
  or API chaining.

### Resilience

- **Audit trail is immutable and tested.** Mutable audit logs can be
  tampered with, defeating their purpose. Untested audit code may
  silently drop records.
- **Compliance requirements are documented.** Undocumented compliance
  requirements cannot be verified and will drift over time.
- **Disaster recovery documented.** Enterprise clients require
  evidence of recovery capability. Undocumented procedures cannot be
  tested or trusted.

### Clarity

- **Role names are documented and consistent.** Ambiguous role names
  (admin, superuser, manager without definition) lead to
  misconfigured permissions.
- **Audit log format is documented.** Consumers of audit data
  (compliance teams, SIEM systems) need a stable, documented schema.

### Observability

- **Structured audit logging with correlation IDs.** Enterprise
  audit trails must link related events across services via
  correlation/request IDs. Without them, reconstructing an incident
  across microservices is guesswork.
- **SIEM integration or export capability.** Enterprise compliance
  often requires feeding logs into a SIEM. Hard-to-export logs create
  manual compliance overhead.
- **Health checks verify compliance-critical dependencies.** A
  certificate authority, HSM, or compliance database going down must
  surface immediately, not wait for a user report.

## Key Anti-Patterns

| Anti-Pattern | Severity | Detection |
|---|---|---|
| Mutation without audit trail | Critical | Create/update/delete with no log entry |
| Hardcoded role checks instead of RBAC/ABAC | High | If/else on role string literals |
| PII in log output | Critical | Logging statement includes user data |
| Missing rate limiting on auth endpoints | High | No throttle decorator on login/signup |
| Mutable audit log table | High | Audit model allows update/delete |
| Undocumented compliance requirements | Medium | No compliance doc or spec |
| Inconsistent role naming | Low | Same role called different names |
| Authorization check missing on state transition | Critical | Status change without permission guard |
