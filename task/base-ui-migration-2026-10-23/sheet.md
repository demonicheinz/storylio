# sheet

2026-10-23 — golden pair via merge (manual replay of the user's differences): migrated the sheet to Base UI Dialog without changing its custom layout.

## Changed

- `src/components/ui/sheet.tsx:25`: Overlay becomes Dialog.Backdrop, preserving `bg-black/30`, blur, and the existing 100ms backdrop fade.
- `src/components/ui/sheet.tsx:40`: Content becomes Dialog.Popup. Existing side positioning, borders, widths, heights, spacing, typography, and 200ms panel motion remain. Replaced keyframe animation hooks with starting/ending opacity and signed 2.5rem translate transitions, following base-luma.
- Close uses `render={<Button />}` and keeps the Phosphor XIcon and accessible label. Native parts support callback classes; headers and footers remain native divs.
- `task/base-ui-migration-2026-10-23/sheet.md`: this component report.
- Compared the user wrapper against the official radix-luma/base-luma `sheet.json` registry pair at `https://ui.shadcn.com/r/styles/`; preserved the user's 100ms backdrop timing rather than adopting the registry's 150ms change.
- Targeted lint and project typecheck passed. Parent owns final production build and browser checks. Baseline typecheck and production build (35/35 pages) passed.
- Leftover scan is clean: `rg -n 'radix-ui|@radix-ui|IconPlaceholder|--radix-|asChild|data-\[state' src/components/ui/sheet.tsx` returned no matches.

## Left alone

Sidebar and all other consumers belong to the parent/consumer agent. Button, manifests, lockfile, and registry configuration were not edited. No other agents' files were reverted.

## Behavior changes

Sheet uses Base Dialog focus/dismiss behavior, including interaction-aware initial focus and a Portal wrapper div. Consumer `asChild` becomes `render`; non-button Trigger/Close targets need `nativeButton={false}`. Auto-focus handlers become `initialFocus` / `finalFocus`; escape/outside cancellation moves to Root event details. The side, close-button defaults, and visible styling are preserved.

## Verify by hand

Not performed by this worker. Open the mobile sidebar, navigate with Tab, close with X/Escape/backdrop, and check focus return and scroll unlocking. Exercise left/right/top/bottom examples, confirming each panel enters/exits from its own edge and keeps the original dimensions. Check the 200ms panel and 100ms backdrop timing.
