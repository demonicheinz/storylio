# Authentication recovery and MFA

Branch: feat/dashboard-redesign. Extend existing auth UI; retain its fonts,
palette, Earth background, and accessible form styling.

1. Password recovery: generic response for known/unknown addresses, 30-minute
   single-use token, throttled request/reset endpoints, trusted callback URLs,
   revoke all sessions, no automatic sign-in. Use Resend and Next after for mail.
2. Optional authenticator TOTP: verify first code before enabling, encrypted
   secrets and backup codes, one-use recovery codes, regeneration invalidates old
   codes, throttled attempts and plugin account lockout. No email OTP fallback.
3. MFA policy: reject GitHub/passkey session creation for MFA-enabled users;
   password plus TOTP/backup code is required. Disable email verification's
   automatic sign-in. Revoke other sessions after enabling MFA.
4. Settings: enable/confirm/disable MFA, save and regenerate backup codes,
   individually revoke owned sessions without exposing bearer tokens.
5. Tests: reset enumeration/expiry/replay/revocation, MFA verification and bypass
   rejection, individual session ownership; full suite, lint, types, build, and
   isolated browser checks with intercepted auth requests.

Generate and review only an additive Drizzle migration locally. Do not migrate
external databases, send real emails, push, or commit without a separate request.
