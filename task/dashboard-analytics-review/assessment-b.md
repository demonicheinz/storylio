# Assessment B: independent Analytics technical evidence

Assessment only, 2026-10-29. No application/UI code or real data was changed. Assessment A was not read. No browser was opened, no application/database request was made, and Impeccable context was not rerun. Browser, visual, contrast, and assistive-technology verification remain with the parent reviewer.

## Detector evidence and limits

Executed from `D:/GitHub/storylio`:

```powershell
& 'C:/Users/0xvoid/.agents/skills/impeccable/scripts/impeccable.cmd' detect --json 'src/app/(dashboard)/dashboard/analytics/page.tsx' 'src/features/dashboard/analytics/components'
```

Exit code: **0**. Complete structured output: **`[]`**, saved in [detector.json](detector.json). The component directory contains `analytics-charts.tsx` and `umami-panel.tsx`. `loading.tsx`, the action, shared primitives, the error boundary, and the Umami adapter were inspected manually as dependencies; they were outside the two detector targets.

`detect --help` confirms that TSX uses regex matching; only URL targets use browser rendering. The invocation above used filesystem targets only. Empty output means no reported detector matches under its effective settings, not accessibility compliance or verified rendering. The detector supports project/design-system and inline ignores; this run used its defaults, not `--no-config`. Neither `.impeccable/config.json` nor `.impeccable/config.local.json` was present. The JSON provides no per-file coverage or rule-coverage inventory. No measured contrast, viewport dimensions, performance timings, layout-shift score, or browser pass is claimed.

## Source key

All references below use these exact repository paths and one-based source line numbers from this assessment:

| Key | Path |
| --- | --- |
| page | `src/app/(dashboard)/dashboard/analytics/page.tsx` |
| charts | `src/features/dashboard/analytics/components/analytics-charts.tsx` |
| panel | `src/features/dashboard/analytics/components/umami-panel.tsx` |
| loading | `src/app/(dashboard)/dashboard/analytics/loading.tsx` |
| action | `src/features/dashboard/analytics/actions.ts` |
| adapter | `src/lib/umami.ts` |
| summary | `src/features/dashboard/shared/components/summary.tsx` |
| styles | `src/features/dashboard/shared/styles.ts` |
| card | `src/components/ui/card.tsx` |
| button | `src/components/ui/button.tsx` |
| skeleton | `src/components/ui/skeleton.tsx` |
| global CSS | `src/app/globals.css` |

## Verdict and priorities

The implementation has useful product-specific contracts: it distinguishes lifetime counters from events and the UTC timeline, supplies full ranking text outside the charts, and isolates ordinary Umami API failures from local analytics. Technical integrity is **incomplete** because custom chart accessibility and several loading/error contracts lose information.

**Eight findings: P0 0, P1 1, P2 7, P3 0.** P1 identifies a significant accessibility gap in source, not an observed screen-reader session. No overall WCAG or runtime health score is assigned: a static review cannot substantiate those results.

### B1. P1: custom chart tooltips lose accessible announcements; chart applications lack names

**Category:** Accessibility. **Evidence:** charts:45–76 builds the custom tooltip entirely from ordinary `div`, `p`, and `span` elements. It supplies neither a live region nor status semantics. Both charts install that tooltip at charts:113–116 and 166–169. Their root props at charts:82–87 and 139–145 supply no accessible name or description. The adjacent headings at page:193–195 and 243–245 are not associated with the SVGs through `aria-labelledby`.

**Dependency verification:** Installed Recharts is 3.8.1 (`node_modules/recharts/package.json:3`). It enables `accessibilityLayer` by default (`node_modules/recharts/lib/chart/CartesianChart.js:30–39`) and gives its root SVG keyboard focus and `role="application"` (`node_modules/recharts/lib/container/RootSurface.js:49–66`). Its default tooltip supplies `role="status"` and `aria-live` (`node_modules/recharts/lib/component/DefaultTooltipContent.js:139–146`), but custom content replaces that default (`node_modules/recharts/lib/component/Tooltip.js:153–178`). The custom implementation drops those semantics.

**Impact:** Keyboard support exists, but moving through points does not receive the default tooltip announcement mechanism. The focused chart applications also have no explicit names. The ranking list at page:261–283 preserves full titles and values as an alternative; the daily timeline has only an aggregate description at page:196–202, with no equivalent daily data list/table.

