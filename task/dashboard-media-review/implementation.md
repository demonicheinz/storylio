# Dashboard Media implementation

Implemented 2026-10-29 following assessment and subsequent user choices. No
real media was uploaded, renamed or deleted. No schema migration, dependency
installation, commit or push was performed.

## Upload workflow

The inline panel is hidden until Upload or an actual file drag. Drag depth
prevents repeated close/reopen when moving between child elements; a dropped
file's browser-default navigation is prevented. Leaving an empty drag session
collapses a panel that was opened only by drag.

The row queue follows the controlled-item pattern of
[Beui Upload Queue](https://beui.dev/components/blocks/file-upload#upload-queue),
adapted with Storylio tokens, shared Button controls and Phosphor icons. Demo
timers and fake progress were not copied. It retains up to 10 files, validates
JPEG/PNG/WebP/GIF and 10MB per image, and starts at most two requests. Invalid,
duplicate and overflow files receive named feedback. Successful rows remain
until cleared; removing an entry affects queue state, not stored media.

XHR reports actual transfer progress, then Processing after transfer completion,
then Uploaded only after a successful validated server response. Unknown
progress has no percentage. A two-minute request timeout prevents a slot from
remaining occupied indefinitely. Interrupted or unconfirmed responses tell the
owner the server may already have saved the image, so manual retry must check
the library to avoid duplicates. There is no server idempotency key or resumable
transfer claim.

Retry acts only on failed valid images; Retry failed does not resend successes.
Queued/finished rows may be removed; active rows have no cancel action. Clear
completed only removes success rows. Uploading/processing/queued states protect
closing the panel and ordinary link/reload navigation. Unmount aborts client
requests and revokes object URLs, without claiming that server work rolls back.

Completed images enter the local library without clearing the search or order.
View image opens their actual details even when the current search excludes
them. Queue state is memory-only and does not survive a reload. Native history
navigation is subject to the browser unload lifecycle; no cross-route global
queue persistence or full Next Back/Forward protection is claimed.

## Collection and editing

Desktop uses Search, Sort by, a direction toggle, View and Select in one aligned
toolbar. Sort fields are Upload date, File size, File name and Format, with an
independent ascending/descending direction. Format groups images; it is no longer
a separate filter. Mobile retains the approved Search/Filter/Select row with
staged sorting/view options in a drawer. Reset is staged; dismissing does not
apply it. Active context shows results and Clear; default totals stay in paging.

Grid cards use 12px radius; original-ratio details and 112x64 list thumbnails use
the media recipe. The list has matching header/row tracks and no redundant Type
column. File names split base/extension so ellipsis affects the base while the
extension remains visible; extensionless library names display their stored
format as a suffix. The underlying library name is not changed. Accessible
names and tooltips retain the full display name. Separate format badges are
removed. Technical asset IDs and loading-placeholder state remain in details.

Filename parts are presentation helpers shared with the queue. They do not
infer file content or override server format validation. Original format remains
visible in full image metadata.

Pagination reuses bounded page items and a mobile page fraction. Selection has
Select page/Deselect page, off-page count, identity review, Clear selection and
a shared 100-item limit. Delete review includes both removable and protected
filenames. Partial failures remove only confirmed deleted rows, retain the
remaining selected images, and display per-file errors for retry. Rename uses
unique labels, dirty dismissal protection, a save lock and retained error input.
Details derive from current local rows, so rename and deletion reconcile them.

Copy waits for completion, with a selectable Image URL fallback on denial.
Download failures show a local retry message while retaining library context.
Object URLs are revoked after triggering the browser download. Broken thumbnail
states have named placeholders.

## Persistence and provider safety

Usage checks include the four image-capable localized About rich-text fields.
Reference checks and provider deletion are bounded to three concurrent jobs;
all guards remain owner-first. Execution checks references again and rejects
newly blocked inputs before remote deletion. This is still a check-then-delete
boundary, not a lock against all concurrent reference writes or an asset graph
that normalizes every transformed/aliased URL.

Provider deletion must explicitly confirm `ok` or `not found` before removing
the database row. False/throw keeps the row. A provider-success/DB-failure
returns retry guidance; already absent remote assets can reconcile on retry.
Batch responses return confirmed deleted IDs and failed item outcomes. These
two systems are not claimed atomic.

Upload DB failures attempt remote cleanup. Blur generation failure falls back
to null; revalidation failure does not undo a saved media record. Failed cleanup
returns a provider asset identifier to the authorized owner for manual cleanup.
No background reconciliation service or durable job queue is introduced.

Downloads use an ASCII fallback plus UTF-8 `filename*`, reject control characters,
return private/no-store errors, catch provider failure, and limit header wait
without aborting the streamed body after headers arrive.

## Verification

- Full Vitest run before the final sorting simplification: **77 files, 552 tests
  passed**. Additional presentation tests bring nine new sorting/filename cases.
- After final presentation changes: **38 tests passed** across presentation,
  queue/controller, transport and panel suites. Provider/DB and download tests
  use only PGlite/mocks. No real upload or deletion was exercised.
- Media browser suite passed 1440/1024/768/390/320/275px, staged controls, visible
  pagination bounds, list tracks/112x64 geometry, extension visibility at
  390/320px, two-way format sorting, rename guard/transport retry, clipboard and
  download failure recovery, protected single deletion, identity review and
  partial batch completion with retained blocked selections.
- Queue browser suite passed with two maximum active requests; requests were
  a.png, b.png, c.png, and retry b.png. It covered search-hidden uploaded media,
  leave confirmation, completed cleanup, drag opening, rejection and responsive
  row layout. No page runtime errors were observed in either suite.
- Biome and TypeScript passed. Managed dev build compiled, checked TypeScript
  and prerendered 38 pages. Final build rerun covers simplified sorting.
- Scoped Impeccable markup detector returned no findings before the final
  sorting change; the final scan is recorded at delivery.

The review fixtures use synthetic covers; they do not certify contrast across
all real photos or full screen-reader behavior. Queue percentages are tested via
mock progress events plus real local intercepted XHR lifecycle, not measured
against Cloudinary's production upload timing. Link/reload navigation guard is
verified; full Next history and real credential/provider flows remain outside
this local verification.

Screenshots: [desktop grid](updated-grid-1440.png), [320px grid](updated-grid-320.png),
[desktop list](updated-list-1440.png), [320px list](updated-list-320.png),
[mixed queue desktop](queue-mixed-desktop.png), [mixed queue mobile](queue-mixed-mobile.png).
Reproduction: [fixture README](../../tests/fixtures/dashboard-media/README.md).

## Self-evaluation

| Axis | /5 | Evidence and remaining limit |
| --- | ---: | --- |
| Accuracy | 4 | Browser, PGlite and transport tests; real provider integration is untested. |
| Completeness | 4 | Requested polish and queue delivered; resumability/global persistence are not included. |
| Clarity | 4 | Sort and suffix presentation simplify the collection; failure guidance stays per item. |
| Actionability | 4 | Reproducible fixture and tests provided; intentional concurrency boundary documented. |
| Conciseness | 4 | Queue/controller and rename isolated; manager remains substantial and can be split later. |

Overall 4.0/5. Further validation should target an explicitly disposable hosted
environment before making claims about real provider failure reconciliation.
