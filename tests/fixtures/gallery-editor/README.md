# Gallery editor fixture

Run `node tests/fixtures/gallery-editor/serve.mjs`, then in a separate terminal:

```powershell
bunx --no-install playwright-cli -s=gallery-editor open http://127.0.0.1:3207 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=gallery-editor run-code --filename=tests/browser/gallery-editor.js
bunx --no-install playwright-cli -s=gallery-editor close
```

Stop the fixture server afterward. Uses the actual editor, uploader, shared CSS,
local fonts, and synthetic local image. Save actions, upload utility and router
are replaced at bundle time. No auth, CMS, database, secrets or external requests.
The browser suite blocks requests outside the fixture origin.
