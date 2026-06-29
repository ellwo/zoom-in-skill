# REST Constraints — API Audit Context

Roy Fielding's six constraints define what makes an architecture
RESTful. For API audits, each constraint maps to specific signals
about how well the API respects separation, scalability, and
evolvability. Below each constraint are practical best practices
derived from the underlying principle.

---

## 1. Client-Server

**Constraint:** Separation of concerns. The client manages the user
interface; the server manages data storage and processing.

**Audit signal:** API responses containing UI-specific formatting
(CSS classes, HTML fragments) or the server making assumptions about
the client's rendering logic.

**Anti-pattern:** An endpoint that returns "display_name" computed
differently for mobile vs. web, pushing presentation logic into the
server.

**Why it matters:** Coupling client and server concerns means
changing the UI requires server changes and vice versa. Independence
allows each to evolve at its own pace.

---

## 2. Statelessness

**Constraint:** Each request from client to server must contain all
information needed to understand it. No session state on the server.

**Audit signal:** Endpoints that depend on a server-side session
object. Requests that fail when called in a different order.

**Anti-pattern:** A "set filter" endpoint followed by a "get
results" endpoint, where the second depends on session state set by
the first.

**Why it matters:** Stateful servers cannot scale horizontally
without session synchronization. Stateless requests can be handled by
any server instance, enabling load balancing and caching.

---

## 3. Cacheability

**Constraint:** Responses must define themselves as cacheable or
non-cacheable. When cacheable, clients and intermediaries can reuse
response data.

**Audit signal:** No Cache-Control or ETag headers on GET responses
for rarely-changing data. Dynamic data served without no-store
directives.

**Anti-pattern:** A list endpoint returning real-time data with no
cache headers, forcing every client to hit the server on every view.

**Why it matters:** Proper cacheability reduces server load,
improves client-perceived performance, and lowers network costs.
Missing cache headers force unnecessary round-trips.

---

## 4. Layered System

**Constraint:** A client cannot tell whether it is connected to the
end server or an intermediary. Intermediaries (load balancers,
caches, gateways) can be inserted transparently.

**Audit signal:** Responses that expose internal routing (X-Backend-
Server headers, internal IPs in error messages). Client code that
assumes direct connection.

**Anti-pattern:** An error response containing the internal host
name or database connection string.

**Why it matters:** Exposing internal topology limits deployment
flexibility and creates security risks. Layered systems allow
intermediaries (CDNs, firewalls, rate limiters) without client
changes.

---

## 5. Uniform Interface

**Constraint:** Resources identified by URIs, manipulated through
representations, with self-descriptive messages. HATEOAS
(hypermedia as the engine of application state) guides transitions.

**Audit signal:** Endpoints that use verbs in URIs
(/createOrder instead of POST /orders). Inconsistent use of HTTP
methods (GET for mutations, POST for reads).

**Anti-pattern:** A single endpoint accepting different operations
based on a request body field instead of using distinct HTTP methods
and resource URIs.

**Why it matters:** A uniform interface makes APIs learnable,
predictable, and interoperable. Tooling (caching, proxying,
documentation generators) relies on these conventions.

---

## 6. Code on Demand (Optional)

**Constraint:** Servers can extend client functionality by
transferring executable code (JavaScript, templates).

**Audit signal:** Not commonly violated in pure API contexts. Check
for unnecessary executable payloads when a data-only response
suffices.

**Why it matters:** Code on demand is optional and should be used
intentionally. Sending code when data suffices increases payload size
and attack surface.

---

## Practical Best Practices Derived from REST

| Practice | Derived From | Violation Signal |
|---|---|---|
| Proper HTTP methods (GET=read, POST=create, PUT/PATCH=update, DELETE=remove) | Uniform Interface | GET with request body for filtering |
| Correct status codes (201 for creation, 204 for deletion, 422 for validation) | Uniform Interface | 200 for all responses regardless of outcome |
| API versioning (URL prefix or header) | Client-Server | Breaking change deployed without version bump |
| Pagination on list endpoints | Statelessness | List endpoint returning unbounded results |
| Consistent error format (RFC 7807 or project standard) | Uniform Interface | Different error shapes per endpoint |
| Cache-Control headers on GET responses | Cacheability | No cache headers on read endpoints |
| No internal details in error responses | Layered System | Stack traces or hostnames in errors |
