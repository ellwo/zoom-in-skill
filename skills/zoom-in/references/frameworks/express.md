# Express.js / NestJS Framework Reference

## 1. Framework Detection

Confirm Express/NestJS when you see:
- `express` or `@nestjs/core` in `package.json` dependencies
- Router files with `app.get` / `app.post` (Express) or `@Controller` decorators (NestJS)
- `package.json` with `@nestjs/common`, `@nestjs/core` (NestJS specific)
- Middleware files with `(req, res, next)` signature (Express) or `@Injectable()` (NestJS)
- DTO classes with `class-validator` decorators or Zod schemas

---

## 2. Architecture Conventions

| Layer | Responsibility | Typical Location |
|---|---|---|
| Controller / Router | Request handling, response shaping, validation trigger | `controllers/` or `routes/` |
| Service | Business logic, state transitions, orchestration | `services/` |
| Repository / DAO | Database queries, data access | `repositories/` or `dao/` |
| DTO | Input/output validation and typing | `dto/` or `schemas/` |
| Middleware | Auth, logging, error handling, tenant context | `middleware/` or `guards/` (NestJS) |
| Module | Feature grouping, dependency wiring (NestJS) | `<feature>.module.ts` |

**Key rule:** Controllers are thin request/response adapters. All business logic lives in services.

---

## 3. Lens-Specific Signals

### Clarity
- Controllers named `<Entity>Controller` (NestJS) or `entityRoutes` (Express)
- Services named `<Entity>Service` with clear public methods
- DTOs named `<Entity>CreateDto`, `<Entity>UpdateDto`, `<Entity>ResponseDto`
- Repositories named `<Entity>Repository` or `<Entity>Dao`
- Express routes grouped by domain in separate router files

### Structure
- **Controller thickness:** More than 3-5 lines per method suggests leaking logic
- **Service layer:** Every controller method should delegate to a service call
- **Middleware organization:** Auth, tenant, and logging as separate middleware/guards, not inline
- **DTO usage:** Request validation via DTO class + `class-validator` pipeline or Zod schema

### Performance
- Missing pagination on list endpoints (no `take`/`skip` or `limit`/`offset`)
- N+1 via TypeORM/Prisma relations without `relations` or `include` option
- Unbounded queries (`find()` without `where` or `limit`)
- Missing database indexes for frequent query patterns
- Synchronous file I/O in request handlers (`fs.readFileSync`)
- Missing connection pooling for database

### Security
- Auth middleware/guards on protected routes
- Missing auth guard on routes (unprotected endpoints)
- Input validation via DTO + `class-validator` pipeline or Zod
- Helmet middleware for security headers
- Rate limiting middleware
- CORS configuration (avoid `*` origins)
- Sensitive data in response DTOs (passwords, tokens)

### Resilience
- Supertest for HTTP integration tests
- Proper async error handling in Express (next(err) pattern)
- NestJS exception filters for consistent error responses
- Missing global error handler / exception filter
- Unhandled promise rejections in route handlers

### Domain Integrity
- Service facade for all state transitions (no direct model mutation in controllers)
- Tenant context via middleware (Express) or guard + decorator (NestJS)
- Missing tenant filtering in queries (cross-tenant data leak)
- Business rule validation in services, not in controllers alone

---

## 4. Framework Anti-Patterns

| Anti-Pattern | Why It's Bad |
|---|---|
| Business logic in route handlers/controllers | Untestable, unreusable, mixes HTTP with domain |
| Missing input validation | Injection, type confusion, malformed data |
| `fs.readFileSync` in request handlers | Blocks event loop, kills throughput |
| Hardcoded connection strings | Not configurable, secrets in source code |
| Missing error handling middleware | Unhandled rejections, crash-prone, poor UX |
| Unhandled promise rejections in routes | Silent failures, process instability |
| `any` type in DTOs (TypeScript) | Bypasses validation, defeats type safety |
| Direct ORM calls in controllers | No layer separation, hard to test and reuse |
| Global mutable state for config | Race conditions, not reloadable, untestable |
| Missing `await` on async calls in handlers | Unhandled promise, silent failure |

---

## 5. Correct Alternatives

| Instead Of | Do This |
|---|---|
| Logic in route handler | `EntityService.create(data)` |
| No input validation | DTO + `class-validator` pipeline (NestJS) or Zod schema (Express) |
| `fs.readFileSync` in handler | `fs.promises.readFile` or stream-based I/O |
| Hardcoded `DATABASE_URL` | `config.get('database.url')` or env variables |
| No error middleware | Global error handler (`app.use(errorHandler)`) |
| `Promise.catch(() => {})` | Proper error propagation with `next(err)` or throw |
| `any` type in DTO | Explicit DTO class with typed fields |
| ORM call in controller | `EntityRepository.find(filters)` via service |
| Global config variable | `ConfigService` with env-based loading |
| Missing `await` on async | Always `await` or return promise with handler |
