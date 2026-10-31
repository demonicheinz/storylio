# GooeyNav / Live Orb lifecycle audit

User approved auditing/hardening lifecycle while retaining visuals, including
context loss/restoration, pause/resume, reduced motion and fallback.

## Scope and acceptance

- Preserve shaders, colors, geometry and ordinary foreground animation.
- Failed partial setup releases allocated shaders/programs/buffers and retains
  usable CSS/native control fallback.
- Hidden, blurred or offscreen engines stop continuous frames; resuming does not
  replay an intro, duplicate a loop or jump by time spent paused.
- Context loss stops GL work and shows fallback. Restore rebuilds resources and
  respects current activity/motion settings.
- Destroy cancels frames, disconnects observers, removes listeners and makes late
  callbacks/options updates harmless. React StrictMode replay remains reusable.
- Validate pure resource failure cases with mocks, real GPU state transitions in
  an isolated browser fixture, and foreground visual equivalence where practical.

Initial source review: Orb init failure paths return without a shared cleanup and
do not check buffer allocation; its loop checks visibility but not window focus.
Nav already cleans partial pipeline builds and supports context loss, but does
not gate its animation loop by visibility/focus or on-screen state. These are
audit hypotheses until reproduced. No production CMS data is involved.

## Reproduced and fixed

- Four allocation tests failed before the fix: partial shader/program/link failure
  retained GL resources, and failed buffer allocation was incorrectly reported
  ready. A shared release/forget path now handles failure and destroy; buffer
  allocation is checked. Failed restoration also releases partial rebuilt state.
- Four lifecycle tests reproduced blur/hidden/offscreen scheduling, stale frame
  callbacks drawing after destroy and viewport calls during context loss. Activity
  gating, immediate cancellation and destroyed/lost guards address those paths.
- Orb restoration draws one settled frame even if blurred, then stays paused.
  Without that draw, the fallback could disappear over a restored blank canvas.
  A dedicated failure-before/pass-after test covers it.
- Browser instrumentation reproduced Nav's loop continuing after blur. Pause now
  gates scheduling by focus/visibility/intersection. Its active animation clock
  excludes paused time, preserving particle travel without a wall-clock jump.
- One GL draw could occur after GPU loss but before its DOM event. Direct context
  checks prevent drawing in that gap; Nav still updates its CSS fallback and native
  selection. Contexts are released only after a canvas is disconnected, retaining
  StrictMode's connected-canvas reuse. Destroy is idempotent for Orb.

Shader strings, colors, shape math and normal interpolation remain unchanged.
Screenshots of two settled reduced-motion states match the HEAD baseline byte for
byte, after disabling pointer steering in the visual fixture and waiting for the
existing 200ms text-color transition. Earlier screenshots taken during that CSS
transition differed only in text pixels; they were not claimed equivalent.

## Verification and limits

Eleven focused resource/lifecycle tests pass, including failed restoration/retry,
reduced-motion single-frame updates and late callbacks. The Chromium GPU fixture
passes StrictMode startup, blur freeze, one-loop focus resume, both real context
restores, static-pill selection while lost, reduced motion, offscreen pause,
repeated remount and zero engine observers/listeners/resources after unmount.
It also passes disabled GL and failed-buffer fallback controls. A remaining
observer was identified by stack trace as Playwright's own injected observer and
is excluded from application counts; none of the engine observers are excluded.

Fixture bundles are rebuilt after source edits. The browser does not prove every
GPU/driver/assistive-technology combination, and synthetic blur/visibility events
are not an OS focus integration test. Unit GL mocks establish failure branches;
real browser extension tests establish actual context restoration. No CMS writes.
Final build/full-suite results are recorded when available. The engine lint scope
remains separately staged; this is a behavior/resource fix, not warning suppression.

Full Vitest run passed: **104 files / 792 tests**, 430.70 seconds. Eleven focused
Orb tests and the final GPU fixture run passed after the final static-restore
change. The unchanged low deepmerge advisory remains; no dependency changes.

Review: resource ownership and cancellation are explicit; context-loss fallback
continues to serve native controls, and no shader/style design was rewritten.
No network/authorization/data contract changed. Self-evaluation: accuracy 4/5
(failure-before evidence, GPU/unit tests, deterministic screenshots; finite driver
coverage), completeness 4/5 (requested lifecycle paths, no hardware matrix), clarity
4/5 (documented phases and limits), actionability 4/5 (isolated fixture and fault
modes), conciseness 4/5 (guards/activity state, existing renderer retained).

Final production build passed with 38/38 pages, including TypeScript. Lint and
whitespace checks passed; no push. Generated graphs and visual snapshots stay
ignored, while reproducible fixture/tests and this evidence are committed.