**Recommendation:** Associate each chart with its heading/description, restore a tested live announcement path for active date/title and count, and provide a daily data alternative. Relevant checks: WCAG 1.1.1/1.3.1, 4.1.2, and 4.1.3; confirm the actual accessibility tree and announcements before declaring conformance or a specific runtime failure. Suggested work: `$impeccable harden`.

### B2. P2: full-page loading supplies no readable status

**Category:** Accessibility / loading. **Evidence:** loading:5–6 renders an empty animated `div`; loading:74–142 consists of those blocks and structural containers. The outer `div` has `aria-busy="true"` at loading:76, but there is no loading text, named status region, or heading. page:399–403 uses this component as the explicit Suspense fallback.

**Impact:** The source supplies no readable explanation while the main page is waiting. `aria-busy` on a generic container does not itself supply an accessible loading message. This contrasts with the optional panel's text status at panel:254–262.

**Recommendation:** Add a persistent readable loading status and treat decorative pulse shapes as decorative. Verify transition announcements with assistive technology. WCAG 4.1.3 is the relevant status-message check, not a claimed measured failure. Suggested work: `$impeccable harden`.

### B3. P2: skeleton pulses and refresh spinners ignore reduced-motion preference

**Category:** Accessibility / loading. **Evidence:** loading:6 always applies `animate-pulse`; panel:140–143 and 203–206 apply `animate-spin` whenever pending. These paths have no `motion-reduce` alternative. The global reduced-motion override at global CSS:13–19 only targets `[data-motion-reveal]` and `[data-route-motion]`, neither of which these elements use. The existing shared skeleton explicitly includes `motion-reduce:animate-none` at skeleton:8.

**Impact:** A visitor who requests reduced motion still receives these local animations. This is a source-level preference gap; no flashing, seizure threshold violation, or WCAG AA failure is inferred.

**Recommendation:** Respect reduced motion for pulse/spin while keeping text feedback such as “Refreshing...” and a readable loading status. Do not disable all useful state feedback globally. Suggested work: `$impeccable animate`.

### B4. P2: partial Umami failures become indistinguishable from empty metrics

**Category:** Error / implementation integrity. **Evidence:** adapter:277–315 independently settles stats and metric requests. When stats succeeds, adapter:380–402 returns `status: "available"` even if a metric request rejects; rejected pages/referrers/browsers/locations each become `[]`. panel:190 shows “Connected”; panel:82–100 handles any empty array as an empty result, using the “No ... metrics were returned” messages at panel:228–246.

**Trigger and impact:** Stats succeeds while, for example, the top-pages request times out. The screen presents the same top-pages state as a successful empty response, with no indication that the request failed. Users cannot distinguish missing evidence from a true no-data result.

**Recommendation:** Preserve per-section success/empty/error states in the adapter contract and show a section-specific unavailable message with retry. Keep successful metrics available. Suggested work: `$impeccable harden`.

### B5. P2: refresh handles returned API errors but has no local rejection or completion contract

**Category:** Error / accessibility. **Evidence:** panel:115–119 awaits the server action and updates state without a `try/catch` or separate refresh error state. action:5–6 delegates to the adapter. Normal upstream API failures become a structured result (adapter:404–417), which panel:122–146 handles, but a browser-to-server action failure need not reach that adapter. The successful panel at panel:182–250 has no completion status or busy region; pending feedback exists only in the disabled button, spinner, and changing button text at panel:197–208.

**Trigger and impact:** If delivery of the action rejects, this component cannot produce its own recoverable inline error; framework-level handling may replace the page. On success, it provides no explicit refresh-completed message or timestamp, leaving users uncertain whether displayed numbers are fresh, especially when values stay identical. These are code-path findings; network failure and focus behavior were not exercised.

**Recommendation:** Catch action transport failures locally, preserve the last successful result with an explicit stale/error message, and announce refresh completion/error in a persistent status region. Mark the updating region busy while pending. Retain the existing duplicate-submit prevention. Suggested work: `$impeccable harden`.

### B6. P2: the full-page skeleton describes a different page structure

