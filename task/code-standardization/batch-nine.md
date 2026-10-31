# Posts collection policy

Previous work committed before this continuation:

- `5d33d07`: Projects batch action presentation.
- `2f97527`: patched glob/minimatch resolutions and compatibility evidence.
- `94f047a`: Graphify freshness rules and review index.

All normal commit hooks passed. No push was performed. This Posts continuation
remains uncommitted.

## Investigation and graph freshness

`graphify update .` completed after the commits. Its first run refreshed the code
graph from 3,859 nodes / 8,141 edges to 4,029 nodes / 8,623 edges; subsequent runs
reported no topology changes. No remote semantic extractor was enabled. The CLI
explicitly leaves document/image semantic extraction as a separate operation;
the AGENTS rule now distinguishes that limitation from code freshness.

A query for PostsManager/isPublished/getPostViews reached 127 nodes, showing 12
within its token budget. Current callers confirmed the route and sorting test
imported DashboardPost from the manager, while the rendered status/actions and
collection memos share the publication clock.

## Change and retained contracts

- `types.ts` owns DashboardPost and the sort field/direction unions. The route
  and sorting test import the type directly, without a compatibility re-export.
- `presentation.ts` owns the existing isPublished/isScheduled/isNote/postHref/
  getPostViews helpers. Publication classification continues to delegate to the
  canonical publication-state module. Every time-dependent helper requires `now`.
- `filtering.ts` owns the existing filter and sort callback. It receives the
  explicit filter snapshot and `now`; it has no React, router or action imports.
- The manager retains its clock hook, memo dependencies, statistics, state,
  pagination, selection, staged mobile filters and mutation lifecycle.

Search still matches individual fields, not cross-field joined phrases. Selected
tags match any exact value. Publication sorting retains undated-last behavior in
both directions. Views for drafts/future publications remain zero. Notes links
keep the exact lowercase tag rule and URL-encoded query slug. These rules are not
merged with Projects merely because their filter pipelines look similar.

AST-printer comparisons confirmed the filter/sort body and all five moved helper
functions are identical. ProjectsManager is unaffected. PostsManager decreased
from 1,533 to 1,443 lines; line count alone is not the reason for extraction.

## Verification

- Before extraction, 14 existing sorting/clock/publication tests passed.
- After extraction, those tests plus 14 new pure-policy cases passed (28 total).
  The existing manager rendering tests were retained, including conflicting wall
  and shared clock values; only the type import changed in the sorting test.
- Replacing the selected-tag `some` with `every` failed the expected test. Source
  was restored and all 28 tests passed afterward; the build started only then.
- Publication-clock browser checks passed: deadline advances the filtered row,
  Published/Scheduled counts, views and live action together.
- Existing Posts browser suite passed at 1440/1024/768/390/320/275px: pagination,
  selection, tag search, staged reset, direct edit, draft save, dirty guard, saved
  preview and private Note reading body. Screenshots went to ignored .tmp/.
- Standalone TypeScript and lint (891 files) passed. Build result follows below.

Browser writes/router are mocked and synthetic; no real CMS content changed.
The prior 739-test full-suite result belongs to the previous combined dependency
patch. This isolated equivalent policy extraction uses scoped regression checks,
not a claim of a newly rerun full suite.

## Review and next scope

Correctness: equivalent function bodies, boundary clock/filter tests and rendered
manager integration checks. Readability: domain policy is testable independently
of UI/actions. Architecture: feature-owned modules, no reverse manager imports or
new client entry boundary. Security: action authorization/validation unchanged.
Performance: same memo dependencies, filters/sort and clock, no new listener or
request. Remaining Posts list/grid/display and mutation boundaries need separate
investigation; thumbnail source recovery is still a separate behavior change.

Self-evaluation: accuracy 4/5 (equivalence/runtime evidence, mocked browser writes);
completeness 4/5 (policy complete, wider cleanup remains); clarity 4/5 (explicit
clock/type boundaries, manager remains large); actionability 4/5 (reproducible
tests/fixtures, no hosted write check); conciseness 4/5 (small feature modules,
existing publication classifier reused).

## Final result

Production build passed, generating 38/38 pages using the dev Infisical
environment. Final lint passed for 892 files; whitespace checks passed. The
fixture server and browser session were closed. No new dependency changes or
commits were made during this Posts batch.
