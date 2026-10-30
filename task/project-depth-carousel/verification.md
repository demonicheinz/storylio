# Project screenshot Depth Carousel — 2026-10-27

Adapted `.docs/referensi/depth-carousel.tsx.bak` for the existing Storylio world.
The screenshot grid is now a single bounded stack: a flat active image and up to
two darker rear previews. CSS transitions replace the reference's GSAP runtime;
no new dependency, animation clock, autoplay, or wheel interception was added.

Final owner adjustments:

- Caption appears only in the existing lightbox. The carousel retains the active
  image's descriptive accessible button name.
- Previous/count/next controls are centered below the stack and measure 44px.
- Removed both active border and blue frame background. Frames are transparent;
  images use object-fit:contain and preserve their full content.
- Every image element fills the same bounded frame. Source width/height and blur
  placeholders remain available to Next Image; images are not cropped.
- Normal touch uses native implicit pointer capture; mouse drag uses explicit
  capture. Touch taps activate on pointer-up and suppress their compatibility
  click, preventing an earlier swipe from swallowing the next tap or causing a
  duplicate lightbox activation. Keyboard activation remains native.

The CMS still owns screenshot URLs, alt text, caption, order and dimensions.
Sorting copies the supplied array. The selected carousel frame is synchronized
when navigating inside the lightbox; closing it restores focus to the stable
open-image button. Existing body/Lenis scroll locking is retained. Lightbox
captions are read from each actual slide. Empty galleries stay hidden, single
images omit redundant controls, and only three previews mount even for 20 items.

Responsive behavior: desktop uses subtle X/Y/Z offsets and rear Y rotation;
mobile removes the rear rotation and reduces the offset. Reduced motion removes
all spatial transitions and hides rear layers. Vertical wheel and touch pan-y
continue scrolling the page rather than changing slides. Arrow keys, Home/End,
buttons, mouse drag, and horizontal touch swipe navigate the stack.

## Diagnosed defects and corrections

1. An initial touch test showed that compatibility clicks after a swipe were not
   reliably delivered by Chromium. Mixing input channels also obscured diagnosis.
   Final tests use one CDP channel for swipe and the following tap; the component
   now handles touch tap activation independently of compatibility click delivery.
   The final production test passes immediately after a swipe without an extra
   transition wait, as well as initial tap and native vertical panning.
2. Removing the colored frame first exposed an image-sizing mistake: auto sizing
   left the first low-resolution source at 435.6x290.4px and let other image boxes
   grow to about 923.5x615px inside a 924x520 frame, clipping their bottom.
   The author's initial explanation attributed too much to aspect ratios; actual
   measurement identified the CSS defect. Grid tracks now use minmax(0,1fr),
   images fill the fixed frame and object-fit:contain preserves their contents.
   All three measured image boxes are now approximately 923.55x519.98px.
3. A mouse-drag regression initially targeted a frame that had moved above the
   viewport after control focus. The browser check now explicitly reveals the
   active frame before dragging, so it tests the intended user interaction.

## Verification

- Main Vitest suite: 31 files / 217 tests passed before the last added large-
  gallery case and final UI adjustments. After those changes, targeted screenshot
  and route-shell suites passed: 21 tests, including all four screenshot cases.
  No claim is made that the final tree received a second full-suite run.
- Standalone TypeScript and the final production build passed, including all
  36 generated routes. Lint: 400 files passed. Whitespace checks passed.
- The detector ran once over the new carousel and screenshot renderer and
  returned no findings; no repeated detector-driven cosmetic loop was used.
- Final production browser check: 1440/1024/768/390/320px, normal and reduced
  motion. No page errors or horizontal overflow. Active frames remain flat,
  image boxes fill their frames, fit is contain, background is transparent,
  border is 0px, controls are geometrically centered and no outside caption
  exists. Normal gallery height is about 620px desktop / 329px at 390px / 276px
  at 320px. Keyboard wrap/Home/End, mouse drag, lightbox index synchronization,
  focus restoration and vertical wheel all pass.
- Final Chromium touch-context check passes initial tap, swipe without opening
  the lightbox, tap after swipe, and native vertical panning. Physical devices
  and other browser engines were not tested.

Run `tests/browser/project-depth-carousel.js` and
`tests/browser/project-depth-touch.js` using an isolated repository Playwright
CLI session against the published `/projects/storylio` demo. Neither writes data.
Screenshots: [desktop](carousel-1440.png), [mobile](carousel-390.png).

No commit, push, CMS write, or DESIGN.md update. The existing review preview was
refreshed on port 3102; the existing development app stays on 3000. The isolated
browser session is closed when verification completes.

Self-evaluation: accuracy 4 (the initial ratio explanation was corrected with
measurements); completeness 4 (all requested behavior verified in Chromium,
physical touch/other engines remain untested); clarity 5 (final behavior and
limits are explicit); actionability 5 (working code and repeatable browser
checks); conciseness 3 (touch diagnosis took more iterations than desirable).
Average 4.2/5. Improvement: instrument exact failing input steps sooner and
measure intrinsic versus frame geometry before explaining size differences.

## Visible image corners — 2026-10-27

Owner approved 8px corners on active and rear screenshots. Border-radius on the
image element alone rounded only its larger letterbox box, so the painted image
still looked square. CarouselImage now observes its actual layout size and image
load, computes the contained picture's inset from natural dimensions, and applies
an inset clip with an 8px radius at those visible edges. This preserves the same
frame size, full image contents, transparent background, and existing gestures.
ResizeObserver/load listeners are disconnected on unmount; transformed rear-card
coordinates are deliberately excluded from the calculation.

Checked 1440/390/320px with navigation and resize in one browser pass. All three
mounted images have 8px rounded clipping at their calculated picture bounds.
Desktop horizontal letterboxing and mobile vertical letterboxing both produce
the correct insets. Screenshots inspected:
[desktop](radius-1440.png), [mobile](radius-390.png). Standalone TypeScript, lint
(400 files), and whitespace checks passed. No full-suite or production build
rerun for this bounded visual change. No commit.

## Review fixes — documented port and modified keys

README's project-detail browser command now uses localhost:3000, matching the
documented local app setup. Carousel navigation returns before preventDefault
whenever Alt, Ctrl, Meta, or Shift is held. Unmodified arrow/Home/End navigation
retains its behavior.

The new tests/browser/project-depth-keyboard.js first reproduced interception
of all 16 modifier/key combinations. After the fix, every combination leaves
the event uncanceled and the current image unchanged; actual unmodified keyboard
navigation still passes. This checks event handling, not OS-specific browser
shortcut dispatch. Lint passes (401 files), whitespace check passes, and README
has no remaining port-3102 examples. No build/full-suite rerun for this scoped
guard/documentation change. No commit.
