# Infisical Cloud setup

Storylio uses Infisical CLI 0.44.3 (validated) for local commands. Secrets live
at the root path `/` in the project linked by `.infisical.yaml`.

| Source | Target |
| --- | --- |
| Infisical `dev` | Local default scripts; Vercel Development |
| Infisical `staging` | Local `:preview` scripts; CI build database; Vercel Preview |
| Infisical `prod` | Local `:production` scripts; Vercel Production |

Environment slugs do not replace `NODE_ENV`. Next.js sets its development or
production mode according to the command.

## Local development

1. Install the native CLI. On Windows:

   ```powershell
   winget install --id infisical.infisical --exact
   infisical --version
   ```

2. Run `infisical login` against the Cloud region used by the project. This
   project was verified with the default US Cloud endpoint. For another region,
   configure `general.domain` in `.infisical.yaml` or `INFISICAL_DOMAIN`;
   use the corresponding region consistently in login, CI, and sync.
3. Keep `.infisical.yaml` in the repository: its project ID is metadata.
   Personal login state, access tokens, and secret values stay outside Git.
4. Run `bun install`. Its Prisma generate step works without database secrets.
5. Use the existing application/database scripts:

   ```powershell
   bun run dev
   bun run build
   bun run db:status
   bun run build:preview
   bun run db:status:preview
   ```

Every managed command uses `infisical sm run`, an explicit `--env`, and
`--path=/`. Production commands retain the `:production` suffix and select
`prod`. Secrets are injected into the child process rather than exported to
a file.

The direct dotenvx dependency was removed. Its package can still appear in
`bun.lock` as a transitive dependency of shadcn tooling; application and database
scripts no longer invoke it.

The old files were preserved as `.env.local.pre-infisical`,
`.env.preview.pre-infisical`, and `.env.production.pre-infisical`.
They remain ignored by Git and are not autoloaded by Bun/Next. Keep
`.env.example` as a variable reference, not an active configuration file.

If Infisical access fails, a managed script should fail rather than silently
using stale files. To roll back the migration deliberately, revert the scripts
and dependency change together, then restore the appropriate local backup.
Never commit the backups.

## GitHub Actions with OIDC

The Quality Checks workflow is prepared for OIDC but remains compatible with the
existing GitHub `DATABASE_URL` secret until the machine identity is configured.
No Infisical client secret or personal login token is needed for the OIDC flow.

The new path is limited to pushes to `main`. Pull requests keep the existing
GitHub database-secret build path; they do not receive an Infisical token or
secrets through the new action. Lint, typecheck, and Vitest do not need Cloud
secrets.

### Configure in Infisical

1. Create a machine identity for this repository's build.
2. Give it read access to `staging`, path `/`, with no secret-write permission.
   The workflow fetches only `DATABASE_URL`; it does not import owner-seed,
   production, email-provider, or other application credentials.
3. Enable OIDC Auth with GitHub as the issuer:
   - Issuer: `https://token.actions.githubusercontent.com`.
   - Bound audience: `infisical` (the workflow sets this explicitly).
   - Bound subject: `repo:<owner>/<repo>:ref:refs/heads/main`.
   - Bind the repository claim to the intended `<owner>/<repo>` as supported
     by the identity configuration.
4. Copy the identity ID. Do not copy a personal token into GitHub.

### Configure in GitHub

Under repository Settings → Secrets and variables → Actions → Variables, set:

| Repository variable | Value |
| --- | --- |
| `INFISICAL_IDENTITY_ID` | The machine identity ID |
| `INFISICAL_PROJECT_ID` | The `project-id` from `.infisical.yaml` |
| `INFISICAL_DOMAIN` | Optional; defaults to `https://app.infisical.com` |

Set both IDs before enabling the path. An identity ID with a missing project ID
fails configuration rather than falling back to the legacy database secret.

The build job grants `id-token: write`, authenticates with the identity, imports
`staging/DATABASE_URL`, and runs `bun run build:hosted`. The Infisical action is
pinned to the verified commit for v1.0.18.

The CI build uses dummy auth configuration; it only needs a staging database.
Keep `secrets.DATABASE_URL` while the pull-request build still uses the legacy
path. Extending OIDC to pull requests requires a separate trust-policy decision;
do not grant all PR subjects access merely to make a build pass.

This local change has not created the machine identity, set repository
variables, pushed a workflow, or triggered GitHub Actions.

## Vercel secret sync

Configure the Infisical Vercel integration in the Cloud dashboard. Create
separate sync mappings and select the intended Vercel project:

| Infisical environment | Vercel environment |
| --- | --- |
| `dev` | Development |
| `staging` | Preview |
| `prod` | Production |

Use the root secret path and configure any Preview branch filters deliberately.
The staging database should be isolated from production. Keep
`NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` aligned with the site's existing
canonical-origin policy.

In Vercel project settings, set the Build Command to:

```text
bun run build:hosted
```

This command uses the environment supplied by the host. The local default
`bun run build` fetches `dev` secrets and needs an interactive CLI login, so the
Vercel build must use the hosted command.

Validate the sync mappings before redeploying Preview, then Production. Public
`NEXT_PUBLIC_*` values must exist at build time; changing them requires a new
build. Secret sync and Vercel settings were not changed from this task.

## Verification

Local checks:

```powershell
bun run db:generate
bun run build
bun run typecheck
bun run lint
bun run test
```

Database status commands are read-only, but migrate, seed, push, reset, and
backfill commands retain their existing write behavior. Their explicit
environment suffix determines which database they affect.

The CLI was able to read all previous variable names in each environment before
the legacy files were archived: 24 keys in dev, 24 in staging, and 22 in prod.
Secret values were not printed or written to reports.

Official references: `https://infisical.com/docs/cli/reference#sm-run`,
`https://github.com/Infisical/secrets-action/tree/v1.0.18`,
and `https://infisical.com/docs/integrations/secret-syncs/vercel`.
