Method: dual-agent (A: 01a18853-fa2c-7f21-bd8e-ccbfd7c27685 · B: 01a18853-fb1b-7680-9fb8-6c54f9beee79)

# Dashboard Analytics assessment

Reviewed 2026-10-29 against `e422328`. Assessment only; production UI, queries,
configuration and CMS data remain unchanged. Impeccable and frontend-design
were applied in Operate mode. Independent reports are [A](assessment-a.md) and
[B](assessment-b.md); the parent reconciled them with publication/view-tracking
contracts and browser fixture evidence. A completed before B entered synthesis.

## Verdict

Keep Storylio's navy surfaces, blue analytical emphasis, local fonts, 30px page
title, shared cards and compact supporting metadata. The opportunity is a clearer
order of information and trustworthy states. Another visual theme would not solve
the duplicated rankings or ambiguous source/period relationships.

Provisional Nielsen quality score: **23/40**, higher is better. The independent
source assessment scored 24; the parent reduced error-prevention by one after
confirming the scheduled-publication discrepancy.

| Heuristic | /4 | Finding |
| --- | ---: | --- |
| System status | 2 | Refresh pending exists; freshness and partial-source failures are incomplete. |
| Match to tasks | 3 | Local/lifetime/UTC distinctions are explained; some labels are technical. |
| User control | 3 | Ranking links and refresh exist; truncated identities need recovery. |
| Consistency | 3 | Shared tokens/cards; loading and status definitions diverge. |
| Error prevention | 2 | Scheduled posts can be counted as published; partial errors resemble empty results. |
| Recognition | 2 | Full ranking rows help; duplicated abbreviated plots and scope changes slow scanning. |
| Efficiency | 2 | Mobile scrolling is long; rankings repeat information. |
| Minimalism | 2 | Secondary events/inventory compete with performance. |
| Error recovery | 2 | Normal provider errors handled; action rejection lacks local recovery. |
| Guidance | 2 | Useful scope copy, but metric definitions and labels need clarity. |

## Browser evidence and limits

Native browser inspection was attempted in a fresh tab in Brave Test, but timed
out and reset the automation kernel. A local, source-derived fixture at port3202
then rendered the current Analytics page, chart and Umami components, shared
cards, dashboard shell styles, local fonts and production global CSS. Only server
reads/actions and Next link navigation were substituted; fixture records are
synthetic, including deliberately long slugs. The temporary harness is ignored at
`.tmp/analytics-review/`. It does not exercise authentication, Next streaming,
database aggregation, the complete sidebar, real provider requests or a real
screen reader. The fixture server and isolated CLI session were stopped afterward.

- Widths 1440, 1024, 768, 390, 360 and 320px had document width equal to viewport
  width; no horizontal body overflow or page errors were observed.
- At320px the chart container is238px wide. A132px category axis plus32px chart
  margins leave roughly74px for bars before library-specific layout adjustments.
- The same ranking appears as a chart and a separate full-title/value list. The
  [320px ranking capture](ranking-320.png) shows the duplicated information and
  severely compressed plot.
- With these long-title fixtures, the320px page is4449px tall and the Umami
  heading starts around3405px. This is fixture-specific, not a measurement of the
  owner's actual dataset.
- Desktop and320px screenshots were confirmed after chart entrance animations
  settled. Intermediate-width captures verify layout but may capture animated
  chart drawing. [Desktop](analytics-1440.png), [mobile](analytics-320.png),
  [empty/unconfigured](empty-320.png).
- Card H2s compute to16px; the lifetime subsection is18px. Refresh computes to36px
  on desktop and44px below768px. These are observations, not claims that every
  desktop control must meet a touch-device target.
- The detector returned `[]`; [detector.json](detector.json) reports no matches,
  not accessibility compliance. No injected browser overlay is claimed.

## Strengths

- Lifetime counters, tracked events and UTC daily data already have truthful scope
  explanations. Preserve them when simplifying copy.
- Full ranking titles, exact counts and editor links work without relying solely
  on chart tooltips.
- Optional Umami failures ordinarily leave local analytics available. Never merge
  the two sources into a fabricated total or inferred conversion rate.

## Priority improvements

1. **P1 — Organize by the owner's main question.** The current order is lifetime
   counters, daily trend/recent events, duplicate rankings, inventory, then Umami.
   Prefer recent local performance followed by ranked content, with lifetime
   counters as supporting metadata. Put recent events and content inventory in
   secondary disclosures, or omit inventory if Overview already serves that task.
   Expose Umami through a clearly labeled separate source/view if it is frequently
   used. Do not let a local date filter silently imply it controls lifetime
   rankings or Umami's rolling30-day interval.
