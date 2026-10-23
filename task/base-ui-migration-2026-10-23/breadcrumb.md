# breadcrumb

2026-10-23 · golden pair / merge (manual replay of the user diff) · Replaced Slot with Base UI useRender; Phosphor icons and current-page semantics preserved.

## Changed

- `src/components/ui/breadcrumb.tsx:1`: add the client boundary required for locally invoking the useRender hook.
- `src/components/ui/breadcrumb.tsx:43`: BreadcrumbLink exposes `useRender.ComponentProps<"a">`; useRender/mergeProps compose the anchor and derive `data-slot` from state.
- Compared the official `radix-luma/breadcrumb.json` and `base-luma/breadcrumb.json` registry pair from `ui.shadcn.com/r/styles/`. Preserved Phosphor CaretRightIcon/DotsThreeIcon, custom class ordering, and BreadcrumbPage's existing `aria-current` without copying the stock disabled link role.
- Checked installed useRender types and current official documentation through Context7. `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/breadcrumb.tsx` is clean. Formatting/lint passed; initial shared typecheck reported no errors here but failed in other in-progress scopes. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/breadcrumb.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

Final useRender attribute check passed: nonempty string state produces `data-slot="breadcrumb-link"`. Installed `getStateAttributesProps` maps true to empty-string presence and omits false; slot is a string. Read-only Sidebar SSR checks confirmed its true/false active states and presence selectors agree.

## Left alone

`src/features/dashboard/shell/components/dashboard-breadcrumb.tsx` is consumer-agent scope. Its two legacy BreadcrumbLink asChild usages were identified for coordinated conversion to render. No changes to Button/Sidebar, dependencies, or registry configuration.

## Behavior changes

Composition now uses `render={<Link ... />}` with normal wrapper children instead of `asChild` plus a child link. Base prop merging composes classes/styles/events/refs. No unsupported asChild alias was added. Other breadcrumb elements retain their existing markup.

## Verify by hand

Follow dashboard ancestor links and check href/navigation. Verify a single anchor is rendered with merged classes and the current page remains noninteractive. Check separators and ellipsis icons at narrow widths.
