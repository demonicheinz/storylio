# Dashboard foundations and management pages

Implements task/dashboard-review/components-and-pages.md on feat/dashboard-redesign.
Existing authentication changes remain in the working tree. No commit, push,
external migration, authored-content edit, or live CMS write was performed.

## Delivered

- Owned shadcn components now carry the actual visual defaults: 8px controls,
  12px Cards/popups, opaque surfaces, coherent focus/invalid/disabled states.
  Removed dashboard-shell descendant overrides. Portal controls follow the same
  defaults. Added official Base UI shadcn Select and Toggle/ToggleGroup, corrected
  generated utility imports, and removed the unnecessary generated cn dependency.
  Existing auth QR dependency and all auth implementation were preserved.
- Overview exposes one New menu (Post, Project, Gallery item). Management pages
  retain their own direct creation actions with visible mobile labels.
- Shared summaries replace colored metric cards in the management pages. Filters
  use segmented status/visibility, Select for single values and existing searchable
  multiselect for tags/stack. List rows use readable operational typography,
  neutral drafts, and Article/Note/Scheduled distinctions. Dates prioritize Updated.
- Native URL filter updates now pass null to history.replaceState. Passing Next's
  internal state bypassed its synchronization wrapper, changing the URL without
  rerendering useSearchParams consumers. Browser tests cover interactive filters,
  preservation of the fixture view parameter, and complete reorder mode.
- Post/Project autosave preserves database publication status (and post date),
  retains edits made during requests, serializes manual save/publish with autosave,
  and recovers after failures. Published edits continue to update the live record;
  no revision system was introduced. Cross-tab editing remains last-write-wins.
  Sticky actions expose save state and explicit confirmed move-to-draft. Validation
  uses the requested save status without changing the displayed saved status early,
  allowing a cleared published body to be saved privately as a draft.
- Projects/Gallery have explicit full-collection reorder modes. Gallery's server
  action locks membership during its transaction and rejects subsets, duplicates,
  stale membership and non-contiguous positions, while accepting a complete valid
  permutation regardless of input array order. No real reorder was executed.
- Home has a working headline-only editor, linked bio ownership, actual public
  section ownership and clearly stored legacy testimonials. Existing data stays.
  About exposes translation completeness and inline errors and appropriate date
  controls. Settings has profile save/discard feedback and a security summary
  from actual session/passkey data. Media has compact upload/selection controls
  and explicitly single-image uploads. Analytics separates lifetime/30-day UTC
  metrics, links rankings, and minimizes unavailable optional Umami UI.
- Proper DrawerTrigger composition and explicit final focus fix filter opener
  restoration; shared controls own touch dimensions rather than ancestor selectors.

## Verification evidence

- Full Vitest run: 55 files, 328 tests passed. Includes 8 autosave action tests,
  8 Gallery reorder tests and 4 new headline checks in the existing Home tests.
  Focused final regression run: 5 files, 33 tests passed after the validation fix.
- Final consolidated TypeScript passed after stale dev fixture types were archived.
  A dummy-database build compiled and passed TypeScript, but public prerendering
  required the data source. Build was then retried using the project's Infisical
  dev environment, with reporting/uploads off; final outcome is recorded below.
  That build passed: all 38 routes generated, no temporary fixture routes included.
- Biome passed after formatting the generated components and report JSON.
  git diff --check passed. No new runtime dependency belongs to this dashboard work.
- Browser dashboard-system: 40 page/viewport combinations passed, with no page,
  hydration, aria-hidden or Next uncached/runtime errors. Real components with
  clearly labeled example data at 1440, 768, 390 and 320px. Covers Overview, Posts,
  Projects, Gallery, Media, Home, About, Settings and both creation editors.
  Checks no overflow, one visible H1, mobile row targets, New/menu dismissal,
  filter drawer focus restoration, profile discard, invalid border precedence,
  and keyboard tab navigation. Popup measured 12px and opaque.
- Browser dashboard-overview: 6 sizes including 1024 and 844x390; URL deep links,
  sidebar preference, tablet rail, menus and note permalink all passed.
- Browser dashboard-filters: interactive status/tag selection, complete Projects
  and Gallery reorder modes, and reduced-motion menu behavior passed. This test
  caught the history synchronization bug that initial-URL-only checks missed.
- Browser editor-autosave uses the real editors and RHF/Base UI with fake deferred
  actions and MDX/upload substitutes. Tests pass for both editors: repeated timers,
  typing while saving, serialized publishing, thrown/action failures, confirmation,
  empty-body unpublish, and responsive sticky headers. The empty-body regression
  failed before the status-aware validation fix and passed afterward.
- Auth recovery/MFA browser suite passed at 4 sizes after shared component edits:
  recovery, reset, challenge, setup, backup codes, disable, reduced motion. Auth
  responses and QR data are fixtures; no real credential or email was used.
- One mechanical detector run: 3 advisory type-ramp findings (30px, 24px,
  1.875rem). Earlier review had 28 findings, mostly 10/11px text. Remaining values
  are intentional dashboard roles awaiting DESIGN.md visual approval; no blanket
  accessibility pass is claimed. detector.json records the scan before final
  behavior/layout-only follow-ups; it was not rerun to chase its score.
- Initial browser pass used Playwright's caret-hiding screenshot mutation before
  hydration and raced a pre-hydration click. Final checks preserve the caret and
  wait for network idle; final component runs report zero such errors. Expected
  dev/LCP and image fixture warnings are not counted as a clean-console claim.

## Preview and limits

Screenshots here contain example data, not the owner's CMS data. posts-1440.png,
posts-390.png, projects-1440.png and the other captures show actual components.
The Next dev badge may appear. Analytics was source-reviewed and compiled rather
than run against live Umami; full live content/auth actions were not executed.

Temporary dashboard-overview-fixture-check and auth-security-fixture-check routes
were removed. QA browsers dashboard-system and dashboard-editors were closed.
Task-only servers 3107 and 3197 were stopped; user server/tabs were retained.
Generated .next/dev/types still referenced deleted fixture routes and initially
failed typecheck/build; those stale types were moved reversibly to
.tmp/dashboard-system/dev-types-archive before retrying. Do not restore served
fixture routes to silence generated-type errors.

DESIGN.md is unchanged pending visual acceptance. The separately pending auth
migration remains required before deploying the combined working tree; see
docs/AUTH_RECOVERY.md. No database migration was executed by this task.

## Self-evaluation

| Axis | Score | Evidence / limit |
| --- | --- | --- |
| Accuracy | 4/5 | SQL and browser regressions support behavior; live owner writes and live Umami untested. |
| Completeness | 4/5 | All requested surfaces and shared components addressed; native third-party MDX controls retain their own wrapper styling. |
| Clarity | 4/5 | Shared visual ownership and explicit save/reorder flow; broad change needs this archive. |
| Actionability | 4/5 | Reviewable screenshots/tests; visual acceptance and separate auth rollout remain. |
| Conciseness | 4/5 | Evidence archived; user-facing close can remain brief. |
