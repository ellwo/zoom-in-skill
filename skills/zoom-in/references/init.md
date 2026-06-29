# `/zoom-in init` — First-Time Setup

> The most important command. Everything else depends on it.

---

## Purpose

Discover project context, detect framework, interview the user, and generate four foundational documents: **SYSTEM.md** (strategic context), **ARCHITECTURE.md** (adaptive house-style), **ANTI-PATTERNS.md** (project-specific rejection rules), and **DECISIONS.md** (architectural constitution / ADR records). These files anchor every subsequent `/zoom-in` command — without them, audits cannot calibrate, plans cannot conform, and refactors cannot enforce consistency.

**Why this matters**: A project without documented conventions drifts. Each developer reinvents patterns, and the codebase becomes a patchwork of conflicting styles. `/zoom-in init` captures what the project *is* so that future changes respect what it *should be* — and documents what it explicitly *rejects* so that known anti-patterns never silently re-enter.

---

## Chain of Thought

1. **Analyze** — What framework, stack, and patterns does this project already use?
2. **Critique** — What could not be auto-detected? What assumptions might be wrong?
3. **Propose** — Present findings and ask for confirmation before writing anything.
4. **Execute** — Generate SYSTEM.md, ARCHITECTURE.md, ANTI-PATTERNS.md, and DECISIONS.md only after confirmation.

---

## Step-by-Step Process

### Step 1: Auto-Detect Framework and Stack

Scan the project root for framework signals. Look at dependency files, configuration, and directory structure.

**Signals to check**:
| Signal File | What It Reveals |
|---|---|
| `requirements.txt` / `pyproject.toml` / `Pipfile` | Python framework (Django, FastAPI, Flask) |
| `package.json` / `pnpm-lock.yaml` | JS/TS framework (Next, Nuxt, Express) |
| `go.mod` / `Cargo.toml` / `pom.xml` | Go, Rust, Java stack |
| `docker-compose.yml` | Infrastructure: DB, cache, queues |
| Config files in project root | ORM, cache backend, task queue, auth system |

**Why auto-detect first**: Asking the user "what framework is this?" when the answer is in `package.json` wastes their time and signals incompetence. Auto-detection builds trust and reduces interview friction.

### Step 1b: Check for Previous Audits

Check if `.zoom-in/context/audits/` exists. If it does:

1. Read `index.md` to see what scopes have been audited
2. Note the most recent scores and their dates
3. Ask the user: "Found previous audits (most recent: score X/70 on YYYY-MM-DD). Use these as a baseline for pattern discovery?"

**Why check first**: Previous audits contain valuable information about:
- Which findings were identified and their severity
- Which modules scored lowest (priority areas)
- What the team already knows about the project's weaknesses

If the user says yes: use the audit data to inform golden reference selection (modules with high scores are better candidates for golden references).

If the user says no: proceed normally without audit history.

If `.zoom-in/context/audits/` doesn't exist: skip this step silently. First init on a project with no prior audits is normal.

### Step 2: Discover Existing Patterns

Before deciding what conventions to recommend, find out what the project already does well.

**Golden reference discovery method**:

1. Scan all modules for structural consistency — which modules have the clearest layering?
2. Look for modules that other modules import *from* but rarely *into* — these tend to be well-factored foundations.
3. Check which modules have the most complete test coverage — that signals team care.
4. Ask the user: "Which module do you consider the cleanest or the reference implementation?"

