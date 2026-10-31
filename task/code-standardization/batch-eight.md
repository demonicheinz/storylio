# Projects batch action presentation

The preceding filter-policy batch was committed as `f6f472b`, including the normal
lint/TypeScript hooks. This continuation remains uncommitted; no push.

## Change

Move `ProjectsBatchActionsBar` into `components/projects-batch-actions.tsx`.
Selection state, action execution, toasts and refresh remain in the manager.
The component owns the action controls and destructive confirmation markup;
its explicit callbacks and props are unchanged. No generic batch manager or
new client entry boundary is introduced.

This removes dialog-specific imports and 133 lines from ProjectsManager
(1,158 to 1,025). The compiled component function matches its previous version,
after removing only the export modifier. Visual classes, accessible labels,
pending/empty-selection guards and dialog copy remain identical.

## Verification

- 31 focused tests passed: four new batch-control contracts plus the existing
  27 filtering/sorting/list tests. Tests use the existing HAST parser dependencies.
  An initial attempted JSDOM import failed because it is not installed; it was
  replaced with the repository's existing parsing tools without adding a package.
- Temporarily reversing the page-selection label conditional failed two tests.
  The component was restored and all 31 focused tests passed afterward.
- Browser verification passed at 1440/320px: Select/Deselect page, empty selection
  disables publish, Escape cancels deletion without a write, Publish, Move to
  draft, confirmed Delete and exact `project-0` action payloads. No page errors or
  horizontal overflow were observed. Fixture server/browser were closed.
- Standalone TypeScript and lint passed. A production build passed with 38/38
  pages before the separately requested dependency updates. Final combined
  verification is recorded in dependency-security.md.

The fixture uses synthetic content and mocked writes, not authenticated production
mutation tests. State/action error behavior was not rewritten in this extraction.

## Review

Correctness: equivalent compiled function and action wiring checks. Readability:
the confirmation and controls are readable independently of collection state.
Architecture: no reverse import of the manager, state ownership unchanged.
Security: no authorization or validation changes. Performance: same rendered
structure, imports and callbacks, no additional effects or network requests.

Self-evaluation: accuracy 4/5 (equivalence/browser evidence, mocked writes);
completeness 4/5 (UI boundary done, mutation orchestration still in manager);
clarity 4/5 (explicit callbacks, large manager remains); actionability 4/5
(reproducible fixture/tests, requires local server); conciseness 4/5 (one
feature component, no shared framework).

## Final combined verification

After the separate dependency patch, full Vitest passed: 99 files / 739 tests.
Production build passed with 38/38 pages; lint passed for 887 files. Browser,
typecheck and equivalence results above remain valid. All local verification
servers/sessions started for this batch were closed. This batch and the dependency
patch remain uncommitted; only the preceding filter batch was committed.
