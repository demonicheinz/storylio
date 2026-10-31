# Contributing to Storylio

Thank you for your interest in Storylio. This is a personal project maintained by a single owner, so the contribution model is intentionally lightweight. Please read this document before opening issues or pull requests.

## Before You Contribute

Storylio is built for a specific purpose and vision. Not every feature request or pull request will be accepted, even if it is well-implemented. If you are unsure whether a contribution is in scope, open a [Feature Request](https://github.com/demonicheinz/storylio/issues/new?template=feature_request.yml) or start a [Discussion](https://github.com/demonicheinz/storylio/discussions) first.

Bug fixes, documentation improvements, and security disclosures are always welcome.

## Ways to Contribute

| Type | How |
|------|-----|
| Bug report | [Open a bug report](https://github.com/demonicheinz/storylio/issues/new?template=bug_report.yml) |
| Feature suggestion | [Open a feature request](https://github.com/demonicheinz/storylio/issues/new?template=feature_request.yml) |
| Security vulnerability | [Report privately](https://github.com/demonicheinz/storylio/security/advisories/new) — never via public issue |
| Discussion | [Start a discussion](https://github.com/demonicheinz/storylio/discussions) |
| Code contribution | Fork → branch → PR (see below) |

## Development Setup

### Prerequisites

- [Bun](https://bun.sh)
- [Infisical CLI](https://infisical.com/docs/cli/overview) and access to the project's development environment
- PostgreSQL database or [Neon](https://neon.tech) account
- [Cloudinary](https://cloudinary.com) account
- [Resend](https://resend.com) account

### Local Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/storylio.git
cd storylio

# Install dependencies
bun install

# Authenticate with Infisical (see docs/INFISICAL_SETUP.md)
infisical login
# Secrets are injected by the application scripts; do not create .env.local.

# Set up the database
# Fresh databases only. Existing databases need a reviewed baseline first.
bun run db:migrate
bun run db:seed

# Start development
bun run dev
```

Read [`docs/INFISICAL_SETUP.md`](docs/INFISICAL_SETUP.md) for environment access
and [`docs/DRIZZLE_MIGRATION.md`](docs/DRIZZLE_MIGRATION.md) before database
administration. `db:generate` creates local SQL when the schema changes; it is
not an initial setup requirement. `db:seed` is interactive: review the selected
dataset and target environment before writing data. Keep real credentials out
of test fixtures; database integration tests use PGlite.

## Branch Convention

Follow the branch naming convention documented in [`.github/BRANCH_CONVENTION.md`](.github/BRANCH_CONVENTION.md).

```text
<type>/<description>

feat/gallery-lightbox
fix/toc-active-state
docs/environment-setup
```

Branch routine changes from the latest `staging` and target `staging` in the PR.
Production hotfixes start from `main`; sync them back to `staging` afterward.

## Commit Messages

Storylio follows [Conventional Commits](https://www.conventionalcommits.org):

```text
<type>(optional-scope): <imperative summary>

feat(blog): add reading progress indicator
fix(dashboard): prevent button overflow in gallery cards
docs: update environment variable table
```

Commits are enforced through Commitlint. Your commits must follow this format or the CI check will fail.

## Pull Request Process

1. Run `bun run typecheck`, `bun run lint`, `bun run test`, and `bun run build`; use the security suite when relevant and explain any environment blockers.
2. Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) completely — do not delete sections.
3. Attach screenshots or recordings for any UI changes.
4. Keep pull requests focused on a single objective. Split unrelated changes into separate PRs.
5. Reference the relevant issue number in the PR description if one exists.

Use the repository's Playwright CLI for browser checks as described in
[`README.md`](README.md). Report whether actions and data were mocked, include
responsive viewport sizes, and keep non-secret review evidence in `task/`.
Temporary diagnostics stay in `.tmp/`; generated Impeccable snapshots stay local
in `.impeccable/`. These local directories are ignored by Git.

Pull requests that skip the template, bundle unrelated changes, or fail CI checks will be closed without review.

## Code Standards

Read [`docs/CODE_STANDARDS.md`](docs/CODE_STANDARDS.md) for module boundaries,
shared UI contracts, dependency placement, and verification expectations.

| Tool | Purpose |
|------|---------|
| TypeScript (strict) | All code must be type-safe; avoid `any` |
| Biome | Linting and formatting — run `bun lint` before pushing |
| Drizzle | Use the native schema and queries; schema changes require reviewed migrations |
| Server Components | Default to RSC; use `'use client'` only when necessary |
| Server Actions | All CMS mutations must validate the current session |

## What Will Not Be Accepted

- Changes that alter the single-owner model or add multi-user functionality
- UI changes that deviate significantly from the established dark space aesthetic
- New third-party service dependencies without prior discussion
- PRs that modify `.env.example` to add undocumented variables
- Generated files or build artifacts committed to the repository

## Questions

Open a [Discussion](https://github.com/demonicheinz/storylio/discussions) for anything that does not fit an issue template.
