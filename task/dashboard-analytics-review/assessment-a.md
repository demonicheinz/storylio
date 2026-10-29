# Assessment A — Analytics

Independent design assessment grounded in source, supplemented by parent-reported fixture evidence below. No detector or other assessment was read. No app code, configuration, or real data was changed.

Parent fixture evidence: current production UI source rendered with only server reads mocked; no body overflow at 1440, 1024, 768, 390, 360, or 320px. At 320px, charts measure 238px wide; the 132px category axis and margins leave approximately 74px of plotting width. With the long-title fixture, the Umami heading begins at y=3405px in a 4449px page. Card titles are 16px; the Lifetime section heading is 18px. Screenshots are recorded as `task/dashboard-analytics-review/analytics-{width}.png`. These measurements were supplied by the parent, not independently rerun or visually inspected here. Contrast, chart keyboard behavior, focus treatment, and individual text/tooltip clipping remain unverified.

## Design-specificity verdict

**Partially specific: Storylio’s visual language is established; the analytics composition needs a clearer editorial hierarchy.** The navy surfaces, sequential blue chart tokens, Clash Display page heading, Satoshi controls, restrained borders, and compact summary connect this screen to the polished Projects/Posts/Media surfaces. Keep those choices. Its remaining weakness is the sequence of similarly framed panels and duplicated representations, rather than a need for a new palette, typeface, decoration, or dashboard template.

This is a private CMS for the owner, per `PRODUCT.md:9–14`. A sensible working task is “check recent local performance, identify content worth inspecting, and understand what the numbers cover.” That task is an assessment assumption, not a confirmed product requirement. Visitors and business marketing teams are not established analytics personas.

`DESIGN.md:263–279` supports labeled blue charts; `DESIGN.md:281–340` preserves the font identity and explicitly separates dashboard typography from public typography. Do not impose public 40/56px headings here. The shell already normalizes dashboard H1s to 30px/600 (`dashboard-shell.module.css:6–10`), so the different H1 weight utilities in Analytics versus the collection managers are not evidence of a rendered inconsistency. `DESIGN.md:599–601` says the dashboard has not been redesigned; the recently polished manager source is the more specific current consistency reference.

## Nielsen scores

Provisional **quality scores: 0 = fails, 1 = weak, 2 = mixed, 3 = good, 4 = strong**. Higher is better. Total **22/40**. These are design judgments, not measured user-test results. If a parent rubric uses conventional inverse severity, the corresponding aggregate is **18/40**, where higher is worse; do not mix the two scales. Consistency and error-prevention scores incorporate the additional scheduled-publication finding.

| Heuristic | Quality /4 | Evidence and implication |
| --- | ---: | --- |
| 1. Visibility of system status | 2 | Refresh disables and changes its label; loading has busy semantics. However, the page skeleton depicts the wrong composition, and partial Umami failures have no explicit status. |
| 2. Match with the real world | 3 | Clear lifetime/local/UTC language and published/draft status. “Tracked events,” “Environment,” and “Location” still require interpretation. |
| 3. User control and freedom | 3 | Ranking titles open editors; Umami has refresh and an optional external destination. No destructive analytics control is exposed. Long truncated identities have no explicit reveal affordance in these components. |
| 4. Consistency and standards | 2 | Shared shell, summary, card, fonts, and semantic colors match the collection managers. However, Analytics counts future scheduled posts as published, unlike Posts’ time-aware classification. |
| 5. Error prevention | 2 | Collection-history caveats and “Unavailable” scalar metrics help. Scheduled records counted as published, partial-list failures, and configuration retry can still mislead. |
| 6. Recognition rather than recall | 2 | Full ranking titles and exact values are available in the list. Fixed chart abbreviations and visually separated time/source explanations require cross-reference. |
| 7. Flexibility and efficiency of use | 2 | Direct editor links help an experienced owner. Both ranking charts repeat their lists, and the mobile stack places activity before ranked performance. Fixed scope itself is not a defect requiring a date picker. |
| 8. Aesthetic and minimalist design | 2 | Restrained token use and compact summary are strengths. Equally framed panels, duplicated rankings, and secondary inventory dilute emphasis. |
| 9. Help users recognize, diagnose, and recover from errors | 2 | Unavailable optional service has a readable status and retry; a dashboard error boundary exists. Partial-detail failure is not identified, and Retry cannot fix absent configuration. |
| 10. Help and documentation | 2 | Useful inline scope explanations exist. Metric definitions, data freshness, and a distinction between empty and failed detail requests are incomplete. |
| **Total** | **22/40** | **Source assessment supplemented by parent fixture measurements; interaction evidence may change individual scores.** |

