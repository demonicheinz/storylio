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
