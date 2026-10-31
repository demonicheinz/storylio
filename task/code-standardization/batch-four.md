# Media deletion controller and dialogs

The preceding Media detail extraction was committed as `535db31` after passing
its commit hooks. This next batch remains local and uncommitted; no push.

## Boundary

MediaLibraryClient previously owned usage review, single/batch confirmation state,
an immediate request lock, inline error state, server-action requests, partial
failure previews, and the two AlertDialog render trees alongside collection UI.

`useMediaDeletion` now owns that deletion workflow: target ID, preview, error,
pending state, synchronous ref lock, review/confirm requests and guarded closes.
It exposes operations rather than raw setters or a mutable lock ref. This is a
feature-specific hook, not a generic mutation framework.

`MediaDeleteDialogs` owns the single/batch confirmation UI and usage-reference
copy. Its close handlers ask the controller and cancel the overlay close event
when the request is locked. The same nested Drawer context is preserved.

The library still owns media rows, selected IDs, selection mode, filters, sorting,
pagination, detail/rename overlays, copy/download feedback and upload queue. It
passes row-removal and selection-mode callbacks into the controller. Keyboard
shortcut guards still use deleteId, matching the original contract. Removing
rows remains separate from completing the deletion dialog workflow.

MediaLibraryClient decreased from **1,383 to 1,128 lines**. The controller is
160 lines; dialog rendering is 150 lines. The purpose is isolating a complete
workflow and its tests, not reducing total line count by moving JSX elsewhere.

## Preserved behavior

- Review/delete actions still call the existing authenticated server actions.
  API routes, action implementations, schema and provider calls are unchanged.
- The ref lock is acquired before starting the React transition. Same-tick
  requests and selection changes are blocked; pending controls remain disabled.
- Failed usage review keeps selection and permits retry. Failed deletion keeps
  its confirmation/preview. Returned and thrown errors keep their original copy.
- Partial batch success removes only confirmed IDs. The preview retains only
  failed deletable rows plus protected rows, and retry submits failed IDs only.
- Successful batch selection-mode reconciliation stays in the library and keeps
  protected selected items. Single success removes the row and closes its detail.
- Escape/Cancel/Close cannot dismiss a confirmation during an in-flight request.

The fixture action resolver was updated for the hook's relative import. Its first
post-extraction bundle attempted to include real server dependencies because only
the old `../actions` import was mocked. The resolver now mocks the hook's `./actions`
explicitly, keeping the browser fixture local. No production bundler configuration
or application/server boundary was weakened to accommodate the fixture.

## Verification evidence

- Before extraction the new deletion browser suite passed seven scenarios on
  the original component. The same suite passed after extraction.
- The existing Media browser smoke passed ten scenarios at 1440/1024/768/390/320/275px,
  including cross-page selection, provider partial failure, rename and copy/download
  recovery. Six grid/list screenshots were byte-identical to the prior batch.
- Detail-panel callback/focus checks passed at 320/768/1440px. The upload browser
  suite passed all eight scenarios, including concurrency 2 and selective retry.
- Five controller tests cover empty selection, same-tick usage/single/batch locks,
  retry after failure, guarded close, protected items and failed-only batch retry.
  Their lightweight hook harness preserves state and refs; browser tests verify
  actual React transitions and UI pending states.
- Mutation check removed the usage-review ref guard temporarily; the same-tick
  test failed with two requests instead of one. The original source was restored,
  and all five controller tests passed afterward.
- Compiled-runtime comparisons of checkUsage, confirmSingle and confirmBatch
  matched the original command bodies after normalizing only callback delegation.
- Focused server/download/metadata suites passed 47 tests. The production build
  and standalone TypeScript passed. Lint and whitespace checks passed.

Browser fixtures use synthetic media and intercepted/mocked actions, not real
CMS, Cloudinary or authenticated provider state. Full-suite results follow.

## Review and remaining work

State for one deletion workflow has one owner. The hook does not take over the
collection; the dialogs do not import server actions or own mutation state. Error
recovery and transition semantics are exercised before/after through the manager.
No dependencies, upload validation, authorization, cache policies or UI tokens changed.

Table/grid renderers and staged filters remain in the library. Other feature
managers still need their own caller/state audit; this extraction is not a blanket
pattern to impose on every manager.

Self-evaluation: accuracy 4/5 (baseline, mutation and browser evidence, mocked-service
limits); completeness 4/5 (deletion workflow isolated, broader cleanup open); clarity
4/5 (state ownership explicit, hook intentionally feature-specific); actionability
4/5 (regressions reproducible with local fixture); conciseness 4/5 (no generic action
framework, manager reduced while complete behavior stays together). Overall 4.0/5.

## Final result

Full Vitest suite passed: **94 files / 706 tests**, 300.61 seconds. Focused controller
tests passed 5 tests after the deliberate missing-lock mutation was restored; the
mutation itself failed as expected. Server/download/metadata checks passed 47 tests.
Build completed all 38 pages, standalone TypeScript passed, and final lint checked
860 files. All four browser suites passed, six before/after screenshots were
byte-identical, and git diff --check passed. Fixture server and browser were closed.
The previous detail batch is committed as 535db31. This deletion batch remains
uncommitted; package.json and bun.lock are unchanged, and no push was performed.
