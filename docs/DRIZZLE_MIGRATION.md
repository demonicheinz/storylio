# Drizzle migration and database administration

Storylio uses Drizzle ORM 0.45.4, Drizzle Kit 0.31.11, and the existing Neon
WebSocket driver. Better Auth uses the 1.7 maintenance line with its
Drizzle adapter. The application does not generate an ORM client on install.

## What stays compatible

- Except for the separately reviewed Testimonial retirement below, physical
  PostgreSQL table/column names, enums, timestamps, nullability,
  unique indexes, foreign keys and cascades remain unchanged.
- The implicit Prisma Post/Tag table is mapped explicitly as `_PostToTag`,
  with `A` for Post and `B` for Tag.
- Existing IDs, owner records, password hashes, passkeys, and session tokens
  are retained. New application-managed IDs use CUID2 in the same text columns;
  existing CUID strings remain valid.
- Nullable PostgreSQL arrays stay nullable in SQL. Reads normalize them where
  the previous UI contract expects an empty list. New app inserts default to [].
- updatedAt is maintained by Drizzle runtime hooks without adding SQL defaults.
- Auth secrets, OAuth configuration, cookie signing and owner guards are unchanged.

Schema and relation definitions live in `src/lib/db/schema.ts`. Client-safe
enum constants live in `src/lib/db/enums.ts`. There is no Prisma query adapter.

## Pending authentication rate-limit table

`0002_auth_rate_limits.sql` adds the `RateLimit` table with a unique key and a
timestamp index. Production Better Auth requests use this shared storage, so
apply the reviewed migration before deploying the corresponding auth changes,
following the shared-journal rollout below when later migrations are pending.
It preserves every existing user, password hash, session and passkey. Local auth
tests apply it only to PGlite fixtures; implementation work has not applied it to
dev, staging or prod. Use `db:status` and the matching environment's `db:migrate`
script when rollout is authorized. Do not run the baseline migration again.

## Testimonial retirement

`0004_retire_testimonials.sql` is a separate destructive migration that drops only
`Testimonial` without CASCADE; unknown dependencies make it fail rather than
being removed. Testimonials are removed from the application schema, dashboard
Home, analytics, seed menu and media reference checks. All uploaded `Media` rows
and Cloudinary assets remain; a former avatar is not deleted automatically.
Home retains the HERO singleton, ordered PHASE and LOGO collections, and profile
bio subheadline. Reorders require the complete collection of exactly one editable
type, exclude HERO, and commit contiguous zero-based positions atomically.

This patch generates SQL/snapshot/journal metadata locally and tests it in PGlite;
it does not apply migrations to dev, staging or production.

### Shared-journal rollout

`db:migrate` has **no target/stop option**. `scripts/database.ts` invokes Drizzle
with the entire `drizzle` folder; every pending entry in `_journal.json` is applied
in order. Therefore, this checkout applies both `0003` and `0004` when both are
pending. Do not run it expecting only the additive MFA migration. Authorization
for `0003` alone does not authorize a run that also drops Testimonial.

Before the first authorized migration run, inspect the matching environment's
`db:status` output and journal, back up Testimonial's definition and rows (or take
a restorable database backup), verify restoration, and inventory every old app,
worker and external consumer. The drop must be approved explicitly. Keep the
reviewed journal intact; do not manually delete entries or edit the migration
ledger to skip the drop.

- **If `0003` is already applied:** deploy the retirement code first, confirm no
  running consumer still queries Testimonial, then authorize/apply all remaining
  pending migrations (including `0004`) with the verified backup available.
- **If `0003` is still pending:** ship this change as a coordinated maintenance
  release. First prepare the release and verified backup; then pause traffic,
  background workers and old consumers. Run the matching environment's migration
  command for **all pending entries**, deploy the new MFA-aware/no-Testimonial
  application, verify auth/Home/analytics/media health, and only then resume
  traffic and workers. The old application must not keep serving queries while
  the drop runs, and the new application must not serve before its MFA columns
  exist. If a maintenance window is unacceptable, prepare a separate tolerant
  intermediate release; this checkout does not implement that alternative.
  A database-dependent build must use a schema-compatible staging database or
  run after migration while maintenance remains active; do not build against
  missing MFA columns and assume the artifact is ready.

