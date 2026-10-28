# Markdown source workflow

The editor previously provided a rich-text surface with no source entry point.
Pasting a complete Markdown document into that surface could preserve the
syntax as visible text rather than import Markdown structure. Fenced braces
are accepted by the server validator; unfenced incomplete expressions are not.

Added the installed editor's `diffSourcePlugin` and a Rich text / Source mode
switch to both toolbar variants. The reusable smoke document is available at
`tests/fixtures/mdx/markdown-smoke.md`. Paste its contents into Source mode,
then switch to Rich text. The template covers headings, formatting, checklists,
links, images, tables, JavaScript/Python/plain code and admonitions.

The wrapper radius now follows `rounded-lg` (12px). Full field errors appear
only below the editor; the language summary names affected fields. Local import
errors preserve the source and explain how to recover. The library's duplicate
parse banner is suppressed in favor of that accessible message.

During browser verification, toggling MDXEditor `readOnly` during a save rebuilt
CodeMirror from older parsed Markdown and lost the current source buffer. The
wrapper now uses `inert` and `aria-busy` while saving to prevent interaction
without rebuilding the source editor. The regression test verifies that a
rejected save preserves the invalid input.

No executable MDX/HTML restrictions were relaxed. Use `==highlight==`, fenced
code, and escaped literal braces; imports, JSX and raw HTML remain rejected.
Frontmatter is not imported as CMS metadata. Existing literal Markdown already
pasted into rich text is not automatically rewritten: paste the original
document into Source mode to import it correctly.

Verification: 398 tests across 62 files passed; source-mode Chromium checks
passed for import, structured output, save with actual safety validation,
duplicate-error prevention and recovery. Lint and TypeScript passed. Browser
fixture actions do not write CMS records.

Follow-up: rich-text serialization now escapes opening braces in text nodes
using the Markdown serializer's `unsafe` option scoped to phrasing. Escaped
literal braces remain text after editing instead of becoming MDX expressions.
Inline and fenced code are unaffected. Ten targeted parser/serializer tests and
the browser source-import → rich-text-edit → real validation/save check pass.
Raw Source input still undergoes the same security validation.

The two language-control labels now share the same 12px muted style and align
at the top. The tab group and public-language select both measure 52px outside
(44px tab hit area plus its 4px top/bottom wrapper); this is verified at 1440,
390 and 320px without horizontal overflow.
