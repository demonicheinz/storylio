# Dashboard Overview and shared shell critique

Method: dual-agent (A: Noether, 01a1807b-f5ee-7583-9b4a-deb9a9a28995;
B: Maxwell, 01a1807b-f6d9-7f33-ac0b-9f79da658bdb).
Target: src/app/(dashboard)/dashboard/page.tsx. Mode: Operate.

The parent inspected the real authenticated Brave Dev page. Desktop observations
used the existing 1874x983 viewport and 1440x1000; responsive checks used 768x1024,
390x844 and 320x740. Agents independently assessed source and received the same
parent browser measurements; they did not independently view image files or each
other's findings. A finished before B's detector findings entered parent synthesis.
No application UI, data, authentication, or design documentation was changed.

## Verdict and score

The navy palette, identity, fonts, sidebar, and concrete creation actions already
belong to Storylio. Oversized rounding and tiny operational text make this version
feel less deliberate than public/auth. The Overview also retains indicators that
do not match current public content rules. Refine the existing system with a
compact dashboard recipe; no replacement palette or display-scale public headings.

Scores are review judgments, not a complete keyboard/accessibility or CRUD audit.

| Nielsen heuristic | Score / 4 | Evidence |
| --- | --- | --- |
| System status | 3 | Active navigation, badges, loading shell; incomplete skeleton coverage. |
| Match with real tasks | 2 | Drafts/hidden items are treated as health warnings. |
| Control and freedom | 3 | Direct edit links, context menu and Escape work. |
| Consistency | 2 | Shared identity, different geometry, typography and category colors. |
| Error prevention | 3 | No destructive Overview action; draft public preview is excluded. |
| Recognition | 3 | Labeled content/navigation; narrow-row titles truncate aggressively. |
| Efficiency | 2 | Useful shortcuts; health links do not open the matching subset. |
| Minimalist design | 2 | Repeated bordered, rounded containers compete with their content. |
| Error recovery | 3 | Shared retry/navigation fallback exists; failure flow not retriggered. |
| Help and guidance | 1 | Generic subtitles and empty states do not explain the next task. |
| Total | 24 / 40 | Useful foundation requiring consistency and information cleanup. |

## Strengths

- Existing logo, fonts, navy surfaces, and blue primary action match approved work.
- Familiar sidebar groups, breadcrumb, action labels, contextual edit/preview links.
- Real mobile reflow without horizontal overflow at 320px/390px. The inspected
  menu opens Preview/Edit post/View all and dismisses with Escape.

## Priority issue 1 — P2: visual vocabulary and responsive recognition

Card uses rounded-4xl, resolving to 48px via globals. At 320px the metric cards
are only 133px wide. Inner rows add another border and 24px radius. Auth uses 8px
controls; documented content cards are 12px and media panels 16px. Adopt those
roles in dashboard styles without accidentally changing approved public pages
through a global Card/Button edit.

Use Clash Display only for the page heading at 28–30px/600; avoid synthesized
700. Use Satoshi for operational headings/row titles/data: 16–18px section labels,
14px primary rows, 12px minimum metadata, 24–28px tabular metric values. Make actual
section headings H2 rather than CardTitle DIVs. Public 40–56px page headings are
not appropriate for dense CMS screens; DESIGN.md explicitly keeps dashboard/auth
typography independent.

Use one quiet panel per section and row separators, not a framed card within
each framed section. Keep opaque navy surface steps, blue for actions/selection,
and semantic tokens for real success/warning/error. Current sky/violet/amber/green
stat icon categories add unnecessary competing accents.

At 390px titles truncate to roughly fifteen characters because status and menu
occupy separate columns. Move badges/metadata below the title, allow a second
title line when needed, and give touch menus a 44px target instead of the measured
32px. At 768px the expanded 256px sidebar constrains the content to about 512px;
prefer an optional/default compact rail for tablet while preserving labeled
navigation in its expanded state and a mobile drawer. Keep dashboard scrolling
native and transitions short. Space illustrations and star fields need not
spread into the CMS to preserve identity.

Suggested craft directions: impeccable typeset, layout, adapt; preserve current
brand assets and code behavior. No detector result establishes a contrast or WCAG
failure by itself.

