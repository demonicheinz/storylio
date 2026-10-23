# separator

2026-10-23 · golden pair / merge · Migrated to the callable Base UI 1.9.0 Separator; semantic role delta flagged.

## Changed

- `src/components/ui/separator.tsx:3`: replace Radix Root with `@base-ui/react/separator` and native Separator props.
- `src/components/ui/separator.tsx:6`: remove unsupported decorative prop/default, preserve horizontal default, orientation forwarding, all existing classes, and support state callback classes.
- Orientation classes explicitly select `data-[orientation=horizontal]`/`data-[orientation=vertical]`, matching installed SeparatorDataAttributes types and SSR DOM. The imported shadcn CSS maps the previous shorthand variants to those attributes as well.
- Compared the official `radix-luma/separator.json` and `base-luma/separator.json` registry pair from `ui.shadcn.com/r/styles/`; checked installed Separator types.
- `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/separator.tsx` is clean. Formatting/lint passed; initial shared typecheck reported no errors here but failed in other in-progress scopes. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/separator.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

Isolated Chromium rendered the real SSR markup with the compiled project CSS and confirmed horizontal `data-orientation="horizontal"` at 320×1px and vertical `data-orientation="vertical"` at 1×64px, including vertical self-stretch. Both computed-size assertions passed. Fixture/check scripts are in `.tmp/base-ui-migration-2026-10-23/display-*`.

## Left alone

SidebarSeparator and external consumers belong to other agents. No dependency/lockfile/registry changes or compatibility decorative prop was introduced.

## Behavior changes

Base UI exposes `role="separator"` by default, replacing the previous wrapper's decorative default. The `decorative` API is removed. Purely visual separators can be expressed by consumers with CSS/plain markup if desired; this migration follows the native Base registry behavior. Composition uses `render`.

## Verify by hand

Check horizontal and vertical separators retain their size/color and vertical stretching. Inspect the accessible role/orientation and ensure separators do not become focusable.
