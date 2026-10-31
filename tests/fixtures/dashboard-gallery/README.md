# Dashboard Gallery fixture

Uses the actual Gallery manager, editor, uploader, shared components, CSS and
local fonts with 125 synthetic images. Actions, uploads and router refresh are
browser-memory stubs; no database, authentication or external storage is used.

Run from the repository root:

```powershell
bun tests/fixtures/dashboard-gallery/serve.mjs
```

In another terminal:

```powershell
bunx --no-install playwright-cli -s=gallery-polish open http://127.0.0.1:3199 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=gallery-polish run-code --filename=tests/browser/dashboard-gallery.js
bunx --no-install playwright-cli -s=gallery-polish run-code --filename=tests/browser/asset-selection-keyboard.js
bunx --no-install playwright-cli -s=gallery-polish close
```

Stop the server with Ctrl+C. Screenshots are written to
`task/dashboard-gallery-review/updated-gallery-*.png`.

Checks cover 1440/1024/768/390/320/275px, visible pagination bounds, staged
mobile filtering and cancelled reset, dirty dismissal, selection outside the
current page, delete identity review, failure retention, the 100-image selection
limit, refreshed drawer/editor data, deletion closing the preview, clipboard
failure, keyboard reorder rollback and restoring the filtered working view.

`window.galleryFail`, `galleryReject`, and `galleryDelay` can name an action
(`create`, `update`, `show`, `hide`, `delete`, `reorder`, or `upload` for delay).
Delayed stubs resume through `window.galleryRelease()`. `galleryRows` holds
the in-memory records; `galleryRefresh()` supplies a refreshed array to React.

Real persistence and authorization are covered by PGlite tests in
`tests/database/gallery-batch.test.ts` and `gallery-reorder.test.ts`. The
editor-specific fixture in `tests/fixtures/gallery-editor` covers upload/save
locking, all dismissal controls, field errors and short-screen footer access.
Neither fixture proves real authentication, media upload, crop processing, or
full Next router/history behavior.

The additional `tests/browser/collection-layout.js` check expects the Projects,
Posts and Gallery fixtures running on 3197, 3198 and 3199. It verifies conditional
result counts on all three surfaces, Gallery list header alignment, 112x64
thumbnails, header actions, reorder-only Position and mobile list overflow.
