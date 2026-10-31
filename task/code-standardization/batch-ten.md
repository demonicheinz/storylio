# Posts item presentation

Batch nine was committed as `49b9dd9` with normal lint/TypeScript hooks. The audit
still reports the documented low deepmerge advisory; no dependencies changed.
`graphify update .` succeeded after the commit. Its AST update reported no topology
changes; document semantic refresh remains separate. No push was performed.

## Boundary

Extract StatusBadge, PostThumbnail, PostActions and TagPills into the feature's
`components/post-display.tsx`, together with the private action-date formatter.
The manager's grid/list now import the same item controls. The module depends on
feature types, canonical presentation helpers, existing delete UI and shared
primitives. It does not import the manager or add a client entry directive.

The graph query reached 18 nodes (nine displayed within budget). Current source
confirmed that grid, desktop list and mobile list share these controls, while
selection, filter/view state, pagination, publication clock and mutation state
remain in the manager. Those caller contracts were preserved.

Compiled-runtime comparisons matched all five moved functions after removing
only the new export modifier. No markup classes, responsive sizes, status labels,
tag limits, menu policy or image-error state were changed. In particular, thumbnail
recovery when replacing a failed source is still a separate behavior issue, not
silently fixed as part of this mechanical extraction.

PostsManager decreased from 1,443 to 1,239 lines. The display module is 217 lines.
This isolates item presentation from collection orchestration rather than
introducing a generic collection component.

## Verification

- 35 focused tests passed: seven new display cases plus 28 existing collection
  filtering, sorting, publication-clock and publication-state cases.
- New tests cover the supplied clock at the scheduled/published boundary, draft
  status, bounded missing-cover geometry, image alt/sizes overrides, tag limits,
  empty tags and the named menu trigger. The delete module is mocked for these
  static display tests; browser checks exercise the real menu.
- A temporary off-by-one tag limit failed the expected display test. Source was
  restored before the final test run and build.
- Browser publication-clock checks passed: filtered row, summaries, views and
  live action advance together at the due date.
- Existing Posts fixture suite passed at 1440/1024/768/390/320/275px, including
  selection scope, pagination, mobile tag search, staged Reset, direct edits,
  draft save, Note type, dirty guards and saved preview. Diagnostic screenshots
  stayed in ignored .tmp/. The fixture server/browser were closed.
- Standalone TypeScript passed. Final lint/build results follow below.

Browser data/actions/router are synthetic and mocked. No real CMS changes or
authenticated hosted writes were tested. The prior 739-test full-suite result
belongs to the dependency batch; this feature-only equivalent extraction uses
scoped regression checks.

## Review

Correctness: compiled equivalence and clock/menu regression checks. Readability:
item-level rendering is independent of collection-level state. Architecture:
one feature-owned UI module, with no reverse dependency or new shared framework.
Security: delete authorization, publication policy and mutation validation are
unchanged. Performance: same state, imports and rendered tree, no new effect,
network call or timer.

Self-evaluation: accuracy 4/5 (equivalence and browser checks; synthetic writes);
completeness 4/5 (item boundary complete, list/grid/state work remains); clarity
4/5 (ownership explicit, manager still large); actionability 4/5 (existing fixture
and scoped tests, no hosted mutation verification); conciseness 4/5 (one feature
module, no generic wrapper).

## Final result

Final focused run passed all 35 tests. Lint passed for 894 files; standalone
TypeScript, production build (38/38 pages, dev Infisical environment) and whitespace
checks passed. This continuation remains uncommitted and is not pushed.
