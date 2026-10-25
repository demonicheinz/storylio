# Avatar and image cleanup

Date: October 24, 2026
Final status verified: October 25, 2026

## Final result

Application changes are implemented locally and verified with 68 passing tests,
TypeScript, lint, and browser checks. The portrait was removed from the histories
of all three writable GitHub branches: `main`, `staging`, and
`refactor/ui-base-ui`. The atomic force-push succeeded after the user enabled an
administrator-authorized ruleset bypass. A fresh remote check on October 25,
2026 confirmed the three cleaned branch tips below; no tags were present.

GitHub-managed PR references and existing clones are not cleaned by that push.
The local working branch still has its original history and uncommitted app
changes. Do not merge or push its old ancestry into the cleaned branches.

## Applied in the working tree

- Removed the bundled portrait and obsolete PNG logo/icon. `public/images/`
  now contains only `home-hero.avif`.
- Kept logo masters as SVG in `src/assets/logo/`. `Logo` uses the existing
  theme to select the appropriate artwork in the dashboard sidebar.
- Added `ProfileAvatar` for Home, About, dashboard user menus, profile settings,
  and public/admin testimonial cards. Valid uploaded images remain supported.
  Empty or failed images show an orb; old portrait URLs are rejected before
  an image request is made, including absolute URLs and query strings.
- Added a static `LiveOrb` mode with no canvas, WebGL context, observers, or
  animation loop. Small avatars use this mode. About uses the interactive orb.
  Static automatic-theme faces use CSS tokens immediately, including SSR.
- Preserved the user's newly installed favicon assets. No database/profile
  records or Cloudinary files were modified. GitHub history publication is
  recorded separately below; the app changes have not been committed or pushed.

## Verification

- Regression tests cover empty and uploaded avatar sources, old portrait URLs,
  rendered shared fallbacks, static rendering without a canvas, labels, and
  custom colors.
- Full Vitest suite: 11 files and 68 tests passed. TypeScript, targeted Biome,
  and whitespace checks passed. Browser checks ran against the existing local
  Next.js dev server.
- Home at 1440px and 390px: 13 fallback orbs, zero avatar canvases, no horizontal
  overflow, and no requests for the removed images.
- About at 1440px and 390px: one visible interactive fallback orb with a canvas
  and no horizontal overflow. The desktop/mobile profile copies are selected by
  the existing responsive layout.
- A valid CMS-uploaded portrait loaded normally. Its request was then aborted
  only in the isolated test browser to prove that image failures show the orb.
  CMS data was not modified. Reduced-motion media was also exercised.
- The final browser pass recorded no page JavaScript exceptions. Console output
  includes expected aborted-image requests and an existing Next.js `/about`
  blocking-prerender diagnostic about runtime data outside Suspense; this task
  does not alter that route's data-loading boundary.
- New shared components pass the design detector after documenting asset/shader
  export colors. Existing 15px/11px/10px type-ramp advisories in dashboard files
  were not expanded into unrelated layout work.

Temporary browser scripts and screenshots are in `.tmp/avatar-and-image-cleanup/`.

## Published history cleanup

The user explicitly authorized publication after reviewing the scope. An atomic
push with the reviewed old-hash leases was attempted on October 24, 2026, but
GitHub rejected it with GH013. `main` and `staging` prohibit force pushes,
require PRs and six successful checks; `main` additionally requires an active
successful Preview deployment. `refactor/ui-base-ui` was not updated because
the atomic transaction failed. A fresh `git ls-remote --heads --tags origin`
confirmed that all three branch tips remained exactly at their original hashes.

After the user enabled the required bypass, the same atomic push succeeded.
GitHub reported the authorized bypass on `main` and `staging`, and updated all
three branches. The assistant did not edit repository rules. The successful
publication was verified immediately and again on October 25, 2026 with
`git ls-remote --heads --tags origin`. The temporary bypass can now be revoked.

An isolated GitHub mirror was rewritten with git-filter-repo 2.47.0 using
`--sensitive-data-removal --no-fetch --path public/images/heinz.jpg --invert-paths`.
149 of 167 commits were rewritten. All reachable references in that mirror are
cleaned; the original portrait blob is absent from its object database.

The three branch tips were compared against their original trees. Every file
other than the removed portrait is unchanged. Exact old/new branch hashes and
verification results are in `history-audit.json`.

| Remote branch | Original tip | Published tip |
| --- | --- | --- |
| main | d1ca3484 | aa64d793 |
| refactor/ui-base-ui | d1ee4069 | 6e8a4eb8 |
| staging | 37cdc82f | 1842aed9 |

There are no remote tags. The mirror also contains 19 cleaned pull-request head
refs. The post-push PR audit found all 19 GitHub-managed head refs still pointing
to their original commit hashes. They retain old ancestry and cannot be replaced
by a normal push. A draft request for GitHub Support is in
`github-support-request.md`; it has not been submitted. Support eligibility,
forks, old deployments, and existing clones remain separate from updating the
three writable branch refs. Complete removal from every GitHub view or external
copy is not established by this task.

`publish-clean-history.ps1` defaults to local review only. After explicit approval,
`-Apply` publishes exactly these three tips using one atomic push with an explicit
old-hash lease per branch. It refuses changed mirror tips. If a remote branch has
advanced or branch protection prevents rewriting, the push must fail and the
plan must be reviewed again. The script does not edit repository rules; the
successful retry used the bypass explicitly enabled by the administrator.
The original old-hash leases are retained as evidence. This completed migration
should not be rerun against subsequently changed refs.

The working repository's history is intentionally untouched while it contains
the user's uncommitted favicon/logo/orb work and the new implementation. Before
an old local branch is ever merged into the cleaned GitHub history, transfer its
new commits onto the cleaned base (or use a fresh clone with the reviewed patch).
Merging the old history would make the portrait reachable again. The code changes
and existing favicon/logo assets remain in the working tree; this publication
did not commit or publish those pending application changes.

## Self-review

### Dependency audit before commit (October 25, 2026)

`bun audit` reported two high-severity advisories in dependencies unchanged by
this identity cleanup: `body-parser@2.3.0` through shadcn's MCP/Express dependency
chain (GHSA-27r3-jxmh-p828), and `zod@4.4.3` (GHSA-mrhx-c7xc-m3w5). This audit did
not pass. Dependency remediation is a separate pending task; the passing source
checks above must not be read as a clean dependency-security audit.

| Axis | Score | Evidence / remaining work |
| --- | --- | --- |
| Accuracy | 5/5 | Real source tests, runtime fallback checks, and branch-tree comparisons. |
| Completeness | 4/5 | App changes and three-branch publication complete; GitHub-owned PR refs and local ancestry still need separate handling. |
| Clarity | 5/5 | Working-tree changes and remote-history preparation are distinguished. |
| Actionability | 5/5 | Shared components are integrated and a guarded publication script is ready. |
| Conciseness | 4/5 | One shared avatar replaces repeated logic; existing orb engine is retained. |

Overall: 4.6/5. Remaining priorities are restoring normal branch protections,
transferring local work onto the cleaned ancestry, and GitHub Support review of
cached or PR references. No further force-push is needed for the three branches.
