# avatar

2026-10-23 · golden pair / merge (manual replay of the user diff) · Migrated to Base UI 1.9.0; custom image handling and classes preserved.

## Changed

- `src/components/ui/avatar.tsx:3`: replaced the Radix import and part types with `@base-ui/react/avatar` and its native props.
- `src/components/ui/avatar.tsx:29`: retained `src={src || undefined}`, absent from the stock Radix Luma wrapper, to avoid empty image URLs. Kept sizing, all existing classes, and the native badge/group helpers.
- Styled primitive parts accept both string and state callback classes without passing functions into `cn`.
- Compared the official `radix-luma/avatar.json` and `base-luma/avatar.json` registry pair from `ui.shadcn.com/r/styles/`; checked installed Image/Fallback types. `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/avatar.tsx` is clean.
- Formatting/lint passed. Initial initial shared typecheck reported no errors in this file; other agents' in-progress files prevented a complete pass. Parent baseline typecheck and build (35/35 routes) passed before edits.
- This report is `task/base-ui-migration-2026-10-23/avatar.md` per the user's artifact-location instruction.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

## Left alone

Avatar consumers and all other wrappers are outside this agent's ownership. No dependency, lockfile, or registry configuration edits; the parent owns those changes.

## Behavior changes

Native Base UI composition uses `render` instead of `asChild`. Fallback delay is `delay`, replacing Radix `delayMs`; installed types confirm this belongs to Fallback. No current consumer uses that legacy delay prop. No compatibility alias was added.

## Verify by hand

Check a valid photo, a failed URL, and an empty photo value. Verify initials appear and default/small/large avatars, group overlap, and badge positions retain their appearance.
