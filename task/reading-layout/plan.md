# Reading layout and long TOC

Approved direction: widen the Blog/Project reading frame from 1008px to 1160px, with 840px media/code column, 272px TOC and 48px gutter. Keep paragraphs at 680px. Tablet single-column frame can use 840px; mobile padding and collapsed TOC remain.

Keep markers on every item as explicitly requested. Use a stable marker gutter, vertical active marker and horizontal inactive markers. Align wrapped titles to the top, use 21px text lines and consistent item spacing. Project TOC becomes “On this page” without the helper description, matching Blog.

Implementation: shared reading CSS, shared ContentToc markup/CSS, ProjectToc copy. Verify responsive widths, long wrapping, active markers without text shifting, keyboard disclosure/anchor navigation and existing controls. Preserve unrelated SEO/screenshot changes. No deployment or CMS changes.
