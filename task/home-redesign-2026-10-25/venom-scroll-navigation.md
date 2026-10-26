# Venom, scrolling, and mobile navigation

Implemented the approved black-navy Venom material with softer cool reflections,
more even label lighting, and quieter idle probes. Geometry, font, size, cursor,
and pointer-driven strand physics are preserved. Hero text stays centered above
the horizon.

The renderer now exposes pause/resume/dispose. Offscreen, document-hidden, and
window-blur states cancel its animation frame and release the custom cursor.
Resume uses the same canvas, resets the frame clock and stale pointer forces,
and renders the full-size button and label without another growth intro. One
paused scene retains GPU resources; unmount, reduced motion, coarse-pointer
mode, or context loss frees them. Preference-driven recreation skips the intro
after the first initialization during that component mount. A new route mount
may play its initial entrance again.

Smooth scrolling is native CSS, enabled only for no-preference motion settings.
The root Next.js attribute preserves immediate route transitions. About and
article section navigation, and the floating top button, now defer to that CSS
preference. The footer already handled reduced motion. Explore the work uses
InPageLink with integrated History API updates, repeated-anchor scrolling,
modifier-click preservation, and focus transfer to the target. A plain anchor
exposed stale route content after Back; a Next Link then skipped a repeated
same-hash click. The final adapter passed both flows.

Mobile navigation now displays five text labels, with icons hidden below 640px.
Text is 13px with 6px horizontal padding; actual link targets remain at least
44×44px. Desktop still includes both labels and icons. Measured total navbar
width is 279.2px, fitting the 320px test viewport.

## Verification

- PASS: TypeScript noEmit, Biome on all 15 touched source/test files, and 14
  navigation unit tests.
- PASS: Venom browser suite including pixel-read checks that resumed buttons
  immediately occupy over 85% of their center-row width and retain the same
  canvas after scrolling, window blur/focus, and document visibility events.
  Visibility was simulated on a disposable page; this is not an OS-window test.
  Navigation/back, reduced motion, context loss, no-WebGL, and touch also passed.
- PASS: Home browser suite at six viewport sizes, light/dark, smooth anchor
  movement versus instant reduced motion, repeated anchor activation, both top
  controls, footer keyboard focus, Home→Projects→Back, missing-post 404, touch,
  unavailable covers, and server markup. No page errors reported.
- PASS: Gooey navigation suite, five routes, Back/Forward, detail-route selection,
  desktop/mobile/narrow labels and icons, 44px targets, keyboard, scroll
  visibility, light/dark, reduced motion, context loss/restoration, no-WebGL.
  No page errors or prefetch warnings reported.
- Visual inspection: settled navy material and narrow mobile text navigation.
  Captures are in ignored `.playwright-cli/` and `.tmp/gooey-navigation/`.

The development CSS preload warning documented in color-refinement.md remains.
The Next development badge overlapped the floating top button during testing;
keyboard activation verified its behavior. No production build or Safari run
was performed in this refinement. Full no-JS usability is not claimed.

## Self-review

Accuracy 4/5: measured rendering/scroll/navigation checks passed; window
visibility uses deterministic event simulation. Completeness 4/5: all requested
changes implemented; no Safari verification. Clarity 4/5: lifecycle and GPU
retention are explicit, with visual preference left to the user. Actionability
4/5: code and repeatable browser checks are local; production verification is
pending. Conciseness 4/5: checks cover changed behaviors, although the discovered
anchor-history bug required additional diagnosis. Overall 4/5. Next useful
checks are a real OS-window switch and the next production build.
