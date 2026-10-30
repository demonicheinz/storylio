# CodeRabbit follow-up

2026-10-23. Review of action dismissal, client variants, group labels and keyboard input through portaled dialogs.

## AlertDialogAction

Audited all 11 real application actions across eight files. No missing success
dismissal path exists. Action deliberately remains a plain Button, documented
in `alert-dialog.tsx`, so asynchronous failure handling is not bypassed by an
automatic Close primitive.

| Caller | Dismissal |
| --- | --- |
| PostDeleteButton | Success → setOpen(false); returned failure stays open. |
| ProjectDeleteButton | Success → setOpen(false); returned failure stays open. |
| HomeSectionDeleteButton | Success → setOpen(false); failure stays open. |
| TestimonialDeleteButton | Success → setOpen(false); failure stays open. |
| GalleryDeleteButton | Success → setOpen(false); failure stays open. |
| Posts bulk action | Success → clearSelection/setBatchMode(false), unmounting action bar/dialog. |
| Projects bulk action | Same success-only unmount. |
| Gallery bulk action | Same success-only unmount. |
| Media batch delete | Success → setIsBatchDialogOpen(false); failure stays open. |
| Media single delete | setDeleteTarget(null) after either returned result. |
| Structured About delete | setDeleting(null) after either returned result. |

Media single and structured About delete dismiss on a returned failure, showing
an error toast. Both behaviors already exist in HEAD; neither is changed in this
review. No actual content was deleted during verification. This is source-flow
auditing, not full authenticated end-to-end validation.

## Variant exports and label groups

AST inspection found all three variant-function calls in client modules:
Button, Badge and Pagination. No server component calls buttonVariants or
badgeVariants. No extraction is needed for the current callers.

All 11 real DropdownMenuLabel uses have a DropdownMenuGroup ancestor. Existing
group fixes cover nav-user, app-sidebar, recent activity, structured About,
Gallery and post/project menus. The fixture also uses Group.

## Portaled form keyboard: confirmed bug, fixed

The previous browser fixture placed the Dialog root outside the Menu popup;
opening/closing it did not test React keyboard bubbling from actual menu-owned
dialogs. Added a Dialog root inside DropdownMenuGroup with input and textarea.
Before the fix, browser typing `a b` failed because characters/Space were consumed
by ancestor menu handlers.

DialogContent now invokes the caller's onKeyDown handler and stops bubbling to
React ancestors. It does not prevent the input's default key behavior. This
isolates menu typeahead without restructuring every consumer or dismissing a
parent menu before opening the form.

The expanded smoke passes at 1440px and 390px: input and textarea accept `a b`,
ArrowLeft plus `x` yields `a xb`, ArrowRight plus `y` yields `a xby`, focus stays
on the field, and Escape closes the dialog while leaving the parent menu open.
Existing dialog focus trap/return, menu actions, native Drawer/nested Dialog,
Toast, Tabs and control checks also pass. No browser page errors were captured.

Temporary app fixture and stale generated dev types were removed/moved before
the production build; the reusable fixture remains under tests/fixtures.
Final production build including TypeScript passed (35/35 pages); all 55 tests
across 10 files, lint and diff checks passed after the keyboard fix.

## Evaluation

Accuracy 4/5: typing failure reproduced and fixed; action flows audited rather
than deleting live content. Completeness 4/5: all four review claims addressed,
with generic nested input/textarea coverage rather than every authenticated
form. Clarity 4/5: actual bug and safe existing code distinguished. Actionability
4/5: repeatable fixture and explicit component contract; preview authenticated
checks remain useful. Conciseness 4/5: shared popup fix covers multiple consumers
without changing menu ownership. Average 4.0/5. Highest-value follow-up is testing
real editor forms with a dedicated auth/database fixture.
