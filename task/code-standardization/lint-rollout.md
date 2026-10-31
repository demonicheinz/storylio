# Incremental source lint rollout

The user chose incremental activation with passing commits. Formatting/import
organization still run across the repository; actual source lint coverage is
limited to the positive patterns in biome.json. This distinction corrects the
historical negative-only filter, which selected no source files.

## UI primitives — committed as 89f4983

All 28 files under src/components/ui are covered and lint clean. Five type-only
imports were corrected, the redundant nav role was removed, and three narrow
exceptions document forwarded label props, the non-sensitive sidebar preference
cookie and CSS Modules :global. Build, sidebar browser checks and the preceding
103-file/779-test combined suite passed. No broad unsafe fix was applied.

## Collection feature layer

Add the 28 top-level TypeScript modules under Projects, Posts, Gallery and Media:
types, policies, schemas, actions and Media hooks. Their component subdirectories
remain outside this stage. The sole diagnostic was an unused private
normalizedUrlArraySchema in Projects. Its only occurrence was its declaration;
the exported screenshot object schema already validates each image URL. Remove
that dead declaration without weakening screenshot validation or changing any
exported contract.

The combined source lint check selects **56 files**, with zero errors, warnings
or infos. No global lint rule was disabled. Existing collection schema/action,
publication, download/upload and PGlite tests are used for regression checks;
no implementation-mirroring test was added for dead code removal.

Review: no new public API or effect, no authorization or query changes, no
dependency updates. TypeScript and normal hooks must pass before committing.
Other source areas are not claimed lint-clean. Broader legacy findings retain
the baseline evidence in lint-activation-review.md.

Collection layer committed as `be53852`: 162 focused tests passed, source lint
selected 56 files without diagnostics, and normal lint/TypeScript hooks passed.

## Shared foundations

Expand coverage to src/lib, dashboard shared hooks and the shared top-level
TypeScript modules. The control-character rejection in auth-redirect.ts is a
deliberate input boundary, retained with a narrow explanatory lint exception.
containsPattern now uses a template string with the exact same LIKE escaping.
No authentication or database policy changes. The resulting source lint selects
109 files with zero diagnostics. Auth/management/confirmation/deletion tests
passed (57), plus eight schema tests including literal LIKE wildcard handling.
Build is not repeated for annotation/equivalent string syntax alone; commit
hooks still require TypeScript. No broad rule suppression or unsafe fix.
