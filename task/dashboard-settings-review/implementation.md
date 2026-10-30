# Settings implementation

Implemented 2026-10-30. No commit, push, schema change, real account operation,
credential change, provider call or CMS mutation was performed for verification.

## Changes

- Profile/Account/Security use a shared desktop rail and compact horizontal tabs
  when space is limited, with matching orientation semantics. The root remains controlled so pending MFA requests and
  incomplete security flows can block a tab change before its subtree unmounts.
- Passkey add/rename/delete inspect resolved errors and thrown requests before
  reporting success. Failures keep the dialog/value available with an associated
  inline error; list refresh errors do not relabel a committed write as failed.
  Mutation locks prevent duplicate requests. Unknown MFA state blocks addition;
  existing keys remain manageable, with the current MFA sign-in policy explained.
- Session failures have a persistent error/retry state, separate from empty data.
  Previous rows can remain with stale messaging. Request versions reject late
  responses after refresh or revocation. MFA changes invalidate the list, updating
  both rows and summary. Long user-agent/IPv6 text wraps; secondary session details
  use disclosures and actions wrap deliberately on mobile.
- MFA explains GitHub/passkey restrictions and other-session revocation before
  setup. Regeneration and disable require explicit confirmation. Incomplete setup
  or unsaved codes guard ordinary links/reloads and tab departure; pending actions
  block departure. Accepting departure unmounts and clears the local secret view;
  it does not pretend to undo server changes. Acknowledged completion clears codes.
- Successful MFA enable/disable is authoritative even if subsequent session
  refetch fails. A callback updates the parent summary, connections and passkey
  availability independently, and session-list refresh is separate from auth-hook
  refresh. Unknown/error session reads offer Retry instead of setup-as-disabled.
- Avatar editing is a visible Change photo dialog with the actual upload status,
  errors and crop flow. Remove photo restores the existing Live Orb fallback.
  Upload state blocks profile saving and discarding until settled. Dirty profile
  changes guard ordinary links/reload and remain across section tabs.
- Profile/account writes catch transport failures. Profile errors remain inline;
  email/password outcomes remain visible after the toast. Successful reset
  normalizes optional field blanks so a saved profile does not remain falsely
  dirty. Character limits/bio counter, semantic headings, field error IDs and
  non-field labels were corrected. Provider unlink updates local state without a
  manual refresh; GitHub linking checks returned errors and reflects MFA policy.
- Mobile save actions have a dedicated two-column layout in normal flow; desktop
  retains a sticky footer. Project fonts, navy/blue tokens and shared controls are
  retained. No shared UI primitive or authentication policy was changed.

## Desktop width feedback

The owner chose to restore desktop side navigation. The final layout uses a
176px rail when the Settings area has at least880px, increasing to192px at1120px,
with a32px gap and sticky navigation at80px. Narrow Settings areas use horizontal
tabs. A ResizeObserver measures the frame independently of its grid children,
keeping actual tab orientation semantics in sync with CSS container queries.
Drafts remain mounted when orientation changes; observation is cleaned up on exit.

Profile retains divider-separated photo, identity, bio, social and contact groups,
but headings/descriptions are now above fields at every width. The extra left
description column has been removed. Name/role use two columns only when the
panel itself has560px available. The avatar editor remains compact. Panels have
an880px maximum; individual form fields remain bounded to640px.

Account uses the same heading-above-control rhythm. The active sign-in email stays
visible; Change email/Change password disclosures reveal the existing forms.
Native details keeps their draft/pending state mounted when collapsed. Connected
accounts has one heading rather than a repeated nested label.

MFA, passkeys and sessions are stacked at all widths. The former2:1 method grid
has been removed to give each security task enough space beside the rail.

Latest layout verification:58targeted tests, TypeScript, repository lint and the
production build passed. The browser regression passed at1440/1024/768/390/360/
320px, including collapsed account forms, draft retention across disclosure
toggles, desktop stacked method panels, retained profile drafts through live
rail-to-horizontal resizing and the existing security/upload flows.
Screenshots and implementation-browser.json reflect this final layout. The full
660-test run above predates this layout-only follow-up and was not repeated.

## Verification

### Review follow-up: provider remount and artifact privacy

