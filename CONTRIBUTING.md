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

# Configure environment
cp .env.example .env.local
# Fill in all required variables

# Set up the database
bun db:generate
bun run db:migrate
bun run db:seed

# Start development
bun dev
```

## Branch Convention

Follow the branch naming convention documented in [`BRANCH_CONVENTION.md`](BRANCH_CONVENTION.md).

```text
<type>/<description>

feat/gallery-lightbox
fix/toc-active-state
docs/environment-setup
```

Always branch from the latest `main`.

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

1. Ensure `bun run typecheck`, `bun run lint`, and `bun run build` all pass locally.
2. Fill in the [pull request template](PULL_REQUEST_TEMPLATE.md) completely — do not delete sections.
3. Attach screenshots or recordings for any UI changes.
4. Keep pull requests focused on a single objective. Split unrelated changes into separate PRs.
5. Reference the relevant issue number in the PR description if one exists.

Pull requests that skip the template, bundle unrelated changes, or fail CI checks will be closed without review.

## Code Standards

| Tool | Purpose |
|------|---------|
| TypeScript (strict) | All code must be type-safe; avoid `any` |
| Biome | Linting and formatting — run `bun lint` before pushing |
| Prisma | All database changes require a migration file |
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
