Method: dual-agent (A: 01a178b3-9278-7282-bca9-a59fe631af07 · B: 01a178b3-945b-76c0-92d1-a5a14cf45577)

# Projects archive review

2026-10-26. Target: `src/app/(public)/projects/page.tsx`. Review and suggestions
only. No application, CMS, DESIGN.md, staging, commit or push changes. The owner
clarified that demo imagery and links must be left alone; recommendations below
therefore focus on layout and interaction.

## Verdict

The navy/blue identity, existing fonts, quiet stars and featured/archive structure
are coherent with Home. The page currently makes visitors process introductory
metadata and stack filters before understanding a project. Mobile density and
action hierarchy are the most useful next refinements. Preserve the established
type roles and intended 3-column desktop / 2-column tablet / 1-column mobile grid.

## Scope-adjusted design health

Parent synthesis uses the independent visual assessment and measured interaction
evidence. Demo-content quality is excluded from this scoring, per owner scope.
Scores are subjective UX judgments: 0 poor, 4 excellent.

| # | Heuristic | Score | Evidence |
| --- | --- | --- | --- |
| 1 | Visibility of status | 3 | Active filter and result count are visible, with repeated totals. |
| 2 | Match with real world | 3 | Clear project descriptions and familiar case-study navigation. |
| 3 | User control | 3 | Filtering and All work; reset inconsistency needs refinement. |
| 4 | Consistency | 2 | Featured mobile padding and reset query behavior differ from peers. |
| 5 | Error prevention | 3 | Valid stack choices, explicit targets, no dangerous action in this surface. |
| 6 | Recognition over recall | 2 | Featured project identity arrives after a large image on mobile. |
| 7 | Flexibility/efficiency | n/a | Optional for this Experience portfolio archive. |
| 8 | Aesthetic/minimalist design | 2 | Large pre-work region and dense wrapped filter choices. |
| 9 | Error recovery | 3 | Honest unavailable-preview fallback and empty-state reset. |
| 10 | Help/documentation | n/a | Simple archive needs no help workflow. |
| Total | | 21/32 | Approximately 6.6/10; not an accessibility certification. |

Assessment A's raw table was summarized as 22/32, but its listed scores sum to
19/32; that arithmetic is not propagated. This scope-adjusted table is the
parent's synthesis, rather than an average of the two assessments.

## Strengths

- Featured work has a clear position above the archive, and the three project
  descriptions distinguish their purpose without needing a visual redesign.
- Typography and palette now share Home's roles; retain them rather than tuning
  font sizes independently for Projects.
- Filtering, internal case-study navigation, keyboard focus and fallback media
  presentation are functional. Do not rebuild these mechanisms from scratch.

## Prioritized changes

1. **P1: Bring project identity into the first mobile viewport.** The first card
   starts around 671px at 390px width; its name is around 957px, and its main
   action around 1213px. Reduce archive-specific hero/filter/summary spacing and
   remove duplicated totals. In the stacked featured layout, put the title and
   short context before the image. Desktop can retain the side-by-side feature.
2. **P2: Reduce mobile filter footprint.** Seven stack choices plus All use three
   rows and 190px height. Recommended: a clearly labelled compact stack selector
   showing the current value, with all choices and reset still available. A
   horizontally scrollable chip row is an alternative awaiting owner preference.
   Keep desktop filters visible and preserve 44px targets and URL state.
3. **P2: Correct featured-card mobile padding.** `.feature .cardBody` has 32px
   padding and outranks the later 20px mobile `.cardBody` declaration. At 320px,
   content is squeezed into roughly 222px. Use a scoped mobile feature rule to
   match the regular 20px mobile body, retaining the existing desktop treatment.
4. **P2: Establish one clear primary card action.** Read case study, Live site and
   Source currently share similar emphasis. Prioritize the case study and keep
   live/source secondary. Consolidate repeated image/title/case-study destinations
   where it can preserve valid anchor markup, external actions and focus access.
   Avoid a clickable-card implementation with nested links. No new animation or
   card decoration is needed for this refinement.
5. **P2: Make Reset stack behave like All.** Selecting a stack and choosing All
   preserve an unrelated `review=evidence` query parameter. Reset stack points
   directly to `/projects` and drops it. Build reset from current search params,
   removing only `tech`, with consistent scroll behavior.

