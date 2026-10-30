# Article opening: full container width

The earlier 720px introduction experiment in f770bf5 misinterpreted the owner's
feedback and is superseded. The article header and metadata now span the same
container as the wide cover, following the Project detail opening alignment.
Shared title and excerpt measures remain intact; the article prose keeps its
separate reading width. Mobile retains cover-before-metadata ordering.

Browser verification passed at 1440, 1024, 768, 390, and 320px. Header, metadata,
and cover widths match at 1280, 976, 720, 358, and 288px respectively, with zero
horizontal offset and no page overflow. Desktop prose remains 640px wide.
TOC alignment, anchor focus/offset, 44px copy controls, and missing article HTTP
404 passed. Desktop/mobile screenshots were updated and visually inspected.
Targeted Biome lint passed. The full suite/build reported previously were not
repeated for this CSS correction; the commit hook checks TypeScript.

Self-evaluation: accuracy 5 (browser measurements), completeness 5 (corrected
alignment and regression checks), clarity 5 (scope stated), actionability 5
(local implementation and screenshots), conciseness 5 (focused correction).
