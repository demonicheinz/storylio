# project

Follow-up: native Base UI Drawer and Toast now supersede the initial Vaul/Sonner exclusions below; see drawer.md and toast.md.

Final scope after the user's correction includes native Drawer and Toast, all
Drawer callers and 78 toast calls across 13 files. `vaul` and `sonner` are removed
from the manifest/lockfile. Providers wraps children with the native Toaster.
Extended desktop/mobile fixture tests pass for toast dismissal and Dialog-inside-
Drawer behavior, alongside prior primitive interactions. Final Vitest remains
55/55 passing, lint passes and frozen installation reports no changes. Historical
exclusions in the initial-stage sections below no longer describe the final scope.

2026-10-23 · golden pairs / manual custom-class replay · Whole-project migration completed on refactor/ui-base-ui; 0 source wrappers remain on Radix.

## Changed

- `components.json`: radix-luma → base-luma; final shadcn CLI confirms base=base.
- `package.json` and `bun.lock`: add @base-ui/react 1.9.0, remove direct radix-ui; frozen install passes without changes.
- Sixteen Radix-importing wrappers migrated: alert-dialog, avatar, badge, breadcrumb, button, checkbox, collapsible, dialog, dropdown-menu, label, separator, sheet, sidebar, switch, tabs, tooltip. Matching component reports document implementation and deltas.
- `src/components/ui/pagination.tsx`: native anchor styled with the existing buttonVariants instead of Slot/Button asChild.
- All application callers use render composition. Button-rendered anchors retain link role/nativeButton=false; menu labels now have required groups, menu callbacks use onClick, dialog focus props use Base APIs, checkbox mixed state uses indeterminate, and CSS states/vars match Base.
- Custom variant classes, fonts, colors and Phosphor icons retained. Drawer and Sonner APIs are unchanged.
- `README.md`: updated UI primitive stack and isolated QA instructions.
- `tests/fixtures/base-ui/page.tsx`, `tests/browser/base-ui-smoke.js`: reusable local fixture and mouse/keyboard/desktop/mobile interaction checks; fixture is not an application route in the final build.
- Reports are in task/ rather than the skill's default .migration/ because the user's AGENTS instructions explicitly require task artifacts here.
- Leftover scan for radix-ui/@radix-ui imports, asChild and --radix CSS vars across application source is clean. Sidebar's own data-state and third-party editor selectors remain intentional.

Baseline typecheck and production build passed before dependency/source changes. Final verification:

- 55 Vitest tests on 10 files pass.
- Production build including TypeScript passes, 35/35 pages; lint and diff checks pass.
- Frozen dependency installation passes. Audit remains one known high braces advisory, no additions.
- Real hydrated fixture checks at 1440px and 390px pass: native/disabled Button, anchor roles, explicit form submit, dialog focus trap/return, alert cancel/confirm, menu actions/checkbox, menu-to-dialog composition, checkbox/switch keyboard, manual Tabs, Collapsible, Tooltip keyboard opening/dismissal and Sidebar collapse/hotkey/mobile sheet geometry.
- Screenshots `.playwright-cli/base-ui-desktop.png` and `base-ui-mobile.png` inspected; no horizontal overflow.
- Final production browser security smoke passes all six checks. Public stack/topic hover/focus filters and About language switching pass existing latency-injected regression checks.
- Independent read-only review found no additional concrete runtime/semantic blockers after the known Tabs orientation fix.
- Final metadata: [evidence.json](evidence.json).

Generated dev route types retained a deleted QA route and briefly blocked the final build. Only that generated cache was moved to .tmp; the subsequent build passed. An initial fixture incorrectly rendered a native dialog trigger through a non-native Menu.Item; the fixture was corrected and the final run has no new runtime errors. Tooltip is tested through actual Base Popup/trigger behavior, not an assumed role on its visual popup.

## Left alone

- Vaul 1.1.2 Drawer and Sonner are separate libraries, not Radix-wrapper migration targets. Vaul still depends on @radix-ui/react-dialog transitively; this does not mean application wrappers remain on Radix.
- MDX editor internals, chart libraries, auth configuration, SQL/schema/migrations, data and secrets are unchanged.
- Full authenticated CMS save/delete flows and real OAuth/WebAuthn were not exercised; generic controls and existing safe security/integration coverage were used without production mutation.
- No commit, push, deploy or external resource changes by the agent.

## Behavior changes

- Tabs now use Base's manual keyboard activation: arrows focus; Enter/Space activate. Click behavior remains available. No automatic-activation override was silently added.
- Menu checkbox/radio items default to remaining open; closeOnClick can be set deliberately per use case. Existing keep-open menu-to-dialog/tag controls explicitly preserve their behavior.
- Base Button defaults type=button. Existing application submits were audited and already have explicit type=submit.
- Separator is semantic unless role is overridden, replacing the former decorative default. Checkbox/Switch internal DOM differs; disabled/mixed state styles were adjusted.
- Tooltip golden Base default offset is 4px rather than the previous 0px; recorded in its report.

## Verify by hand

1. On a preview deployment, check authenticated dashboard menus, edit/delete dialogs and mobile Sidebar without making unintended content changes.
2. Confirm focus returns appropriately when dialogs opened from menus are cancelled, and inspect validation/error states on a dedicated test database.
3. Test About/Settings keyboard tabs with manual activation and the persistent radio menus; decide separately if automatic activation or close-on-selection is desired.
4. For repeatable primitive QA, copy the fixture temporarily into the documented app route, run the browser script, then remove the app copy before building. Browser/server sessions from this run have been closed.

Self-evaluation: accuracy 4/5 (installed types, source scans, builds and real interactions verified; real authenticated mutations not tested); completeness 4/5 (all direct wrappers and consumers migrated; Vaul intentionally retained); clarity 4/5 (per-component reports and explicit deltas; substantial cross-cutting diff); actionability 4/5 (repeatable fixture/commands, preview QA still useful); conciseness 4/5 (shared wrappers retain current UI; reports keep implementation evidence out of the chat). Average 4.0/5. Highest-value follow-up is authenticated preview QA on a dedicated environment, not additional unrelated redesign.
