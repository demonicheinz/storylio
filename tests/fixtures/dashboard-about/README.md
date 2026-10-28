# Dashboard About fixture

The real Content form, rich-text editor, structured managers, dialog/select
controls and sortable lists run with the project CSS and fonts. Fixture-only
server action replacements record submitted values; no database, session or
email credentials are used. Dialog confirmation responses and reorder failures
are deterministic in the browser check.

Start from the repository root:

```powershell
bun tests/fixtures/dashboard-about/serve.mjs
```

In another terminal:

```powershell
bunx --no-install playwright-cli -s=dashboard-about open http://127.0.0.1:3196 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=dashboard-about run-code --filename=tests/browser/dashboard-about.js
bunx --no-install playwright-cli -s=dashboard-about run-code --filename=tests/browser/about-highlight-keys.js
bunx --no-install playwright-cli -s=dashboard-about run-code --filename=tests/browser/mdx-source.js
bunx --no-install playwright-cli -s=dashboard-about close
```

Checks bilingual draft lifetime, save/discard, rich-text restoration, skill
category selection, dirty-dialog cancellation, keyboard reorder rollback and
horizontal overflow at 1440/768/360/320px. Screenshots are stored under
`task/dashboard-about-review/`. The fixture does not emulate persisted route
refreshes; real mutation behavior is covered by PGlite integration tests.

The highlight-key check renders the actual public Experience component with
repeated achievement text, changes language three times, and checks that every
item remains rendered without duplicate-key console warnings. It reproduced
the `Highlight` warning before the fix.

Stop the server with Ctrl+C when finished.

The source-mode check imports `tests/fixtures/mdx/markdown-smoke.md`, switches
to formatted editing, and saves through a fixture endpoint that runs the real
`getMdxSafetyError` validator. It verifies fenced JavaScript braces survive,
invalid source remains recoverable after a rejected save, and full validation
messages are not duplicated in the language summary. No database is used.
