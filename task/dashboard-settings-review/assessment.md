Method: dual-agent (A: 01a188a6-e6cf-7f13-92bd-78ef415558fd · B: 01a188a6-e7f3-76b1-bcf5-63f2e5d31ef5)

# Dashboard Settings assessment

Reviewed 2026-10-30 against `69a334a`. Assessment only. Application source,
configuration, credentials, account settings and CMS data were not changed.
Independent [A](assessment-a.md) and [B](assessment-b.md) were reconciled with
live read-only inspection and an isolated synthetic browser fixture.

## Verdict

Keep Storylio's navy/blue identity, Clash Display page heading, Satoshi forms,
shared controls and Profile/Account/Security grouping. Settings is an Operate
surface: reliable outcomes and compact, legible tasks matter more than visual
novelty. The main opportunity is editing confidence and truthful security states.
Do not add space imagery, display-scale headings or decorative animation.

Provisional Nielsen quality score: **22/40**, higher is better. Assessment A's
source-only25/40 was reduced after integrating false-success evidence and the
rendered clipping/save-footer findings. This is a heuristic judgment, not a user
study, accessibility certification or full authentication security audit.

| Heuristic | /4 | Principal evidence |
| --- | ---: | --- |
| System status |2| A resolved passkey error can produce a success toast. |
| Match to tasks |3| Public/login email distinction helps; security labels repeat or conflict. |
| User control |2| Profile survives tab changes; recovery-code flow does not protect tab departure. |
| Consistency |3| Shared components; mobile horizontal tabs retain vertical semantics. |
| Error prevention |2| Save and upload are uncoordinated; MFA tradeoffs arrive too late. |
| Recognition |3| Labels and backup-code help exist; sign-in availability requires inference. |
| Efficiency |2| Sticky save helps; provider unlink asks for manual refresh. |
| Minimalism |2| Narrow sessions clip; repeated nested cards/metadata add length. |
| Error recovery |1| Unknown security state can resemble empty/disabled, without local retry. |
| Guidance |2| QR/manual key help exists; constraints and consequences need earlier disclosure. |
| **Total** |**22/40**| Refinement and behavioral fixes recommended. |

## Strengths

- Profile, Account and Security map to recognizable owner tasks. Public contact
  email is distinguished from login email; bio copy identifies its Home impact.
- One profile form saves identity and links together, with dirty feedback and
  explicit Discard. Profile is kept mounted; switching tabs alone preserves its
  edits, confirmed in the fixture.
- MFA already has a manual setup key, downloadable backup codes, a saved-code
  acknowledgement, request locking and status/error messages. Session actions
  protect the current session and enforce ownership server-side.

## Five prioritized improvements

### 1. P1 — Make security outcomes truthful and recoverable

Add/rename/delete passkey handlers await a client result but do not check its
returned error before showing success. In a fixture where addPasskey returns
`{data:null,error:{message:'Fixture operation cancelled'}}`, Save Passkey closes
the dialog and displays **Passkey added successfully.** This is a reproduced UI
defect, not proof a failed request changed credentials.

Session body failure falls through to no active sessions while the summary says
Unavailable. A transport rejection has no catch and may leave loading unresolved.
Passkey and MFA components also need explicit unavailable states instead of
deriving absent/not-enabled state from failed reads. MFA activation revokes other
sessions server-side but does not refresh the separate action-backed session list.

