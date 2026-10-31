# Runtime audit fixes

## Autosave during publication

Blank autosaves now require DRAFT status in the UPDATE predicate itself. This
closes the gap between the earlier status read and the write without changing
nonblank autosaves or explicit publishing. If publication wins that race, the
failed update throws inside the transaction and rolls back tag/screenshot edits.

Two deterministic PGlite regressions failed before the fix. Afterward all 34
editor-autosave, project batch-publication and management tests passed. The tests
publish a valid draft immediately before the autosave transaction, then verify
published content and its tags/screenshots remain intact. TypeScript passed.
No external database or CMS data changed. Known low deepmerge advisory unchanged.
