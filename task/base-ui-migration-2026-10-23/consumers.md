# consumers

Follow-up: native Base UI Drawer and Toast now supersede the initial Vaul/Sonner exclusions below; see drawer.md and toast.md.

2026-10-23 — engine: consumer-props.md sweep, checked against official Base UI documentation and installed @base-ui/react 1.9.0 types and implementation. Consumer migration complete in the assigned scope; integrated build and browser verification belong to the parent migration.

## Changed

Migrated 95 compositions across 38 source files from asChild to render. All 44 Button compositions that render Next Link or an anchor explicitly set nativeButton={false} and role="link". Retained destinations, target/rel attributes, accessible names, prefetch intent handlers, scroll behavior, Phosphor icons, and custom classes. Replaced 19 menu onSelect callbacks with onClick or explicit closeOnClick={false}; no unrelated onSelect APIs changed.

Dialog helper trigger props now accept ReactElement rather than ReactNode, without casts. Helpers expose triggerNativeButton, defaulting to true; menu callers explicitly pass false. Existing menu-to-dialog keep-open behavior uses closeOnClick={false} rather than cancelling the click event. All 10 DropdownMenuLabel instances now have a DropdownMenuGroup ancestor, as Base Menu.GroupLabel requires group context at runtime.

Notable anchors: src/components/public/filter-link.tsx:31 preserves the accessible link role; src/features/dashboard/posts/components/post-delete-button.tsx:26 declares the trigger element/native-button contract; src/features/dashboard/shell/components/sidebar/nav-user.tsx:94 maps only the menu-trigger state selector, and src/features/dashboard/shell/components/sidebar/nav-user.tsx:118 supplies the required menu group.

Changed files:

- src/app/(dashboard)/dashboard/about/page.tsx — settings link composition and link semantics.
- src/app/(dashboard)/dashboard/error.tsx — recovery link composition and link semantics.
- src/app/(dashboard)/dashboard/not-found.tsx — recovery link composition and link semantics.
- src/app/(dashboard)/dashboard/page.tsx — recent-action menu trigger/items, required label group, and quick-action links.
- src/app/(public)/blog/[slug]/not-found.tsx — recovery link composition and link semantics.
- src/app/(public)/blog/[slug]/page.tsx — back link composition and link semantics.
- src/app/(public)/error.tsx — recovery link composition and link semantics.
- src/app/(public)/projects/[slug]/not-found.tsx — recovery link composition and link semantics.
- src/app/(public)/projects/[slug]/page.tsx — back, live-site, and repository link compositions.
- src/app/error.tsx — recovery link composition and link semantics.
- src/app/not-found.tsx — recovery link composition and link semantics.
- src/app/preview/posts/[slug]/page.tsx — preview back link composition and link semantics.
- src/app/preview/projects/[slug]/page.tsx — preview back and project link compositions.
- src/app/unauthorized/page.tsx — sign-in link composition and link semantics.
- src/components/public/filter-link.tsx — render composition retains useLinkStatus context, intent-driven prefetch, scroll=false, active-link navigation guard, and link semantics.
- src/components/public/sections/about/bio.tsx — profile link composition and link semantics.
- src/components/public/sections/about/language-intro.tsx — language link composition and link semantics.
- src/components/public/sections/blog/featured-post.tsx — featured article link composition and link semantics.
- src/components/public/sections/blog/post-card.tsx — article link composition and link semantics.
- src/components/public/sections/projects/featured-project.tsx — case-study and external link compositions.
- src/components/public/sections/projects/project-card.tsx — case-study and external link compositions.
- src/features/dashboard/about/components/content-form.tsx — settings link and menu trigger composition.
- src/features/dashboard/about/components/structured-manager.tsx — menu trigger/callbacks, required label group, and public-page link compositions.
- src/features/dashboard/analytics/components/umami-panel.tsx — analytics link composition and link semantics.
- src/features/dashboard/gallery/components/gallery-item-form.tsx — trigger/item compositions, required label group, typed dialog trigger contracts, non-native menu triggers, and external link semantics.
- src/features/dashboard/home/components/home-section-form.tsx — home/testimonial trigger compositions, required label groups, and typed dialog trigger contracts with non-native menu triggers.
- src/features/dashboard/media/components/media-client.tsx — menu callbacks/trigger/link compositions and external link semantics; custom media selection callbacks remain unchanged.
- src/features/dashboard/posts/components/post-delete-button.tsx — typed render trigger and native-button contract.
- src/features/dashboard/posts/components/post-editor.tsx — back link and status-menu trigger compositions.
- src/features/dashboard/posts/components/posts-manager.tsx — menu trigger/items/callbacks, required label groups, dialog triggers, and navigation link compositions.
- src/features/dashboard/projects/components/project-delete-button.tsx — typed render trigger and native-button contract.
- src/features/dashboard/projects/components/project-editor.tsx — back link and status-menu trigger compositions.
- src/features/dashboard/projects/components/projects-manager.tsx — menu trigger/items/callbacks, required label groups, dialog triggers, and navigation link compositions.
- src/features/dashboard/settings/components/profile-settings-form.tsx — passkey dialog trigger compositions.
- src/features/dashboard/shell/components/dashboard-breadcrumb.tsx — breadcrumb render composition retaining native links.
- src/features/dashboard/shell/components/sidebar/app-sidebar.tsx — brand-link render composition.
- src/features/dashboard/shell/components/sidebar/nav-main.tsx — navigation-link render composition retains mobile sidebar close handler.
- src/features/dashboard/shell/components/sidebar/nav-user.tsx — menu trigger/items/callbacks, required label group, and data-popup-open styling for the account trigger.
- task/base-ui-migration-2026-10-23/consumers.md — this report.

