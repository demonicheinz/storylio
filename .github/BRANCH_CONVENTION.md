# Storylio Branch Convention

Use short, descriptive branch names written in `kebab-case`.

## Format

```text
<type>/<description>
```

Examples:

```text
feat/project-screenshot-gallery
fix/dashboard-upload-error
chore/codebase-cleanup
```

## Branch Types

| Type       | Purpose                                                  |
| ---------- | -------------------------------------------------------- |
| `feat`     | New features or functionality                            |
| `fix`      | Bug fixes or regression fixes                            |
| `docs`     | Documentation-only changes                               |
| `style`    | Visual or formatting changes that do not affect behavior |
| `refactor` | Code changes that do not alter user-facing behavior      |
| `perf`     | Performance improvements                                 |
| `test`     | Adding or updating tests                                 |
| `build`    | Build system or dependency changes                       |
| `ci`       | GitHub Actions and automation workflows                  |
| `chore`    | Repository maintenance and cleanup                       |
| `revert`   | Reverting previous changes                               |

Use the same type as the primary Conventional Commit category expected for the branch.

## Scope Guidance

Include the main area of work in the branch description. Common Storylio scopes include:

* `public`, `dashboard`, `auth`
* `posts`, `projects`, `about`, `gallery`, `media`, `analytics`
* `prisma`, `mdx`, `cloudinary`, `umami`
* `deps`, `ci`, `tooling`

Examples:

```text
feat/dashboard-media-crop
fix/auth-preview-origin
refactor/mdx-rendering
build/prisma-upgrade
ci/quality-workflow
docs/environment-setup
```

## Rules

* Use lowercase letters and hyphens only.
* Avoid generic names such as `fix/bug`, `chore/update`, or `feature/new`.
* Each branch should focus on a single primary objective.
* Do not include secrets, personal email addresses, database identifiers, or internal environment names in branch names.
* Create feature and fix branches from the latest `staging` branch and open pull requests into `staging`.
* Promote reviewed changes from `staging` into `main` through a release pull request.
* Create urgent production hotfixes from `main`; merge them into `main` and sync `main` back into `staging`.

## Merge Strategy

* Squash feature/fix pull requests into `staging` so each change has one Conventional Commit.
* Use a merge commit for `staging` → `main` to preserve shared history across releases.
* After a release or hotfix, sync `main` back into `staging` with a merge commit.
  This includes the merge commit created on `main` and keeps future strict status checks up to date.
* Do not require linear history on either long-lived branch when using this flow.
* Require the same six quality/security checks on both targets; activate protection only after their workflows can run on pull requests into that target.

Ruleset templates and application instructions are in [rulesets/README.md](rulesets/README.md).

## Commit Messages

Storylio follows Conventional Commits and enforces them through Commitlint:

```text
<type>(optional-scope): <imperative summary>
```

Examples:

```text
feat(projects): add structured screenshot metadata
fix(auth): preserve preview deployment origins
refactor(dashboard): centralize upload transport
ci: streamline quality checks
```
