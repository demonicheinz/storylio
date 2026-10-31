# STORYLIO-4: root resume identity

## Evidence and cause

Sentry event 6a99bbc30acc455c99a4d02eabc36d1f in release 146a342 records
next.resume=true, next.render_source=server-rendering, next.route_type=render,
next.revalidate_reason=none, transaction POST /. Other events also occur on
older staging release 7fc83c5; an environment label alone does not identify a branch.

A direct minimal-mode Next 16.4.2 server reproduces the exact resumable-slot error
when the existing root shell is resumed at /index with x-matched-path: /.
The same postponed state resumed at / succeeds. The /index response contains a
$RX client-render fallback and no completed $RC boundary. This was missed by the
initial diagnostics, which tested only the external root URL/query variants.

RouteMotion keys its entire streamed subtree with usePathname(). The shell
records /, while the internal root alias supplies /index during replay. Changing
only that key in the generated diagnostic module eliminates the failure for the
same requests and the original postponed state. Next's installed
shared/lib/page-path/denormalize-page-path.js also maps /index to /.

The source fix applies that exact canonicalization to the React key. Other route
keys, animation timing, reduced-motion behavior, cache configuration and error
reporting remain unchanged. No framework upgrade or dependency was needed.

## Reproducible regression

After bun run build, run with the same read-only environment:

    infisical sm run --env=dev --path=/ -- node scripts/check-home-resume.mjs

The script starts the installed production NextServer in minimal mode on an
ephemeral loopback port and uses index.meta's real postponed state. It tests /,
/index and /index?note=resume-regression-missing. It requires the Home dynamic
boundary (published Notes) in the build. Framework request errors are captured in
memory, not forwarded to Sentry. No database mutations or auth flows are exercised.
This uses installed Next internals and must be reviewed when upgrading Next.

Before the fix, the unit key regression and real HTTP resume regression both
failed. The latter returns nonzero on a replay error even though HTTP status is
200. After a fresh source build, all three resume requests complete with no
renderer errors or $RX fallback. A mutation of only the compiled key back to the
old pathname makes that regression fail again; the artifact is restored
byte-for-byte in finally and the final green check passes.

## Verification and limits

- 29 focused tests passed across route identity, route shells and loading.
- Biome lint/check passed.
- Production build passed 38/38 pages and TypeScript.
- Chromium read-only production-build navigation passed at 1440px with motion
  and 390px with reduced motion, covering all five public routes plus Back/Forward,
  settled wrapper visibility and no horizontal overflow or page errors.
- No full-suite rerun is claimed for this bounded key change. The prior 805-test
  run predates this fix.
- No production deployment or issue resolution is implied. The exact failure and
  minimal fix are verified locally; fresh Preview Sentry events still need to be
  checked after deployment before marking STORYLIO-4 resolved.
- The known low deepmerge advisory remains unchanged; no audit suppression.

Review: one scoped key mapping in the sole caller's shared wrapper; no broad
render-tree rewrite or new dependency. Accuracy 4/5 (red/green HTTP, unit, mutation,
build/browser; hosted validation pending), completeness 4/5 (fix and repeatable
check; production still pending), clarity 4/5 (initial diagnostic gap explicit),
actionability 4/5 (one command reproduces resume behavior), conciseness 4/5 (one-line
production fix; no generic routing abstraction). Overall 4.0/5.
