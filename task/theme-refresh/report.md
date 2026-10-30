# Theme refresh verification

Date: October 24, 2026

Updated `DESIGN.md` and `src/app/globals.css` for the supplied six-color planet
palette. Existing locally hosted Clash Display, Satoshi, and JetBrains Mono font
files and loading configuration are preserved. The image itself is unchanged.

## Changes

- Fixed palette samples plus semantic light/dark mappings for surfaces, text,
  actions, interaction fills, sidebar, charts, focus, and status colors.
- Dark primary controls use navy labels; light primary controls use the darker
  blue with pale labels. A shared default button/linked-badge hover rule uses an
  opaque semantic hover fill instead of the existing translucent primary utility.
- Explicit 4/6/8/12/16/24/32/48px radius scale, shared Clash Display section
  headings, themed text selection/caret, quiet scrollbars, and token-based
  article callouts. Native controls inherit the active color scheme.
- Replaced the original Linear reference document with Storylio-specific roles,
  typography, geometry, component recipes, hero guidance, and adoption status.

## Checks

- `bun run test`: 10 test files and 55 tests passed.
- `bun lint src/app/globals.css`: passed after formatting.
- `git diff --check`: passed.
- Installed PostCSS/Tailwind compilation of the real global stylesheet: passed.
- Parsed DESIGN front matter and resolved its token references; all six supplied
  palette values are present in runtime CSS.
- Isolated Chromium token preview at 1440px desktop and 390px mobile, light and
  dark: no horizontal overflow; all three local fonts loaded; eight computed
  radius values matched the documented scale.
- 33 computed contrast pairs per theme checked using browser sRGB rendering.
  Lowest checked text contrast: 5.48:1 dark, 4.56:1 light. Lowest checked input/
  focus contrast: 3.08:1 dark, 3.19:1 light.
- Primary semantic and legacy default-button hovers resolve to the same opaque
  fill: label contrast 9.97:1 dark and 6.61:1 light.
- Initial design-detector findings on the existing article checkbox/callout
  radii and thick callout edge were resolved with the documented radius tokens
  and a uniform border.

The contrast check covers solid token pairs and a composited tip-callout label.
It is not an accessibility audit of the application. The preview uses real
compiled CSS and fonts with diagnostic HTML, rather than the Next.js pages.
No production build, live database, or real credentials were needed. The preview
had an unrelated missing favicon request and canvas readback performance notices;
the final check recorded no page JavaScript errors.

## Remaining adoption

The hero image is not wired into the home page. Fixed purple gradients/shadows,
fixed text colors, explicit component radii, transparent panels, and existing
focus-ring opacity still require component-level migration and page verification.
The application still selects dark mode in its root layout. Temporary scripts
and preview images are under `.tmp/theme-refresh/`.

## Self-review

| Axis | Score | Evidence / improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Exact samples, parsed design references, compiled CSS, browser measurements; full pages were not exercised. |
| Completeness | 4/5 | Both requested files updated; component migration and hero integration are explicitly documented follow-ups. |
| Clarity | 5/5 | Document distinguishes fixed samples, semantic roles, runtime tokens, and recipes. |
| Actionability | 5/5 | Runtime changes are applied; adoption list identifies specific remaining component patterns. |
| Conciseness | 4/5 | Original reference shortened and made project-specific; duplicated token tables require maintenance. |

Overall: 4.4/5. Highest-value follow-ups are migrating fixed component colors,
then verifying the actual hero and dense dashboard/editor surfaces. The user can
review the two requested files independently of the diagnostic preview.
