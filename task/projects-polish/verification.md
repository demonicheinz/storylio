# Projects layout and BeUI multi-select

2026-10-26. Implemented locally; no staging, commit, push, CMS edits, migrations,
or dependency changes. Demo covers, text fields and live/source destinations are
preserved. Preview runs on port 3102; the existing application server is untouched.

## Behavior

- Projects uses the actual BeUI registry multi-select context, list, animated
  panel, active-option and portal-positioning sources. Trigger/search presentation
  is adapted for Storylio, using existing Motion, Phosphor, Satoshi and navy/blue
  tokens. MIT attribution is in `src/components/common/multi-select/LICENSE`.
- Search finds technologies only. Multi-selection uses AND via native Drizzle
  arrayContains: every selected technology must occur in a published project's
  stack. Existing single-tech URLs continue to work.
- Repeated `tech` parameters are trimmed, deduplicated and sorted for stable query
  and cache keys. Other query parameters survive selection and reset. Optimistic
  selection stays responsive while server results load; Back/Forward restores URL
  state. Selection navigation keeps scroll position.
- The trigger remains 44px and one line. Desktop shows up to two labels plus a
  remainder count; mobile summarizes the selected count. An X replaces the arrows
  when selected. X is a separate 44px control, so clearing does not accidentally
  open the dropdown and does not nest buttons.
- Removed repeated archive totals; count and filter share one toolbar. Opening
  spacing is reduced. Featured identity precedes the preview in the stacked layout;
  desktop retains its side-by-side composition. Mobile body padding is 20px.
- Each project card has one internal Read case study link, styled as the primary
  action. Live site and Source remain secondary links, with original destinations
  and source-publication conditions preserved. No nested clickable card anchors.
- Existing 3/2/1 grid, typography scale, cover fallback, tilt, starfield, navbar,
  footer, public caches and missing-detail HTTP status behavior are preserved.

## Focus and short viewport fixes

The owner reported a blocked aria-hidden warning while the popup input retained
focus. Closing now moves focus synchronously before changing open state, rather
than deferring restoration to requestAnimationFrame. Closed panels use inert
without redundant aria-hidden. Escape and X restore the opener; clicking outside
can leave focus on the clicked target/body but never in the inert panel.

The panel bounds its height/list scroll area by available viewport space. Selected
chips remain horizontally scrollable inside the panel instead of growing the
closed trigger. Reduced motion uses immediate panel and selection transitions.

## Verification

- PASS final production build, including TypeScript and all 36 generated pages.
- PASS lint (374 files), git diff --check, and unchanged empty staging area.
- PASS final Vitest run: 25 files / 176 tests. New tests cover canonical repeated
  URLs, reset preserving unrelated params, punctuation encoding, one primary card
  link, featured DOM order, unchanged external links and closed-source behavior.
- PASS Projects browser suite at 1440/1024/768/390/320px: no horizontal overflow,
  3/2/1 grid, featured identity before media when stacked, bounded short-screen
  panel, searches with no options, AND results, no-result recovery, stable trigger
  height, reset X, Back/Forward, keyboard activation, and query preservation.
- PASS accessibility regression: Escape and reset while open do not leave focus
  under inert/aria-hidden; console capture reports no blocked aria-hidden warning.
  Normal-motion check also verifies removable chips and outside-click closure.
- PASS filter/prefetch regression: no filter navigation before selection, query and
  scroll preservation, Blog hover/focus prefetch behavior unchanged. Projects uses
  router partial-shell prefetch on active-option intent; a fresh network response
  is not required if Next.js already has the partial shell. Selected result data
  can still be fetched during navigation; no false instant-data claim is made.
- PASS public typography comparison across routes and five widths, including root
  font scaling and article copy action. PASS public integration suite: detail TOC,
  project/gallery lightboxes, archive grids, empty filters and cold missing HTTP 404s.
- Chromium browser coverage only. No authenticated dashboard testing or external
  destination visits. One browser image-preload timing warning occurred during
  repeated fixture navigation; no runtime page errors or aria-hidden warnings in
  the final focus regression.

| Width | First card top | Featured title top | Filter toolbar height |
| --- | --- | --- | --- |
| 1440 | 379px | 488px | 78px |
| 768 | 379px | 438px | 78px |
| 390 | 344px | 399px | 70px |
| 320 | 418px | 473px | 70px |

At 390px the old first card started around 671px, its title around 957px, and its
filter region consumed 190px. The current title is visible before the image.
Screenshots inspected in desktop/mobile and normal-motion selected-panel states:
[Desktop](desktop.png), [Mobile](mobile.png), [Selected filter](filter-short.png),
[Reset X](reset-x-mobile.png).

## Design gate and self-review

PASS scoped refinement: existing approved typography/palette retained; compact
controls serve filtering, primary action identifies the intended next step, no
invented project content or claims, controls support keyboard/focus, no overflow,
and motion has reduced-motion behavior. The project owner's visual approval is
still pending; successful tests do not imply that approval.

Accuracy 4/5 (build, actual DB-backed filtering and browser checks; Chromium only);
completeness 4/5 (all requested layout/filter/X/focus changes covered, visual review
pending); clarity 4/5 (URL and cache behavior documented, legacy data unchanged);
actionability 4/5 (preview, screenshots and test commands available; no commit);
conciseness 4/5 (upstream behavior retained with local adaptation, so multiple
component source files are necessary). Mean 4.0/5. Next useful step: owner review
of the new Projects composition and filter interaction.
