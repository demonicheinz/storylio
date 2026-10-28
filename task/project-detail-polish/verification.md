# Project detail refinement — 2026-10-27

Implements the five priorities in
`task/project-detail-review-2026-10-27/critique.md` without changing CMS content,
the approved fonts/palette, Home, navbar, or footer. DESIGN.md awaits visual
acceptance; implementation changes are documented here and in README testing.

- Mobile/tablet below 1024px: title, description, actions, cover, then facts and
  full technology stack. Empty action/stack blocks are omitted. Desktop keeps the
  two-column introduction. Live site uses the existing FlowButton; Source stays
  secondary.
- Project prose uses a 640px text measure, 18px desktop and 16px mobile body.
  Code retains the wider 720px reading column. The first desktop paragraph now
  measures 75/73/73 characters per line, compared with 125 in the critique.
- The existing TOC gains an opt-in disclosure below 1200px. ProjectToc enables
  it; other ContentToc consumers retain their behavior. On this page appears
  after cover/facts/stack and immediately before the case-study body. It starts
  collapsed, supports Enter and Escape, and links to one navigation instance
  through aria-controls. Desktop keeps the sticky TOC.
- Mobile MDX headings use their full width before an inline copy control;
  Implementation stays on one line at 320px. Hyphenation/wrapping remain scoped
  to project content. Project copy-link targets measure 44x44px.
- A single neighbor spans the whole project navigation row. The project
  lightbox uses an opaque theme background and retains its keyboard/focus and
  scroll-lock behavior.

Browser measurements with reduced motion:

| Width | Cover top | Body size / paragraph width | Page overflow |
| --- | --- | --- | --- |
| 1440 | 468.6px | 18px / 640px | None |
| 1024 | 468.6px | 18px / 640px | None |
| 768 | 444.6px | 18px / 640px | None |
| 390 | 434px | 16px / 358px | None |
| 320 | 462px | 16px / 288px | None |
| 844, short landscape | 444.6px | 18px / 640px | None |

The reduced-motion browser suite verified disclosure keyboard behavior,
anchor hash/focus/112px offset, the 320px word wrapping, lightbox scroll lock and
focus restoration, and single-neighbor width. One exact-size assertion initially
failed on a 43.99993896484375px rectangle with computed CSS height 44px; the test
now permits 0.01px subpixel rounding. No production sizing change was needed.
Blog regression probe retained zero new disclosure controls and 32px copy buttons,
confirming the project-specific sizing does not leak into Blog.

## Streamed-page scroll limit regression

The normal-motion check revealed a real stale Lenis dimension limit after the
route shell streamed its content: Outcome was focused and hash updated, but
scroll stopped at 1394px, leaving the heading about 935px below the viewport top.
A diagnostic resize event followed by another anchor activation reached 2217px
and placed the heading at 112.1px, confirming stale dimensions rather than an
incorrect layout coordinate or disclosure handler.

The shared scroll helper now calls Lenis.resize immediately before programmatic
scrollTo. It preserves the one Motion clock and current scroll preferences. A
new regression first failed with position 100 instead of 700, then passed after
the fix. Existing overlay-lock, native fallback, cleanup, and CSS-offset tests
also pass. The normal-motion case is included in the durable browser check.

The mechanical detector ran once and found one advisory in the pre-existing
numeric TOC indicator's 0.65rem text size. This branch is unchanged and the
project uses line indicators; no new token or unrelated About/Blog type change
was introduced. Initial lint also exposed two unformatted JSON evidence files
from the preceding review; those generated files were formatted.

Screenshots: [desktop intro](desktop-mobile-1440.png),
[mobile intro](desktop-mobile-390.png), [desktop reading](reading-1440.png),
[320px reading](reading-320.png), [opaque lightbox](lightbox-320.png).

Both supplied carousel references were read. Recommendation is an adapted
DepthCarousel with a flat active image, restrained rear depth, uncropped native
aspect ratios, manual controls, vertical page wheel, existing lightbox, and a
simpler mobile/reduced-motion treatment. FlexCarousel's WebGL deformation is
less suited to interface screenshots. Neither reference has been installed.

## Final checks

- Full Vitest: 30 files, 214 tests passed, including the initially failing
  streamed-page limit regression. Targeted route/control tests also passed.
