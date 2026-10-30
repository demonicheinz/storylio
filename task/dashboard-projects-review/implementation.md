# Dashboard Projects improvements

Implemented 29 October 2026, following the independent assessment and the owner's
feedback. The assessment describes the original state; this file records the
result. Changes remain uncommitted for review.

## Behavior and layout

- Batch Publish validates selected drafts against the publication schema and MDX
  safety validator before writing. Selected rows are locked in a transaction;
  missing, invalid or unsafe entries abort the whole batch. The error names the
  blocked project. No partial publication is reported as success.
- Project edits now guard reloads and normal link navigation when dirty. Create
  and draft modes consistently emphasize Save draft; Publish remains an explicit
  separate action. Existing live autosave semantics are disclosed beside actions.
- Preview uses the last successfully saved slug and is disabled before a first
  draft save. It is labelled Preview saved, with helper copy explaining the
  version. Saving a published project still updates the live record.
- Identity precedes case study. Only the save/status actions remain sticky.
  Case study, media and links have wider sections; optional thumbnail/social
  image overrides are grouped in an expandable area without removing fields.
- Titles open the editor directly outside batch mode. Normal rows omit inert
  drag gutters; reorder shows handles and restores previous search/filter/page/
  view context on Done. Rejected requests restore the previous visible order.
- Selection shows out-of-page scope, supports Select page, lists affected titles
  in the delete confirmation and removes selected IDs absent after refresh.
- Filter controls share 44px height. Status is a select aligned with Search,
  Featured, Tech stack and Sort. Tech stack uses the same searchable multi-select
  on desktop and mobile, with its label above the field. Mobile changes and Reset
  remain staged until Apply. Active filter count and Clear filters/search remain
  visible after dismissal. Empty results differ from an empty collection.
- Mobile pagination uses Previous / Page X of Y / Next; desktop numbers are
  bounded with ellipses. Title column width is checked alongside page overflow.
- Screenshot upload uses a named native button; every entry path checks disabled
  state and a synchronous in-flight lock. Latest screenshot values are retained
  on completion. Caption/alt inputs and drag handles have useful names.
- Multi-select popovers inside modals stay within the modal's interaction/focus
  boundary, using coordinates relative to the transformed modal. Escape closes
  the popover first, preserving the parent drawer.
- The shared Drawer swipe handle now has a 32px area, a centered 48×4px pill
  (rotated dimensions for side drawers) and clearer token-based contrast. The
  previous 12px wrapper placed its pill across the panel's 8px background inset.

## Verification

- Full Vitest run: **64 files / 405 tests passed**, including five new PGlite
  batch-publication tests. Empty content, executable MDX and missing IDs leave
  the entire selection unchanged; authorization and valid publication are tested.
- Full lint and TypeScript passed. Managed development build passed, including
  all 38 generated pages; the final build also includes shared Drawer, toolbar,
  tag and image-control updates.
- Browser suite passed at 1440, 1024, 768, 390 and 320px with 85 fixture projects.
  Draft save, saved-slug preview, dirty-link protection, filter staging and
  search, modal Escape, selection scope and upload locking were exercised.
- Desktop filter controls measured the same top coordinate and 44px height.
- Shared Drawer handle geometry and swipe dismissal passed for down/up/left/right.
- Source snapshots and screenshots are linked in the original assessment;
  updated evidence uses `updated-*`, `filters-aligned-*`, and `drawer-handle-*`.
- No CMS records, migrations or real uploaded media were changed by tests.

## Practical limits

The unsaved guard covers reloads and ordinary links, matching the existing Home
pattern. It does not intercept SPA Back/Forward or persist drafts across route
unmounts. Fixture routing/filter hooks are substitutes; browser checks do not
claim authenticated production writes or real storage uploads. Publication
semantics are verified against local PGlite, not a remote database.

## Self-evaluation

| Axis | Score | Evidence / limitation |
| --- | --- | --- |
| Accuracy | 4/5 | Local database and real-component browser tests; production writes deliberately untested. |
| Completeness | 4/5 | Reviewed workflow/layout issues addressed; draft recovery across SPA Back/Forward is a remaining extension. |
| Clarity | 4/5 | Publication and preview scope are explicit; existing manager remains a large module. |
| Actionability | 5/5 | Implemented changes, tests, fixture commands and screenshots are available for review. |
| Conciseness | 4/5 | Shared controls are reused; the review and fixture retain substantial evidence. |

Overall: 4.2/5. A later authenticated browser smoke and session draft recovery
would extend coverage without changing the completed layout work.

## Editor consistency follow-up

About and Projects now expose the same complete toolbar (19 controls verified
in the browser); the compact editor variant controls writing-area height only.
No formatting capabilities are hidden on About.

Cover and screenshot removal use one opaque popover-surface button with a Trash
icon and visible Remove text, inset at the top right with a 44px target. The
previous outline dark-mode style could make the background transparent over
bright photography. Screenshot reordering uses the complete left rail, with
the glyph vertically centered and stable client IDs retained through moves.

Editable technology badges and their remove targets consistently measure 44px
at 1440/1024/768/390/320px. Tech stack occupies a full row; Live URL and GitHub URL
share the next row on tablet/desktop, and Closed source occupies its own full
row. Populated fixture checks cover eight tags, media removal callbacks and
keyboard reordering, not only the empty create form.

## List and card presentation follow-up

List header and row tracks now use shared definitions, with padding applied to
individual cells. Title aligns with title text after the 112px thumbnail and
12px gap; Status and Updated at share cell padding; Actions share a center.
Normal and batch views measured zero horizontal offset for all four columns.
Dates and times are separate non-wrapping lines instead of breaking AM/PM.

Grid cards now use the 12px card recipe (`rounded-lg`); list media thumbnails use
16px (`rounded-xl`). Draft/Published/Featured badges share a 24px height, opaque
surface and visible text, with a sparkle icon for Featured. On grid cards the
badges sit below the cover rather than over photography. Dark-theme fixture text
contrast measured 7.89:1 / 9.35:1 / 10.00:1 respectively; this is a scoped
measurement, not a complete theme accessibility audit. Overlay action menus use
an opaque surface as well. Grid cards no longer reserve a fixed 224px text area.

Reproduce with `tests/browser/project-list-presentation.js` in the Projects
fixture. Evidence: `list-aligned-1440.png` and `grid-badges-1440.png`.

## Mobile toolbar follow-up

Search, Filters and Select now share one mobile row. Search receives remaining
space; the two icon buttons retain 44×44px targets, accessible names and hover
titles. The mobile shortcut hint is removed, selected mode exposes aria-pressed,
and the filter button retains a visible active-count badge.

A container query wraps the search onto its own row when the toolbar's content
width is 220px or less, rather than forcing a narrow input. With the existing
dashboard spacing, Chromium measured one row at viewport widths
767/390/320/280 and two at 275/260/240, without horizontal overflow. Search was
158px wide at 320px. Search filtering, the count badge and selection entry/exit
passed `projects-mobile-toolbar.js`. Evidence: `mobile-toolbar-320.png` and
`mobile-toolbar-275.png`. Lint and TypeScript passed.
