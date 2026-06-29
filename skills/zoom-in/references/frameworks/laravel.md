# Laravel Framework Reference

## 1. Framework Detection

Confirm Laravel when you see:
- `laravel/framework` in `composer.json`
- `app/Http/Controllers`, `app/Models`, `routes/` directory structure
- Eloquent ORM models extending `Model`
- Blade templates (`resources/views/*.blade.php`)
- Artisan commands (`php artisan`)
- Migration files in `database/migrations/`

---

## 2. Architecture Conventions

| Layer | Responsibility | Typical Location |
|---|---|---|
| Controller | Request handling, response shaping, form request delegation | `app/Http/Controllers/` |
| Form Request | Input validation rules, authorization | `app/Http/Requests/` |
| Service | Business logic, state transitions, orchestration | `app/Services/` |
| Model (Eloquent) | Domain entity, relationships, scopes, accessors | `app/Models/` |
| Job / Queue | Async operations, background processing | `app/Jobs/` |
| Resource | API response transformation | `app/Http/Resources/` |
| Policy | Authorization logic | `app/Policies/` |
| Migration | Database schema changes | `database/migrations/` |

**Key rule:** Skinny Controllers, Fat Models (or better: Service Objects). Controllers delegate validation to Form Requests and logic to Services.

---

## 3. Lens-Specific Signals

### Clarity
- Controllers named `<Entity>Controller` with resourceful methods (`index`, `store`, `show`, `update`, `destroy`)
- Form Requests named `<Entity>StoreRequest` / `<Entity>UpdateRequest`
- Services named `<Entity>Service` or action classes like `Create<Entity>`
- Models named singular (`User`, `Order`) with `$fillable` and relationship methods
- Jobs named `<Entity><Action>Job` (e.g., `ProcessPaymentJob`)
- Resources named `<Entity>Resource` or `<Entity>Collection`

### Structure
- **Controller thickness:** Method exceeding 5-8 lines suggests logic leaking in
- **Service layer:** All business logic in Service classes; controllers only delegate
- **Form Request usage:** Validation rules in dedicated request classes, not inline in controllers
- **Job structure:** Queued jobs for heavy operations, not synchronous execution
- **Resource classes:** API responses transformed via Eloquent API Resources, not manual arrays

### Performance
- **N+1 with Eloquent:** Missing `with()` / `withCount()` on relationships
- Unbounded queries: `Model::all()` instead of paginated results
- Missing database indexes for frequent `where` columns
- `chunk()` vs `all()` for large datasets
- Missing `select()` columns (loading unnecessary fields)
- Counter cache missing on frequent `count()` calls on relations
- Eager loading vs lazy loading in loops

### Security
- Middleware auth (`auth` middleware on protected routes)
- Gates and Policies for authorization logic
- `$fillable` or `$guarded` on models (mass assignment protection)
- Strong parameters via Form Requests
- CORS configuration
- `.env` usage for secrets (not hardcoded)
- CSRF protection on web routes
- Missing `$fillable` allowing mass assignment

### Resilience
- PHPUnit or Pest for testing
- Factory definitions via `factory()->define()`
- Migration safety: no data-loss migrations without reversible strategy
- Missing test coverage for critical service methods
- Database transactions for multi-step operations

### Domain Integrity
- Service facade for all state transitions (no direct model status mutation in controllers)
- Tenant scope via global Eloquent scope for multi-tenant isolation
- Missing tenant scope on queries (cross-tenant data leak)
- Business rule validation in services, not in model accessors/mutators alone

---

## 4. Framework Anti-Patterns

| Anti-Pattern | Why It's Bad |
|---|---|
| Fat controllers | Untestable in isolation, mixes HTTP with domain |
| Missing `$fillable` on models | Mass assignment vulnerability |
| Eloquent queries in loops | N+1 queries, kills performance |
| Business logic in Eloquent accessors/mutators | Hidden side effects, untestable |
| Synchronous dispatch for heavy operations | `dispatch()` without `->onQueue()` blocks request |
| Hardcoded config instead of `config()` | Not environment-aware, not overridable |
| Global scopes without removal option | Impossible to bypass for admin/system queries |
| Model `boot()` method with heavy logic | Implicit, runs on every model load |
| `DB::raw()` with user input | SQL injection risk |
| Returning Eloquent models from API routes | Leaks internal structure, no control over output |

---

## 5. Correct Alternatives

| Instead Of | Do This |
|---|---|
| Logic in controller method | `EntityService::create($data)` |
| Missing `$fillable` | Define `$fillable = ['field1', 'field2']` |
| `foreach ($items as $item) { $item->relation }` | `Item::with('relation')->get()` |
| Logic in accessor/mutator | Move to service class |
| `dispatch(new HeavyJob)` sync | `dispatch(new HeavyJob)->onQueue('heavy')` |
| Hardcoded `'api_key' => '...'` | `config('services.api.key')` + `.env` |
| Global scope without removal | `withoutGlobalScope()` support or conditional scope |
| `DB::raw("WHERE name = '$input'")` | `DB::raw("WHERE name = ?", [$input])` or Eloquent |
| Return model from API | `new EntityResource($model)` |
| `Model::all()` on large tables | `Model::paginate()` or `Model::cursor()` |
