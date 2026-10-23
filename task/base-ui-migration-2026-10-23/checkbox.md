# checkbox

2026-10-23 · golden pair / merge (manual replay of the user diff) · Migrated to Base UI 1.9.0 with Phosphor CheckIcon and custom styling retained.

## Changed

- `src/components/ui/checkbox.tsx:3`: replaced Radix with `@base-ui/react/checkbox` and native Root props; kept Root/Indicator anatomy and Phosphor CheckIcon.
- `src/components/ui/checkbox.tsx:11`: retained custom classes, changed `disabled:` opacity/cursor selectors to `data-disabled:` because the Base root is a span, and support state callback classes through `cn`.
- Compared the official `radix-luma/checkbox.json` and `base-luma/checkbox.json` registry pair from `ui.shadcn.com/r/styles/`. The current registry has extra field-label focus classes absent from this project; those unrelated additions were not copied. The Base registry retains ineffective `disabled:` selectors, corrected here using the skill's class mapping and installed Root types.
- `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/checkbox.tsx` is clean. Formatting/lint passed; initial shared typecheck reported no errors in this file but failed in other in-progress scopes. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/checkbox.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

## Left alone

Consumers, including gallery/projects/posts/media selection handlers, remain owned by the parent/consumer agent. Dependency files and other wrappers were not edited.

## Behavior changes

- Base UI renders a span and hidden input, replacing Radix's button root. Root refs therefore target an HTMLElement; `inputRef` targets the input. Native label associations target the hidden input by default.
- `checked` and `defaultChecked` are boolean. Mixed state uses the separate `indeterminate` boolean; `onCheckedChange` emits a boolean plus event details. No legacy checked-string or `asChild` alias was introduced.
- Form input and peer-disabled selectors in consumers warrant browser verification because the DOM structure changed. The wrapper's own disabled appearance uses the supported data attribute.

## Verify by hand

Toggle using click, Space, and its associated label. Check disabled opacity/cursor and no interaction. Check select-all mixed state and boolean callbacks, then verify form submission and reset.
