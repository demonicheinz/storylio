# Dashboard Media assessment

Reviewed 2026-10-29 against `93b53a0`. Assessment only; application source and
real media/CMS data were not changed. Impeccable and frontend-design applied in
Operate mode, preserving Storylio's navy/blue palette and fonts.

Method: dual-agent (A: `01a1878a-96cd-7113-aae0-8f2f899d9c59`, Kierkegaard;
B: `01a1878a-9f5f-72b2-a848-548ea919c71a`, Helmholtz). Independent source
assessments; A completed before the parent read B's detector findings. Parent
performed the live accessibility inspection and isolated rendered assessment.

## Verdict

Keep Media as a reusable asset library and Gallery as curated public entries.
The useful distinction is already present: filename, format, size, dimensions,
download, and reference-aware deletion. The improvement should align collection
controls with the completed siblings and make file-management outcomes reliable.
No planet background, decorative animation, masonry or new visual world is needed.

Provisional combined Nielsen score: **25/40**. This combines source and limited
runtime evidence, not a certification or measured user study. Compared with the
source-only assessment, rendered consistency and deletion coverage reduce two
heuristic scores by one point each.

| Heuristic | /4 | Main evidence |
| --- | ---: | --- |
| System status | 2 | Upload feedback exists; Copy URL reports success even after rejection. |
| Match with tasks | 3 | File actions/metadata fit an asset library; blur/public-ID terms are secondary. |
| User control | 3 | Cancel and filters exist; filtered emptiness lacks direct reset. |
| Consistency | 2 | Old toolbar, card radius, thumbnail and list alignment patterns differ from siblings. |
| Error prevention | 2 | Reference guards exist, but About coverage and batch identity review are incomplete. |
| Recognition | 3 | Thumbnails and filenames help; deletable filenames are absent from confirmation. |
| Efficiency | 3 | Search, sorting, grid/list and batch actions already exist; pagination scales poorly. |
| Minimalism | 3 | Compact summary is good; wrappers, large Select action and technical metadata compete. |
| Error recovery | 2 | Returned errors have messages; clipboard/transport/provider failures need recovery. |
| Guidance | 2 | Upload/rename explanations are useful; selection scope and blur status are unclear. |

## Strengths

- Usage preview and deletion-time recheck protect referenced assets in the
  currently covered surfaces. Keep this protection, including its blocked list.
- Preview contains the full image in its original ratio; size/dimensions and
  download are appropriate to Media. Card cropping does not alter the original.
- Two-value Images/Storage summary, filename-specific action names, shared
  selects/view controls and explicit single-file/10MB upload constraints are
  sound foundations. Multiple upload is optional new scope, not a missing fix.

## Priorities

### P1: complete reference coverage and reconcile deletion outcomes

The usage query checks ten categories, including post/project Markdown and
Gallery, but omits About's four localized image-capable rich-text fields:
howIWorkEn/Id and whatIValueEn/Id. The About editor permits images and the public
page renders these bodies. A URL used only there can be classified unused.
Add those references before expanding deletion UX, and show affected content
identities/edit links where practical. No real About record or deletion was used
to demonstrate this; it is a verified source coverage omission.

Deletion also ignores the boolean returned by deleteFromCloudinary. Single
remote success followed by DB failure, or partial remote batch failure before
the DB deletion, can leave mismatched state. Conversely a false remote result
can still lead to row deletion. Handle remote outcomes explicitly, distinguish
already-missing assets, and return per-item completion/retry information.
Do not call multi-provider deletion transactional without a reconciliation plan.
Upload remote-success/DB-failure compensation is a related follow-up.

