# Public module imports

Replaced barrel imports in the redesigned routes and their presentation helpers
with direct imports. The common index pulled navigation/effects and other page
sections into route module evaluation; the collections also imported unrelated
detail readers. The change is limited to import paths and preserves markup and
contracts. TypeScript passed, and the complete Vitest suite passed 157/157 across
21 files with one worker (50.27s). Before this change, the same one-worker run
timed out in the Projects and Blog import tests. No test timeout was increased.
