# Venom renderer

Adapted from exteestudio/venom-button, upstream commit `ca890bd`.
Local source: `.docs/referensi/venom-button/index.html`.
Upstream: https://github.com/exteestudio/venom-button
License: MIT © 2026 exteestudio, preserved in `LICENSE`.

`engine.js` preserves the original SDF scene, three rendering passes,
studio reflections, strand simulation, idle probes, finger coils and 3D cursor.
`icons.js` contains upstream embedded cursor artwork (credited by upstream to
Figma Community “Cursors”, left_ptr and hand2). No Geist font is distributed.

The React link adapter supplies Storylio's computed Satoshi font (14px/500)
and DOM dimensions (44px minimum target, 12px vertical/24px horizontal padding).
The pill geometry remains intact. The material is black navy with reduced
white reflections, cool blue rim lighting, and a more evenly lit label.
Idle probes use 1–2 strands extending 7–13px, spaced 4–6 seconds apart.
The original 19px/700
Geist label and fixed 60px body are not used.

Integration changes: a bounded fixed canvas with premultiplied transparency
instead of the demo's opaque full-screen white floor; actual DOM link position;
project font/size; conditional import started immediately for a visible desktop
CTA; abortable input listeners; resource disposal;
isolated cursor ownership; no tuning UI, arbitrary SVG upload or global debug
API. The custom cursor is limited to the canvas interaction area and releases
over other interactive controls. Native link activation and modifier clicks
are preserved. No router replacement or forced full prefetch.

The adapter leaves a server-rendered CSS link for touch, reduced motion,
unavailable WebGL, context loss or initialization failure. A thin blue rim orbits
the pill every five seconds, brightens on hover/focus, and stays still with
reduced motion. The label stays readable while the renderer prepares. Home's
finite entrance reveals both the CSS link and body-level canvas on the same
schedule; loading the renderer does not delay the entrance.
The first WebGL frame has the complete pill and fully visible label; a 180ms
crossfade replaces the CSS material/rim. No growth or delayed-label intro runs.

`icon-textures.js` preserves the upstream SVG rasterization. `distance-field.ts`
uses an exact separable squared-distance transform instead of checking every
boundary pixel for every output pixel. Tests compare Float32 output exactly
against the original exhaustive search, including the 96px size and irregular,
empty and filled masks. Its promise caches two CPU-side color canvases and distance arrays
for subsequent mounts in the document; it creates no GPU resources. The adapter
prepares these alongside the font. Each scene uploads and owns its own textures.
All three shader programs are submitted before querying link status, with one
shared vertex shader. `KHR_parallel_shader_compile`, where available, is polled
from animation frames before uniforms or drawing; the fallback validates the
batch on the first frame. Failed initialization keeps the CSS link readable.

Leaving the viewport,
hiding the document, or blurring the window cancels animation frames and releases
the custom cursor. A visible paused scene renders one neutral frame, copies it
to an inert 2D canvas, and hides the WebGL canvas. This preserves the material
without keeping the animation loop active or relying on a retained WebGL buffer.
Offscreen pause removes the snapshot. Resume removes it only after the first
complete new frame. The same scene resumes at full size with the label visible,
cleared pointer forces, and a reset frame clock. Retained-frame swaps have no
opacity transition; the 180ms crossfade is reserved for initial startup.
The CSS rim also pauses when
offscreen, hidden, unfocused, or covered by the ready scene.
The paused scene retains GPU resources. Unmounting or a live reduced-motion/
coarse-pointer preference disposes them. Context loss disposes the current scene
and shows the CSS fallback. The React adapter retains that canvas until its
context-restored event, then creates one fresh idle scene. It uses the existing
pause/resume rest path, full label, and retained-frame transition rules so recovery
does not replay an entrance. Recovery while blurred/offscreen stays paused.
If rebuilding fails, cleanup removes the canvas and keeps the native fallback.
Live reduced-motion/coarse-pointer changes and unmount cancel pending recovery.

The numerical vendor JS is intentionally not rewritten into bespoke TS physics.
Its typed boundary is `engine.d.ts`; changes to integration must be checked in
a browser for material, transparency, cursor restoration and lifecycle behavior.