2. **P1 — Replace duplicate rankings with one readable representation.** Use a
   ranked list with full title, shared publication badge, exact views and a quiet
   blue bar. Retain the same data and identity on mobile. At320px put secondary
   status below the title instead of allocating132px to an axis. Keep the main
   daily trend as the meaningful chart; do not add carousels or card swipes.
   Sources: [ranking markup](../../src/app/(dashboard)/dashboard/analytics/page.tsx#L221),
   [chart geometry](../../src/features/dashboard/analytics/components/analytics-charts.tsx#L136).
3. **P1 — Align data semantics with the rest of the CMS.** The published-post
   count checks only `status=PUBLISHED`; Overview/Posts also account for future
   `publishedAt`. Show Scheduled separately or exclude it from Published. Ranking
   rows likewise render the raw status and need the same classification. Keep
   lifetime rankings explicitly labeled; include drafts only if this is an
   intentional historical-content view. Local events are cookie-deduplicated per
   content for24hours, not unique people or every page load. Explain this briefly.
   Aggregate timeline events into UTC day counts in SQL instead of transferring
   every event to the page as traffic grows. This is a source-level scaling
   recommendation, not a measured performance regression.
   Sources: [Analytics query](../../src/app/(dashboard)/dashboard/analytics/page.tsx#L85),
   [Overview classification](../../src/features/dashboard/overview/queries.ts#L23),
   [view tracking](../../src/app/api/views/[slug]/route.ts#L18).
4. **P2 — Make loading, refresh and optional-source states truthful.** The loading
   composition is obsolete: Umami first, four statistic cards and four inventory
   groups versus the live page's final Umami, two summaries and three groups.
   Rebuild its shape only when the chosen layout is agreed. Distinguish successful
   empty lists from failed Umami detail requests. Preserve last successful values
   on action transport errors; show stale/error state and a factual update time.
   Refresh should say which source it refreshes. An unconfigured integration
   needs a setup explanation, not a Retry that cannot add configuration. Avoid
   inventing a setup destination or timestamp the backend does not supply.
   Sources: [loading](../../src/app/(dashboard)/dashboard/analytics/loading.tsx#L74),
   [refresh](../../src/features/dashboard/analytics/components/umami-panel.tsx#L115),
   [partial provider results](../../src/lib/umami.ts#L380).
5. **P2 — Clarify identities and chart access.** Rename Environment to Browsers
   and Location to Countries, matching current fetched dimensions. Confirm each
   metric's unit before labeling its count. Allow long paths/referrers to wrap or
   reveal on keyboard/touch. Associate chart heading/description with the chart,
   restore accessible announcements lost by the custom tooltip, and offer exact
   daily values in a compact disclosure/table. Respect reduced motion for loading,
   refresh and chart transitions. Library keyboard navigation already exists;
   do not describe the charts as having no keyboard support.
   Sources: [custom tooltip](../../src/features/dashboard/analytics/components/analytics-charts.tsx#L45),
   [metric rows](../../src/features/dashboard/analytics/components/umami-panel.tsx#L82).

## Suggested composition

Analytics title and source/period explanation → recent local total and daily
trend → Top posts/Top projects ranked rows → collapsed recent events and lifetime
diagnostics. Give Umami an explicit alternate view if the owner uses it often,
otherwise keep a compact optional section. A global date range is a new capability
requiring scoped queries; it is not a cosmetic replacement for the current mixed
periods. Keep default30days initially unless the owner needs7/90-day exploration.

Use the existing 12px card radius, 8px control radius and44px touch controls.
Keep section titles consistent, data numerals tabular, supporting labels12–14px,
and mobile card padding near16px where the current24px consumes plot space.
No decoration, new fonts, full-page entrance or fabricated automated insights.

The emotional goal is a quick answer followed by confidence in what the numbers
mean. Presently the owner must scroll and reconcile repeated representations;
partial failures can create false reassurance. Mobile owners and keyboard/screen
reader users have the largest unresolved usability burden. Contrast and actual
assistive-technology behavior remain unmeasured.

## Decisions for implementation

1. Which source should lead: local content performance or Umami web traffic?
2. Is the next scope layout and clarity first, or also data/status/loading fixes?

No commit or production implementation was performed.

## Review self-evaluation

Accuracy4/5: source contracts and fixture dimensions verified; real provider and
screen-reader behavior remain untested. Completeness4/5: both independent passes,
mobile/desktop and absence states covered; full shell/streaming is excluded.
Clarity4/5: priorities and scope are explicit; source reports contain additional
detail. Actionability4/5: concrete composition and repair points provided; source
priority requires the owner's answer. Conciseness4/5: chat will summarize the five
priorities; detailed evidence remains here. Overall4.0/5. Highest-value follow-up:
confirm source priority, then test accessible announcements and partial failures.