Validation: parent baseline typecheck and production build passed (35/35 routes). Post-migration bun typecheck passed. Biome formatting and lint passed for all 38 consumer files, and git diff --check passed. An AST preservation comparison against HEAD checked 1,419 class attributes and 260 icon elements with no unexpected changes; the account-trigger selector was normalized for the intended state mapping. The final AST caller sweep inspected 3,647 JSX elements, finding no remaining Radix caller props and no Button-rendered links missing nativeButton={false} or role="link". A separate ancestry audit found 10 labels and zero labels without a group. Final source scan for radix-ui/@radix-ui in the migrated consumer files is clean. No remaining checked="indeterminate", focus/dismiss event callbacks, removed Select positioning props, or other mapped caller APIs were found outside wrappers. No consumer imports buttonVariants. All form submit actions already explicitly use type="submit"; the only untyped Button elements directly inside forms render navigation links. Full post-migration build and authenticated browser checks are not claimed by this consumer report.

## Left alone

- src/components/ui/** — owned by the parent and other wrapper agents, including pagination, Button, Sidebar, and wrapper golden-pair comparisons (radix-luma/base-luma).
- package.json, bun.lock, components.json — dependency and registry configuration owned by the parent; not edited by this agent.
- Vaul Drawer components and their caller APIs, including any asChild, remain unchanged. Buttons inside drawers were migrated only because they independently consume the migrated Button wrapper.
- MDX editor internals and their data-state CSS selectors in src/app/globals.css and src/features/dashboard/shared/components/mdx-editor.css remain unchanged; these selectors belong to the third-party editor.
- Custom sidebar collapse state selectors remain unchanged; only the menu's account-trigger open selector became data-popup-open.
- cmdk, Sonner, input-otp, react-day-picker, recharts, and unrelated selection callbacks remain unchanged.
- Tests, configuration, credentials, and external resources were not changed. No commits were created.

## Behavior changes

- Base Menu.CheckboxItem and Menu.RadioItem default closeOnClick to false. Radio-based dashboard filters, status selectors, and page-size menus therefore remain open after selection unless the user dismisses them. This idiomatic Base default is deliberately retained and flagged. Existing checkbox tag/technology filters and menu-to-dialog actions already prevented closing; explicit closeOnClick={false} preserves those existing behaviors.
- Base Tabs.List defaults activateOnFocus to false. On the dashboard About and Settings tabs, arrow keys move focus; Enter or Space activates the focused tab. No activateOnFocus override was added.
- Base Button defaults type to button, whereas the former plain button inherited HTML form submission defaults. No submit action relied on the implicit default; all submit buttons already declare type="submit".
- Base Button with nativeButton={false} otherwise introduces button semantics for anchors. Explicit role="link" preserves the prior semantics of all 44 Button-rendered links.

## Verify by hand

- Open dashboard account/recent-item, post, project, gallery, home, and structured About menus. Confirm headings render without a missing-group runtime error and retain the same appearance.
- Use arrow keys and typeahead in action/filter menus. Select a radio filter and confirm its retained-open behavior is acceptable; toggle several tags without closing the menu.
- Open Edit/Delete dialogs from menu items with mouse and keyboard. Cancel or press Escape and check focus return. Verify a failed delete stays reviewable and a successful save/delete updates the list.
- Open the mobile gallery drawer and its nested Edit/Delete dialogs. Confirm the Vaul drawer still dismisses and scrolls as before.
- Navigate public article/project links and filter chips. Check accessible link roles, modified-click/new-tab behavior, active filter guards, scroll retention, and intent-based prefetch behavior.
- Collapse/expand the sidebar, follow navigation links, and confirm the mobile sidebar closes after navigation. Open the account menu and check its open-state highlight.
- Arrow through About/Settings tabs and activate with Enter/Space. Submit a form and verify its explicit submit button still works.