**What to extract from a golden reference**:
- Naming conventions (files, classes, functions, variables)
- Layering pattern (controller → service → repository/model)
- Error handling approach (exceptions, result objects, error codes)
- Test structure (where tests live, how they're named, what they cover)
- Import ordering and dependency direction

**Why golden references matter**: Recommending conventions that contradict what the team already does well creates friction. Golden references anchor the house-style in reality, not theory.

**If previous audits exist and were accepted as baseline**:
- Prioritize modules with higher audit scores as golden reference candidates
- Flag modules with lower scores as areas needing attention in ARCHITECTURE.md
- Note persistent findings (appear in multiple audits) as likely tech debt

### Step 3: Interview the User

Ask **only** what could not be auto-detected. Every unnecessary question reduces the chance the user completes the init.

**Required questions**:
1. "Which register(s) apply? [SaaS / Enterprise / API Service / Default]"
   - *Why*: Registers activate domain-specific rules. A SaaS project needs multi-tenancy checks that a CLI tool does not.
2. "What is the multi-tenancy model?" (only if SaaS register selected)
   - *Why*: Tenant isolation affects Security, Structure, and Resilience lenses deeply.
3. "Are there critical business flows that need special architectural attention?"
   - *Why*: Billing, auth, and data pipelines often have invariants that must never be violated.
4. "Are there existing architectural decisions the team has already agreed on?"
   - *Why*: These become ADR records in DECISIONS.md and are enforced from day one.
5. "Decision Structure: Flat or Modular?"
   - *Why*: Determines where decisions are stored. Flat = single DECISIONS.md file
     for all decisions (simplest, best for small/monolith projects). Modular =
     DECISIONS.md for global decisions + `.zoom-in/context/decisions/<module>.md`
     for module-specific decisions (best for large/multi-module projects).
   - *Auto-recommendation*: If ≤3 modules detected → suggest Flat. If >3 modules →
     suggest Modular. The user makes the final call.
   - *This choice is permanent* — it does not change automatically based on
     decision count. Re-running `/zoom-in init` can change it, but it never
     changes as a side effect of other commands.

### Step 4: Confirm Findings

Present a summary of everything discovered and inferred. Ask for explicit confirmation.

**Format**:
```
## Detected
- Framework: [auto-detected]
- Database: [auto-detected]
- Cache: [auto-detected]
- Task queue: [auto-detected]
- Auth pattern: [auto-detected]

## From Interview
- Register(s): [user-specified]
- Multi-tenancy: [user-specified]
- Critical flows: [user-specified]
- Adopted decisions: [user-specified]

## Golden References
- [module path] — [reason selected]

## Files to Generate
- SYSTEM.md — strategic context
- ARCHITECTURE.md — house-style + patterns
- ANTI-PATTERNS.md — project-specific rejection rules
- DECISIONS.md — architectural constitution (ADR records)

Confirm? [Y/n/edit]
```

**Why confirmation matters**: Writing documents based on wrong assumptions is worse than not writing them at all — they become false authority.

### Step 5: Generate Output Files

#### Step 5a: Generate SYSTEM.md

**SYSTEM.md** contains:
- Project purpose and domain
- Stack summary
- Register selection
- Decision Structure (Flat / Modular)
- Critical business flows and their invariants
- Key architectural decisions already made
- **Init Version** — the current skill version number (from `references/init-changelog.md`).
  Used by `/zoom-in re-init` to detect schema gaps when the skill is updated.

Follow the structure in `references/system-template.md`.

#### Step 5b: Generate ARCHITECTURE.md

**ARCHITECTURE.md** contains:
- §1 Framework & Register (which rules are active)
- §2 Established vs Emerging patterns (from golden references)
- §3 Adopted Decisions table (from interview)
- §4 Known Exceptions (explicitly allowed deviations)
- §5 House-style calibration (what "good" looks like in this project)
- §6 Golden References (file paths and why they're exemplary)

Follow the structure in `references/architecture-template.md`.

**If the project already has existing conventions**: Do not fight them. Document what exists. Flag inconsistencies as `[conflict]`, not as wrong. The team may have good reasons for deviations that aren't apparent from code alone.

#### Step 5c: Generate ANTI-PATTERNS.md

This file documents what the project explicitly *rejects*. It is the negative space of the house-style — every rule has a mirror that says "never do this."

**Process**:

1. Load `references/anti-patterns.md` (universal No-Gos) → populates §1
2. Load `references/anti-patterns-template.md` (template structure) → governs output format
3. Load `references/frameworks/<detected>.md` → extract "Framework Anti-Patterns" section → populates §2
4. Load `references/registers/<selected>.md` → extract "Key Anti-Patterns" section → populates §3
5. Scan golden references for patterns they explicitly *avoid* (e.g., a golden module never puts business logic in a view) → populates §4 (project-specific bans)
6. For each universal No-Go: search the codebase for a real example (file:line) or note "not yet found"
7. Generate ANTI-PATTERNS.md at project root following the template

**ANTI-PATTERNS.md contains**:
- §1 Universal No-Gos (from anti-patterns.md, with codebase evidence where found)
- §2 Framework-Specific Bans (from framework reference)
- §3 Register-Specific Bans (from register reference)
- §4 Project-Specific Bans (from golden reference analysis)

#### Step 5d: Generate DECISIONS.md

This file records architectural decisions the team has already agreed on, in ADR format. It is the project's architectural constitution.

**Process**:

1. Load `references/decisions-template.md` (template structure) → governs output format
2. Take decisions from interview answers (question #4 about existing architectural decisions)
3. For each decision: write a full ADR with Context / Decision / Consequences / Lenses / Reference
4. If no decisions from interview: generate with only the template structure and empty sections
5. Generate DECISIONS.md at project root following the template

**If previous audits exist**:
- Check for findings that appear in multiple consecutive audits (persistent issues)
- If the team has been aware of an issue but hasn't fixed it, it may be an implicit Known Exception — ask whether it should be documented

**DECISIONS.md contains**:
- Template header with project name and date
- ADR records, one per decision, each with:
  - **Context** — what forces were at play
  - **Decision** — what was chosen and why
  - **Consequences** — what becomes easier, harder, or irreversible
  - **Lenses** — which of the seven lenses this decision most affects
  - **Reference** — link to discussion, PR, or document if available

---

## Failure Modes

| Situation | Response |
|---|---|
| Cannot detect framework | Ask the user directly; do not guess |
| No clear golden reference | Note "none identified" in §6; house-style will emerge over time |
| User skips interview | Generate with Default register; flag all sections as "unconfirmed" |
| Existing conventions conflict | Mark as `[conflict]` in §2; do not pick a winner unilaterally |
| Framework ref has no Anti-Patterns section | §2 will be empty; note "No framework-specific bans documented" |
| Register ref has no Anti-Patterns section | §3 will be empty |
| No project-specific bans discovered | §4 will note "None identified during init" |

---

## After Init

Once complete, all other `/zoom-in` commands can load SYSTEM.md, ARCHITECTURE.md, DECISIONS.md, and ANTI-PATTERNS.md to calibrate their analysis. The project now has a documented identity — what it is, what it rejects, what it has decided — that evolves with every `/zoom-in adopt` and every `/zoom-in audit`.

**If previous audits were found during init**, the project now has:
- Historical context from past audits
- Persistent issues identified as tech debt
- A baseline for future delta comparisons

**When to run `/zoom-in re-init` instead of `/zoom-in init`**:
- The project is already initialized AND the skill has been updated with new
  features (check `references/init-changelog.md` for version changes)
- The codebase has changed significantly since init (modules added/removed,
  patterns evolved, golden references deleted)
- You want to switch Decision Structure (Flat ↔ Modular)
- You suspect context files were modified outside the proper process

`/zoom-in re-init` syncs existing context with the current skill + codebase
without losing the team's decisions. See `references/re-init.md`.
