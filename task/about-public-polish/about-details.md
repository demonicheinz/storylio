# About control and timeline refinement

2026-10-26

- Reuse Gooey Nav for language selection with smaller particles, a quiet surface,
  accessible navigation naming, and `scroll={false}`. The route controls selection;
  full prefetch and keyboard navigation remain available.
- Connect timeline dots with per-item segments. No segment precedes the first dot
  or follows the last; segments and dots share the same horizontal center.
- Use Education & Learning / Pendidikan & Pembelajaran for formal and informal
  learning. Preserve the existing education-history anchor for incoming links.
- Follow project detail TOC behavior: expand the active indicator from 16px to
  24px in normal flow. Keep About font size, 12px gap, 4px item spacing, and 44px
  target height. Do not translate links outside the sidebar. Reduced motion skips
  transitions.

## Verification

- PASS: lint (356 files), standalone TypeScript check, production build (36 pages),
  and git diff whitespace check.
- PASS: browser About checks at 1440, 1024, 768, 390, and 320px; centered mobile
  identity, left-aligned language and prose, tablet sticky/native sidebar scroll,
  timeline alignment, and keyboard anchors. No page errors.
- PASS: every TOC item activated at 768x600 in both languages without sidebar or
  page horizontal overflow. Visually inspected active Indonesian education item
  after smooth scrolling finished. Normal-flow indicator grows; link has no
  transform.
- PASS: language switches completed in 46-67ms with an injected 800ms RSC delay,
  zero navigation requests, and preserved scroll position.
- PASS: actual WebGL language renderer, Enter activation, selected language, and
  44px link heights. Reduced-motion CSS fallback also covered by About checks.
- PASS: incumbent palette, fonts, content, and layout retained. Motion is confined
  to existing selection feedback; no new decorative effects or invented content.

Local screenshots: `.playwright-cli/about-polish-1440.png`,
`.playwright-cli/about-polish-390.png`, `.playwright-cli/about-toc-tablet.png`.

Existing dependency audit findings remain: body-parser 2.3.0 and zod 4.4.3 have
high advisories. This change does not alter dependencies. DESIGN.md is unchanged.

## Self-review

| Axis | Score | Evidence / improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Build and actual renderer verified; browser coverage is Chromium only. |
| Completeness | 4/5 | All four refinements covered; visual approval belongs to the owner. |
| Clarity | 4/5 | Specific behavior and checks documented; no motion recording included. |
| Actionability | 4/5 | Existing browser regression updated; screenshots are local artifacts. |
| Conciseness | 4/5 | Focused diff; verification report could be shorter. |

Overall: 4.0/5. Highest-value follow-up: owner review of the corrected tablet TOC.
The owner's rejection of translated links informed the final normal-flow version;
the implementation is verified but visual approval is not assumed.
