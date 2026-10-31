# Content navigation and public loading

Start `bun tests/fixtures/content-navigation/serve.mjs`, then open a named
Playwright CLI session at `http://127.0.0.1:3205` with the repository config.
Run these files with `run-code --filename=...`:

- `tests/browser/content-navigation.js`: retained drafts, fresh creation,
  failure retention, and another create after a successful save for both editors.
- `tests/browser/content-loading.js`: five public skeleton layouts at
  320/390/768/1440px and the missing-cover aspect ratio. Screenshots go into
  `task/content-navigation-and-loading/` (create that directory before running).
- `tests/browser/control-cursors.js`: computed cursor checks for shared controls,
  disabled states, Select options, and dropdown submenu triggers. Open
  `/?kind=controls` for manual inspection.
- `tests/browser/dashboard-pagination.js`: shared pagination range, boundaries,
  page-size choices and keyboard behavior at 320/390/768/1440px. Create
  `task/code-standardization/` before running screenshots; manually inspect
  `/?kind=pagination`.
- `tests/browser/content-covers.js`: missing/failed/valid cover transitions,
  source recovery and narrow fallback bounds at 320/390/768/1440px. Inspect
  `/?kind=covers`. Valid images are inline SVG fixtures, and broken input is
  deliberate. The Next Image component is stubbed; optimizer URLs are tested
  separately by `tests/public/image-delivery.test.ts`.
- `tests/browser/dashboard-confirmations.js`: uses the Media fixture on port 3201
  and this fixture on 3205. Verifies nested discard, Cancel/Escape/focus, no native
  confirms, one approved link replay, coalesced dirty guards, and native unload
  protection. Inspect `/?kind=confirmation`; screenshots go to
  `task/code-standardization/`.

The fixture renders the actual New route components, editors, skeletons,
Blog card, shared controls, and project CSS/fonts. React StrictMode and Activity
simulate route retention. The router supplies a new `bfcacheId` for New item,
and retains it for Back to draft, following the installed Next.js contract.
This is not an end-to-end test of Next.js's history implementation.

Actions, authentication, uploads, image delivery and MDX editing are local
stubs. No CMS/database/email services are used. A controlled textarea replaces
the rich editor; publication and autosave are covered by their existing tests.
Stop the fixture server and close its browser session after verification.
