# Clean Architecture — Backend Audit Context

Clean Architecture (also known as Onion or Hexagonal Architecture)
enforces the dependency rule: source code dependencies point inward
only. The outer layers depend on inner layers, never the reverse.
This principle is the theoretical basis for many Structure and
Domain Integrity lens checks.

---

## The Dependency Rule

**Definition:** Code on an inner circle must not know anything about
code on an outer circle. Dependencies always point inward.

**Why it matters:** When business logic imports a database driver,
changing the database requires changing the business logic. When
business logic depends on abstractions, the database implementation
can be swapped without touching the core. The dependency rule makes
the business the stable center and infrastructure the volatile
periphery.

---

## The Layers

### Entities (Innermost)

Business rules that are independent of any specific application.
These are the most stable parts of the system. They have no
knowledge of databases, web frameworks, or external services.

**Audit signal:** An entity class that imports an ORM base class, a
framework decorator, or a serialization library.

**Anti-pattern:** A domain model that inherits from a database
ORM model, coupling the entity to a specific persistence framework.

---

### Use Cases (Application Business Rules)

Application-specific business rules that orchestrate entities
toward a user goal. Each use case represents one intention.

**Audit signal:** A use case that directly constructs database
queries, makes HTTP calls, or imports an infrastructure module.

**Anti-pattern:** A "service" method that performs a business
calculation, then immediately writes the result to a database and
publishes an event — mixing orchestration with infrastructure.

**Why it matters:** Use cases should be testable with mocked
infrastructure. If they import concrete infrastructure, tests
require real databases, HTTP servers, or message brokers.

---

### Interface Adapters

Translate data between the format convenient for use cases/entities
and the format convenient for infrastructure. Includes controllers,
presenters, serializers, and repository implementations.

**Audit signal:** A controller that contains business logic (policy
checks, state transitions, calculations) instead of delegating to a
use case.

**Anti-pattern:** A view or controller that validates input, applies
business rules, queries the database, and formats the response — all
in one method.

---

### Infrastructure (Outermost)

Frameworks, drivers, and external services. Database
implementations, web frameworks, email providers, message queues.
This layer is the most volatile and the most replaceable.

**Audit signal:** Infrastructure code that contains business rules
(SQL with embedded policy logic, webhook handlers that make business
decisions).

**Anti-pattern:** A database trigger or stored procedure that
enforces a business rule, making the rule invisible to the
application and untestable in isolation.

---

## Key Anti-Patterns

### Fat Controller

A controller that does more than translate and delegate. It contains
validation, authorization, business logic, and persistence — all in
one handler.

**Detection signal:** A controller method longer than 15-20 lines,
or one that imports from both domain and infrastructure packages.

**Why it matters:** Fat controllers are hard to test, hard to reuse,
and hard to understand. Each responsibility mixed in is a source of
bugs when any one concern changes.

---

### Anemic Domain Model

Domain entities that are pure data bags with no behavior. All
business logic lives in services that operate on the entities
externally.

**Detection signal:** Entity classes with only getters and setters.
Business rules implemented as standalone functions that accept the
entity as a parameter.

**Why it matters:** Anemic models scatter business rules across
services, making it easy to bypass invariants. Rich domain models
encapsulate rules, ensuring every state change is valid by
construction.

---

### Framework Coupling in Business Logic

Business logic that depends on a specific framework's base classes,
decorators, or utilities.

**Detection signal:** Domain-layer imports that reference a web
framework, ORM, or messaging library.

**Why it matters:** Framework-coupled business logic cannot be
tested without the framework, cannot be ported to a different
framework, and cannot be reused in a different context (e.g., a CLI
tool or a background job).

---

## Audit Checklist Summary

| Check | Layer | Pass Signal | Fail Signal |
|---|---|---|---|
| Entity has no infrastructure imports | Entities | Pure Python/class | ORM base class import |
| Use case has no concrete infrastructure | Use Cases | Depends on interfaces | Imports database client |
| Controller delegates to use case | Adapters | Thin translation layer | Business logic in handler |
| Repository interface in domain layer | Adapters | Domain owns the interface | Domain imports repository impl |
| Infrastructure has no business rules | Infrastructure | Data access only | SQL with policy logic |
