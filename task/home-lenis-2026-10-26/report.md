# Home smooth scrolling

## Checkpoint commits

- `038d9d5` — docs: refresh generated Next.js agent guidance.
- `93b2c1e` — feat(home): redesign space-themed landing page.

Both commits were created before installing Lenis, as requested. Their hooks
passed formatting/lint and TypeScript. No commits were pushed. Lenis changes
remain in the working tree for review.

## Implementation

- Added `lenis@1.3.27`; the lockfile changes only add this dependency.
- `HomeSmoothScroll` dynamically imports it only on Home when the device has a
  fine pointer, hover, and no reduced-motion preference. A live preference or
  route change destroys the instance and restores native scrolling.
- Wheel interpolation uses lerp 0.14 and Motion's existing frame loop. Window
  scrolling stays native; no transformed content wrapper affects fixed UI.
- CSS disables native smoothing while the Lenis class is mounted, avoiding
  competing interpolators. Touch input remains native (`syncTouch: false`).
- Anchor activation, back-to-top and footer keyboard reveal use one browser-only
  page-scroll adapter. Existing hash history, focus, and modified clicks remain
  owned by the existing anchor handler; Lenis anchor interception is disabled.
- Dialogs/listboxes, text areas/selects and `data-lenis-prevent` regions retain
  native wheel input. Hiding the document or losing focus clears pending inertia
  and suspends the frame callback; returning focus does not resume stale movement.
- Initialization failure retains the original native CSS scroll behavior.

## Verification

- `bun typecheck` passed; final `bun run build` passed all 36 routes, including
  TypeScript and static generation.
- Biome passed all nine changed source/test/package files. `git diff --check`
  passed. The focused Impeccable scan returned no findings.
- The Lenis browser suite passed wheel interpolation across multiple frames,
  anchor hash/focus, footer focus/back-to-top, nested native scrolling, focus
  interruption, route cleanup/Back, live reduced motion, and fresh touch/reduced
  contexts. No page errors.
- The hero browser regression passed with Lenis mounted, including visible stars,
  paused Venom without rendering, uninterrupted opacity across 24 resume frames,
  reduced motion, mobile layout, and CTA navigation. No page errors.
- Production Lenis suite and full Home browser regression passed, including six
  viewport sizes, curtain/focus, touch, image fallback, SSR markup and missing-post
  HTTP 404. The Home test now waits for Lenis to settle before its native test-only
  jump to the footer; interrupting a still-active interpolator caused the initial
  fixture failure. Native CSS smoothness assertions account for Lenis ownership.
- Full Vitest run: 156/157 passed; the Projects route-shell import exceeded the
  15-second test timeout. This also happened before installing Lenis. Running
  that file separately passed all 17/17 both before and after the change. No
  timeout settings or unrelated route tests were changed to conceal the failure.
- `bun audit` reports the same two preexisting high advisories before/after:
  `body-parser@2.3.0` via shadcn tooling and `zod@4.4.3`. No Lenis advisory was
  reported. Unrelated dependency upgrades were left outside this change.

Chromium automation verifies behavior; subjective wheel feel still depends on
the user's mouse/trackpad. No deployment or database operation was performed.

## Self-evaluation

| Axis | Score | Evidence / limit |
| --- | --- | --- |
| Accuracy | 4/5 | Installed package APIs and browser tests confirm behavior; only Chromium was tested. |
| Completeness | 4/5 | Commit checkpoint and scoped Lenis integration are complete; wheel feel awaits user review. |
| Clarity | 4/5 | DESIGN and README describe scope and checks; the adapter remains separate from link semantics. |
| Actionability | 4/5 | `test:browser:home-scroll` reproduces integration checks; Lenis changes remain reviewable. |
| Conciseness | 4/5 | Reuses Motion's clock and native document layout; explicit lifecycle code handles route/preference cleanup. |
