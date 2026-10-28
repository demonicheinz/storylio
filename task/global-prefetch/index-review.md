# Database index review (source only)

Date: October 25, 2026

Indexes already exist in `src/lib/db/schema.ts` and
`drizzle/0000_existing_schema.sql`:

- Primary-key indexes, including the Post/Tag composite primary key.
- Unique indexes for User email, Session token, Post slug, Project slug, and
  Tag name.
- ProjectScreenshot project ID and the reverse Post/Tag tag relation index.
- ViewEvent creation time, plus `(type, slug, createdAt)` for view queries.

Possible future candidates based on current public listing queries:

| Query | Candidate leading/filter and ordering columns |
| --- | --- |
| Published projects | status, order ascending, createdAt descending |
| Published articles | status, publishedAt descending, createdAt descending |
| Visible gallery | isVisible, order ascending, createdAt descending |

These are candidates, not approved DDL. Actual row counts, selectivity, query
plans, write overhead, and existing live catalog indexes should be checked with
EXPLAIN ANALYZE before choosing an index or partial-index design. Array filters
such as project tech stacks need their own measured plan review if they become
a bottleneck.

This task did not inspect a live environment's catalog, execute EXPLAIN on
production, change the Drizzle schema, generate an index migration, or apply
database DDL. Existing source/migration declarations do not by themselves prove
the current state of every live database. Indexes improve database access;
they do not fix URL/request reads outside Suspense.
