# Spring Boot Framework Reference

## 1. Framework Detection

Confirm Spring Boot when you see:
- `@SpringBootApplication`, `@RestController`, `@Service` annotations
- `pom.xml` or `build.gradle` with `spring-boot-starter-*` dependencies
- `application.yml` or `application.properties` configuration files
- `@Entity`, `@Repository`, `@Transactional` JPA annotations
- Package structure under `src/main/java/` or `src/main/kotlin/`

---

## 2. Architecture Conventions

| Layer | Responsibility | Typical Location |
|---|---|---|
| Controller (`@RestController`) | Request mapping, response shaping | `controller/` or `web/` |
| Service (`@Service`) | Business logic, state transitions, orchestration | `service/` |
| Repository (`@Repository`) | JPA data access, custom queries | `repository/` |
| Entity (`@Entity`) | Domain model, table mapping | `model/` or `domain/` |
| DTO | Request/response data transfer objects | `dto/` |
| Config (`@Configuration`) | Bean wiring, externalized settings | `config/` |
| Exception Handler (`@ControllerAdvice`) | Global error handling | `exception/` |

**Key rule:** Controller → Service → Repository. Controllers are thin adapters; services hold business logic; repositories handle data access.

---

## 3. Lens-Specific Signals

### Clarity
- Controllers named `<Entity>Controller` with `@RequestMapping` base path
- Services named `<Entity>Service` with interface + impl separation
- Repositories named `<Entity>Repository` extending `JpaRepository` or `CrudRepository`
- DTOs named `<Entity>Request` / `<Entity>Response` / `<Entity>Dto`
- Entities named `<Entity>` with `@Entity` and `@Table` annotations

### Structure
- **Controller thickness:** Methods exceeding 5-8 lines suggest logic leaking in
- **Service layer:** All business logic in `@Service` classes; controllers only delegate
- **Repository usage:** Custom queries via `@Query` or method naming conventions; avoid JPQL in services
- **`@Component` organization:** Utility classes and listeners as focused `@Component` beans
- **Exception handling:** `@ControllerAdvice` for global handling, not try/catch in every controller

### Performance
- **N+1 with JPA lazy loading:** Accessing `@OneToMany` relations triggers per-row queries
- Missing `JOIN FETCH` / `EntityGraph` for eagerly needed relations
- DTO projections not used for read-only queries (full entity load unnecessary)
- Missing database indexes for frequent query patterns
- `@Transactional` on read-only methods (unnecessary transaction overhead)
- Session/EntityManager leaks in extended persistence contexts
- Large `@BatchMapping` or `@Query` result sets without pagination

### Security
- Spring Security configuration with `SecurityFilterChain` bean
- Method-level security via `@PreAuthorize` / `@Secured`
- Input validation via `@Valid` + Bean Validation annotations
- Actuator endpoints exposed in production (misconfiguration)
- Sensitive data in `application.properties` (use vault or env vars)
- CSRF configuration for session-based auth
- Missing auth on specific endpoints (permitAll without intent)

### Resilience
- `@SpringBootTest` for integration, `@WebMvcTest` for controller slice, `@DataJpaTest` for repo slice
- Test profiles with `application-test.yml`
- Missing test profiles causing production DB dependency
- `@Transactional` on test classes for automatic rollback
- Missing health check indicators

### Domain Integrity
- Service facade for all state transitions (no direct entity mutation in controllers)
- Spring Security for tenant context propagation
- Missing tenant filtering in repository queries (cross-tenant data leak)
- Business rule validation in services, not only Bean Validation constraints

---

## 4. Framework Anti-Patterns

| Anti-Pattern | Why It's Bad |
|---|---|
| Business logic in controllers | Untestable in isolation, mixes HTTP with domain |
| `@Transactional` on read-only methods | Unnecessary transaction overhead, connection waste |
| Lazy loading outside transaction | `LazyInitializationException` at runtime |
| N+1 with JPA `@OneToMany` access | One query per parent row, kills performance |
| Sensitive data in `application.properties` | Secrets in source control |
| Actuator endpoints exposed in production | Info leak, attack surface |
| Anemic domain model (all logic in services) | Fine for simple apps, but entities should enforce invariants |
| `@ControllerAdvice` catching `Exception` only | Masks specific errors; catch specific types |
| God service class with 50+ methods | Violates SRP; split by aggregate or use case |
| Returning entities from controllers instead of DTOs | Leaks internal structure, circular serialization with Jackson |

---

## 5. Correct Alternatives

| Instead Of | Do This |
|---|---|
| Logic in controller method | `EntityService.create(request)` |
| `@Transactional` on reads | `@Transactional(readOnly = true)` or omit |
| Lazy load outside session | `JOIN FETCH` in query or `EntityGraph` |
| N+1 on `@OneToMany` | `@EntityGraph` or `JOIN FETCH` in repository |
| Secrets in `application.properties` | Spring Cloud Vault, env vars, or AWS Secrets Manager |
| Actuator fully exposed | `management.endpoints.web.exposure.include=health,info` |
| Returning `@Entity` from controller | Map to DTO via MapStruct or manual mapping |
| Generic `@ControllerAdvice` catch-all | Specific exception classes with targeted handlers |
| 50-method service | Split into `EntityCommandService` + `EntityQueryService` |
| Direct `entity.setStatus(X)` | `EntityService.transitionStatus(entity, newStatus)` |
