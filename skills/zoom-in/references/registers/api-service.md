# API Service Register

For systems whose primary interface is an API (REST, GraphQL, or
hybrid). Add this register when the system exposes endpoints consumed
by external clients, frontends, or partner integrations.

## Additional Signals Per Lens

### Structure

- **API versioning implemented.** Unversioned APIs cannot evolve
  without breaking existing consumers. Versioning isolates change and
  allows gradual migration.
- **Request/response DTOs separate from domain models.** Exposing
  internal models directly couples the API contract to the data
  schema, making independent evolution impossible.
- **Middleware/pipeline for cross-cutting concerns.** Authentication,
  logging, rate limiting, and request validation applied uniformly
  through middleware rather than scattered across handlers.

### Security

- **Input validation on every endpoint.** Unvalidated input is the
  root cause of injection, overflow, and business-logic exploits.
- **Rate limiting configured.** Un rate-limited APIs are vulnerable to
  abuse and resource exhaustion.
- **API key/token authentication properly handled.** Tokens must be
  validated on every request, rotated periodically, and revoked on
  compromise.
- **CORS configured correctly.** Overly permissive CORS (wildcard
  origins with credentials) enables cross-site attacks.

### Performance

- **Pagination on all list endpoints.** Unpaginated list endpoints
  degrade as data grows, eventually timing out or exhausting memory.
- **Response field selection supported.** Returning full objects when
  clients need a subset wastes bandwidth and increases serialization
  cost.
- **Compression for large responses.** JSON payloads without
  compression waste network capacity, especially for mobile clients.

### Clarity

- **Consistent response format across all endpoints.** Inconsistent
  response shapes force clients to write endpoint-specific parsing
  logic, increasing integration cost and error rates.
- **Error format follows a documented standard.** RFC 7807 or a
  project-defined structure. Inconsistent errors make debugging
  harder and break automated error handling.
- **Endpoint naming follows consistent convention.** Mixed naming
  (camelCase and snake_case, plural and singular) creates cognitive
  friction for API consumers.

## Key Anti-Patterns

| Anti-Pattern | Severity | Detection |
|---|---|---|
| Inconsistent response format between endpoints | High | Different response shapes for same API |
| Missing pagination on list endpoints | High | List endpoint without page/limit params |
| Error responses exposing internal structure | Critical | Stack trace or DB error in response |
| API without versioning strategy | High | No version prefix or header |
| Domain model returned directly as response | Medium | Serializer mirrors model 1:1 with no field control |
| CORS wildcard with credentials | Critical | Access-Control-Allow-Origin: * with auth |
| Missing input validation on endpoint | Critical | No validation layer on request data |
| Inconsistent endpoint naming convention | Medium | Mixed naming styles in URL paths |
