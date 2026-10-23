# sidebar

2026-10-23 · golden pair / custom-class replay · Migrated polymorphic Sidebar parts to Base UI useRender.

## Changed

- `src/components/ui/sidebar.tsx`: replace Slot/asChild with useRender/mergeProps for group label/action, menu button/action and subbutton. Original cn expressions retain custom spacing, collapse behavior and tooltip styling.
- Compose SidebarMenuButton with native TooltipTrigger render; mobile Sidebar continues to use the migrated Sheet with an accessible title/description.
- Preserve custom data-state=expanded/collapsed and its CSS selectors; this state belongs to Sidebar, not a Radix primitive.
- Leftover scan for radix-ui/@radix-ui is clean in this file.

## Left alone

- Sidebar cookie, width constants, hotkey and controlled/mobile state logic remain unchanged.
- Navigation labels and ownership are unchanged; consumers are covered by the consumer report.

## Behavior changes

- Public polymorphic API uses render instead of asChild. Base state mappings emit boolean presence attributes for active menu states.

## Verify by hand

- Toggle collapse on desktop; confirm active link styling and tooltip text.
- Open/close mobile sidebar with the rail trigger and Escape; verify focus returns.
- Navigate using sidebar links and keyboard, including sublinks and menu actions.
