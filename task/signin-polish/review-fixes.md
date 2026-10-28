# Auth review follow-up

All three reported findings matched the current implementation.

- Add a mounted pageshow listener to reset lock/pending only for persisted page
  restoration, with listener removal on unmount. Normal pageshow keeps an active
  authentication request locked.
- Scroll the submit button into view before auth-sky's elementFromPoint hit test,
  including the short 844x390 viewport.
- Set OWNER_EMAIL in beforeEach and clear mock calls before every server-page
  test, preserving suite cleanup. The malicious-callback test reproduced the
  failure in isolation before the fix and passed afterward.

Verification: the three server-redirect tests passed together and shuffled
(seed 19), and the malicious-callback test passed alone. TypeScript, targeted
Biome lint and diff whitespace checks passed. Sign-in browser checks passed
including a mocked successful GitHub response that retains the pending state,
pageshow persisted false/true, enabled controls after restoration and a fresh
provider attempt. No actual GitHub navigation or real bfcache traversal was
performed: the regression dispatches PageTransitionEvent to exercise the handler.
Auth-sky passed six viewports including 844x390 after scrolling, plus its existing
background, lifecycle and palette checks. No real credentials or email used.

The browser and the temporary dev server started for this follow-up were closed
after verification. No commit, push, migration, or unrelated code changes.

Self-review: accuracy 4/5 (runtime proof, synthetic persisted event), completeness
4/5 (all review items covered; physical browser-history restore not exercised),
clarity 5/5 (narrow changes and regression), actionability 5/5 (working local fixes),
conciseness 4/5 (evidence archived here). Future check: real cross-origin OAuth
back navigation in a dedicated provider test environment.
