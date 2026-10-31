# Incremental source lint rollout

The user chose incremental activation with passing commits. Formatting/import
organization still run across the repository; actual source lint coverage is
limited to the positive patterns in biome.json. This distinction corrects the
historical negative-only filter, which selected no source files.

## UI primitives — committed as 89f4983

All 28 files under src/components/ui are covered and lint clean. Five type-only
imports were corrected, the redundant nav role was removed, and three narrow
exceptions document forwarded label props, the non-sensitive sidebar preference
cookie and CSS Modules :global. Build, sidebar browser checks and the preceding
103-file/779-test combined suite passed. No broad unsafe fix was applied.

## Collection feature layer

Add the 28 top-level TypeScript modules under Projects, Posts, Gallery and Media:
types, policies, schemas, actions and Media hooks. Their component subdirectories
remain outside this stage. The sole diagnostic was an unused private
normalizedUrlArraySchema in Projects. Its only occurrence was its declaration;
the exported screenshot object schema already validates each image URL. Remove
that dead declaration without weakening screenshot validation or changing any
exported contract.

The combined source lint check selects **56 files**, with zero errors, warnings
or infos. No global lint rule was disabled. Existing collection schema/action,
publication, download/upload and PGlite tests are used for regression checks;
no implementation-mirroring test was added for dead code removal.

Review: no new public API or effect, no authorization or query changes, no
dependency updates. TypeScript and normal hooks must pass before committing.
Other source areas are not claimed lint-clean. Broader legacy findings retain
the baseline evidence in lint-activation-review.md.

Collection layer committed as `be53852`: 162 focused tests passed, source lint
selected 56 files without diagnostics, and normal lint/TypeScript hooks passed.

## Shared foundations

Expand coverage to src/lib, dashboard shared hooks and the shared top-level
TypeScript modules. The control-character rejection in auth-redirect.ts is a
deliberate input boundary, retained with a narrow explanatory lint exception.
containsPattern now uses a template string with the exact same LIKE escaping.
No authentication or database policy changes. The resulting source lint selects
109 files with zero diagnostics. Auth/management/confirmation/deletion tests
passed (57), plus eight schema tests including literal LIKE wildcard handling.
Build is not repeated for annotation/equivalent string syntax alone; commit
hooks still require TypeScript. No broad rule suppression or unsafe fix.

Shared foundations committed as `5e70a27`; normal hooks passed.

## Settings

Cover all nine Settings source files. Remove two unused imports and use fixed
strength levels 1–5 as password-meter segment keys, retaining the same score
thresholds and rendering. Source lint now selects 118 files without diagnostics.
Fifty Settings security/MFA tests passed. The full Settings browser suite passed
at 1440/1024/768/390/360/320px, including empty/typed strength, profile recovery,
provider unlink across tabs, session errors, MFA locks/codes and login TOTP.
Production build passed with 38/38 pages. All service calls were fixture mocks;
no real accounts, sessions or providers changed.

Settings committed as `e43d049`; normal hooks passed.

## Home and dashboard shell

Cover the 11 Home/shell files, bringing the actual source lint count to 129 with
zero diagnostics. Preserve the controlled Hero textarea's value-triggered height
measurement with an explained dependency exception. Rename the breadcrumb model
to avoid shadowing its imported UI component and key crumbs by their unique full
route paths rather than indices. No draft, navigation or account policy changed.
Eighty-six Home/Settings tests passed, standalone TypeScript passed, and the Home
browser suite passed 21 layout checks plus draft/history recovery, keyboard upload
and reorder retry. The preceding combined Settings build passed 38/38 pages;
these later annotation/key/type-name edits use scoped verification and hooks.

## Next interaction decision

Collection card lint highlights clickable wrappers around existing checkboxes
and menus. Before changing focus behavior, asked whether keyboard selection
should remain through those native controls (recommended) or whether every card
should become an additional Enter/Space target. The latter changes tab order.
That UI decision is pending; no blanket accessibility suppression or new card
tab stop has been introduced. Other source areas remain outside lint coverage.

## Collection keyboard decision and first view coverage

The user chose existing checkboxes/menus as keyboard targets, with no additional
focusable card wrapper. Cover Projects list/display and Posts collection/display
modules, bringing source lint to **133 files with zero diagnostics**.

Layout wrappers that stop bubbling from nested controls are marked presentational
and have element-specific noStaticElementInteractions exceptions explaining their
event-isolation purpose. Pointer-selectable Posts articles keep only the narrow
useKeyWithClickEvents exception: keyboard selection belongs to their checkbox.
The Project row exception explains the same explicit keyboard contract. No new
card tabIndex, button role or handler was added; click behavior is unchanged.

Fifty-four focused collection/display/filter/clock tests passed, and standalone
TypeScript passed. A new reusable browser check passed for both Projects and
Posts, grid/list, at 1440/320px: no focusable card ancestor, Space selects/unselects
once, Enter opens the menu, Escape restores trigger focus, and selection does not
navigate. Existing synthetic fixture data/actions are used; no CMS data changed.
Production build result is recorded below. Known low deepmerge audit remains.

The selection-view production build passed (38/38 pages). Final lint passed;
the later comment edit's line endings were normalized by Biome before committing.

Selection-view scope committed as `596b98a` with normal hooks.

## Complete Posts feature coverage

