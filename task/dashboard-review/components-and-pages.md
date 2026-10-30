# Dashboard components, menus, and remaining pages

Review date: 2026-10-28. Recommendations only; application code and CMS data were
not changed. Existing auth and dashboard work remains uncommitted.

## Evidence and scope

Two independent source assessments: A (01a180e5-b8e2-7071-8eda-6bedf4140874)
reviewed page workflows; B (01a180e5-b9e5-7993-a3c7-91114c8bd998) reviewed shared
components and ran the detector. Parent separately inspected the authenticated
local app in a new Brave Dev tab: Overview, Posts, Projects, Home, About, Gallery,
Media, Analytics, Settings/Profile/Security, and the new Project editor. Posts
was also inspected at 390x844. Post editor assessment was source-based.

No save, upload, reorder, delete, publish, session, or authentication change was
performed. A Posts draft filter was selected in the review tab only. No test
suite/build was rerun for this read-only review. Both agents and the review tab
were closed; temporary viewport override reset; user tabs/server retained.

## Priorities

1. P1: Post and Project autosave explicitly force status draft and call draft
   actions. The actions update the existing record, including status. Valid
   unsaved edits to a published item can therefore unpublish it on the 30-second
   interval. Evidence: post-editor.tsx:272, posts/actions.ts:485;
   project-editor.tsx:310, projects/actions.ts:541. This is source-confirmed,
   not reproduced against real CMS records. Preserve the stored publication
   status; define separately whether published edits go live immediately or
   require explicit publication. Do not add a revision system implicitly.
2. P1: Gallery reorders paginatedItems, sends order=index from zero, and updates
   only submitted records. Filtered/later-page reorders can collide with orders
   elsewhere. Evidence: gallery-item-form.tsx:1570 and :1893;
   gallery/actions.ts:387. Prefer an explicit full-collection reorder mode.
3. P2: Styling has three owners: base-luma UI components, dashboardStyles, and
   unlayered shell CSS. Move visual defaults/meaningful variants into owned
   src/components/ui components; keep layout in feature CSS. Avoid introducing
   an additional dashboard component library or replacing Base UI.
4. P2: Menu/dialog/drawer/sheet portals escape shell descendant selectors.
   Browser measured Overview More popup radius 32px and 70% opaque background,
   outside the shell. Button triggers may also replace data-slot=button with
   dropdown-menu-trigger. Posts mobile row-menu trigger measured 32x32px with
   16px radius despite shell touch rules. Own target dimensions and geometry in
   the actual shared components rather than ancestor overrides.
5. P2: Shell input border-color overrides Tailwind focus/invalid border colors.
   Focus rings remain; no claim that focus is entirely invisible. Consolidate
   appearance alongside states in Input/Textarea. Preserve explicit public/auth
   designs through variants only when they actually differ.

## Menu decisions

- Keep DropdownMenu for item actions, account actions, and sorting choices.
- Current radio/checkbox menu semantics are valid; do not call all filters
  inaccessible merely because they use a menu.
- Single-valued form inputs such as default public language are clearer as
  Select. Centralize form controls and labels instead of repeating a styled
  Button plus menu in each form.
- Status filters can use short ToggleGroups with counts; longer category,
  page-size or format choices can use Select. Tag/technology selection benefits
  from a searchable Combobox/Popover as inventories grow. Keep the existing
  mobile filter drawer as a container with coherent controls inside it.
- Installed Base UI RadioItem defaults closeOnClick=false. Selecting Draft in
  Posts updated the URL but left the popup open; single-choice menus should
  explicitly close on selection. Multiselect checkboxes should remain open.
- Review trigger composition/finalFocus for drawers opened with blurBeforeOpen.
  Focus-return risk is source-based; the browser observation was made during
  the closing transition and is insufficient to certify the final destination.
- Preserve confirmation dialogs for destructive actions; do not delete directly
  from a menu. Add Group composition where missing (Media menu).

## Overview actions

Desktop renders Add a project both as a standalone action and inside More;
the duplicate is visible in browser and unconditional in the menu source.
Recommend one New dropdown: Post, Project, Gallery item. Remove Edit home from
creation actions; Home already has sidebar navigation. Keep direct New Post /
New Project / Add photo actions on the respective management pages. A dropdown
on Overview trades one extra click for a clearer global action hierarchy.

## Page recommendations

| Surface | Proposed next change |
| --- | --- |
| Posts | Search/results first; compact status counts in place of four colored metric cards. Distinguish Article/Note and show Scheduled truthfully. Use restrained row typography and one updated date by default. |
| Projects | Reuse the same list/toolbar recipe; compact Featured label; explicit reorder mode. Clarify all marked featured versus published featured (Overview counts only published). |
| Editors | Consolidate publishing controls, show saved/unsaved state, keep save action accessible on long forms, and move metadata/media into clear groups. Resolve autosave publication behavior before visual changes. |
| Gallery | Keep a visual grid with lighter framing. Ensure action buttons are discoverable on touch; stable Save/Cancel footer in long dialogs. Separate reorder mode from filtered browsing. |
| Media | Compact library summary and upload affordance; expose batch actions when selected. Current drop handler uploads only the first file: state single-file scope or separately implement a queue. |
| Home | Match current public composition: Hero, Approach, Tech stack, and links to Projects/Writing/Notes ownership. Testimonials remain stored but must not claim to be shown publicly. Hero headline UI is still absent. |
| About | Keep content/experience/education/skills grouping. Compact summaries, visible translation completeness/errors, meaningful date inputs and inline errors. Preserve intentionally empty authored content. |
| Analytics | Separate lifetime local counters from 30-day traffic/timeline, label timezone, link rankings to content, and keep unavailable optional Umami compact. Observed Umami timeout; local analytics still rendered. Correct obsolete Home testimonials copy. |
| Settings | Keep Profile/Account/Security. Persistent save/discard state for long profile forms and a short MFA/passkey/session summary. Match shared component geometry rather than adding local overrides. |

## Sources and detector

Read current shadcn docs via CLI docs URLs and Context7 /shadcn-ui/ui:
https://ui.shadcn.com/docs/components/base/button
https://ui.shadcn.com/docs/components/base/card
https://ui.shadcn.com/docs/components/base/dropdown-menu
https://ui.shadcn.com/docs/components/base/select

One detector run over src/features/dashboard produced 28 font-size advisories
across eight files. Twenty-five flag 10/11px text; the remaining three are 30px,
24px and 1.875rem dashboard roles absent from the documented public ramp. These
are advisories, not 28 proven accessibility defects. Define dashboard typography
roles rather than forcing public display sizes into operational UI.

DESIGN.md was not edited; current dashboard/public adoption prose is stale.
No overlay injection or detector live server was used. The critique archive is
this task file, following repository artifact policy. Missing navigation guide
did not block source/browser review. No test-pass claims belong to this review.

## Self-evaluation

| Axis | Score | Evidence / remaining gap |
| --- | --- | --- |
| Accuracy | 4/5 | Browser/source agreement for menus and targets; save/reorder bugs not executed on real data. |
| Completeness | 4/5 | All management pages covered; post editor source-only and mobile sampling limited to Posts. |
| Clarity | 4/5 | Prioritized concrete recommendations; broad scope requires a longer archive. |
| Actionability | 4/5 | Foundation-first sequence and specific workflows; implementation intentionally awaits user direction. |
| Conciseness | 4/5 | Detailed evidence kept here; user response should focus on decisions and critical bugs. |
