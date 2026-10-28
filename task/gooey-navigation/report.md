# Public GooeyNav integration

Date: October 25, 2026

The existing `FloatingNav` API and `PublicChrome` wiring are preserved.
`FloatingNav` now renders the supplied GooeyNav component with the existing
five destinations and icons. Its outer wrapper retains scroll hide/reveal and
keeps keyboard-focused navigation visible.

## Behavior

- Navy surface frame, pale active pill with navy text, and a blue particle tint.
  Light mode reverses the pill/text pairing. Existing fonts are inherited.
- Restrained transition: 7 particles, 400ms travel, 100ms variance, 24px spread,
  gooeyness 0.3, and wobble 0.2. The animation loop stops when settled.
- Next.js `Link` retains client navigation and `prefetch={true}`. Modified clicks
  do not change selection. The URL controls active state, including section
  detail pages, Back/Forward, refresh, and known preview routes. Unknown routes
  do not incorrectly mark Home active.
- Mobile uses icon-only presentation with explicit accessible names. Desktop
  also shows labels. Targets meet the 44px minimum.
- WebGL2 shader failures, unavailable contexts, and context loss switch to a
  static active pill. Restored contexts rebuild the renderer.
- Reduced motion avoids the canvas renderer and particle transitions. A live
  `matchMedia` subscription responds to preference changes without a reload.

The installed Motion hook snapshots the initial reduced-motion value despite
its documentation describing live updates. A shared `useSyncExternalStore` hook
was added for the wrapper and GooeyNav; browser verification covers live changes.

## Verification

- Vitest: 12 files and 82 tests passed, including 14 navigation regressions.
  After the reduced-motion hook change, those 14 regressions were rerun and passed.
- TypeScript, targeted Biome, and whitespace checks passed.
- Chromium on the real local Next.js app verified all five navbar destinations
  without document reloads, route-derived active state, Back/Forward, a project
  detail route, and refresh.
- Desktop width 1440px: navbar width about 509px, links at least 44px high.
- Widths 390px and 320px: navbar width about 268px; all five targets about
  48px wide by 44px high, entirely within the viewport. A focused 320px check
  also confirmed the shader canvas does not create document horizontal overflow.
- Light/dark switching, live reduced motion, visible keyboard focus, scroll
  hide/reveal, context loss/restoration, and disabled-WebGL fallback passed.
- No page JavaScript exceptions were recorded in the passing browser run.

Browser artifacts are in `.tmp/gooey-navigation/`. The repeatable CLI check is
`bun run test:browser:gooey-nav` after opening the documented fresh session.
It uses the published `/projects/storylio` fixture for detail-route assertions.

The current dev app reports existing instant-navigation validation diagnostics
for full prefetches of dynamic routes. Full prefetch is the previous navbar's
policy and was preserved in this initial integration. A subsequent fix removes
the forced full prefetch; see `task/prefetch-streaming/report.md`. The production-only cache-reuse suite was not asserted
against this dev server. Existing hero/body light-theme colors and unrelated
image LCP notices are outside this navbar change.

The design detector flags retained generic widget preset colors and misreads the
arbitrary `font-family:inherit` utility as a font name. The public wrapper supplies
the documented palette and the component inherits the site's existing font;
no additional font was introduced.

No package dependencies were added. Existing dependency-audit findings from the
previous task are not remediated by this UI change. Changes are not committed
or pushed.

## Self-review

| Axis | Score | Evidence / improvement |
| --- | --- | --- |
| Accuracy | 5/5 | Route tests and real browser transitions/fallbacks passed. |
| Completeness | 4/5 | Navigation and requested variants are covered; production cache-reuse validation remains separate. |
| Clarity | 5/5 | Existing wrapper owns placement, route state, and palette; GooeyNav owns rendering. |
| Actionability | 5/5 | Integrated in the live public chrome with a repeatable browser command. |
| Conciseness | 4/5 | Reuses the supplied shader engine; its text-mask trace remains complex. |

Overall: 4.6/5. Follow-ups, if needed, are production-mode cache validation and
profiling the supplied mask trace on physical low-end mobile hardware.
