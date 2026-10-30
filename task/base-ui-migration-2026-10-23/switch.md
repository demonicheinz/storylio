# switch

2026-10-23 · golden pair / merge (manual replay of the user diff) · Migrated to Base UI 1.9.0 while retaining both sizes and thumb styling.

## Changed

- `src/components/ui/switch.tsx:3`: use `@base-ui/react/switch` and native Root props with the existing size extension.
- `src/components/ui/switch.tsx:17`: preserved custom root/thumb classes and data-size hooks. Root classes support Base state callbacks as well as strings.
- Compared the official `radix-luma/switch.json` and `base-luma/switch.json` registry pair from `ui.shadcn.com/r/styles/`. New stock field-label focus styling was excluded because it was absent from the user's wrapper.
- Checked installed SwitchRoot types. `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/switch.tsx` is clean. Formatting/lint passed. Initial shared typecheck showed no errors in this file; other in-progress scopes failed. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/switch.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

## Left alone

Forms, external consumers, other wrappers, dependency files, and registry configuration remain with their assigned agents.

## Behavior changes

Base UI's default root is a span with a hidden input rather than Radix's button. `onCheckedChange` receives the boolean and event details. Root refs target an HTMLElement; input access uses `inputRef`. `render` is the native composition API. Existing checked/unchecked and disabled state classes already use Base-compatible data attributes.

## Verify by hand

Click and press Space to toggle both sizes. Click the associated label, verify disabled state, and check thumb position in light/dark themes. Confirm the controlled value persists when saving a form.
