# Expandable Notes — third slice

Home and the existing ?tag=notes archive now share a complete reading dialog.
The current three/six note bodies are server-rendered by the existing cached MDX
pipeline, then passed as React children to a client interaction shell. There is
no new database table, live seed, client MDX evaluator, HTML endpoint, or full-page
CTA. Title, date, full body, close and copy-link controls are available.

The Base UI dialog owns focus trapping, Escape/backdrop dismissal, and document
scroll locking. A restrained Motion shared-layout expansion connects the card
to its panel; reduced motion omits the spatial transition. Lenis is separately
locked until dialog closing completes. Focus returns to the originating card;
direct links use the Notes/list container as a fallback. Body scrolling stays
native, code blocks retain their own scroll behavior, and in-note anchors scroll
only the note body.

Opening on Home updates its note query in place. The canonical copied link is
/blog?tag=notes&note=<slug>. Back/Forward controls opening/closing, while direct-
link close removes only the note query and preserves unrelated state. Legacy
/blog/<note-slug> URLs redirect to the dialog link. Deep-linked notes may be
outside the current archive page: published Notes facets validate the slug before
a cached lookup by known public ID. Unknown, article, draft and scheduled slugs
never enter that row cache. Unavailable notes have a closeable empty state.

Validation: full Vitest passed 36 files / 231 tests, including URL and PGlite
publication/unknown-input checks. TypeScript, lint (424 files), whitespace,
production build (36 routes), and one detector scan passed. Home is now partially
prerendered because its URL-dependent Notes section is isolated behind Suspense;
its existing cached hero/other content remain outside that runtime boundary.

Production and development browser checks passed 1440x1000, 768x1024, 390x844,
320x740 and 844x390: dialog bounds, full body, 44px close, keyboard containment,
focus and background-scroll restoration, Back/Forward, direct and legacy URLs,
unknown-note state, Home in-place opening and Lenis pause/resume. Copy output was
verified with a browser clipboard stub, without touching the user's clipboard.
Physical assistive technology and no-JavaScript reading were not tested.

Screenshots: [desktop](note-1440.png), [mobile](note-390.png).
No CMS edits or push. The dependency audit's two existing high advisories remain
recorded in archive.md; dependencies were not changed in this design task.
