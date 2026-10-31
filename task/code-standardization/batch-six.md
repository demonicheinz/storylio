# Projects sorting, presentation and sortable list

## Prior batch committed

The user requested committing the verified Media renderer and Gallery selection
work before continuing. Commit `45b4d90` contains that batch and passed the normal
lint/TypeScript hooks. The new Projects work remains uncommitted; no push.

## Why this boundary

ProjectsManager combined the public item type, sorting comparator, status/date
helpers, badge/image/action UI, static rows and drag persistence with collection
filtering, pagination and batch selection. Its sorting tests imported the whole
manager and needed mocks for unrelated action/delete UI modules.

The existing local graph query for ProjectsList, SortableProjectListRow and
compareProjects returned 28 nodes / 64 edges, including actionReorderProjects,
sorting tests and shared UI links. Those are historical source locations; current
imports and callers were inspected before changing module ownership.

The extraction keeps these contracts together:

- `types.ts`: DashboardProject and the existing sort field/direction unions.
- `sorting.ts`: the unchanged comparator, usable without React/action imports.
  Sorting tests now import the pure module and need no unrelated UI mocks.
- `presentation.ts`: unchanged publication classification and date-time text.
- `project-display.tsx`: shared status/featured badges, timestamp, thumbnail,
  technology pills and item action menu. Grid and list keep the same presentation.
- `project-list.tsx`: row/header column recipes, selectable static rows, drag
  activator and the complete existing reorder lifecycle, including sensors,
  optimistic order, persistence, pending state and failed-write rollback.

The manager still owns filters, view/pagination, selected IDs, batch actions and
the working collection. Its reorder callback receives the same collection as
before. No generic collection framework, new effect or lazy boundary was added.

ProjectsManager decreased from **1,813 to 1,192 lines**. The sortable list is 385
lines and shared display module 226 lines. Remaining manager work should follow
its filter/batch contracts, not an arbitrary file-size threshold.

## Verification evidence

- Existing Projects browser baseline passed ten scenarios before and after
  extraction at 1440/1024/768/390/320px: editing/identity, pagination, filter
  alignment/mobile search, cross-page selection, restored reorder search context,
  preview URLs, dirty navigation and disabled/concurrent screenshot uploads.
- A new keyboard reorder check passed before and after: failed-write rollback,
  canonical 85-item payload with sequential order values, successful retry,
  no drag gutter outside reorder mode and no title navigation in batch mode.
  Keyboard input waits for the handle to become enabled after the prior request.
  The fixture uses ToastProvider without a rendered toast viewport, so rollback
  is asserted from rendered order and action payload rather than toast text.
- Nine list/editor screenshots at the existing viewport sizes were byte-identical
  before and after extraction. Diagnostic copies stay in ignored .tmp/.
- The existing list/grid presentation check also passed: identical header/row
  tracks in normal and batch mode, 12px card radius, and all three status/featured
  badges retained 24px height with measured text contrast above 4.5 in the fixture.
- Compiled-runtime comparisons matched all 15 moved/retained functions, including
  the manager, grid, sortable list, rows, display helpers and sorting comparator.
- Thirteen focused tests passed: eight existing direction/stable-tie checks and
  five new list/presentation contracts (passive links, batch checkbox/plain title,
  named keyboard handle, explicit status/featured labels, bounded tech pills).
- A mutation alias loaded an isolated list copy with the batch-title conditional
  inverted. Both link/plain-title tests failed as expected; application source
  was untouched. Real sorting, action and callback implementations were not changed.
- Standalone TypeScript, lint and whitespace checks passed. Build/full-suite
  final results are recorded below when complete.

Fixtures render real UI with synthetic projects, mocked router/actions/uploads
and local image data. They do not verify authenticated production history, real
provider writes or real database persistence. PGlite/action regression tests stay
in the full suite. Historical task screenshots were not overwritten.

## Review and remaining work

Correctness: source-equivalence checks and baseline/retry tests preserve behavior
and callback arguments. State for reorder remains with its existing DnD component;
collection selection and filters remain in the manager. Architecture: neither
presentation nor list imports the manager for types, and pure sorting no longer
imports React/server-action UI transitively. Security: action authorization,
publication validation, upload guards and private preview routes are unchanged.
Performance: same imports/rendered structure, no new network call or listener.

This is a mechanical cleanup, not a fix for every possible image/action edge case.
Dashboard thumbnail error recovery on source replacement should be tested as a
separate behavior change, as done earlier for public covers. Projects filter and
batch-action decomposition, then Posts/Gallery, remain later bounded candidates.

Self-evaluation: accuracy 4/5 (15-function equivalence and browser evidence,
mocked-service limits); completeness 4/5 (this boundary done, broader cleanup open);
clarity 4/5 (ownership explicit, remaining manager is still large); actionability
4/5 (tests/fixture reproducible, local server required); conciseness 4/5 (pure
sorting removes test mocks, no generic state framework). Overall 4.0/5.

## Final result

Full Vitest suite passed: **97 files / 721 tests**, 317.13 seconds. Thirteen focused
sorting/list/presentation tests passed; the isolated inverted-title mutation failed
the two expected tests. All three Projects browser suites passed, nine baseline
screenshots were byte-identical, and the 15-function runtime comparison matched.
Standalone TypeScript, final lint (879 files), production build (38/38 pages) and
whitespace checks passed. Fixture server and browser session were closed. Previous
batch is committed as 45b4d90; this Projects batch remains uncommitted. No push.
