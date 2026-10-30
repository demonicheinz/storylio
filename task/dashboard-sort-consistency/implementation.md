# Shared dashboard sorting

Implemented 2026-10-29 for Projects, Posts, Gallery and Media. Existing Media
work remains in the working tree; no commit or CMS mutation was performed.

`DashboardSort` in the shared filter-controls module owns the Sort by select
and direction action. The select and action both use border-input/bg-surface,
matching focus roles and 44px height. General outline action buttons keep their
quieter border-border recipe; the component adapts the sort control rather
than changing every action button globally.

The direction button's accessible label names its next action: Sort ascending
when descending, Sort descending when ascending. Its icon/title describe the
current direction. Field and direction remain independent.

- Projects defaults to display order ascending, with neutral field labels.
- Posts defaults to creation date descending. Views retain the publication
  clock; undated publication entries remain last in either direction.
- Gallery defaults to display order ascending, replacing duplicated asc/desc
  select options with two fields plus direction.
- Media preserves its four fields and default upload-date descending, using
  the shared component instead of its local implementation.

All four preserve staged mobile Apply/Reset/Cancel. Nondefault direction counts
as a sorting refinement and resets pagination. Projects/Gallery enter Reorder
in ascending display order, and restore the previous field/direction on Done.
No descending visual order is persisted as manual reordering.

## Verification

- 21 targeted tests passed across Projects sorting, Posts sorting and the Posts
  shared-publication-clock regression. TypeScript and repository Biome passed.
- `tests/browser/dashboard-sort.js` passed against all four isolated fixtures:
  actual result reversal, 44px targets, matching border/background colors,
  staged mobile changes, and reorder restoration.
- At 1440px in the dark theme, all four select/button pairs measured
  border oklch(0.46 0.03 259.15), background oklch(0.155 0.023 259.15), height44.
  These are actual browser observations, not deductions from utility classes.
- Existing Gallery and Media management browser suites passed at
  1440/1024/768/390/320/275px after adapting sort options/action names.
- Browser data/actions were synthetic. These checks do not establish real CMS
  persistence, a complete theme/contrast audit or full Next history behavior.
- No build rerun is claimed for this UI-only follow-up; the prior Media build
  and full-suite evidence remain recorded separately.

## Reproduction

Start the fixture servers from their respective `tests/fixtures/dashboard-*`
README files: Projects3197, Posts3198, Gallery3199, Media3201. Then run:

```powershell
bunx --no-install playwright-cli -s=dashboard-sort open http://127.0.0.1:3197 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=dashboard-sort run-code --filename=tests/browser/dashboard-sort.js
bunx --no-install playwright-cli -s=dashboard-sort close
```

Stop all fixture servers afterward. Desktop/mobile screenshots use the port
as their filename prefix in this folder. Worker agents, browser and servers are
closed after verification.

## Self-evaluation

Accuracy4/5: measured styles and result ordering; light-theme measurements were
not repeated. Completeness4/5: all dashboard sort surfaces and reorder defaults
covered; full Next navigation not exercised. Clarity4/5: one shared component and
neutral field labels; direction remains a compact icon action. Actionability4/5:
runnable regression and screenshots; no commit requested. Conciseness4/5: shared
control removes local duplication; managers retain their existing domain sorts.
Overall4.0/5.
