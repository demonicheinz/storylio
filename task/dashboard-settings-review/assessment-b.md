# Independent Assessment B: Settings technical evidence

Source-only assessment for parent synthesis. Assessment A was not read. Browser evidence belongs to the parent; this assessment used no browser, started no server, and made no UI, source, configuration, database, or account changes. Only this report and detector.txt/json were written. Existing test code was inspected; no tests were executed.

## Detector availability and evidence limits

One real attempt from `<repo>`:

```powershell
<home>/.agents/skills/impeccable/scripts/impeccable.cmd detect --json src/features/dashboard/settings/components 'src/app/(dashboard)/dashboard/settings/page.tsx'
```

Exit **127**: engine **0.1.18** is not installed and the launcher cannot create `<home>\.impeccable\bin\0.1.18`. This repeats the supplied context failure. No retry, context rerun, installation, download, or escalation was performed. [detector.txt](detector.txt) preserves launcher output with workstation paths redacted; [detector.json](detector.json) is an authored availability record, not scanner JSON. **Deterministic findings are unavailable, not zero.**

Reviewed the settings route, both settings components, actions and validation, shared input/textarea/tabs/upload components, auth session checks and relevant auth hooks, installed auth client behavior, and targeted existing tests. Read PRODUCT.md and the opening DESIGN.md tokens. `docs/CODEX-NAVIGATION-GUIDE.md` was requested by repository instructions but is absent. No rendered contrast, layout, keyboard, focus, timing, performance, or WCAG conformance verdict is made. Findings below are code-path evidence; proposed reproductions were not executed.

## Priority findings

### B1 · P1 · Passkey failures are reported as success

**Evidence:** `src/features/dashboard/settings/components/profile-settings-form.tsx:939` deletes a passkey, `:1174` adds one, and `:1257` renames one. Each awaits the call but ignores its result and then unconditionally shows success; add/rename also close the dialog. `src/lib/auth-client.ts:5` does not configure throwing on API errors. Installed Better Auth and passkey packages are both 1.7.14. In `node_modules/@better-auth/passkey/dist/client.mjs`, `registerPasskey` explicitly uses `throw: false` and returns `{data: null, error: ...}` for registration cancellation/failure. The dynamic client in `node_modules/better-auth/dist/client/proxy.mjs` returns the fetch result; `node_modules/@better-fetch/fetch/dist/index.js:592` returns API errors unless throwing was enabled.

**Trigger / consequence:** Cancel the native Add Passkey ceremony or receive an API rejection on add/delete/rename. The resolved error object takes the success path, so the UI claims a security change that did not occur. This is not a claim that a failed operation actually changes stored credentials.

**Recommendation:** Inspect each returned error before success or closing a dialog; retain recoverable form state. Check `useListPasskeys().error` separately (B3). Add targeted cancellation and rejected add/delete/rename tests.

### B2 · P2 · Avatar upload is disconnected from save timing and visible feedback

**Evidence:** `profile-settings-form.tsx:144` gives ImageUpload `className="z-20 absolute inset-0 opacity-0"`; its upload status and error are descendants of that invisible wrapper. The shared component renders uploading text at `src/features/dashboard/shared/components/image-upload.tsx:372` and an error alert at `:410`. It exposes `onUploadingChange` at `:54`, fires it around the awaited upload at `:174`, and only then calls the parent `onChange` at `:179`. The profile wrapper does not pass that callback. Save is gated only by `isPending || !isDirty` at `profile-settings-form.tsx:485`, and successful submission resets the captured values at `:312`.

**Trigger / consequence:** Change a text field, begin an avatar upload, and save before that upload finishes. The submitted snapshot still contains the previous image. If the upload finishes before the action returns, its `setValue` can be overwritten by `reset(values)`; if it finishes afterward, it creates another unsaved image change after the save. Upload progress/failure text is also visually hidden by opacity. These are source-derived ordering cases, not measured network timing.

**Recommendation:** Propagate upload state to the form, prevent saving until uploads settle, and render progress/errors outside the transparent hit area. Verify both completion orders with controlled promises.

### B3 · P2 · Security fetch failures become empty or disabled-looking states

**Evidence:** `profile-settings-form.tsx:993` sets `loadFailed` for a failed session action, and `:1017` correctly puts “Unavailable” in the summary. However, the body at `:1081` branches on loading and session count only; failure therefore falls through to “No active sessions are available” at `:1157`, with no retry. The initial request has no rejection handler, so a transport-level rejected promise can leave loading true. PasskeySettings at `:901` ignores the hook error and can fall through to “No passkeys registered yet” at `:971`. `two-factor-settings.tsx:11` similarly ignores the session error and derives `enabled=false` when no session data is available. SecuritySummary at `profile-settings-form.tsx:1328` already handles those hook errors explicitly.