- Lint: 393 files passed. Standalone TypeScript passed; the final production
  build also passed TypeScript and generated all 36 routes.
- Final browser check passed all six reduced-motion viewports, plus Lenis
  anchors and active TOC state at 1440px and 390px with normal motion. Zero page
  errors. Capture the lightbox only after its active image has loaded.
- Blog's default TOC and copy sizing were verified unchanged. The cover preload
  warning seen during repeated viewport switches refers to the existing demo
  Cloudinary image; it was not treated as a new application failure.
- [Mobile TOC open](toc-open-390.png) and [tablet TOC open](toc-open-768.png)
  were captured and visually inspected alongside intro, reading, and lightbox.
- Whitespace check passed. No CMS writes, commit, or push. The isolated browser
  session was closed; the pre-existing review preview remains on port 3102.

The extra normal-motion verification was necessary to resolve a demonstrated
functional defect, rather than continuing cosmetic polish beyond the bounded
visual inspection. Temporary probes remain ignored under .tmp/project-detail-polish.

Self-evaluation: accuracy 5 (measured before/after and both motion modes),
completeness 4 (five priorities fixed; exhaustive assistive-technology and
contrast testing were not performed), clarity 5 (scoped behavior and evidence),
actionability 5 (working preview and browser script), conciseness 4 (extended
diagnosis kept in this report). Average 4.6/5. Future improvement: evaluate long
authored case studies and mixed screenshot ratios when implementing the chosen
carousel. This report does not certify site-wide accessibility.

## TOC spacing correction — 2026-10-27

The owner clarified that the TOC-to-heading separation was too small, while
spacing between entries was too large at every breakpoint. On the existing dev
server at port 3000, shared CSS actually overrode the project layout: row-gap was
0px below 1200px, despite the project's intended 32px. Desktop used the shared
80px gap instead of the project's 64px column separation.

The project's reading-container selector now includes its div root, so it wins
over the shared class independent of development/production CSS import order.
Tablet/mobile retain a real 32px separation from the TOC border to the first
article heading. A project-scoped rule reduces TOC entry row-gap from 12px to
4px on every viewport, preserving the 44px minimum touch target. Other pages'
TOC recipes are unaffected.

Verified in the running development app at 1440/768/390/320px: 4px item gaps on
all screens, 32px heading separation below 1200px in both collapsed and expanded
states, 44px expanded controls, and no page overflow. Screenshot:
[mobile spacing](toc-spacing-390.png). Lint and whitespace checks passed.
No full-suite/build rerun was needed for this CSS-only correction; the prior
214-test and production-build results above belong to the preceding refinement.
The development run also showed existing shared-footer Motion hydration style
warnings before the edit; these were not introduced by the spacing correction.

## Mobile intro alignment — 2026-10-27

Superseded trial: the owner meant vertical alignment in TOC rows. The intro
centering below and the subsequent horizontal TOC trial have both been reverted.

The owner requested centering like About. Matched About's below-768px identity
alignment for the project title, description, and Live site/Source action group.
Title and description use auto inline margins so their existing width caps remain
centered. Article copy retains its reading alignment.

Verified on the live development app at 390px and 320px: title/description are
centered and the action group's geometric center exactly matches the viewport
center (195px and 160px). At 768px/1440px the existing alignment is retained.
No horizontal overflow. Lint and whitespace checks passed. This small CSS change
did not require another full build or unit suite. Screenshots:
[390px](intro-centered-390.png), [320px](intro-centered-320.png). No commit.

## TOC vertical alignment correction — 2026-10-27

Matched About's align-items:center within each 44px navigation row. Project TOC
labels remain left-aligned; its line indicator no longer keeps the old mt-3
offset. Gap between rows remains 4px. Removed 16px bottom padding from the
responsive navigation before the bottom border; the external 32px distance to
the article heading remains intact. The incorrect intro/horizontal-centering
changes were removed.

Checked at 1440/768/390/320px: label and marker center offsets are both exactly
0px, controls remain 44px high, marker margin is 0px, text alignment is left,
intro alignment is start, and there is no horizontal page overflow. Responsive
navigation bottom padding is 0px and heading separation is 32px. Lint and
whitespace checks passed. Browser evidence:
[mobile](toc-vertical-390.png), [tablet](toc-vertical-768.png). No commit.
