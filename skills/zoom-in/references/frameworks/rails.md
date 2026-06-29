# Ruby on Rails Framework Reference

## 1. Framework Detection

Confirm Rails when you see:
- `rails` in `Gemfile` dependencies
- `app/controllers/`, `app/models/`, `app/views/` directory structure
- ActiveRecord models inheriting from `ApplicationRecord`
- `config/routes.rb` with `resources` declarations
- Migration files in `db/migrate/`
- `bin/rails` or `rails` CLI commands

---

## 2. Architecture Conventions

| Layer | Responsibility | Typical Location |
|---|---|---|
| Controller | Request handling, response shaping, strong parameters | `app/controllers/` |
| Model (ActiveRecord) | Domain entity, relationships, validations, scopes | `app/models/` |
| Service Object | Business logic, state transitions, orchestration | `app/services/` |
| Serializer | API response shaping (ActiveModel::Serializer or blueprinter) | `app/serializers/` |
| Concern | Shared behavior mixed into controllers/models | `app/controllers/concerns/`, `app/models/concerns/` |
| Job (ActiveJob/Sidekiq) | Background processing, async operations | `app/jobs/` |
| Policy (Pundit) | Authorization logic | `app/policies/` |

**Key rule:** Skinny Controller, Fat Model — or better: Service Object pattern. Controllers delegate to services for anything beyond simple CRUD.

---

## 3. Lens-Specific Signals

### Clarity
- Controllers named `<Entities>Controller` with RESTful actions (`index`, `show`, `create`, `update`, `destroy`)
- Models named singular (`User`, `Order`) with relationship declarations
- Service Objects named as verbs or `<Entity><Action>` (e.g., `CreateOrder`, `CancelSubscription`)
- Serializers named `<Entity>Serializer` with attribute whitelisting
- Jobs named `<Entity><Action>Job` (e.g., `SendWelcomeEmailJob`)
- Policies named `<Entity>Policy` with Pundit actions

### Structure
- **Controller thickness:** Action exceeding 5-8 lines suggests logic leaking in
- **Service Object pattern:** Complex operations extracted to single-responsibility service classes
- **Concern usage:** Shared behavior extracted to concerns, not duplicated across controllers/models
- **Job structure:** Background jobs for heavy operations, not synchronous execution
- **Serializer usage:** API responses shaped via serializers, not `as_json` overrides

### Performance
- **N+1 with ActiveRecord:** Missing `includes` / `preload` / `eager_load` on associations
- Unbounded queries: `Model.all` instead of paginated results
- Missing database indexes for frequent `where` columns
- `counter_cache` missing on frequent `.count` calls on associations
- `find_each` / `in_batches` vs `all.each` for large datasets
- Missing `.select()` for read-only queries (loading unnecessary columns)
- Bullet gem not used in development to detect N+1

### Security
- Devise for authentication
- Pundit or CancanCan for authorization
- Strong parameters in controllers (`params.require(:entity).permit(...)`)
- CSRF protection enabled
- CORS configuration
- `.env` or credentials for secrets (not hardcoded)
- Missing strong parameters (mass assignment)
- Sensitive data in serializers (passwords, tokens)

### Resilience
- RSpec or Minitest for testing
- FactoryBot for test data
- Migration safety: no data-loss migrations without reversible strategy
- Missing test coverage for critical service objects
- Database transactions for multi-step operations (`ActiveRecord::Base.transaction`)

### Domain Integrity
- Service Object for all state transitions (no direct model status mutation in controllers)
- ActsAsTenant or scope-based filtering for multi-tenant isolation
- Missing tenant scope on queries (cross-tenant data leak)
- Business rule validation in service objects, not in callbacks alone

---

## 4. Framework Anti-Patterns

| Anti-Pattern | Why It's Bad |
|---|---|
| Fat controllers | Untestable, mixes HTTP with domain logic |
| Callbacks with business logic side effects | Hidden execution order, untraceable, hard to test |
| Missing strong parameters | Mass assignment vulnerability |
| N+1 without `includes` | One query per association per row, kills performance |
| Global state for tenant context | Thread-safety issues, request cross-contamination |
| Missing `counter_cache` on frequent counts | Runs COUNT query every time instead of cached value |
| `Model.all.each` on large tables | Loads entire table into memory |
| `as_json` overrides with complex logic | Hidden serialization logic, hard to test |
| `UPDATE ... WHERE id = X` in callbacks | Untraceable side effects, race conditions |
| God model with 50+ methods and callbacks | Violates SRP; extract service objects |

---

## 5. Correct Alternatives

| Instead Of | Do This |
|---|---|
| Logic in controller action | `CreateOrder.call(params)` service object |
| Business logic in `after_save` callback | Service object handles post-save explicitly |
| Missing `permit` in controller | `params.require(:order).permit(:amount, :status)` |
| `@user.orders.each { |o| o.items }` | `User.includes(orders: :items).find(id)` |
| Thread-local for tenant | `ActsAsTenant.current_tenant` or request-store gem |
| `Company.users.count` (frequent) | `counter_cache: true` on `belongs_to :company` |
| `User.all.each { |u| ... }` | `User.find_each { |u| ... }` |
| `as_json` with logic | `UserSerializer.new(user).as_json` |
| `update_all` in callback | Explicit service method with logging |
| 50-method `Order` model | Extract `OrderFulfillmentService`, `OrderCancelationService` |