Commands select an environment, not a migration target. Re-run status afterward
and check the applied journal against the exact release. A failed migration or
health check keeps traffic paused until a compatible app/schema or the verified
restore is available. Never resume the legacy app after a successful drop without
restoring its required table and rows.

Dropping the table permanently removes its rows. A code revert cannot restore
them: rollback requires recreating its legacy definition and restoring the backup
before redeploying a version that queries it. PGlite tests verify the old table can
be recreated from the immutable baseline SQL and a retained row restored.
The initial SQL, previous snapshots/journal entries, baseline fingerprint, archived
Prisma SQL and historical ledgers remain unchanged. Existing databases still
baseline against the original 20-table shape, not the retired current schema.
Application fixtures retire Testimonials by default; historical baseline fixtures
explicitly opt out with `currentSchema: false`.

## Existing databases: inspect, then adopt

Before deploying optional MFA, apply the reviewed additive migration
`0003_auth_two_factor.sql`. Follow the shared-journal rollout above: this checkout's
`db:migrate` also applies pending `0004`; it cannot stop after `0003`.
The additive MFA migration adds `User.twoFactorEnabled` (default false) and
`TwoFactor` with encrypted secrets/backup codes and verification-lockout fields.
Existing passwords and passkeys are unchanged. The new user column is queried by
the auth adapter, so deploying code before applying the migration can break login.
This implementation generated and tested the migration locally only; it has not
applied it to dev, staging, or prod. See `AUTH_RECOVERY.md` for the feature policy.

The first Drizzle SQL migration describes the complete existing schema. Its
CREATE TABLE statements are for empty databases. Existing databases adopt that
migration by recording its checksum and timestamp in Drizzle's ledger.

Start with the read-only checks:

```powershell
bun run db:baseline
bun run db:baseline:preview
bun run db:baseline:production
```

They compare catalog metadata for all 20 application tables, indexes,
constraints, enum values, defaults and nullability against
`drizzle/baseline-schema.json`. No application rows are read by these checks.
PostgreSQL-version differences in catalog representation are normalized; NOT
NULL still participates through column metadata.

After reviewing the target environment and authorizing the metadata write:

```powershell
bun run db:baseline -- --apply
bun run db:baseline:preview -- --apply
bun run db:baseline:production -- --apply
```

Run only the environment(s) intended for the current rollout. Each command
rechecks the schema inside a transaction and writes only
`drizzle.__drizzle_migrations` (and its schema/table if absent). It does not
replay CREATE TABLE, alter application data, reseed users, or delete Prisma's
history. Repeating adoption immediately after a successful adoption is
idempotent.

On October 21, 2026 (Asia/Bangkok), dev, staging and prod adopted the baseline
with explicit user approval. Each subsequent status check reported `applied: 1`,
`pending: 0` and `requiresBaseline: false`. Only the Drizzle ledger was written;
application tables and data were unchanged. Sanitized execution evidence is in
`task/maintenance-2026-10-21/evidence/drizzle-baseline-adoption-2026-10-21.json`.

Then inspect:

```powershell
bun run db:status
bun run db:status:preview
bun run db:status:production
```

Status reports applied/pending migrations and `requiresBaseline`. A pending
migration returns a nonzero exit code. An existing schema without a ledger is
expected to report one pending baseline until adoption.

`db:migrate` refuses to run on existing tables without a baseline. A mismatched
schema or migration history also stops the operation. Never mark a mismatched
database as baselined by manually inserting rows or editing the fingerprint.

## New, empty Neon database

Set the correct Infisical environment's DATABASE_URL and DIRECT_URL, then use
the matching migrate and seed commands:

```powershell
bun run db:migrate
bun run db:seed
```

The native Drizzle migrator creates the schema and records the initial
migration. `db:seed` now opens a terminal menu rather than running all seed
functions automatically. Choose one or more numbered groups, or `all`. Enter
profile name, role, headline/subheadline and public links when selecting owner.
Review the environment, profile changes and content groups before confirming.
No database connection is opened for cancel or `--dry-run`.

