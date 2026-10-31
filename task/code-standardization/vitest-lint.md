# Vitest lint coverage

Positive lint coverage now includes `tests/**/*.test.ts`: 104 test files plus
three already-covered helpers. Initial diagnostics: 13 errors, 31 warnings,
23 informational style findings. Final targeted lint has no diagnostics; combined positive coverage selects 507 files.

Required query rows, reset links, OAuth state, generated JWK coordinates,
rendered controls and mocked callbacks now use Vitest runtime assertions rather
than erased non-null assertions. A missing fixture fails explicitly; no optional
fallback silently skips the tested action. Templates and a HAST import alias
remove style/name findings without changing request URLs or expected values.

Local exceptions retain deliberate Markdown JavaScript literals, the mock query
builder thenable, and conditional test hook dispatchers. Production hook rules
remain enabled. The mocked button has an explicit button type, preserving
caller-supplied types. No application source or runtime dependencies changed.

## Verification

- Repository Biome check passed (929 formatter/assist files).
- TypeScript passed.
- Full Vitest run: 104 files / 795 tests passed (355 seconds).
- Mutation: deferring the background-task catch again fails its timing regression;
  production source was restored byte-for-byte afterward.
- Test declarations preserved across every changed test file.
- `bun audit` still reports the known low deepmerge advisory through shadcn;
  this batch changes no dependencies and does not suppress it.
- Production build/browser rendering are unchanged; no new build is claimed.

## Review and self-evaluation

Five-axis source review found no changed test intent or production behavior.
Local exception scope is limited to deliberate test constructs, not entire files.
Accuracy 4/5: suite/types/lint/mutation verified; browser scripts remain a separate
batch. Completeness 4/5: Vitest covered, browser/fixture lint pending. Clarity 4/5:
required fixture assumptions fail explicitly; mock dispatchers still need local
comments. Actionability 4/5: ordinary lint now enforces this scope; low upstream
advisory remains tracked. Conciseness 4/5: existing assertions reused, no new
fixture abstraction. Overall 4.0/5. Next: bounded browser-script coverage.
