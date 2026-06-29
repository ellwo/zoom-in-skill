# Go Framework Reference (net/http, Gin, Echo, Fiber)

## 1. Framework Detection

Confirm Go web framework when you see:
- `go.mod` with `github.com/gin-gonic/gin`, `github.com/labstack/echo`, or `github.com/gofiber/fiber`
- Or `net/http` standard library handlers (`http.HandlerFunc`, `http.Handler`)
- `func(w http.ResponseWriter, r *http.Request)` signatures (std)
- `gin.Context`, `echo.Context`, or `fiber.Ctx` parameters (framework)
- `r.GET` / `e.GET` / `app.Get` route registrations
- Package structure with `handler/`, `service/`, `repository/` directories

---

## 2. Architecture Conventions

| Layer | Responsibility | Typical Location |
|---|---|---|
| Handler | Request parsing, response writing, validation trigger | `handler/` or `handlers/` |
| Service | Business logic, state transitions, orchestration | `service/` or `services/` |
| Repository | Database queries, data access | `repository/` or `repo/` |
| Model / Entity | Domain struct definitions | `model/` or `domain/` |
| Middleware | Auth, logging, recovery, tenant context | `middleware/` |
| Config | Environment-driven configuration | `config/` |

**Key rule:** Handlers are thin HTTP adapters. Business logic lives in services. Dependencies injected via interfaces, not constructors with concrete types.

---

## 3. Lens-Specific Signals

### Clarity
- Handlers named `<Entity>Handler` with methods like `Create`, `List`, `Get`, `Update`, `Delete`
- Services named `<Entity>Service` as interfaces with implementations in `<Entity>ServiceImpl` or same package
- Repositories named `<Entity>Repository` as interfaces
- Models named `<Entity>` as plain structs with `json` and `db` tags
- Middleware named descriptively: `AuthMiddleware`, `TenantMiddleware`, `LoggingMiddleware`

### Structure
- **Handler thickness:** More than 8-12 lines suggests logic leaking in
- **Interface segregation:** Small, focused interfaces (`Reader`, `Writer`) not god interfaces
- **Package organization:** Package-by-domain (`order/`, `user/`) preferred over package-by-layer
- **Error handling:** Errors returned, not logged and ignored; no silent `if err != nil { return }`

### Performance
- Missing `context.WithTimeout` for DB/external calls (unbounded execution)
- Unbounded queries without `LIMIT` (full table scans)
- N+1 with GORM (`Preload` missing) or sqlx (loop queries)
- Missing connection pool configuration for database
- Goroutine leaks: launched without `context.Cancel` or `WaitGroup`
- Missing `context` propagation through call stack
- JSON encoding: `json.NewEncoder(w).Encode()` vs `json.Marshal` + `w.Write`

### Security
- Middleware auth (JWT/session validation) on protected routes
- Input validation (go-playground/validator or manual)
- SQL injection via string concatenation (`fmt.Sprintf("SELECT * WHERE id = %s", id)`)
- CORS middleware configuration
- Missing auth middleware on routes
- Sensitive data in response structs (omit via `json:"-"` tags)

### Resilience
- `httptest.NewRecorder` for handler testing
- Table-driven tests for comprehensive coverage
- Error handling: no silent ignores (`_ = riskyCall()`)
- Missing recovery middleware (panic in goroutine crashes entire process)
- Missing health check endpoints

### Domain Integrity
- Service facade for all state transitions (no direct DB mutation in handlers)
- Context-based tenant propagation (`context.WithValue` for tenant ID)
- Missing tenant filtering in repository queries (cross-tenant data leak)
- Business rule validation in services, not in handler binding alone

---

## 4. Framework Anti-Patterns

| Anti-Pattern | Why It's Bad |
|---|---|
| Business logic in handlers | Untestable without HTTP, mixes concerns |
| Global state / package-level vars for config | Race conditions, not testable, not reloadable |
| String concatenation for SQL queries | SQL injection vulnerability |
| Unbounded goroutines without cancellation | Goroutine leak, memory exhaustion |
| Ignoring errors (`_ = doSomething()`) | Silent failures, impossible to debug |
| Missing `context` propagation | No timeout/cancellation, no request-scoped data |
| Concrete types instead of interfaces | Not mockable, not swappable, tight coupling |
| `panic` in handler code | Crashes entire process if not recovered |
| Mutex overuse for shared state | Race conditions if missed; prefer channels or immutability |
| Hardcoded connection strings | Not configurable, secrets in source |

---

## 5. Correct Alternatives

| Instead Of | Do This |
|---|---|
| Logic in handler | `handler` calls `service.Create(ctx, req)` |
| Package-level `var Config` | `Config` struct loaded from env, injected via constructor |
| `fmt.Sprintf("WHERE id = %s", id)` | `db.QueryContext(ctx, "WHERE id = $1", id)` |
| `go processItem(item)` unbounded | `go processItem(ctx, item)` with cancel + WaitGroup |
| `_ = riskyCall()` | `if err := riskyCall(); err != nil { return err }` |
| No `context` in function signatures | Add `ctx context.Context` as first parameter |
| Concrete `*MyRepo` in constructor | Accept `MyRepository` interface |
| `panic("something broke")` | `return fmt.Errorf("something broke: %w", err)` |
| `sync.Mutex` for simple shared state | Channel-based communication or atomic operations |
| Hardcoded `"postgres://..."` | `config.DBURL` loaded from environment |
