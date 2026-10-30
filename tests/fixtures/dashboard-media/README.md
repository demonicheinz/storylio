# Dashboard Media fixture

Uses the real Media library, upload queue, rename dialog, shared CSS and local
fonts with 85 synthetic images. Server actions are replaced with in-memory
results. Browser upload tests intercept `/api/upload`; real database, auth,
Cloudinary and email services are never used.

From the repository root:

```powershell
bun tests/fixtures/dashboard-media/serve.mjs
```

In another terminal:

```powershell
bunx --no-install playwright-cli -s=media-polish open http://127.0.0.1:3201 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=media-polish run-code --filename=tests/browser/dashboard-media.js
bunx --no-install playwright-cli -s=media-polish run-code --filename=tests/browser/media-upload-queue.js
bunx --no-install playwright-cli -s=media-polish run-code --filename=tests/browser/media-detail-panel.js
bunx --no-install playwright-cli -s=media-polish close
```

Stop the server with Ctrl+C. The first check covers 1440/1024/768/390/320/275px,
sorting and direction, filename extension visibility, bounded pagination, list
alignment, dirty rename/retry, clipboard/download recovery, protected deletion,
off-page selections and partial provider outcomes. The second holds real XHR
requests locally to verify two concurrent uploads, failure-only retry, viewing
uploaded images under an active search, navigation protection, completed cleanup,
drag opening, invalid file rejection, and responsive queue controls.

Fixture controls: `window.mediaFailure` returns an ordinary error for a named
action; `mediaReject` throws; `mediaHold` delays until `mediaRelease()`;
`mediaFailedIds` simulates partial batch provider failure. Action names are
`usage`, `rename`, `delete`, and `batch`. `mediaCalls` records calls. Every third
image is synthetically marked in use. The fallback API route deliberately
returns a download failure. No real file deletion occurs.

Screenshots go to `task/dashboard-media-review`. Real persistence/provider
contracts are separately covered by PGlite/mocked tests in
`tests/database/security/media-safety.test.ts`, `upload-safety.test.ts`, and
`tests/security/media-download.test.ts`. These fixtures do not verify real
provider responses or the full Next router/history lifecycle.

`media-detail-panel.js` checks the extracted detail panel at 320/768/1440px:
keyboard opening, metadata, URL selection and copy, View target, nested rename
refresh, and restoring focus to the preview after Escape. Its screenshots go to
`task/code-standardization/` (create that directory before running).
