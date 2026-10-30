# Password recovery, authenticator MFA, and sessions

Storylio uses Better Auth 1.7's reset-password and two-factor endpoints. Public
registration remains disabled; existing owner-email and pinned GitHub-ID checks
remain active. The public auth forms reuse the sign-in background and typography.

## Deployment

Apply `drizzle/0003_auth_two_factor.sql` before deploying the new application
version. The current journal also contains the destructive `0004` retirement;
`db:migrate` applies all pending entries and has no stop-at-0003 option. Back up
Testimonial before the first authorized run and use the
[shared-journal rollout](DRIZZLE_MIGRATION.md#shared-journal-rollout), including a
maintenance window when `0003` is still pending. Never replay the initial schema or
repeat the adopted baseline. The migration is additive: a false-by-default user
flag, a `TwoFactor` table, indexes, and a cascading user foreign key. No existing
account is opted into MFA automatically. Local tests use PGlite only.

Once an owner enables MFA, do not roll authentication back to a build that
ignores the MFA flag; a rollback must preserve enforcement of the chosen factors.

No new environment variable is required. `RESEND_API_KEY` and the configured
`RESEND_FROM` sender must work for recovery email. Keep `BETTER_AUTH_SECRET`
stable: it encrypts authenticator secrets and backup codes as well as signing
cookies. Secret rotation requires a separate recovery/migration plan.

## Password recovery

The sign-in page links to `/forgot-password`. The request endpoint returns the
same successful message for known and unknown email addresses, and sends mail
only for eligible owner accounts. Mail delivery runs via Next `after`; a delivery
failure is logged without changing the generic response. Test real delivery in
a dedicated staging environment after deployment.

The email link redirects to `/reset-password?token=...`. Tokens last 30 minutes
and are consumed once, including concurrent replay protection. A successful reset
replaces the password, revokes all sessions, and requires a new sign-in. It does
not disable MFA. Password length remains the existing 8–128-character policy.
Trusted-origin checks reject external callback URLs. Recovery requests allow
three attempts per minute per client/path, reset submissions five. These limits
use the existing persistent RateLimit storage in production.

Auth recovery routes are noindex with no-referrer policy. After success, the
reset form removes its token from the current URL. Do not include reset links,
passwords, QR payloads, authenticator secrets, or backup codes in logs/analytics.

## Local HTTP and legacy owner credentials

Local `next start` uses production mode, but an explicitly configured HTTP
loopback origin (`localhost`, `127.0.0.1`, or `::1`) still needs HTTP reset URLs
and non-Secure local cookies. `getAuthProtocol` handles this exception; hosted
production and Vercel deployments retain HTTPS and secure cookies. Use the same
origin for `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, and the browser address.

Better Auth 1.7 credential accounts require `Account.accountId = User.id`.
Older owner seeds wrote an empty accountId, causing email login to report
"User not found" even when the user and password hash existed. New seeds use
the correct ID; ordinary repeat seeding still preserves existing records.

Inspect affected owner records with the read-only repair command:

```powershell
infisical sm run --env=dev --path=/ -- bun scripts/repair-owner-credential.ts
```

After approving the target environment, append `--apply`. The transaction repairs
only empty credential IDs for configured owners, refuses duplicate/passwordless
credentials, and preserves password hashes, user IDs, OAuth accounts, and sessions.
It logs counts only and is idempotent. Review and authorize staging/prod separately.
This is a data correction, not a schema migration or password reset.

After changing auth configuration, restart the application; `next start` also
requires a fresh build. Request a new reset email instead of reusing an older
link generated with the wrong scheme. Do not paste reset tokens into diagnostics.

## Optional authenticator

Open Dashboard -> Settings -> Security -> Two-factor authentication. Confirm the
current password, scan the locally rendered QR code (or reveal the manual setup
key), and verify a current six-digit authenticator code. MFA stays off until
that verification succeeds. Enabling it rotates the current session and revokes
other sessions so earlier sign-ins cannot bypass the new requirement.

Save the ten backup codes in a private password manager or download them. The
UI requires acknowledging storage before dismissing them. Codes exist in UI
memory only while that view is open; they are not written to localStorage or
sent to a QR/image service. Secrets and codes are encrypted at rest by Better
Auth. Each backup code can be consumed once. Regeneration requires the current
password and invalidates every previous code. Disabling MFA also requires the
password. No email OTP fallback or trusted-device exemption is offered.

Password sign-in creates a ten-minute pending challenge instead of an
authenticated session. `/two-factor` accepts an authenticator or backup code,
then restores the safe dashboard destination. All two-factor paths are limited
to ten requests per minute per client/path; each challenge additionally has a
five-failure budget. Ten consecutive account failures across challenges and IPs
lock verification for fifteen minutes, including backup-code verification.

## GitHub and passkey policy

The installed two-factor plugin intercepts credential sign-in only. It does not
automatically require local TOTP on GitHub callbacks or passkey sign-in.

Storylio therefore rejects session creation from those routes when the target
user has MFA enabled. This is enforced by a server database hook, independently
of whether buttons are visible. Linked accounts and registered passkeys are
retained and can be used again after MFA is disabled. GitHub's own MFA policy is
not used as evidence that local MFA was completed. Email verification's automatic
sign-in is disabled to avoid another non-TOTP session path.

Resetting a forgotten password does not recover a lost authenticator by itself.
Use a saved backup code. Losing both requires a separately reviewed operator
recovery; no public MFA-disable endpoint without authentication/password is added.

## Session controls

Security settings list live sessions owned by the current authenticated owner.
The browser receives record IDs and display metadata, never bearer tokens.
Individual revocation is constrained by owner ID and session ID and cannot
delete the current session. Use Sign out for this browser. The existing Revoke
Other Sessions action remains available. Expired sessions are omitted.

## Verification

`bun run test` covers recovery token expiry/replay/revocation, MFA challenge and
backup-code handling, lockout, ownership, and session controls using local SQL.
GitHub's HTTP exchange is intercepted in its integration test. The passkey test
uses a local EC key, CBOR public key, and genuinely signed WebAuthn assertion
through the real challenge/signature/session verification flow. Neither test
claims verification of a live provider or physical authenticator.

`tests/browser/auth-recovery-mfa.js` intercepts auth requests for form, layout,
error, QR setup, regeneration, and disable flows. To exercise its Settings fixture,
temporarily copy `tests/fixtures/auth-security/page.tsx` to
`src/app/auth-security-fixture-check/page.tsx`, run a local preview in an isolated
Playwright CLI session, and run the browser script. Remove the temporary route
before production build. Do not serve this fixture in a deployed application.

`tests/browser/auth-navigation-guards.js` runs without that fixture against a
local build. It checks real auth response headers and intercepts delayed API
responses to verify they cannot change navigation after a form is unmounted.

Evidence and known verification limits are recorded in `task/auth-recovery-mfa/`.
