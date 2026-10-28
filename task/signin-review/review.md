# Sign-in review, 2026-10-27

Scope: assess current Storylio sign-in and auth features, compare Imposia source,
and recommend work. The owner explicitly requested a simple single column with
no left panel. Password field must be visible immediately, with masked contents.
No application changes, migration, authentication, or commit in this review.

## Direction

Use Imposia's form rhythm rather than its split layout: linked Storylio logo,
an h1 such as "Sign in to Storylio", short dashboard description, and a 384–400px
form. Email and password stay present from first render. Password sign-in is the
primary action; keep conditional GitHub and explicit passkey below a divider.
No sign-up: Storylio is an owner-managed CMS. Keep existing fonts and blue/navy
tokens, 8–12px control corners, 44–48px fields/actions, native short-screen scroll,
and a visible route back Home. Decorative animation must not delay input.

## Findings

1. High priority: raw callbackUrl is forwarded to router.push for password and
   passkey paths (sign-in-form.tsx:56). Restrict it to same-origin dashboard paths
   and use one helper for all methods and already-authenticated visitors. Preserve
   path/query safely; reject schemes, protocol-relative URLs and unrelated paths.
   Next's installed use-router documentation explicitly warns against raw URLs.
   This is a code finding; an exploit against real sessions was not attempted.
2. High priority: sendChangeEmailConfirmation delivers to newEmail (auth.ts:74),
   whereas the installed Better Auth route uses that hook for current-address
   approval when emailVerified is true. Send approval to user.email, then use the
   normal new-address verification stage. Align action success copy and enforce
   the owner-email rule centrally, not only in the dashboard action wrapper.
3. Confirmed: mocked password HTTP 429 renders "Invalid email or password".
   Differentiate generic bad credentials, throttle/retry, offline and service
   failures. Add try/finally recovery for unexpected transport failures.
4. Confirmed: mocked social HTTP 400 leaves every control disabled and the GitHub
   button saying "Redirecting...". The handler only catches thrown errors and
   does not inspect the SDK's returned error object.
5. Auth config does not override rateLimit; installed runtime defaults enable it
   in production with memory storage. Add explicit sensitive-route rules and a
   shared database or secondary backend for serverless instances. A database
   backend needs a reviewed Drizzle schema migration; none is proposed to run now.
6. Conditional passkey starts without capability detection and without component
   cleanup/result guards. Gate supported secure contexts, coordinate explicit
   authentication, and ignore stale completions after unmount. Verify success data.
7. Browser measurements: inputs/actions are 36px high; the password toggle is
   16x16px with no accessible name. Password lacks current-password autocomplete.
   No main landmark or h1, no Home link, and the page title is only "Storylio".
   Add explicit error IDs, aria-invalid/describedby, status/error announcements,
   labeled toggle with state, main/h1, and sign-in title/noindex metadata.
8. Review environment-dependent allowedHosts (currently includes *.vercel.app and
   localhost:* in every environment) and GitHub account linking. OWNER_GITHUB_ID
   enforcement is conditional on that variable existing; allowDifferentEmails is
   enabled. Narrow hosts per environment and require an explicit owner-linking
   policy. These settings alone are not evidence of an account takeover.

## Existing features to retain

- Email/password, conditional GitHub OAuth, explicit/conditional passkeys.
- Public signup blocked in config and user-creation hook.
- Dashboard proxy and Server Actions check configured owner emails.
- Password change revokes other sessions; session list and revoke-others exist.
- Session lifetime is seven days with daily refresh. Do not silently change it.
- Owner seed sets emailVerified; requireEmailVerification is currently false.

## Feature recommendations

- First: repair the above UX/security findings. Do not add more login providers.
- Recovery: add a complete forgot/reset password flow with generic responses,
  short-lived single-use links, rate limits, owner policy and session revocation.
  No recovery hook or pages are configured today. Ensure alternative credentials
  exist before requiring any new verification policy.
- Optional next stage: TOTP with offline backup codes for password login. Design
  recovery and provider policy together so OAuth cannot silently bypass a chosen
  MFA requirement. Passkeys are already a separate login method; do not assume
  that adding the TOTP plugin alone secures every method.
- Existing session controls can later gain individual revocation, authenticated
  rechecks for sensitive changes, and safe security notifications.

## Evidence and limits

Inspected Storylio at 1440, 390 and 320px; no horizontal overflow. Compared
Imposia auth-shell, sign-in page, return-path helper and auth options by source;
Imposia was not started or visually verified. Captures/diagnostics are under
ignored .tmp/signin-review. Mocked login responses used fictional credentials;
no real password, GitHub login, WebAuthn ceremony, or email delivery was tested.
Existing auth tests passed: 2 files / 9 tests, including PGlite password/session
compatibility and signup/origin/owner guards. These are not a full auth audit.
Read installed Better Auth source plus official docs via Context7 for rate-limit,
passkey, change-email and recovery semantics. No production config was inspected.

Self-review (1–5): accuracy 4 (source/runtime evidence; no real ceremonies),
completeness 4 (requested scope covered; production OAuth/email not exercised),
clarity 4 (priority separated from optional features), actionability 5 (specific
single-column direction and repair order), conciseness 4 (details archived here).
