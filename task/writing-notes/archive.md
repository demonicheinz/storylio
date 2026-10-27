# Writing archive — first slice

Uniform 3/2/1 card grid, natural two-line title limit, three-line excerpt,
publication/read-time metadata, three visible topics plus overflow count, cover
tilt only, and one Flow Read article link. Writing and Notes use distinct pools
from the existing Post/notes tag model; drafts and scheduled content are hidden.

The owner selected a searchable popover matching Projects rather than the first
native-select version. Shared BeUI primitives now support an opt-in single mode
and configurable labels. Single selection replaces the prior topic, closes the
panel safely, and returns focus. Projects retains multiple selection by default.
The closed portal stays mounted for measurement; tests check inert/expanded
state rather than mistaking clipped descendants for a still-open panel.

Six rows per page are fetched with SQL limit/offset and stable date/id ordering.
Argument-free cached published metadata supplies facets and filtered counts;
unknown topics produce zero results before row caching, and page numbers are
clamped before being keyed. Shared archive pagination preserves Projects' public
API and labels. Dashboard pagination remains untouched in lib/pagination.ts;
the archive helpers live in a separate archive-pagination.ts module.

Validation: 39 targeted tests across six suites passed, with additional targeted
checks after filter changes. TypeScript, lint (413 files), whitespace check,
production build (36 routes), and one detector scan passed. Browser archive
checks passed 1440/1024/768/390/320px, single selection/replacement/search/reset,
query preservation, page reset, Back/Forward, Notes view and unknown-tag empty
state. Existing Projects browser checks passed AND filters, reset, keyboard,
history and safe focus. Back/Forward tests now wait for restored UI as well as URL.
Actual multi-page data is verified with isolated PGlite fixtures, not CMS writes.

Dependency audit ran before commit and reports two existing high advisories:
body-parser 2.3.0 via shadcn/MCP tooling, and Zod 4.4.3. No dependency files were
changed or automatic upgrades performed. This audit is not a clean security pass.

Screenshots: [desktop](archive-1440.png), [mobile](archive-390.png).
The next slices adapt article detail and replace note archive/Home links with
the approved complete reading dialog. No push or production data writes.
