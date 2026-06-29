# CUPID Principles — The Joy of Coding (Backend Context)

Proposed by Dan North (2019), CUPID is a practical complement to SOLID. While
SOLID focuses on structural correctness, CUPID focuses on developer experience
and behavioral expectations. Two of its principles — Predictable and Idiomatic —
address concerns that SOLID doesn't cover at all.

---

## C — Composable

**Definition:** Code should be designed to be combined with other code to produce
new behavior, like Unix pipes.

**Why it matters:** A function that does one thing and returns a result can be
chained, pipelined, and reused. A function that does five things, writes to a
database, and sends an email cannot be composed — it can only be called.

**Backend example:** A `calculate_total(items)` function that returns a number,
which can be composed with `apply_discount(total, rate)` and `format_currency(amount)`.
Each function is testable, reusable, and combinable.

**Anti-pattern:** A `process_order(order)` function that validates, calculates,
charges, sends email, and updates inventory — impossible to reuse for a
different flow (e.g., admin override, bulk import, API migration).

**Detection signal:** A function that performs side effects in the middle of
a calculation, making the result dependent on the side effect.

---

## U — Unix Philosophy

**Definition:** Do one thing and do it well.

**Why it matters:** A module that handles one concern can be understood, tested,
and replaced independently. A module that handles three concerns forces changes
to any one concern to risk breaking the other two.

**Backend example:** A `billing` module that only handles billing lifecycle. It
does not send notifications, update analytics, or manage user preferences —
those are delegated via events or explicit service calls.

**Anti-pattern:** A `utils` or `helpers` module that accumulates unrelated
functions because they "don't belong anywhere else." This is the "junk drawer"
anti-pattern — it grows without bound and imports proliferate.

**Detection signal:** A module with more than 3-4 categories of responsibility,
or a module whose name is a noun that doesn't describe a domain concept
("utils", "helpers", "common", "misc").

---

## P — Predictable

**Definition:** Code should behave as expected. No surprises, no hidden state
mutations, no side effects that aren't obvious from the signature.

**Why it matters:** Predictable code can be reasoned about. If calling a function
might send an email, charge a credit card, or silently modify global state, the
caller cannot predict the outcome from reading the call site. Unpredictable code
breeds defensive coding, excessive logging, and fear of refactoring.

**This is NOT covered by SOLID.** SOLID says nothing about behavioral predictability.

**Backend example:** A `get_user(user_id)` function that returns a user object.
Predictable: it always returns the same user for the same ID, or raises if not
found. Unpredictable: it also increments a view counter, refreshes a cache, and
might return `None` for certain user types without documenting this.

**Anti-pattern:** A property or method that triggers a side effect the caller
didn't expect (e.g., accessing `order.status` triggers a database query to
"refresh" the status). The caller expected a property read, got a network call.

**Detection signal:** Functions that modify state outside their documented scope,
properties that trigger I/O, methods that return different types depending on
input values, and "magic" behavior triggered by specific argument values.

---

## I — Idiomatic

**Definition:** Use the conventions and idioms of the language and framework
you're working with.

**Why it matters:** Code that fights its framework is harder for every developer
on the team to understand, because team members bring framework-specific mental
models. Idiomatic code leverages shared knowledge; non-idiomatic code requires
custom documentation.

**This is NOT covered by SOLID.** SOLID is framework-agnostic by design.

**Backend example (Django)**: Using Django's ORM querysets, model managers,
and class-based views as intended rather than writing raw SQL everywhere and
function-based views that manually parse request bodies.

**Anti-pattern**: Using a Django project but implementing a custom dependency
injection container, custom request parsing, and custom ORM — reimplementing
what the framework provides because "we do it differently."

**Detection signal**: Code that reimplements framework functionality without
justification; imports from low-level libraries where framework abstractions
exist; patterns common in other frameworks used in the wrong framework
(e.g., Spring-style singletons in a Django project).

---

## D — Domain-Based

**Definition:** Code should be named and organized around the business domain,
not technical implementation details.

**Why it matters:** Domain-based naming creates a shared vocabulary between
developers and domain experts. When code talks about "subscriptions",
"billing periods", and "plan changes", every stakeholder understands it. When
code talks about "CRUD operations on table X", only developers understand.

**Backend example:** A module called `subscription_management` with functions like
`activate_subscription`, `cancel_subscription`, `change_plan`. The naming
reflects the business domain, not the technical implementation.

**Anti-pattern:** A module called `crud` with generic functions like `create`,
`read`, `update`, `delete` that operate on different domain objects depending
on arguments. The naming hides the business meaning behind generic mechanics.

**Detection signal:** Module/function names that describe technical mechanisms
("processor", "handler", "manager", "service") without domain context, or names
that use database terminology ("row", "table", "query") instead of domain
terminology ("subscription", "invoice", "customer").
