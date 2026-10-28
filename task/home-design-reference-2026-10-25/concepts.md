# Landing comparison lab

24 October 2026. Four interactive concept pages, plus the requested navbar and public-prefetch corrections. The selected Home design remains the main page.

## Open the pages

The verified production preview runs on `http://localhost:3102`:

- `/design-preview`: comparison hub.
- `/design-preview/frame`: A, Frame. Centered introduction, structural rails, three-column work, sequential process and expandable journal.
- `/design-preview/studio`: B, Studio. Editorial split hero, project rows with expandable briefs, accordion-style process and restrained footer.
- `/design-preview/playground`: C, Playground. Work selector, previous/next controls, direct study selection and Base UI process tabs.
- `/design-preview/blueprint`: D, Blueprint. Wider frame, blue accents, `//` headings, a fan of reference covers, rotating title with pause control, work selection and process tabs. See [the follow-up record](BLUEPRINT.md).

The current Home remains at `/`. These routes also work on the user's normal dev server after the code reloads. They do not require a separate prototype server.

To launch a production preview from the repo root:

```powershell
bun run build
bun run start --port 3102
```

Stop the terminal server with Ctrl+C. Port 3100 was already occupied by an older process and was not terminated. The final verified build was started separately on 3102.

## Scope

- Comparison controls link all four pages. Each main action, disclosure, study selector, and process tab works within the sample.
- Content is explicitly illustrative, with a persistent Sample content label. Reference screenshots are marked Reference cover. They are not claims about Heinz's clients or published work.
- Same existing Clash Display/Satoshi/JetBrains Mono fonts. No new UI/runtime dependency added.
- Preview routes carry robots metadata and X-Robots-Tag noindex/nofollow/noarchive. This is search indexing control, not an access restriction; the examples contain no private data.
- No database/CMS/auth mutation or production deployment was performed.

## References and asset origin

- `.docs/referensi/landing`: border rails, measured container alignment, small frame junctions, work presentation. Blueprint also adapts the cover fan, rotating title and requested `//` labels. The source's neon glow, statistics, testimonial claims and mixed routing dependencies were not copied.
- `.docs/referensi/smooth-ui/logo-clouds.tsx.bak`: spacing and quiet grouped labels. The Frame toolkit row uses technology names, not a fabricated client-logo wall.
- Brave Dev tabs reviewed: Watermelon blocks, SmoothUI component catalog, Motion Primitives text-effect documentation, alongside earlier reference work. The pages adapt composition and interaction patterns with the existing stack; they are not represented as copied official components.
- `public/images/concepts/study-1.webp` through `study-3.webp` derive from the image URLs in the supplied landing hero: `https://assets.watermelon.sh/lp-hero-01.avif`, `lp-hero-02.avif`, `lp-hero-03.avif`. Resized to a maximum of 1200px and encoded as WebP. Files are reference covers, not new original portfolio assets or a license claim.
- Astronaut image is the already adopted `public/images/home-hero.avif`. No generated raster or new logo was created.

## Navbar and prefetch fix

The production navbar frame padding is now 2px, giving a measured 48px total height while retaining 44px link hit areas. Centered position, frame, Gooey interaction and scroll-direction behavior remain.

The prior configuration had cacheComponents enabled and global partialPrefetching disabled, while Gooey links explicitly requested full prefetch. This combination produced the reported dynamic-data insight. Public layout now exports `prefetch = "partial"` for incremental adoption, preserving explicit full/per-link prefetch for cached URL-dependent content. Dashboard/auth were not opted into the new policy.

The development check then identified URL reads outside server Suspense. Public list/detail pages now put their URL-dependent content inside server Suspense with the existing route-appropriate PublicPageSkeleton variants. Query, filter, cache/revalidation, metadata and page markup are otherwise preserved. No `instant = false` bypass or validation suppression was added.

Docs checked: installed Next.js 16.4.2 guides on adopting Partial Prefetching and the route prefetch export, plus official documentation through Context7. In the live development app, About/Projects/Blog/Gallery/Home were revisited after the correction without the reported insight dialogs. About completed and the navbar measured 48px.

## Initial A–C validation

- Production build: 40/40 routes, including TypeScript, passed.
- Lint and git diff --check passed. Vitest: 55 tests / 10 files passed in this task.
- Concept pages and chooser tested at 1440, 768, 390 and 320px. No document overflow; first-viewport images loaded; no page errors.
- Frame study selection and reading disclosures, Studio briefs/process disclosures, Playground previous/next/direct selection, Base UI keyboard tabs, anchors and reduced motion passed.
- Preview response noindex header verified.
- Public navigation regression passed. On the second round, all visited routes reused content without skeleton or new navigation RSC requests. First visits may still show loading while initial prefetch is incomplete.
- About language regression passed with an injected 800ms RSC delay: language changes measured 89/61/57ms, with no navigation request in those measured transitions.
- Stack/topic filter hover, focus, reset and query preservation passed.
- Each public regression ran in its own browser context. An earlier sequential same-context attempt hit an already-handled request during delayed-handler cleanup; that was an orchestration issue, not a weakened test assertion.
- The navigation test now scopes About and other links to Main navigation, because Footer also contains links with those names.

## Review disposition

Ready for concept comparison, not an automatic replacement of Home. Review was inline, not independent. The first capture pass found canvas overflow at 320px; the concept root now provides the clipping/positioning context, and all widths passed the confirmation pass.

Detector ran once: 105 advisory differences from the root Framer reference (61 colors, 38 font sizes, 6 radii). These were reviewed against the user-approved existing fonts, deliberately different concept compositions, and reused sample artwork. The detector is not a WCAG or performance certification.

Hard/purpose gate PASS within this prototype scope: declared sample content, sourced reference artwork, no invented customer proof, working controls, stable SSR markup, named navigation, visible keyboard focus, responsive layout and reduced-motion checks. Background lines are limited to Frame's actual container/section alignment. No new all-page grid, glow, or continuous background animation was added.

Self-review: accuracy 4/5 (bounded runtime evidence, not a whole-app performance/contrast audit); completeness 4/5 (three working pages and the requested fixes, final portfolio content intentionally pending); clarity 4/5 (sample/reference labels); actionability 4/5 (live routes and evidence); conciseness 4/5 (details stored here). Average 4.0/5.

Evidence: `evidence/result.json`, `evidence/regressions.json`, `evidence/detector.json`, and the desktop/mobile PNG captures.
