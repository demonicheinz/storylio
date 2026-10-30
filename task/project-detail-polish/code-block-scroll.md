# Shared MDX code blocks — 2026-10-27

Requested: 12px corners and desktop Shift + wheel support while retaining native
horizontal gestures and ordinary page scrolling. Applies wherever renderMDX is
used, including public project case studies and Blog, without changing saved code.

The pre renderer now uses a small client CodeBlock wrapper. Highlighted children
are still rendered by the existing server MDX pipeline. The frame uses rounded-lg
(12px). The pre element opts out of Lenis wheel interception, and explicitly
allows vertical overscroll chaining: Lenis's default CSS otherwise applies
overscroll-behavior:contain to data-lenis-prevent-wheel elements.

A non-passive, component-scoped wheel listener converts Shift + vertical delta
to horizontal scroll only when code actually overflows and the event is
cancelable. Already-horizontal events remain native. Ctrl/Meta zoom gestures
and non-overflowing code are left alone. Pixel, line, and page delta modes are
handled; the listener is removed on unmount. The explicit vertical auto style
allows ordinary wheel to scroll the page from inside the code block.

Evidence:

- The browser regression initially timed out on Shift scrolling. Native-only
  opt-out passed Shift/horizontal gestures but exposed blocked ordinary wheel.
  Explicit vertical overscroll chaining resolved the remaining failure.
- tests/browser/code-block-scroll.js passes in Chromium at 1440px with Lenis
  active and with reduced motion. Shift wheel moves code without moving the
  page; native horizontal wheel does likewise; ordinary wheel moves the page
  without changing horizontal position. Computed radius is 12px.
- The same check verifies reverse line-mode delta, preserved Ctrl zoom modifier,
  and no interception for short code. Long lines are browser-only fixtures;
  nothing is written to the CMS. Actual touch hardware and other engines were
  not exercised.
- Lint passes (395 files), standalone TypeScript passes, and production build
  passes TypeScript and all 36 generated routes. Targeted route-shell and shared
  scroll tests pass (23 tests, two files). Full suite was not repeated for this
  scope; its preceding 214-test result belongs to the earlier detail work.
- One mechanical detector run returned no findings. Whitespace check passed.
- No commit or push. Browser session closed; existing app servers left running.

Self-evaluation: accuracy 5 (actual wheel events verified), completeness 4
(Chromium only; no touch hardware), clarity 5 (native behavior versus fallback
is explicit), actionability 5 (implemented and reproducible browser check),
conciseness 4 (diagnostics archived here). Average 4.6/5. Future improvement:
validate physical mouse/trackpad behavior in another browser if platform-specific
feedback appears.
