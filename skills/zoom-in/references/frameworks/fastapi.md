# FastAPI Framework Reference

## 1. Framework Detection

Confirm FastAPI when you see:
- `fastapi` in dependencies (`requirements.txt`, `pyproject.toml`, `poetry.lock`)
- `from fastapi import FastAPI, APIRouter, Depends` imports
- `@app.get` / `@router.post` decorators on functions
- Pydantic `BaseModel` subclasses for request/response schemas
- `uvicorn` or `hypercorn` as ASGI server
- `async def` endpoint functions with `await` calls

---

## 2. Architecture Conventions

| Layer | Responsibility | Typical Location |
|---|---|---|
| Router | Route definition, dependency injection, response annotation | `routers/` or `api/` |
| Schema (Pydantic) | Request/response validation, serialization | `schemas.py` or `schemas/` |
| Service | Business logic, state transitions, orchestration | `services.py` or `services/` |
| Repository | DB queries, data access abstraction | `repositories.py` or `repositories/` |
| Model (SQLAlchemy/Tortoise) | ORM entity, table definition | `models.py` or `models/` |
| Dependency | Auth, DB session, config injection via `Depends` | `dependencies.py` or `deps.py` |
| Config | Environment-driven settings via Pydantic `BaseSettings` | `config.py` or `core/config.py` |

**Key rule:** Route handlers are thin orchestration — parse, delegate to service, return. No business logic in route functions.

---

## 3. Lens-Specific Signals

### Clarity
- Routers named `<entity>_router` or in `routers/<entity>.py`
- Schemas named `<Entity>Request` / `<Entity>Response` / `<Entity>Create` / `<Entity>Update`
- Services named `<Entity>Service` with clear public async methods
- Repositories named `<Entity>Repository` for data access
- Dependencies named `get_db`, `get_current_user`, `get_<entity>`

### Structure
- **Route handler thickness:** More than 5-10 lines suggests logic leaking in
- **Service layer separation:** Route should call one service method, not orchestrate multiple
- **Dependency injection usage:** DB sessions, auth, and config all via `Depends` — never instantiated in routes
- **Repository pattern:** Optional but recommended; if absent, DB calls should at least be in services

### Performance
- **Sync DB calls in async endpoints:** Blocking the event loop (critical anti-pattern)
- Missing pagination on list endpoints (no `limit`/`offset` parameters)
- N+1 via SQLAlchemy lazy loading in async context
- Missing `joinedload` / `selectinload` for relationship access
- Large response schemas without field exclusion or projection
- Missing connection pool configuration for async DB drivers

### Security
- Auth via `Depends` (e.g., `get_current_user` dependency on protected routes)
- Missing auth dependency on routes (unprotected endpoints)
- CORS middleware configuration (`allow_origins` too permissive)
- Pydantic handles most input validation, but check for missing validators on edge cases
- Sensitive data in response schemas (passwords, tokens, internal IDs)
- Missing rate limiting middleware

### Resilience
- `httpx.AsyncClient` for async test calls
- Proper `pytest-asyncio` setup with `@pytest.mark.asyncio`
- Test database fixtures with proper setup/teardown
- Missing error handlers for unhandled exceptions (`@app.exception_handler`)

### Domain Integrity
- Service facade for all state transitions (no direct model mutation in routes)
- Tenant context injected via dependency (e.g., `get_current_tenant`)
- Missing tenant filtering in repository queries (cross-tenant data leak)
- Business rule validation in services, not in Pydantic schemas alone

---

## 4. Framework Anti-Patterns

| Anti-Pattern | Why It's Bad |
|---|---|
| ORM calls directly in route handlers | No separation of concerns, untestable |
| Sync DB operations in `async def` endpoints | Blocks the event loop, kills concurrency |
| Missing `Depends` for DB sessions | Leaks connections, no session lifecycle management |
| Global state for configuration | Not testable, not reloadable; use `BaseSettings` |
| Blocking I/O in async context | `requests.get()`, `open()`, `subprocess` — kills async |
| `await` in sync function or missing `await` in async | Runtime errors or unexecuted coroutines |
| Pydantic schemas with ORM logic | Schemas are for validation/serialization only |
| Missing `response_model` on routes | No response validation, leaks internal fields |
| Catch-all exception suppression in routes | Hides errors, makes debugging impossible |

---

## 5. Correct Alternatives

| Instead Of | Do This |
|---|---|
| ORM query in route handler | `EntityService.list(db, filters)` |
| Sync DB call in async endpoint | `await async_session.execute(...)` with async driver |
| `SessionLocal()` in route | `Depends(get_db)` for session injection |
| Global config variables | `class Settings(BaseSettings):` with env loading |
| `requests.get()` in async route | `httpx.AsyncClient().get()` |
| Missing `response_model` | Add `response_model=EntityResponse` to route decorator |
| Direct `model.status = X` | `EntityService.transition(entity, new_status)` |
| Manual tenant filtering per query | `Depends(get_current_tenant)` + repository auto-filter |
| Bare `except Exception: pass` | Specific exception handling + logging |
| Pydantic schema with DB queries | Schema for I/O, Service/Repository for DB |
