# Media grid/list renderers

## Prior work committed

The user requested committing the existing work before continuing. Two commits
were created with lint/TypeScript hooks enabled:

- `39d63bf`: Media deletion controller and confirmation-dialog rendering.
- `f312c7c`: shared styled dashboard confirmations and navigation guards.

The overlapping Media source/fixture changes were staged separately. This next
renderer batch remains uncommitted. No branch was pushed.

## Boundary and implementation

The local graph query for MediaCard, MediaListRow and MediaActionsMenu returned
17 nodes and 44 edges, including the shared menu's download dependency and the
card/row filename and metadata helpers. Those snapshot locations predate earlier
cleanup; current source/import searches established the actual call sites.

`media-collection-view.tsx` now owns MediaCard, MediaListHeader, MediaListRow and
their private MediaActionsMenu. Grid/list share the existing action contract and
column recipes in one feature presentation module, rather than splitting each
small component into a separate file.

The view takes item/selected/pending data and callbacks. It owns only the existing
menu trigger ref; it imports no server actions, collection hooks, fetch or router.
Download is delegated through an explicit required callback. The original download
implementation remains in MediaLibraryClient, shared by detail and row actions.

MediaLibraryClient still owns filtering, sorting, pagination, selection, queue
coordination, mutation reconciliation and overlay state. No collection state moved
into the view. The manager decreased from **1,085 to 786 lines** for this batch;
the view module is 324 lines. The earlier stage-four count was 1,128 before the
shared navigation guard removed duplicated listeners.

Names, image previews, format suffixes, size/dimension copy, column alignment,
selection checkbox behavior, disabled states, menu focus and destructive options
are unchanged. No new rendering effect or lazy-load boundary was introduced.

## Evidence

- The existing Media browser suite passed ten scenarios before and after extraction
  at 1440/1024/768/390/320/275px: pagination/filtering, list alignment, dirty rename,
  clipboard/download recovery, protected deletion and cross-page partial outcomes.
- The deletion browser suite passed all seven lock/error/retry scenarios afterward.
- A new renderer browser suite passed grid/list at 320/1440px: keyboard preview,
  focus restoration, exact Copy URL callback, successful intercepted download with
  RFC 5987 filename, Space selection and checkbox deselection. Screenshots are
  `media-grid-*.png` and `media-list-*.png` beside this report.
- Six existing grid/list screenshots at 320/390/1440px were byte-identical before
  and after extraction, before the subsequent requested checkbox visual change.
  Diagnostic copies stay in ignored .tmp/.
- Compiled-runtime comparisons of all four renderers matched after normalizing
  only export declarations and the injected download callback, before that
  requested visual adjustment.
- Five new renderer tests cover accessible names/format suffixes/metadata, selected
  and pending states in both views, and the list header column recipe. Together
  with filename/sorting, deletion-controller and private download tests, 38 passed.
- Standalone TypeScript and lint passed. Full-suite/build results follow below.
- A mutation alias loaded a separate renderer copy with the pending menu button
  deliberately enabled. Both grid/list pending-state tests failed as expected;
  application files were not changed by that diagnostic.

Browser fixtures use real components/CSS with synthetic rows and mocked actions/
Next Image. The successful download uses a locally fulfilled response containing
fixture bytes; no Cloudinary request, real CMS write or production download occurs.

## Review

Correctness: collection state remains in one owner and all mutation callbacks
preserve their arguments. The new download callback is covered in both views and
viewport modes. Security: API authorization and download URL construction stay in
the existing manager/server route. Architecture: the collection view depends on
the stable MediaItem type and presentation helpers, never on the manager module.
Performance: same rendered elements/import timing; no new data fetches or effects.

Remaining work is a separate review of another feature manager. Media still owns
its staged filters and collection/selection orchestration; it was not reduced to
an arbitrary line target or converted into a generic collection framework.

Self-evaluation: accuracy 4/5 (runtime equivalence/screenshots, mocked-provider limits);
completeness 4/5 (Media rendering boundary done, broader cleanup open); clarity 4/5
(callback ownership explicit, future managers need their own audit); actionability
4/5 (fixtures reproducible, local server required); conciseness 4/5 (one view module,
no generic state machinery). Overall 4.0/5.

## Completed checks

Production build passed: TypeScript completed and 38/38 pages generated. Final
lint checked 871 files and passed; whitespace checks passed. Fixture server and
Chromium session were closed after browser verification. Full suite result follows.

## Requested selection-indicator adjustment

During verification the user requested matching Projects/Posts selection indicators.
The grid checkbox wrapper now uses the same top/left positioning and no background,
border, rounded container or 44px outer box. The existing enlarged checkbox hit
area and image-wide selection button remain. Wrapper clicks stop propagation,
matching the other collection cards. List selection rails already follow the
existing collection convention and were left intact.

After the adjustment, all five renderer tests and lint passed. Browser grid/list
checks passed again at 320/1440px, including keyboard selection and checkbox
deselection. Updated screenshots show the requested flat indicator; this is an
intentional visual change, separate from the mechanical extraction comparison.

## Final result

Full suite: **96 files / 716 tests passed**, 311.66 seconds. The final selection-style
adjustment was additionally checked by five focused renderer tests and the grid/list
browser suite. Standalone TypeScript, lint, production build and whitespace checks
passed; build generated all 38 pages. The pending-state mutation failed two tests
as expected using an isolated copy. Fixture servers/browser sessions were closed.
Commits 39d63bf and f312c7c remain local; the new renderer/selection work is still
uncommitted. No push was performed.

## Gallery selection consistency

The user also requested the same flat selection indicator in Gallery. Its grid
checkbox wrapper now uses the shared collection position (top-3/left-3/z-10) without
background, border, radius or the large outer box. Click propagation protection,
checked/pending behavior and enlarged checkbox hit area are retained.

Chromium checks passed at 320/1440px: the wrapper computes transparent background
and zero border; checkbox click selects without opening preview, Space deselects,
and Enter on the image toggles selection. Screenshots are gallery-select-*.png.
Lint and git diff --check passed. This one-class visual adjustment did not require
rerunning the full suite/build from the preceding renderer work. No commit or push.
