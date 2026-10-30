# Route shell test timeout

2026-10-26. Test-only fix; existing design experiments remain untouched. No staging,
commit, dependency update, timeout increase, or production-route changes.

## Diagnosis

The Projects case awaited its dynamic route import inside the 15s test callback.
Cold evaluation/transformation of the route's UI dependency graph therefore used
the same timer as the assertion about returning a synchronous shell. The page
export itself returns PublicRouteBoundary immediately; request-bound work lives
in the async child. The unresolved params/searchParams promise is deliberately
never awaited by the test.

The reported timeout is intermittent. The baseline isolated run passed, but its
Projects case took 4999ms; Blog took 292ms. Earlier full-suite timeouts for these
imports are also recorded in task/public-typography/verification.md. This run does
not claim a deterministic reproduction or attribute all latency to one library.

## Fix

Use static imports for the same 16 real route exports so module loading happens
during test-file collection. The table-driven callback is now synchronous and
only calls the real page export with unresolved request data, then checks for a
valid React element. The existing database/auth/MDX mocks and configuration check
remain intact. Vitest's documented vi.mock hoisting preserves those mocks before
static imports are evaluated (verified against the Vitest 4.1 documentation via
Context7). Import cost remains visible in the runner's collection/import timing;
this change does not claim to optimize the production dependency graph.

A route changed into an async function that waits for request data still returns
a Promise, so isValidElement still rejects that regression immediately. No route
export is replaced by a fake component and no test assertion was removed.

## Verification

- PASS targeted suite: 17 tests, 8ms total test execution; Projects 1ms, Blog 0ms.
  Route imports are reported separately (9.33s in that run).
- PASS complete suite after fix: 22 files / 162 tests, 48.43s total runner duration.
- PASS lint: 360 files. git diff --check passes.
- PASS TypeScript: bun run typecheck (route type generation and tsc --noEmit).
- vitest.config.mts is unchanged: testTimeout remains 15000ms, hookTimeout 30000ms,
  maxWorkers 2. Browser/build checks are unnecessary for this test-only edit; the
  application and existing running preview are unchanged.

Self-review: accuracy 4/5 (timed-import cause localized; intermittent timeout not
reproduced on demand); completeness 4/5 (all shell cases preserved, import graph
optimization outside scope); clarity 4/5 (setup versus contract timing explained);
actionability 4/5 (run bun run test; no commit); conciseness 4/5 (one test-file
change plus this evidence). Mean 4.0/5. Remaining import cost is visible in runner
output and can be investigated separately if test collection becomes a problem.
