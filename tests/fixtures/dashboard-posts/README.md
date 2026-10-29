# Dashboard Posts fixture

Runs actual Posts manager/editor, shared MDX editor/date-time picker, and the
private Note preview with project fonts and CSS. The 65 posts are synthetic.
Write actions are browser-local stubs that record calls and preserve publication
fields during autosave. No CMS, database, email or storage credentials are used.

Start from the repository root:

```powershell
bun tests/fixtures/dashboard-posts/serve.mjs
```

In another terminal:

```powershell
bunx --no-install playwright-cli -s=posts-polish open http://127.0.0.1:3198 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=posts-polish run-code --filename=tests/browser/dashboard-posts.js
bunx --no-install playwright-cli -s=posts-polish run-code --filename=tests/browser/post-scheduling.js
bunx --no-install playwright-cli -s=posts-polish run-code --filename=tests/browser/posts-publication-clock.js
bunx --no-install playwright-cli -s=posts-polish close
```

Stop the fixture with Ctrl+C. Screenshots go to
`task/dashboard-posts-review/updated-*`.

Views: `/` (manager), `?editor=create|draft|published|scheduled`, `?note` alongside
an editor view, `?picker`, `?preview-note`, and `?due` for a post due in one minute.

The manager/editor suite checks 1440/1024/768/390/320/275px, direct title editing,
pagination, cross-page selection, tag search in the mobile drawer, staged Reset,
title-before-content composition, draft save, exact Notes tag retention, dirty
link protection, saved-slug preview and the shared private Note reading body.

The scheduling suite uses Playwright's clock and Bangkok timezone to verify
content autosave leaves publication intent dirty, explicit scheduling, Publish
now, withdrawal to draft, an inactive draft plan kept in session storage,
due-time filter transitions, picker collisions and Escape/focus return.

Real persistence/authentication/publication validation is covered separately by
PGlite tests in `tests/database/post-publication.test.ts` and
`tests/database/editor-autosave.test.ts`. Form baseline reconciliation is covered
by `tests/public/post-save-reconciliation.test.ts`. The fixture router and filter
hooks do not emulate full Next navigation/history behavior.

The publication-clock check advances a due post across its deadline and verifies
the filtered row, Published/Scheduled summaries, view totals and View live action
advance together. `tests/public/posts-publication-clock.test.ts` separately
renders the real manager with deliberately conflicting system/shared clock values.
