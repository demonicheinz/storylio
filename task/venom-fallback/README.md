# Venom CSS fallback preview

Visual direction: keep the existing pill, Satoshi 14px/500, 44px minimum height,
project planet palette and orbit rim. Add a broad static top reflection, bevel
edge, faint continuous perimeter and darker lower edge. Hover/focus strengthen
the perimeter without resizing/tilting. Reduced motion keeps the rim static.

Screenshots at 1440/390/320px were produced by tests/browser/venom-fallback.js
against the real-renderer fixture with reduced motion. The fixture serves the
actual project font and tokens. They verify fallback material only, not hero
layout. Keyboard focus and native anchor activation passed at each width.

The actual renderer still hides the CSS material only when ready. Its GPU loss/
restore test passed after the enhancement, including deliberately broken restored
shaders: the label stayed readable and all three programs were disposed.