Check returned errors, keep recoverable dialogs open, distinguish failure/empty/
loading, offer Retry, and invalidate the session list after relevant auth changes.
Do not treat auth-session refetch as refreshing every independent query.
Sources: [passkey add](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L1174),
[session loading](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L990),
[MFA result](../../src/features/dashboard/settings/components/two-factor-settings.tsx#L49).
Suggested command: `$impeccable harden`.

### 2. P1 — Protect completion of MFA and backup-code changes

The warning that GitHub/passkey sign-in becomes unavailable appears only once
MFA is enabled. Show the actual existing policy before setup and reflect that
eligibility in Connections and Passkeys, while distinguishing stored credentials
from methods usable right now. This critique does not recommend changing that
server policy.

Security unmounts on tab change. Recovery codes and acknowledgement exist only
inside it, so leaving can lose the new codes even while Done is disabled.
Regeneration invalidates previous codes and needs its consequence stated before
the action, with an explicit confirmation. Protect departure during incomplete
setup/code-saving, permit a deliberate cancel/leave path, and clear secret state
on completion. Keeping secrets mounted invisibly is not sufficient navigation
protection and should not be the whole solution.
Sources: [tab mounting](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L1443),
[code acknowledgement](../../src/features/dashboard/settings/components/two-factor-settings.tsx#L162).
Suggested commands: `$impeccable harden`, `$impeccable clarify`.

### 3. P2 — Coordinate avatar upload and profile saving

The image uploader exposes an uploading callback but this caller does not use it.
Its progress/errors are inside an opacity-zero overlay. Starting upload then
saving an already-dirty text field can submit the old image; a later reset of
captured values can overwrite a newly completed image selection. Source-derived
ordering risk, not exercised against real upload/storage services.

Show Change photo/Remove photo controls, visible uploading/error status, a visible
focus treatment, and Live Orb fallback when the image is removed. Prevent saving
until an upload settles. Add profile dirty-exit protection consistent with other
editors, character limits/required guidance, linked field errors, and durable
Saved/Unsaved state. Keep one profile save scope across identity and links.
Sources: [avatar wrapper](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L126),
[submission](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L294).
Suggested commands: `$impeccable harden`, `$impeccable clarify`.

### 4. P2 — Make mobile layout deliberate instead of clipping

At320px the page has no horizontal body overflow, but Session's card has286px
client width and338px scroll width under `overflow:hidden`. Long agent/IP text
is internally clipped. Passkey rows squeeze title/date beside Edit/Delete.
The sticky profile footer wraps into a tall status/Save/Discard stack; in the
capture it covers the lower part of the first profile card while scrolling.

Use compact session rows: browser/device name, current marker and last activity
first; IP/created/expiry in a disclosure. Let raw user-agent and IPv6 wrap, with
actions on their own mobile row. Put passkey identity above its actions. Give the
save bar an explicit mobile layout: status above, two buttons aligned below, with
space/focus handling so content remains reachable.

Use horizontal Profile/Account/Security tabs consistent with About/Analytics.
If keeping the desktop rail, switch the actual orientation semantics with the
visual layout; do not keep vertical semantics for a horizontal mobile strip.
Tabs already have44px mobile height in the fixture, so changing the shared tab
component's heights is not the recommended fix.
Sources: [session rows](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L1092),
[save footer](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L481),
[tab layout](../../src/features/dashboard/settings/components/profile-settings-form.tsx#L1368).
Suggested commands: `$impeccable adapt`, `$impeccable layout`.

### 5. P2 — Clarify hierarchy, field names and security copy

Rendered Settings panels have only the page H1; CardTitle text is not a real H2.
Current login email, Connected providers and Active sessions are non-field Labels
with no associated controls. Replace these with appropriate text/headings/dl,
while preserving actual input labels. Associate field help/errors using IDs and
aria-describedby; include visible name/length rules before errors occur.

Use sentence case and direct task names: Public profile; Social profiles;
Contact; Sign-in email; Password; Connected accounts; Two-factor authentication;
Active sessions; Passkeys. Bio can be labeled Hero subheadline/Bio with truthful
scope guidance. Do not accidentally imply it is About's introduction or rename
the database field solely for copy. State the sign-out-other-sessions effect
before changing a password. Replace implementation terms such as OWNER_EMAIL
with owner-facing explanation; update linked-account rows after successful unlink
instead of asking for manual refresh.

Retain30px dashboard title,18px section headings,14px controls,12px secondary
metadata,12px outer cards and8px controls. Session rows should use shared quiet
dividers or standard radius rather than nested24px cards and oversized badges.
Suggested commands: `$impeccable typeset`, `$impeccable clarify`.

## Proposed composition

Page title/short description → three horizontal tabs → task-focused content.
Profile: compact avatar controls; name/role; bio with counter; grouped social and
contact fields; one save footer. Account: sign-in email and password tasks with
their consequences, then connected accounts. Security: factual method summary;
MFA staged flow; compact active sessions; passkeys with availability explanation.
Use one column for sensitive task forms where the rail/two-column layout narrows
their usable width. Do not add extra top-level tabs merely for the three/five
field groups.

Cognitive load is moderate, concentrated in Security. Five link inputs are not
five competing action choices; the real load is reconciling sign-in eligibility,
stale sessions and whether an operation succeeded. The desired emotional journey
is understanding consequences before acting, then confidence after a reliable
outcome. Mobile owners, keyboard/screen-reader users and owners recovering access
have the most consequential gaps. No contrast or real screen-reader verdict.

## Evidence and run notes

- Source verdict uses independent A/B; A completed before B entered synthesis.
  Parent confirmed browser evidence separately. No production tests/build were
  rerun for this read-only assessment.
- Live Settings was viewed in a fresh Brave Test tab; only tabs/viewport changed.
  No credential entry, MFA setup, passkey ceremony, upload, revoke, unlink or save
  occurred on the real application. Viewport was reset and that tab closed.
- The extension viewport produced inconsistent visual scaling/label association
  signals, so responsive measurements and label counts above use a source-derived
  fixture instead; live tool screenshots are not treated as precise mobile proof.
- Fixture rendered current SettingsManager, MFA, shared components, tokens/fonts
  and shell content spacing; auth hooks/actions/router were mocked with synthetic
  records, one fake passkey and two fake sessions. No real API/DB calls. The fixture
  is ignored under `.tmp/settings-review/`, not shipped as application code.
- All three panels inspected at1440/1024/768/390/360/320px. Body width matched
  viewport at all six sizes. Mobile tab height44px. Only H1 was in the heading
  outline. Non-field label counts: Profile0, Account2, Security1. Profile draft
  survives tabs. Resolved passkey error produced false success. No page errors.
- [Profile320](profile-320.png), [Security320](security-320.png),
  [Account320](account-320.png), [Profile1440](profile-1440.png),
  [Security1440](security-1440.png), [Account1440](account-1440.png),
  [browser measurements](browser-evidence.json).
- Impeccable context failed because engine0.1.18 is not installed and its global
  cache is unwritable. Existing PRODUCT/DESIGN read directly. Detector genuinely
  attempted and exited127: unavailable, not zero findings. No installation,
  download or tool/config change; no overlay injected/live-server started.
- Slug/persistence helper unavailable with the same missing engine; critique
  archived here rather than claiming .impeccable trend/storage success. Ignore
  list was absent. Browser session/fixture server stopped after evidence capture;
  ignored temporary scripts retained for local reproduction. No secret evidence
  captured in the repository. docs/CODEX-NAVIGATION-GUIDE.md was absent.

## Self-evaluation

Accuracy4/5: independent source tracing and fixture repro; backend auth protections
not re-audited end-to-end. Completeness4/5: all tabs/six widths plus key behavior;
real MFA, uploads and speech excluded. Clarity4/5: five grouped priorities with
evidence and limits; technical detail retained here. Actionability4/5: explicit
composition and fixes; owner should choose scope. Conciseness4/5: final chat
summarizes the findings. Overall4.0/5. Next useful work is implementing the error/
recovery guarantees before final visual polish.

## Decisions

1. Use horizontal tabs throughout, or retain the desktop rail with responsive semantics?
2. Include behavioral/security-feedback repairs with layout polish, or stage them separately?
