<div align="center">

# Storylio

*A personal portfolio and CMS — built to last, not to scaffold.*

Storylio is a single-owner portfolio and content management system built with Next.js 16, React 19, Drizzle ORM, PostgreSQL, BetterAuth, and Cloudinary. It ships with a full dashboard for managing posts, projects, gallery, testimonials, and site content — no code changes required for day-to-day publishing.

[![Quality](https://img.shields.io/github/actions/workflow/status/demonicheinz/storylio/quality.yml?style=plastic&label=Quality&logo=github)](https://github.com/demonicheinz/storylio/actions/workflows/quality.yml)
[![Security](https://img.shields.io/github/actions/workflow/status/demonicheinz/storylio/trivy.yml?style=plastic&label=Security&logo=github)](https://github.com/demonicheinz/storylio/actions/workflows/trivy.yml)
[![Deploy](https://img.shields.io/github/deployments/demonicheinz/storylio/production?label=Vercel&logo=vercel&style=plastic)](https://heinz.id)
[![License](https://img.shields.io/github/license/demonicheinz/storylio?style=plastic&label=License&logo=github)](LICENSE)

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=plastic&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=plastic&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=plastic&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=plastic&logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=plastic&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=plastic&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=plastic&logo=vercel&logoColor=white)](https://vercel.com)

</div>

---

## Features
 
### Public Site

- **Home** — hero section, approach phases, testimonials, and client/tech logos — all editable from dashboard
- **About** — bilingual (Indonesian / English) with toggle, work experience timeline, education history, and technical skills
- **Projects** — filterable grid by category, featured projects section, and full detail page with MDX content and screenshots
- **Blog** — MDX articles with syntax highlighting, sticky table of contents, reading time, view counter, tag filtering, and social share
- **Gallery** — masonry grid with lightbox, category filter, captions, and drag-and-drop ordering
- **SEO** — per-page metadata, dynamic OG image generation via Next.js `ImageResponse` from `next/og`, auto-generated `sitemap.xml` and `robots.txt`

### Dashboard CMS

- **Overview** — stat cards (posts, projects, gallery items, messages) and recent content at a glance
- **Posts** — create, edit, publish, draft, and delete blog posts; MDXEditor with CodeMirror plugin; auto-save every 30 seconds; cover image upload; tag management; scheduled publishing
- **Projects** — full project management with MDX content, screenshots, tech stack tags, live/GitHub URLs, featured flag, and drag-and-drop ordering
- **Gallery** — upload with cropping, caption and category editing, visibility toggle (hide without deleting), and drag-and-drop ordering
- **Testimonials** — add, edit, delete, and reorder testimonials shown on the Home page
- **Home** — edit approach phase cards and client/tech logos directly from the dashboard
- **Media Library** — centralized Cloudinary-backed asset browser with metadata, copy URL, and safe deletion (referenced media is protected)
- **Analytics** — local 24-hour deduplicated view events combined with optional Umami traffic metrics (visitors, visits, views, bounce rate, visit duration, top pages, referrers, browsers, locations)
- **Settings** — update profile (name, tagline, bio, avatar, social links) and change login password

### Auth & Security

- **Single-owner** — web registration disabled; owner account seeded once via CLI
- **Email + password** — credential login with configurable min/max password length
- **GitHub OAuth** — optional; appears only when credentials are configured; supports `OWNER_GITHUB_ID` guard for strictest account restriction
- **Passkey** — WebAuthn/FIDO2 support via BetterAuth passkey plugin (biometrics, PIN, or hardware security key)
- **Content Security Policy** — strict CSP headers with environment-aware `unsafe-eval`, Cloudinary and Umami origins allowlisted
- **Route protection** — all `/dashboard/*` routes protected via `proxy.ts` with owner email allowlist

### Developer Experience

- **Turbopack** — fast dev server with Next.js 16 default bundler
- **Biome** — single tool for linting and formatting (replaces ESLint + Prettier)
- **`use cache`** — static public pages cached at the component level for instant navigation
- **ISR** — blog and project pages revalidate every 60 seconds
- **Typed database schema** — Drizzle tables and relations in `src/lib/db/schema.ts`, with reviewed SQL migrations in `drizzle/`
- **Signed Cloudinary uploads** — API secret never exposed to the client
- **MDX hybrid** — static pages from filesystem (`@next/mdx`), dynamic content from database (`next-mdx-remote-client`)

### Planned

- Uses / Now page
- Guestbook
- Resume PDF generator
- Reading List
- Spotify Now Playing
- GitHub Activity Graph

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI, Luma) |
| Database | PostgreSQL / Neon |
| ORM | Drizzle ORM |
| Auth | BetterAuth (single-owner) |
| Media | Cloudinary |
| Email | Resend |
| Analytics | Umami (optional) |

---

## Preview

<table>
  <tr>
    <td align="center">
      <img src="https://res.cloudinary.com/daogetmno/image/upload/v1781975345/storylio/fl0qrpbeqa9wowwqd6wj.png" width="100%" alt="Homepage">
      <br>
      <strong>Homepage</strong>
      <br>
      Hero
    </td>
    <td align="center">
      <img src="https://res.cloudinary.com/daogetmno/image/upload/v1781976256/storylio/zduoxflarsskwutjgj7o.png" width="100%" alt="Dashboard">
      <br>
      <strong>Dashboard</strong>
      <br>
      Content overview
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://res.cloudinary.com/daogetmno/image/upload/v1781975328/storylio/zms7zzoswjudqq4lmfoz.png" width="100%" alt="Blog">
      <br>
      <strong>Blog</strong>
      <br>
      MDX articles with TOC
    </td>
    <td align="center">
      <img src="https://res.cloudinary.com/daogetmno/image/upload/v1781976252/storylio/qbqbxavbsbboadv4puac.png" width="100%" alt="Editor">
      <br>
      <strong>Editor</strong>
      <br>
      MDXEditor + CodeMirror
    </td>
  </tr>
</table>

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh)
- Infisical CLI (validated with version 0.44.3) and access to the Storylio Cloud project
- PostgreSQL database or [Neon](https://neon.tech) account
- [Cloudinary](https://cloudinary.com) account
- [Resend](https://resend.com) account

### Setup

```bash
# 1. Clone and install
git clone https://github.com/demonicheinz/storylio.git
cd storylio
bun install

# 2. Sign in to the Infisical Cloud project linked in .infisical.yaml
infisical login
# Use .env.example as a variable-name reference; do not copy it to .env.local.

# 3. Verify an existing database without changing it
bun run db:baseline

# 4. Start development
bun run dev
```

The dashboard is at `/dashboard`. Sign in with the credentials from `OWNER_EMAIL` and `OWNER_PASSWORD`.

For a new, empty database, run `bun run db:migrate` followed by `bun run db:seed`
instead of the baseline check. For an existing database, follow
[DRIZZLE_MIGRATION.md](docs/DRIZZLE_MIGRATION.md) before adopting its migration
ledger. No client-generation step is required.

---

## Environment Variables

Infisical Cloud is the source for local application and database commands.
The committed `.infisical.yaml` contains project metadata, not secret values.
Scripts explicitly select the environment and root secret path:

| Script suffix | Infisical environment | Examples |
| --- | --- | --- |
| None | `dev` | `dev`, `build`, `db:status` |
| `:preview` | `staging` | `build:preview`, `db:status:preview` |
| `:production` | `prod` | `build:production`, `db:status:production` |

Installing dependencies and generating migration files do not require secrets
or a database connection. Migration/status/baseline/Studio commands use `DIRECT_URL`;
application queries, seeds, and backfills use `DATABASE_URL` from the selected
Infisical environment.

Keep old `.env.local`, `.env.preview`, and `.env.production` files out of the
autoload locations after migration. Existing copies were preserved locally as
`.env.local.pre-infisical`, `.env.preview.pre-infisical`, and
`.env.production.pre-infisical`; these backups remain ignored by Git.
Keeping an old autoload file would allow missing Infisical keys to fall back to
stale local values. Keep `.env.example` as documentation only.

See [INFISICAL_SETUP.md](docs/INFISICAL_SETUP.md) for CLI setup,
GitHub OIDC configuration, and Vercel secret sync.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled database connection string |
| `DIRECT_URL` | Direct connection string for schema inspection and database administration |
| `BETTER_AUTH_SECRET` | Strong random secret for BetterAuth signing |
| `BETTER_AUTH_URL` | Canonical production origin, e.g. `https://heinz.id` |
| `NEXT_PUBLIC_SITE_URL` | Canonical public site origin used by metadata |
| `OWNER_EMAIL` | Comma-separated owner email allowlist |
| `OWNER_PASSWORD` | Owner password — used only by the seed command |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Sender address for transactional emails |

### Optional

| Variable | Description |
|----------|-------------|
| `CLOUDINARY_FOLDER` | Upload folder name; defaults to `storylio` |
| `GITHUB_CLIENT_ID` | Enables GitHub sign-in when paired with secret |
| `GITHUB_CLIENT_SECRET` | Enables GitHub sign-in when paired with client ID |
| `OWNER_GITHUB_ID` | Restricts GitHub OAuth to one specific GitHub account |
| `RESEND_REPLY_TO` | Reply-to address for outgoing emails |
| `UMAMI_WEBSITE_ID` | Enables public Umami tracking script |
| `UMAMI_SCRIPT_URL` | Custom script URL; defaults to Umami Cloud |
| `UMAMI_API_URL` | Enables Umami metrics in the dashboard |
| `UMAMI_API_KEY` | API key for Umami dashboard metrics |
| `UMAMI_SHARE_URL` | Link to a shared public Umami dashboard |
| `UMAMI_TRACK_LOCALHOST` | Set to `true` to enable tracking outside production |

> **Never** prefix database, BetterAuth, Cloudinary, Resend, GitHub, or Umami API secrets with `NEXT_PUBLIC_`.

---

## Commands

```bash
bun run dev              # Start dev server (Turbopack)
bun run build            # Production build
bun run build:preview    # Build using Infisical staging secrets
bun run build:production # Build using Infisical prod secrets
bun run build:hosted     # Build using environment already injected by CI/Vercel
bun run typecheck        # TypeScript check (tsc --noEmit)
bun run lint             # Biome lint + format check
bun run test             # Run all Vitest unit and integration tests
bun run test:watch       # Watch tests during development
bun run test:security    # Auth boundaries, image processing, and OG regression checks

bun run db:generate      # Generate SQL migration files; does not apply them
bun run db:check         # Check local Drizzle migration history
bun run db:baseline      # Verify an existing schema; read-only by default
bun run db:status        # Report applied/pending migrations and baseline requirements
bun run db:migrate       # Apply migrations to an empty or already-baselined database
bun run db:seed          # Interactive seed menu (dev)
bun run db:studio        # Open Drizzle Studio
```

The seed menu lets you select groups (owner, Home, About, or individual demo
content), enter profile text and review the plan before connecting to the
database. `bun run db:seed -- --dry-run` previews it without writing. Use
`:preview` for staging and `:production` for prod. Login credentials stay in
Infisical; supplied profile fields update an existing owner only when explicitly
selected in the menu. Blank optional answers preserve saved fields. Demo posts
and projects still replace matching demo slugs when selected. See
[database/seeder guide](docs/DRIZZLE_MIGRATION.md).

---

## Testing

Use Vitest for unit and integration tests in `tests/**/*.test.ts`.
`vitest.config.mts` runs them in Node and resolves the application `@/` alias.
CI runs `bun run test` alongside type checking. Vitest stays on the maintained
4.x line to support the project's current Node and TypeScript type ranges.

Database integration tests use in-memory PostgreSQL through PGlite. They replay
the archived schema and verify Drizzle relations, transactions, auth compatibility,
seed idempotence, and migration-baseline safety without live database credentials.

The auth checks use dummy credentials and no live database. Their fixture
enables production mode before importing Better Auth because Better Auth skips
origin checks in test mode. Keep that guard active when extending these tests.

Use the pinned Playwright CLI for browser flows and debugging. Install its
Chromium once:

```bash
bun run browser:install
```

Start the app with `bun run dev` in a separate terminal. Then run:

```bash
bun run browser:open http://localhost:3000/sign-in
bun run test:browser
bun run browser snapshot
bun run browser close
```

`playwright-cli.config.json` selects headless Chromium with an isolated profile.
`tests/browser/security-smoke.js` checks the sign-in form, password visibility,
dashboard protection, anonymous sessions, OG output, and browser runtime errors.
It uses the origin opened in the CLI session, so it can also check a locally
running production build. Conditional passkey challenges use a browser fixture;
a real passkey sign-in needs a dedicated auth database and WebAuthn setup.
Use a dedicated test session: the smoke check clears
that session's cookies. Browser artifacts stay in the ignored `.playwright-cli/`
directory. The browser flow is run separately from the automated Vitest CI step.

To check public navigation caching, use a production build: automatic link
prefetching is disabled in development. Start `bun run build` and `bun run start`,
then run this in another terminal:

```bash
bunx --no-install playwright-cli -s=storylio-navigation open http://localhost:3000 --config=playwright-cli.config.json
bun run test:browser:navigation
bunx --no-install playwright-cli -s=storylio-navigation close
```

This check visits the five navbar destinations twice with delayed RSC requests.
The second round must reuse each visited route without showing the route skeleton
or issuing a blocking navigation request. An initial visit may show the skeleton
if the prefetch has not completed. Run it against public test content.

For About language switching, open a separate session against the same production
server and run:

```bash
bunx --no-install playwright-cli -s=storylio-about-language open http://localhost:3000/about --config=playwright-cli.config.json
bun run test:browser:about-language
bunx --no-install playwright-cli -s=storylio-about-language close
```

The language check waits for the Indonesian prefetch, adds 800 ms to RSC requests,
and verifies English/Indonesian content, active links, query parameters and scroll
position. Prefetched language switches must not issue a navigation request.

To check stack/topic filters, open a production browser session and run:

```bash
bunx --no-install playwright-cli -s=storylio-filters open http://localhost:3000 --config=playwright-cli.config.json
bun run test:browser:filters
bunx --no-install playwright-cli -s=storylio-filters close
```

This check needs published projects and posts with at least two stacks/topics.
It verifies that filter variants are not prefetched on page load, hover/focus
warms the selected destination without navigating, clicking reuses that prefetch,
and resetting to All preserves unrelated query parameters.

For the public GooeyNav checks, start the local app and use a fresh isolated
session. The check needs the published `/projects/storylio` fixture. It verifies
client navigation, active routes, Back/Forward, mobile target sizes, theme
changes, keyboard focus, reduced motion, and WebGL fallback/context recovery:

```bash
bunx --no-install playwright-cli -s=storylio-gooey open http://localhost:3000 --config=playwright-cli.config.json
bun run test:browser:gooey-nav
bunx --no-install playwright-cli -s=storylio-gooey close
```

For the Home Venom CTA, use the existing local app. This checks the Satoshi
label and 44px target, a complete first rendered frame, cached cursor assets,
the orbiting CSS rim during pending shaders, the handover without resizing,
compilation without the parallel extension, shader failure cleanup, transparent
WebGL rendering, motion, native link
navigation, cursor cleanup, full-size resume after scrolling, window blur and
document visibility changes, live reduced motion, context
loss, no-WebGL fallback, and touch. The no-WebGL override uses a separate page:

```bash
bunx --no-install playwright-cli -s=storylio-venom open http://localhost:3000 --config=playwright-cli.config.json
bun run test:browser:venom
bunx --no-install playwright-cli -s=storylio-venom close
```

For Home's entrance and stars, use a separate session against the local app:

```bash
bunx --no-install playwright-cli -s=storylio-home open http://localhost:3000 --config=playwright-cli.config.json
bun run test:browser:hero
bunx --no-install playwright-cli -s=storylio-home close
```

This checks finite entrance timing, visible star cores above the hero scrim,
desktop/mobile layout, reduced motion, the CTA anchor, and the retained Venom
appearance with no rendering loop while paused. Scroll and browser focus changes
must not replay the entrance.

In the same Home browser session, `bun run test:browser:home-scroll` checks Lenis
wheel interpolation, anchor history/focus, footer back-to-top, nested native
scrolling, focus interruption, route cleanup/Back, and touch/reduced-motion
fallbacks. Lenis runs only on Home with a fine pointer and hover, uses Motion's
frame loop, and leaves native window scrolling and the fixed footer intact.

For the complete public redesign integration check, open a production session:

```bash
bunx --no-install playwright-cli -s=storylio-public open http://localhost:3000 --config=playwright-cli.config.json
bun run test:browser:public-redesign
bunx --no-install playwright-cli -s=storylio-public close
```

This checks collection grids, shared footers, native scrolling outside Home,
case-study contents/screenshots, article content, gallery category/lightbox,
empty filters, and cold missing-route HTTP 404. It needs the published Storylio
project, writing and gallery fixtures. `tests/browser/public-surface.js` checks
the current public route at 1440/768/390/320px, including heading visibility and
footer keyboard focus. Existing filter, About-language and GooeyNav checks
remain separate so prefetch behavior and navigation can be inspected directly.

The public typography check compares every route with Home at
1440/1024/768/390/320px. It covers page/section/item roles, featured cards,
heading-decoration scoping, root font scaling, overflow, and article heading copy actions:

```powershell
bunx --no-install playwright-cli -s=storylio-type open http://localhost:3000 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=storylio-type run-code --filename=tests/browser/public-typography.js
bunx --no-install playwright-cli -s=storylio-type close
```

Use published Home, About, project and article fixtures. The article fixture is
`building-storylio-with-server-first-pages`. Typography roles and approved
exceptions are documented in [DESIGN.md](DESIGN.md#typography-and-geometry).

## Integrations

Projects' searchable multi-select is adapted from BeUI's motion multi-select;
the MIT notice is retained in `src/components/common/multi-select/LICENSE`.
Selection uses AND matching and repeated `tech` query parameters. The search
field searches technology names only; the X in the trigger resets the stack.
Run `tests/browser/projects-polish.js` through an isolated Playwright CLI session
to check responsive layout, multi-selection, keyboard/focus, reset, URL state,
empty results, and Back/Forward behavior against the published demo fixtures.
`tests/browser/project-cards-motion.js` checks the uniform Featured badge layout,
cover tilt, stable text, Flow Button focus/hover/reduced-motion behavior, hidden
pagination for the three demo projects, and filter-driven page reset. Database
pagination is covered with fourteen in-memory PGlite fixtures in
`tests/database/public-project-pagination.test.ts`; no live seed data is needed.
`tests/browser/project-card-content.js` verifies natural title height with a
two-line limit, three-line description slots, aligned card footers, three
technology tags plus an overflow count, and browser-only long-text fixtures.
`tests/browser/project-detail-polish.js` checks the earlier mobile cover,
bounded reading width, responsive TOC keyboard/anchor behavior, heading wrapping,
44px copy targets, lightbox focus restoration, and single-neighbor navigation.
`tests/browser/code-block-scroll.js` checks the shared MDX code block's 12px
radius, Shift + wheel, native horizontal wheel, ordinary vertical page scrolling,
zoom modifiers, and short-code fallback with Lenis and reduced motion.
`tests/browser/project-depth-carousel.js` verifies the screenshot stack at
320–1440px with normal/reduced motion: keyboard controls, pointer drag, caption
and counter updates, lightbox synchronization/focus, and vertical wheel scrolling.
`tests/browser/project-depth-touch.js` checks horizontal swipe, tap-to-open, and
native vertical panning in a separate Chromium touch context. Both use the
published `/projects/storylio` demo screenshots and never write CMS data.
Run it against `/projects/storylio` with an isolated Playwright CLI session:

```powershell
bunx --no-install playwright-cli -s=project-detail open http://localhost:3000/projects/storylio --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=project-detail run-code --filename=tests/browser/project-detail-polish.js
bunx --no-install playwright-cli -s=project-detail close
```

Cache and Partial Prefetching policy, public tag invalidation, and protected
route boundaries are documented in [CACHE_AND_PREFETCH.md](docs/CACHE_AND_PREFETCH.md).

### UI primitives

The shadcn components use Base UI with the `base-luma` registry style and the
existing Storylio customizations. Polymorphic components use `render` rather than
`asChild`. Link-rendered Buttons set `nativeButton={false}` and preserve link roles.
Tabs use manual keyboard activation (arrows focus; Enter/Space select); menu
checkbox/radio items stay open after selection unless explicitly configured.
Drawer and Toast also use native Base UI primitives. Notifications use the shared
`toast.add({ title, type })` manager from `@/components/ui/toast`; the provider
wraps application children. No application wrapper imports Radix directly.

For an isolated UI interaction check, temporarily copy
`tests/fixtures/base-ui/page.tsx` to `src/app/ui-migration-check/page.tsx`, start
the local development server, and open that route with the Playwright CLI.
Run `tests/browser/base-ui-smoke.js` via `run-code --filename=...`. The fixture
uses no database/auth credentials or application mutations; remove the temporary
route before a production build. Component migration reports are under
`task/base-ui-migration-2026-10-23/`.

### Cloudinary

Uploads are processed server-side via a signed API route and stored in the Media Library with full metadata: width, height, aspect ratio, and a generated blur data URL. Deleting a Media Library item also removes the asset from Cloudinary. Items still referenced by CMS content cannot be deleted.

### BetterAuth & GitHub

Web registration is disabled. The owner account is created once via `bun run db:seed` using `OWNER_EMAIL` and `OWNER_PASSWORD`.

Dashboard access and all CMS mutations require the signed-in email to be listed in `OWNER_EMAIL`. Before changing the login email in Settings, add the new address to `OWNER_EMAIL` and redeploy.

GitHub sign-in is available only when both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set. Set `OWNER_GITHUB_ID` for the strictest possible guard — limiting GitHub OAuth to a single numeric GitHub account ID.

**Preview environments:** BetterAuth automatically derives allowed Vercel Preview origins (`*.vercel.app`) from each request. Keep `BETTER_AUTH_URL` pointed at the production HTTPS origin in both Production and Preview environments, and use the same `BETTER_AUTH_SECRET` wherever sessions must remain compatible.

**GitHub OAuth in Preview:** GitHub OAuth Apps only support a single fixed callback URL. For Preview sign-in, create a separate OAuth App and set its callback to a stable branch Preview URL:

```
https://<preview-domain>.vercel.app/api/auth/callback/github
```

### Umami

Local post and project view tracking works without Umami. To enable public analytics, set `UMAMI_WEBSITE_ID` and optionally `UMAMI_SCRIPT_URL`. To surface Umami metrics inside the dashboard, also set `UMAMI_API_URL` and `UMAMI_API_KEY`. Missing or failing Umami config gracefully falls back to local analytics.

---

## Media Backfills

When bulk-importing media or regenerating image metadata, always run a dry run first:

```bash
# Dry run (safe — no writes)
bun run db:backfill-media   -- --dry-run --limit=5
bun run db:backfill-gallery -- --dry-run --limit=5

# Apply changes
bun run db:backfill-media
bun run db:backfill-gallery

# Force-regenerate existing metadata
bun run db:backfill-media -- --force
```

---

## Deployment

### Vercel (recommended)

1. Configure Infisical secret sync: `dev` → Vercel Development, `staging` → Preview, `prod` → Production. See [INFISICAL_SETUP.md](docs/INFISICAL_SETUP.md).
2. Set the Vercel Build Command to `bun run build:hosted`. It uses synced environment variables without requiring a CLI login on Vercel.
3. Set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to the production HTTPS origin before the first build.
4. For Preview deployments, keep canonical URL variables pointing at production — BetterAuth safely derives the active `*.vercel.app` origin per request.
5. Use a separate Neon branch for Preview database isolation.
6. Run the matching `db:status` command before applying migrations. Do not deploy while local and remote migration histories diverge.

### Pre-launch Checklist

- [ ] All required environment variables are set
- [ ] `bun run build` passes without errors
- [ ] Public routes (`/`, `/about`, `/projects`, `/blog`, `/gallery`) load correctly
- [ ] `/sign-in` and dashboard protection work as expected
- [ ] Media uploads and deletions work via the dashboard
- [ ] Umami tracking script is firing (check network tab)
- [ ] Email delivery works (trigger an email-change confirmation)

---

## Home redesign verification

With the local app already running:

```powershell
bunx --no-install playwright-cli -s=storylio-home open http://localhost:3000 --config=playwright-cli.config.json
bun run test:browser:home
bun run test:browser:home-interactions
bunx --no-install playwright-cli -s=storylio-home close
```

Checks cover 320–1440px layouts, short screens, light/dark, reduced motion,
keyboard footer focus, touch navigation, failed media, server-rendered markup,
Back navigation, footer scoping and missing-post HTTP 404. Each scenario owns
and closes its page/context. The interactions suite also checks the single-row
6/4/3 technology limits, button-free wipe rotation, pause conditions, keyboard
and touch swipes, and static text with restrained cover tilt. Captures are in
`.playwright-cli/`.

For personal notes and technology logos, see
[Home content guide](task/home-redesign-2026-10-25/content-guide.md).

## CMS Capabilities

- **Posts & Projects** — drafts, publishing, validation, cover images, and public cache revalidation
- **Gallery** — image upload with cropping, captions, categories, and drag-and-drop ordering; items can be hidden without deletion
- **Testimonials** — manageable from the dashboard with ordering and visibility toggle
- **Home sections** — editable approach phases and logo images/order, with technology/client categories and Home stack visibility
- **About** — structured bilingual content (Indonesian / English) with ordering support
- **Media Library** — metadata-rich storage with Cloudinary sync; referenced media is protected from accidental deletion
- **Analytics** — 24-hour deduplicated local view events combined with optional Umami traffic metrics

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
