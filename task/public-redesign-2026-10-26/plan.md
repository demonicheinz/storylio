# Public redesign

The owner approved Home and authorized autonomous redesign of all public pages,
with a local commit after each completed portion. Home is the visual authority;
the new pages extend its existing system rather than proposing a different world.

## Scope and sequence

1. Commit accepted Lenis integration (`4ff3f1e`, complete).
2. Shared public canvas, type/spacing recipes and approved footer on all routes.
3. About: profile and readable bilingual story, principles, experience, education,
   and skills. Preserve language query/prefetch, real CMS content and anchors.
4. Projects: featured case study, three-column archive and stack filters; detail
   layout, screenshots, TOC and adjacent navigation.
5. Blog: featured writing, archive and topic filters; article reading layout,
   cover, metadata, TOC, related writing, share and adjacent navigation.
6. Gallery: image-first masonry, category controls, captions and lightbox.
7. Loading, empty, error and not-found states; final navigation and regressions.

Use near-black navy canvas, quiet blue surfaces, hairline borders, Clash Display
and Satoshi, and the existing restrained whole-section MotionReveal. Keep the
approved Home hero/CTA and motion untouched. No repeated planets, purple glows,
decorative metric cards or fabricated claims. Lenis remains scoped to Home.
Desktop content caps at 1280px; body reading columns remain about 65–75ch.

## Verification and commits

Each portion gets focused formatting, TypeScript and relevant browser checks
before its local commit. Inspect representative desktop/mobile screenshots;
preserve publication checks, query parameters, lazy images and native links.
Final production build and browser regressions check navigation, focus, filters,
missing-detail HTTP 404, Home, and touch/reduced motion. No push or deployment.
Existing Vitest route-shell import timeout and dependency advisories are recorded
in the Lenis report; avoid broad unrelated changes to mask them.
