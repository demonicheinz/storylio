# Glob dependency remediation — 2026-10-31

Requested while continuing Projects cleanup. Keep these package/lockfile changes
separate from the component extraction when committing. No push is authorized.

## Evidence and resolution

The pre-commit audit reported three advisories:

| Package | Installed | Advisory | Patched release | Action |
| --- | --- | --- | --- | --- |
| glob | 13.0.6 | GHSA-3g3m-2fjr-6pw4, moderate | 14.0.2 | Resolve 14.0.2 |
| minimatch | 10.2.5 | GHSA-g3hv-75wg-m249, moderate | 11.0.1 | Resolve 11.0.1 |
| deepmerge | 4.3.1 | GHSA-gcqx-w48m-w2h4, low | None | Keep visible; no suppression |

Official advisories:
[glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
[minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249),
[deepmerge](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).

Registry metadata showed latest @sentry/bundler-plugins 11.10.0 still declares
glob ^13.0.6, and latest @ts-morph/common 0.29.0 still declares minimatch ^10.0.1.
Updating those parent packages alone would not reach the fixed majors. The
existing package.json resolutions mechanism now pins glob 14.0.2 and minimatch
11.0.1; Bun regenerated the lockfile. Parent dependencies remain unchanged.

Both patched packages support Node 18/20/>=22; local verification uses Node 24.
Glob 14 also introduces path-scurry 3, and minimatch 11 uses the nonrecursive
matching package. These are deliberate major transitive updates, so an audit
result alone is insufficient compatibility evidence.

Sentry's actual adapter calls the exported async `glob(patterns, options)` with
absolute/nodir defaults. ts-morph/common calls the named `minimatch` function.
Both interfaces are retained by the patched versions. No dependency was moved
between production and dev groups; shadcn's imported CSS remains supported.

## Verification

- A local Node smoke invoked Sentry's actual glob adapter: brace patterns,
  ignored files, absolute results and an already-aborted signal passed.
- An in-memory ts-morph project selected nested TypeScript files while excluding
  test files. The shadcn CLI still reports 4.22.1 successfully.
- Frozen-lockfile install with dependency scripts disabled passed, no changes.
- Audit now reports one low deepmerge finding, no moderate/high/critical findings.
  Its nonzero exit is retained; this is not a clean audit claim.
- Post-update production build passed with 38/38 pages, including TypeScript and
  Sentry's compile hook. Final lint passed for 887 files; whitespace checks passed.
- Full Vitest passed: **99 files / 739 tests**, 288.55 seconds, with one worker.

Remove these pins once upstream parent constraints allow patched releases and
the lockfile remains free of the affected versions without them. Do not use a
major-resolution override as a substitute for compatibility verification.

Review: the changes are limited to two explicit resolutions and their generated
transitive lock entries. No auth code, deployment configuration or parent package
versions changed. Audit warnings remain enabled. Local compatibility checks do
not prove every possible parent-library pattern; retain normal CI checks.

Self-evaluation: accuracy 4/5 (official advisories, registry constraints and audit;
no claim of a completely clean audit); completeness 4/5 (both available patches,
deepmerge remains upstream); clarity 4/5 (pins and removal criteria explicit);
actionability 4/5 (frozen install/build/smokes, no hosted upload verification);
conciseness 4/5 (two resolutions, no unrelated dependency upgrades).