**Category:** Loading / responsive integrity. **Evidence:** loading:82–99 puts a large five-stat/four-list Umami skeleton first, loading:101–108 reserves four local-stat cards, and loading:120–139 reserves four inventory blocks. The loaded page places two local summary items first (page:411–444), then timeline/recent events and rankings (page:446–458), three inventory groups (page:296–312, 460), and optional Umami last (page:461–463). Missing/unconfigured Umami resolves to a compact border-top strip (panel:122–146), not that first large card.

**Impact:** Skeleton reading order and reserved geometry do not match the resolved content, particularly when optional Umami is unavailable. This creates avoidable content replacement and orientation changes. Actual shift magnitude and CLS were not measured; Suspense replacement is not automatically a CLS failure.

**Recommendation:** Match skeleton order, counts, and approximate layout to the current local Analytics page; use the separate optional status fallback for Umami. Suggested work: `$impeccable harden` / `$impeccable layout`.

### B7. P2: narrow-layout truncation has no way to reveal full metric labels

**Category:** Responsive / information access. **Evidence:** panel:87–94 uses a truncated name next to a nonshrinking count. There is no title, wrapping alternative, details control, or link to the full value. The optional “Open Umami” action is conditional on `shareUrl` (panel:209–218), so it is not an assured escape. Recent event URLs likewise use `truncate` with no expansion at page:360–366.

**Trigger and impact:** When a long path or referrer is truncated, visually similar prefixes cannot be distinguished by sight/touch within this UI. The full strings remain in the DOM, so this is not a claim that screen readers lose them. Whether a particular viewport/data sample triggers truncation requires the parent's browser pass.

**Recommendation:** Wrap long paths with safe breaking, or provide an accessible full-label expansion/copy action. A hover-only title is insufficient for touch. Suggested work: `$impeccable adapt`.

### B8. P2: timeline loading scales with raw view events rather than 30 buckets

**Category:** Performance / loading. **Evidence:** page:121–124 fetches every event timestamp within the 30-day range, with no aggregation or record limit. page:45–62 then groups the result in JavaScript. The full local page awaits the encompassing `Promise.all` (page:83–130, 407–409). Umami's independent Suspense boundary is only rendered after this local work completes (page:461–463).

**Impact:** A fixed 30-point chart requires transferring and iterating an increasing number of event records as traffic grows; local content remains behind the page fallback during that work. This is a concrete scaling property, not a measured slow query or timing claim.

**Recommendation:** Aggregate counts into UTC days in the database and fill missing days with zeros, preserving the existing UTC and incomplete-today semantics. If independent section failures/loading should be isolated, define that contract explicitly. Suggested work: `$impeccable optimize`.

## Contracts that already exist

| Contract | Source evidence and assessment |
| --- | --- |
| Data meaning | page:196–202 explicitly states 30 UTC days and incomplete today; page:246–248 says rankings use lifetime counters; page:434–440 distinguishes counters, event histories, unique visitors, and date ranges. Preserve these qualifications. |
| Heading and text structure | page:427 uses `h1`; section/card headings use `h2` at page:194, 244, 318, 340, 436; panel:188 uses `h2` and panel:81 uses `h3`. The shared CardTitle is a `div` (card:35–44), so these are not nested headings. |
| Ranking alternative | page:261–283 uses an ordered list with full titles, publication state, counts, and real edit links. page:270 uses `wrap-anywhere`; chart label shortening at page:230–237 does not remove that alternative. |
| Empty local data | page:205–210, 252–257, and 347–352 provide specific no-views/no-content/no-events text. Inventory displays record counts rather than fictional placeholder data. |
| Local error recovery | A failed local query rejects the whole `Promise.all` (page:83–130). This is whole-page failure, not independent local-section recovery. An existing dashboard boundary handles errors through ErrorState (`src/app/(dashboard)/dashboard/error.tsx:5–13`); ErrorState offers retry and dashboard navigation (`src/components/common/error-state.tsx:24–39`). No missing-boundary finding is made. Retry behavior was not run. |
| Optional API isolation | page:388–396 and 461–463 place Umami in its own Suspense section after local content. adapter:244–258 provides not-configured state; adapter:317–333 and 404–417 return error states. panel:124–145 explains local analytics remain available and offers Retry. This protection covers ordinary API failures, with B4/B5 limits. |
| Optional loading and pending | panel:254–262 supplies a named textual status and busy state. panel:137–144 and 200–207 disable duplicate refresh while showing “Refreshing...”. B2 concerns the separate full-page fallback. |
| Responsive structure | page:446 and 451 defer two-column content until `xl`; panel:222 and 227 defer metric columns until `md`/`xl`. styles:2 and chart wrappers at charts:81/138 use `min-w-0`; card:14 also uses `min-w-0`. Recent rows wrap (page:358); ranking titles break anywhere (page:270). These are positive source contracts, not a viewport pass. |
| Button focus/touch baseline | button:8 supplies focus-visible styling and 44px-equivalent minimum height via `min-h-11` for narrow screens/coarse pointers. Thus a generic “36px Refresh button fails touch size” allegation would overlook the shared primitive. Exact rendered size, focus visibility, and spacing remain unmeasured. |
| Chart defaults and theme tokens | charts:37–43, 95–112, 146–164 use chart/border/text variables. Installed Recharts has keyboard accessibility by default, and its automatic animation mode respects reduced motion (`node_modules/recharts/lib/animation/JavascriptAnimate.js:43–44`; tooltip motion at `node_modules/recharts/lib/component/TooltipBoundingBox.js:16–22`). B3 is limited to app-authored pulse/spin. Theme contrast remains unmeasured. |

