# Gravity Stars lifecycle audit

The active starfield is used by public backgrounds, hero, auth and boundary UI.
The controller already pauses its position simulation, but drawStars used wall
time for twinkle. A same-size ResizeObserver redraw after pausing therefore changed
pixels. The new browser test reproduced that failure before the fix.

Use accumulated active animation time for twinkle, resetting the frame baseline
on resume as before. Position integrator, palette, density, sprite paint and
foreground twinkle rates are unchanged. Snapshot pause/redraw now stays pixel
identical. Read actual initial document focus instead of assuming it is focused.
Guard render/resize/settings/pointer APIs after destroy and make destroy idempotent;
queued resize work cannot recreate cleared canvas/sprite backing stores.

Browser checks passed stable paused pixels, blur freeze, one-loop focus resume,
live reduced motion, offscreen pause, observer/RAF cleanup, a late resize callback
and StrictMode remount. TypeScript and 27 route-shell/loading/image tests passed.
Lint selects 379 source files with zero diagnostics. Build result follows below.
The isolated fixture uses no real data. No new test was added that merely mirrors
the clock arithmetic; the regression checks the canvas result itself.

Review: ownership guards and active clock are local; no new timers, listeners,
network calls or animation algorithm rewrite. Self-evaluation: accuracy 4/5
(failure-before/canvas evidence; no hardware matrix), completeness 4/5 (active
starfield covered, unused effects handled separately), clarity 4/5 (clock and
disposed-state contracts explicit), actionability 4/5 (fixture commands retained),
conciseness 4/5 (one clock and local guards, no generic animation framework).

Final production build passed with 38/38 pages. Whitespace/lint passed. No push.
