# Gallery collection policy

Committed previous Posts renderer batch as `f7acc5f`; normal hooks passed.
Graphify code update completed afterward. Audit retains the known low deepmerge
finding; no dependency changes or push.

Gallery now owns its item model in `types.ts`, display/metadata rules in
`presentation.ts` and pure filter/sort policy in `filtering.ts`. The editor imports
its type directly instead of importing the manager module, removing that reverse
dependency. Collection state, selection limits, staged filters, reorder writes,
refresh reconciliation and preview lifecycle remain in GalleryManager.

AST comparisons matched the old filter callback and all four metadata helpers.
The manager decreased from 1,652 to 1,599 lines. Existing filename/title/ratio
fallbacks are preserved rather than silently redesigned.

Verification: 48 tests passed across Gallery policy and PGlite batch/reorder
tests. New cases exercise visibility/category/search intersection, nullable
metadata, decoded filenames, stable sort, non-mutation and dimensions/ratio
fallbacks. An inverted visibility condition failed the pure-policy tests; source
was restored and all 48 tests passed again.

The existing Gallery browser suite passed at 1440/1024/768/390/320/275px, covering
pagination, staged filters, draft guard, cross-page selection/limit, failed writes,
preview reconciliation, deleting the previewed item, keyboard reorder rollback and
restoration of the filtered working view. Screenshots stayed in .tmp/. Content,
actions/router/uploads are synthetic; no real CMS records changed.

Standalone TypeScript, lint (902 files) and whitespace checks passed. Build result
is appended below. Earlier full-suite results are historical; scoped tests define
this feature-policy batch's verification.

Review: equivalent policy, feature-owned pure modules, explicit type ownership,
unchanged authorization/write contracts and unchanged filtering complexity. No
new effects/listeners/network calls. Remaining UI and mutation boundaries will
be handled independently.

Self-evaluation: accuracy 4/5 (AST and browser/PGlite evidence; mocked browser
writes); completeness 4/5 (policy complete, UI still combined); clarity 4/5
(type ownership explicit, manager remains large); actionability 4/5 (fixtures and
tests reproducible); conciseness 4/5 (no generic collection framework).

Final build passed with 38/38 pages. The first build was slow in TypeScript and
was interrupted while its buffered output showed static generation completed;
its interrupted exit is not counted. A sequential rerun exited successfully.
