# label

2026-10-23 · golden pair / merge · Replaced Radix Label with the native label used by the Base Luma registry.

## Changed

- `src/components/ui/label.tsx:6`: type props as `React.ComponentProps<"label">` and render a native label. Kept the client boundary, public name, data-slot, and every custom class.
- Compared the official `radix-luma/label.json` and `base-luma/label.json` registry pair from `ui.shadcn.com/r/styles/`. Original styling matches the stock class set apart from ordering.
- `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/label.tsx` is clean. Formatting/lint passed. Initial initial shared typecheck reported no errors here but failed in other in-progress scopes. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/label.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

## Left alone

Form wrappers, label consumers, other UI components, and shared dependency/configuration files remain with their assigned agents.

## Behavior changes

Label now follows native browser event and selection behavior; no Radix primitive event suppression remains. `asChild` is not part of the native label API and no compatibility alias was introduced. Existing `htmlFor`, children, events, and React 19 ref props pass through.

## Verify by hand

Click a text field's label and confirm input focus. Click checkbox/switch labels and verify one toggle. Check disabled opacity/cursor styling in forms and text selection appearance.
