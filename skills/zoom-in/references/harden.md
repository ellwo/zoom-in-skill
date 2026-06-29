# `/zoom-in harden [scope]` — Deep Security Review

> Security is not a lens among equals — it's the one that can take down everything else.

---

## Purpose

Focused security assessment beyond what the general audit's Security lens covers. While `/zoom-in audit` checks security alongside six other lenses, `/zoom-in harden` dedicates full attention across OWASP categories, infrastructure configuration, and domain-specific compliance.

**Why this matters**: A general audit might flag "missing input validation" as ⚠️ Medium. `/zoom-in harden` would trace that through injection risk, data exposure, privilege escalation, and compliance violation — potentially elevating to 🔴 Critical. Security deserves dedicated depth.

---

## Chain of Thought

1. **Analyze** — Scan for security vulnerabilities across all OWASP categories.
2. **Critique** — Evaluate each finding for exploitability, blast radius, and compensating controls.
3. **Propose** — Rank by real-world risk, not theoretical severity. Suggest concrete mitigations.
4. **Execute** — Produce a security-focused report with remediation priorities.

---

## Prerequisites

**Load DECISIONS.md** — Active decisions tagged with Security or Domain Integrity lenses may impose additional security requirements beyond the standard checklist.

**Load ANTI-PATTERNS.md** — Specifically §2 (framework bans), §3 (register bans), and §5 (team-added bans). Security-relevant bans override any permissive default.

---

## Step-by-Step Process

### Step 1: Load Context

Load in order:
1. **SYSTEM.md** — Domain context, register selection, critical flows (identify high-value targets)
2. **ARCHITECTURE.md** §2 — Established security patterns, adopted decisions
3. **references/lens-security.md** — Universal security signals
4. **DECISIONS.md** — Check for Active decisions tagged Security or Domain Integrity that add security requirements
5. **ANTI-PATTERNS.md** — Check all sections (especially §2, §3, §5) for security-relevant bans
6. **Register reference(s)** — Enterprise: compliance rules; SaaS: tenant isolation rules
7. **Framework security reference** — Framework-specific patterns and known pitfalls

**Why context matters**: A billing endpoint in a SaaS product is a higher-value target than a preferences endpoint in an internal tool. Context determines which findings are truly critical.

### Step 2: OWASP Top 10 Checklist

Walk through each category systematically. Do not skip — unchecked categories are unknowns, not clearances.

**A01 — Broken Access Control**:
- Can users access other users'/tenants' resources?
- Are authorization checks on every endpoint, not just "sensitive" ones?
- Can lower-privilege users escalate through parameter manipulation?
- Are direct object references used without authorization checks?

**A02 — Cryptographic Failures**:
- Sensitive data encrypted at rest and in transit?
- Weak hashing (MD5, SHA1) used for passwords or tokens?
- Encryption keys stored separately from encrypted data?
- TLS enforced for all connections including internal?

**A03 — Injection**:
- All database queries parameterized or ORM-protected?
- User inputs sanitized before use in shell commands, HTML, or logs?
- ORM raw query used with string interpolation?
- File paths constructed from user input without sanitization?

**A04 — Insecure Design**:
- Business logic flows exploitable (e.g., skip payment step)?
- Rate limiting on auth and high-value endpoints?
- Non-idempotent operations replayable?
- Trust boundaries between modules, or everything trusts everything?

**A05 — Security Misconfiguration**:
- Debug mode disabled in production?
- Default credentials changed for all services?
- Unused features and endpoints disabled?
- Error messages sanitized (no stack traces, internal paths)?
- CORS headers restrictive, not permissive?

**A06 — Vulnerable Components**:
- Lock files scanned for known CVEs?
- Dependency versions pinned, not floating?
- Deprecated/unmaintained libraries removed?

**A07 — Auth Failures**:
- Reasonable password policies (length over complexity)?
- MFA available and enforced for sensitive operations?
- Session tokens rotated after login?
- JWTs validated for issuer, audience, and expiration?
- Account lockout after repeated failures?

**A08 — Integrity Failures**: CI/CD protected? Auto-updates signature-verified? Critical transforms integrity-checked?

