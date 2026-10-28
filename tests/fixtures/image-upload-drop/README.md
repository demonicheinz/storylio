# Chromium native drop regression

Run from the repository root:

```powershell
New-Item -ItemType Directory -Force .tmp/image-drop-review | Out-Null
$fixturePng = [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1sAAAAASUVORK5CYII=')
[IO.File]::WriteAllBytes((Join-Path (Get-Location) '.tmp/image-drop-review/first.png'), $fixturePng)
[IO.File]::WriteAllBytes((Join-Path (Get-Location) '.tmp/image-drop-review/second.png'), $fixturePng)
bun tests/fixtures/image-upload-drop/serve.mjs
```

In a second terminal:

```powershell
bunx --no-install playwright-cli -s=upload-drop-review open http://127.0.0.1:3196 --config=playwright-cli.config.json
bunx --no-install playwright-cli -s=upload-drop-review run-code --filename=tests/browser/image-upload-drop.js
bunx --no-install playwright-cli -s=upload-drop-review close
```

Stop the fixture with Ctrl+C. The server bundles the real ImageUpload component,
replaces its upload transport with a deferred local promise, and binds only to
loopback. It never sends files to Cloudinary or the application API.

The browser test uses CDP Input.dispatchDragEvent with real temporary file paths,
not a synthetic DOM dispatchEvent. It verifies trusted drop events are prevented,
the tab URL remains stable and only one upload starts while the first is pending.
The fixture has minimal presentation styling; this is a behavioral regression,
not a visual snapshot.
