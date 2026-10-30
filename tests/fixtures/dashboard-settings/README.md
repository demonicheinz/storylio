# Settings fixture

From the repository root run `bun tests/fixtures/dashboard-settings/serve.mjs`.
The server listens at `http://127.0.0.1:3203`; stop it with Ctrl+C.

This renders production Settings components with project fonts, tokens and shell
content spacing. Authentication hooks, server actions and navigation are replaced
by local mocks. Profiles, passkeys, sessions, passwords, QR setup and backup codes
are synthetic. No real account, WebAuthn ceremony, database, email or provider is
used. The fixture does not verify Next.js streaming or the full dashboard sidebar.

Desktop navigation becomes a rail based on the available Settings area; compact
panels use horizontal tabs. The browser test checks both orientations, live
resizing without losing a draft, and stacked security panels.

Open an isolated Playwright CLI session with `playwright-cli.config.json`, then
run `run-code --filename=tests/browser/dashboard-settings.js`. Close the session
when finished. The browser check mocks `/api/upload` and holds its response to
verify Save is disabled during upload. `avatar.gif` is a one-pixel test image.

Browser tests may change `window.settingsFixture.fail`, `hold`, `authError`,
`keyError`, `throwSessions` and `sessionError`; `window.settingsNotify()` updates
reactive mocks. `window.settingsFixture.release()` completes a held action.
Use these only on this isolated fixture. Screenshots go to
`task/dashboard-settings-review/`.

`?view=totp` renders the production login TOTP form with a minimal mocked auth
heading. It verifies the shared Imposia-style3–3 input slots, formatted paste,
autofill attributes, rejected codes and switching to backup codes. This fixture
does not reproduce the complete auth background/layout. Header action placement
and the empty-versus-typed password strength state are also checked.
