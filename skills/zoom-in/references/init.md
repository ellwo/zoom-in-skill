# `/zoom-in init` — First-Time Setup

Discover project context, detect framework, interview the user, and generate four foundational documents: **SYSTEM.md** (strategic context), **ARCHITECTURE.md** (adaptive house-style), **ANTI-PATTERNS.md** (project-specific rejection rules), **DECISIONS.md** (architectural constitution / ADR records). These anchor every subsequent `/zoom-in` command.

## 1. Auto-Detect Framework and Stack

Scan project root for framework signals (dependency files, config, directory structure):

| Signal File | What It Reveals |
|---|---|
| `requirements.txt` / `pyproject.toml` / `Pipfile` | Python framework (Django, FastAPI, Flask) |
| `package.json` / `pnpm-lock.yaml` | JS/TS framework (Next, Nuxt, Express) |
| `go.mod` / `Cargo.toml` / `pom.xml` | Go, Rust, Java stack |
| `docker-compose.yml` | Infrastructure: DB, cache, queues |
| Config files in project root | ORM, cache backend, task queue, auth system |

Auto-detect first; ask the user only what can't be auto-detected.

## 2. Check for Previous Audits

If `.zoom-in/context/audits/` exists: read `index.md`, note most recent scores/dates, ask "Found previous audits (most recent: score X/70 on YYYY-MM-DD). Use these as a baseline for pattern discovery?"
- **Yes** → use audit data to inform golden reference selection (high-score modules = better golden reference candidates)
- **No** → proceed normally
- **No audits dir** → skip silently (first init is normal)

## 3. Discover Existing Patterns (Golden References)

Find what the project already does well — anchor house-style in reality, not theory.

**Discovery method**: (1) scan all modules for structural consistency — which have the clearest layering? (2) find modules imported *from* but rarely *into* (well-factored foundations); (3) check which modules have the most complete test coverage (signals team care); (4) ask the user "Which module do you consider the cleanest / reference implementation?"

**Extract from each golden reference**: naming conventions, layering pattern (controller → service → repository/model), error handling approach (exceptions / result objects / error codes), test structure, import ordering and dependency direction.

**If previous audits accepted as baseline**: prioritize high-score modules as golden reference candidates; flag low-score modules in ARCHITECTURE.md; note persistent findings (multiple audits) as likely tech debt.

## 4. Interview the User (only what couldn't be auto-detected)

1. "Which register(s) apply? [SaaS / Enterprise / API Service / Default]" — registers activate domain-specific rules
2. "What is the multi-tenancy model?" (only if SaaS) — tenant isolation affects Security, Structure, Resilience deeply
3. "Are there critical business flows needing special architectural attention?" — billing/auth/data pipelines often have invariants that must never be violated
4. "Are there existing architectural decisions the team has agreed on?" — these become ADR records in DECISIONS.md, enforced from day one
5. "Decision Structure: Flat or Modular?" — Flat = single DECISIONS.md (simplest, small/monolith); Modular = global DECISIONS.md + `.zoom-in/context/decisions/<module>.md` (large/multi-module). **Auto-recommend**: ≤3 modules → suggest Flat; >3 → suggest Modular (user decides). **This choice is permanent** — doesn't change automatically; only re-running init or re-init changes it.

## 5. Confirm Findings

Present a summary; ask explicit confirmation before writing anything (writing on wrong assumptions = false authority).

```
## Detected
- Framework / Database / Cache / Task queue / Auth pattern: [auto-detected]

## From Interview
- Register(s) / Multi-tenancy / Critical flows / Adopted decisions: [user-specified]

## Golden References
- [module path] — [reason selected]

## Files to Generate
- SYSTEM.md — strategic context
- ARCHITECTURE.md — house-style + patterns
- ANTI-PATTERNS.md — project-specific rejection rules
- DECISIONS.md — architectural constitution (ADR records)

Confirm? [Y/n/edit]
```

## 6. Generate Output Files

**If any file already exists: merge, don't overwrite.** Preserve §3 Adopted Decisions, §4 Known Exceptions, and any existing ADR records or bans. Never destroy a team's documented decisions or accepted exceptions when re-running init on an existing project.

### 6a. SYSTEM.md
Contains: project purpose/domain, stack summary, register selection, Decision Structure (Flat/Modular), critical business flows + invariants, key architectural decisions, **Init Version** (current skill version from `references/init-changelog.md` — used by `re-init` to detect schema gaps). Follow `references/system-template.md`.

### 6b. ARCHITECTURE.md
Contains: §1 Framework & Register (active rules), §2 Established vs Emerging patterns (from golden refs), §3 Adopted Decisions table (from interview), §4 Known Exceptions (allowed deviations), §5 House-style calibration (what "good" looks like), §6 Golden References (paths + why exemplary). Follow `references/architecture-template.md`. **Don't fight existing conventions** — document what exists; flag inconsistencies as `[conflict]`, not as wrong.

### 6c. ANTI-PATTERNS.md
The negative space of house-style — every rule has a mirror "never do this."

**Process**: (1) load `references/anti-patterns.md` (universal No-Gos) → §1; (2) load `references/anti-patterns-template.md` → governs format; (3) load `references/frameworks/<detected>.md` → extract "Framework Anti-Patterns" → §2; (4) load `references/registers/<selected>.md` → extract "Key Anti-Patterns" → §3; (5) scan golden refs for patterns they explicitly avoid → §4 (project-specific bans); (6) for each universal No-Go: search codebase for a real example (file:line) or note "not yet found"; (7) generate at project root.

**Sections**: §1 Universal No-Gos (with codebase evidence), §2 Framework-Specific Bans, §3 Register-Specific Bans, §4 Project-Specific Bans.

### 6d. DECISIONS.md
**Process**: (1) load `references/decisions-template.md` → governs format; (2) take decisions from interview Q4; (3) write a full ADR per decision (Context / Decision / Consequences / Lenses / Reference); (4) if no decisions → generate template structure with empty sections; (5) generate at project root.

**If previous audits exist**: check for findings appearing in multiple consecutive audits (persistent issues); if the team has been aware but hasn't fixed one, it may be an implicit Known Exception — ask whether to document.

**ADR fields**: Context (forces at play), Decision (what + why), Consequences (easier/harder/irreversible), Lenses (which of the 7 most affected), Reference (link to discussion/PR/doc if available).

## Failure Modes

| Situation | Response |
|---|---|
| Cannot detect framework | Ask the user directly; do not guess |
| No clear golden reference | Note "none identified" in §6; house-style will emerge over time |
| User skips interview | Generate with Default register; flag all sections as "unconfirmed" |
| Existing conventions conflict | Mark as `[conflict]` in §2; do not pick a winner unilaterally |
| Framework ref has no Anti-Patterns section | §2 empty; note "No framework-specific bans documented" |
| Register ref has no Anti-Patterns section | §3 empty |
| No project-specific bans discovered | §4 notes "None identified during init" |

## After Init

**Suggest next**: `/zoom-in map` (understand the dependency graph) → `/zoom-in audit` (baseline health check).

**If previous audits were found during init**: historical context, persistent issues as tech debt, baseline for future delta comparisons.

**When to run `/zoom-in re-init` instead of `/zoom-in init`**: project already initialized AND skill updated with new features (check `references/init-changelog.md`); codebase changed significantly since init (modules added/removed, patterns evolved, golden refs deleted); want to switch Decision Structure (Flat ↔ Modular); suspect context files were modified outside proper process. See `references/re-init.md`.
