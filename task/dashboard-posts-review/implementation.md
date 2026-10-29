# Dashboard Posts improvements

Implemented 29 October 2026 after the independent assessment. The assessment
records the starting state; this file records the resulting implementation.
Changes remain uncommitted for owner review.

## Publication and saved-state contract

- Batch Publish locks the selected rows and validates each candidate draft using
  the publication schema and MDX safety validator before writing anything.
  Missing IDs and invalid/empty/unsafe content abort the batch with actionable
  feedback. Future scheduled records are not republished early by this action.
- Form/actions support explicit `publicationIntent`: keep, schedule, now.
  Existing date inputs retain legacy behavior. Schedule requires a valid date
  when publishing; now uses current time; draft has no active publication date.
- Create/manual/autosave responses include actual persisted `publishedAt`.
  Content autosave still preserves stored publication fields, and the form's
  saved baseline reflects those persisted fields rather than the uncommitted
  schedule selection. New content/date edits made while saving are retained.
- The editor distinguishes saved Draft/Scheduled/Published, shows pending date
  changes and timezone, and offers explicit Schedule, Save schedule and Publish
  now actions. Schedule-only edits do not trigger redundant content autosaves.
- Save draft does not activate a schedule. An inactive planned date remains
  dirty with explanatory copy, and an explicitly saved draft's plan is kept in
  session storage so the first-save redirect can restore it. This is local plan
  recovery, not a persisted database schedule on drafts. Withdraw to draft clears
  an existing publication date and its saved baseline.
- Save draft is the primary draft action. Dirty reload/link navigation uses the
  shared guard. Preview saved is disabled before the first record and uses only
  the last successfully saved slug. Live content autosave behavior is disclosed.

## Editor, Notes and manager layout

- Identity/title/excerpt and content type/tags precede the writing area. Only
  save/status actions remain sticky; the page introduction scrolls normally.
  Content and optional cover sections use the wider layout, following Projects.
- Article/Note selection toggles only the exact `notes` tag while retaining
  other tags. The helper describes public placement and optional cover behavior.
- Authenticated saved Notes preview uses the same `NoteReadingBody` component
  and dialog styling as public Notes. The existing authorization gate remains
  ahead of private lookup. Preview does not track views or expose a public share
  link. Public Notes keep their existing permalinks, history, body anchors,
  view counter and reading flow; no content/model migration was introduced.
- List titles link to Edit outside batch mode. Headers/rows share grid tracks
  with cell padding. Grid cards use 12px radii and opaque status badges below
  photography; Scheduled adds a clock icon. Updated date/time have separate
  non-wrapping lines. Mobile selection never navigates from the title.
- Search/Status select/Tags multi-select/Sort align with 44px controls. Labels
  sit above controls. Mobile search and icon buttons share the same responsive
  container toolbar as Projects, now extracted to shared CSS. Mobile tag search
  uses the same multi-select; selected summaries say tags rather than technologies.
- Active filter count, result count and Clear filters/search stay visible.
  Drawer Reset remains staged until Apply. Empty-library and no-match states
  have distinct recovery text. Selection includes out-of-page scope, visible-page
  toggling, affected titles before delete and explicit withdrawal confirmation.
- Mobile pagination is Previous / Page X of Y / Next; desktop uses bounded page
  numbers/ellipses. A shared advancing publication clock refreshes Scheduled
  filters/counts near due times and reconciles after returning to the tab.

## Shared date-time picker

The custom body portal and position calculation were replaced by an installed
Base UI Popover with collision flip/shift and focus management. The UTC ISO
value/onChange contract stays compatible. The trigger names/describes its popup,
dates use full accessible names, calendar selection uses grid state and roving
focus, and keyboard arrows/Home/End/PageUp/PageDown navigate dates. Hour and
minute use labelled selects, with explicit timezone/UTC guidance. Escape/Done
return focus to the trigger. The scrollable panel stays within viewport bounds;
control/panel radii follow 8px/12px recipes.

## Verification

- PGlite publication tests: readiness, authentication, atomic batch rejection,
  schedule/now/keep, draft clearing and autosave returning the actual date.
- Pure form reconciliation tests: pending schedule remains dirty; inactive draft
  plan; withdrawal cancellation; newer edits survive a saved snapshot.
- Browser suites passed against the actual components with mocked writes at
  1440/1024/768/390/320/275px. Scheduling tests exercised actual elapsed clock
  transitions, manual commits, inactive plans, named picker controls, viewport
  collision, Escape and focus return. No remote CMS writes/uploads occurred.
- Full lint and TypeScript passed. Managed development build passed through all
  38 generated pages on retry. Initial build compiled/typechecked but failed
  during Home prerender with a database ECONNRESET; the retry succeeded without
  changing environment or query behavior.
- Final complete Vitest run: **67 files / 429 tests passed**, including the
  additional form reconciliation regressions.
- Evidence: `updated-list-*`, `updated-editor-*`, `updated-picker-*` screenshots
  in this directory. The fixture instructions are in
  `tests/fixtures/dashboard-posts/README.md`.

## Practical limits

The existing public cache/revalidation strategy is preserved; scheduling is not
a newly introduced exact-second background publishing guarantee. The manager's
display updates at due time, and public readers continue enforcing due dates.
Dirty-state protection covers reload and ordinary links; SPA Back/Forward draft
recovery is not claimed. Local session storage can be unavailable, so first-save
planned-date recovery is best effort and helper copy remains explicit. Browser
fixture writes do not replace the PGlite action tests or an authenticated
production end-to-end test.

## Self-evaluation

| Axis | Score | Evidence / remaining limitation |
| --- | --- | --- |
| Accuracy | 4/5 | Persistence tests and actual component browser checks agree; no production writes were exercised. |
| Completeness | 4/5 | Publication, scheduling, Notes and responsive layout addressed; exact-time public invalidation is intentionally unchanged. |
| Clarity | 4/5 | Saved state and pending intent are distinct; draft-date local recovery requires explanatory copy. |
| Actionability | 5/5 | Implemented result includes reproducible fixtures, tests and screenshots. |
| Conciseness | 4/5 | Reused controls/reader/toolbar; existing manager/editor remain substantial modules. |

Overall 4.2/5. A later authenticated smoke and an explicit scheduling precision
requirement would extend confidence beyond the tested scope.
