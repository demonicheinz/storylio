# Venom wrapper and automatic recovery

User authorized automatic recovery without entrance replay, retaining idle state
and fallback on failure. The subsequent request adds a more polished CSS fallback
in the existing project theme. Keep wrapper hardening, recovery behavior and
fallback styling in separately reviewable commits.

## Wrapper audit

An isolated StrictMode fixture reproduced an orphan canvas when createVenomScene
throws before the wrapper assigns its cleanup callback. Register canvas ownership
immediately after append; clear it through the existing stop path on throw/null.
Actual scene disposal stays with the renderer. The fault test failed before the
fix and passed afterward for thrown/null creation, ordinary mounting and late
asset preparation after unmount. TypeScript, lint and whitespace checks passed.
No renderer, shader, navigation, cursor or visual behavior changed in this step.
The mocked renderer establishes wrapper behavior only, not real GPU safety.
