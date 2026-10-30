# Collapsed dashboard sidebar alignment

The collapsed rail is 64px wide, while menu buttons were fixed at 32px and
aligned to the start. Labels and account details also remained in the flex
layout. Centering only the icon would not center its control or remove that
extra content.

The shared menu button now uses a stable icon column and fades trailing content.
Normal rows remain 44px tall and logo/account rows remain 56px tall in both states.
Rail, page gap, and group transitions share a 240ms ease-out curve with reduced
motion support. Tooltip strings supply accessible names; the account
trigger has an explicit name because its visible account text is hidden.

## Verification

- Chromium fixture with actual dashboard components: passed at 1440, 1024,
  and 768px. All eleven controls and their first visual children have zero
  horizontal offset from the rail center, with targets at least 44px in size.
- Reopening the sidebar restores the About label at all three sizes.
- Screenshots: `sidebar-1440.png`, `sidebar-1024.png`, `sidebar-768.png`.
- `bunx --no-install tsc --noEmit`: passed.
- Targeted Biome check: passed after formatting the browser script.
- Scope: fixture browser verification, not a full authenticated app test.
- Motion check: 49 sampled frames retained logo x=13.5px and height=56px while
  the panel shrank from 256px to 64px. Reduced motion disables panel transitions.

## Self-evaluation

| Axis | Score | Evidence and improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Actual components and CSS measured in Chromium; full authenticated route was not exercised. |
| Completeness | 4/5 | Logo, menus, account and expanded state checked at desktop/tablet sizes; mobile drawer is outside this fix. |
| Clarity | 4/5 | Cause and scope documented; fixture setup requires a separate server. |
| Actionability | 5/5 | Fix is implemented with a reproducible browser command and screenshots. |
| Conciseness | 4/5 | Production diff is small; fixture scaffolding is longer than the CSS change. |

Overall: 4.2/5. A follow-up authenticated route smoke would extend confidence
beyond isolated layout. The assessment matches the requested alignment fix.

## Mobile portal regression — 29 October 2026

The mobile Sheet renders outside SidebarProvider, so `--sidebar-width-icon`
was unavailable to the grid declaration. With no fallback, the declaration was
invalid and icons/text occupied separate rows. A 4rem fallback now keeps the
grid valid inside the portal while preserving configured desktop values.

`sidebar-mobile.js` reproduced the original failure at 767px, then passed at
767/640/390/320px: all eleven controls have aligned icon/text centers, at least
44px hit targets, and a panel inside the viewport. Desktop/tablet geometry and
collapse/reduced-motion checks also passed. Screenshots: `mobile-*.png`.
