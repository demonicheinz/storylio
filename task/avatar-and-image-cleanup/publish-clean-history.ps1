param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../..')).Path
$audit = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'history-audit.json') -Raw | ConvertFrom-Json
$cleanMirror = Join-Path $projectRoot '.tmp/avatar-and-image-cleanup/remote-clean.git'

if (-not (Test-Path -LiteralPath $cleanMirror)) {
  throw 'The reviewed local mirror is missing. Rebuild and review the audit before publishing.'
}

$bare = & git -C $cleanMirror rev-parse --is-bare-repository
if ($LASTEXITCODE -ne 0 -or $bare -ne 'true') { throw 'Expected the isolated bare mirror.' }

$reachable = & git -C $cleanMirror rev-list --objects --all
if ($LASTEXITCODE -ne 0) { throw 'Could not verify the cleaned mirror.' }
if ($reachable -match 'public/images/heinz\.jpg|2217f18d64edd7acbb6188fd0e32179f7cbf9724') {
  throw 'The portrait is still reachable. Do not publish.'
}

foreach ($branch in $audit.branches) {
  $tip = & git -C $cleanMirror rev-parse $branch.ref
  if ($LASTEXITCODE -ne 0 -or $tip -ne $branch.after) { throw "Unreviewed tip: $($branch.ref)" }
  Write-Output "$($branch.ref): $($branch.before) -> $($branch.after)"
}

if (-not $Apply) {
  Write-Output 'Review only. No GitHub refs were changed. Publishing requires explicit approval and -Apply.'
  return
}

$pushArgs = @('-C', $cleanMirror, 'push', '--atomic')
foreach ($branch in $audit.branches) {
  $pushArgs += "--force-with-lease=$($branch.ref):$($branch.before)"
}
$pushArgs += $audit.remote
foreach ($branch in $audit.branches) {
  $pushArgs += "$($branch.after):$($branch.ref)"
}
& git @pushArgs
if ($LASTEXITCODE -ne 0) { throw 'Publishing failed. If a branch advanced or is protected, review again; do not bypass it.' }
Write-Output 'The three branch refs were updated atomically. GitHub PR refs and existing clones still require cleanup.'