Suggested next workflow: scoped Impeccable layout/adapt for opening, filter and
feature padding; polish for action/focus consistency. Reset query behavior is a
small functional fix that should have a regression check. No work is executed
until the owner requests implementation.

## Measurements

| Width | Hero height | Filter rows / height | First card top | Grid columns |
| --- | --- | --- | --- | --- |
| 1440 | 419px | 1 / 86px | 618px | 3 |
| 768 | 419px | 2 / 138px | 670px | 2 |
| 390 | 376px | 3 / 190px | 671px | 1 |
| 320 | 422px | 3 / 190px | 717px | 1 |

All measured widths had eight filters and three cards, with no horizontal
overflow. H1 uses 56/40px, featured titles 40/28px and regular titles 22px. The
three cards expose nine bottom action links plus duplicate image/title links,
for 15 card links in total. Keyboard activation opened `/projects/storylio`;
Tab navigation showed a 2px focus outline with 4px offset.

Choosing Framer Motion returned Canvas Notes alone with a one-project summary.
All restored the three cards and preserved unrelated query state. Reset stack's
hardcoded target was confirmed in source at the Projects page, around lines
155-160. External destinations were not visited.

## Demo content observations, outside requested changes

Current preview data shows flowers for Storylio, retail mannequins for Pulse
Analytics, and the honest no-preview fallback for Canvas Notes. Live destinations
use example.com subdomains. These observations affect the current impression but
are not requested content edits. Do not replace images, invent screenshots,
populate contribution text, or suppress saved demo links as part of layout polish.

Real contribution data is already supported in ProjectListItem and conditionally
shown for a featured project. It can be populated later through the existing CMS.

## Personas and emotional journey

A first visitor should understand the purpose of a project before choosing a
stack filter. A mobile visitor currently scrolls past a substantial control area
and image before reaching that identity. Keyboard users can navigate, but three
internal links per card repeat destinations. Cognitive load is low/moderate in
absolute count, with excessive filter emphasis for the current three-item data.

The current journey is a calm, coherent arrival followed by a long introductory
and filtering region, then work imagery and explanatory content. Bring the name
and purpose of the featured project forward to make that sequence more useful.

## Evidence and run notes

- Target slug: `src-app-public-projects-page-tsx`. Ignore list absent. Impeccable
  context was already loaded in this session; PRODUCT.md and current DESIGN.md
  were read. No context/config drift repairs were attempted.
- Assessments were isolated. A completed before the parent read B's detector
  findings. Both inspected fresh pages in their own browser sessions.
- CLI detector completed with an empty findings array, including page/components
  and shared CSS. No false positives to assess. Mechanical cleanliness does not
  detect the layout priorities or reset inconsistency above.
- No reliable live detector overlay was established; source, DOM and screenshots
  provide the evidence. No extra diagnostic server was started. All three review
  browser sessions and both agents were closed; the existing app server remains.
- Snapshot is under `task/` per repository artifact instructions. No critique
  snapshot/trend entry was written under `.impeccable/critique/`; no historical
  score comparison is claimed.
- Chromium review only. No comprehensive contrast/accessibility audit, performance
  benchmark, external link validation, content writes, or production deployment.
- Full-page desktop/tablet captures leave offscreen reveal sections invisible;
  those regions were not classified as missing content. The mobile capture shows
  the revealed archive. DOM confirms the regular cards and expected column count.

Screenshots: [desktop capture](desktop.png), [mobile page](mobile.png).
Raw detector and browser results remain in ignored `.tmp/projects-review/`.

## Owner choices

Confirmed: focus layout and interaction; leave demo data unchanged.
Pending: compact dropdown versus horizontally scrollable filter chips on mobile.
No further general discovery questions are needed.

## Self-review

Accuracy 4/5: independent visuals and measured geometry, with the source score
arithmetic corrected; limited to Chromium. Completeness 4/5: all archive areas
reviewed, mobile filter preference pending. Clarity 4/5: data issues separated
from layout priorities. Actionability 4/5: specific changes and existing data
boundaries identified, no implementation requested yet. Conciseness 4/5: chat
summary is shorter than this evidence archive. Mean 4.0/5. Next useful step is
the owner's filter preference and implementation scope, not another broad audit.