Menu option 7 adds three Storylio work notes with the exact `notes` tag. It
creates missing posts only and preserves all existing content, draft status,
tags and view counts. This is separate from option 5, which restores demo posts.
CLI writes do not invalidate a running Next.js cache. Hard-refresh the local dev
page after a seed; revalidate or rebuild a deployed app through its usual workflow.

Owner email/password still come from the matching Infisical environment.
Creating an owner no longer hardcodes a name, bio or social links. An omitted
name defaults to the first login email's local part. Existing profiles are
preserved unless you explicitly opt into applying the entered fields. Only
those fields change; credentials, verification status, sessions and passkeys
remain intact. The Home subheadline reuses the existing bio column. Demo content
is separately selectable and keeps its established idempotent seed behavior.

```powershell
bun run db:seed -- --dry-run
bun run db:seed:preview
bun run db:seed:production
```

The new `0001_home_hero.sql` migration adds `HERO` to HomeSectionType. It stores
the editable headline in a singleton HomeSection; it changes no existing rows,
profile columns or credentials. Apply it with the environment's normal
`db:migrate` script before saving a custom headline through the seeder or the
forthcoming dashboard editor. It was tested in isolated PGlite databases; this
task does not apply it to dev, staging or prod. Existing Home reads continue
working before the migration with the default headline and current profile bio.

Do not run the seed as part of adopting an existing database. Existing content
does not need to be recreated for the ORM change.

Like the legacy Prisma seeder, `seedPosts` overwrites sample posts matched by
slug, including dashboard edits, publication fields, tag links and view counts.
Re-seeding is intended to restore sample content; it does not preserve live
analytics for those sample slugs.

## Future schema changes

1. Edit `src/lib/db/schema.ts`.
2. Run `bun run db:generate` and review the generated SQL.
3. Run `bun run db:check`, tests, lint and typecheck.
4. Apply to an isolated test database, then to the intended environment with
   the matching `db:migrate` command.
5. Deploy the matching application version.

`db:generate` creates local SQL/snapshot files and needs no secrets. Its
`:preview` and `:production` aliases generate the same shared migration files;
they do not contact a database. `db:format` formats the schema TypeScript.

The initial migration, journal entry and baseline fingerprint form an immutable
starting point. Formatting JSON metadata does not change the SQL checksum;
editing the initial SQL does. Add later migrations rather than rewriting it.

`db:push` remains available for disposable development databases. It directly
syncs the schema and does not establish migration history. Use reviewed
migrations for databases with retained data. Drizzle Kit is restricted to the
declared application tables so the historical ledger is outside push scope.

The automatic `db:reset` compatibility command stops with a retirement message.
Use a new isolated database when a clean state is needed.

## History and rollback

The original schema and three SQL migrations are archived in
`db/legacy-prisma/`. The original `_prisma_migrations` table is retained in live
databases. Neither archive nor ledger is used to replay the initial Drizzle SQL.

While application schemas remain unchanged, rollback means reverting the
application/package changes and reinstalling the previous dependencies.
The previous Prisma code can still read the same rows and existing IDs.
Once later migrations alter schema/data, review rollback against those
specific migrations instead of assuming a code revert is sufficient.

## Verification

`bun run test` uses PGlite databases initialized from the archived PostgreSQL
SQL, not real credentials. Integration coverage includes auth/password/session
compatibility, tag and screenshot links, ordering rollback, protected media,
seed idempotence, atomic view tracking, empty-database bootstrap, schema-drift
rejection and metadata-only baseline adoption.

The migration was also checked by comparing Prisma and Drizzle reads in memory
for all 19 models on dev. All model counts and fields matched; rows and secret
values were not exported to reports. Live catalog preflights matched on dev,
staging and production. Full WebAuthn and GitHub OAuth ceremonies still need a
dedicated auth preview environment.

An esbuild resolution aligns Drizzle Kit's old helper with the patched version
already used by the test toolchain. Local SQL generation and migration checks
must keep passing when changing this override.

Official references: `https://orm.drizzle.team/docs/migrate/migrate-from-prisma`,
`https://orm.drizzle.team/docs/connect-neon`, and
`https://orm.drizzle.team/docs/migrations`.
