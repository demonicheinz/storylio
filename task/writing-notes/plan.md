# Writing and Notes implementation

Owner authorized implementation and local commits per section; no push.

1. Writing archive: uniform cards, single-topic filter, six-item SQL pagination,
   distinct Notes archive at the existing ?tag=notes URL, validated cache inputs.
   Reuse pagination mechanics without changing Project URLs or controls.
2. Article detail: shared reading rhythm, responsive TOC, early mobile cover,
   vertically centered TOC rows and 44px copy targets; preserve HTTP 404 guard.
3. Notes: complete expandable reading dialog on Home and Notes archive, close/copy
   actions, permalink and history, focus restoration and Lenis lock. No full-page
   button. Keep the existing Post/tag CMS, publication policy and old post URLs.

Keep approved Home composition outside Notes, fonts, palette, navbar, footer,
and supplied content. No live seed/database writes. Evidence belongs here;
temporary probes and commit-message files belong under .tmp/writing-notes/.

Notes architecture for the third slice:

- Keep `?tag=notes` as the archive; canonical shared links use
  `/blog?tag=notes&note=<slug>`. Home opens `?note=<slug>` in place through native
  history, with no full-page button. Server-render MDX and pass React children to
  the accessible Base UI dialog; do not add a client MDX evaluator or raw HTML API.
- Pre-render the small current page of note bodies for instant opening. A valid
  off-page/deep-linked note is fetched separately after validating its slug against
  cached published Notes facets; cache row lookups by a known public ID. Unknown,
  draft and scheduled notes never return private content.
- Controlled dialog follows URL state for Back/Forward. Opening pushes one local
  history entry with a custom marker (do not copy Next __NA into external history
  data). Closing an entry opened by a card goes Back; closing a direct link removes
  only note via replaceState. Preserve page/tag/unrelated params and background
  scroll. Lock Lenis until close animation completes; restore focus to the card.
- Use current Dialog primitives for focus trap/Escape/backdrop handling and a
  restrained Motion shared-layout expansion, reduced-motion fallback, 44px close,
  copy permalink and title/date/full body. No forced cover image, masked body, or
  Open full page action. Keep Notes archive and Home using one component.
- Preserve old `/blog/<note-slug>` URLs by redirecting tagged Notes to the
  canonical dialog permalink; keep normal article URLs and proxy 404 guard.
- Home URL-dependent Notes work stays behind Suspense, preserving its existing
  cached hero/content. Blog archive selected-note read stays below its route shell.

Audit run found existing high advisories for body-parser 2.3.0 (shadcn dependency)
and Zod 4.4.3. Package manifests/lockfiles are unchanged; do not silently expand
this design task into dependency upgrades. Report this material limitation.