## Priority issue 2 — P1: information should reflect actual editorial work

getHealthTone turns every nonzero count into warning and counts over ten into
danger. Drafts and intentionally hidden gallery items are normal states. Present
them as neutral workflow inventory; reserve warnings for defined, actionable
conditions. Missing-cover counts include every coverless post, although notes
are text-led and article covers are optional. Exclude intentionally coverless
content from problem counts. Home Signals still shows visible testimonials even
though approved Home no longer displays them; remove that public-impact claim
while retaining CMS records.

Recent Posts mixes articles and personal notes under 'latest blog articles'.
Use a small type label or filter that reflects the existing notes tag, without
requiring a separate data model. Relevant alerts should open affected records
with the filter applied instead of sending the owner to an unfiltered archive or
the media library. Use concrete headings such as 'Recently updated' and 'Drafts';
avoid implying that a large draft inventory is a system failure. View totals need
a clear lifetime/source label; detailed traffic belongs in Analytics.

Preserve the basic content lists while making rows quieter. A useful Overview
should reveal the last work to continue and genuine missing requirements before
decorative metrics. Keep the desktop creation shortcuts; reduce their above-fold
weight on mobile, for example one primary action plus a secondary action menu.

Suggested craft directions: impeccable clarify and distill.

## Cognitive load, personas, and smaller observations

Load is moderate: labeled groups support recognition, but competing enclosures
and ambiguous health semantics weaken focus and hierarchy. The creation actions
feel useful; unnecessary warnings introduce anxiety when reviewing ordinary
drafts. Returning owners need targeted draft links. Mobile owners need readable
titles. Keyboard/screen-reader users need real H2s and current-page semantics.
Do not collapse useful labeled navigation merely to meet a numeric menu limit.

The 15px sidebar brand label is an exception candidate, not a severe usability
problem. Active nav uses data-active; aria-current can reinforce current-page
semantics. Complete loading placeholders should match both recent lists and the
lower panels. Empty states can provide a contextual creation action. Full editor
forms, destructive flows, zoom, measured contrast, and performance were not tested.

## Detector and evidence accounting

One detector execution: three advisory findings, one rule
(design-system-font-size), zero confirmed false positives. Page lines 280/281
contain 11px/10px; app-sidebar line96 contains 15px. Detector did not flag the
geometry or editorial-semantic issues; browser/source review supplied those.
Complete detector JSON remains in ignored .tmp/dashboard-review/assessment-b-detector.json.

Target slug: src-app-dashboard-dashboard-page-tsx. No ignore file was present.
Read-only browser evaluate does not support mutable script injection, so no live
detector overlay or live-server process was used. Viewport override reset and the
review-only tab closed; original user tab remained untouched. The browser tool did
not provide a screenshot export path, so images were inspected directly rather
than fabricated as local screenshot evidence. No task server was started.

This report lives under task/ per workspace artifact policy; no .impeccable
snapshot or trend metadata was written. DESIGN.md remains unchanged pending the
owner's design approval. Existing uncommitted auth work is preserved.

## Proposed implementation order

1. Shared dashboard recipes and shell: radii, type roles, surfaces, sidebar/tablet.
2. Overview: clearer recent rows, workflow inventory and accurate Home indicators.
3. Adopt the accepted recipe in Projects/Posts/Gallery/Media lists and then editors,
   Analytics and Settings, checking dense layouts independently of public layouts.

## Self-evaluation

Accuracy 4/5: live browser/source and independent detector evidence; full contrast
and assistive-technology testing absent. Completeness 4/5: Overview/shared shell
reviewed; other dashboard editors need their own pass. Clarity 4/5: concrete
measurements and two prioritized groups; detailed scoring is longer than a brief
recommendation. Actionability 4/5: exact type/radius/layout targets and rollout
order; no visual prototype requested. Conciseness 4/5: detail archived here while
the main response focuses on decisions. Average 4.0/5. User agreement is likely
if the limited Overview scope is explicit. Next: approve the compact dashboard
recipe, inspect list/editor surfaces, and measure contrast/keyboard behavior.

Questions skipped: 2 Priority Issues; the current request is assessment and advice,
and no implementation choice or permission is needed to deliver that assessment.
