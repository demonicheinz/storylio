<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Testing

Use Vitest for unit and integration tests in `tests/**/*.test.ts`. Run
`bun run test` for a complete run, `bun run test:watch` during development,
and `bun run test:security` for the security regression suite.

Use the repository's Playwright CLI for browser verification. Follow the
Testing section in `README.md` to install Chromium, open an isolated session,
run `bun run test:browser`, and close the session. Browser checks run against
an already running local application. The security smoke uses a fixture for
conditional passkey challenges; it does not verify a real WebAuthn sign-in.

Keep production origin checks active in auth integration fixtures: Better Auth
skips them in test mode. Do not use real database or email credentials in the
Vitest security suite.

## Secrets and environments

Application/database scripts use Infisical Cloud: default scripts select `dev`,
`:preview` scripts select `staging`, and `:production` scripts select `prod`.
Keep the explicit environment flags; these slugs are not NODE_ENV values.
Use `bun run build:hosted` when CI/Vercel already injects the environment.
Read `docs/INFISICAL_SETUP.md` for OIDC and Vercel setup. Do not print secret
values or restore legacy `.env.*` files to autoload locations during migration.

## Database and migrations

Use native Drizzle queries and `src/lib/db/schema.ts`; shared client-safe enums
live in `src/lib/db/enums.ts`. Do not recreate a Prisma-compatible query API.
Read `docs/DRIZZLE_MIGRATION.md` before database administration. Existing
databases require a reviewed baseline before `db:migrate` can run. The default
baseline command is read-only; `--apply` writes the migration ledger and requires
explicit authorization for external databases. Never replay the initial CREATE
TABLE migration on an existing database or remove historical Prisma ledgers.

`db:generate`, `db:check`, and `db:format` operate locally without Infisical.
Integration fixtures use PGlite and the archived legacy SQL, never real secrets.

## Work artifacts

Keep reviewable task plans, reports, and non-secret evidence in `task/<task-name>/`.
Keep temporary scripts and local diagnostics in `.tmp/<task-name>/`; `.tmp/` is
ignored by Git and excluded from TypeScript checks. Durable setup and operating
guides belong in `docs/`. Do not put new task artifacts in the legacy `.docs/`.
