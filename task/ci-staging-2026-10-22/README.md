# CI and protection for main/staging

Quality Checks now accepts PRs into main and staging, while its push trigger
remains main-only. Trivy accepts PRs into both branches and replaces the unused
develop push target with staging. Schedule and manual dispatch are preserved.
All job bodies, check names, permissions and authentication conditions remain
identical to the prior commit. Infisical OIDC still runs only on main pushes.

Reviewable ruleset templates are in `.github/rulesets/`. Main is based on the
supplied export, removes linear history and permits merge commits only while
preserving its existing approval/deployment/check/bypass requirements. Staging
requires PRs and the same checks, permits squash/merge, and defaults to zero
approvals with no Preview deployment requirement. Neither draft requires linear
history, allowing main-to-staging synchronization after release merges.

Branch and Infisical documentation now describe the integration flow. GitHub
rulesets have not been changed remotely: edit the existing main ruleset and
apply staging only after the workflows produce checks on staging-targeted PRs.
Application instructions: `.github/rulesets/README.md`.

## Validation

- Parsed both workflow YAML files and both ruleset JSON files.
- Compared complete job definitions with HEAD: unchanged.
- Checked PR/push branch event matrix and preserved schedule/manual dispatch.
- Matched all six required check contexts to actual workflow job names.
- Checked merge methods, approval defaults, branch targets and PR-only bypass.
- Biome lint passed on 265 files; diff whitespace checks passed.
- Sanitized validation output: [evidence.json](evidence.json).
- No application build/tests were repeated for these configuration/doc changes.
- GitHub workflow execution and importing rulesets have not been tested remotely.
  actionlint was not installed; validation used the installed js-yaml parser and
  explicit structural comparisons. No dependency was added.

## Self-evaluation

| Axis | Score | Evidence and limit |
| --- | --- | --- |
| Accuracy | 4/5 | YAML/JSON, unchanged jobs and check contexts verified; GitHub import not exercised. |
| Completeness | 4/5 | Workflow, templates and operating guidance delivered; activation remains a separate GitHub action. |
| Clarity | 4/5 | Drafts and live settings clearly distinguished; existing main ruleset must be edited rather than duplicated. |
| Actionability | 4/5 | Commit-ready files and UI steps supplied; remote CI must confirm required checks after rollout. |
| Conciseness | 4/5 | Changes are scoped to CI/protection; JSON repeats the six checks so each template is importable. |

Overall: 4.0/5. Follow-up: verify staging-targeted PR checks before activating
its ruleset, then confirm the release/synchronization merge flow in GitHub.
