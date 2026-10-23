# tooltip

2026-10-23 — golden pair via merge (manual replay of the user's differences): migrated to native Base Tooltip with preserved dark visual styling.

## Changed

- `src/components/ui/tooltip.tsx:6`: Provider uses native `delay`, preserving the wrapper's zero-delay default.
- `src/components/ui/tooltip.tsx:27`: Content uses Portal > Positioner > Popup; side, align, and both offsets are destructured and forwarded. Transform origin uses Base's CSS variable; native callback class names retain the wrapper's own classes.
- Preserved foreground/background colors, typography, rounding, padding, keyboard-hint selectors, fade/scale, and directional entry offsets. Enter/exit use Base starting/ending attributes with the original keyframe default of 150ms expressed as an explicit transition duration.
- Arrow uses the current base-luma per-side offsets, including logical sides, while retaining the existing rounded rotated square appearance.
- `task/base-ui-migration-2026-10-23/tooltip.md`: this component report.
- Compared both official `https://ui.shadcn.com/r/styles/radix-luma/tooltip.json` and `https://ui.shadcn.com/r/styles/base-luma/tooltip.json`. Unlike the registry's stale delayed-open selectors, the migrated wrapper uses actual Base transition attributes.
- Targeted lint and project typecheck passed. Parent owns final production build and browser verification. Baseline typecheck and production build (35/35 pages) passed.
- Leftover scan is clean: `rg -n 'radix-ui|@radix-ui|IconPlaceholder|--radix-|asChild|data-\[state' src/components/ui/tooltip.tsx` returned no matches.

## Left alone

Sidebar, providers, and other consumers belong to the parent/consumer agent. No manifests, lockfiles, registry configuration, or unrelated library wrappers were edited.

## Behavior changes

- Golden Base Content defaults to a 4px side offset, previously zero. Kept the golden default and flagged the visible spacing delta.
- Native Base hover/focus coordination replaces Radix's delayed-open states. Provider `delayDuration` becomes `delay`; installed Base 1.9 exposes provider `timeout` for the adjacent-tooltip grouping window. Trigger-specific delay belongs on Trigger.
- Consumer `asChild` becomes `render`. Installed Base Tooltip.Trigger does not accept `nativeButton`; parent removed Sidebar's unsupported prop. Tooltip `disableHoverableContent` has no direct equivalent.

## Verify by hand

Not performed by this worker. Hover and keyboard-focus collapsed-sidebar controls; check immediate opening, accessible content, 4px spacing, fade-out, and disappearance on click/Escape. Check all four sides and viewport flipping for correctly placed arrows; move between adjacent controls to assess the shared delay window.
