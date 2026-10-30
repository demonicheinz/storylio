# Dashboard About assessment

Reviewed 2026-10-28 against `bd7999d`. Assessment only; no About implementation
or CMS data changed. Impeccable and frontend-design were applied with two
independent source reviews, then reconciled against the caller/action/reader
contracts. Local browser accessibility output confirmed the Content layout;
interactive inspection and screenshot capture timed out. Responsive judgments
below therefore remain source-based, not a completed visual browser audit.

## Verdict

Keep the restrained navy/blue dashboard, project fonts, four task tabs, shared
controls, compact statistics and sticky dialog footer. The main weakness is
editing confidence and skill organization. More decoration would not address
the underlying problems. Empty CMS sections are intentional and need no seed.

Provisional Nielsen heuristic score: **21/40** (higher is better).

| Heuristic | Score /4 | Evidence |
| --- | ---: | --- |
| System status | 2 | Saving labels/toasts exist; persistent dirty/saved state is missing. |
| Match to tasks | 2 | Familiar sections; skill category selection is implicit. |
| User control | 1 | Cancel exists but unsaved narrative can disappear on outer tab changes. |
| Consistency | 3 | Shared dashboard controls; bilingual editing differs between forms. |
| Error prevention | 2 | Validation exists; dirty exit protection is missing. |
| Recognition | 2 | Completion counts help; category/reorder rules require interpretation. |
| Efficiency | 2 | Keyboard sorting exists; handles lack item-specific names. |
| Minimalism | 3 | Quiet hierarchy; repeated explanations and rich toolbars lengthen Content. |
| Error recovery | 2 | Inline errors exist; failed reorder bypasses the rollback contract. |
| Guidance | 2 | Guidance exists but includes implementation terms such as singleton CMS record. |

The technical detector returned no findings across four target markup files.
Manual review still found the following behavioral and accessibility gaps.

## Prioritized improvements

1. **Preserve unsaved narrative across outer section tabs.** Content owns its
   draft under a panel that unmounts by default. Switching to Experience and
   returning can recreate saved defaults. Preserve the draft or guard dirty
   exits, show unsaved/saved state, and clarify that Save saves both languages.
   Sources: [route](../../src/app/(dashboard)/dashboard/about/page.tsx#L115),
   [form state](../../src/features/dashboard/about/components/content-form.tsx#L98).
2. **Make skill category selection explicit.** Add skill passes the first
   category; fields do not offer category selection, and editing cannot move a
   skill. Offer a category selector or scoped Add skill action and reassignment.
   Sources: [skill fields](../../src/features/dashboard/about/components/structured-manager.tsx#L167),
   [creation](../../src/features/dashboard/about/components/structured-manager.tsx#L842).
3. **Match sorting to persisted category structure.** A global flattened skill
   list allows cross-category positions, while writes change only order and
   readers group by category. Sort within categories; category movement should
   be explicit. Also return awaited success/failure from About's reorder
   callback so the shared list can roll back failed writes.
   Sources: [reorder](../../src/features/dashboard/about/components/structured-manager.tsx#L550),
   [shared rollback](../../src/features/dashboard/shared/components/sortable-list.tsx#L118).
4. **Identify rich text fields and drag handles accessibly.** Associate How I
   Work/What I Value labels with the actual editing region; currently it has a
   generic editable-markdown name. Pass item titles through `getItemLabel` for
   distinguishable drag buttons and announcements.
   Sources: [editor labels](../../src/features/dashboard/about/components/content-form.tsx#L327),
   [sortable caller](../../src/features/dashboard/about/components/structured-manager.tsx#L615).
5. **Explain deletion and visibility accurately.** Deleting a category cascades
   to its skills, while the dialog describes a generic item. Name the category
   and affected skill count. Summary visibility should account for both the
   category and child flag, matching the public reader.
   Sources: [delete dialog](../../src/features/dashboard/about/components/structured-manager.tsx#L714),
   [summary](../../src/app/(dashboard)/dashboard/about/page.tsx#L91).

## Visual and editing direction

| Area | Recommendation |
| --- | --- |
| Content | Compress the Settings notice; keep completion cues close to language controls. Use a smaller About-oriented toolbar and clear persistent save feedback. |
| Experience | Group role/company, dates/current role, then bilingual narrative. Keep actions reachable and avoid nested textarea scrolling on narrow screens. |
| Education | Group institution/qualification/years; keep optional descriptions secondary. Preserve the CMS model and existing public labels. |
| Skills | Show category groups, category-scoped add/sort, effective visibility, and stable row identity. |
| Mobile | Keep usable two-row tabs and full-width form content. Prioritize titles and actions; move secondary metadata below instead of compressing several columns. |

Keep the dashboard type scale: approximately 30px page title, 18px section
heading, 14px controls, 12px metadata. Public display-heading sizes would make
the editor unnecessarily large. Do not add cards to every explanatory fragment.

## Proposed sequence and validation

First fix draft preservation, category assignment, reorder persistence and
accessible field names. Then compact Content and group structured forms. Finish
with browser checks at 320/360/768/1440px using long bilingual fixture content.
Verify dirty tab changes, saved state, same-category reorder, failure rollback,
category deletion copy and screen-reader names. Do not mutate real CMS data
just to demonstrate these states.

This review does not claim measured contrast, completed keyboard testing, or
successful narrow-screen screenshot verification. Findings derived from source
should be confirmed in controlled fixtures during implementation.
