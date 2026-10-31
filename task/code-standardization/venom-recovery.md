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
