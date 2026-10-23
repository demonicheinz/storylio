# collapsible

2026-10-23 · golden pair / merge · Migrated to the Base UI 1.9.0 Root/Trigger/Panel anatomy.

## Changed

- `src/components/ui/collapsible.tsx:3`: replaced Radix with `@base-ui/react/collapsible` and native part props.
- `src/components/ui/collapsible.tsx:9`: use Trigger; `src/components/ui/collapsible.tsx:15`: map public CollapsibleContent to Panel. Retained all public export names and data-slot identifiers.
- Compared the official `radix-luma/collapsible.json` and `base-luma/collapsible.json` registry pair from `ui.shadcn.com/r/styles/`. The original wrapper matches the stock shape apart from formatting.
- Checked installed state-attribute definitions. `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/collapsible.tsx` is clean. Formatting/lint passed. Initial shared typecheck showed no errors here but failed in other in-progress scopes. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/collapsible.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

## Left alone

Sidebar and navigation consumers belong to other agents. No classes were added to this otherwise unstyled wrapper. Dependency/configuration edits remain with the parent.

## Behavior changes

Composition uses `render`; `forceMount` becomes `keepMounted`. Trigger open state is `data-panel-open`; Panel uses `data-open`/`data-closed`. The installed Base version also exposes root open/closed attributes. Height animation variables use `--collapsible-panel-height`. These are consumer migration concerns; no legacy aliases were introduced.

## Verify by hand

Open and close navigation groups by mouse and Enter/Space, check `aria-expanded`, and ensure focus remains on the trigger. Verify initial controlled/default-open state and any existing expansion animation.
