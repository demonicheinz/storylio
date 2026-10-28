# Venom startup optimization — 2026-10-25

The Home CTA keeps a readable, full-size CSS link while its desktop Venom
enhancement prepares. A thin pale-blue rim orbits once every five seconds and
brightens on hover/focus. Its animation stops for reduced motion and pauses
offscreen, hidden, unfocused, or beneath the ready WebGL scene. The first
complete WebGL frame replaces the CSS material over 180ms, with no growth or
delayed-label intro. Returning from scroll/window changes retains the same scene.

## Implementation

- Start preparing a visible eligible CTA from its mount effect, before the first
  IntersectionObserver callback. Keep engine import conditional for fine-pointer,
  motion-enabled clients; keep the real Next link and project font/44px target.
- Cache the two CPU cursor rasters and distance fields per browser module. GPU
  resources remain per scene and are disposed on unmount or a disabling preference.
- Replace the exhaustive distance search with an exact separable squared-distance
  transform. Preserve upstream boundary pixels, Float32 output, 24px cursor units
  and half-pixel edge adjustment. Simulation, materials and cursor artwork remain
  as approved earlier in the Home redesign.
- Share one vertex shader between the three programs. Submit all programs before
  validation and poll `KHR_parallel_shader_compile` completion from animation
  frames. Validate the batch on the first frame when the extension is unavailable.
- Keep the fallback readable after context or shader failure. Cancel a pending
  renderer and release resources if navigation happens before compilation ends.

## Measurements

Three new Chromium contexts per phase, local Windows machine, 1440×1000,
no CPU/network throttling, shared browser/GPU process. These are local synthetic
samples, with no claim about slower devices, cold GPU caches, or real-user p95.

Development profiling before the changes measured 29.2–39.3ms cumulatively inside
shader/program status queries. The initial shader optimization reduced this to
0.0–0.4ms in the development samples; uniform lookup/first drawing can still incur
driver work. No claim is made that all GPU initialization becomes nonblocking.

The production comparison in `venom-startup-metrics.json` isolates the final
distance-field change: both phases already use the shader/cache/intro changes.
The interval from the first 96px cursor mask readback to scene context creation
was 50.6/36.3/44.7ms before and 37.5/30.5/23.5ms after. This interval includes
readback, the second icon, CPU distance preparation and intervening adapter work;
it is not a timer of the pure math function alone. The median fell from 44.7ms
to 30.5ms. Subsequent client mounts reuse these CPU assets entirely.

Whole-page link-to-ready times overlap and vary with hydration and browser load.
They do not establish an end-to-end speedup percentage. The ready attribute also
starts the 180ms crossfade; it does not measure the end of that transition.
The directly verified UX gain is a complete pill and label on the first rendered
frame, with the CSS link visible throughout preparation.

## Verification

- `bun run test tests/public/venom-distance-field.test.ts tests/public/navigation.test.ts`:
  21 tests passed. The seven distance tests compare every Float32 value against
  the upstream exhaustive oracle, including empty/filled masks, a 96px mask, and
  deterministic irregular masks of sizes 1–24.
- TypeScript and Biome passed for the eight touched source/test files.
- `bun run build`: all 36 routes generated with Cache Components and Partial
  Prefetching still enabled. Rebuilt after the distance transform change.
- Final production Venom suite passed 11 scenarios with zero page errors:
  first-frame dimensions/label, live material, client navigation/cache reuse,
  keyboard/reduced motion, scroll/focus/visibility pause, context loss, pending
  shaders with navigation during preparation, no parallel extension, invalid
  shaders/resource disposal, no WebGL, and touch.
- The production Home suite passed six viewport sizes (320–1440px), smooth and
  reduced-motion anchors, footer behavior, navigation, missing-post 404, and touch.
  This run preceded the final pure distance transform change; the rebuilt final
  implementation was covered by the distance tests and full Venom browser suite.
- `git diff --check` passed; Git reports the existing README CRLF normalization
  notice. No dependencies or database changes were needed.
- Inspected desktop fallback/ready and mobile screenshots under `.playwright-cli/`.
  Text remains visible, focus is outlined, touch target stays 44px, and the thin
  rim follows the approved planet palette. Browser coverage is Chromium only.

## Review

| Axis | Score | Evidence / remaining limit |
|---|---|---|
| Accuracy | 4/5 | Exact Float32 oracle and runtime checks; local timing is noisy and GPU caches are shared. |
| Completeness | 4/5 | Startup, fallback rim and lifecycle verified; no Safari or physical mobile device run. |
| Clarity | 4/5 | Design and renderer docs updated; numerical distance code still requires familiarity with the transform. |
| Actionability | 5/5 | Source implemented, build and checks pass, no pending approval or integration step. |
| Conciseness | 4/5 | Adapter stays small; renderer/cache changes need a focused report and regression cases. |

Overall: 4.2/5. Next useful evidence would be a Safari/device run and deployed
measurements with controlled network/CPU conditions. These are follow-up coverage,
not a claim that this local task has measured production user performance.
No commit or push performed.
