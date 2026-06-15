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
* Create branches from the latest `main` branch and open pull requests back into `main`.

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
