# Domain-Driven Design — Backend Audit Context

DDD provides patterns for keeping business logic coherent, isolated
from infrastructure, and aligned with how the business actually
works. These patterns are the theoretical basis for many Domain
Integrity and Structure lens checks.

---

## Bounded Contexts

**Definition:** Divide a large system into distinct contexts where a
term has one unambiguous meaning. Each context has its own model,
persistence, and language.

**Audit signal:** A single model representing two business concepts
(e.g., "Customer" meaning both a billing entity and a support
contact). Context boundaries are not reflected in module structure.

**Anti-pattern:** One giant model with fields that only apply in
certain workflows, shared across the entire codebase.

**Why it matters:** Without bounded contexts, a change to how one
part of the business uses a concept ripples through unrelated code.
Contexts isolate change and make the domain model honest in each
boundary.

---

## Ubiquitous Language

**Definition:** Code naming (classes, methods, variables) uses the
same terms as the business domain experts. No translation layer
between domain discussion and code.

**Audit signal:** A business term like "subscription" appears in code
as "agreement," "contract," or "sub_entry" depending on the module.

**Anti-pattern:** Developer-centric naming ("UserRecord",
"DataProcessor") that requires a mental map to translate to business
terms.

**Why it matters:** A shared language eliminates ambiguity. When
domain experts say "subscription" and code says "subscription,"
conversations are precise. Translation layers breed misunderstandings
and bugs.

---

## Aggregate Roots

**Definition:** A cluster of related objects treated as a unit for
state changes. All modifications go through the root entity, which
enforces invariants for the entire aggregate.

**Audit signal:** Related objects are modified independently,
bypassing the root, leading to inconsistent states.

**Anti-pattern:** Directly updating a child entity's status without
going through the parent, allowing the aggregate into an invalid
combined state.

**Why it matters:** Aggregate roots are the enforcement point for
business rules. Without them, invariants are scattered, duplicated,
or simply missing — leading to states the business never intended.

---

## Domain Events

**Definition:** State changes within a context produce events that
other contexts subscribe to. This decouples contexts without
introducing synchronous dependencies.

**Audit signal:** Context A directly calls Context B's service
methods, creating a hard dependency. Or, state changes occur with no
notification, causing stale views in other contexts.

**Anti-pattern:** A subscription module directly calling an email
module's send function instead of emitting a
"SubscriptionActivated" event.

**Why it matters:** Direct coupling between contexts makes
independent deployment and scaling impossible. Events provide loose
coupling while preserving eventual consistency.

---

## Repositories

**Definition:** An abstraction over data access that presents a
collection-like interface. The domain layer interacts with the
repository interface; infrastructure provides the implementation.

**Audit signal:** Business logic containing ORM queries, raw SQL, or
HTTP calls to external services.

**Anti-pattern:** A service method that mixes business rule
evaluation with database query construction.

**Why it matters:** Embedding data access in business logic couples
the domain to a specific storage technology. Repositories make the
domain testable with in-memory fakes and portable across storage
backends.

---

## Value Objects

**Definition:** Immutable objects defined by their attributes, not
by identity. Two value objects with identical attributes are equal.

**Audit signal:** A model with an auto-generated ID for a concept
that has no identity needs (e.g., Money, DateRange, Address).

**Anti-pattern:** Creating a full database entity with ID, created_at,
and updated_at for a value that is purely described by its fields.

**Why it matters:** Value objects simplify reasoning — equality is
structural, identity is irrelevant. They prevent accidental mutation
and reduce table proliferation for concepts that do not need
identity tracking.

---

## Anti-Corruption Layer

**Definition:** A translation layer between two bounded contexts that
prevents one context's model from leaking into and corrupting
another.

**Audit signal:** An external system's data model (third-party API
schema, legacy database structure) appears directly in core domain
code.

**Anti-pattern:** Passing a third-party webhook payload object
directly into business logic instead of translating it to a
domain model first.

**Why it matters:** External models change without notice and follow
different design rules. An anti-corruption layer insulates the core
domain from those changes, localizing adaptation code to one place.
