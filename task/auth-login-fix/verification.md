# Local email login and recovery fix

## Cause and changes

Better Auth 1.7 requires credential accountId to equal userId. The owner seeder
wrote an empty identifier. Existing user/email/hash were valid, but the account
was not eligible for credential login. The seeder now writes the created user ID.
Repeated ordinary seeds continue to preserve existing records and password hashes.

scripts/repair-owner-credential.ts defaults to dry-run. Its scoped transaction
repairs only empty credential identifiers for configured owners, refuses ambiguous
or passwordless credentials, preserves hashes/OAuth/users/sessions and logs counts
only. Explicitly authorized dev apply matched one owner and updated one credential;
post-check showed accountId matches userId with a password still present. No
staging/prod repair or schema migration was performed. No credentials were reset.

Auth protocol previously forced HTTPS whenever NODE_ENV was production, including
plain HTTP next start. getAuthProtocol now chooses explicit HTTP only for a
configured loopback origin outside Vercel; HTTPS localhost and hosted production
remain secure. Better Auth uses that protocol for both reset links and cookies.
Host allowlists, origin validation and rate limits are preserved.

Recovery confirmation switches its title to Check your inbox / Password updated,
uses a small contextual icon, separates expiry/spam guidance, and offers Try
another email with focus restoration. The response remains generic for known and
unknown accounts. No reset token or submitted address appears in screenshots.

## Verification

- Initial local-auth integration failed with User not found / 401 for the actual
  seeded owner, reproducing the defect. PGlite tests now cover correct seeded
  login, non-Secure local cookies in production mode, real HTTP reset email URL
  construction/callback/password reset/new-password login, and legacy identifier
  repair restoring login without a hash change. Each test has independent state.
- Focused suite: 5 files / 24 tests passed, including existing recovery and
  security regressions. Earlier seed/repair/protocol suite: 18 tests passed.
- Repair tests cover dry-run, exact row scope, preserving hashes/providers,
  idempotency and refusing ambiguous credentials.
- Browser recovery-confirmation passed on 1440, 390 and 320px: generic message,
  no overflow, retry clears address and restores focus, correct callback scheme,
  zero page errors. Auth request was intercepted; no real email was sent.
- Browser used the user's already running next dev server at port 3000, retained
  it and user tabs, and closed only the isolated auth-login-fix QA browser. A
  proposed second dev server at 3107 refused to start because next dev already
  held the lock; no process was killed.
- Biome, TypeScript and git diff --check passed. Impeccable detector: [] findings.
- Production build passed all 38 routes with Infisical dev data, Sentry reporting
  and source-map upload disabled. No temporary routes were added for this task.
- Full suite passed: 57 files / 339 tests, including recovery, MFA, credential
  repair, local production-mode authentication and the prior dashboard changes.

## Deployment/use

### Confirmation alignment follow-up

Centered the confirmation without a Card, capped the message at 360px, removed
the repeated inbox subtitle, tightened the heading spacing, promoted Back to sign
in to a primary link-styled Button and made Try another email a secondary link
button. Both recovery and reset completion share the centered treatment. Forms
retain their existing alignment. TypeScript and lint passed; the updated browser
check passed 1440/390/320px with explicit centering, primary navigation semantics,
generic copy and retry focus assertions. Screenshots here were refreshed. No auth
requests were sent outside intercepted fixture responses. No commit was made.

Self-check: accuracy/completeness/clarity/actionability/conciseness 4/5 each;
evidence is the three viewport browser run and static checks. Reset completion
uses the shared styling but was not submitted with a real password in this pass.

The dev database correction is already applied. Current next dev loads source
changes; next start deployments require a fresh build and restart. Request a new
reset email; don't reuse the earlier wrong-scheme link. No real password reset,
owner sign-in, session revocation, migration, commit or push was performed.

## Self-evaluation

Accuracy 4/5: real local SQL and Better Auth integration plus scoped dev metadata
verification; owner password login intentionally not attempted. Completeness 4/5:
both root causes, seed recurrence and recovery confirmation addressed; other
environments need separate authorized data repair. Clarity 4/5: focused helper
and dry-run CLI; deployment distinction documented. Actionability 4/5: dev row
fixed and local browser ready; user validates their own credentials. Conciseness
4/5: technical evidence archived here; final response can stay short.