## Parent verification targets and detector blind spots

These are bounded verification requests, not additional confirmed browser defects:

- Inspect chart names and active-point announcements with keyboard and a screen reader. Do not infer mouse-only charts from missing explicit `accessibilityLayer`; Recharts defaults were checked.
- Check narrow screens and zoom/text enlargement. The ranking Y-axis reserves 132px (charts:158–164), chart margins reserve additional width (charts:143), and axes use explicit 11px text (charts:105, 111, 156, 164). Assess usable plot area and label readability without declaring overflow from fixed axis width alone.
- Use a long unbroken title/path/referrer to verify B7 and tooltip containment. The tooltip has a minimum width and no explicit word-breaking (charts:61–63), while the shared Card clips overflow (card:14). Clipping is a risk requiring a rendered sample, not an observed result here.
- Observe initial loading and both Umami branches, reduced motion, refresh success, action transport failure, and partial metrics failure. Check focus when the available card is replaced by the retry strip.
- Measure computed foreground/background pairs in the supported themes before making any contrast claim. Token names and opacity alone do not establish a measured ratio.

The detector cannot validate these state transitions, dependency defaults, database grouping costs, or actual responsive behavior from a regex scan. Existing `tests/public/route-shells.test.ts:69–84` checks synchronous route-shell creation, including Analytics in its route list at line 64; it does not verify the contracts above. Tests/build were not run because this deliverable is a source assessment, and the parent owns runtime verification.

## Recommended sequence

1. `$impeccable harden`: B1/B2 accessibility and B4/B5 recoverable error/status contracts; align the B6 loading structure.
2. `$impeccable animate` and `$impeccable adapt`: B3 preference handling and B7 full-label access; verify the plot/tooltip risks above.
3. `$impeccable optimize`: B8 UTC aggregation, with fixture-based counts and dates if implemented later.
4. `$impeccable audit`, then `$impeccable polish`: confirm the repaired contracts and perform the parent's visual pass. No fixes were made in this assessment.

## Evidence-quality self-check

Applied the agent-self-evaluation rubric to the report, not the application. Overall: **4.0/5**.

| Axis | Score | Evidence / remaining improvement |
| --- | --- | --- |
| Accuracy | 4 | Verified source and installed Recharts defaults; parent must confirm screen-reader behavior and rendered truncation. |
| Completeness | 4 | Both detector targets and accessibility/responsive/error/loading dependencies covered; runtime verification is explicitly assigned to the parent. |
| Clarity | 4 | Eight prioritized findings use a shared path key and line references; parent can attach screenshots to the state-specific findings. |
| Actionability | 4 | Each finding specifies a trigger, impact, and concrete repair; implementation is intentionally outside this assessment. |
| Conciseness | 4 | Findings and positive contracts are separated; dependency evidence adds length to prevent false claims about chart defaults. |

Highest-impact follow-up evidence: validate B1 announcements; distinguish partial-error and refresh-transport behavior with fixtures; capture narrow-layout/loading states. These require the parent's authorized verification pass. Self-check: the report provides independent technical evidence within the requested scope and does not substitute static inference for visual measurements.
