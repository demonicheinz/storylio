# Global Partial Prefetching and cache adoption

Scope: public routes, protected dashboard routes, and preview routes. Keep all
existing uncommitted UI work. No database migrations or remote writes.

1. Enable global Partial Prefetching alongside existing Cache Components.
   Move URL-dependent public/preview page reads below route-local Suspense and
   keep public query results cached. Opt public navbar links into URL prefetching.
2. Add request-time streaming boundaries to every remaining async dashboard
   page. Keep admin and preview reads uncached and preserve authorization.
3. Wire public cache tags to existing successful CMS-write invalidation paths.
   Keep profile updates coherent across Home/About, and isolate admin About
   reads from the public About-content cache.
4. Verify synchronous route shells, deferred URL reads, invalidation behavior,
   all tests/type checks, development navigation diagnostics, and a production
   build/browser run where available.

Acceptance: no validation opt-outs; URL values resolved only within route-local
boundaries; private content never placed in public shared caches; filters and
language links keep their behavior; existing content and management UI retained.

Index review: schema and baseline migration already contain primary/unique,
relation, and ViewEvent indexes. Composite listing indexes remain candidates
for a separate EXPLAIN-based review. The live production catalog has not been
inspected and no index DDL is part of this task.
