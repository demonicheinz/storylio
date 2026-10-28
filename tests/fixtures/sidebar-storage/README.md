Run from the repository root (no environment, authentication, or database needed):

```powershell
bun tests/fixtures/sidebar-storage/serve.mjs
```

The fixture bundles the real dashboard provider, SidebarProvider, useSidebar,
SidebarTrigger, and their UI dependencies in memory with the installed esbuild.
Only CSS module imports are stubbed; native matchMedia and storage APIs run in
Chromium. Storage failures are injected for the sidebar key only.

In a second terminal:

```powershell
bunx --no-install playwright-cli -s=sidebar-storage open http://127.0.0.1:3198 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=sidebar-storage run-code --filename=tests/browser/sidebar-storage.js
bunx --no-install playwright-cli -s=sidebar-storage close
```

Stop the fixture with Ctrl+C in its terminal. It binds only to loopback port
3198 and prints its PID; if terminal interruption is unavailable, use
`Stop-Process -Id <printed-PID>` for that fixture process only.

Checks cover blocked reads, blocked writes, both blocked, absent/invalid/empty
preferences, both valid persisted choices, manual toggles, viewport changes,
and initialization/storage call counts. Reload checks retain the browser's
stored manual choice by removing the seed query before navigation.
