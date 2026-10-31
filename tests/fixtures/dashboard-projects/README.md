# Dashboard Projects fixture

Uses real Projects manager/editor/upload components, shared controls and project
fonts/CSS. Its 85 projects are synthetic; actions and uploads are local stubs.
It never writes CMS records or uploads files externally.

Start from the repository root:

```powershell
bun tests/fixtures/dashboard-projects/serve.mjs
```

In another terminal:

```powershell
bunx --no-install playwright-cli -s=projects-polish open http://127.0.0.1:3197 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/dashboard-projects.js
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/projects-reorder.js
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/projects-batch-actions.js
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/collection-selection-keyboard.js
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/drawer-handle.js
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/project-list-presentation.js
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/projects-mobile-toolbar.js
bunx --no-install playwright-cli -s=projects-polish close
```

Stop the fixture with Ctrl+C. Screenshots go to
`task/dashboard-projects-review/updated-*` and `drawer-handle-390.png`.

Fixture views: `/` for the manager, `?editor=create`, `?editor=draft`,
`?editor=published`, `?upload`, and `?handle=down|up|left|right`.

The browser suite covers direct edit links, selection across pages, title width,
pagination, restored reorder context, aligned filter heights, mobile multi-select
search and Escape, staged filter reset, editor reading order, saved preview,
dirty-link protection, and disabled/concurrent screenshot drops. Drawer tests
measure the shared handle and exercise swipe dismissal in all four directions.

The session router/filter and write endpoints are mocked. Production publication
validation/atomicity and authentication use PGlite integration tests in
`tests/database/project-batch-publish.test.ts`; this fixture is not an
authenticated end-to-end test.

`projects-reorder.js` uses keyboard sorting to verify failed-write rollback,
successful full-collection ordering and a canonical 85-item payload. It also
checks that passive lists have no handles and batch titles do not navigate.
The test waits for a handle to become enabled before sending keyboard input.

`projects-batch-actions.js` verifies page selection/deselection, empty-selection
guards, cancelled deletion, and the exact selected IDs passed to publish, draft
and confirmed delete actions at 1440/320px. These are mocked writes.

For populated media/tag and toolbar consistency checks, also start
`bun tests/fixtures/dashboard-about/serve.mjs` in another terminal (port 3196),
then run:

```powershell
bunx --no-install playwright-cli -s=projects-polish run-code --filename=tests/browser/project-editor-consistency.js
```

This compares actual About/Projects toolbar actions, measures eight tags at all
five viewport widths, checks opaque labelled image removal, tests full-height
screenshot rail geometry and keyboard ordering, and verifies the tablet link
fields follow the full-width stack. The `?editor=draft&media` view supplies local
SVG previews and eight technologies for these checks.
