# Dashboard Home responsive polish and testimonial retirement

Implements task/dashboard-home-review/assessment.md. No commit/push, real CMS
mutation, database migration application, Cloudinary deletion, user-server stop
or credential change was performed. Existing uncommitted TechnologyLogo helper
and its public consumer were incorporated, not overwritten with a separate logo
map. Its public caller needed the updated label/imageUrl props to compile.

## Final behavior

- Three active tabs: Hero, Approach, Tech stack. No legacy counts or testimonial
  editor. Header includes Preview Home; related editor links are discoverable.
- Container-query layout changes according to panel width. Mobile logos have a
  visual/action header and full-width name/status below; wide panels use compact
  rows. The full-height drag rail and Created-date clutter are removed from Home.
  Panel padding is 16px narrow / 24px wide, preview radius 8px and menu targets 44px.
  Names like TypeScript/PostgreSQL remain one line even at 320px; longer custom
  names wrap naturally. No smaller-font workaround or horizontal scroll.
- Shared TechnologyLogo resolves uploaded/built-in/fallback images for dashboard
  and public Home, with original image proportions and error fallback preserved.
  Removed the unused public ClientsSection/InfiniteCards testimonial renderer
  after importer checks; HomeLogo moved to a small type module.
- Hero textarea grows with content, shows 160-character count and subheadline
  preview, and retains its draft across tab switches. Pending/failed saves keep
  changes. Discard is confirmed. Scoped, bounded and schema-validated session
  drafts recover Hero and section edits after browser Back/Forward; successful
  save/discard clears them. Changed saved bases invalidate stale drafts. Blocked
  storage never prevents editing; no authentication secret is stored.
- Home dialogs separate scrolling body from stable Save/Cancel footer. Errors
  associate with fields and focus the first invalid field. Dirty dismissal is
  confirmed. Edit/delete dialogs live outside menu popups so an ancestor menu
  cannot unmount them; synchronous pending locks also prevent close races.
- Reorder is explicit, with named compact handles/announcements, Move up/down,
  Saving/Saved, rollback and retry. Shared sortable now supports awaiting a
  boolean result and reverts optimistic changes on failure. Existing callback
  API remains compatible. Server checks the complete PHASE or LOGO group,
  excludes HERO, enforces authorization and writes normalized order atomically.
- Upload is a keyboard-reachable native button; removal has an accessible name.
  Built-in logo preview is shown without demanding an uploaded image. Replacement
  upload/URL methods are grouped as alternatives to one chosen image.

## Retirement and rollout

The active Testimonial model, queries, actions, validators, seed/menu option,
analytics count and Media avatar usage check were retired. README/PRODUCT/cache/
Drizzle guidance records the removal. Historical baseline, SQL, snapshots and
previous journal entries remain intact. The new migration is exactly:

```sql
DROP TABLE "Testimonial";
```

0004_retire_testimonials.sql and its new snapshot/journal entry are prepared,
not applied to dev/staging/prod. The table and real stored rows remain until an
authorized rollout. Deploy the no-consumer application first, review/backup rows,
then apply the drop in the intended environment. No CASCADE and no asset deletion.
Detailed migration evidence: task/testimonial-retirement/backend-report.md and
docs/DRIZZLE_MIGRATION.md#testimonial-retirement.

## Verification

- Full Vitest: 60 files / 382 tests passed. Includes 29 draft-cache cases,
  authenticated/full-group/rollback Home actions, retirement dependency failure,
  historical hashes, data/catalog preservation and existing auth/dashboard tests.
- Lint, TypeScript, git diff --check and Drizzle db:check passed.
- Production Next build passed all 38 routes using the existing Infisical dev
  data source with Sentry reporting and source-map upload disabled. No schema
  migration or server action ran as part of QA/build.
- Browser: 21 tab/viewport combinations (320,360,390,768,1024,1440 and844x390)
  passed. Assertions cover actual word line-height, not only no overflow, plus
  44px mobile targets, five built-in previews, stable footer, dirty cancellation,
  pending Escape, keyboard file chooser, failure retention, retry, named keyboard
  drag rollback and Hero/section restoration through SPA Back/Forward. No page
  errors. Real network upload/save routes are not used.
- A first targeted test exposed menu-parent unmounting during a pending save;
  dialogs were moved outside the popup and the regression now passes. Keyboard
  drag tests wait for the sensor's pressed state before moving, rather than
  assuming the activation and layout update are synchronous.
- One mechanical detector run on Home route/component and touched shared markup:
  [] findings. This is not a blanket WCAG or real-device certification.
- Screenshots here use example data. The fixture uses real CSS Modules and local
  fonts, but substitutes Next image/navigation boundaries. Current public Home
  caller is also TypeScript/build verified. Live writes, a physical screen reader
  and mobile virtual keyboards were not exercised.

## Cleanup and scope

QA browser home-polish and task-only port3199 server stopped. No served Next
fixture route was added, and the user's dev process/tabs were retained. Legacy
Prisma-generated/archived history was not removed. Source documentation changes
record retirement; a broad design-system rewrite or new animation was not added.

## Self-evaluation

| Axis | Score | Evidence / limit |
| --- | ---: | --- |
| Accuracy | 4/5 | SQL preservation and browser regressions; external migration intentionally unapplied. |
| Completeness | 4/5 | Requested layout/workflow/retirement covered; physical keyboard/reader QA remains. |
| Clarity | 4/5 | Explicit save/reorder states and single logo resolver; rollout needs separate DB action. |
| Actionability | 4/5 | Reviewable UI, tests and migration; user visual acceptance and DB rollout remain. |
| Conciseness | 4/5 | Evidence archived here; final close should focus on results and migration state. |
