# Sidebar alignment fixture

Uses the real dashboard sidebar, provider, shared controls, and project CSS.
Navigation, session data, and Next image/link wrappers are replaced locally;
no credentials or database access are needed.

From the repository root, start the fixture:

```powershell
bun tests/fixtures/sidebar-layout/serve.mjs
```

In another terminal:

```powershell
bunx --no-install playwright-cli -s=sidebar-layout open http://127.0.0.1:3195 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=sidebar-layout run-code --filename=tests/browser/sidebar-layout.js
bunx --no-install playwright-cli -s=sidebar-layout run-code --filename=tests/browser/sidebar-mobile.js
bunx --no-install playwright-cli -s=sidebar-layout run-code --filename=tests/browser/sidebar-motion.js
bunx --no-install playwright-cli -s=sidebar-layout close
```

Checks collapsed logo, menu, and account centering, 44px targets, and reopening
at 1440, 1024, and 768px. Screenshots go to `task/sidebar-alignment/`.
Stop the fixture with Ctrl+C when done. This checks component layout, not
authenticated application navigation.
