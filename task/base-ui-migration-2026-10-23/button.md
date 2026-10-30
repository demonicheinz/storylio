# button

Follow-up: native Base UI Drawer and Toast now supersede the initial Vaul/Sonner exclusions below; see drawer.md and toast.md.

2026-10-23 · golden pair / manual replay · Migrated to the native Base UI Button, retaining Storylio variants.

## Changed

- `src/components/ui/button.tsx`: use `@base-ui/react/button`, retain CVA classes, data-slot/variant/size, and accept native render/nativeButton props instead of asChild. Resolve className callbacks on the client.
- `src/components/ui/pagination.tsx`: preserve actual anchor semantics using buttonVariants classes, without a Radix Slot. Client boundary supports the shared client variant export.
- Consumers are migrated in the consumer sweep report. No radix-ui/@radix-ui imports remain in these files.

## Left alone

- Vaul Drawer and Sonner are unrelated libraries and remain installed.
- Other wrappers are documented separately. No visual preset, font or palette replacement.

## Behavior changes

- Base UI Button defaults to type=button; submit actions must set type=submit explicitly. Consumer forms were audited separately.
- Base non-native Button supplies button semantics by default; link consumers explicitly use role=link and nativeButton=false.

## Verify by hand

- Activate normal and disabled buttons with mouse/Enter/Space. Confirm disabled actions do not fire.
- Follow a link-rendered button and verify link role and native modifier-click behavior.
- Submit password/content forms and verify their explicit submit buttons.
