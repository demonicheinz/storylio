# Dashboard Home browser fixture

From the repository root:

```powershell
bun tests/fixtures/dashboard-home/serve.mjs
```

Then in another terminal:

```powershell
bunx --no-install playwright-cli -s=home-polish open http://127.0.0.1:3199 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=home-polish run-code --filename=tests/browser/dashboard-home.js
bunx --no-install playwright-cli -s=home-polish close
```

Stop the fixture server with Ctrl+C. It binds only to loopback and prints its PID.
It builds the real Home component, shared controls, sortable list, ImageUpload and
CSS Modules. Next navigation/image boundaries and server actions are local fakes.
SVG assets are bundled as data URLs; upload is disabled. No credentials, database,
email or remote storage is needed. The records are visibly labeled example data.

The fixture supports successful/failed/thrown/deferred action responses. Its
`/previous` route simulates SPA popstate unmount/remount to verify session-draft
recovery across Back/Forward without a full document unload.
