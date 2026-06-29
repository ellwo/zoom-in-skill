# `/zoom-in map` — Dependency Graph and Structural Analysis

Produce a structural map of the project — modules, responsibilities, dependencies, and violations. The diagnostic foundation for audits, plans, and refactors. Makes invisible coupling explicit.

## 1. Module Inventory

List every logical module and determine its primary responsibility. A "module" is whatever the framework uses as its organizational unit — apps, packages, services, or top-level directories.

**For each module, determine**:
- **Name**: as it appears in the project (not a renamed ideal)
- **Primary responsibility**: one sentence. If you need "and" or "also," the module may be doing too much
- **Type**: Domain / Infrastructure / Cross-cutting / Orchestration / Presentation
- **Approximate size**: file count or line count
- **Health signal**: well-organized or obviously sprawling?

**SRP check**: "Can I describe what this module does without using 'and'?" If you need conjunctions, the module may violate Single Responsibility — flag as a potential finding (context matters: a billing module handling subscriptions *and* payments may be legitimately cohesive).

## 2. Dependency Graph

Map every import/call relationship between modules.

**Trace these dependency types**:
- **Static imports**: parse import statements in source files
- **Framework wiring**: DI containers, service registries, module registration
- **Configuration references**: settings files, routing configs, environment configs
- **Runtime coupling**: shared database tables, shared cache keys, shared event topics

**Record for each dependency**: Source → Target, nature (domain/infra/utility), strength (tight vs. loose).

Trace all types, not just imports — a module that doesn't import another but shares a database table with it is just as coupled. Hidden coupling is more dangerous because it's invisible during code review.

## 3. Detect Violations

Scan the dependency graph for structural anti-patterns:

| Violation | Severity | Detection | Why It's a Problem |
|---|---|---|---|
| Circular dependency | 🔴 | A → B → ... → A (direct or transitive) | Neither module can be understood, tested, or deployed independently |
| God module | 🟠 | Imported by >60% of modules AND imports from >40%; or >2x average file count | Bottleneck for changes; magnet for tech debt |
| Direction violation | 🟠 | Domain importing from presentation/infrastructure | Couples stable logic to volatile infrastructure; untestable |
| Cross-cutting inconsistency | ⚠️ | Same concern handled differently across modules | Confuses developers; bugs from wrong-pattern assumptions |
| Shallow module | ⚠️ | Module that merely delegates without adding logic | Indirection without value |
| Orphan module | 💡 | No incoming or outgoing edges | Likely dead code; verify before removing |

## 4. Layer Analysis

Determine if the project follows a layered architecture and whether layers are respected.

**Common models**: 4-layer (Presentation → Application → Domain → Infrastructure), 3-layer (Controller → Service → Data Access), Hexagonal (Core ↔ Ports ↔ Adapters).

**Check per module**: does code stay in its expected layer? cross-layer skips? upward calls?

**Violation signals**: a model making HTTP calls, a controller with business logic, a repository returning view-formatted data, a service importing a UI framework.

Layer violations are the most common source of testability problems — code that reaches across layers can't be tested without the entire stack.

## 5. Produce the Structured Map

```
# Zoom-in Map: [project name]

## Module Inventory
| Module | Responsibility | Type | Size | Health |
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

## When to Re-Run

The map captures a structural snapshot. Re-run `/zoom-in map` when:
- **Modules added or removed** — new boundaries change the dependency graph
- **Major refactoring** — module splits, merges, or relocations alter dependencies
- **Before `/zoom-in plan` for a cross-module feature** — ensures placement uses current structure
- **After `/zoom-in refactor` that touched module boundaries** — confirm no new violations

**When NOT to re-run**: after point fixes, style changes, or refactoring within a module that didn't change its external dependencies. The map is about structure, not style.

## Failure Modes

| Situation | Response |
|---|---|
| Too many modules for one pass | Start with top-level; sub-module analysis available on request |
| Framework uses implicit DI | Trace config files and service registries |
| No clear layered architecture | Note "unlayered" — this is itself a Structure finding |
| Dynamic imports/runtime resolution | Note static vs. dynamic deps separately |
