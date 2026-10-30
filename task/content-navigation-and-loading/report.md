# Content navigation and loading fixes

Branch: `fix/content-navigation-and-loading`.

## Changes

- New Post and New Project key their editor by the installed Next.js 16.4.2
  router's `bfcacheId`. Fresh Link/push navigation remounts form state; history
  restoration retains it. Existing edit routes, autosave, and publication logic
  are unchanged.
- Public Blog cards always reserve a 16:9 cover area. The existing unavailable
  cover fallback handles missing images; its absolutely positioned contents
  cannot stretch narrow cards. Home Notes remain text-only.
- Projects and Blog have distinct route/suspense skeletons using their actual
  hero, toolbar, collection, card, and reading-layout CSS. Detail shells include
  facts/metadata, wide cover, and responsive TOC. Gallery uses varied-height
  masonry placeholders with matching container breakpoints. Loading remains a
  single accessible status with decorative content hidden and no animation.

## Evidence

Before the change, `tests/browser/content-navigation.js` failed with
`posts: fresh navigation retained the previous draft`. The placeholder and
route-loading tests also failed before implementation.

Afterward Chromium passed fresh creation, simulated history draft restoration,
failed-save retention, and another create after save for both real editors.
Five skeleton variants passed 320/390/768/1440px overflow and column checks;
missing Blog covers retained 16:9 at all four sizes. Desktop/mobile PNGs are
stored beside this report. The fixture models the documented router contract
with React Activity; it does not exercise Next.js's real browser history or
write CMS data. Rich MDX, image delivery, auth and server actions are stubbed.

Build with dev Infisical environment: passed (38 pages). Bare hosted build
without injected environment predictably failed during database/auth
prerendering; no auth checks or environment safeguards were weakened.
Typecheck: passed. Lint and diff whitespace check: passed.
Focused regression run: 29 tests passed; separate real BlogCover test: passed.
Full Vitest results are recorded after the complete run below.

## Review

Correctness: reset is scoped to creation pages, not record editors or global
navigation. Error responses retain form content. No cache, 404, authorization,
or database changes.
Accessibility: skeletons expose one loading status, no fake interactive controls.
Performance: reuses existing CSS and dependencies; no new fetches or packages.

## Self-evaluation

| Axis | Score | Evidence / remaining improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Installed docs, runtime fixture and build agree; real Next history is modeled. |
| Completeness | 4/5 | All three issues addressed; live authenticated navigation still merits manual smoke. |
| Clarity | 4/5 | Causes and limits documented; fixture setup spans server and CLI commands. |
| Actionability | 4/5 | Reproducible scripts and screenshots; fixture needs a running local server. |
| Conciseness | 4/5 | Narrow product diff; shared skeleton supports several distinct layouts. |

Overall: 4.0/5. Highest-value follow-up: authenticated browser smoke on the
actual Next server, without publishing or modifying real content.

## Final verification

- `bun run test --reporter=verbose --maxWorkers=1`: **89 files / 677 tests passed**,
  241.24 seconds. Earlier two-worker runs stalled without a completed report
  and were stopped; the successful complete result is the serial run.
- `bun run typecheck`: passed.
- `bun run lint`: passed (828 files checked).
- `bun run build` with dev Infisical environment: passed.
- Chromium: both editor scenarios passed; 20 responsive skeleton combinations
  and four cover aspect-ratio checks passed.
- `git diff --check`: passed.

No commits or pushes were performed. The task's fixture server and browser
session were closed after verification.
