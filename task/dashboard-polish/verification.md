# Dashboard Overview and shared shell polish

Branch: feat/dashboard-redesign. Implements the accepted critique in
task/dashboard-review/critique.md. Existing uncommitted authentication work is
preserved. No commit, push, migration, content write, or real sign-in performed.

## Final changes

- Dashboard-only CSS scopes Card to a 12px border radius and opaque surface,
  controls to 8px, and operational page headings to 30px/600. Shared dashboard
  recipes remove translucent nested surfaces and excessive rounding. Public/auth
  component defaults and global tokens are unchanged.
- The shell uses a plain sticky toolbar and native content flow without the
  public RouteMotion entrance. Tablet defaults to a 64px rail, desktop to an
  expanded sidebar, and mobile retains its drawer. Explicit sidebar choice is
  saved locally, survives navigation/reload and wins over resize defaults.
  Current page links expose aria-current. Touch controls use a 44px minimum.
- Overview has one quiet metrics strip, restrained creation actions, real H2s,
  Satoshi operational text and tabular numerals. Recent lists use separators,
  readable two-line titles, wrapping metadata of at least 12px, a text status
  below the title and 44px context-menu triggers. Coverless notes remain valid.
- Work in progress treats draft/hidden counts as neutral. On your site counts
  published featured projects and visible photos. Removed misleading testimonial
  and missing-cover indicators. Writing differentiates Article/Note; note preview
  opens the existing dialog permalink. Scheduled posts do not receive a public
  preview or inflate published counts. View totals are labeled all-time.
- Overview SQL uses three aggregate queries plus two bounded recent-item queries
  rather than many separate count/sum calls. Real local SQL tests cover empty
  counts, note tags, publication timing and featured visibility.
- Draft/featured/visibility links now connect to Posts, Projects and Gallery
  filters through a shared query hook. Native history updates preserve unrelated
  parameters without re-fetching all records. Existing search/sort/edit/reorder
  functionality remains. Full redesigns of those list/editor screens are separate
  follow-up passes; they inherit the accepted shell/control recipes now.
- The streaming fallback covers metrics, both recent lists and the lower panels.
  Reduced-motion users do not receive dashboard skeleton animation.

## Verification

- Full Vitest suite: 53 files / 312 tests passed.
- TypeScript passed after removing the temporary fixture route. Lint passed;
  whitespace check passed. Production build passed with 38 routes, no fixture
  route and Sentry reporting/source-map uploads explicitly disabled.
- Impeccable detector executed once for edited overview/shell markup: [] findings.
- Browser verification used the actual Overview/manager/layout components with
  visibly labeled example data and intercepted session responses. The user's
  port 3000 app is next start from an earlier build, so a separate dummy-env dev
  server on 3107 was used instead of changing or stopping their server.
- Checks passed at 1440x1000, 1024x900, 768x1024, 390x844, 320x740 and 844x390:
  no horizontal overflow, 30px page heading, real section H2s, 12px metadata,
  44x44px row actions, tablet rail/desktop expansion and mobile drawer behavior.
- More and row menus work and dismiss with Escape. A Note's View on site link
  uses the notes dialog permalink. Draft writing, published featured projects
  and hidden gallery deep-links show only their matching records. A manual
  sidebar expansion survives reload at tablet width.
- Final browser run recorded zero page errors, hydration errors or Next runtime/
  uncached data warnings. An initial fixture placed searchParams outside Suspense;
  this was corrected in the fixture itself. A timing-sensitive sidebar test now
  waits for responsive collapse before clicking; no arbitrary timeout added.
- Screenshots inspected together: overview-1440.png, overview-768.png,
  overview-390.png. They contain clearly labeled example data, not live CMS data.
- Canvas-resolved token contrast ratios in the dark theme: body/background 19.53,
  muted text/surface 7.89, Published/surface 9.35, primary foreground/background
  5.48. These sampled pairs exceed 4.5; this is not an audit of every editor state.
- bun audit --audit-level=moderate passed (1032 packages). One previously reported
  low deepmerge advisory remains without a published fix.

## Reproduce and rollout

The durable fixture is tests/fixtures/dashboard-overview/page.tsx. For a local
isolated preview, temporarily copy it to
src/app/dashboard-overview-fixture-check/page.tsx, start Next with dummy auth/DB
environment, open an isolated Playwright CLI session and run
tests/browser/dashboard-overview.js. Remove the temporary served fixture before
building. This task removed it, stopped only its preview process, closed its CLI
browser and CUA review tab, and reset the Brave viewport override. Original user
tabs/server were retained. Stale generated dev route types were reversibly moved
into ignored .tmp/dashboard-polish/stale-dev-types before final build.

DESIGN.md remains unchanged pending visual approval. No new migration belongs
to this dashboard polish. The separate pending auth migration 0003 still needs
to be applied before deploying the combined working tree, as documented in
docs/AUTH_RECOVERY.md. A running next start process must restart to use this build.

## Self-evaluation

Accuracy 4/5: real SQL, source and browser component evidence; live authenticated
new-build Dashboard was not exercised because external auth migration is pending.
Completeness 4/5: accepted Overview/shell critique addressed; full editor/list
redesign intentionally needs a separate page-specific review.
Clarity 4/5: scoped recipes and honest content rules; requires rollout note for
the combined auth work. Actionability 4/5: build, screenshots and tests ready;
not committed or deployed. Conciseness 4/5: details archived here, brief user close.
Average 4.0/5. User agreement likely with preview-data and scope limits explicit.
Next improvements: owner visual approval, apply the separately reviewed auth
migration when authorized, and review individual list/editor screens.
