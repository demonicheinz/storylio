# Venom wrapper and automatic recovery

User authorized automatic recovery without entrance replay, retaining idle state
and fallback on failure. The subsequent request adds a more polished CSS fallback
in the existing project theme. Keep wrapper hardening, recovery behavior and
fallback styling in separately reviewable commits.

## Wrapper audit

An isolated StrictMode fixture reproduced an orphan canvas when createVenomScene
throws before the wrapper assigns its cleanup callback. Register canvas ownership
immediately after append; clear it through the existing stop path on throw/null.
Actual scene disposal stays with the renderer. The fault test failed before the
fix and passed afterward for thrown/null creation, ordinary mounting and late
asset preparation after unmount. TypeScript, lint and whitespace checks passed.
No renderer, shader, navigation, cursor or visual behavior changed in this step.
The mocked renderer establishes wrapper behavior only, not real GPU safety.

Wrapper audit committed as `ff504b4`.

## Automatic restoration

The wrapper owns context-loss/restoration listeners independently of the renderer's
abortable listeners. Loss disposes the scene and leaves its canvas attached for
browser restoration. A recovery guard prevents focus/visibility changes from
creating duplicate renderers while waiting. Restore builds once on that canvas,
then uses the existing pause/resume rest path: full-size body, full label and
cleared pointer forces. Retained-frame CSS disables entrance crossfades. Blurred
restoration remains paused; incompatible preferences/unmount cancel everything.
Failure cleans the canvas and keeps fallback. The numerical engine is unchanged.

Mock browser checks passed throw/null setup, late assets, one restore, no focus
duplicate, thrown restoration fallback and disposal on preference changes during
loss. Real Chromium checks passed two WEBGL_lose_context cycles, exactly one
three-program rebuild each, full uLabelAmt from the first recovered draw, no
crossfade, one canvas, paused restore and released cursor ownership on unmount.
TypeScript/lint passed; build result follows. No real links/accounts/assets changed.

Recovery production build passed with 38/38 pages. No engine shader/simulation
changes, new dependency, retry timer or remote writes. GPU tests use a synthetic
CTA and the actual renderer; mocked tests establish failure/cancellation branches.

Recovery committed as `0ed9f6a`.

## CSS fallback enhancement

User requested improving the fallback during recovery work. Retain the existing
44px target, 14px project font, dimensions, pill geometry and orbit rim. Use planet
night/accent-light/glow tokens for a layered navy material: broad top reflection,
subtle bevel/perimeter, darker lower edge and bounded external shadow. Hover/focus
increase edge definition without tilt or layout movement. The fallback fades away
under a ready renderer; recovery retains the no-crossfade handoff. Reduced motion
keeps the rim static. No image/WebGL dependency is introduced by the CSS material.

The fixture now serves real Satoshi, separating synthetic controls from cropped
visual evidence. Fallback checks passed at 1440/390/320px: 44px height, 14px Satoshi,
visible keyboard focus, no GPU under reduced motion and working anchor activation.
Screenshots were inspected locally. Two-cycle real GPU recovery also passed after
the styling change. Eleven distance-field/image tests and lint passed; final build
is recorded when complete. Existing numerical renderer/shaders are unchanged.

An additional real-GPU failure injection corrupts restored shader source. All
three restored programs are disposed and fallback text remains readable. A shader
failure may leave an inert transparent canvas owned by the wrapper until unmount;
the wrapper removes it on cleanup. Synchronous thrown/null initializers remove
their canvas immediately. This distinction does not hide the native fallback or
start an automatic retry loop.

Final fallback production build passed (38/38 pages, TypeScript included), as did
lint/whitespace checks. Review: changes stay at the wrapper/CSS boundary; no shader,
physics, font geometry, input-lock or navigation rewrite. Self-evaluation: accuracy
4/5 (mock and real GPU cases, limited driver matrix); completeness 4/5 (recovery
and fallback done, wider repo cleanup remains); clarity 4/5 (failure modes and
inert-canvas ownership explicit); actionability 4/5 (reproducible isolated tests
and screenshots); conciseness 4/5 (reuses existing idle/rest path, no retry service).
