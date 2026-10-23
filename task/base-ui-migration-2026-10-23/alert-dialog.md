# alert-dialog

2026-10-23 — golden pair via merge (manual replay of the user's differences): migrated to native Base UI while retaining custom classes.

## Changed

- `src/components/ui/alert-dialog.tsx:24`: replaced Overlay with Backdrop and Content with Popup; retained layout, colors, typography, sizes, slots, and the 100ms fade/scale. Transitions use `data-starting-style` / `data-ending-style`; the backdrop remains `bg-black/30` with blur.
- `src/components/ui/alert-dialog.tsx:151`: Action follows the base-luma registry and renders the shared Button. Cancel composes `AlertDialog.Close` through `render`.
- Native parts resolve callback class names before merging custom classes. Public primitive props come from installed Base UI 1.9 types.
- `task/base-ui-migration-2026-10-23/alert-dialog.md`: this component report.
- Compared the user's wrapper against both `https://ui.shadcn.com/r/styles/radix-luma/alert-dialog.json` and `https://ui.shadcn.com/r/styles/base-luma/alert-dialog.json`; preserved resolved font classes and custom formatting rather than overwriting from registry.
- Targeted lint and project typecheck passed. The parent owns the final production build and browser verification. The pre-migration baseline passed typecheck and production build (35/35 pages).
- Leftover scan is clean: `rg -n 'radix-ui|@radix-ui|IconPlaceholder|--radix-|asChild|data-\[state' src/components/ui/alert-dialog.tsx` returned no matches.

## Left alone

Consumers, Button, Sidebar, dependency files, and registry configuration belong to other agents. No consumer, dependency, configuration, or unrelated library files were edited by this worker.

## Behavior changes

- Action no longer closes automatically. Consumers must close controlled state after their action, invoke the native root action, or explicitly compose a Close. This is the golden Base behavior, not a hidden compatibility patch.
- Initial focus follows Base's first-tabbable behavior rather than Radix's special Cancel focus. Consumers requiring a specific target should pass `initialFocus`.
- Consumer changes: `asChild` becomes `render`; `onOpenAutoFocus` / `onCloseAutoFocus` become `initialFocus` / `finalFocus`. Root change handlers receive event details. Portal `forceMount` becomes `keepMounted`.

## Verify by hand

Not performed by this worker. Open a delete confirmation with keyboard, check initial focus and Tab containment, cancel and confirm focus returns, reopen and confirm the destructive action and controlled close behavior. Check that backdrop presses do not dismiss and that both fade directions take 100ms.