Sources: [reference query](../../src/features/dashboard/media/actions.ts#L32),
[single delete](../../src/features/dashboard/media/actions.ts#L219),
[batch delete](../../src/features/dashboard/media/actions.ts#L281),
[provider result](../../src/lib/cloudinary.ts#L64),
[About fields](../../src/lib/db/schema.ts#L356).
Suggested command: `$impeccable harden`, with focused persistence/provider tests.

### P1: make batch scope and partial completion reviewable

Select all replaces the selection with every matching image across pages.
The 85-record fixture confirmed 85 selected while only 12 were on the page.
That is not inherently wrong, but the label and confirmation should make the
scope explicit. Preview currently lists blocked filenames and counts, while
the removable candidates are represented only by a count. Show those identities
too, matching Gallery's selected-item review.

Recommend Select page / Deselect page as the primary scope, an off-page count,
Clear selection, and an optional explicit Select all N matching images action.
Source also retains blocked IDs after deleting allowed items but exits selection
mode. Keep batch mode active for remaining blocked items, or clear all selection
when exiting. This partial-success transition was not executed in the fixture.
Bound batch size and backend reference-check concurrency as the library grows.

Sources: [select all](../../src/features/dashboard/media/components/media-client.tsx#L1244),
[partial completion](../../src/features/dashboard/media/components/media-client.tsx#L1106),
[batch preview](../../src/features/dashboard/media/components/media-client.tsx#L1617).
Suggested commands: `$impeccable clarify`, `$impeccable harden`.

### P2: align desktop/mobile controls and bound pagination

The rendered desktop Select media button occupies most of a second toolbar
row. At 320px Format and Sort are squeezed beside the view buttons, truncating
their displayed values. Use the same desktop aligned Search/Format/Sort/View/
Select pattern as Gallery, and the same compact Search/Filter/Select mobile row
with staged filters and view controls in the drawer. Stack the narrow header
rather than reserving space beside its description for Upload.

Pagination renders all page buttons. With 85 items, page 8 ends at x457 and the
mobile page-size trigger at x505 on a 320px viewport. Page 7/8 also exceed 390px.
Root scrollWidth remains equal to viewport because overflow is clipped, so a
root-overflow-only test would miss this. Reuse bounded desktop page items and
mobile Previous / page fraction / Next; name the page-size trigger explicitly.

Add Clear filters and search in active-filter context and filtered empty state.
Keep default counts in pagination, following the just-established collection
rule. Server pagination is a future scale option; no measured slow query or
large-library load test was performed.

Sources: [toolbar](../../src/features/dashboard/media/components/media-client.tsx#L1292),
[pagination](../../src/features/dashboard/media/components/media-client.tsx#L715),
[page-size name](../../src/features/dashboard/media/components/media-client.tsx#L788),
[empty results](../../src/features/dashboard/media/components/media-client.tsx#L1460).
Suggested commands: `$impeccable adapt`, `$impeccable layout`.

### P2: make feedback and failures reflect the actual outcome

Clipboard denial was reproduced entirely in the fixture: writeText rejected,
yet the success toast said URL copied to clipboard. Await it and offer a
selectable URL/manual-copy route on failure. Do not erase a rename draft or
selection on transport errors; keep delete confirmation open when an action
fails. Rename dismissal currently discards the entered value; the fixture
confirmed reopening restores the old filename. A keep/discard decision would
match the newly improved Gallery editor, but avoid adding autosave implicitly.

After a successful upload, existing filters/sort/page can hide the new image.
Preserve browsing context but provide View uploaded image, optionally opening
the existing details drawer. Announce when filters exclude it rather than
silently clearing them. A synchronous upload lock and resettable file input
would harden the current one-at-a-time contract; no duplicate upload was induced.

Download code permits Unicode names but interpolates them into Headers without
an encoded filename*. B's isolated local Headers construction probe rejected
a non-Latin character; no application download was made. Add an ASCII fallback
and encoded UTF-8 filename*, and catch upstream failures with useful recovery.

Sources: [clipboard](../../src/features/dashboard/media/components/media-client.tsx#L965),
[rename](../../src/features/dashboard/media/components/media-client.tsx#L1012),
[single delete feedback](../../src/features/dashboard/media/components/media-client.tsx#L1132),
[upload](../../src/features/dashboard/media/components/media-client.tsx#L894),
[download](../../src/app/api/media/[id]/download/route.ts#L59).
Suggested commands: `$impeccable harden`, `$impeccable clarify`.

### P2: simplify metadata hierarchy and match the collection geometry

- Keep a square management grid and contained original-ratio preview. Use
  12px cards and 16px media panels; current cards/nested metadata use larger
  rounded-2xl recipes.
- In list view match Gallery/Projects/Posts: 112x64 thumbnail, aligned header/row
  tracks, explicit Name/Type/Size/Dimensions/Actions. The current header has
  different gap/padding from rows; rendered Type and its values do not align.
- Keep filename, format, size and dimensions prominent. Move public ID and
  Blur ready/No blur into secondary detail metadata; do not present a technical
  state without an action or explanation on every card.
- Remove the redundant outer card around individual cards. Keep upload access
  clear, but collapse the inline drop zone by default if its persistent presence
  dominates browsing; expose it when Upload is chosen or files are dragged in.
- Keep one primary Upload action. The drawer's Rename/Download/Copy/View/Delete
  need a clearer hierarchy; reserve destructive styling for a deliberate menu
  choice rather than another full-width peer action.
- Allow the full filename to wrap in details and add useful failure placeholders
  for broken image previews. Preserve existing accessible preview/menu names.

Sources: [grid card](../../src/features/dashboard/media/components/media-client.tsx#L471),
[list row](../../src/features/dashboard/media/components/media-client.tsx#L566),
[list header](../../src/features/dashboard/media/components/media-client.tsx#L1490),
[detail metadata](../../src/features/dashboard/media/components/media-client.tsx#L392),
[drop zone](../../src/features/dashboard/media/components/media-client.tsx#L1354).
Suggested command: `$impeccable polish` after behavior/structure fixes.

## Cognitive load and personas

The primary task is locate an asset and safely act on it. Repeated upload entry
points, a large Select media row, technical blur status and a nested collection
surface add overhead before the images. A single compact collection toolbar,
secondary metadata and explicit destructive scope reduce this burden. Do not
limit valid format data merely to achieve a four-choice rule.

- **Alex, frequent CMS owner:** multi-page selection needs clear scope and a
  review of what will actually be deleted; failed operations should preserve it.
- **Sam, assistive-technology user:** numeric page-size naming needs purpose;
  upload/usage-check state needs announcement; computed contrast/focus behavior
  still needs a dedicated browser/AT pass.
- **Casey, phone user:** truncated filter values and clipped pagination prevent
  efficient browsing. Use the approved mobile collection controls.

The main emotional valley is trusting “unused” or “copied” when that promise
is incomplete. Reliable outcomes take priority over adding visual effects.

## Verification, provenance and limits

- The authenticated live page's AX output confirmed Media Library, 12 existing
  images, Upload, filters, selection, preview controls and Images/Storage summary.
  No real uploads, renames, downloads, deletion, or record changes were made.
- Native screenshot failed once after 20 seconds and reset its runtime. Parent
  switched to the repo Playwright CLI with the actual MediaLibraryClient/shared
  CSS/fonts and 85 synthetic images. Mutation actions/uploads return deliberate
  failure; usage preview uses synthetic local reference results.
- Rendered widths: 1440, 1024, 768, 390, 320. Captured grid/list, details, batch
  usage preview; checked rename dismissal and clipboard denial. Single deletion
  and successful mixed deletion/provider failures were source-reviewed only.
- Early overlay captures include transition frames. A follow-up waited for the
  final drawer bounds and opacity: left1056, width384, right1440 at 1440x900.
  The drawer is not reported as horizontally clipped from an in-flight frame.
- Scoped detector ran once per route/manager target, each exit0 and stdout[];
  no findings/false positives. This does not invalidate manual behavior findings.
- No live overlay injection: native evaluate is read-only and screenshot failed.
  No detector live-server was started or user-visible overlay claimed.
- Slug resolved to shboard-media-components-media-client-tsx-56e2abdd. No ignore
  list existed. Both independent reviewers and the fixture browser/server were
  closed. Temporary scripts/evidence remain ignored under .tmp/dashboard-media-review.
- No lint/build/full tests were run for this assessment because application code
  was not changed. Existing reference tests were read; no new pass claim is made.

Screenshots: [grid desktop](grid-1440.png), [grid320](grid-320.png),
[list desktop](list-1440.png), [list320](list-320.png),
[stable drawer](drawer-stable.png), [usage preview](usage-preview.png).
Synthetic data-URL filenames/provider IDs are fixture artifacts, not product defects.

## Proposed sequence and design choices

First fix reference coverage and provider/selection failure contracts. Then align
toolbar, list and pagination. Finish metadata hierarchy/drop-zone placement,
followed by a bounded fixture verification with used/unused assets, long and
Unicode names, off-page selection, failures and narrow/short viewports.

Choices for the next pass:

1. Drop zone collapsed until Upload/drag (recommended), or always visible but compact?
2. Preserve one-image-at-a-time upload for this polish (recommended), or scope a
   separate multiple-upload queue as an additional feature?

## Self-evaluation

| Axis | /5 | Evidence and improvement |
| --- | ---: | --- |
| Accuracy | 4 | Source and runtime separated; real provider and Unicode download not exercised. |
| Completeness | 4 | Visual/interaction and destructive contracts covered; real-photo/AT matrix remains. |
| Clarity | 4 | Five priorities connect problems to fixes; archive retains technical detail. |
| Actionability | 4 | Shared sibling patterns and concrete acceptance cases identified; upload scope remains open. |
| Conciseness | 4 | Chat distills recommendations; archive keeps full reproducibility. |

Overall4.0/5. Best follow-up: controlled reference-only About and provider-failure
fixtures before implementation can claim deletion protection is complete.
