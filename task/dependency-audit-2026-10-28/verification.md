# Dependency security patch

## Changes

- Better Auth and its passkey plugin: 1.6.33 -> 1.7.14. Keep both on the
  same 1.7 maintenance line and require at least the reported 1.7.7 security fix.
- Zod: 4.4.3 -> 4.6.7 (minimum allowed 4.6.6).
- Transitive body-parser: 2.3.0 -> 2.4.0 through its existing compatible range.
  No new direct dependency or override was needed.
- Adapt Settings unlink requests to use the local account row ID. Include that
  ID in the server projection and report returned API errors as failures.
- Restore the authRateLimits fixture option: baseline tests must not receive the
  additive RateLimit table unless requested. The six cascading baseline failures
  were reproduced before the fix. No external database or migration was changed.
- Add an integration regression for unlinking an owned account, rejecting another
  user's account and a provider subject, and retaining password credentials.

## Documentation evidence

Context7 retrieved the official Better Auth 1.7 upgrade guide and account API
documentation. Installed 1.7.14 endpoint code also selects account.id, not the
provider's accountId. The 1.7.3+ core schema restores the pre-1.7 account shape;
no issuer migration is required for the features configured in this application.

## Audit

- bun audit --audit-level=moderate: passed, 1030 packages checked.
- Full bun audit: one remaining low advisory, GHSA-gcqx-w48m-w2h4,
  deepmerge 4.3.1 via shadcn -> @shadcn/registry.
- Registry latest deepmerge is still 4.3.1. A targeted compatible update made no
  changes. Do not hide the advisory or downgrade to an older branch merely to
  satisfy the scanner.
- The five user-reported findings resolve to versions at or above their stated
  fixes. Trivy is not installed locally; its exact scan must run again in CI.

## Validation

- Initial full suite after fixture repair: 48 files / 287 tests passed.
- TypeScript and lint passed after updating the account-ID server projection.
- Final suite including the additional unlink regression: 48 files / 288 tests
  passed. The six baseline failures are resolved without weakening the checks.
- Production build passed: 35 routes. No new schema migration was required.
- Lint passed (466 files), TypeScript passed, git diff --check passed.
- No commit, push, external database migration, or dependency suppression.

## Self-evaluation

Using the agent-self-evaluation rubric: accuracy 4/5 (audit, installed versions,
real auth endpoint tests; exact Trivy rescan awaits CI), completeness 4/5 (all five
reported versions patched; low deepmerge advisory has no published patch),
clarity 4/5 (cause and remaining risk recorded; no hosted-provider validation),
actionability 4/5 (ready for review and CI; owner must deploy), conciseness 4/5
(detailed evidence stays here). Average 4.0/5. Would the user agree: likely,
provided the remaining low advisory is stated clearly. Next improvements:
rerun Trivy in CI, patch deepmerge when upstream releases a fix, and perform
real-provider authentication smoke checks in staging after deployment.
