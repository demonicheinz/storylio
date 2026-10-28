# Writing archive and articles

Replaced metric/glow layouts with a latest-post feature, 3/2/1 archive and wrapped
topic filters. Coverless notes use a text-led feature/card instead of a fabricated
image. Dates, topics, excerpts and reading time remain from CMS records.

Articles use the shared title scale, a centered introduction, publication details,
optional cover and a bounded reading column with the quiet shared TOC. Related
writing reuses archive cards. Adjacent articles and share actions remain; the
progress line now uses the theme link color. Query/cache/publication/404 logic
is unchanged. Reduced-motion CSS also covers the route wrapper so fresh streamed
article content does not wait behind an opacity transition.

TypeScript and lint passed. Archive and a coverless note passed four viewport
checks (1440/768/390/320), one H1/footer, no overflow and keyboard back-to-top.
Desktop/mobile screenshots were inspected. The notes filter opens the expected
tagged article; production filter-prefetch and HTTP checks follow in the final
verification portion.
