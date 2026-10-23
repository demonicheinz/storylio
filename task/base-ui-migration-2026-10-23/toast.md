# toast

2026-10-23 · supplied shadcn Base UI source / native API migration · Replaced Sonner with native Base UI Toast.

## Changed

- `src/components/ui/toast.tsx`: use the user's supplied official Base UI Toast composition with Phosphor icons and the project cn alias. Exports a real createToastManager instance, native Provider/Portal/Viewport/Root parts and Toaster.
- `src/components/ui/sonner.tsx`: removed; no compatibility alias for success/error.
- `src/providers/index.tsx`: Toaster wraps children so context and shared external manager work together.
- Thirteen consumer files: 78 success/error calls converted to toast.add with the original title expressions and types; see toast-consumers.md.
- `package.json`, `bun.lock`: remove Sonner and Vaul dependencies after both native migrations.
- QA fixture/script now cover toast appearance, title and dismissal, Drawer open/close and nested Dialog. Source scan for Sonner/Vaul imports is clean.

## Left alone

- Business operations producing the notifications, form validation, database writes and message text remain unchanged.
- Existing non-Radix chart/editor/image libraries are unchanged.

## Behavior changes

- Notifications use Base UI's native manager lifecycle, stack/swipe behavior and 5000ms default timeout instead of Sonner's defaults. The existing consumers only used success/error messages with no Sonner action/promise API.
- Toaster is now a provider wrapping children, not a standalone Sonner renderer. Colors remain semantic project tokens and icons remain Phosphor.
- Drawer now follows native Base UI nesting/swipe behavior; see drawer.md. No Vaul/Sonner exclusions remain in final scope.

## Verify by hand

- Show success/error notifications on a dedicated test environment; check title, icon, timing, dismissal and stacking.
- Test a mobile Drawer containing a Dialog: close the Dialog without dismissing its parent, then close the Drawer and check focus.
- Automated isolated fixture checks passed at 1440px and 390px; 55 existing Vitest tests pass. Actual authenticated save/delete flows were not run on production data.