Confirmed the provider bug in the unchanged source-derived browser fixture:
unlink GitHub, leave Account and return restored the row from the original server
prop. ConnectedProviders now receives a controlled list filtered by successful
unlink IDs retained in SettingsManager. It no longer initializes a local copy on
every tab mount. The callback runs only after successful unlink, and remains valid
if the request completes after Account unmounts. This avoids relying on a server
refresh finishing before the next tab mount; other server-provided accounts still
flow through normally.

The permanent browser suite now checks successful unlink across tab remounts,
failed unlink retaining the provider, and success arriving while Account is
unmounted. It also checks that tab switches do not repeat unlink. A narrow browser
reproduction failed before the change and passed afterward. The expanded suite
passed at1440/1024/768/390/360/320px; TypeScript, repository lint and whitespace
checks passed. No real provider/account was modified and no full-suite/build
rerun is claimed for this contained state-ownership fix.

Workstation-specific paths in detector.json, detector.txt and assessment-b.md
were replaced with <home>/<repo> placeholders; cwd is repository-relative.
The Settings artifact directory was scanned for drive-root paths and the former
OS username, with no matches remaining. Captured-output provenance now explicitly
states that paths are sanitized. Detector availability is still recorded as
unavailable, not a clean result. No Git history was rewritten or committed.

### Follow-up: actions, account identity, MFA and sign-out

- Add Passkey and Revoke Other Sessions now belong to their own section headers,
  right-aligned beside the title on desktop and wrapping below on mobile. The
  components own the complete Card so action state is not duplicated in a parent.
- Current sign-in email has an explicit label, visible value and scope guidance
  distinguishing it from public contact email. The password meter renders only
  after typing, uses semantic success/warning/error tokens, and never calls a
  password below the minimum length strong merely for including character types.
- MFA takes its stepwise setup and recovery-code presentation from read-only
  Imposia references: `src/components/auth/two-factor-form.tsx`, its setup route,
  and `src/components/core/animated-otp.tsx`. Idle state is compact; password
  confirmation appears on demand. Setup separates scan and verify steps, provides
  a manual key and awaited Copy with a manual-selection fallback, then requires
  backup-code acknowledgement. Previous guards, confirmations and committed-result
  handling are retained.
- Both login TOTP and Settings setup use the shared `OtpInput`, adapting Imposia's
  grouped3–3 slots through its `input-otp` library (1.5.0). One real input handles
  keyboard selection, mobile one-time-code autofill and normalized paste; six
  visual slots mirror it. Digit motion/caret blinking respect reduced motion,
  error text is associated with the field and invalid styling reaches the slots.
  Backup-code login remains an ordinary text input.
- Sign-in loader regression was reproduced with actual React Activity and mocked
  routing/auth: redirect pending/lock survived page hiding and SPA restoration,
  where pageshow did not run. Layout-effect cleanup now clears transient state,
  and a lifecycle generation rejects late responses. Logout checks returned and
  thrown errors, prevents duplicate requests and creates a fresh sign-in document
  after success, discarding authenticated route cache. See
  [auth reproduction](../auth-loader-regression/report.md);13isolated browser
  scenarios passed without real accounts or WebAuthn.
- Final follow-up checks: **87files/670Vitest tests passed**, repository lint
  passed, TypeScript passed, production build passed with38static pages, and the
  Settings/login-TOTP fixture browser suite passed at1440/1024/768/390/360/320px.
  The production auth route was not exercised with real credentials; the auth
  navigation fixture validates client lifecycle, not full Next cookie/RSC behavior.
- After explicit approval, Delete passkey uses the shared destructive variant
  and a native confirmation naming the key and explaining re-registration.
  Revoke Other Sessions uses destructive styling and the shared AlertDialog with
  the currently listed other-session count and an explicit current-browser exception.
  Per-session revoke uses a quiet ghost button with destructive text/icon and no
  extra confirmation, while Rename and Add Passkey stay neutral. All retain text
  labels and44px targets. Cancel returns before API/refetch/toast side effects.
- Destructive follow-up:26targeted tests passed, TypeScript and repository lint
  passed, and the expanded browser fixture passed at1440–320px. It verifies named
  deletion cancellation/acceptance, bulk-count cancellation/acceptance, retained
  current session and individual revoke. The full670-test/build results above
  predate this small follow-up; they were not unnecessarily repeated. No real
  security setting or account operation was performed.

### Final UI refinement

