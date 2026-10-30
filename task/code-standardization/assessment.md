# Repository cleanup and standardization

## Scope and method

Requested scope: the whole repository, incrementally. This is the first completed
implementation batch and a triage roadmap, not a claim that every module has had
a line-by-line correctness/security review.

Baseline: 554 tracked code files across source/scripts/tests; 332 source files.
Generated ignored ORM artifacts were excluded. Line counts are inspection signals,
not a quality score. The baseline and current large-file counts are in inventory.json.

Graphify used the existing local graph (3,859 nodes / 8,141 edges). The first broad
query reached 628 nodes and was truncated to 54 by its token budget. Narrow follow-up
queries for `format bytes` and `cover image` guided source inspection. No rebuild or
semantic API calls were made. Current imports and source were checked rather than
assuming that generated graph line numbers were current.

Graph evidence includes `formatBytes()` at
`src/features/dashboard/gallery/components/gallery-item-form.tsx:L197` and its
GalleryDetailDrawer caller at L999 in the pre-refactor graph. That graph also
connects Projects, Posts, Gallery and Media managers to shared UI/filtering helpers.
These are graph snapshot locations; current line numbers changed during cleanup.

## Findings and first-batch changes

| Priority | Finding | Resolution |
| --- | --- | --- |
| Required | Four equivalent pagination/page-size implementations repeat about 150 lines each. | One DashboardPagination in the shared dashboard layer. Byte-for-byte normalized comparison confirmed all four copies equivalent before removal. Collection state remains in each manager. |
| Required | Media, upload queue and Gallery repeat file-size formatting. | One pure formatBytes helper; Gallery retains its contextual Not stored label for unavailable/zero metadata. |
| Reviewed | shadcn provides both the generator and imported application CSS. | Keep shadcn in dependencies: globals.css imports shadcn/tailwind.css. A JavaScript-only import search was insufficient to classify this package. |
| Required | CONTRIBUTING says to branch from main and links to a missing root branch guide. | Align it with the authoritative .github/BRANCH_CONVENTION.md staging-first policy and repair the link. |
| Required | Cleanup rules lack a single contributor-facing implementation guide. | Add docs/CODE_STANDARDS.md and link it from CONTRIBUTING. |

The shared pagination is not a new state framework: it retains the previous exact
markup, handlers, mobile/desktop ranges, page labels, and dropdown behavior. No CMS,
authentication, database schema, upload transport, or public layout was redesigned.

## Open findings and next batches

| Batch | Area | Concrete work and verification |
| --- | --- | --- |
| 2 | Public image components | Review duplicate BlogCover/ProjectCover state/fallback contracts. Project fallback still has a 160px minimum child height while Blog uses an absolute fallback. Test narrow cover geometry, failed-image recovery and source changes before sharing behavior. |
| 3 | Dashboard collection managers | Separate table/grid renderers, batch actions, filters and detail panels by ownership, one feature at a time. Four managers remain large after removing pagination; use existing browser fixtures for sorting, selection, reorder rollback and mobile geometry. |
| 4 | Editors and About/Home forms | Audit autosave/manual-save races, draft guards, field schemas and rich editor integration. Do not merge draft/publication validation or heading/record slug helpers simply because they look similar. |
| 5 | Settings/auth and data actions | Review lock lifecycle, provider refresh, error diagnostics, revalidation-after-commit and authorization with security/PGlite fixtures. No line-by-line security verdict is claimed yet. |
| 6 | UI lint and tooling | Review the blanket src/components/ui lint exclusion; enable rules incrementally with specific justified exceptions. Inspect generated fixtures and graph freshness independently of application code. |

Large vendor/effect engines (Venom, Gooey Nav, Gravity Stars, Live Orb) are separate
review surfaces; line count alone does not justify rewriting their rendering math.
Ignored generated Prisma files were not removed from the developer workspace.

## Dependency audit