**A09 — Logging Failures**: Auth failures logged (without passwords)? Access control failures logged? Sensitive operations auditable? Logs centralized and tamper-resistant?

**A10 — SSRF**: User-supplied URLs in outbound requests? Outbound restricted to allowed destinations? Internal services reachable via user-controlled URLs?

### Step 3: Deep Checks

**Authentication**: Token lifecycle (generation, storage, validation, revocation). Session invalidation. Credential hashing (modern algorithms only). OAuth redirect URI validation and state parameter usage.

**Authorization**: Permission coverage per endpoint. Role escalation via API. Tenant isolation — are ALL queries filtered? Admin endpoints on separate auth layer or just a boolean check?

**Input handling**: Mass assignment (users setting `is_admin=true`?). File upload validation (type, storage outside web root, filename sanitization). Content type and size limits enforced?

**Data exposure**: Error responses leaking stack traces/SQL/paths? Secrets in logs? PII redacted? API responses filtering by role? Debug/info endpoints exposing configuration?

**Configuration**: Secrets in environment variables or hardcoded? CORS origin `*` when it should be specific? Host validation permissive? Debug toggle possible in production?

**Dependencies**: Lock files scanned for CVEs. Deprecated packages flagged. Deterministic resolution (lock files committed).

**Compliance** (Enterprise register): Audit trails (user + timestamp for data modifications). Data retention enforcement. PII identification and extra protection. Right-to-erasure capability.

**Decision compliance**: Verify that security-related Active Decisions from DECISIONS.md are followed in the scope. A decision like "all tenant-scoped queries must use the global tenant filter" is a security requirement, not just a convention.

**Ban compliance**: Verify that no code in scope violates any ban from ANTI-PATTERNS.md. Bans are non-negotiable — a banned framework or pattern cannot appear even as a workaround for a security fix.

### Step 4: Produce Security Report

```
# Zoom-in Harden: [scope]

## Security Score: X/10

## Findings by OWASP Category

### A01 — Broken Access Control
- [H-1] 🔴 Critical — Tenant isolation missing on batch export → `path/to/file:67` → Add tenant filter
- [H-2] 🟠 High — User can set role via profile update → `path/to/file:34` → Whitelist updateable fields

### A03 — Injection
- [H-3] 🔴 Critical — Raw SQL with string interpolation → `path/to/file:112` → Parameterize

### A05 — Security Misconfiguration
- [H-4] ⚠️ Medium — Debug mode configurable without safeguard → `path/to/config:8` → Add production assertion

## Remediation Priority
1. [H-1] Tenant isolation gap — cross-tenant data exposure
2. [H-3] SQL injection — arbitrary data access
3. [H-2] Mass assignment on role field — privilege escalation

## Recommended Next Steps
1. `/zoom-in refactor` — Apply security fixes in priority order
2. `/zoom-in verify` — Confirm fixes are valid and didn't introduce new vulnerabilities
3. `/zoom-in audit` — Full re-audit to confirm Security score improvement
4. `/zoom-in adopt --ban` — If a security anti-pattern was discovered, ban it to prevent recurrence
```

---

## Integration with Other Commands

- `/zoom-in audit` provides general Security lens score; `/zoom-in harden` provides depth
- `/zoom-in focus security` provides root-cause analysis for security patterns; harden provides OWASP-level breadth. Use focus when you know *why* security is weak and need the root cause; use harden for a full security assessment.
- `/zoom-in refactor` consumes harden findings the same as audit findings
- `/zoom-in verify` confirms harden-driven fixes are valid and didn't introduce new vulnerabilities
- `/zoom-in plan` includes security considerations from harden results
- `/zoom-in adopt --ban "..."` can add security-specific bans to ANTI-PATTERNS.md when harden reveals a pattern that must never be used

---

## Failure Modes

| Situation | Response |
|---|---|
| No lock file for dependency check | Note in report; recommend adding lock files |
| No test credentials for auth testing | Check code statically; note dynamic testing not performed |
| Framework vulnerability DB unavailable | Use OWASP categories only; note framework checks limited |
