# drawer

2026-10-23 — golden pair via registry / manual replay. Migrated Vaul to native Base UI 1.9 Drawer at the user's explicit request, overriding the skill's usual Vaul exclusion.

## Changed

- `src/components/ui/drawer.tsx:3`: imports `@base-ui/react/drawer`; uses native Root, Backdrop, Viewport, Popup, Content, Trigger and Close, with official 1.9 part prop types. No legacy API aliases.
- `src/components/ui/drawer.tsx:29`: registry context carries modal, snap points, swipe direction and optional handle. Native `swipeDirection` defaults to `down`; `showSwipeHandle` defaults to false as supplied.
- `src/components/ui/drawer.tsx:99`: Popup receives native focus props (`initialFocus`, `finalFocus`) unchanged. No `onCloseAutoFocus`/`onOpenAutoFocus` handlers existed in the dashboard consumers to translate. Native nesting and swipe CSS variables replace Vaul attributes.
- Golden sources: official `https://ui.shadcn.com/r/styles/radix-luma/drawer.json` and `https://ui.shadcn.com/r/styles/base-luma/drawer.json`, saved under `.tmp/base-ui-migration-2026-10-23/{radix-luma,base-luma}/drawer.json`. Read the supplied attachment too; its capped radius differs from current base-luma's `rounded-4xl`. Replayed Storylio's local `cn` import and `font-heading` substitution. Preserved existing transparent popup, inset pseudo-element panel/background/border/shadow/radius, padding, 80vh vertical cap and full header/footer padding so existing consumer overrides continue to work. Retained native transition, swipe and nested stack machinery.
- `src/features/dashboard/media/components/media-client.tsx:408`: native `swipeDirection`, `down` mobile state and explicit swipe handle. `:1064`: retained deferred opening but removed pre-open blur so Base UI remembers the opener. `:1645`: rename and confirmation dialogs now render as children of MediaDetailDrawer (outside its popup), allowing Base UI's shared overlay context to track nesting while preserving independent opening from media cards when the drawer is closed.
- `src/features/dashboard/gallery/components/gallery-item-form.tsx:1242`: native direction and explicit handle; responsive state now uses `down`/`right`. Existing edit dialog remains inside DrawerContent.
- `src/features/dashboard/posts/components/posts-manager.tsx:1528` and `src/features/dashboard/projects/components/projects-manager.tsx:1738`: filter drawers use `swipeDirection="down"` and explicit handles.
- Verification: `bun typecheck` passed after wrapper migration and again after focus/nesting changes. Targeted `bun lint` passed for all five source files. `git diff --check` passed. Component sweep for `radix-ui|@radix-ui|IconPlaceholder|vaul|onCloseAutoFocus|onOpenAutoFocus` is clean. Source wrapper scan finds **0 wrappers remaining on Radix**.
- Baseline supplied by parent: 55 tests and 35 build routes passed. This task did not rerun the full suite or build; the parent owns final shared verification and the expanded browser fixture. No claim of browser-verified swipe or focus behavior is made here.

## Left alone

- Dependencies, lockfile, global providers and toast wrapper belong to the parent/other agent. Parent will remove Vaul.
- All non-Drawer changes in shared dashboard files were preserved; edits were applied to live files without restoring earlier versions.
- Parent-owned `tests/fixtures/base-ui/page.tsx` and `tests/browser/base-ui-smoke.js` were inspected, not changed. Their native Drawer and nested Dialog cases are ready to run against this wrapper.
- `docs/CODEX-NAVIGATION-GUIDE.md` was requested by repository guidance but does not exist in this checkout.

## Behavior changes

- Drawer now uses Base UI's swipe gestures, native transition states, optional snap points, modal modes and nested stacking. These are native behaviors rather than Vaul emulation.
- Handle is opt-in in the wrapper and explicitly enabled at all four dashboard roots. Native horizontal drawers display a vertical side handle; previous Vaul styling only displayed the bottom handle.
- Media rename/delete dialogs share the Drawer overlay context; closing a nested overlay should restore its opener without closing the parent. Focus is no longer deliberately blurred before opening an overlay.
- `data-slot="drawer-popup"` now identifies the styled/focusable shell; `drawer-content` identifies the inner native Content. Consumer className and focus props still apply to Popup.

## Verify by hand

- Run the parent's expanded Base UI fixture at desktop and mobile widths: open Drawer, open/close nested Dialog, confirm Drawer stays open, then close Drawer and check focus returns to its trigger.
- In media details, open Rename, cancel with Escape, confirm focus returns to Rename and the drawer stays open; repeat Delete/Cancel. Check these dialogs also open normally from a media card with the drawer closed.
- Open gallery details and its edit dialog; cancel and verify focus returns within the drawer.
- At mobile width, open post/project filters, scroll the controls, swipe down to dismiss, and verify reopening preserves existing apply/reset behavior. Check right-hand desktop media/gallery layout, panel rounding and scroll areas.
- Confirm modal tab trapping, Escape/outside dismissal, down/up/left/right swipe direction and reduced-motion appearance in the parent fixture/manual checks; these runtime behaviors are pending the shared browser pass.
