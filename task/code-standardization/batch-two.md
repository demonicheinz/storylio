# Sync after PR 23 and cover cleanup

## Git synchronization

PR #23 was squash-merged into staging at `7fc83c5` on 2026-10-30.
Local staging was fast-forwarded to origin/staging; main already matched its
remote and was not advanced to unreleased staging content.

A local backup `backup/code-standardization-before-squash-sync-2026-10-30`
preserves the old cleanup history. Only four cleanup commits were rebased from
the old fix-branch tip onto the squash commit. `git range-diff` reported all
four patches equivalent; comparing the old and rebased trees produced no diff.
The cleanup branch now has four commits beyond staging, without the original
four fix commits appearing a second time. No remote branch was rewritten or
deleted. This batch is not committed or pushed.

## Source inspection and change

The existing graph's broad `cover image` query returned 20 nodes, but its top
matches were fixture/upload symbols rather than the two public cover components.
It was insufficient for this question. Current import searches and source reads
confirmed BlogCover/ProjectCover consumers in Home, archives, details and previews.
No graph relationships were invented to fill that gap.

Both cover components duplicated the image props, failure state, optimized
image and fallback markup. Their failure state outlived the failed source:
after onError, replacing src with a valid URL still rendered the unavailable
message. Project's fallback also retained a 160px child minimum inside a smaller
cover, which could clip content even when the outer aspect ratio stayed correct.

ContentCover now owns the shared image/fallback lifecycle. Its inner CoverImage
is keyed by src, so a new source gets a fresh failure state and callbacks from
an old mounted image cannot set the new source's state. Changes to appearance
alone do not retry an unchanged failed source. Both fallback contents stay
inside the caller's existing image area using absolute positioning.

BlogCover and ProjectCover remain feature adapters with distinct fallback copy
and hover selectors. Their existing props and callers are preserved. Thumbnail
quality 75, detail quality 85, sizes, eager/lazy loading, fetch priority, alt text,
rounded surfaces and Home's independent TiltedCard effect remain intact.

## Verification evidence

- Before the fix Chromium failed with `320px: Covers retained the previous source failure`.
- After the fix both covers passed missing → valid → broken → appearance change
  → new valid source → another valid source → cleared transitions at 320, 390,
  768 and 1440px. No page errors. A deliberately broken data URL is fixture data.
- A 240px-wide cover measured 135px high, with fallback content also 135px high
  for both adapters. Screenshots `covers-*.png` are stored beside this report.
- Mutation check: a separate local bundle removed the source key without changing
  application files. The same browser test failed on source recovery; the normal
  bundle then passed. This verifies the regression check catches the missing reset.
- Browser fixture uses real React components/CSS and a Next Image stub with inline
  images. It does not verify CDN/network optimization or real CMS data.
- Five focused render suites passed 21 tests: fallbacks, quality URL contracts,
  sizes, fetch/loading priority, feature hover styles, cards and screenshots.
- Production build with the existing dev Infisical environment passed (38/38 pages).
- Typecheck and lint passed; git diff --check passed. Full-suite result follows.

## Review and remaining work

Correctness: state reset is source-scoped, not effect-driven; unchanged failed
sources are not retried on unrelated renders. The mounted-source boundary also
keeps late old callbacks isolated. No authorization, uploads, CMS writes or cache
policies changed. The fallback correction is a deliberate bug fix accompanying
the lifecycle consolidation, rather than an incidental redesign.

Architecture: adapters retain feature copy/styles while one shared component
owns failure/loading/geometry. A generic image gallery or state framework was
not introduced. Next step is a bounded decomposition of one dashboard manager,
starting with its detail or batch-action module and existing fixture coverage.

Self-evaluation: accuracy 4/5 (runtime and mutation checks, Next Image stub limit);
completeness 4/5 (this batch done, broader cleanup remains staged); clarity 4/5
(contracts explicit, graph limits documented); actionability 4/5 (rerunnable fixture,
local server required); conciseness 4/5 (duplicated lifecycle removed while adapters
preserve ownership). Overall 4.0/5. Most useful follow-up: run the normal app's
authenticated preview with an intentionally replaced image in disposable data.

## Final result

Full suite: **92 files / 694 tests passed**, 261.04 seconds. Lint checked 848 files;
TypeScript and the production build passed. Chromium cover checks passed at all
four widths, and the isolated missing-key mutation failed as expected. The normal
and mutated fixture servers plus the browser session were closed. `git diff --check`
passed. Both staging/origin-staging and main/origin-main have zero divergence.
No new cleanup commits or remote pushes were performed in this batch.