## Strengths to preserve

- **Truthful measurement boundaries:** lifetime counters and event records are explicitly different (`page.tsx:411–443`); the trend specifies 30 UTC calendar days and incomplete today (`page.tsx:194–201`); recent events explicitly span all history (`page.tsx:340–343`). Do not invent comparison percentages or imply these sources reconcile.
- **Quiet, consistent foundation:** `dashboardStyles.page` and `DashboardSummary` reuse the collection-page language (`shared/styles.ts:2`, `shared/components/summary.tsx:11–22`; Projects manager `1587–1597`, Posts `1359–1366`, Media `1314–1323`). Cards have ordinary navy surfaces and 12px recipe geometry rather than repeated glows (`ui/card.tsx:14`).
- **Useful ranking fallback:** full titles, actual view counts, publication status, and editor links remain available outside chart tooltips (`page.tsx:261–280`). This is valuable for touch and nonvisual access and should survive any chart simplification.
- **Honest absence in several states:** zero-event trend, no records, unavailable Umami values, and optional unconfigured service are expressed separately (`page.tsx:205–209,252–256,347–351`; `umami-panel.tsx:122–145,150–178`). Change the remaining inconsistencies without replacing this foundation.

## Prioritized problems and concrete suggestions

### 1. P1 — Ranking charts lose too much usable width at 320/360px

**Source-confirmed geometry, supported by parent fixture measurement; no body overflow observed in that fixture.** `analytics-charts.tsx:138–164` reserves a 132px category axis plus 32px left/right margins inside a fixed 256px-high chart. The shell uses 16px side padding (`shell/dashboard-shell.module.css:26–31`), and card content adds 24px per side (`ui/card.tsx:71–75`). The parent's measured chart content width is 238px at 320px; the equivalent 360px width is approximately 278px by source calculation. Only about **74px / 114px** remain after the category axis and margins, before library-specific layout. This is a readability and information-density concern despite successful body containment; it is not an observed horizontal-page-overflow defect.

Titles are independently shortened after 20 characters (`page.tsx:230–237`), although full titles and counts appear immediately below the chart (`page.tsx:260–280`). Two ranking charts therefore cost at least 512px of plot height on mobile before their repeated lists.

**Recommendation:** make one compact ranked list the primary representation at narrow widths: full wrapping title, status, exact count, and a quiet blue bar beneath each row. Reuse the collection pages’ Satoshi title treatment and divider rhythm. Keep exact values and editor destinations visible; do not make identity depend on hover. If desktop retains the separate plot, justify what it adds over these same rows. Keep the existing blue scale or one blue fill, with text determining identity and order.

**Review target:** at 320 and 360px, long and similar-prefix titles are distinguishable, counts stay associated with the correct title, and plot labels are not needed to recover identity. Test large counts too.

### 2. P1 — The page gives collection bookkeeping precedence over the main performance question

**Source-based hierarchy judgment.** The order is lifetime explanations/summary → trend plus recent activity → two rankings → content inventory → optional Umami (`page.tsx:434–463`). The recent 30-day total is embedded in muted descriptive prose (`page.tsx:196–201`), while the first explicit section heading is lifetime analytics. All five local cards use the same default card treatment. On mobile, the entire recent-events panel precedes both rankings.

