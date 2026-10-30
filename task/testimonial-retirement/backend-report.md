# Backend testimonial retirement

Backend patch complete; database deployment remains separately authorized work.

- Removed Testimonial from the active schema, Home actions/validation/route, analytics, media usage and seed groups; removed its seeder.
- HomeContentManager receives headline, phases, logos and optional subheadline from the authenticated owner bio. The route owns the Preview Home link.
- Reorder requires the entire PHASE or LOGO collection, excludes HERO, rejects duplicate/unknown IDs and duplicate positions, sorts requested positions and writes contiguous zero-based values in one transaction. Owner authorization precedes database access; failures do not invalidate caches.
- Generated new 0004 migration, snapshot and appended journal entry locally. The new SQL is exactly `DROP TABLE "Testimonial";`, without CASCADE. Earlier SQL, snapshots, journal entries, baseline fingerprint and archived Prisma SQL are unchanged.
- Current application fixtures apply Home HERO/retirement; baseline and pre-HERO fixtures explicitly use currentSchema: false.
- Updated README, PRODUCT, DESIGN, cache guidance, Drizzle rollout/restore guidance and seed menu indices (projects 4, posts 5, gallery 6, notes 7).

## Verification

- Scoped Vitest run: 10 files / 67 tests passed before adding the exact non-CASCADE assertion.
- Final migration + baseline rerun: 2 files / 10 tests passed, including that new assertion.
- Final dependency-failure refinement: retirement test file / 3 tests passed. A dependent view blocks the drop and remains intact. After removing the view, only Testimonial drops; every row and catalog definition in all 21 other populated tables is retained. Backed-up testimonial rows restore using the immutable baseline definition.
- Reorder tests cover PHASE and LOGO success, invalid/partial/mixed/duplicate/HERO requests, authorization and a later SQL failure rolling back earlier writes.
- Scoped Biome check: 17 owned TypeScript/TSX files passed. The retirement test was checked/formatted again after its final refinement.
- bun run db:check passed after the non-CASCADE change. git diff --check passed.
- No full build/typecheck, commit, push, external writes or external database migrations ran. Browser QA belongs to the parent.

## Self-evaluation

| Axis | Score | Evidence / improvement |
| --- | --- | --- |
| Accuracy | 4/5 | PGlite verifies data/catalog preservation, rollback and dependency failure; authorized target-environment rollout checks remain future work. |
| Completeness | 5/5 | All assigned backend/schema/seed/doc/test surfaces changed; historical artifacts and other agents' owned files preserved. |
| Clarity | 4/5 | Rollout order and destructive restore requirement documented; generated snapshot remains large by design. |
| Actionability | 5/5 | Working local patch, migration metadata, passing scoped checks and concrete route prop contract supplied. |
| Conciseness | 4/5 | Runtime changes primarily remove code; 21-table fixture setup is lengthy and could be shared if another migration needs it. |

Overall: 4.4/5. Improvements: perform authorized environment preflight during rollout; reuse the populated migration fixture if future migrations need the same evidence. Would the user agree? Expected yes: scope and verification limits are explicit.
