# tabs

2026-10-23 · golden pair / merge (manual replay of the user diff) · Migrated to Base UI 1.9.0; manual keyboard activation is explicitly flagged.

## Changed

- `src/components/ui/tabs.tsx:3`: import `@base-ui/react/tabs`; use native Root/List/Tab/Panel props, retaining the public TabsTrigger/TabsContent names.
- `src/components/ui/tabs.tsx:16`: forward orientation to the primitive so vertical layout and keyboard navigation agree. Both registry variants and the previous wrapper destructured orientation without forwarding it.
- `src/components/ui/tabs.tsx:67`: preserve custom classes, line/default variants, and the custom `-bottom-1.25` underline. Add the Base registry's `aria-disabled:` styling. Styled parts resolve native state callback classes.
- Root, list, tab, and underline orientation classes now explicitly select `data-[orientation=horizontal]` or `data-[orientation=vertical]`, including named group variants, matching Base 1.9.0's actual DOM attributes. Active state remains Base presence-based `data-active`. The imported `node_modules/shadcn/dist/tailwind.css:76`/`:82` also maps the old shorthand variants onto those orientation attributes, so absence of native `data-horizontal`/`data-vertical` alone was not proof the old classes failed.
- Compared the official `radix-luma/tabs.json` and `base-luma/tabs.json` registry pair from `ui.shadcn.com/r/styles/`; checked installed Root/List types and current official docs through Context7.
- `rg -n 'radix-ui|@radix-ui|IconPlaceholder' src/components/ui/tabs.tsx` is clean. Formatting/lint passed; initial shared typecheck reported no errors here but failed in other in-progress scopes. Parent baseline typecheck/build passed.
- This report is `task/base-ui-migration-2026-10-23/tabs.md`.

Final shared bun typecheck passed (exit 0) after the parallel scopes converged.

SSR smoke checks passed for all nine assigned wrappers: render composition, data slots, callback classes, disabled/mixed input state, Tabs ARIA orientation, labels, and avatar fallback. Browser interaction verification remains with the project-wide check.

The earlier SSR test asserted only Tabs' ARIA orientation, active markup, and panel text; it did not verify computed layout. A subsequent SSR fixture confirms real `data-orientation="horizontal"`/`"vertical"` and `data-active=""`, without native `data-horizontal`/`data-vertical` attributes. Isolated Chromium using the actual compiled `src/app/globals.css` passed all four orientation/variant layouts: horizontal root column/list row/36px list height; vertical root row/list column/start-aligned tabs; horizontal underline height 2px/bottom -5px; vertical underline width 2px/right -4px; line underline opacity 1 and default opacity 0. Fixture/check scripts are in `.tmp/base-ui-migration-2026-10-23/display-*`. This verifies SSR layout/CSS; hydrated keyboard activation remains part of project-wide QA.

## Left alone

About/settings consumers remain owned by the consumer agent. No automatic `activateOnFocus` override, compatibility activationMode prop, dependency edit, or new indicator styling was introduced.

## Behavior changes

- Base List defaults to manual activation: arrows move focus; Enter/Space activate. Radix defaulted to automatic activation. This idiomatic Base delta is flagged without overriding it. Consumers can explicitly use `TabsList activateOnFocus` if requested later.
- List `loop` becomes `loopFocus`; Content `forceMount` becomes `keepMounted`; `render` replaces `asChild`.
- Base may select the first enabled tab when no matching initial selection exists; controlled/default string values still work. Inactive panels use `data-hidden`.
- Vertical orientation now reaches the primitive, correcting the pre-existing lost prop.

## Verify by hand

On About/settings tabs, use arrows and confirm focus moves without changing panels, then activate using Enter/Space. Check click selection, disabled tabs, line/default styles, and vertical Up/Down keyboard behavior.
