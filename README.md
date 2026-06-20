<div align="center">

# Storylio

*A personal portfolio and CMS — built to last, not to scaffold.*

Storylio is a single-owner portfolio and content management system built with Next.js 16, React 19, Prisma, PostgreSQL, BetterAuth, and Cloudinary. It ships with a full dashboard for managing posts, projects, gallery, testimonials, and site content — no code changes required for day-to-day publishing.

[![Quality](https://img.shields.io/github/actions/workflow/status/demonicheinz/storylio/quality.yml?style=plastic&label=Quality&logo=github)](https://github.com/demonicheinz/storylio/actions/workflows/quality.yml)
[![Security](https://img.shields.io/github/actions/workflow/status/demonicheinz/storylio/trivy.yml?style=plastic&label=Security&logo=github)](https://github.com/demonicheinz/storylio/actions/workflows/trivy.yml)
[![Deploy](https://img.shields.io/github/deployments/demonicheinz/storylio/production?label=Vercel&logo=vercel&style=plastic)](https://heinz.id)
[![License](https://img.shields.io/github/license/demonicheinz/storylio?style=plastic&label=License&logo=github)](LICENSE)

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=plastic&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=plastic&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=plastic&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=plastic&logo=prisma&logoColor=white)](https://prisma.io)
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
- **SEO** — per-page metadata, dynamic OG image generation via `@vercel/og`, auto-generated `sitemap.xml` and `robots.txt`

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
- **Custom Prisma output** — client generated to `src/generated/prisma` for better TypeScript integration
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
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL / Neon |
| ORM | Prisma |
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
      <img src="https://res.cloudinary.com/daogetmno/image/upload/v1781975353/storylio/xukbsenkn3bgaaj8kza6.png" width="100%" alt="Dashboard">
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
      <img src="https://res.cloudinary.com/daogetmno/image/upload/v1781975349/storylio/f4shqv0ulttq8lw5dujz.png" width="100%" alt="Editor">
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
- PostgreSQL database or [Neon](https://neon.tech) account
- [Cloudinary](https://cloudinary.com) account
- [Resend](https://resend.com) account

### Setup

```bash
# 1. Clone and install
git clone https://github.com/demonicheinz/storylio.git
cd storylio
bun run install

# 2. Configure environment
cp .env.example .env.local
# Fill in all required variables (see Environment Variables below)

# 3. Set up the database
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Review migration state
bun run db:seed          # Seed owner account and initial content

# 4. Start development
bun run dev
```

The dashboard is at `/dashboard`. Sign in with the credentials from `OWNER_EMAIL` and `OWNER_PASSWORD`.

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled database connection string |
| `DIRECT_URL` | Direct connection string (used by Prisma migrations) |
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
bun run typecheck        # TypeScript check (tsc --noEmit)
bun run lint             # Biome lint + format check

bun run db:generate      # Generate Prisma client
bun run db:status        # Review migration state
bun run db:seed          # Seed owner account and initial content
bun run db:studio        # Open Prisma Studio
```

---

## Integrations

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

1. Set all required environment variables under **Settings → Environment Variables**.
2. Set `NEXT_PUBLIC_SITE_URL` and `BETTER_AUTH_URL` to the production HTTPS origin before the first build.
3. For Preview deployments, keep canonical URL variables pointing at production — BetterAuth safely derives the active `*.vercel.app` origin per request.
4. Use a separate Neon branch for Preview database isolation.
5. Run `bun run db:status` before applying migrations. Do not deploy while local and remote migration histories diverge.

### Pre-launch Checklist

- [ ] All required environment variables are set
- [ ] `bun run build` passes without errors
- [ ] Public routes (`/`, `/about`, `/projects`, `/blog`, `/gallery`) load correctly
- [ ] `/sign-in` and dashboard protection work as expected
- [ ] Media uploads and deletions work via the dashboard
- [ ] Umami tracking script is firing (check network tab)
- [ ] Email delivery works (trigger an email-change confirmation)

---

## CMS Capabilities

- **Posts & Projects** — drafts, publishing, validation, cover images, and public cache revalidation
- **Gallery** — image upload with cropping, captions, categories, and drag-and-drop ordering; items can be hidden without deletion
- **Testimonials** — manageable from the dashboard with ordering and visibility toggle
- **Home sections** — approach phases and client logos are fully editable from the dashboard
- **About** — structured bilingual content (Indonesian / English) with ordering support
- **Media Library** — metadata-rich storage with Cloudinary sync; referenced media is protected from accidental deletion
- **Analytics** — 24-hour deduplicated local view events combined with optional Umami traffic metrics

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
