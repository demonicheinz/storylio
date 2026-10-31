# Projects filter policy

Batch six was committed as `91131c8`. This continuation extracts the existing
Projects filter policy into `src/features/dashboard/projects/filtering.ts`.
It remains local and uncommitted.

## Boundary and preserved behavior

`filterProjects` accepts the collection and an explicit typed filter snapshot.
It imports only feature presentation/sorting helpers and types. Tests no longer
need a React renderer, router or action mocks to exercise this policy. The
manager keeps its existing state, memo dependencies, pagination, staged mobile
filters, selection and reorder restoration.

Status, featured, search and technology constraints intersect. Technologies
match any selected exact value; free-text search trims/lowercases the query and
searches title, slug, nullable description and technologies. Sorting still uses
the existing comparator, preserving equal-value order and the source array.
No public query canonicalization or server cache policy is changed.

The local Graphify query returned 124 nodes and displayed 18 under its token
budget. Its snapshot identified the manager, shared filter hook, pagination and
write-action neighbors; current source was inspected to establish this boundary.
The snapshot is not a current dependency audit.

## Verification

- TypeScript AST printer comparison confirmed the extracted function body is
  identical to the previous memo callback body.
- 27 focused tests passed: 14 new filter cases, eight existing sorting cases
  and five existing list/presentation cases.
- Replacing `some` with `every` temporarily caused two expected test failures.
  The source was restored and the 27 real tests passed again. A build was started
  concurrently with that experiment, so it was stopped and restarted only after
  source restoration; that first build is not counted as verification.
- Existing Projects browser checks passed at 1440/1024/768/390/320px: filter
  state, search restoration after reorder, selection scope, pagination, editing,
  preview, draft guards and upload controls. Diagnostic screenshots were written
  to ignored `.tmp/` rather than overwriting historical task evidence.
- Lint passed for 881 files; whitespace checks passed. Final build/typecheck
  results are appended below after completion.

The browser uses synthetic projects and mocked router/actions/uploads. It does
not establish authenticated production writes. A full Vitest rerun is not
required for this isolated, equivalent feature-policy extraction; the previous
batch's 721-test full run is historical evidence, not a new result for this batch.

## Review and next boundary

Correctness: exact-body comparison and explicit OR/intersection/search tests
preserve the old policy. Readability: policy can be read and tested independently
of modal, action and rendering code. Architecture: manager depends on its feature
policy, with no reverse import or new shared collection framework. Security:
authorization and mutation validation are unchanged. Performance: same filter
and sort, same memo dependencies, no additional listeners or network calls.

The manager is 1,158 lines, down from 1,192. Size is an inspection signal; batch
mutation state and other managers remain separate follow-up work. Thumbnail
source-replacement recovery remains deferred as a behavior change.

Self-evaluation: accuracy 4/5 (body comparison and regression checks; mocked
browser writes); completeness 4/5 (one bounded policy, repo cleanup remains open);
clarity 4/5 (explicit filter snapshot, manager still owns several workflows);
actionability 4/5 (focused tests and existing fixture; no real-auth browser check);
conciseness 4/5 (one feature module, no generic filter abstraction).

## Final result

Standalone TypeScript passed. The final production build using the dev Infisical
environment passed, generating 38/38 pages. The focused tests, browser scenarios,
lint and whitespace checks passed as described above. The fixture server and
browser session were closed. No dependencies changed; no commit or push was made.
