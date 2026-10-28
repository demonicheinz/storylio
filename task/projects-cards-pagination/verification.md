# Uniform project cards and pagination

Implemented locally without staging, commit, push, live seed changes, or schema
migrations. Existing Projects multi-select work remains included in the pending
working tree. Production preview runs on port 3102.

## Result

- All projects share the 3/2/1 grid and cover-first card layout. Featured projects
  sort first and display a small navy/blue Featured badge on the cover. Every card
  title stays at the 22px item role; the featured-wide layout is no longer used.
- TiltedCard listens on the containing link or explicit `data-tilt-target` card.
  This restores cover motion on Projects without reintroducing duplicate internal
  links. Only the cover moves; text/actions stay still. Touch/reduced motion remain
  static. Home's existing parent-link behavior is preserved.
- Read case study uses FlowButton adapted from the supplied local reference.
  It remains a real Link, with fixed 8px radius, Satoshi 14px/500, 44px target,
  exchanged arrows, and a blue circular hover/focus sweep. Reduced motion removes
  movement. Live/source links and demo content/assets remain unchanged.
- Public data loading moved into `getPublicProjects`: native filtered count plus
  relational query limit 6/offset. Ordering is featured descending, CMS order,
  creation date descending, then unique id. Only published projects qualify.
  Technology facets stay independent of the current page/filter.
- Page is URL-backed with all selected technologies and unrelated parameters
  preserved. Filter changes/reset remove page. Invalid pages normalize to 1;
  out-of-range pages clamp to the last available page. Empty results remain empty.
- Pagination hides for <=6 matches, shows the item range and numbered controls on
  larger screens, and compacts to previous/current-total/next on mobile. Controls
  are >=44px. Explicit page links focus/scroll to Project results at 112px offset;
  Back/Forward is not overridden by that effect.
- DESIGN.md, cache policy, README and browser checks describe the new roles and
  behavior. No overall font-scale, palette, navbar or footer redesign.

## Verification

- PASS lint: 383 files, and git diff --check.
- PASS production build including TypeScript and all 36 generated pages.
- PASS full Vitest suite: 28 files / 193 tests.
- New page helper tests cover malformed pages, clamping, ranges, compact page
  numbers, repeated stack parameters, and filter/page reset.
- PGlite integration uses fourteen published projects plus a draft, without live
  credentials. Actual queries return 6/6/2, exclude drafts, sort featured first,
  maintain unique non-overlapping pages under tied timestamps/order, and apply
  the same AND condition to both count and rows. Empty/out-of-range cases pass.
- Pagination markup tests verify hidden controls for one page, current-page state,
  disabled previous control, range text, and query-preserving next links.
- Projects browser suite passes at 1440/1024/768/390/320px: equal card widths,
  22px titles, 3/2/1 columns, no horizontal overflow, one internal action per card,
  compact X reset, AND results, empty recovery, history and keyboard navigation.
- Motion browser check passes actual cover transforms with stable title geometry,
  Flow hover arrow exchange without size/radius changes, visible keyboard focus,
  reduced-motion static state, hidden pagination for the current three demo items,
  page clamping and filter-driven page reset. The initial tilt measurement was
  taken during entrance animation; the check now waits for entrance completion
  before comparing cover-only motion.
- Filter/prefetch regression passes Projects query/scroll preservation and Blog
  hover/focus caching. Cross-route public typography and public integration suites
  also pass, including detail TOC/lightbox, gallery, empty filters and HTTP 404s.
- Screenshots inspected in desktop and mobile; final neutral-state captures:
  [Desktop](desktop.png), [Mobile](mobile.png).

Limitations: browser coverage is Chromium. The live demo collection has only three
projects, so browser checks cannot click between real result pages; multi-page
data correctness is verified with PGlite and UI link/range output with SSR tests.
The paging scroll/focus effect is implemented, but a live multi-page click-through
has not been exercised. No data was added merely to make pagination appear.

## Design gate and self-review

PASS scoped implementation: existing typography/palette retained; real demo data
and links preserved; Featured is tied to actual saved state; stable card geometry,
real navigation controls, keyboard focus, minimum targets, no overflow, and
reduced-motion behavior are verified. Visual approval remains with the owner.

Accuracy 4/5 (actual SQL + browser motion checks; no live multi-page click-through);
completeness 4/5 (all requested components and pagination implemented, real data
kept unchanged); clarity 4/5 (roles/URL semantics documented); actionability 4/5
(running preview, screenshots and test commands; no commit); conciseness 4/5
(shared button and existing tilt/pagination primitives reused). Mean 4.0/5.
Next useful check after the collection grows is a real next-page click followed
by Back/Forward, confirming scroll restoration on the owner's target browser.

## Card density follow-up

Requested limits are now scoped to ProjectCard: first three technologies in saved
order plus an accessible, noninteractive +N count; titles clamp to two lines;
descriptions clamp to three. Both standard and WebKit line-clamp declarations
are present. The two-/three-line slots are reserved for short/empty content too,
keeping technology rows aligned. Empty descriptions reserve visual space without
exposing an empty paragraph to assistive technology. Full saved strings stay in
the DOM, and no CMS or filter/query logic was changed.

PASS: nine ProjectCard SSR tests, including an initially failing stack-overflow
case; lint (384 files); production build including TypeScript and 36 generated
pages; whitespace check. Browser-only long-content fixtures passed at
1440/768/390/320px, including long unbroken titles, short text, empty descriptions,
aligned tag positions, no horizontal overflow and unchanged full text. A hidden
technology (Tailwind CSS) remained selectable and matched Storylio together with
Next.js through the full saved stack. No page errors. The broader unit suite was
not rerun for this scoped display-only follow-up; its earlier 193-test result
above belongs to the preceding implementation.

DESIGN.md and README now document the limits and browser check. Actual-content
desktop/mobile and synthetic long-text captures were inspected. Current examples:
[Card density desktop](card-density-desktop.png),
[Card density mobile](card-density-mobile.png),
[Synthetic long-text fixture](card-density-long-mobile.png).
Preview remains on port 3102. Browser session closed; no staging or commit.

## Natural title height — 2026-10-27

Supersedes the reserved two-line title slot above: titles still clamp at two
lines but no longer reserve an empty second line. Descriptions follow at 16px;
the technology list takes auto top margin and the action row follows at 16px,
aligning footers within a grid row. Home already has natural title height and
12px summary spacing, so no Home changes were needed for this issue.

Nine ProjectCard tests, lint, production build with TypeScript, and the browser
content check passed. Browser checks cover 1440/768/390/320px, mixed short/long
titles, empty descriptions, natural one-line height, 16px description gaps,
aligned row footers, no horizontal overflow, full-stack filtering and zero page
errors. The DOM-only fixture now exercises the hydrated filter before editing
text, avoiding a hydration mismatch caused by prematurely replacing server text.
Desktop/mobile captures were inspected: [desktop](title-spacing-1440.png) and
[mobile](title-spacing-390.png). No commit.

Self-evaluation: accuracy 5, completeness 5, clarity 5, actionability 5,
conciseness 4 (verification includes synthetic fixture detail kept out of the
user response), average 4.8/5. Future improvement: keep the report short when no
new edge cases arise. Claims are limited to the tested viewports and fixtures.
