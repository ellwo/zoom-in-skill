# SOLID Principles — Backend Context

These five principles govern how responsibilities are distributed
across a backend codebase. They are not academic exercises — each one
prevents a specific class of maintenance problem that surfaces under
change.

---

## S — Single Responsibility Principle

**Definition:** A module, class, or function should have one reason to
change.

**Why it matters:** When a single component handles persistence,
business rules, and notification, a change to email formatting risks
breaking database transactions. Isolated responsibilities mean
isolated changes and focused tests.

**Backend example:** A subscription service that only manages
lifecycle transitions. It does not send emails, update billing
providers, or write audit logs — it delegates those via events or
service calls.

**Anti-pattern:** A "manager" class that creates a record, charges a
payment provider, sends a confirmation email, and updates a cache all
in one method.

**Detection signal:** A method or class whose name contains "and"
("AndNotifier"), or a class with more than three categories of
dependencies.

---

## O — Open/Closed Principle

**Definition:** Software entities should be open for extension but
closed for modification.

**Why it matters:** Adding a new payment provider should not require
editing existing payment-processing code. Every edit to working code
risks regression. Extension points (strategies, plugins, hooks) let
new behavior arrive without touching proven paths.

**Backend example:** A payment processor that delegates to a
strategy interface. Adding a new provider means implementing the
interface, not modifying the processor.

**Anti-pattern:** A long if/elif chain on a provider identifier
inside a single function, growing with each new provider.

**Detection signal:** Switch/case or if/elif chains on type codes
that grow over time.

---

## L — Liskov Substitution Principle

**Definition:** Subtypes must be substitutable for their base types
without altering correctness.

**Why it matters:** A service interface contract guarantees behavior.
If one implementation raises unexpected exceptions or silently drops
operations, callers cannot reason about the system. Substitutability
enables polymorphism without surprises.

**Backend example:** A cache interface with get/set/delete. Every
implementation (Redis, Memcached, in-memory) must satisfy the same
contract — no implementation should return None on get when the
contract promises to raise on miss.

**Anti-pattern:** A subclass that overrides a method to throw
"not supported," forcing callers to check the concrete type.

**Detection signal:** isinstance checks or type-switching on service
implementations.

---

## I — Interface Segregation Principle

**Definition:** No client should be forced to depend on methods it
does not use.

**Why it matters:** Fat interfaces couple unrelated consumers. When
one consumer needs a new method on a shared interface, all consumers
recompile and potentially break. Segregated interfaces keep coupling
minimal and DTOs lean.

**Backend example:** Separate read and write DTOs rather than one
object with optional fields. A list endpoint returns a summary DTO; a
detail endpoint returns a full DTO.

**Anti-pattern:** A single 30-field serializer used for create,
update, list, and detail — with most fields ignored depending on
context.

**Detection signal:** A DTO or interface where most methods/fields
are unused by most consumers.

---

## D — Dependency Inversion Principle

**Definition:** High-level modules should not depend on low-level
modules. Both should depend on abstractions.

**Why it matters:** Business logic that imports a specific database
driver or external SDK cannot be tested without that infrastructure.
Depending on abstractions makes the core testable with fakes and
portable across infrastructure changes.

**Backend example:** A domain service depends on a repository
interface, not on an ORM query set. The ORM implementation is
injected at composition time.

**Anti-pattern:** Business logic that directly calls an ORM manager
or an HTTP client, making unit tests require a running database or
external service.

**Detection signal:** Domain-layer imports that reference
infrastructure packages (database drivers, HTTP clients, cache
libraries).
