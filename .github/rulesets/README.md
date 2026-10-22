# Main and staging protection

These JSON files are reviewable templates. Committing them does not configure
GitHub rulesets; apply the settings in the repository UI separately.

`main.json` is based on the repository's supplied Protect Main Branch export.
It removes `required_linear_history` and limits PR merges to merge commits.
It preserves the existing approval count, Preview deployment, six required
checks, Copilot review settings and PR-only bypass actor. Server-assigned IDs
and source metadata are omitted from the template.

`staging.json` requires a PR, the same six checks, resolved review threads,
and protection against deletion and force pushes. It allows squash and merge
commits, with no required linear history, deployment or approval count. The
zero-approval default supports a solo-maintainer integration branch; set it to
one if an independent reviewer is required. Main retains its existing one-review
requirement. The staging bypass actor follows the supplied main configuration.

## Apply in GitHub

1. Enable **Allow merge commits** and **Allow squash merging** in repository
   Settings → General → Pull Requests.
2. Land the workflow updates on the relevant base branches. Confirm that a PR
   targeting `staging` produces Lint, Type Check, Build, Dependency Vulnerability
   Scan, Secret Detection and Misconfiguration Scan. Enable Trivy if disabled.
3. In Settings → Rules → Rulesets, edit the existing **Protect Main Branch**
   ruleset (ID `17676768`): turn off Require linear history and allow merge
   commits only for its PR rule. Keep the other existing requirements.
   `main.json` is the comparison/reference, not a second overlapping ruleset:
   creating another ruleset would leave the old linear-history restriction active.
4. Import `staging.json` to create **Protect Staging Branch**, then verify its
   target, required checks and bypass actor before activating it. If a ruleset
   already protects staging, edit that one instead of creating a duplicate.
5. Check for other repository/organization rulesets or branch protections that
   still require linear history. All applicable protections must permit the
   intended merge method.

The six checks retain GitHub Actions integration ID `15368` from the supplied
ruleset. Verify those check sources in this repository. Keep the required
environment named exactly `Preview` on main while that deployment gate is used.
Required approval on main must come from an eligible reviewer other than the PR
author; an automatic Copilot review does not count as an approval.

## Daily flow

Create feature/fix branches from staging and squash their PRs into staging.
Promote staging to main with a merge commit. Sync main back into staging through
a merge PR after a release or hotfix so both branches share the release commit.
Allowing merge commits on staging supports this synchronization; it does not
require every feature PR to use them.

Both rulesets retain strict required checks, so source branches must be updated
with their base as needed. Neither template restricts PR source branch names:
the release/hotfix flow above is a convention, not an enforced source-branch rule.

## CI and secrets

Quality Checks runs for PRs targeting main/staging and pushes to main. Its
Infisical OIDC path remains limited to main pushes. PR builds continue to use
the existing GitHub DATABASE_URL secret; keep that secret while this path is in
use. No Infisical identity or credential policy change is needed for staging PRs.
Fork PR builds retain the existing secret-access limitations.

Trivy runs for PRs targeting main/staging, pushes to main/staging, the existing
Monday schedule and manual dispatch. Job names stay unchanged so the required
check contexts continue to match both rulesets.