Parent evidence supports the hierarchy concern: card headings are 16px versus 18px for Lifetime, and the Umami heading appears at y=3405px on the 4449px long-title page, approximately 77% down its document height. This is fixture-specific, not a typical-content height claim. Optional Umami need not move to the top; reducing duplication and placing content performance before activity are the first improvements.

**Recommendation:** retain the familiar title, introduction, and compact lifetime summary; make the trend the primary analytical panel, with its real 30-day local event total as a modest 24–30px tabular value. Put “30 UTC calendar days · today incomplete” beside it in supporting text. Follow with Top posts/Top projects, then recent events. Reduce inventory to a quiet supporting summary or disclosure; retain its “includes hidden items” scope. Keep optional Umami as a separately labeled source section. Do not introduce hero-sized KPI tiles or an unsupported global date filter.

Keep the lifetime collection-history explanation adjacent to its totals. A local 30-calendar-day view and Umami’s rolling 30-day window are different scopes (`src/lib/umami.ts:261–273`); a single date badge must not imply otherwise.

**Review target:** the first useful scan answers “how many local views in this period?” and “what content leads?”, without suggesting that visitors, counters, events, and Umami views share a denominator.

### 3. P2 — The loading screen promises a different page

**Source-confirmed mismatch.** `analytics/loading.tsx:82–107` starts with a large five-metric Umami panel and four statistic cards. The loaded screen starts with two inline lifetime totals and puts optional Umami last (`page.tsx:411–443,460–463`). The loading inventory also depicts four tiles (`loading.tsx:120–139`) where the result is three inline groups (`page.tsx:296–325`).

**Recommendation:** align the fallback’s order and rough dimensions with the actual local page: stable Analytics heading, compact two-item summary, trend, rankings, activity, supporting inventory. Keep optional loading in the existing lightweight `UmamiPanelSkeleton` (`umami-panel.tsx:254–262`). Hide decorative blocks from assistive technology, provide a named loading status, and use reduced-motion-safe placeholders, following `shared/components/route-boundary.tsx:14–25`.

**Review target:** a delayed local load should reveal the same section order it previews. Measure actual movement with parent browser evidence; no layout-shift magnitude is claimed here.

### 4. P2 — Publication and optional-service labels imply more certainty than their underlying states

**Source-confirmed publication inconsistency.** Analytics derives `publishedPosts` solely from `status === PUBLISHED` (`page.tsx:85`), then labels that count “published” in inventory (`page.tsx:298–300`). A future-dated scheduled post therefore contributes to this number. Posts explicitly classifies a PUBLISHED record with future `publishedAt` as “scheduled” (`src/features/dashboard/posts/publication-state.ts:4–11`); the parent also reports time-aware classification in Overview. The owner can see conflicting published counts across adjacent dashboard screens.

**Recommendation for inventory:** use the same time-aware publication definition and show scheduled records separately; total posts should remain inclusive. Explain historical/all-status inclusion separately for lifetime counters and rankings rather than silently changing those metrics. A fixture containing one live published post, one future scheduled post, and one draft should read “3 total · 1 published · 1 scheduled · 1 draft” consistently across the dashboard. This is a future implementation suggestion; no counts or records were changed for this assessment.

**Source-confirmed state ambiguity.** A successful statistics request produces `status: "available"`, while failed page/referrer/browser/country requests become empty arrays (`src/lib/umami.ts:380–402`). The component then displays “Connected” and ordinary no-metrics messages (`umami-panel.tsx:186–194,227–246`). Those messages do not falsely claim zero traffic, but they do hide that a section failed to load. The unconfigured state offers the same Retry action as a temporary outage (`umami-panel.tsx:122–145`).

**Recommendation:** preserve successful figures and show a small “Some details unavailable” status with a section-level explanation for failed requests. Reserve empty language for a successful empty response; reserve “Unavailable” for missing/failing results. This needs per-section result status in the data contract, not an inference from `items.length`. Offer Retry for transient errors. For absent configuration, explain that local analytics work independently and show a setup destination only if an actual owner-accessible destination exists. Add a truthful fetch timestamp if freshness matters; label refresh explicitly as Umami-only.

