# Live upload validation options

While preparing shared-component lint coverage, missing callback dependencies
revealed a behavioral bug. ImageUpload's uploadFile/prepareFile callbacks captured
validateFile but did not depend on it. With stable onChange and other callback
props, changing maxSizeBytes/maxSizeLabel could keep the previous limit/message.

The isolated upload fixture now holds onChange stable and changes the two limit
props. Its new browser test failed before the fix with "Changed size limit was
ignored by a stale upload callback". Stabilize validateFile with useCallback over
the limit and label, and include it in both callers' dependency lists. No upload
types, crop rules, transport, locking or server limits change.

The browser test now passes: a tightened limit rejects before transport, a new
label appears, and a relaxed limit uploads once. Existing Chromium native-drop
test passed with trusted drag/drop events prevented while pending and one upload
call. Seventeen MDX/autosave regression tests passed; lint and whitespace checks
passed. Fixture transport is a deferred local mock, never Cloudinary/API writes.
Build result follows below. This fix is committed separately from lint rollout.

Production build passed with 38/38 pages. No dependencies changed. Review:
explicit callback lifetime fixes stale props while preserving upload locks and
crop/transport boundaries; no extra request or event listener. Self-evaluation:
accuracy 4/5 (failure-before/pass-after; local transport), completeness 4/5 (client
limit lifetime fixed, server unchanged), clarity 4/5 (three dependency changes),
actionability 4/5 (reproducible browser fixture), conciseness 4/5 (reuse validateFile).
