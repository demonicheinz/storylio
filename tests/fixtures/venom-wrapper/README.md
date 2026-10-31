# Venom wrapper fault fixture

Run `bun tests/fixtures/venom-wrapper/serve.mjs`, then open loopback port 3214 with
the repository Playwright CLI configuration. Run `tests/browser/venom-wrapper.js`.
Stop the server and close the browser session afterward.

The actual VenomButton runs in StrictMode with a mocked renderer and stubbed CSS.
It verifies thrown/null setup cleanup and cancellation of deferred preparations
after unmount. It does not prove GPU recovery or visual material; those require
the production renderer fixture/local build. No database, auth or uploads.
