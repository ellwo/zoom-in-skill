# `/zoom-in map` — Dependency Graph and Structural Analysis

> You cannot refactor what you do not understand. Map first, then act.

---

## Purpose

Produce a structural map of the project — modules, responsibilities, dependencies, and violations. The diagnostic foundation for audits, plans, and refactors.

**Why this matters**: Dependencies become invisible over time. A developer adds an import "just this once," and months later two modules are tightly coupled with no one realizing it. `/zoom-in map` makes the invisible visible, turning implicit coupling into explicit findings.

---

## Chain of Thought

1. **Analyze** — Enumerate modules, trace every import and dependency, build the graph.
2. **Critique** — Where does the graph violate expected dependency direction? Where is responsibility unclear?
3. **Propose** — Flag violations with severity; suggest boundary corrections.
4. **Execute** — Produce the structured map with findings integrated.

---

## Step-by-Step Process

### Step 1: Module Inventory

List every logical module and determine its primary responsibility. A "module" is whatever the framework uses as its organizational unit — apps, packages, services, or top-level directories.

**For each module, determine**:
- **Name**: As it appears in the project (not a renamed ideal)
- **Primary responsibility**: One sentence. If you need "and" or "also," the module may be doing too much
- **Type**: Domain / Infrastructure / Cross-cutting / Orchestration / Presentation
- **Approximate size**: File count or line count
- **Health signal**: Well-organized or obviously sprawling?

**SRP check**: "Can I describe what this module does without using 'and'?" If you need conjunctions, the module may violate Single Responsibility. Flag as a potential finding — context matters. A billing module handling subscriptions *and* payments may be legitimately cohesive.

### Step 2: Dependency Graph

Map every import/call relationship between modules.

**Trace these dependency types**:
- **Static imports**: Parse import statements in source files
- **Framework wiring**: Check DI containers, service registries, module registration
- **Configuration references**: Settings files, routing configs, environment configs
- **Runtime coupling**: Shared database tables, shared cache keys, shared event topics

**Record for each dependency**: Source → Target, nature (domain/infra/utility), strength (tight vs. loose).

**Why trace all types, not just imports**: A module that doesn't import another but shares a database table with it is just as coupled. Hidden coupling is more dangerous because it's invisible during code review.

### Step 3: Detect Violations

Scan the dependency graph for structural anti-patterns:

| Violation | Severity | Detection | Why It's a Problem |
|---|---|---|---|
| Circular dependency | 🔴 | A → B → ... → A (direct or transitive) | Neither module can be understood, tested, or deployed independently |
| God module | 🟠 | Imported by >60% of modules AND imports from >40%; or >2x average file count | Bottleneck for changes; magnet for tech debt |
| Direction violation | 🟠 | Domain importing from presentation/infrastructure | Couples stable logic to volatile infrastructure; untestable |
| Cross-cutting inconsistency | ⚠️ | Same concern handled differently across modules | Confuses developers; bugs from wrong-pattern assumptions |
| Shallow module | ⚠️ | Module that merely delegates without adding logic | Indirection without value |
| Orphan module | 💡 | No incoming or outgoing edges | Likely dead code; verify before removing |

### Step 4: Layer Analysis

Determine if the project follows a layered architecture and whether layers are respected.

**Common models**: 4-layer (Presentation → Application → Domain → Infrastructure), 3-layer (Controller → Service → Data Access), Hexagonal (Core ↔ Ports ↔ Adapters).

**Check per module**: Does code stay in its expected layer? Are there cross-layer skips or upward calls?

**Violation signals**: A model making HTTP calls, a controller with business logic, a repository returning view-formatted data, a service importing a UI framework.

**Why layer analysis matters**: Layer violations are the most common source of testability problems. Code that reaches across layers can't be tested without the entire stack.

### Step 5: Produce the Structured Map

```
# Zoom-in Map: [project name]

## Module Inventory
| Module | Responsibility | Type | Size | Health |
|--------|---------------|------|------|--------|
| auth | User authentication & session management | Domain | 12 files | ✅ |
| billing | Subscription & payment processing | Domain | 18 files | ⚠️ God module risk |
| utils | Miscellaneous shared helpers | Cross-cutting | 47 files | 🔴 God module |

## Dependency Graph
auth → [database, crypto]
billing → [auth, database, messaging, utils]
api → [auth, billing, notifications]
notifications → [billing] ← CYCLE

## Violations
### 🔴 Critical
- [CIRC-1] Circular: billing ↔ notifications
  Mediation: Extract shared contracts into a new module

### 🟠 High
- [GOD-1] God module: `utils` — 47 files, imported by 80% of modules
  Decomposition: Split into focused utility modules

### ⚠️ Medium
- [LAYER-1] auth/models makes HTTP calls to external SSO → move to infra adapter
- [CROSS-1] Error handling: auth raises exceptions; billing returns error codes

## Technical Debt Summary
- 1 circular dependency, 1 god module, 2 layer violations, 1 cross-cutting inconsistency
```

---

## Integration with Other Commands

| Command | How It Uses the Map |
|---|---|
| `/zoom-in init` | Identifies golden references from module inventory |
| `/zoom-in audit` | Scores Structure lens using dependency direction |
| `/zoom-in focus structure` | Deep-dive on structural findings from the map |
| `/zoom-in plan` | Places new features using module boundaries |
| `/zoom-in refactor` | Prioritizes fixes using violation list |
| `/zoom-in harden` | Traces attack surface using dependency graph |
| `/zoom-in verify` | Checks structural fixes didn't create new circular deps |

## When to Re-Run

The map captures a structural snapshot. Re-run `/zoom-in map` when:

- **Modules added or removed** — new boundaries change the dependency graph
- **Major refactoring** — module splits, merges, or relocations alter dependencies
- **Before `/zoom-in plan` for a cross-module feature** — ensures placement decision uses current structure
- **After `/zoom-in refactor` that touched module boundaries** — confirm the refactor didn't introduce new violations

**When NOT to re-run**: After point fixes, style changes, or refactoring within a module
that didn't change its external dependencies. The map is about structure, not style.

---

## Failure Modes

| Situation | Response |
|---|---|
| Too many modules for one pass | Start with top-level; sub-module analysis available on request |
| Framework uses implicit DI | Trace config files and service registries |
| No clear layered architecture | Note "unlayered" — this is itself a Structure finding |
| Dynamic imports/runtime resolution | Note static vs. dynamic deps separately |
