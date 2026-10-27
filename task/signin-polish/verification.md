# Sign-in and authentication repairs

Owner direction: simple single column, no left panel, password field present on
arrival, Imposia as a reference. Recovery/TOTP/new providers remain out of scope.
No commit, push, external migration, real-account sign-in or email delivery.

## Implementation

- Use a 400px form, linked Storylio logo, concise h1, floating labels adapted from
  Imposia's input rhythm, 52px fields, 48px actions and a 44px password toggle.
  Existing fonts/palette remain. A plain layout replaces the oversized card.
- Desktop/tablet/mobile and short screens use native page scrolling. Both fields
  render immediately and password remains masked until explicitly revealed.
- Add h1/main, password-manager hints, named toggle/state, field-error relations,
  alert announcements, visible focus, loading fallback, noindex and Home links.
- Validate all return paths with getAuthRedirect, rejecting external URLs,
  scripts, encoded traversal and non-dashboard destinations. Existing owner
  sessions follow the same rule; non-owner sessions go to unauthorized.
- Recover every manual method from SDK errors, network exceptions and 429s.
  A synchronous lock prevents competing login methods; successful navigation
  retains a loading state. GitHub callback errors use fixed safe UI text.
- Conditional WebAuthn checks browser support and never locks the form. It owns
  an abortable initial challenge fetch because the installed SDK does not forward
  a signal for that fetch. Explicit authentication cancels it; stale results and
  unmounted components cannot redirect. Successful conditional verification also
  notifies Better Auth's session signal, matching its explicit SDK behavior.
- Declare the already-installed @simplewebauthn/browser 13.3.0 as a direct pinned
  dependency for its public cancellation service. No other versions changed.
- Send email-change approval to the current address, then verification to the
  new address. Enforce the owner allowlist at the endpoint, delivery callbacks
  and user-update hook. Escape authored email text and match existing blue brand
  assets. Settings copy describes the actual two-stage flow.
- Require a pinned OWNER_GITHUB_ID to enable OAuth. Check profile identity on
  each OAuth flow and on account creation. Preserve deliberate different-email
  linking only behind that pin. Trust exact canonical/Vercel deployment/branch
  hosts; localhost wildcard is development-only.
- Use production database rate limiting: password 5/minute, with separate social,
  passkey and account-change rules. Existing 7-day sessions and daily refresh,
  signup blocking, password hashes, passkeys and owner access guards remain.

## Rollout requirement

The generated, reviewed 0002_auth_rate_limits.sql adds only RateLimit and its
indexes. It was applied to PGlite fixtures, not dev/staging/prod. Apply it with
the matching db:migrate script before deploying this production auth config.
Do not replay the initial migration or baseline an already adopted database.
GitHub credentials now also require OWNER_GITHUB_ID; configuration values were
not read out or changed. README and Drizzle operating guide describe rollout.

## Evidence

- Lint: 443 files passed. TypeScript passed. Final production build: 36 routes.
- Vitest: 42 files / 263 tests passed. Local PostgreSQL fixtures prove sequential
  and concurrent throttling (5 allowed / remaining 429), old-address approval,
  new-address verification and final email update, and direct endpoint denial
  for non-owner addresses. No external database/email credentials are used.
- Migration checks and empty/legacy database migration regressions passed.
  Historical baseline descriptors remain intact; the new table is asserted
  separately. Local Drizzle check passed.
- Browser: 1440x1000, 1024x900, 768x1024, 390x844, 320x740, 844x390 and 390x420.
  No horizontal overflow; first content stays reachable and all controls >=44px.
  Both password states, floating labels, reduced motion, field errors, 401, 429,
  server/offline failures, returned GitHub errors and cancelled passkeys passed.
- Mocked conditional WebAuthn proved optional autofill, cancellation before
  explicit login, delayed challenge suppression and cleanup on navigation.
- Auth browser calls were intercepted, including challenges. Actual GitHub OAuth,
  biometric/security-key ceremonies and email delivery were not performed.
- Screenshots inspected: signin-1440.png, signin-390.png and signin-filled-390.png.
  Local design detector has zero findings after using documented 28px/12px type.
- bun audit still reports the two pre-existing high advisories: body-parser
  2.3.0 via shadcn tooling, and Zod 4.4.3. This task does not claim a clean audit
  or silently upgrade those unrelated versions.
- Browser session closed after verification; the user's dev server stays running.

## Self-review

Accuracy 4/5: source, browser and database evidence above; no real provider tests.
Completeness 4/5: authorized repairs are implemented; external migration awaits
rollout and physical WebAuthn remains untested. Clarity 4/5: shared safe helpers,
fixed error language and documented deployment conditions. Actionability 5/5:
local working UI, migration and regression checks are reviewable. Conciseness
4/5: detailed evidence is kept here rather than in the final response.
Next validation: real-device passkey and GitHub/email smoke in a dedicated auth
environment after migration approval. Recovery and TOTP remain separate work.
