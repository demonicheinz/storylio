# Shared-journal and disabled-drop review

## Confirmed findings and changes

- scripts/database.ts rejects migration target flags and invokes the installed
  Drizzle migrator with the complete folder. The installed PostgreSQL dialect
  iterates every entry newer than the ledger. Both 0003 and 0004 are in the same
  journal, so the previous independent rollout instructions were unsafe.
- Kept the reviewed journal intact and introduced no target CLI feature.
  README, AUTH_RECOVERY and DRIZZLE_MIGRATION now require a verified/restorable
  Testimonial backup, explicit drop authorization and a consumer inventory
  before the first migration run. If 0003 is still pending, pause old consumers
  for a coordinated migration/deployment, and resume only after health checks.
  A schema-dependent build needs a compatible staging database or must run after
  migration during maintenance. If 0003 is already applied, no-consumer code can
  deploy first before the separately authorized remaining drop. No database
  migration or data operation was performed for this review.
- Corrected the one-item logo count; phase singular/plural remains consistent.
- Added wrapper capture prevention for dragover/drop and a synchronous upload
  guard. Disabled/pending files cannot start a concurrent upload or crop flow.
  The native button still supplies keyboard and disabled-control semantics.

## Chromium evidence

The regression fixture bundles the real ImageUpload and defers only its upload
transport. The first local PNG starts an upload and disables the button. CDP
Input.dispatchDragEvent then performs a native file drag/drop using a second
temporary PNG. Observed browser events have isTrusted=true, not synthetic DOM
dispatchEvent behavior.

Before the fix, Chromium did NOT navigate the tab to the file, but it delivered
the drop to the disabled zone and started a second upload (calls=2). Thus the
exact proposed navigation failure was not reproduced in this Chromium build;
concurrent upload was concretely reproduced.

After the fix: drop.defaultPrevented=true, one upload call, unchanged tab URL,
and controls recover after resolving the first request. No real upload API,
Cloudinary, auth secret or database was used. The fixture server at 3196 and its
isolated browser were stopped after the check. User servers/tabs retained.

Durable reproduction: tests/fixtures/image-upload-drop/README.md and
tests/browser/image-upload-drop.js. Fixture files stay in ignored .tmp.

## Checks

Lint, TypeScript and git diff --check passed. Focused migration, Home action,
streaming-shell and draft suite: 4 files / 52 tests passed. Chromium native-drop
regression passed. No commit, push or migration application.

Self-check: accuracy4/5 (native Chrome evidence; other browser engines untested),
completeness4/5 (all three review points addressed, no live deployment),
clarity4/5 (separate pre-/post-0003 rollout paths), actionability4/5 (commands
retain their existing behavior; operator must authorize maintenance/drop),
conciseness4/5 (evidence archived; brief chat close appropriate).
