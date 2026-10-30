# Pre-commit review corrections

All corrections are applied to the existing working tree. No commit, push,
migration, account/content change, or user-server restart was performed.

## Changes

- Post and Project native form submission now preserves the current status;
  creating a draft cannot publish through implicit submission. Explicit Publish
  buttons remain available. The regression covers create drafts with/without
  content, existing empty drafts and existing published edits in both editors.
- Mobile Posts batch titles render plain text. Clicking the title selects or
  deselects without navigation. Cancel restores the edit link. Existing behavior
  that exits mobile batch mode when the final item is deselected is preserved.
- Corrected project OG helper text to 1200×630.
- Better Auth catches a background task rejection immediately, then passes the
  handled Promise to Next after. A deferred-response test failed before the fix
  and now verifies the catch is attached before the response is released.
  Database fixture mocks now accept both Promise and callback after arguments.
- Sidebar stores manual-choice state in a ref, subscribes to media changes once,
  and preserves manual choices when reads/writes to localStorage throw. An isolated
  browser fixture covers eight scenarios; no auth or database is involved.
- assessment-b.md uses repository-relative source links with #L anchors. Its
  detector JSON is now a durable neighboring artifact rather than a .tmp link.
  The report remains a historical assessment, not a current finding claim.
- Recovery browser waits now match the current generic email and reset-success
  copy; all MFA flows execute again.
- Gallery authorization regression uses a valid full permutation and asserts
  Unauthorized plus unchanged stored orders, rather than accepting any failure.

## Verification

- Full Vitest suite: 58 files / 340 tests passed.
- Focused background/recovery/hardening/local-auth run: 15 tests passed.
- Gallery reorder suite: 9 tests passed, including strengthened authorization.
- Editor SQL regression: 8 tests passed. Browser editor tests reproduced the
  native-submit defects before the fix and pass for both editors afterward,
  alongside autosave sequencing and explicit publication.
- Sidebar browser: 8 scenarios passed, including blocked getItem, setItem and
  both, invalid/absent preferences, persisted choices and viewport changes.
- Mobile batch browser passed with real PostsManager and example content. An
  initial test assumed Cancel remained after deselecting the last item; it was
  corrected to respect the existing automatic exit, then separately tested Cancel
  while an item remained selected. Session endpoint is intercepted in final run.
- Recovery/MFA browser passed at four sizes, through reset, challenge, setup,
  backup code regeneration and disabling fixture MFA. No real credential was used.
- Lint, TypeScript and git diff --check passed. Production build passed all 38
  routes; reporting and source-map upload were disabled for verification.

## Button audit and limits

App-owned ImageUpload, TagsInput and DateTimePicker controls have explicit button
types. Shared Base UI Button defaults to type=button. MDX overlay dialogs portal
outside the editor form; no missing app-owned control type was found. The safe
native-submit behavior protects against other implicit submissions regardless.

Temporary auth-security-fixture-check and dashboard-overview-fixture-check routes
were removed. Parent QA browsers closed; sidebar/editor task-only servers and
sessions were stopped by workers. Existing user dev server/tabs were retained.
No live email, sign-in, publishing, batch mutation or reorder was executed.

## Self-check

Accuracy 4/5: reproduced regressions and concrete assertions; physical device
coverage is emulated Chromium. Completeness 4/5: all eight review items and project
analogue addressed; no live CMS mutations. Clarity 4/5: focused fixes and browser
fixtures; generated history remains separate uncommitted work. Actionability 4/5:
ready to include in the earlier commit groups after review. Conciseness 4/5:
verification detail archived here, short final response appropriate.
