# Authentication recovery and MFA verification

Branch: feat/dashboard-redesign. No commit, push, external database migration,
live email, live GitHub exchange, or Sentry upload was performed.

## Implementation

- Forgot/reset password uses Better Auth's existing verification storage and
  transactional reset. Thirty-minute, single-use tokens; concurrent replay has
  one winner. Requests return a generic message for both known and unknown
  addresses, including mail failure. Production storage throttles request/reset.
- Next after keeps mail work off the response path. Reset revokes all sessions
  and retains MFA. Verification emails no longer automatically create sessions.
- Added /forgot-password, /reset-password, /two-factor with shared auth styling,
  noindex/no-referrer, safe dashboard return URLs, accessible labels/error states,
  and a guard against responses changing navigation after the form unmounts.
- Optional TOTP requires password confirmation and a first valid code. A local
  QR renderer does not send secrets to a third-party service. Ten encrypted backup
  codes are shown after confirmation; one use per code, password-gated regeneration
  invalidates previous codes. Disabling requires the password.
- Enabling MFA rotates the current session and removes other sessions. No trusted
  device exemption is offered. Challenges expire after ten minutes. Account-level
  lockout applies after ten consecutive failures for fifteen minutes across
  challenge replacements and IPs; per-path throttling remains enabled.
- The installed two-factor plugin covers password sign-in only. A server session
  creation hook blocks GitHub and passkey sign-in for MFA-enabled users, preserving
  the chosen local factor requirement. Existing linked accounts/keys are retained.
- Individual session revocation requires the authenticated owner and target record
  ID. Current/foreign sessions cannot be removed by that action. Lists include
  only live owned sessions and never expose bearer tokens.
- Generated additive 0003_auth_two_factor.sql with a default-false user flag and
  TwoFactor storage/indexes. Historical baseline remains unchanged; tests use the
  archived schema before asserting additive changes separately.

## Evidence

- Initial reset tests failed with RESET_PASSWORD_DISABLED before implementation.
- Full final Vitest run: 51 files / 309 tests passed. Real PGlite SQL covers
  expiry, replay, concurrent reset, session revocation, generic responses after
  email failures, TOTP/backup challenges, regeneration, lockout, and ownership.
- GitHub HTTP calls are intercepted; paired tests prove a normal OAuth callback
  creates a session when MFA is off and cannot do so when MFA is on.
- Paired passkey tests use a local P-256 key, COSE/CBOR public key, genuine
  WebAuthn challenge, authenticator data and signature through the real verifier.
  They prove session rejection after valid verification when MFA is enabled.
- Browser fixture checks passed at 1440x1000, 390x844, 320x740, 844x390: no
  horizontal overflow, single main, at least 44px form controls, reduced motion,
  reset validation/success/expiry/throttling, password-to-MFA redirect preserving
  destination, backup-code toggle, QR confirmation, regeneration and disable.
- Browser auth requests are intercepted. No unexpected page errors or hydration
  errors occurred in the final run. A screenshot-before-hydration race initially
  modified caret styles; waiting for the auth entrance to complete fixed the test.
- Lint: 480 files passed. TypeScript, Drizzle check, and whitespace check passed.
- Production build passed with reporting/uploads disabled: 38 routes. The
  temporary Settings fixture was removed before production build. Stale dev route
  types were moved reversibly to ignored .tmp rather than changing source types.
- Audit moderate and above: passed, 1032 packages checked. One pre-existing low
  deepmerge advisory remains without a published patch. QR renderer is 2.2.0.
- Desktop/mobile screenshots are stored here; setup QR uses public dummy data.

- Refreshed production build after the unmount guards also passed (38 routes).
  Production browser checks proved delayed reset/MFA responses do not rewrite
  the sign-in URL or navigate to Dashboard after the user leaves those forms.
  Real response headers for all three auth routes include no-referrer and noindex.
  These checks are retained in tests/browser/auth-navigation-guards.js.
- Final fixture routes are absent; isolated browsers and preview servers closed.

## Limits and rollout

Physical passkeys, real authenticator devices, Resend delivery, authenticated
hosted Dashboard, and real GitHub OAuth were not used. Browser Settings is an
isolated disposable fixture; backend security checks use actual library endpoints
and local SQL. Apply the reviewed migration in the intended environment before
deploying the new adapter schema. Operating policy is in docs/AUTH_RECOVERY.md.

## Self-evaluation

Accuracy 4/5: real signature/SQL and browser evidence; hosted providers untested.
Completeness 4/5: requested code and tests complete; external rollout pending.
Clarity 4/5: explicit password-plus-TOTP policy; operators must read rollout steps.
Actionability 4/5: generated migration and documented verification; not deployed.
Conciseness 4/5: detailed evidence kept here; implementation spans several flows.
Average 4.0/5. Would the user agree: likely, with migration and provider-test limits
stated clearly. Next improvements: staging migration/deployment, real email and
provider/device smoke checks, and retaining MFA enforcement during any rollback.
