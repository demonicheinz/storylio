# Posts collection rendering

The preceding display batch was committed as `1e15fdb` with normal hooks. Audit
still reports the known unpatched low deepmerge finding. Graphify's code update
succeeded after the commit; semantic documentation updates remain separate.
No dependency changes or push occurred.

## Boundary

Move PostsGrid and PostsList together into `components/post-collection-view.tsx`.
They own the collection markup, desktop column recipe, responsive rows and
selection controls. PostsManager retains all state, filtering, pagination,
publication clock, selection callbacks and write actions. No shared collection
framework or new client entry directive is introduced.

The graph query reached 41 nodes, showing eight within its token budget. Current
source confirmed both renderers consume feature display helpers and callback
props. Compiled-runtime comparisons matched both moved functions exactly after
removing the new export modifiers. Markup, classes, titles, event propagation,
date formatting and caller callback arguments are unchanged.

PostsManager decreased from 1,239 to 927 lines; the view module is 313 lines.
This isolates rendering from orchestration rather than changing selection policy.

## Verification

- 42 focused tests passed: seven new grid/list contracts plus the existing 35
  display, filtering, sorting, publication-clock and publication-state cases.
- Both views retain editor links outside batch mode, plain titles and checked
  named checkboxes during selection, and clock-consistent badges/views. List
  page-selection appears only in batch mode.
- Inverting the batch-title conditions deliberately failed the contract tests.
  Source was restored and all 42 tests passed again before the final build.
- Existing browser suite passed at 1440/1024/768/390/320/275px: responsive layout,
  pagination, selection scope, tag search/reset, editor save/preview/draft guards.
  Publication-clock browser checks also passed, including live action availability.
- Extra local browser checks passed for both list and grid at 1440/320px:
  checkbox selection on desktop list, title/card selection for mobile/grid,
  one selection per click, checkbox deselection and no accidental navigation.
  Initial test assumptions incorrectly expected desktop title clicks to select
  and a mobile view toggle to be visible. The test was corrected to the existing
  UI: mobile grid was selected on desktop before resizing. No product behavior
  was changed to satisfy those assumptions.
- Standalone TypeScript, final lint (898 files), whitespace checks and production build
  (38/38 pages, dev Infisical environment) passed.

Browser actions/router/content are synthetic. The static contracts mock the
delete component. No real CMS records were changed. Earlier full-suite results
are historical; this isolated equivalent rendering change uses scoped checks.

## Review and remaining work

Correctness: compiled equivalence and selection/clock regression evidence.
Readability: rendering can be read independently of manager state and effects.
Architecture: feature modules depend on types/display helpers, never the manager.
Security: action authorization and validation unchanged. Performance: same render
tree, callbacks and state, no new effects or requests. Mutation orchestration,
Posts batch controls and Gallery remain separate candidates; smaller file size
alone does not require further extraction.

Self-evaluation: accuracy 4/5 (equivalence and corrected browser assumptions);
completeness 4/5 (renderer boundary done, wider cleanup remains); clarity 4/5
(ownership explicit, synthetic write limits); actionability 4/5 (tests and fixture
reproducible, no hosted write verification); conciseness 4/5 (one feature module,
no generic layer). New batch remains uncommitted and is not pushed.