**Trigger / consequence:** A failed request without cached data produces conflicting “Unavailable” versus empty/not-enabled messaging, or a session spinner that never recovers. Users cannot reliably tell whether security data is absent or simply could not be loaded. Server authorization still applies; this is not an authentication bypass.

**Recommendation:** Render a persistent unavailable state with retry, handle rejected session requests, and avoid offering configuration based on an unknown MFA state. Test returned failures, rejected transport requests, and successful retries independently.

### B4 · P2 · Enabling MFA leaves revoked sessions displayed as active

**Evidence:** `two-factor-settings.tsx:49` marks verification successful, says other sessions were signed out, and calls only the auth-session hook's `refetch()` at `:55`. `src/lib/auth.ts:79` actually deletes other sessions after first TOTP verification. In the same Security panel, SessionSettings loads its separate action-backed list once via the empty dependency array at `profile-settings-form.tsx:990`. It updates that list only through its own revoke handlers. No callback connects MFA verification to this list.

**Trigger / consequence:** Open Security with multiple sessions, then complete MFA setup without leaving the tab. The page can simultaneously say other sessions were signed out and still label those rows “Active,” with the old summary count. The revocation itself is implemented; the displayed evidence is stale until the panel remounts.

**Recommendation:** Reload the session list after MFA changes that revoke sessions; use a shared invalidation callback rather than treating auth-hook refetch as list refresh. Test setup with at least two session rows.

### B5 · P2 · Field errors are visible but not associated with their inputs

**Evidence:** `profile-settings-form.tsx:163` renders FieldError as an unaddressed paragraph. Profile fields such as name (`:347`), bio (`:372`), links (`:404`) and public email (`:462`) set `aria-invalid`, but do not reference error/help text using `aria-describedby` or `aria-errormessage`. Email and password forms repeat this at `:554` and `:665`. `src/components/ui/input.tsx:4` and `textarea.tsx:4` simply spread supplied props; they do not create associations. Display-name required status and profile length limits are defined in `validations.ts:17`, but not explained by those fields before submission.

**Consequence:** Inputs have real labels and invalid state, but their specific corrective text and contextual help are not programmatically linked for a user revisiting the field. Native URL/email validation can also intercept submission, so do not assume every invalid input follows the custom error path. No screen-reader behavior or WCAG failure was tested.

**Recommendation:** Give help/errors stable IDs and reference them from the field; communicate required/length constraints where relevant. Verify resulting DOM associations and focus behavior after a client validation failure and a server field error.

### B6 · P2 · Leaving Security can bypass the backup-code acknowledgement

**Evidence:** Backup codes, setup URI and saved acknowledgement live only in component state at `two-factor-settings.tsx:15`. After successful verification, codes are shown and Done is disabled until saved is checked (`:162`, `:186`, `:198`). Security's TabsContent lacks `keepMounted` at `profile-settings-form.tsx:1443`; Profile explicitly has it at `:1397`. The shared TabsContent forwards this prop, and the installed Base UI panel defaults it to false and returns null when inactive (`node_modules/@base-ui/react/tabs/panel/TabsPanel.js:37`, `:101`). No code-saving/navigation guard is present in this component or SettingsManager.

**Trigger / consequence:** Enable MFA or regenerate codes, then select Account/Profile before saving them. The security subtree unmounts, losing the code view and acknowledgement state even though MFA remains enabled or old codes have been invalidated. The Done gate protects only Done. This is a recovery-risk path, not an immediate irreversible lockout: codes can be regenerated while password/session access remains.

**Recommendation:** Protect departure from a pending code-save flow with an explicit discard warning, and clear sensitive codes after acknowledged completion. Merely keeping the panel mounted would preserve secrets in hidden UI without protecting page departure. Extend the existing MFA test to leave the tab before acknowledgement and verify the intended recovery behavior.

## Behaviors that are already correct / false positives avoided

