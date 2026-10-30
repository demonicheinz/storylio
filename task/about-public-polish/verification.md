# About and public scrolling verification

Verified 2026-10-26 on the local production build at port 3101.

## Delivered

- About: two columns, 224px desktop / 192px tablet sidebar, sticky from 768px at 112px, native sidebar overflow on short screens, subtle experience/education timelines, CMS skills, vertical principles, 64px / 48px section spacing.
- Mobile: CMS avatar (Live Orb fallback), location, spoken languages, name, role and socials centered; 96px avatar; language selector and body left aligned. Desktop/tablet avatar is 144px.
- Public Lenis: mounted only in `(public)/layout.tsx`, shared Motion clock, lerp 0.14, native touch/reduced motion, blur/focus inertia cancellation.
- Shared anchor handling preserves hash/query, keyboard focus and CSS offsets; layout coordinates avoid offsets from entrance transforms.
- Lightbox locks last through the closing transition and support overlapping locks/deferred Lenis registration.
- Back/Forward cancels pending inertia and suppresses entrance translations while history is restored. Normal link navigation restores normal entrance behavior. Native browser history restoration remains enabled.
- Home, navbar and footer were not redesigned. Gravity Stars and DESIGN.md changes remain deferred.

## Checks

- `bun run lint`: passed, 356 files.
- `bun run typecheck`: passed; final production build also passed TypeScript.
- `bun run build`: passed, all 36 generated pages.
- `bun run test`: 22 files / 162 tests passed. An earlier run hit import-time timeouts in two route-shell tests; isolated rerun and complete rerun passed.
- `git diff --check`: passed.
- Playwright CLI, sequential isolated checks against production:
  - `tests/browser/about-polish.js`: 1440, 1024, 768, 390, 320px; sticky offset, mobile alignment, avatar sizes, short tablet overflow, keyboard anchor, no horizontal overflow.
  - `tests/browser/public-smooth-scroll.js`: About, Projects, Blog, Gallery and detail routes; TOC focus/112px offset; project/gallery lightbox; native sidebar at 1024x600; Back/Forward; excluded route checks.
  - `tests/browser/home-smooth-scroll.js`: wheel interpolation, anchor/footer focus, native nested scrolling, blur/focus, live reduced motion, fresh touch/reduced-motion contexts, route navigation.
  - `tests/browser/about-language.js`: 36–51ms switches under injected 800ms RSC delay, no new navigation requests, preserved scroll.
  - `tests/browser/filter-prefetch.js`: project/blog hover and keyboard prefetch, filter reset, query and scroll preservation.
  - `tests/browser/public-redesign.js`: shared layout, detail content, gallery filters/lightbox, reduced motion, empty filters, cold missing routes return HTTP 404.
- Browser suites reported no page errors.

## Screenshots

- [Desktop 1440px](about-desktop.png)
- [Mobile 390px](about-mobile.png)

## Limits and existing findings

- Dashboard and preview browser requests were unauthenticated and redirected to sign-in. Their layout source does not mount PublicSmoothScroll; authenticated interaction was not exercised.
- Existing CMS content renders an empty bullet under “What I Value”; database content was not modified.
- `bun audit` identified existing high-severity advisories in body-parser and zod. This task did not change dependencies.
- Visual approval is still the user's decision; DESIGN.md is unchanged.

## Self-evaluation

| Axis | Score | Evidence / next improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Build, 162 tests and browser suites pass; authenticated dashboard/preview sessions remain untested. |
| Completeness | 4/5 | Requested layout, scrolling, two-commit delivery and screenshots covered; user visual approval remains pending. |
| Clarity | 4/5 | Results and limitations are separated; screenshots support review, but CMS's empty values section still distracts. |
| Actionability | 5/5 | Changes and reusable browser checks are local and reviewable; no push. |
| Conciseness | 4/5 | Final handoff can remain short; detailed evidence is kept here. |

Overall: 4.2/5. Next useful checks: review the screenshots, fill the CMS values content, and verify authenticated dashboard/preview if a session is available. The user may judge the visual result differently from the automated checks.
