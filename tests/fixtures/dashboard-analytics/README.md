# Analytics fixture

Run `bun tests/fixtures/dashboard-analytics/serve.mjs` from the repository root.
Stop the server with Ctrl+C. It listens on `http://127.0.0.1:3202`.

This renders the production local view, tabs, charts, Umami panel and loading
components with production tokens, fonts and content-shell spacing. All records
are synthetic. Server actions are replaced by an in-memory callback; no real
database, authentication, analytics-provider or tracking endpoint is called.
It does not verify the complete sidebar or Next.js streaming/runtime behavior.

Use `?empty` for zero content and an unconfigured provider, or `?loading` for the
loading layout. Browser scenarios can change `window.analyticsUmami`,
`window.analyticsReject` and `window.analyticsHold`; call
`window.analyticsRelease()` to release a held refresh.

Open an isolated Playwright CLI session using the repository's
`playwright-cli.config.json`, then run
`run-code --filename=tests/browser/dashboard-analytics.js` and close the session.
Screenshots and results are written under `task/dashboard-analytics-review/`.
