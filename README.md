# Storylio

Storylio is a single-owner portfolio and CMS built with Next.js 16, React 19,
Prisma, PostgreSQL, Better Auth, Cloudinary, and optional Umami analytics.

## Requirements

- Bun
- PostgreSQL or Neon database
- Cloudinary account
- Resend account for email-change confirmation

## Setup

1. Copy `.env.example` to `.env.local` and fill in the required values.
2. Install dependencies with `bun install`.
3. Generate the Prisma client with `bun db:generate`.
4. Review migration state with `bun db:status`.
5. Seed the owner and initial content with `bun run db:seed`.
6. Start development with `bun dev`.

The dashboard is available at `/dashboard`. Public routes are `/`, `/about`,
`/projects`, `/blog`, and `/gallery`.

## Environment Variables

Required:

- `DATABASE_URL`: pooled application database connection.
- `DIRECT_URL`: direct database connection used by Prisma migrations.
- `BETTER_AUTH_SECRET`: strong Better Auth signing secret.
- `BETTER_AUTH_URL`: canonical production auth origin and fallback, such as
  `https://example.com`. Better Auth derives allowed Vercel Preview origins
  from each request.
- `NEXT_PUBLIC_SITE_URL`: canonical public site origin used by metadata.
- `OWNER_EMAIL`: comma-separated owner allowlist used by the proxy, upload API,
  and every CMS Server Action.
- `OWNER_PASSWORD`: owner password used only by the seed command.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`: server-side Cloudinary credentials.
- `RESEND_API_KEY`, `RESEND_FROM`: transactional email configuration.

Optional:

- `CLOUDINARY_FOLDER`: upload folder; defaults to `storylio`.
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: enables GitHub sign-in only when
  both are present.
- `OWNER_GITHUB_ID`: restricts GitHub account linking to one GitHub numeric ID.
- `RESEND_REPLY_TO`: reserved for deployment-specific email configuration.
- `UMAMI_WEBSITE_ID`: enables the public Umami tracking script.
- `UMAMI_SCRIPT_URL`: custom tracking script; defaults to Umami Cloud.
- `UMAMI_API_URL`, `UMAMI_API_KEY`: enables optional dashboard Umami metrics.
- `UMAMI_SHARE_URL`: displays a link to a shared Umami dashboard.
- `UMAMI_TRACK_LOCALHOST=true`: enables tracking outside production.

Never expose database, Better Auth, Cloudinary, Resend, GitHub, or Umami API
secrets with a `NEXT_PUBLIC_` prefix.

## Integrations

### Cloudinary

Create an image-capable Cloudinary account and provide the three required
credentials. Uploads are processed server-side, stored in the Media Library,
and include width, height, aspect ratio, and a generated blur data URL.
Deleting Media Library items also deletes the Cloudinary asset.

### Better Auth and GitHub

The application disables web registration. `bun run db:seed` creates the
single owner account from `OWNER_EMAIL` and `OWNER_PASSWORD`.

Dashboard access and CMS mutations require the signed-in email to be listed in
`OWNER_EMAIL`. Before changing the login email in Settings, add the new address
to `OWNER_EMAIL` and redeploy/restart. GitHub sign-in appears only when both
GitHub OAuth credentials are configured; set `OWNER_GITHUB_ID` for the
strictest provider guard.

Better Auth accepts the canonical production host, localhost, and Vercel
Preview hosts (`*.vercel.app`). The browser client uses its current origin, so
Preview sign-in requests stay on the Preview deployment. Keep
`BETTER_AUTH_URL` set to the production HTTPS origin in both Production and
Preview environments, and use the same strong `BETTER_AUTH_SECRET` anywhere
sessions must remain compatible.

GitHub OAuth Apps support a fixed callback URL. For Preview GitHub sign-in,
create a separate OAuth App and use a stable branch Preview URL as its callback:

```text
https://<preview-domain>.vercel.app/api/auth/callback/github
```

### Umami

Local post and project views work without Umami. To add public tracking, set
`UMAMI_WEBSITE_ID` and optionally `UMAMI_SCRIPT_URL`. To show Umami metrics in
the dashboard, also set `UMAMI_API_URL` and `UMAMI_API_KEY`. Missing or failing
Umami configuration falls back to local analytics.

## Media Backfills

Always run a dry run first:

```bash
bun run db:backfill-media -- --dry-run --limit=5
bun run db:backfill-gallery -- --dry-run --limit=5
```

Remove `--dry-run` to write resolved image metadata. Add `--force` only when
existing metadata must be regenerated.

## Common Commands

```bash
bun dev
bun db:generate
bun typecheck
bun lint
bun run build
bun db:status
bun run db:seed
bun run db:studio
```

## Deployment Notes

- Set every required environment variable in the deployment platform.
- Set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to the production HTTPS
  origin before building.
- In Vercel Preview, keep the canonical URL variables pointed at production;
  Better Auth safely derives the active `*.vercel.app` origin per request.
- Use a separate Neon branch and, when needed, a separate GitHub OAuth App for
  Preview deployments.
- Configure the GitHub OAuth callback for the Better Auth callback route.
- Confirm Cloudinary and Resend credentials before enabling CMS uploads or
  owner email changes.
- Run `bun db:status` before applying migrations. Do not deploy
  migrations while local and database migration histories differ.
- Run `bun run build`, then smoke-test public routes, `/sign-in`, dashboard
  protection, uploads, and analytics.

## CMS Usage

- Posts and projects support drafts, publishing, validation, images, and public
  cache revalidation.
- Projects, gallery items, testimonials, home sections, and structured About
  content support ordering.
- Gallery items and testimonials can be hidden without deletion.
- Media uploads support cropping in content forms and metadata-rich storage in
  the Media Library. Media still referenced by CMS content cannot be deleted.
- Analytics combines 24-hour deduplicated local view events with optional Umami
  metrics.
