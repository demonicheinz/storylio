# Auth navigation regression fixture

Run from the repository root without credentials or a database:

```powershell
bun tests/fixtures/auth-navigation/serve.mjs
```

In another terminal:

```powershell
bunx --no-install playwright-cli -s=storylio-auth-navigation open http://127.0.0.1:3204/sign-in --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=storylio-auth-navigation run-code --filename=tests/browser/auth-navigation.js
bunx --no-install playwright-cli -s=storylio-auth-navigation run-code --filename=tests/browser/auth-recovery-form.js
bunx --no-install playwright-cli -s=storylio-auth-navigation close
```

Stop the fixture with Ctrl+C or stop only the PID it prints. It binds to loopback
port 3204 and bundles the actual `SignInForm`, `AuthEntrance`, `NavUser`, sidebar,
and menu components. React StrictMode and Activity reproduce the hide/restore
lifecycle used by Next Cache Components. Auth calls and Next navigation hooks
are mocked. Branding and CSS are stubbed; this is a behavior fixture, not visual QA.
Explicit passkey results are mocked without invoking a real WebAuthn ceremony.

Every case reloads the document to reset mock state. `Restore sign in` re-shows
the same Activity subtree without a document reload or a `pageshow` event.
Deferred mock promises expose responses arriving after a later visit has begun.
Successful logout performs a real local document navigation; its assertion
checks that an in-memory marker disappears. BFCache coverage dispatches a
synthetic persisted `pageshow`, rather than relying on browser eviction rules.

The 13 checks cover password, passkey, OAuth and MFA redirect restoration;
late success and failure; BFCache restoration; duplicate submission; keeping
redirects locked until departure; synchronous navigation exceptions; returned
and thrown logout errors and retry; fresh-document logout; and duplicate logout.
They collect unhandled page errors. Real Next RSC/session-cookie integration,
real OAuth redirects, and real WebAuthn are outside this fixture.

`/forgot-password` and `/reset-password?token=fixture-token` render the actual
RecoveryForm. The recovery check covers invalid/absent/oversized tokens, password
mismatch, token forwarding and URL cleanup, generic confirmation and retry. Auth
methods record calls in memory; background visuals are stubbed along with branding.
No email is sent and no real password is changed.
