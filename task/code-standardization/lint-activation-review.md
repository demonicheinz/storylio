# Lint activation decision — 2026-10-31

Previous committed batches: `f7acc5f` (Posts collection rendering) and `ba2456e`
(Gallery types/metadata/filter policy). Their normal hooks passed. No push.

## Finding

The former `linter.includes: ["!src/components/ui/"]` contains only a negative
pattern. Biome's documented glob behavior is that a list with only exclusions
selects no files. Thus earlier successful `bun run lint` commands must not be
interpreted as successful source linting; they still ran formatting/assist checks.

Official reference: [Biome glob syntax](https://biomejs.dev/reference/configuration/#glob-syntax-reference).
Context7 retrieved the official documentation: start with a positive pattern;
feature-specific directory exclusions use `!directory/**`.

Removing that setting exposed **148 errors, 233 warnings and 273 infos** across
the repository. This is not a nine-finding UI-only change. The ignored local JSON
reports retain complete diagnostics; no new dependency or tool installation.

Top categories: 29 unknown pseudo-class errors, 22 hook dependency errors,
18 keyboard/click accessibility errors, 16 array-index-key errors and 16 static
interaction errors. The 233 warnings include 96 important-style warnings,
45 unused-variable warnings and 43 non-null assertions; 272 infos suggest template
strings. Those categories need separate review rather than a blanket unsafe fix.

## Local reviewable draft

The working tree removes the negative-only filter and fixes the original nine UI
findings: five type-only imports, redundant nav role, and three narrow justified
exceptions (forwarded Label association, non-sensitive sidebar cookie and CSS
Modules :global selector). UI-only checking passes. No product layout changed.
No repository-wide autofix was run. The full lint command currently fails on
the exposed pre-existing findings; this draft must not be committed as green.

Build passed with 38/38 pages. Sidebar browser checks passed for desktop/tablet
alignment, mobile layout and animation/reduced motion. Gallery browser regression
checks and 48 policy/PGlite tests passed in the preceding batch. Full suite result
is appended after completion. Browser fixtures use local synthetic data only.

## Decision pending

The user explicitly requested stopping when confirmation is needed. Asked whether
to activate lint incrementally by area (recommended, preserving passing commits)
or activate the whole repo immediately and resolve the complete backlog next.
No dependent configuration rollout or new cleanup commit is made while awaiting
the answer. Prior command success is not used to hide or suppress these findings.

Final combined verification: **103 files / 779 tests passed**, 284.63 seconds.
Production build generated 38/38 pages. Verification servers/browser were closed.
Only repository-wide lint remains failing in the uncommitted activation draft.

## Decision and first rollout

The user selected incremental activation by area. The review above records the
full-activation experiment, not the final configuration. The first approved
scope is `src/components/ui/**`, a positive pattern selecting all 28 primitive
files. Formatting/assist still cover the whole repository. The remaining 148
errors/233 warnings/273 infos are the experiment's baseline, not suppressed new
findings or a claim of current full-repo lint coverage.

The nine targeted primitive fixes/exceptions are retained. No hooks, application
actions or broad automatic fixes were changed. The first rollout is ready for a
separate commit after its passing lint and standard hooks.
