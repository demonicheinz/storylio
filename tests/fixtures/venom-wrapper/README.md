# Venom wrapper fault fixture

Run `bun tests/fixtures/venom-wrapper/serve.mjs`, then open loopback port 3214 with
the repository Playwright CLI configuration. Run `tests/browser/venom-wrapper.js`.
Stop the server and close the browser session afterward.

The actual VenomButton runs in StrictMode with a mocked renderer and stubbed CSS.
It verifies thrown/null setup cleanup and cancellation of deferred preparations
after unmount. It does not prove GPU recovery or visual material; those require
the production renderer fixture/local build. No database, auth or uploads.

Also run `venom-wrapper-recovery.js` against port 3214 for controlled restore
failures and preference changes. Start `serve.mjs --real` for port 3215 with the
actual three-pass renderer/project CSS, then run `venom-context-recovery.js` there.
The real test uses WEBGL_lose_context for two recovery cycles, verifies one rebuild,
full label on every recovered frame, no startup crossfade, paused restore and
cursor cleanup. These are local synthetic links; no CMS or navigation write.
