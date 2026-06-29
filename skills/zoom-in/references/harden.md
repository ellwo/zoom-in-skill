# `/zoom-in harden [scope]` — Deep Security Review

Focused security assessment beyond the audit's Security lens: OWASP Top 10, tenant isolation, compliance. Always recommended when Security ≤ 3. A general audit might flag "missing input validation" as ⚠️ Medium; harden traces it through injection risk, data exposure, privilege escalation, compliance violation — potentially elevating to 🔴 Critical.

## Prerequisites

**Load DECISIONS.md** — Active decisions tagged Security or Domain Integrity may impose additional security requirements beyond the standard checklist. **Load ANTI-PATTERNS.md** — specifically §2 (framework bans), §3 (register bans), §5 (team-added bans); security-relevant bans override any permissive default.

## 1. Load Context (in order)

1. `SYSTEM.md` — domain context, register, critical flows (identify high-value targets)
2. `ARCHITECTURE.md` §2 — established security patterns, adopted decisions
3. `references/lens-security.md` — universal security signals
4. `DECISIONS.md` — Active decisions tagged Security/Domain Integrity adding requirements
5. `ANTI-PATTERNS.md` — all sections (especially §2, §3, §5) for security-relevant bans
6. Register reference(s) — Enterprise: compliance rules; SaaS: tenant isolation rules
7. Framework security reference — framework-specific patterns and known pitfalls

A billing endpoint in a SaaS product is a higher-value target than a preferences endpoint in an internal tool — context determines which findings are truly critical.

## 2. OWASP Top 10 Checklist

Walk through each category systematically. **Do not skip — unchecked categories are unknowns, not clearances.**

**A01 — Broken Access Control**: users accessing other tenants' resources? authorization checks on every endpoint (not just "sensitive" ones)? lower-privilege escalation via parameter manipulation? direct object references without authorization checks?

**A02 — Cryptographic Failures**: sensitive data encrypted at rest and in transit? weak hashing (MD5, SHA1) for passwords/tokens? encryption keys stored separately from encrypted data? TLS enforced for all connections including internal?

**A03 — Injection**: all DB queries parameterized or ORM-protected? user inputs sanitized before shell/HTML/logs? ORM raw query with string interpolation? file paths from user input without sanitization?

**A04 — Insecure Design**: business logic flows exploitable (e.g. skip payment step)? rate limiting on auth and high-value endpoints? non-idempotent operations replayable? trust boundaries between modules, or everything trusts everything?

**A05 — Security Misconfiguration**: debug mode disabled in production? default credentials changed? unused features/endpoints disabled? error messages sanitized (no stack traces, internal paths)? CORS restrictive, not permissive?

**A06 — Vulnerable Components**: lock files scanned for known CVEs? dependency versions pinned, not floating? deprecated/unmaintained libraries removed?

**A07 — Auth Failures**: reasonable password policies (length over complexity)? MFA available and enforced for sensitive operations? session tokens rotated after login? JWTs validated for issuer, audience, expiration? account lockout after repeated failures?

**A08 — Integrity Failures**: CI/CD protected? auto-updates signature-verified? critical transforms integrity-checked?

**A09 — Logging Failures**: auth failures logged (without passwords)? access control failures logged? sensitive operations auditable? logs centralized and tamper-resistant?

**A10 — SSRF**: user-supplied URLs in outbound requests? outbound restricted to allowed destinations? internal services reachable via user-controlled URLs?

## 3. Deep Checks

**Authentication**: token lifecycle (generation, storage, validation, revocation); session invalidation; credential hashing (modern algorithms only); OAuth redirect URI validation and state parameter usage.

**Authorization**: permission coverage per endpoint; role escalation via API; tenant isolation — are ALL queries filtered?; admin endpoints on separate auth layer or just a boolean check?

**Input handling**: mass assignment (users setting `is_admin=true`?); file upload validation (type, storage outside web root, filename sanitization); content type and size limits enforced?

**Data exposure**: error responses leaking stack traces/SQL/paths?; secrets in logs?; PII redacted?; API responses filtering by role?; debug/info endpoints exposing configuration?

**Configuration**: secrets in environment variables or hardcoded?; CORS origin `*` when it should be specific?; host validation permissive?; debug toggle possible in production?

**Dependencies**: lock files scanned for CVEs; deprecated packages flagged; deterministic resolution (lock files committed).

**Compliance** (Enterprise register): audit trails (user + timestamp for data modifications); data retention enforcement; PII identification and extra protection; right-to-erasure capability.

**Decision compliance**: verify security-related Active Decisions from DECISIONS.md are followed in scope — a decision like "all tenant-scoped queries must use the global tenant filter" is a security requirement, not just a convention.

**Ban compliance**: verify no code in scope violates any ban from ANTI-PATTERNS.md. Bans are non-negotiable — a banned framework/pattern cannot appear even as a workaround for a security fix.

## 4. Produce Security Report

```
# Zoom-in Harden: [scope]

## Security Score: X/10

## Findings by OWASP Category

### A01 — Broken Access Control
- [H-1] 🔴 Critical — Tenant isolation missing on batch export → path:67 → Add tenant filter
- [H-2] 🟠 High — User can set role via profile update → path:34 → Whitelist updateable fields

### A03 — Injection
- [H-3] 🔴 Critical — Raw SQL with string interpolation → path:112 → Parameterize

### A05 — Security Misconfiguration
- [H-4] ⚠️ Medium — Debug mode configurable without safeguard → config:8 → Add production assertion

## Remediation Priority
1. [H-1] Tenant isolation gap — cross-tenant data exposure
2. [H-3] SQL injection — arbitrary data access
3. [H-2] Mass assignment on role field — privilege escalation

## Recommended Next Steps
1. `/zoom-in refactor` — Apply security fixes in priority order
2. `/zoom-in verify` — Confirm fixes valid, no new vulnerabilities introduced
3. `/zoom-in audit` — Full re-audit to confirm Security score improvement
4. `/zoom-in adopt --ban` — If a security anti-pattern was discovered, ban it to prevent recurrence
```

## Failure Modes

| Situation | Response |
|---|---|
| No lock file for dependency check | Note in report; recommend adding lock files |
| No test credentials for auth testing | Check code statically; note dynamic testing not performed |
| Framework vulnerability DB unavailable | Use OWASP categories only; note framework checks limited |