- **Labels and controls:** Most text fields have matching Label `htmlFor` and input IDs; password reveal buttons have changing accessible names and `type="button"` (`profile-settings-form.tsx:665`). This is not a blanket missing-label finding. Shared inputs and tabs include focus styling and coarse-pointer/mobile sizing; rendered quality is unverified.
- **Profile dirty state:** Profile is explicitly kept mounted across tabs (`:1397`); switching tabs alone does not discard profile edits. The status at `:482` has `role="status"`, buttons disable during a save, failed actions retain form state, Discard resets to defaults, and `reset(values)` only occurs after success (`:294`). B2 is the separate upload race. A route departure/refresh guard is absent from this form; its existing dirty message does not protect leaving the page.
- **Server save behavior:** `actions.ts:156` checks the authenticated owner via `getActionSession`, revalidates the same schema, updates only that user's record and invalidates profile caches. No evidence of a save-before-persistence success path in the normal profile action.
- **Email/password boundaries:** Login email is distinct from public email, the owner allowlist is checked server-side, and email-change copy explains current-address approval plus new-address verification (`actions.ts:252`). Password changes validate confirmation and send `revokeOtherSessions: true` (`:234`), although the password card does not explain that effect in advance.
- **Session controls:** Listing filters by owner and unexpired sessions, serializes no bearer token, and computes the current-session marker server-side (`actions.ts:49`). Single revoke excludes foreign/current sessions, and bulk revoke retains the current token (`:95`, `:128`).
- **MFA/recovery:** MFA operations inspect returned errors, prevent concurrent duplicate requests with a ref lock, label the QR/manual key and code input, provide downloadable backup codes, and render status/alert feedback. The server revokes older sessions on enable and preserves MFA during password recovery. B4/B6 concern presentation and departure, not missing server revocation or missing backup codes.
- **Provider unlink:** `unlinkAccount({accountId: account.id})` is correct for the installed endpoint (`node_modules/better-auth/dist/api/routes/account.mjs:260`); do not flag this as a provider-ID mismatch. The endpoint protects unlinking the last account. Successful unlink deliberately asks the user to refresh (`profile-settings-form.tsx:848`), so the unchanged row is an acknowledged usability limitation, not proof that unlink failed.

## Existing test coverage actually inspected

These are assertions present in source, **not results from this review**.

| Existing test | What it covers | Relevant limit |
| --- | --- | --- |
| `tests/browser/dashboard-system.js:72`, `:175` | Settings fixture is included in viewport overflow/title checks at 1440/768/390/320; changing then discarding display name restores the fixture value. | Uses SettingsManager fixture (`tests/fixtures/dashboard-overview/page.tsx:196`); no settings save request, upload race, security-tab departure, or security error-state assertions. Menu-target sizing checks only match `Open actions for` buttons, not all settings controls. |
| `tests/browser/auth-recovery-mfa.js:223` | Standalone TwoFactorSettings fixture checks QR title, enable, Done disabled before saved acknowledgement, regenerate and disable. Earlier sections exercise recovery/reset/challenge errors. | Auth endpoints are mocked; the fixture does not include SettingsManager tabs or SessionSettings, so B4/B6 are outside its checks. |
| `tests/database/session-revocation.test.ts:77` | Four cases cover live owned listing/no token leakage; selected-session deletion; foreign/current/unknown/malformed rejection; unauthenticated rejection. | Action/database coverage, not client loading/retry, bulk-revoke UI, or MFA-driven list refresh. |
| `tests/database/auth-mfa.test.ts:128`, `:157`, `:191`, `:240`, `:267` | Confirmation/encryption/older-session revocation, TOTP challenge, backup-code single use/regeneration, expiry/throttling and password-required disable. | Confirms relevant backend protections; does not test settings client state or tab unmounts. |
| `tests/database/auth-hardening.test.ts:104`, `:157` | Current-email approval before new-email verification; direct non-owner email change rejected. | Direct auth endpoint behavior, not settings form field-error associations or pending email presentation. |
| `tests/database/auth-recovery.test.ts:94` | Generic reset response, expiry, one-use/reset revocation, throttling, concurrent token consumption, preserved MFA, background-email failure. | Recovery backend guarantees, not backup-code acknowledgement/navigation in settings. |
| `tests/public/route-shells.test.ts:63`, `:75` | Settings returns a route shell before request data resolves. | Does not render or exercise settings forms. |
| `tests/browser/security-smoke.js:9` | Anonymous auth/security smoke uses a conditional-passkey challenge fixture. | Explicitly not a real WebAuthn sign-in or settings passkey-management test. |

The targeted test search found no direct settings profile/password action or passkey-management behavior assertions. `tests/database/management-actions.test.ts` covers other dashboard actions; its name is not evidence of settings coverage. No coverage percentage is inferred.

## Handoff

Prioritize B1, then coordinate upload/save and security unavailable/recovery states (B2/B3/B6), then refresh invalidated sessions and connect error descriptions (B4/B5). Parent browser checks can verify cancellation feedback, tab departure with unsaved recovery codes, injected request failures, upload/save completion ordering, and actual error associations. Source changes remain outside this critique's authorization.

Verification: scope PASS (only three owned evidence files); independence PASS (no Assessment A or browser access); detector status UNAVAILABLE (real attempt, exit 127); runtime/tests NOT RUN. No UI quality score or clean-scan claim is supplied. Questions skipped: parent owns synthesis and user follow-up.
