# Home redesign â€” implementation

October 25, 2026. Scope: Home, based on the approved plan and supplied references.
The user approved the Venom CTA before this work and requested a visibly distinct
dark navy footer during implementation.

## Delivered

- Planet hero uses the existing AVIF, preserved headline and CMS bio, existing
  Clash Display/Satoshi fonts, and the approved Venom link to About.
  Mobile puts the photo lower so the text stays above the bright horizon;
  responsive image sizes account for cover cropping on portrait screens.
- A near-black canvas and quiet surfaces are scoped to Home. The user's existing
  globals.css background edit is preserved. The Home footer uses planet-night navy;
  its light variant uses surface-2.
- Maximum three published projects, ordered as before; projects and writing use
  a matching 1280px container, 24px gutters, and 3/2/1 columns.
  Home cover variants use neutral missing-image labels rather than fake previews.
- Approach is a readable ordered list, keeping CMS phase content and order.
  The previous canvas cards and MagicButton phase decorations are removed here.
- Technology cloud adapts the supplied one-shot wipe. CMS labels are curated and
  deduplicated; five bundled Simple Icons SVGs have their CC0 license and provenance.
  The technology name remains visible through image failures.
- Notes replace testimonials in the Home composition. Published posts with the
  exact tag `notes` are selected separately from other articles, before LIMIT.
  Empty notes are hidden. No posts were created/retagged, no external DB writes
  or migrations were performed, and testimonial data remains intact.
- Home footer uses the supplied column/wordmark layout, real profile contacts,
  curtain reveal, wordmark parallax and a small stagger. ResizeObserver measures
  content; fixed reveal is enabled only when it fits a sufficiently wide/tall
  viewport. Short/mobile/reduced-motion layouts stay in normal flow.
  Focus entering clipped footer links reveals the wrapper; Back to top returns
  focus to the title. Other public routes keep their existing footer.
- Home opts out of the global route opacity/translation entrance via a scoped
  selector. This avoids an extra blank entrance and transformed containing block
  around the fixed footer. Other routes keep their original transition.

## Verification

- `bun run typecheck`: passed.
- Production `bun run build`: passed, 36 generated pages, Home prerendered,
  Cache Components and Partial Prefetching still enabled. The AVIF is referenced
  by public URL to avoid Turbopack's static-import warning.
- `bun run test --no-file-parallelism`: **119/119 passed**, 16 files, 61.8 seconds.
  The ordinary parallel command twice hit the existing Projects route-shell
  import timeout (118/119). The route-shell file passed separately (17/17).
  No assertions or timeout values were loosened.
- Targeted Biome: 22 files passed; `git diff --check` passed.
- `test:browser:home`: passed against the existing local app, with no page errors.
  1440Ã—1000, 1024Ã—900, 768Ã—1024, 390Ã—844, 320Ã—740, 1440Ã—600:
  no horizontal overflow, maximum three projects, correct grid columns,
  44px CTA, and phase descriptions visible without interaction.
- Light/dark, live reduced motion, keyboard footer focus, native touch About
  navigation, failed image requests, Home â†’ Projects â†’ Back footer scoping, and
  missing blog slug HTTP 404 passed. Scenarios close their own pages/contexts.
- SSR markup contains the title, link and footer, with static fallback styles.
  **This is not a no-JavaScript usability pass:** the existing Next streaming shell
  emits content in hidden slots that need its bootstrap to attach them. A probe
  exposed this limitation; the test explicitly checks markup, not full visibility.
- The manual design detector reported three advisory type findings:
  36px/48px are the documented existing heading helper; 280px is the decorative
  reference wordmark exception now documented in DESIGN.md. No detector errors.
- Code review was performed inline, not by an independent reviewer.
  No GPU FPS, cross-browser certification, or whole-site accessibility claim.

## Evidence and limitations

Screenshots in `evidence/` are from the local developer dataset. Desktop footer
has a separate capture because fixed reveal content is not represented faithfully
in a top-of-page full-page screenshot. The first desktop measurement can show
normal flow before ResizeObserver enables the fitting curtain.

The developer dataset contains demo project/article images and currently no
published notes. The layout does not fabricate replacement case studies or notes.
See content-guide.md to add real notes and manage technology entries.

No commit, push, deploy, favicon change, or unrelated-page redesign was made.
The earlier Venom implementation remains part of the preexisting working tree.

## Self-review

| Axis | Score | Evidence / next improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Build, query fixtures and browser checks pass; no native GPU or Safari testing. |
| Completeness | 4/5 | All requested sections are implemented; notes need the owner's actual content. |
| Clarity | 4/5 | Content conventions and limitations are documented; this report is intentionally technical. |
| Actionability | 5/5 | Live local preview, reproducible browser command and editor guide are available. |
| Conciseness | 4/5 | Details stay in task artifacts; chat delivery remains brief. |

Overall 4.2/5. Next useful review is the owner's assessment of the actual Home
composition and real note content; further automatic polish is not necessary.
