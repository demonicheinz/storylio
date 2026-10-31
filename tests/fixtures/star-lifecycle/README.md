# Gravity Stars lifecycle fixture

Run `bun tests/fixtures/star-lifecycle/serve.mjs` from the repo root, then open
loopback port 3216 with the repository Playwright CLI configuration. Run
`tests/browser/star-paused-twinkle.js` and `tests/browser/star-lifecycle.js`.
Close the browser session and stop the server with Ctrl+C afterward.

This renders the real starfield with project CSS and synthetic controls in
StrictMode. The pause test compares actual canvas pixels before and after a
same-size redraw while paused. The lifecycle check instruments RAF, painting and
ResizeObserver callbacks, including one invoked after unmount. No database,
authentication, external assets or CMS writes. Focus events are synthetic, not
an OS focus integration test.
