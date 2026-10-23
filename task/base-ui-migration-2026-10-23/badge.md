# badge

2026-10-23 · golden pair / merge · Replaced Radix Slot with Base UI useRender and preserved every badge variant.

## Changed

- `src/components/ui/badge.tsx:1`: add a client boundary for locally invoking the useRender hook.
- `src/components/ui/badge.tsx:31`: replace Slot/asChild with `useRender.ComponentProps<"span">`, render, and mergeProps. State supplies the same data-slot/data-variant hooks.
- Compared the official `radix-luma/badge.json` and `base-luma/badge.json` registry pair from `ui.shadcn.com/r/styles/`. Preserved the original class order and all six variant definitions; the original class set matches stock styling.
- Checked installed useRender types and current official docs through Context7. `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/badge.tsx` is clean. Formatting/lint passed; initial shared typecheck reported no errors here but failed in other in-progress scopes. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/badge.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

Final useRender attribute check passed: nonempty string state produces `data-slot="badge"` and `data-variant="secondary"`. Installed `getStateAttributesProps` maps true to empty-string presence and omits false; neither slot nor variant is a boolean. Read-only Sidebar SSR checks also confirmed active true is present, false is absent, and its active selectors use presence semantics.

## Left alone

All external Badge consumers, Button/Sidebar, dependencies, lockfile, and registry configuration remain with their assigned agents. The exported badgeVariants name is retained; no external use was found during inspection.

## Behavior changes

Polymorphic composition uses `render` instead of `asChild`, with Base merging of props/events/classes/refs. Plain Badge still renders a span and preserves children and variants. No compatibility alias or non-Badge primitive was introduced.

## Verify by hand

Check default, secondary, destructive, outline, ghost, and link variants. Render a badge as a link and verify one anchor, correct href, hover/focus styles, child text/icons, and merged custom classes.
