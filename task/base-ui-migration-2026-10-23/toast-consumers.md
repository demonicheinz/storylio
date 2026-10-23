# Toast consumers

2026-10-23 — Replaced 78 Sonner notifications in 13 consumer files with the native manager exported by `@/components/ui/toast`.

## Changes

Every `toast.success(message)` / `toast.error(message)` now calls `toast.add({ title: message, type: "success" | "error" })` with the original expression and notification type. Imports use the native manager directly, without compatibility aliases. All existing fallback messages, interpolations, error handling, refreshes, selection updates, and authentication/database operations remain intact.

| Consumer file | Calls |
| --- | ---: |
| `src/components/public/sections/blog/heading-link.tsx` | 2 |
| `src/features/dashboard/about/components/content-form.tsx` | 2 |
| `src/features/dashboard/about/components/structured-manager.tsx` | 6 |
| `src/features/dashboard/gallery/components/gallery-item-form.tsx` | 9 |
| `src/features/dashboard/home/components/home-section-form.tsx` | 12 |
| `src/features/dashboard/media/components/media-client.tsx` | 13 |
| `src/features/dashboard/posts/components/post-delete-button.tsx` | 2 |
| `src/features/dashboard/posts/components/post-editor.tsx` | 3 |
| `src/features/dashboard/posts/components/posts-manager.tsx` | 2 |
| `src/features/dashboard/projects/components/project-delete-button.tsx` | 2 |
| `src/features/dashboard/projects/components/project-editor.tsx` | 3 |
| `src/features/dashboard/projects/components/projects-manager.tsx` | 4 |
| `src/features/dashboard/settings/components/profile-settings-form.tsx` | 18 |

## Scope and API verification

Inspected installed Base UI toast manager declarations and Context7 documentation for `/mui/base-ui/v1.9.0`. All discovered consumers used single-argument success/error calls. No info, warning, loading, dismiss, promise, update, custom, description, or action cases required migration or clarification.

Applied contextual patches to consumer imports and toast expressions, preserving concurrent Drawer and other feature edits. UI wrappers, providers, dependencies, configuration, fixtures, documentation directories, auth/DB business logic, and commits were outside this assignment and were not changed by this work.

The requested `docs/CODEX-NAVIGATION-GUIDE.md` was absent from this checkout.

## Verification

- Post-edit `bun run typecheck`: passed, exit 0.
- `bun lint` restricted to all 13 changed consumers: passed, no fixes applied.
- TypeScript AST inspection: all 78 migrated calls preserve the token sequence of their original message expression and original success/error type.
- Final source scan excluding `src/components/ui` and `src/providers`: no Sonner references or legacy toast methods remain.
- No browser session or full application build was run for this consumer-only assignment; parent owns integrated provider/rendering QA.

An earlier typecheck before consumer edits encountered three errors in the concurrently edited `tests/fixtures/base-ui/page.tsx` (Drawer-related `showSwipeHandle`/`render` props). The final typecheck passed after the parent/other-agent changes; this assignment did not modify that fixture.

## Parent QA handoff

Consumers are ready for integrated QA and Sonner dependency removal. Confirm a successful save displays its original success title, an unsuccessful operation displays its original error title, and heading-link copying displays the corresponding success/error toast. Provider styling, placement, dismissal, and accessibility remain part of the parent's native toast implementation.

## Self-evaluation

| Criterion | Score | Evidence / improvement |
| --- | ---: | --- |
| Accuracy | 4/5 | Typecheck, targeted lint, and all 78 message expressions verified; browser rendering remains for parent QA. |
| Completeness | 5/5 | All 13 consumer files migrated and scoped leftover scan clean. |
| Clarity | 4/5 | File inventory and limitations explicit; integrated QA results can complete the handoff. |
| Actionability | 4/5 | Consumer migration ready; parent must verify provider behavior in browser. |
| Conciseness | 4/5 | One report with verification and inventory; evaluation adds some reporting overhead. |

Overall: 4.2/5. Highest-impact follow-up: parent browser QA of the shared provider. The user should agree this consumer scope is complete while integrated rendering verification remains separate.