Bulk session confirmation now uses the project's AlertDialog instead of native
window.confirm. It keeps errors inside the dialog for retry, prevents dismissal
while the request is pending, closes only after success and explicitly restores
focus to the header button on Cancel/success. Count text follows the currently
loaded session list. Native delete-passkey and MFA consequence confirmations are
unchanged; only bulk-session confirmation was requested in this refinement.

TwoFactorSettings now owns its complete Card, allowing Set up/Manage two-factor
to sit at the right of the header like passkeys and sessions. The action is hidden
while its confirmation/setup/recovery stage is open, avoiding duplicate action
labels; the existing flow guards and secret handling remain intact.

The login authenticator label is visually hidden with sr-only and retains its
association with the real OTP input. Slots are centered under the auth heading.
The duplicate Paste or enter helper was removed; the heading description already
explains the six-digit code. Error association remains through verification-error.

Latest scoped verification:53tests passed, TypeScript and repository lint passed,
and the browser suite passed at1440/1024/768/390/360/320px. It additionally checks
header action placement, centered OTP/no visible duplicate labels, native label
accessibility, dialog Cancel focus restoration, no API on Cancel, inline failure
and retry, disabled dismissal during pending, and preserved current session.
No build/full-suite rerun is claimed for this small UI refinement. New capture:
[Session confirmation](updated-session-confirm-320.png). No real accounts changed.

New evidence: [Login TOTP](updated-login-totp-320.png),
[MFA setup](updated-mfa-setup-320.png), [Backup codes](updated-mfa-codes-320.png).

- Full Vitest: **86files/660tests passed** during implementation.
- Subsequent targeted runs: **58tests passed** for security/MFA/route shell;
  **41tests passed** after removing the duplicate session heading. The browser
  regression verifies the final optional-blank reset and upload/save behavior.
- Production build passed: Next16.4.2,38static pages, Settings remains partially
  prerendered. A final standalone TypeScript check and repository lint validate
  the final files after the small form-baseline/presentation fixes.
- `git diff --check` passed. The Impeccable detector remains unavailable because
  engine0.1.18 is absent and its global cache is unwritable; no clean-scan claim.
- Browser fixture passed at1440/1024/768/390/360/320px, all three tabs, no page
  errors or horizontal body overflow. Checks cover labels/headings, profile draft
  retention, transport failure/retry, upload/save coordination, resolved passkey
  errors, session retry, pending-MFA departure, code acknowledgement/departure,
  MFA-driven session invalidation, regeneration cancellation, unknown auth state.
- `tests/browser/auth-recovery-mfa.js` now accepts the new confirmation prompts
  for its mocked regenerate/disable scenarios; that separate full auth-browser
  workflow was not rerun. No real WebAuthn, screen-reader speech, real provider
  failures, browser-history traversal guard or complete dashboard shell is claimed.

The first browser fixture used a relative avatar URL rejected by the real profile
schema; it was corrected to an absolute local URL. Other harness corrections were
waiting inside the modal for upload progress and selecting dialog-content rather
than toast dialogs. The upload response is held locally; no image is uploaded to
a real service. A genuine dirty-baseline issue found during retry was fixed by
normalizing optional blanks after successful saves.

Tests/fixtures and mocks are committed candidates under
`tests/fixtures/dashboard-settings/`; diagnostics stay ignored in
`.tmp/settings-review/`. The fixture/server and isolated browser session are
stopped after verification. Original assessment artifacts remain historical.

## Visual evidence

- [Desktop Profile](updated-profile-1440.png)
- [Mobile Profile](updated-profile-320.png)
- [Desktop Security](updated-security-1440.png)
- [Mobile Security](updated-security-320.png)
- [Desktop Account](updated-account-1440.png)
- [Mobile Account](updated-account-320.png)
- [Browser result](implementation-browser.json)

## Self-evaluation

Accuracy4/5: real component browser flows and mocked security contracts verified;
real auth hardware and assistive speech remain untested. Completeness4/5: approved
horizontal tabs and security/error scope implemented; approved task-specific
desktop layout also implemented. Clarity4/5: outcomes,
periods and flow consequences explicit; final chat summarizes the report.
Actionability4/5: source, regression tests and reusable fixture are included.
Conciseness4/5: detailed evidence retained here; user-facing close remains short.
Overall4.0/5. The next useful check is owner review with real profile content
and the normal dashboard sidebar state, rather than further speculative polish.
