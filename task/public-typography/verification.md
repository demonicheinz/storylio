# Public typography aligned with Home

2026-10-26. Local changes only; nothing staged, committed, or pushed.

## Result

The approved Home hierarchy now defines public typography through
`--public-type-*` variables in `src/app/globals.css`. One 768px breakpoint
controls page and section sizes. Existing route-specific sizes and redundant
Tailwind heading utilities have been removed from the public heading paths.

| Role | Below 768px | From 768px | Weight | Line height |
| --- | --- | --- | --- | --- |
| Page title | 40px | 56px | 600 | 1.15 / 1.1 |
| Section | 36px | 48px | 600 | 1.15 |
| Item / card / subheading | 22px | 22px | 500 | 1.25 |

Home keeps its approved sizes. About sections, article/case-study H2s, interface
details, related content, and continuation sections use shared SectionHeading.
Item titles include institutions, employers, skills, Markdown H3s, normal cards,
and previous/next cards. H1s use the same page tokens as Home's hero. All section
headings are plain foreground text: no slash prefix, decorative gradient bar,
colored word, or underline. Article copy-link buttons remain functional.

Documented exceptions preserve existing roles: compact Home stack heading at
22px, featured archive card at 28px below 1024px / 40px above, 28px empty-state
messages, and small navigation/TOC labels. The footer CTA keeps its existing
40/56px composition and 1.1 line height while referencing page-size tokens.

DESIGN.md now names each role, source token, breakpoint, and intended exception.
README documents the new cross-route browser check. Existing starfield changes
remain an uncommitted experiment; this task does not promote them into DESIGN.md.

## Verification

- Lint: 360 files pass. `git diff --check` passes.
- Production build: passes compilation, TypeScript, and all 36 generated pages.
- Vitest: all 22 files / 162 tests pass. First full run hit existing 15s import
  timeouts in Projects/Blog route-shell tests; isolated 17-test rerun and final
  complete suite pass without changing test timeouts or assertions.
- `tests/browser/public-typography.js`: 35 route/width comparisons against Home
  across 1440, 1024, 768, 390, and 320px. Covers both About languages, archives,
  project detail, article detail, role size/weight/family/leading/tracking/color,
  compact and featured roles, no heading decorations, and no horizontal overflow.
- Root-font check: at 20px root size, mobile roles grow to 50/45/27.5px, confirming
  rem scaling. Article heading copy action succeeds through keyboard activation.
- About browser regression passes centered mobile profile, left prose/language,
  sticky/native tablet sidebar, timeline alignment, keyboard anchors, and both
  languages' tablet TOC checks.
- Public browser regression passes collections, project TOC/screenshots/lightbox,
  article/share, gallery filter/lightbox, empty states, and cold missing-route 404s.
- Public smooth-scroll regression passes Lenis, anchor offset/focus, native nested
  sidebar scrolling, lightbox lock, and Back/Forward restoration. Auth/dashboard/
  preview redirect cases remain native; authenticated sessions were not exercised.
- Browser checks report no page errors. Actual About desktop/mobile screenshots
  were visually inspected. Browser coverage is Chromium.

Screenshots: [Desktop](about-desktop.png), [Mobile](about-mobile.png).
Local production preview is running at port 3101; automation session closed.

## Design and self-review

Design gate PASS: existing palette/fonts/content retained; plain hierarchy is the
requested direction, all controls remain functional, no fabricated content or
new visual assets, no heading overflow at tested widths, and no added animation.
Existing section spacing is preserved so the scale, rather than decoration,
expresses hierarchy. The inherited starfield experiment remains behind content.

| Axis | Score | Evidence and limit |
| --- | --- | --- |
| Accuracy | 4/5 | Build and rendered style comparisons pass; Chromium only. |
| Completeness | 4/5 | All requested roles/docs covered; owner visual approval remains pending. |
| Clarity | 4/5 | Tokens and exceptions documented; legacy generic Heading sizes still exist outside section role. |
| Actionability | 4/5 | Preview, screenshots, and reusable browser check provided; no commit requested. |
| Conciseness | 4/5 | Values centralized; role application still lives in the owning CSS modules. |

Average 4.0/5. Useful next review: confirm About's enlarged section hierarchy on
the owner's mobile device. Do not interpret successful tests as visual approval.
