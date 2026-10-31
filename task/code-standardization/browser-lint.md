# Bounded browser-script lint

Enable four positive entries: Settings, Analytics, GravityStars lifecycle and
Venom context recovery. The remaining 88 browser scripts and fixture sources
remain outside this increment; their diagnostics are not suppressed globally.

The Settings driver assigned confirmation text to the unbound `prompt` name.
Use a local `confirmationText`, preserving the same visible-text assertions.
Analytics names its viewport helper `assertFitsViewport`, avoiding the `fit`
focused-test heuristic. Callback braces and split WebGL instrumentation assignment
remove lint findings without changing the observed values.

Entry-point declarations have a local unused-variable explanation: Playwright CLI
invokes them as function expressions. Settings retains Locator.innerText() with a
local explanation because this is Playwright's visible-text API, not a DOM
innerText property read. No test expectation or application source changed.

## Verification

- Settings and Analytics Chromium suites passed at 1440/1024/768/390/360/320px.
- Star lifecycle passed blur/resume, reduced motion, offscreen pause, unmount,
  late callback and StrictMode remount checks.
- Native GPU recovery passed two loss/restore cycles, paused restore, full label,
  single rebuild, cursor cleanup and failed-shader fallback/disposal.
- The first concurrent GPU run timed out before ready; its isolated rerun passed.
  This does not establish the cause of that initial timeout or eliminate flakiness.
- New screenshots are local diagnostics under `.tmp/test-lint/screenshots`;
  previous tracked review images are restored unchanged.
- Repository lint passed; the preceding Vitest batch passed 104 files / 795 tests
  and the commit hook generated route types and passed TypeScript.
- Ordinary lint now selects 511 source/test/script files with zero diagnostics.

Review: no removed checks, no changed production behavior, no global rule disable.
Self-evaluation: accuracy 4/5 (real fixture passes; initial GPU timeout recorded),
completeness 4/5 (four scripts only; backlog explicit), clarity 4/5 (CLI entry
contract documented locally), actionability 4/5 (ordinary lint enforces scope),
conciseness 4/5 (local names/blocks, no test framework replacement). Overall 4.0/5.

## CLI entry-point follow-up

Another 33 scripts enter positive lint coverage: four had no diagnostics, and
29 only needed the statement-local entry-point explanation. No function bodies,
assertions, locators, URLs or timers changed. All 33 still parse as the CLI's
function expression. TypeScript compilation with comments removed produces
byte-identical output to HEAD for every entry. Lint now selects 544 files without
diagnostics. No repeated full suite/build/browser run is claimed for comment-only
changes. This reduces the browser backlog to 55 scripts; fixtures remain pending.

## Locator API and literal-fixture follow-up

Ten additional scripts retain Playwright Locator.innerText(), whose method calls
were flagged by a DOM-property performance rule. Local explanations preserve
visible-label assertions and normalization; converting them to nullable raw text
would change test semantics. The MDX source fixture deliberately keeps literal
JavaScript interpolation. Only comments/configuration changed, all ten CLI entry
points parse and their comment-free compiled output is byte-identical to HEAD.
Lint now selects 554 files without diagnostics. Browser backlog: 45 scripts;
fixture lint is separate. No new browser rerun is claimed for these comments.

## Template-only follow-up

Twenty-six scripts with only useTemplate findings now use interpolation for URL
paths, screenshot paths and diagnostic strings. The conversion preserves literal
segments and interpolation expressions in order. A TypeScript AST comparison
normalizes concatenation/template forms and verifies all other statements,
operators, locators and assertions stay unchanged; all entry points parse as CLI
function expressions. Reviewed operands are primitive strings/numbers (including
JSON.stringify results), not objects with differing coercion hooks. This is not
a claim of byte-identical transpilation or a fresh end-to-end run of these old
scenarios. Lint is clean with 580 selected files; 19 browser scripts remain.
Existing formatter exceptions keep CLI expression syntax intact. No production
source/dependency update and no repeated full suite/build for string-only changes.
