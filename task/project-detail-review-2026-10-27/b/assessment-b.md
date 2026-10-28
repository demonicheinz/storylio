# Assessment B — independent technical and browser evidence

Date: October 27, 2026. Target: `src/app/(public)/projects/[slug]/page.tsx`; live URL: `http://localhost:3102/projects/storylio`. Assessment A findings were not read. Evaluation only; no application, CMS, factual copy, or demo asset edits.

## Detector

Ran exactly once from `D:/GitHub/storylio`:

```powershell
& 'C:/Users/0xvoid/.agents/skills/impeccable/scripts/impeccable.cmd' detect --json 'src/app/(public)/projects/[slug]/page.tsx' 'src/components/public/sections/projects/project-toc.tsx' 'src/components/public/sections/projects/project-screenshots.tsx' 'src/components/public/sections/projects/project-navigation.tsx'
```

Exit 0; stdout `[]`; stderr empty. Total findings: **0**. Each of the four target files has **0** findings. Rule names/counts and finding file:line locations: **none**. There are no emitted findings to classify as false positives. This narrow markup scan does not establish accessibility or responsive correctness. File lengths are recorded in `scan-targets.json`; raw results are in `detector.json`, `detector.stderr.txt`, and `detector-exit.txt`.

## Completed browser checks

Own fresh isolated repository CLI session: `project-detail-evidence-b`, headless Chromium. The requested route existed; archive discovery was unnecessary.

| Viewport | Document scroll width | Horizontal overflow | TOC visible |
|---|---:|---|---|
| 1440 × 1000 | 1440 | No | Yes |
| 1024 × 900 | 1024 | No | No |
| 768 × 1024 | 768 | No | No |
| 390 × 844 | 390 | No | No |
| 320 × 740 | 320 | No | No |
| 844 × 390, short landscape | 844 | No | No |

- All four TOC buttons updated the matching hash, focused the correct heading, and updated `aria-current`. Heading top positions after settling: Overview 112.59px, What Was Built 112.78px, Implementation Detail 112.97px, Outcome 114.16px. Keyboard Enter on Overview also focused `#overview`; subsequent Tab reached its heading-link button with `:focus-visible` and a 2px outline.
- TOC controls measured 240 × 44px at desktop. Hiding the TOC below 1200px matches `public-detail.module.css:156–162`; it is an intentional responsive recipe, not evidence of a broken control.
- Back to projects, Live site, Source, and top navigation measured at least 44px in both dimensions across the sampled sizes. The adjacent project link comfortably exceeded 44px. Four Copy heading link controls measured 32 × 32px across sizes. Shared footer Home/About/Gallery/X links were 37.02/36.91/42.97/30.58px wide and 44px tall. These miss the requested 44 × 44 target recipe; this measurement alone is not a WCAG failure determination.
- Three real fixture screenshot buttons were available. Keyboard activation opened an accessible modal Lightbox; ArrowRight advanced the caption from screenshot 1 to screenshot 2. Escape closed it, restored focus to the screenshot button, and restored body overflow from hidden to visible. Controls: Close 48 × 48px; Previous/Next 64 × 80px. At 320px, document width remained 320px and all three lightbox image resources reported nonzero natural dimensions.
- With reduced motion enabled and the page reloaded, media query matched, root scroll behavior was `auto`, Implementation Detail received focus at 111.97px, and `document.getAnimations()` returned an empty array. Two canvas elements remained; this does not prove all canvas drawing loops stopped.
- No captured page errors or console errors during the browser evidence pass. Four failed requests were local RSC prefetches aborted with `net::ERR_ABORTED`; no application failure was established from those cancellations.
- Observed links: `/projects`, `https://storylio.example.com`, `https://github.com/demonicheinz/storylio`, and `/projects/pulse-analytics`. External destinations and next-project navigation were inspected as hrefs, not visited or availability-tested. The example.com live destination and supplied flower imagery are fixture/content context, not fabricated technical defects; they were left untouched.

## Overlay and cleanup

Mutable injection preflight **passed**: title changed to `[Human] Assessment B`, a script element was appended, and its inline marker executed.

One helper startup succeeded: PID 45364, port 8400. One external `detect.js` injection attempt failed because the application CSP blocked it:

```text
script-src 'self' 'unsafe-inline' https://analytics.heinz.id
```

The blocked URL was `http://localhost:8400/detect.js`. A script node existed, but the detector did not execute: zero overlays, zero Impeccable console messages, and no detector globals. **No reliable user-visible overlay exists.** The session was headless and was not presented as a visible Human tab. CSP was not weakened. Browser fallback evidence is the measured DOM, interactions, and saved captures.

Cleanup completed and confirmed by command output:

```powershell
& './node_modules/.bin/playwright-cli.exe' -s=project-detail-evidence-b close
& 'C:/Users/0xvoid/.agents/skills/impeccable/scripts/impeccable.cmd' live-server stop --keep-inject
```

Outputs: `Browser 'project-detail-evidence-b' closed`; `Stopped live server on port 8400.` The keep-inject flag avoids the stop command's source-removal operation; no source injection was performed. The pre-existing application preview was left running.

## Evidence limits

Raw browser output is `browser-evidence.txt`; extracted machine-readable results are `browser-evidence.json`. Required viewport captures, keyboard focus, desktop lightbox, and 320px lightbox captures are saved alongside this report. Full-page captures were taken from the page top: scroll-triggered screenshot reveals below the fold may remain visually hidden, so blank regions in these captures are not proof of missing gallery content. Some gallery images were still lazy/unloaded in initial measurements; the later lightbox check confirmed image availability. This bounded run did not test every internal destination, every keyboard sequence, formal contrast, assistive technology, or pixel-stable loading states. Temporary evidence scripts remain in `.tmp/project-detail-review-b/` for reproducibility; no production code was changed.

The requested `docs/CODEX-NAVIGATION-GUIDE.md` was absent. An initial `.cmd` Playwright entrypoint was absent; the repository `.exe` worked. Initial sandbox launch failed with EPERM on the local Playwright daemon file; the approved isolated-session launch succeeded. No detector rerun occurred. Existing critique ignore file was absent. No historical critique or Assessment A output was consumed.

Questions skipped: Assessment B evidence handoff only; user requested immediate completion.
