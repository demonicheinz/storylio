# Article reading — second slice

Projects and articles now use one reading CSS module: 640px prose measure inside
a wider code/media column, 18px desktop / 16px mobile body text, 44px heading
copy targets and mobile word wrapping. TOC uses the approved 44px rows, 4px gap,
vertical text/marker centering, collapsed small-screen disclosure and 32px gap
before the reading body. The extraction includes sufficient specificity to work
with both development and production CSS ordering.

Article covers precede secondary metadata below 768px. Dates, views and topics
remain visible, share controls retain existing behavior, and neighbor links span
their available row without empty placeholders. Related articles and Continue
reading have distinct labels. Companion queries exclude the reserved Notes tag,
using the same publication/category predicate as the writing archive.

Validated: 21 unit/route-shell tests, TypeScript, lint (417 files), whitespace,
production build (36 routes), and one detector scan passed. Five-viewport article
browser checks passed 1440/1024/768/390/320px, cover ordering, 44px targets,
640px measure and correct hash/focus/112px anchor offsets. A missing article
retains HTTP 404. Existing Project detail browser suite also passed all viewport,
normal/reduced-motion, anchor, lightbox and focus checks after the extraction.

The Project regression initially exposed heading CSS ordering at 320px; the
shared mobile heading selector now wins over the base heading grid so the
Implementation word stays intact. This final CSS correction was browser-verified.

Screenshots: [desktop](article-1440.png), [mobile](article-390.png).
No CMS edits, schema changes or push. Dependency advisories remain as recorded
in archive.md; package manifests and locks have not changed.
