# Clarity Lens — Code Cleanliness & Consistency

## What this lens evaluates

Whether the code reads the way the rest of this codebase reads: naming, typing,
documentation, formatting, and the absence of duplication or dead code. Clarity is
the lens most directly anchored to house style — there is rarely a single
"universally correct" naming convention, so most findings here will be
`[house-style]` rather than `[principle]`.

## Three conceptual layers

| Layer | Source | What it checks |
|-------|--------|----------------|
| **Universal** | This file | Duplication of meaningful logic, dead code, scattered magic literals |
| **Framework** | `references/frameworks/<detected>.md` | Framework naming conventions, ORM typing patterns, framework-specific doc expectations |
| **House-Style** | `ARCHITECTURE.md` §2 (Clarity patterns) | Suffix conventions, type hint expectations, docstring style, formatter/linter rules |

**Principle foundations**: This lens is grounded in CUPID's Predictable, Idiomatic,
and Domain-Based principles. See `references/principles/cupid.md` for the
theoretical basis behind code smell detection and naming conventions.
calibration. A finding that violates all three layers is `[principle]`. A finding
that violates only house-style is `[house-style]`. A finding that contradicts a
documented house-style decision is `[conflict]`.

## Calibrating against house style

Read `ARCHITECTURE.md` §2 ("Clarity" under Established Patterns) for:

- Type hint conventions (where they're expected vs. not)
- Docstring style and where it's expected (e.g. "all service functions have
  a one-line docstring describing the side effect")
- Naming conventions for query variables, private helpers, constants
- Formatter/linter config — if configured, deviations from it are mechanical
  and should be flagged regardless of house style maturity, since the config
  itself *is* the documented decision

If `ARCHITECTURE.md` doesn't yet have Clarity patterns recorded (first run, or
this area wasn't sampled), evaluate against general conventions but tag findings
`[principle]` and note that house style hasn't been established here yet.

## Signals to check

### Naming
- Model/serializer/controller naming follows a consistent suffix convention
  (e.g. `OrderSerializer`, `OrderController`, not a mix of `OrderSerializer` and
  `OrderSer`).
- Status/type-like values: are they enums, typed constants, or repeated
  string/int literals scattered across files? 3+ independent occurrences of the
  same literal is a duplication smell even if each individual use is "clean."
- Relationship field naming consistency — either all following a pattern, or
  all omitted consistently. A mix of explicit-sometimes is the usual finding.
- Enum pattern: does the project use a shared enum base, framework enum types,
  or raw string constants? Flag inconsistency across modules. See
  `references/frameworks/<detected>.md` for framework-specific enum patterns.

### Typing & documentation
- Sample function signatures in service/data-access/task files across a few
  modules — if house style established type hints there, flag files missing them.
- Docstrings on non-trivial business logic functions (rough heuristic: function
  body >10 lines with conditionals). Absence isn't automatically a finding —
  only flag where house style or `ARCHITECTURE.md` establishes the expectation.

### Duplication (DRY)
- Validation logic repeated across multiple input schemas instead of a shared
  validator module or base schema.
- Permission/authorization logic reimplemented in multiple handlers instead of
  a shared guard or policy class.
- Repeated filter chains that look like they should be a query method or
  repository function.
- Service patterns duplicated — e.g. two modules independently writing
  lookup + create + record-history blocks that could be a shared helper or base
  service method.

### Dead code & noise
- Commented-out code blocks.
- `TODO`/`FIXME`/`XXX` density — not a finding by itself, but worth surfacing
  in the audit summary if concentrated in one area (signals an area the team
  already knows needs work).
- Unused imports — only flag if a linter config exists that should be catching
  these (then it's a tooling/CI gap, which is itself a Clarity finding).

### Code smells (Fowler classification)
These are structural weaknesses in code that resist change and obscure intent.
Unlike pure style preferences, code smells have concrete consequences for
maintainability and correctness.

- **Long Method**: A function or method with >30 lines of business logic
  (excluding input validation and a single return). Long methods mix concerns,
  resist targeted testing, and force readers to hold excessive context in mind.
  Consequence: changes are risky because the method's multiple responsibilities
  are entangled.
- **Large Class / God Class**: A class with >10 public methods or >5 categories
  of dependencies. Large classes attract more code over time, becoming unmaintainable
  "god objects" that every part of the system depends on. Consequence: any change
  risks breaking unrelated functionality.
- **Primitive Obsession**: Using raw strings, integers, or dicts to represent
  domain concepts that deserve their own type (e.g., passing `"USD"` as a string
  instead of a `Currency` value object; using a `dict` for an address instead of
  an `Address` class). Consequence: no compile-time or validation-time protection
  against invalid values; the same validation logic is duplicated wherever the
  primitive is used.
- **Feature Envy**: A method that reads or modifies another class's data more
  than its own. The method "belongs" on the other class but lives here due to
  historical accident. Consequence: the method is coupled to another class's
  internals and breaks when that class changes.
- **Shotgun Surgery**: A single conceptual change (e.g., "add a tax ID field")
  requires touching 5+ files across multiple modules. This indicates scattered
  responsibility — the concept isn't encapsulated in one place. Consequence:
  changes are error-prone because the developer must find and update every
  scattered piece.
- **Data Class**: A class with only fields and getters/setters, no behavior.
  Business logic that should live on the class is scattered across services
  that operate on the data externally. Consequence: invariants can be violated
  because no single point enforces them. (Note: in some frameworks, ORM models
  are intentionally anemic; check ARCHITECTURE.md before flagging.)

### Settings & configuration
- Settings organization: one large file vs. split by environment — is the chosen
  approach applied consistently? No environment-specific hardcoded values leaking
  into base/shared settings.

## What not to flag

- Stylistic preferences not contradicted by any config or established pattern
  (e.g. single vs. double quotes, if no formatter enforces one).
- One-off naming in a file explicitly noted under `ARCHITECTURE.md` §4 (Known
  Exceptions / Legacy).
- Missing type hints in code that predates any type-hint convention — check
  whether the convention is "Established" before flagging older files against it.
- Minor naming differences that don't affect readability (e.g. `get_user` vs
  `fetch_user` if both are used in different module contexts with no overlap).
- `TODO` comments in isolation — only flag density, not presence.

## Scoring rubric

- **9–10** — Naming, typing, and documentation consistent with house style
  throughout; no meaningful duplication; linter/formatter config respected.
- **7–8** — Solid overall; a handful of isolated inconsistencies or minor
  duplication that hasn't caused problems.
- **5–6** — Recognizable house style exists but is inconsistently applied across
  ~half the scope; some repeated literals/logic that should be centralized.
- **3–4** — No consistent naming/typing/doc convention discernible; duplication of
  business-meaningful logic across multiple files.
- **1–2** — Code is difficult to follow due to inconsistent naming/structure
  throughout; significant copy-pasted logic with diverging behavior between
  copies (a correctness risk, not just a style one).

## Example findings format

- `[house-style]` `modules/inventory/services.py` — none of the four functions
  have type hints, while `modules/billing/services.py` and `modules/orders/services.py`
  (Established pattern) type-hint all service function signatures. → Fix: add
  type hints following the golden reference.
- `[principle]` `modules/orders/validators.py:validate_total` and
  `modules/billing/validators.py:validate_amount` both reimplement the
  same "value must be positive" check — worth extracting to a shared validator,
  independent of house style.
- `[conflict]` Status fields use raw strings (`"pending"`, `"shipped"`) in
  `modules/orders/models.py` but a shared enum type in
  `modules/billing/models.py` (newer) — no clear signal which is intended going
  forward; candidate for `/zoom-in adopt`.
