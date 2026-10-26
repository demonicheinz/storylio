# Hero content, repeating logo wipes and terminal seeder

Implemented the requested follow-up. Existing uncommitted Home redesign work
was retained; no commit, push, application seeding or external migration ran.

## Hero

- The single Venom CTA reads **Selected projects** and targets
  `#selected-projects`. The separate “See my projects” link and its unused CSS
  were removed. The in-page navigation helper is shared with Venom: repeated
  activation, native modified clicks, focus, hash history and reduced-motion
  scrolling remain supported. Ordinary route hrefs still use Next Link.
- The component contract is now `headline` / `subheadline`. Subheadline reads
  the existing profile bio again, preserving its text and physical column.
  Empty values use the established defaults. Hero text supports long words.
- The headline uses a singleton HomeSection (`id=home-hero`, `type=HERO`).
  This keeps Home-specific text in the existing Home content model. The native
  additive migration is only `ALTER TYPE HomeSectionType ADD VALUE 'HERO'`.
- The prepared, authenticated `actionUpdateHomeHero` validates both fields,
  writes headline and bio in one transaction, and invalidates Home/profile
  caches. Dashboard UI changes are explicitly deferred as requested.
- Reads work before the migration because Home looks up the singleton by ID;
  absent configuration uses the default headline. Saving a custom headline
  requires deploying the reviewed migration first. The original migration and
  baseline fingerprint are unchanged. No live environment was migrated.

## Tech stack

The five-second timer no longer stops when all logos fit in one group. Wipe
cycles continue indefinitely, and multiple groups wrap back to the first group.
The same 920ms wipe and 110ms per-slot delay remain, with no visible buttons.
Limits remain 6 desktop / 4 tablet / 3 mobile. Hover/focus, hidden/offscreen
state and reduced motion retain their existing pause behavior.

## Seeder

`bun run db:seed` opens a numbered terminal menu. It supports selecting any
combination of owner, Home defaults, About defaults, demo testimonials, demo
projects, demo posts and demo gallery, plus cancel/all. The environment-specific
scripts preserve explicit Infisical dev/staging/prod flags and label the target.

Selecting owner collects optional display name, role, headline, subheadline,
public email and social/website URLs. There is no hardcoded person or public
profile. A blank new-owner name uses the login email's local part. Login
credentials stay in Infisical and are never prompted, printed or reset.

An existing owner is left untouched unless the menu explicitly opts into applying
the supplied fields. Blank optional answers preserve existing values. An update
does not change IDs, credentials, verification status, sessions or passkeys.
The public profile and optional headline are written atomically. Only selected
content groups run; demo project/post overwrite behavior is shown in the plan.
Demo content remains an optional fixture, rather than being generated from
profile prompts.

The menu displays a reviewable plan and asks for confirmation before importing
the database module. Cancel and `--dry-run` open no connection. Noninteractive
execution is rejected. Only known input/validation errors print details; driver
errors receive a generic message so query parameters or credentials cannot leak.

## Verification

- Full Vitest run: **153/153 tests passed in 20 files** with file parallelism
  disabled. The previous owner-seed failures are resolved by testing supplied
  identity and preservation of saved profiles rather than a hardcoded name.
- New tests cover menu selection/cancel/dry-run/input validation, legacy-schema
  reads, headline/bio persistence, authorization, input length, transaction
  rollback, cache invalidation, explicit seed profile updates and selected groups.
- Migration tests verify original-baseline adoption remains metadata-only,
  the additive migration applies without replaying CREATE TABLE, and a fresh
  schema differs from the original only by the new enum value. `db:check` passed.
- Exercised the actual terminal menu via `tsx ... --environment=dev --dry-run`,
  entered a sample profile and completed it successfully with no DB connection.
- Production build succeeded: **36 routes**, Cache Components and Partial
  Prefetching retained. Independent TypeScript and Biome checks passed.
- Production Chromium suites passed with zero page errors:
  `home-interactions.js`, `venom-button.js`, and `home-redesign.js`. Checks include
  three consecutive desktop single-group wipes, responsive limits, pause states,
  swipe/keyboard access, native CTA anchor scrolling, repeated hash activation,
  route cleanup/Back, reduced motion, no WebGL, failed shaders and six layouts.
- The pending-shader route test now waits for React cleanup after the URL
  changes, rather than asserting synchronously before the route commit finishes.
- `git diff --check` passed, with the existing README CRLF notice.

No Safari/physical mobile run was performed. The database and CLI mutations
were tested against isolated PGlite fixtures only. Custom headline editing in the
dashboard and applying the migration to an external environment remain separate
follow-up steps; the current Home page is compatible before either step.

## Self-evaluation

| Axis | Score | Evidence / limit |
|---|---|---|
| Accuracy | 4/5 | Full tests/build/runtime pass; external migration is explicitly not claimed. |
| Completeness | 5/5 | CTA, bio-backed text contract, repeat wipe and interactive seeder are implemented; dashboard UI is deferred by request. |
| Clarity | 4/5 | Guides explain the alias and migration order; the physical bio name intentionally remains for compatibility. |
| Actionability | 5/5 | Menu runs via existing environment scripts and has a dry-run mode; migration is generated and tested. |
| Conciseness | 4/5 | Menu planning/execution are separated to test cancellation and avoid early connections. |

Overall: 4.4/5. The next practical checks are a reviewed migration deployment and
the future dashboard hero form, followed by Safari/physical touch verification.
