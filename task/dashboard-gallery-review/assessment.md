# Dashboard Gallery assessment

Reviewed 2026-10-29 against `682d471`. Assessment only: no application code,
real CMS record, upload or database was changed. Impeccable and frontend-design
were used in Operate mode, preserving Storylio's navy/blue tokens and fonts.

Method: dual-agent (A: `01a18622-de16-7a33-a2c3-d6e7c6ced5b0`, Copernicus;
B: `01a18622-df30-7650-95cb-f78c2640e782`, Mill). Independent source reviews;
A completed before the parent read B's detector findings. Parent inspected
the authenticated local page's accessibility tree and then rendered the actual
GalleryManager in an isolated fixture with synthetic images and disabled writes.

## Verdict

Keep the image-first grid, compact summaries, explicit whole-collection reorder,
and metadata preview. Gallery lags the updated Projects/Posts in editing safety,
selection clarity, toolbar consistency, and narrow-screen composition. It needs
a focused alignment pass, not a new visual world or a decorative carousel.

Provisional Nielsen score: **24/40**. This is a design assessment, not a measured
accessibility certification; some findings are runtime-confirmed, others are
explicitly source-derived.

| Heuristic | /4 | Evidence |
| --- | ---: | --- |
| System status | 3 | Summary and save feedback exist; off-page selection scope is hidden. |
| Match to tasks | 3 | Grid, category and metadata suit curation; numeric order is ambiguous. |
| User control | 2 | Dirty form is lost after dismissal and reopening. |
| Consistency | 2 | Older mobile toolbar, large card radii and saturated status badges. |
| Error prevention | 2 | Delete confirmation exists, but shows count without selected identities. |
| Recognition | 3 | Images/metadata are useful; drawer title unnecessarily truncates. |
| Efficiency | 2 | Mobile lacks sorting and page-select acceleration is absent. |
| Minimalism | 3 | Quiet palette; redundant wrappers and reorder explanation consume space. |
| Error recovery | 2 | Business errors retain fields; transport and clipboard failure paths are incomplete. |
| Guidance | 2 | Visibility is explained; order semantics and batch maximum are not. |

## What works

- Images lead, while title/category/status make records recognizable.
- Drawer preview preserves original ratio with object-contain, exposes size and
  dimensions, and explicitly restores focus to the opening control in source.
- Reorder intentionally includes hidden items and the entire collection; server
  validation rejects incomplete membership and updates within a transaction.
  Keyboard sorting already exists in the shared sortable list.

## Priorities

### P1: Preserve editing confidence and current drawer data

The form resets defaults whenever opened and does not guard dirty dismissal.
In the 320px fixture, entering a caption, pressing Escape, waiting for close,
and reopening produced an empty caption. Add keep-editing/discard handling for
Cancel, Escape, backdrop and Close, plus a clear saving/uploading contract.
Do not introduce silent autosave as part of this refinement.

Source also stores the selected item object rather than its ID. Edit success
refreshes props but closes only the nested editor; the drawer can retain old
fields. Delete can leave a preview for a removed item. Derive the drawer item
from current props by ID and close when absent. This stale-data sequence is
source-derived, not verified through a real CMS save.

Sources: [form opening](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L382),
[save](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L396),
[selected state](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1342),
[drawer](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1890).
Suggested command: `$impeccable harden`.

### P1: Expose the complete scope of batch actions

Selection persists across filters/pages, while delete confirmation names only
the total count. Preserve cross-page selection deliberately, but show the count
outside this view, allow reviewing selected images/titles, offer Select page and
Clear selection, and prune IDs removed from refreshed data. Keep selection
stable during pending actions. Expose the server's 100-item maximum and return
a specific over-limit error rather than "Select at least one gallery item."

