# Home entrance, visible stars, and Venom resume

Implemented the approved entrance using the local Imposia project as a timing
reference. Existing fonts, copy, image, CTA target, and Home layout are preserved.

## Result

- CSS starts the scene at first paint on a dark canvas, followed by navigation,
  the word-based headline, subheadline, and CTA. The finite sequence completes
  within about 1.8 seconds without waiting for the renderer. Interaction,
  scrolling, losing focus, or hiding the document finishes it immediately.
- Headline words take one second each, beginning after 350ms, with at most 400ms
  total stagger. Reduced motion displays content directly. Scroll/focus returns
  do not replay the entrance.
- Gravity stars are direct hero children above its image scrim. The previous
  layer was below that scrim and its sprites lacked a strong visible core.
  Stars now have small crisp cores, 1.1 base size, 2.8 glow, 0.85 layer opacity,
  and a bottom fade: 40 desktop stars, 24 on narrow screens. No connecting lines
  or pointer attraction. Rendering pauses offscreen, hidden, or unfocused.
- A visible paused Venom button retains a 2D snapshot of its neutral material;
  the WebGL loop stops and GPU resources remain reusable. Resume keeps that
  snapshot until the first complete new frame. Offscreen pause removes it.
- The reported focus-return blink was reproduced with frame measurements:
  the snapshot disappeared while WebGL opacity was still zero, then faded over
  180ms. Retained-frame swaps now disable that opacity transition on both
  canvases. Initial startup retains its crossfade. A 24-frame regression check
  requires either the snapshot or WebGL canvas to remain fully opaque throughout.
- Home section groups reuse the shared MotionReveal from About, Projects, and
  Blog. Removed the superseded intermediate home-motion browser script; the
  hero and Home suites cover the final behavior.

## Verification

- TypeScript no-emit check passed. Biome checked 14 relevant files without changes.
- Final production build passed (36 routes), including TypeScript and prerendering.
- Hero browser suite passed: visible star pixels above the scrim, finite intro,
  mobile layout, reduced motion, pause without rendering, retained material,
  frame-by-frame opaque resume, same canvas, no replay, and working CTA. No page errors.
- Venom browser suite passed all 11 scenarios, including initial full-size frame,
  transparency/motion, cached assets, navigation, focus/visibility/scroll resume,
  pending shaders, shader failure, context loss, no WebGL, and touch. No page errors.
- Home regression suite passed against the production build: six viewport sizes
  from 320px to 1440px, smooth/reduced-motion anchors, footer focus and curtain,
  touch navigation, failed image fallback, SSR markup, and missing-post HTTP 404.
  The same missing-post assertion returned 200 on the development server; the
  production check returned 404. No article-route change was made in this task.
- Impeccable scan returned no primary findings. Advisory findings concern the
  existing intentional Venom material colors, mask black/white, and established
  36px/48px section heading sizes; no design-system changes were inferred from them.
- Desktop, narrow viewport, and paused screenshots were inspected locally.
  Browser artifacts live under the ignored `.playwright-cli/` directory.

Browser verification uses Chromium and synthetic focus events; actual browser
window switching remains useful for subjective review of the material and timing.
No remote deployment, commit, or database mutation was performed for this change.

## Self-evaluation

| Axis | Score | Evidence / remaining limit |
| --- | --- | --- |
| Accuracy | 4/5 | Reproduced the blink and verified uninterrupted opacity across 24 frames; other browser compositors were not tested. |
| Completeness | 4/5 | Approved intro, slower text, visible stars, retained pause, and focus return are covered; perceptual approval remains the user's. |
| Clarity | 4/5 | Design and renderer docs explain timing and lifecycle; vendor physics remains intentionally unchanged. |
| Actionability | 4/5 | Local implementation and repeatable `test:browser:hero` command are ready; no deployment was requested. |
| Conciseness | 4/5 | Reuses shared section motion and existing renderer; a retained canvas is the extra lifecycle state needed for pause. |
