# Gallery polish

Scope: preserve the existing MasonryPhotoAlbum and Yet Another React Lightbox,
fonts, palette, CMS records, and image ordering. No commit or push, as requested.

## Changes and reasons

- Match the compact Projects/Writing opening; remove repeated counts so images
  lead sooner. Keep the factual introduction and trim its second sentence.
- Reuse the shared searchable single-select with an X reset. Keep category URLs,
  unrelated parameters, optimistic feedback, and native history navigation.
- Keep three desktop columns, two tablet columns, and one narrow-screen column.
  Preserve CMS dimensions, 8px corners, and 16/24px gaps. Motion shared layout IDs
  animate category changes in 240ms; reduced motion disables spatial animation.
- Use accurate responsive image sizes and eager loading for the first three
  images. Keep lazy loading, blur placeholders, and unavailable-image fallbacks.
- Keep lightbox focus restoration and Lenis locks through the closing transition.
  Add Zoom and a counter with the project's Phosphor icons and 44px controls.
- Replace the detached caption capsule with an unboxed footer. ResizeObserver
  reserves its measured height outside the image viewport. Descriptions retain
  their complete text and scroll natively within a maximum 30dvh region.
- Retain the selected image while closing to avoid resizing the image mid-fade.
- Keep hover zoom subtle; keyboard focus reveals captions, and touch captions
  remain visible. Use the existing planet-night token for image contrast.

## Verification

- Biome: 430 files passed. TypeScript passed. Production build passed: 36 routes.
- Vitest: 37 files, 233 tests passed, including category URL regression tests.
- Browser regression passed at 1440, 1024, 768, 390, and 320px. No overflow;
  heading sizes remain 56px/40px. First image starts at 379px desktop/tablet and
  467px narrow mobile, compared with the previous 618px/689px captures.
- Search, single selection, X reset, unrelated query preservation, Back/Forward,
  unknown-category recovery, keyboard focus, image navigation, and zoom passed.
- Normal-motion filtering produced observable layout transforms. Empty search
  and keyboard category selection passed. Reduced-motion browsing stayed native.
- A synthetic long caption scrolled independently at 844x390; the background
  stayed locked, then Lenis resumed after close. No CMS data was changed.
- Chromium touch context: swipe, touch zoom controls, close, and native page pan
  passed. Initially instantaneous CDP move events suppressed the subsequent click;
  event capture confirmed the missing click with the button still connected.
  Spacing move events by 20ms resolved the harness issue without UI changes.
- Local design detector: zero findings after replacing the inherited literal
  overlay color with an existing palette token.
- Desktop/mobile screenshots inspected: gallery-1440.png, gallery-390.png,
  lightbox-1440.png, lightbox-390.png. Browser sessions are closed after use;
  the user's development server is left running. Temporary diagnostics remain
  under ignored .tmp/gallery-polish.

## Limits and self-review

Checks use Chromium, including emulated touch; physical devices, Safari, and
Firefox were not tested. Pinch/double-tap behavior comes from the installed Zoom
plugin; the automated gesture check exercises its visible touch controls.
Existing CMS dimensions and demo content were preserved rather than backfilled.

Self-review (1–5): accuracy 4 (runtime checks above, single engine), completeness
4 (requested polish implemented; physical pinch untested), clarity 4 (shared
filter language and compact opening), actionability 5 (running local UI and
screenshots), conciseness 4 (touch diagnostics required several attempts).
Future validation: real-device pinch and mixed portrait/landscape CMS content.