Sources: [selection/actions](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1494),
[confirmation](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1132),
[server limit](../../src/features/dashboard/gallery/actions.ts#L25).
Suggested command: `$impeccable harden`.

### P2: Align toolbar and narrow-screen composition

Use the approved collection toolbar: desktop Search, Visibility select,
Category, Sort by, view and selection controls with aligned labels and heights.
Mobile gets flexible Search plus 44px Filter/Select buttons, with Visibility,
Category and Sort by in the staged Apply/Reset drawer. The current mobile
toolbar omits Sort by entirely. Category is single selection: a searchable
combobox can reuse existing categories; multi-select is not needed by default.

At 320px, the always-horizontal heading/Add layout leaves the description about
120px wide and spreads it across five lines. Stack Add beneath the introduction
on narrow screens. Move Reorder beside collection actions and show its full
explanation only while active. Add result count and direct Clear filters.

Sources: [header](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1590),
[mobile controls](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1636),
[desktop controls](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1699).
Suggested commands: `$impeccable adapt`, `$impeccable layout`.

### P2: Make pagination bounded and order semantics understandable

Pagination creates a button for every page. The 85-image fixture at 320px
produces 8 page buttons: page 6 starts at x317, page 8 ends at x457, and the
page-size trigger ends at x505. Root scrollWidth still reports 320 because
overflow is clipped; absence of document overflow is not proof of usability.
Reuse the incumbent desktop ellipsis/mobile Previous + page fraction + Next
pattern, with explicit page-size accessible naming.

The same Display order input treats 0 as append on creation and position zero
on editing. Prefer an explicit "Add to end" default and Reorder for subsequent
curation. If manual order remains, explain its indexing and use consistent
semantics. Restore the prior working view after Done reordering. Return an
awaited success/failure result for reliable rollback, including transport errors.

Sources: [pagination](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L967),
[reorder callback](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1535),
[create order](../../src/features/dashboard/gallery/actions.ts#L53),
[update order](../../src/features/dashboard/gallery/actions.ts#L175).
Suggested commands: `$impeccable adapt`, `$impeccable clarify`, `$impeccable harden`.

### P2: Normalize visual hierarchy and accessibility details

- Keep a uniform management grid; masonry belongs to the public viewing
  surface if needed. Maintain a consistent thumbnail ratio and contain the
  original image in preview. Real photos, portrait images and broken assets
  still need a subsequent fixture pass; current synthetic covers are uniform.
- Use the established 12px card/list radius and 16px standalone media radius.
  Current grid uses rounded-2xl (24px under this project's radius base).
- Use restrained status surfaces: Visible with success text/dot, Hidden with
  muted text/eye-off. Preserve explicit labels; do not rely on color alone.
- Remove the padded collection card around individual cards to recover mobile
  width; retain one appropriate list surface in list view.
- Match actual click area to pointer feedback. Currently the card advertises
  zoom, but only its image opens preview. Keep menu controls outside that action.
- Allow the drawer's full caption to wrap; do not truncate the place users open
  to inspect details. Show alt text as its own metadata field where useful.
- Pass authored altText to thumbnails, item-specific names to reorder handles,
  and error IDs/descriptions to invalid fields. The image label needs a proper
  control association, using the same shared upload contract as other editors.
- Category entry should suggest existing categories and state whether required;
  show short length guidance for caption/alt/description instead of extra cards.
- Await clipboard writes before announcing success; report failure/retry.
  Catch rejected save/delete/batch/reorder tasks without losing local drafts.

Sources: [grid](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L764),
[thumbnail alt](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L211),
[status](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L269),
[drawer title](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1237),
[clipboard](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1182),
[sortable caller](../../src/features/dashboard/gallery/components/gallery-item-form.tsx#L1848).
Suggested commands: `$impeccable polish`, `$impeccable audit`.

## Cognitive load and personas

Mobile asks users to parse a header/Add split, stats, an always-visible reorder
explanation, separate search, status buttons, category and view/selection rows
before the first image. Progressive filtering and one collection toolbar reduce
that overhead while keeping the image curation task intact. No artificial
four-option limit is proposed for category data.

- **Alex, frequent owner:** cross-page selections lack a visible scope review;
  reorder discards the filtered working view. Preserve predictable operation.
- **Sam, keyboard/assistive technology user:** generic drag names, unassociated
  field errors, and truncated preview context make records hard to distinguish.
  Keyboard drag already exists; improve names and verify announcements.
- **Casey, phone user:** header description becomes a narrow text column,
  sorting is unavailable, and sufficiently large pagination clips controls.

The emotional valley is losing a composed caption; a precise discard decision
and retained drafts matter more than decorative motion or additional panels.

## Evidence and limits

- Live authenticated Gallery accessibility output confirmed the current page,
  10 images, controls, preview buttons and metadata structure. No real record
  was edited, hidden, reordered, deleted or uploaded.
- Native screenshot attempt timed out after 20 seconds and reset the browser
  runtime. No repeated screenshot retry. Switched to the repository's Playwright
  CLI and a temporary isolated fixture using the actual GalleryManager/shared
  components, current CSS/fonts and local synthetic covers. All write actions
  return a deliberate failure. Router/filter persistence are mocked.
- Fixture checks: 1440, 1024, 768, 390 and 320px; dirty dismissal/reopen; desktop
  detail preview; large-collection pagination at 320px. This is not a complete
  mobile keyboard, text zoom, light-theme, focus/contrast or screen-reader audit.
- Scoped detector ran once against route and manager: exit 0, JSON `[]`, no
  findings. This regex result does not negate the manual behavior findings.
- No reliable live overlay: native evaluate is read-only, screenshot failed;
  no detector live-server or injected overlay was started or claimed visible.
- CLI fixture browser closed and server stopped before delivery; temporary
  scripts/independent reports remain ignored in `.tmp/dashboard-gallery-review`.
- New evidence only in this task folder; no application changes or commit.

Screenshots: [desktop](gallery-1440.png), [390px](gallery-390.png),
[320px toolbar](mobile-top.png), [form](mobile-form.png),
[desktop drawer](detail-1440.png), [pagination stress](pagination-320.png).
Some full-page captures include transitional overlay frames; use measured
geometry and the confirmed caption value, not opacity in those frames, as
behavioral evidence. Synthetic filenames from data URLs are fixture artifacts.

## Decisions for the next pass

1. Grid: uniform thumbnails (recommended) or masonry?
2. Ordering: default append + Reorder (recommended), or keep a manual numeric
   position field with clarified semantics?

Suggested sequence: protect draft/selection/drawer state; align toolbar and
bounded pagination; normalize cards and form accessibility; polish once and
verify the same device classes. No new features or schema changes are required
just to align Gallery with the completed management surfaces.

## Assessment self-evaluation

| Axis | /5 | Evidence and remaining improvement |
| --- | ---: | --- |
| Accuracy | 4 | Source and rendered evidence separated; stale drawer not exercised with persistence. |
| Completeness | 4 | Manager/editor/reorder/preview reviewed; real-photo and keyboard matrix remains. |
| Clarity | 4 | Five priorities mapped to user impact; technical archive is longer than chat. |
| Actionability | 4 | Incumbent components and acceptance checks identified; ordering choice remains open. |
| Conciseness | 4 | Chat distills the plan; archive retains reproducible evidence. |

Overall 4.0/5. Highest-value next improvement: add a controlled refresh fixture
to validate stale drawer correction and failed reorder rollback during
implementation. The user should be able to distinguish recommendations from
already applied fixes; none were applied in this assessment.
