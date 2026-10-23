# dropdown-menu

2026-10-23 — golden pair via merge (manual replay of the user's differences): migrated to native Base Menu while preserving translucent custom visuals and disabled animation.

## Changed

- `src/components/ui/dropdown-menu.tsx:29`: Content uses Portal > Positioner > Popup; all four exposed positioning props are declared, destructured, and forwarded. Defaults remain start/bottom/4px with zero alignment offset. CSS variables become `--available-height`, `--anchor-width`, and `--transform-origin`.
- Kept custom `bg-popover/70`, blur/saturation pseudo-element, rounding, spacing, pointer cursors, disabled styling, rings, and descendant highlight selectors. Retained `animate-none!`, explicitly disabled transitions, and removed ineffective keyframe classes rather than introducing new menu motion. Native parts resolve callback classes.
- `src/components/ui/dropdown-menu.tsx:96`: checkbox/radio indicators use their separate Base parts and keep Phosphor CheckIcon.
- `src/components/ui/dropdown-menu.tsx:175`: Label is Menu.GroupLabel. SubmenuRoot/SubmenuTrigger replace Radix subparts; open styling uses `data-popup-open` and keeps Phosphor CaretRightIcon.
- `src/components/ui/dropdown-menu.tsx:268`: SubContent composes public Content, with start/right/-3px/0px defaults and `w-auto` to preserve submenu width.
- `task/base-ui-migration-2026-10-23/dropdown-menu.md`: this component report.
- Compared the user's wrapper with the official radix-luma/base-luma `dropdown-menu.json` pair at `https://ui.shadcn.com/r/styles/`; replayed the custom resolved classes and icons instead of overwriting.
- Targeted lint and project typecheck passed. Parent owns final production build and browser verification. Baseline typecheck/build (35/35 pages) passed.
- Leftover scan is clean: `rg -n 'radix-ui|@radix-ui|IconPlaceholder|--radix-|asChild|data-\[state' src/components/ui/dropdown-menu.tsx` returned no matches.

## Left alone

All consumers, shared Button/Sidebar, dependencies, lockfile, and components.json belong to other agents. Consumer grouping is deliberately not hidden inside this wrapper.

## Behavior changes

- CheckboxItem and RadioItem default to staying open; Item defaults to closing. Retained idiomatic Base defaults.
- `onSelect` becomes `onClick`; use `closeOnClick={false}` instead of relying on select-event cancellation. `textValue` becomes `label`; checkbox indeterminate string state is unsupported. Keyboard looping defaults to enabled.
- `asChild` becomes `render`; non-button Trigger targets require `nativeButton={false}`. Popup auto-focus/dismiss handlers migrate to finalFocus or Root event details.
- GroupLabel requires Group or RadioGroup ancestry; Base 1.9 throws otherwise. Parent/consumer agent must group labels and their associated items in nav-user.tsx, dashboard/page.tsx, home-section-form.tsx, structured-manager.tsx, gallery-item-form.tsx, posts-manager.tsx, and projects-manager.tsx. Direct ungrouped labels were observed during migration; this wrapper retains the proper native primitive.

## Verify by hand

Not performed by this worker. Open the account/action/filter menus; verify no missing-group errors, arrow keys/typeahead, submenu hover and keyboard entry, Escape focus return, link navigation, destructive actions, and checkbox/radio checked indicators. Confirm persistent filters stay open and glass styling, trigger-width matching, and submenu offsets remain correct.
