# Styled confirmations across the dashboard

## Scope

All application calls to window.confirm were replaced with the shared Base UI
AlertDialog presentation. Source searches found no window.alert/window.prompt calls
requiring replacement. Changes cover Home/About discards and item forms, Gallery,
Media rename and upload departure, Post/Project draft actions and navigation,
passkey removal, MFA setup/disable/regeneration and Security tab departure.

Beforeunload remains native for browser tab close/reload. Browsers control that
prompt; it cannot be replaced with application UI. WebAuthn/browser permission UI
is also outside this change. Toasts and existing mutation-specific AlertDialogs
(such as Media delete/retry and session revocation) retain their own state/UI.

## Shared contract

DashboardConfirmationHost mounts once in the dashboard layout and supplies the
same tokens/geometry as the existing alert-dialog primitive. confirmAction returns
a promise. Cancel/Escape fail closed, Cancel receives initial focus, and the opener
regains focus before the accepted continuation runs. The description scrolls/wraps
on narrow screens. Destructive choices use the existing destructive variant.

The controller keeps one active request, rejects overlapping requests rather than
replacing a pending decision, cancels when the host unmounts or pathname changes,
and resolves acceptance only after close completion. Each request has its own
identity so independent dialogs do not reuse internal modal state. The host mounts
synchronously using a layout effect before interactive requests can run.

Dirty modal closes cancel the Base UI close event synchronously; only an accepted
choice later closes the parent. Draft values and pending/upload guards are kept.
Security actions recheck mounted/locked state after awaiting a decision.

A shared navigation guard replaces duplicated document listeners in Home, About,
editors, Settings and Media uploads. It preserves modifier clicks, same-page
anchors, download/new-window links and one approved replay of the original link.
Two dirty registrations result in one confirmation. A short, one-use unload permit
prevents the approved document navigation from asking a second native question;
normal reload/close remains protected when dirty. It does not add a new router
Back/Forward interception contract beyond the existing navigation protection.

## Verification

- Full Vitest: **95 files / 711 tests passed**, 396.34 seconds.
- Five new controller tests: missing host, close-completion ordering, cancellation
  on unmount, overlap rejection and duplicate close events. Fifty existing Settings
  MFA/security unit scenarios passed with the confirmation boundary mocked.
- Browser suites passed: Settings (320–1440px, passkeys/MFA/backup codes/tab guards),
  Projects (320–1440px), Posts (275–1440px), About (320/360/768/1440px), Gallery editor
  (dirty dismissal, pending/upload locks and responsive footer), Home (21 layouts,
  draft retention and Back/Forward), Media and upload queue (leave guard/retry).
- New confirmation browser checks: nested rename discard at 320/1440px, Cancel and
  Escape retain parent/draft, confirmation discards without submitting, cancellation
  focus restores to the dirty field, no native dialogs and no blocked aria-hidden
  warnings. Guard fixture checks duplicate dirty registrations, one link replay,
  clean navigation, same-page anchors and beforeunload event protection.
- Browser screenshots: confirmation-discard-320.png and confirmation-discard-1440.png.
  Historical screenshots overwritten by existing fixture suites were restored;
  diagnostics and debug servers/scripts remain in ignored .tmp/.
- Fixtures use synthetic records and mocked actions/providers, not real CMS writes
  or authenticated production navigation. Existing browser scripts now interact
  with the actual confirmation buttons instead of native dialog callbacks.
- A Home history test initially failed because its usePathname stub read location
  without subscribing to popstate. Making that fixture stub reactive fixed the
  false route-change cancellation; production routing was not bypassed.
- Standalone TypeScript, lint and the dev Infisical production build passed
  (38/38 pages generated). Source search found no remaining native confirm/alert/
  prompt calls under src. Shared beforeunload remains intentional.

## Review

No server actions, MFA policies, upload validation, database schema, dependency or
provider calls were changed. The asynchronous decision boundary is tested alongside
pending locks and mounted-state checks. Existing Media mutation work remains local
and uncommitted from the previous batch; this confirmation change is also uncommitted.

Self-evaluation: accuracy 4/5 (runtime/controller evidence, mocked-service limits);
completeness 4/5 (native JS confirmations replaced, browser-owned unload remains);
clarity 4/5 (shared contract documented, async close semantics require care);
actionability 4/5 (fixtures and tests reproducible with local servers); conciseness
4/5 (reuses AlertDialog, removes duplicated navigation guards). Overall 4.0/5.