- The earlier clean production audit resulted from moving shadcn to
  devDependencies and must not be treated as remediation. That classification
  was removed from branch history after checking the CSS import.
- shadcn stays in dependencies because globals.css imports shadcn/tailwind.css.
- The known low deepmerge 4.3.1 advisory through shadcn remains unresolved.
  No audit exceptions, advisory suppression, or forced overrides were added.
- Upstream shadcn 4.23.0 still declares deepmerge ^4.3.1; no upgrade was applied.
- The GitHub advisory currently lists no patched version:
  https://github.com/advisories/GHSA-gcqx-w48m-w2h4

## Verification

- Shared pagination tests cover first/middle/last/empty pages, range text and current page.
- A deliberate inversion of the Previous disabled condition failed four pagination
  tests; the source was restored and tests passed. This confirms the boundary test
  can detect a real regression rather than merely render the component.
- File-size tests cover zero and B/KB/MB boundaries. Existing upload presentation
  tests continue to pass, including a four-byte file.
- Chromium tested pointer and keyboard paging/page-size changes, disabled boundaries,
  range updates and overflow at 320/390/768/1440px; all passed. Screenshots are here.
- Focused tests: pagination, upload-panel and formatter (15 passed), plus existing
  Posts publication-clock/sorting and Gallery editor regressions (20 passed).
- TypeScript and lint passed. Full suite/build final results are appended below.

## Self-review

| Axis | Score | Evidence / next improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Clone equivalence, mutation test and browser checks; graph is a snapshot, not proof of every current edge. |
| Completeness | 4/5 | First batch and repo roadmap delivered; subsequent feature/security reviews explicitly remain open. |
| Clarity | 4/5 | Rules and prioritized work documented; large manager decomposition still needs feature-specific contracts. |
| Actionability | 4/5 | Shared helpers, fixture and checks provided; full-source security review is a later batch. |
| Conciseness | 4/5 | Four copies replaced with one; source helpers remain small and avoid generic state machinery. |

Overall 4.0/5. Next high-value batch: image fallback/error-state contracts, followed
by one dashboard manager's detail/batch modules. This batch was committed locally at the user's request; its branch is not pushed.

## Batch-one verification completed so far

- Production build passed: 38/38 pages generated with the dev Infisical environment.
- Lint passed: 843 files checked. TypeScript passed as part of build and separately
  after pagination extraction.
- Frozen lockfile validation passed with scripts disabled.
- The earlier production-audit result was superseded by the dependency
  classification correction above; the upstream low advisory remains open.
- Git whitespace checks passed. Browser fixture and its Chromium session closed.

## Final first-batch results

- Full Vitest suite: **92 files / 691 tests passed**, 330.80 seconds.
- The full run surfaced default Next Image quality warnings in screenshot tests.
  A shared renderWithImages helper now supplies the actual application quality
  policy instead of suppressing console warnings. Image delivery and screenshot
  tests were rerun afterward: **6 passed with no quality warnings**.
- Final lint passed: 844 files checked. Final TypeScript check is recorded after
  completion; the production build already passed with all runtime changes.
- Implementation was initially verified before commit. Branch: refactor/code-standardization,
  based on the previously committed content-navigation-and-loading work.
- Final TypeScript check passed; git diff --check passed.

## Delivery

The user subsequently authorized local cleanup commits. Refactor, test configuration
and documentation are committed separately. The cleanup
branch is not pushed; only the prior fix/content-navigation-and-loading branch
is authorized for push and a pull request into staging.

## shadcn classification correction

The local cleanup history was rebased to remove the dependency-classification
commit. package.json and bun.lock retain the staging versions. Documentation now
accounts for the CSS import as well as JavaScript consumers. Official references:
[manual installation](https://ui.shadcn.com/docs/installation/manual) and
[shared CSS/eject](https://ui.shadcn.com/docs/changelog/2026-05-shadcn-eject).
Moving a package between dependency groups is not a vulnerability fix.
