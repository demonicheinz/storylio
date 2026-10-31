# WebGL lifecycle fixture

From the repository root, run `bun tests/fixtures/webgl-lifecycle/serve.mjs`.
The loopback server uses port 3212. It renders actual GooeyNav and LiveOrb in
React StrictMode with project tokens/CSS and synthetic button navigation only.
It does not use Next routing, authentication, a database or remote assets.

```powershell
bunx --no-install playwright-cli -s=webgl-audit open http://127.0.0.1:3212 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=webgl-audit run-code --filename=tests/browser/webgl-lifecycle.js
bunx --no-install playwright-cli -s=webgl-audit close
```

Stop the server with Ctrl+C. Tests instrument the page's real WebGL calls and
allocation/deletion, RAF scheduling, observers and selected listener types.
They exercise blur/focus, real WEBGL_lose_context loss/restoration, motion preference
changes, offscreen observation, repeated unmount/remount, disabled GL and failed
buffer allocation. Observer counts exclude Playwright's InjectedScript observer;
engine listeners/observers must reach zero. Focus/visibility transitions are
synthetic where dispatched by the test, not an OS window-manager integration test.

`?fault=no-gl` and `?fault=buffer` are interpreted by test instrumentation, not
production components. `?still` disables Orb pointer interaction in this fixture
for deterministic screenshot comparisons. Controls permit unmount/remount/theme
changes. The optional `--baseline` server uses port 3213 and loads engine source
snapshots from ignored `.tmp/webgl-lifecycle/baseline/{gooey-nav,live-orb}.tsx`.
Create those from the intended Git revision before starting that comparison;
the fixture never changes or checks out production source files.