**Review target:** distinguish available, valid zero, valid empty, partial failure, total failure, unconfigured, and refreshing states. Keep trend deltas neutral until direction has a justified interpretation; do not automatically celebrate higher bounce rate.

### 5. P2 — Secondary identities and metric labels are hard to resolve without prior knowledge

**Source-confirmed content/affordance gap; individual identity recovery remains unverified.** The parent reports no body overflow across all six fixture widths. Recent events nevertheless render a truncated path with no explicit reveal control (`page.tsx:358–377`); Umami detail names are also truncated without one (`umami-panel.tsx:84–94`). “Environment” actually contains browsers, and “Location” contains countries (`umami-panel.tsx:239–246`; `src/lib/umami.ts:305–313`). The detail value column does not identify what is being counted. The timeline supplies a hover tooltip but no explicit daily-value table in this component (`analytics-charts.tsx:100–130`); chart-library accessibility must be checked rather than assumed absent.

**Recommendation:** label these sections “Browsers” and “Countries”; identify the actual metric counted after confirming the API response semantics. Allow long paths/referrers to wrap, or provide an accessible tap/keyboard reveal. Prefer a resolved content title with path as secondary metadata for recent local events where that title is available; keep a readable path fallback for deleted content. Provide an optional daily-values table/disclosure for the timeline and short definitions of visitors versus visits. Explain what the editor link does without adding a public navigation control for unpublished content.

**Review target:** at 320/360px and with keyboard-only input, the owner can recover every identity and exact value without hover, distinguish similar paths, and interpret each column. Do not treat an HTML title attribute alone as a mobile solution.

## Persona flags

| Persona / context | Flag | Implication |
| --- | --- | --- |
| Returning owner, quick desktop check | Amber | Familiar visual system; competing scopes and repeated ranking representations slow the performance scan. |
| Owner returning after weeks | Amber | Counter/event distinctions are explained; missing definitions and partial-source status still require interpretation. |
| Owner on a 320/360px phone | Red for ranking readability; containment passes supplied fixture | Parent measurement confirms only about 74px plotting width at 320px and a long page. No body overflow at any supplied width. Identity recovery and touch interaction remain unverified. |
| Keyboard or screen-reader user | Amber, unverified runtime | Ranking list is a useful alternative; timeline daily-value access and clipped-name recovery need explicit verification. |
| Low vision, zoom, color-vision difference | Amber, unverified runtime | Labeled values and sequential blue tokens help. Check 11px chart ticks, composited gradient contrast, tooltip clipping, zoom reflow, and non-color identity. |
| Owner without Umami / with an outage | Amber | Local analytics remain available; configuration and partial failures need more precise next steps. |

## Recommended direction and parent verification

Polish within the established system: navy canvas/card ladder, existing fonts, 30px dashboard H1, compact supporting summaries, Satoshi section labels, quiet rows, and blue as analytical emphasis. Spend visual weight on the recent local total and content ranking. Reuse the manager surfaces; avoid unrelated gradients, new accent colors, decorative KPI grids, and invented “insight” claims.

The parent has already supplied fixture containment results at 1440/1024/768/390/360/320px, plus 320px geometry and long-title page measurements; those checks need not be repeated for this assessment. Remaining evidence would concern touch/keyboard identity recovery, exact daily-value access, focus, tooltip clipping, reduced motion, and truthful state variants: no content, existing zero-view content, positive traffic, loading, scheduled publication, and each optional-service state. Use isolated fixtures/read-only evidence and do not generate real tracking events for this review. Existing zero-view records currently render a ranking rather than the no-content state (`page.tsx:252–260`); keep that truthful distinction in the proposed row design.

Scope note: `docs/CODEX-NAVIGATION-GUIDE.md` was requested by repository instructions but does not exist at that path. Relevant source and design documents were read directly. No skill context was rerun, per task instruction.
