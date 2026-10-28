# Projects cache review — 2026-10-27

Display options now use localeCompare, matching server facets. URL selections
retain default code-unit sorting for canonical keys.

The uncached getPublicProjects orchestrator normalizes selections and checks
them against published facets before invoking keyed caches. Unknown or mixed
unknown selections stay empty. Facets have no arguments; counts accept only
canonical published technology names; row queries receive the clamped page.
All caches retain the projects tag and minutes lifetime.

Validation:

- Full Vitest: 29 files, 211 tests passed, including PGlite pagination queries.
- Lint: 386 files passed. TypeScript and production build passed.
- Production browser: ordinary and MAX_SAFE_INTEGER pages both showed three
  demo projects; unknown and mixed unknown filters showed zero; Next.js AND
  TypeScript showed one. Option display order passed; no page errors.
- Boundary tests assert actual arguments passed into cached functions, covering
  duplicate/reordered selections, extreme/malformed pages, and unknown filters.
  Vitest does not transform Next cache directives; it does not measure cache hits.

No CMS data writes, commit, or push. Existing card title spacing is unchanged;
the user's follow-up asks for advice before changing it.

Self-evaluation: accuracy 4/5 (production behavior verified, cache hit rates not
instrumented); completeness 5/5 (both findings fixed with preserved empty-state
semantics); clarity 5/5 (separate facets/count/rows and explicit input boundary);
actionability 5/5 (implemented and preview available); conciseness 4/5 (the
verification report adds detail kept out of the final response). Average 4.6/5.
Future improvement: measure cache hit rates under load if operational evidence
is needed. The user should agree with the limited claims above.
