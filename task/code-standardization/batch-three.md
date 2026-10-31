# Media detail-panel decomposition

## Prior batch committed

The user requested committing the verified cover cleanup before continuing.
Commit `c3b15b6` contains the shared cover lifecycle, fallback fixes, tests and
batch-two evidence. Its lint/TypeScript commit hooks passed. This Media batch
remains uncommitted and no branch was pushed.

## Why this boundary

MediaLibraryClient combined collection filtering, page/selection state, upload
queue coordination, mutations and detail-panel rendering. The drawer used those
operations but did not need to own them. Its rename dialog imported MediaItem
from the large client module, making the type's ownership unclear.

The existing Graphify query `media detail drawer` traversed 128 nodes but showed
only 32 within its output budget. It exposed shared Drawer/client/action links,
not a complete proof of the current detail contract. Current source/importer
searches and browser checks were used to establish the actual boundary.

## Changes and preserved contracts

- `types.ts` owns MediaItem. Both the library and leaf dialogs import it there;
  no compatibility re-export or runtime import back into the manager is needed.
- `presentation.ts` contains the unchanged metadata formatting/ratio helpers.
  The library rows and detail panel use the same dimension policy.
- `media-thumbnail.tsx` owns thumbnail rendering and its existing failure state.
  Its source-reset behavior and optimized image props were not altered.
- `media-detail-drawer.tsx` owns preview/metadata/technical-detail rendering and
  action buttons. It receives the selected item, pending flag, direction, focus
  target and callbacks. It contains no collection state or server action imports.
- The library still owns selection/filtering, rename/delete state, copy feedback,
  authenticated download requests, upload queue, pending locks and mutation
  reconciliation. The drawer invokes the existing download through onDownload.
- Nested rename/delete dialogs remain children under the same Drawer context;
  finalFocus and Escape behavior are preserved.

MediaLibraryClient decreased from **1,633 to 1,383 lines**. The extracted detail
panel is 207 lines, thumbnail 40 lines, metadata 32 lines, and item type 14 lines.
This is an ownership change, not a claim that the entire Media feature is now
small or that relocating code alone removes business complexity. Its table/grid,
filters and batch-action modules are future bounded candidates.

## Verification

1. Before editing, the existing dashboard-media browser suite passed all ten
   scenarios at 1440/1024/768/390/320/275px. The identical suite passed afterward:
   collapsed uploads, staged filters, pagination bounds, list alignment, rename
   guard/retry, clipboard/download failure recovery, protected-delete retention,
   cross-page selection, and partial deletion reconciliation.
2. The upload queue browser suite passed eight scenarios: concurrency 2, selective
   retry, viewing a filtered upload, leave guard, clearing completed jobs, drag
   opening, invalid-file rejection and responsive controls. Requests were locally
   intercepted; no Cloudinary, database or real file mutation was performed.
3. A new detail browser check passed at 320/768/1440px: keyboard opening, metadata,
   read-only URL selection, View URL, Copy callback, technical details, nested
   rename update and focus restoration to the renamed preview on Escape.
4. Six existing grid/list screenshots at 320/390/1440px were byte-identical before
   and after extraction. New detail screenshots are stored beside this report.
5. TypeScript transpilation comparisons verified all four helpers, MediaThumbnail,
   drawer runtime code and the full MediaLibraryClient function remained equivalent,
   except the explicit onDownload delegation. Diagnostics stay in ignored .tmp/.
6. A separate local fixture bundle deliberately changed the Copy callback to send
   an empty string. The detail browser check failed with `Copy callback received
   a different URL`. Application files were never mutated by this check.
7. Five focused suites passed **47 tests**: metadata boundaries, media filename/
   sorting presentation, private download security, upload panel and queue logic.
   TypeScript passed after extraction; lint and whitespace checks passed.

Fixtures use real UI components with synthetic image rows, mocked actions and
Next Image, and local intercepted HTTP responses. These checks do not establish
live provider behavior or authenticated production routing. The download handler
and server actions were not changed. Final full-suite/build results follow.

## Review

Correctness: selection/mutations remain in one owner; extracted rendering receives
the same props and does not duplicate state. Tests exercise callbacks and focus
through the actual parent. Security: session/download/upload guards unchanged,
no schema or dependency changes. Architecture: leaf modules no longer source a
type from the collection manager, and the drawer is independently understandable.
Performance: same initial import behavior; no new fetches, effects or dependencies.

Self-evaluation: accuracy 4/5 (equivalence and runtime checks, mocked-service limits);
completeness 4/5 (bounded detail decomposition complete, broader manager work open);
clarity 4/5 (ownership explicit, main file still 1,383 lines); actionability 4/5
(existing/new browser suites reproducible, local server required); conciseness 4/5
(no duplicated state framework, new explicit callback boundary). Overall 4.0/5.


## Completed verification

Production build passed: compiled successfully, TypeScript completed, and 38/38
pages generated. Final lint checked 855 files and passed. The baseline, post-refactor, panel-specific and upload queue browser
checks passed. Both fixture servers and the browser session were closed afterward.
Full-suite results are appended when complete. New Media work remains uncommitted.

## Final result

Full Vitest suite passed: **93 files / 701 tests**, 387.27 seconds. Focused suites
passed 47 tests, standalone TypeScript and lint passed, and the production build
passed with all 38 pages generated. Baseline/post-refactor browser smoke, upload
queue checks and panel-specific keyboard/callback/focus checks passed. The isolated
wrong-URL mutation failed as expected, and six before/after screenshots were
byte-identical. Git whitespace checks passed. Only the prior cover batch was
committed (`c3b15b6`); this Media decomposition is still uncommitted. No push.