Cover all 14 Posts feature files (138 source files now covered repo-wide).
Preserve intentional pagination reset and clock rescheduling dependencies with
local explanations rather than removing triggers. Give the save-action group a
native fieldset so its existing accessible name is supported. Pass selected post
IDs/titles to the private batch bar and key delete-confirmation rows by ID; equal
titles remain distinct records. No new selection behavior or mutation policy.

Source lint is clean. Seventy-two focused editor/autosave/publication/collection
tests passed. Existing Posts browser suite passed six widths, and due-time
publication/filter/menu checks passed. Production build passed with 38/38 pages.
Browser writes are synthetic; no real CMS content changed. Earlier full suite
results are not presented as a new full run for this scoped feature change.

Posts coverage committed as `16d101c` with normal hooks.

## Complete Projects feature coverage

Cover all 13 Projects files, bringing total source lint coverage to **143 files**
without diagnostics. Remove unused dropdown/status imports; key delete-review
rows by project ID; use a native fieldset for the named save actions. Pointer
grid selection follows the user's checkbox/menu-only keyboard contract, with
element-specific event-boundary explanations. Keep the refinement-triggered
page reset/reorder restoration effect; do not remove its dependency triggers.
The screenshot drop wrapper retains a local exception because it prevents native
file navigation while keyboard upload is provided by its nested button.

Forty-five focused sorting/filter/list/batch/publication/autosave tests passed.
Browser checks passed for keyboard selection/menu focus at 1440/320px, exact
batch-action IDs and cancelled deletion, and the five-width Projects manager/
editor suite including disabled/concurrent drops. Production build passed with
38/38 pages; whitespace and source lint passed. Browser actions are mocked.

Media/Gallery already have native preview/title buttons that become selection
actions during batch mode. Asked whether to remove those existing buttons from
Tab order only during batch selection, leaving pointer and ordinary preview
behavior intact. That follow-up preference remains pending; no changes were made
to those features' focus contracts in these commits.

## Asset batch Tab order — approved behavior change

The user approved removing Gallery/Media preview-image and title buttons from
sequential Tab navigation only while batch selection is active. Apply conditional
tabIndex to the three existing preview/title controls in each feature's grid/list.
Pointer selection remains available; outside batch mode preview controls return
to normal Tab order. Checkboxes and menu triggers remain keyboard accessible.

Two new Media renderer tests failed before the change and passed afterward.
Forty-three Media-renderer/Gallery batch+reorder tests and standalone TypeScript
passed. New browser verification covers Gallery and Media at 1440/320px in both
views: ordinary preview tab stops, actual Tab from checkbox directly to menu,
Space selection, Enter/Escape menu behavior, pointer selection, and restored Tab
order after exiting batch mode. Test locators were refined for Base UI checkbox
elements, Gallery's nested list rail, accessible names including image alt text,
and responsive exit-button names; no product behavior was changed for those
test assumptions. Production build passed with 38/38 pages. No service writes.

Approved asset Tab-order change committed as `cdb3c87` with normal hooks.

## Complete Gallery and Media feature coverage

Cover both complete asset features. Consolidate the now-redundant narrower glob
patterns without changing coverage. Source lint selects **153 files**, reporting
zero errors, warnings or infos. Remove two unused Media imports. Preserve deliberate
source-change thumbnail recovery, record-change rename reset and collection
pagination triggers using local dependency explanations. Event-isolation wrappers
retain the approved nested-control keyboard contract. The immutable upload-rejection
batch renders stateless text; its index-qualified key retains a narrow documented
exception because distinct files can share both name and error. No mutation or
validation policy changed.

Browser checks passed for both features' Tab contract, the Media grid/list renderer
checks (preview, copy, download, selection), the full Media regression suite and
Gallery regression suite at six widths, including upload/delete/rename recovery,
selection scope/limits, preview reconciliation and reorder rollback. Actions and
uploads are fixture mocks; no real assets were mutated. Full-suite/build results
are appended when complete. No blanket lint rule was disabled.

Final combined verification: **103 files / 781 tests passed**, 331.43 seconds.
Production build generated 38/38 pages, final source lint remained clean on 153
files and whitespace checks passed. No new dependencies. This full run covers
the approved asset Tab behavior and the later asset lint annotations/fixes.

Asset lint coverage committed as `97ff942` with normal hooks.

## Complete About feature coverage

Cover all six About feature modules (159 source files total). Associate Current
role/Visible publicly labels explicitly with stable useId-based switch IDs.
The translation completeness block becomes a named section. Replace the delete
result comma/ternary expression with equivalent if/else calls. The existing
bubbled edit-trigger wrapper is presentational with a local exception: its nested
button/menu item remains the keyboard trigger and initializes the same draft.

Thirty-six About/PGlite/MDX tests passed. The About browser suite passed
1440/768/360/320px, including bilingual draft retention, save/discard, categories,
dirty-dialog cancellation and failed keyboard reorder rollback. A focused browser
check resolved both switches by accessible name and verified label click and
Space toggle once each. Production build passed with 38/38 pages; source lint and
whitespace checks passed. Fixtures do not mutate real CMS data.

Review: each scope is positive and verified independently; existing formatter
coverage is unchanged, and no global diagnostic rules were disabled. Known
exceptions preserve intentional browser/security behavior. Self-evaluation:
accuracy 4/5 (verified counts/tests; no full-repo lint-clean claim), completeness
4/5 (129 files covered, backlog remains), clarity 4/5 (coverage boundaries explicit),
actionability 4/5 (reproducible CLI/browser fixtures), conciseness 4/5 (small fixes,
no generic abstraction). No push.
