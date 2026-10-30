# Biome save and review fixes

Investigated 2026-10-29. Updated project Biome 2.5.0 to 2.6.4 through a targeted
Bun update; package and platform binary lockfile changes are limited to Biome.
Configuration was migrated with the installed CLI. No commit was performed.

## Save investigation

`bun run format` invokes `biome check --write`, which includes safe lint/assist
fixes as well as formatting. Workspace explicit Save also applies
source.fixAll.biome and organizeImports. Global settings use Biome as the
default formatter and enable save-on-focus-change.

The nullable-publication guard had again become an unconditional return in the
working file. It was restored. Isolated stdin formatting/lint/save probes,
targeted file writes, and the exact full-project format command preserved the
corrected guard under both 2.5.0 and 2.6.4. The original deletion of source text
was not reproduced. Do not claim that the version update proves its root cause
or guarantees the editor problem is fixed.

The actual VS Code logs separately show a rangeFormatting position outside the
document, temporary-binary EBUSY reuse, restarts and stale-client notifications.
The project CLI and current copied Storylio binary both report 2.6.4. CLI rage
loads the config successfully and lint is clean; this distinguishes an editor
session issue from a reproducible CLI formatter failure.

The extension's Biome: Restart command clears its session cache and stops/starts
instances. It is the next manual recovery action. The agent did not invoke a
VS Code UI command, terminate VS Code, kill unrelated daemon processes or modify
global user settings. Recovery in the real editor still requires verification
after that command. No assumption is made that two installed extension-version
folders mean two active extensions.

## Configuration

- Schema points to the installed package's configuration_schema.json because
  the migrated public 2.6.4 schema URL returned 404 in the user's editor.
- Markdown formatting remains disabled, matching the existing language-specific
  editor policy and preventing a mass document reformat when 2.6 recognizes it.
- YAML uses the already installed Red Hat YAML formatter in workspace settings;
  Biome on-save actions are disabled only for YAML. The observed error concerned
  unsupported YAML rangeFormatting. Other language behavior remains configured.
- The new formatter normalized 24 code/test files. Review their formatting-only
  changes when committing the tooling upgrade; existing feature changes are
  preserved. The user's .infisical.yaml edit is separate and was not inspected
  for content or intentionally changed by this work.

## Media review fixes

- Rename now calls the catching revalidateMedia helper after committing, so a
  revalidation failure does not falsely report a failed rename.
- Upload returns stored normalized width, height and aspectRatio, matching the
  transport validator. Zero/omitted provider dimensions return explicit null
  instead of an invalid or omitted value after the row was already saved.
- Four regressions failed before the two fixes and pass afterward: rename
  revalidation plus three zero/omitted dimension combinations.

## Verification

59 targeted tests passed after the update across media safety, upload safety,
post sorting and upload transport. TypeScript and full repository lint passed.
Full format is idempotent and the nullable-date guard remains present afterward.
Editor settings and local schema check passed. Tests use PGlite and mocks; no
real provider upload/deletion or external database mutation was performed.

Accuracy4/5: actual CLI and log evidence; original text loss and editor recovery
are unconfirmed. Completeness4/5: requested update/config/review fixes complete;
restart must be performed in the editor. Clarity4/5: distinguishes CLI, schema,
YAML routing and stale LSP states. Actionability4/5: concrete restart command,
local schema and regressions. Conciseness4/5: local diagnostics stay in ignored
.tmp; this report preserves the conclusions. Overall4.0/5.
