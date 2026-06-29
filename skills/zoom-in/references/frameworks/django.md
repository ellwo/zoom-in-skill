# Django + DRF Framework Reference

## 1. Framework Detection

Confirm Django + DRF when you see:
- `django` and `djangorestframework` in requirements or installed apps
- `rest_framework` in `INSTALLED_APPS`
- ViewSet or APIView subclasses
- `serializers.py` files alongside `views.py`
- DRF routers in URL configuration
- `manage.py` at project root

---

## 2. Architecture Conventions

| Layer | Responsibility | Typical Location |
|---|---|---|
| ViewSet / APIView | Request parsing, response shaping, auth delegation | `views.py` or `views/` |
| Serializer | Validation, representation, create/update orchestration | `serializers.py` |
| Service | Business logic, state transitions, cross-model operations | `services.py` or `services/` |
| Selector | Read-side queries, filtering, aggregation | `selectors.py` or `services/selectors.py` |
| Model | Domain entity, constraints, field definitions | `models.py` |
| Task | Celery async operations | `tasks.py` |
| Signal | Event-driven side effects (keep thin) | `signals.py` |
| URL | Route registration per app | `urls.py` |

**Key rule:** Fat Models, Thin Views. Business logic belongs in Services — not in ViewSets, not in Serializers, not in Signals.

---

## 3. Lens-Specific Signals

### Clarity
- ViewSets named `<Entity>ViewSet`, Serializers named `<Entity>Serializer` / `<Entity>ReadSerializer`
- Services named `<Entity><Action>Service` or `<Entity>Service.<method>`
- Selectors named `<Entity><Query>Selector`
- Tasks named `<entity>_<action>_task`
- URL basenames match entity names

### Structure
- **ViewSet thickness:** More than 3-4 overridden methods suggests logic leaking in
- **Serializer thickness:** `create()` / `update()` overrides exceeding ~15 lines should delegate to a service
- **Signal usage:** Signals should only dispatch to services, never contain business logic
- **Service layer:** Named service modules with clear public methods; no business logic scattered across views

### Performance
- **N+1 via SerializerMethodField:** Each method field triggers a query per row
- **Missing `select_related` / `prefetch_related`** on list endpoints
- `.all()` without pagination on list views
- `len(queryset)` instead of `.count()` (evaluates entire queryset)
- `save()` without `update_fields` (writes every column)
- Missing bulk operations (`bulk_create`, `bulk_update`) for batch writes
- Serializer `depth = N` causing uncontrolled prefetches

### Security
- DRF permission classes: `IsAuthenticated`, custom `BasePermission` subclasses
- CORS configuration via `django-cors-headers`
- `DEBUG = True` in production settings
- `ALLOWED_HOSTS` not set or too permissive
- `SECRET_KEY` hardcoded or from unversioned `.env`
- CSRF enforcement on session-auth endpoints
- `fields = '__all__'` without `read_only_fields` or `extra_kwargs`

### Resilience
- Django test client vs DRF `APIClient` for API tests
- Migration safety: no data-loss migrations without default/reversible strategy
- Test structure: `pytest-django` or Django `TestCase`, factory_boy for fixtures
- Transaction test wrappers to avoid test pollution

### Domain Integrity
- State machine changes routed through a **service facade** (never direct `model.status = X; model.save()`)
- Tenant isolation enforced via `get_queryset()` overrides or middleware
- Usage tracking isolated to a single module (e.g., `signals.py`) — not scattered
- Lifecycle operations (create, activate, cancel, expire) go through one entry point

---

## 4. Framework Anti-Patterns

| Anti-Pattern | Why It's Bad |
|---|---|
| Business logic in ViewSets | Untestable, unreusable, mixes HTTP concerns with domain |
| Business logic in Django signals | Untraceable side effects, unpredictable execution order |
| `fields = '__all__'` without `read_only_fields` | Mass assignment vulnerability |
| Missing `select_related` / `prefetch_related` | N+1 queries on every list endpoint |
| Direct model status mutation | Bypasses lifecycle facade, breaks invariants |
| `threading.local` for tenant context | Fails with async; use `contextvars` |
| `save()` without `update_fields` | Writes every column, triggers unnecessary signals |
| `SerializerMethodField` for DB data | Hides query cost; use proper serializer nesting + prefetch |
| Heavy logic in `save()` overrides | Implicit, hard to test; move to service layer |
| `default=` with mutable values on model fields | Shared reference bug across instances |

---

## 5. Correct Alternatives

| Instead Of | Do This |
|---|---|
| Logic in ViewSet `perform_create` | Delegate to `EntityService.create()` |
| Logic in signal handler | Signal calls `EntityService.handle_event()` |
| `fields = '__all__'` | Explicit field list + `read_only_fields` |
| `SerializerMethodField` for relations | Nested serializer + `prefetch_related` |
| `instance.status = 'active'; instance.save()` | `LifecycleService.activate(instance)` |
| `threading.local` for tenant | `contextvars.ContextVar('tenant')` |
| `len(queryset)` | `queryset.count()` |
| `obj.save()` (all fields) | `obj.save(update_fields=[...])` |
| Loop with individual `create()` | `Model.objects.bulk_create([...])` |
| Custom permission logic in views | `IsAuthenticated` + custom `BasePermission` class |
