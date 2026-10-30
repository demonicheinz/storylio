# Settings UI — Independent Assessment A

Method: independent design review (Assessment A). Assessment B and detector output were not read. Browser evidence belongs to the parent review and was not available to this assessment.

Scope: assessment and suggestions only; `/dashboard/settings`, its profile/account/security panels, and current dashboard conventions. No application, data, UI, or configuration changes.

Evidence labels: **[Source]** describes inspected implementation; **[Judgment]** interprets that evidence; **[Browser check]** identifies an unverified rendered or interaction risk. Scores are provisional source-based design judgments, not browser measurements or a security audit.

The Impeccable context loader's prior failure was supplied in the task: engine 0.1.18 missing and global cache unavailable. It was not rerun or installed. PRODUCT.md, DESIGN.md, and current styles were read directly. `docs/CODEX-NAVIGATION-GUIDE.md` is absent. No other assessment was used.

## Verdict and design specificity

**25/40 — Acceptable: coherent foundation with meaningful confidence and recovery gaps.**

**[Judgment]** Settings belongs to Storylio's operating interface: quiet navy surfaces, blue actions, Clash Display page heading and Satoshi controls are appropriate. It needs refinement rather than a new visual identity. Its strongest product-specific details are the distinction between public contact and login email, the bio's explicit Home hero dependency, and owner authentication controls. Generic card descriptions and repeated headings weaken that specificity, but familiar form patterns are useful here.

**[Source]** PRODUCT.md defines a private owner CMS and preserves the existing fonts. The runtime font mappings are in `src/lib/font.ts`; navy/blue theme roles are in `src/app/globals.css:170–207`. Dashboard sizing is independent from public display typography (`DESIGN.md:340`). The shell supplies a 30px/600 H1, 1280px maximum content width and 16px/32px responsive padding (`src/features/dashboard/shell/dashboard-shell.module.css:6–39`). Preserve these roles; do not import public hero scale, planet imagery, or decorative effects into Settings.

## Nielsen heuristics

Scale: 0 = absent/broken, 1 = weak, 2 = partial, 3 = good with gaps, 4 = excellent. All ten apply to this Operate surface. Evidence locations use the shorthand **P** = `src/features/dashboard/settings/components/profile-settings-form.tsx`, **M** = `src/features/dashboard/settings/components/two-factor-settings.tsx`.

| # | Heuristic | Score / 4 | Source-grounded judgment |
|---|---|---:|---|
| 1 | Visibility of system status | 3 | Dirty/saving feedback and security summary are useful; pending email change is only acknowledged by toast, and connection unlink leaves stale content (P:298–316, 481–500, 525–532, 843–850). |
| 2 | Match between system and real world | 3 | Profile / Account / Security and public email are clear; `OWNER_EMAIL` exposes implementation vocabulary, and session copy describes only this browser despite listing all sessions (P:563–565, 1056–1058, 1461–1463). |
| 3 | User control and freedom | 2 | Profile discard and kept-mounted profile tab help; profile navigation protection and explicit MFA setup cancellation are absent in these components (P:254–319, 497, 1397; M:122–207). |
| 4 | Consistency and standards | 3 | Shared controls, shell and summary align with the dashboard; Settings changes tab orientation/layout relative to About/Analytics and keeps vertical semantics on a horizontal mobile strip (P:1368–1395). |
| 5 | Error prevention | 2 | Disabled pending controls, password confirmation and code pattern help; MFA consequences appear late, and backup-code replacement has no advance confirmation (M:56–67, 117–120, 227–243). |
| 6 | Recognition rather than recall | 3 | Persistent labels and public-impact help are good; sign-in eligibility requires reconciling MFA prose with passkey counts and a separate Account panel (P:1338–1356, 1430–1479; M:117–120). |
| 7 | Flexibility and efficiency | 2 | Sticky profile save/discard and download/manual MFA setup are efficient; unlink asks for manual refresh, and Settings opens at Profile with no URL-restored panel in this component (P:848, 1369; M:93–108, 135–141). |
| 8 | Aesthetic and minimalist design | 3 | Restrained shared typography and two profile cards support scanning; repeated labels and a desktop side rail consume space without much additional information (P:325–328, 396–399, 803–805, 1368–1373). |
| 9 | Help users recognize, diagnose and recover from errors | 2 | Inline errors and MFA alerts exist; failed session loading falls through to empty-state copy, and errors are not programmatically associated with profile fields (P:163–168, 348–355, 1000–1005, 1155–1158; M:263–266). |
| 10 | Help and documentation | 2 | QR fallback, code storage guidance and bio/public-email explanations are contextual; same-phone setup and sign-in-method tradeoffs need help before commitment (M:117–141, 164–193; P:381–383, 472–473). |
| | **Total** | **25 / 40** | **Acceptable (62.5%); priorities below.** |

## Strengths to preserve

1. **[Source + Judgment] Clear profile save boundary.** One form covers identity and links. The sticky footer announces unsaved changes, disables redundant actions, distinguishes primary Save from outlined Discard, and resets the baseline after success (P:294–319, 481–501). This is a strong starting point for save confidence.
2. **[Source + Judgment] Public/private separation is mostly intelligible.** Public profile description, Home bio dependency, public email warning and separate login-email card explain real consequences rather than merely naming fields (P:325–328, 381–383, 462–473, 1403–1413).
3. **[Source + Judgment] MFA has useful recovery affordances.** Manual setup key, six-digit numeric input, downloadable one-use backup codes, saved-code acknowledgement and live status/error messages support completion (M:93–108, 135–155, 164–205, 258–266). Main MFA controls explicitly have 44px minimum height.

## Five priorities

### 1. P1 — Explain the sign-in tradeoff before enabling MFA

**[Source]** Disabled-state guidance says only to add an authenticator and save codes. The statement that GitHub and passkey sign-in become unavailable appears only in the enabled branch (M:117–120). The Passkeys card still advertises faster sign-ins and exposes Add Passkey without an MFA-dependent availability explanation (P:975, 1194–1210, 1471–1479). The security summary counts registered passkeys without distinguishing usable methods (P:1348–1354).

**[Judgment]** Enabling a protection should not surprise the owner by changing other familiar sign-in routes. Registered is not the same as currently available. These are UI contract inconsistencies; server enforcement was not audited.

**Suggestion:** Explain the existing restriction beside Set up authenticator before the first commitment. Reflect it consistently in Passkeys, Connections and the summary: e.g. registered methods with an explicit availability state. Keep management of stored credentials distinct from ability to sign in with them. Do not imply a backend policy change.

### 2. P1 — Make MFA recovery-code completion safe to leave and restart

**[Source]** Regenerate immediately calls code generation and reports that old codes are invalid only after success (M:56–67, 227–235). The saved acknowledgement disables Done, but does not intercept switching Settings tabs or leaving the route (M:186–205; P:1368–1395). Security lacks the profile panel's `keepMounted` declaration (P:1397, 1443–1446); backup codes are local component state (M:16). QR setup has no explicit Cancel action (M:122–161).

**[Judgment]** The flow creates an anxious valley: authentication is enabled before the owner finishes storing recovery material, and Done's disabled state gives stronger assurance than the available exit paths justify. Remounting loses the displayed codes; the exact tab-unmount behavior needs browser confirmation.

**Suggestion:** Present three clear stages—add authenticator, verify, save recovery codes—with explicit completion status. Before regeneration, explain replacement and confirm intent. Warn before losing unsaved recovery material, offer a deliberate exit/cancel path with accurate pending-setup consequences, and preserve an obvious way to recover or restart. Do not persist secrets into ordinary browser storage.

**[Browser check]** Verify switching tabs, browser Back, route links and reload during QR and recovery-code stages using authorized test fixtures; do not change real MFA state just to collect evidence.

### 3. P2 — Extend save confidence across navigation and delayed account changes

**[Source]** Profile has dirty state and discard but no navigation/unload guard in P:254–319. Projects and Posts explicitly use `useUnsavedChangesGuard` (`project-editor.tsx:258`, `post-editor.tsx:244`); About has `use-about-draft-guard.ts`. Keeping Profile mounted protects tab switching, not leaving Settings (P:1397). Successful email initiation resets the field and emits a toast while current email remains the only displayed account state (P:525–549). Provider unlink explicitly asks the owner to refresh (P:843–850).

**[Judgment]** The owner can see an unsaved warning and still lose edits by following dashboard navigation. After an email request, the page cannot itself answer “did that change finish?” after the toast disappears. The existing profile save is good; the gap is continuity and durable outcomes.

**Suggestion:** Match the existing editors' protection for dirty profile navigation. Keep a concise saved confirmation near the profile action area after success. For email, distinguish request sent, approval needed and change completed when reliable state is available; otherwise show the next step without inventing backend status. Refresh provider state after unlink rather than requiring manual reload.

### 4. P2 — Rebalance Settings' hierarchy and responsive tab behavior

**[Source]** Settings allocates 200px plus a 20px gap to desktop navigation (P:1371), then the profile card allocates 190px plus 32px to the avatar (P:331), while name/tagline already split at `md` (P:345). Links become three columns at `lg` (P:402). Mobile renders three horizontal tabs while the root stays `orientation="vertical"` (P:1370–1393). About uses an in-flow responsive tab grid (`dashboard/about/page.tsx:88–113`); Analytics uses a labeled horizontal tab list (`analytics-tabs.tsx:14–21`).

**[Judgment]** Two nested side allocations can squeeze the editable content near the large breakpoint. The avatar competes with routine text editing, especially when stacked first on phones. The visual mobile tab direction and declared interaction direction disagree. Actual overflow, truncation and arrow-key behavior are unverified.

**Suggestion:** Prefer the established About/Analytics in-flow tab pattern unless rendered evidence justifies a rail. If retaining the rail, make orientation semantics follow its responsive presentation. Make avatar editing a compact part of Identity; allocate columns by available panel width. Separate Links into Social profiles (three) and Contact (two), with one coherent save footer. Keep Clash/Satoshi, navy/blue tokens, quiet borders and dashboard heading scale.

**[Browser check]** Inspect at 320/390px, around the 1024px transition, and desktop with dashboard sidebar expanded and collapsed. Check zoom, long names/URLs, tab key handling, footer wrapping, focused controls behind the sticky footer and phone keyboard behavior. Shared Input/Button/Tab primitives already expand touch targets; do not report blanket undersized controls (`src/components/ui/input.tsx:12`, `button.tsx:9`, `tabs.tsx:77`).

### 5. P2 — Make failures distinguishable, associated and recoverable

**[Source]** Session load failure sets `loadFailed` and a toast, but the panel's render branches only distinguish loading, nonempty sessions and “No active sessions are available” (P:1000–1005, 1081–1158). Summary alone says Unavailable (P:1013–1020). `FieldError` produces plain text without an ID, while fields set `aria-invalid` without `aria-describedby` pointing to that text (P:163–168, 348–355). Avatar upload overlays its interactive component with `opacity-0` (P:144–150).

**[Judgment]** A security reader must distinguish “nothing exists” from “the system could not check.” A keyboard or screen-reader user needs the correction and focused upload affordance to be discoverable where they act.

**Suggestion:** Add an inline session-load error with Retry, retain a separate truthful empty state, and align panel/summary wording. Associate errors and relevant helper copy with their inputs and provide a visible keyboard focus treatment on avatar editing. Preserve the existing MFA `status`/`alert` pattern.

**[Browser check]** Confirm screen-reader error announcements and avatar focus visibility; do not infer the complete accessibility tree from JSX alone.

## Cognitive load and emotional journey

**[Judgment] Moderate overall; concentrated in Security.** Profile navigation has three choices and two coherent cards. Five link fields are inputs, not five mutually exclusive action choices, so their count alone is not evidence of overload. Security is intrinsically more complex; the interface adds effort by making the owner reconcile separate availability messages and irreversible consequences.

| Checklist | Assessment |
|---|---|
| Single focus | Pass: three task panels isolate routine profile editing. |
| Chunking | Partial: five Links inputs and a potentially long session list would scan better with subgroups/disclosure. |
| Grouping | Pass: card boundaries associate related tasks. |
| Visual hierarchy | Partial: side rail/avatar space and repeated headings compete with editable content; browser confirmation needed. |
| One decision at a time | Fail in code replacement: consequence is disclosed after the action. |
| Minimal choices | Pass at top-level; conditional risk in a populated Security panel. |
| Working memory | Fail: MFA's sign-in restriction must be carried into Passkeys and Account/Connections. |
| Progressive disclosure | Pass for QR/manual-key and backup-code stages; improve exit/completion handling. |

Two clear failures plus partial risks indicate moderate load, not a measured usability result. A populated Security panel can expose more than four actions across the page: Regenerate, Disable, Revoke other sessions, individual Revoke, Edit/Delete passkey and Add Passkey. Whether these compete in one viewport is **[Browser check]**; keep actions locally grouped rather than hiding every management action in one menu.

The emotional sequence starts calmly with familiar profile editing, gains reassurance from explicit save state, then becomes uncertain during authentication setup and delayed email approval. Backup-code download and acknowledgement are useful peaks. The desired ending is a durable statement of what is enabled, which methods still work and what requires action—not simply dismissal of a toast.

## Persona flags and minor observations

- **Returning owner / expert:** Unexpected loss of profile edits when leaving Settings contradicts Projects/Posts/About habits; manual refresh after unlink makes completion feel unreliable.
- **Phone-only owner:** Cannot scan a QR displayed on the same phone without another route; the manual key helps, but task-focused instructions and a compact avatar section would reduce friction. Overflow is a risk to verify, not an observed defect.
- **Owner returning after a security incident:** Needs accurate active-session failure/empty states and advance notice that MFA changes sign-in options; raw user-agent strings add scanning work (P:1119–1120).
- **Keyboard/screen-reader owner:** Vertical tab semantics on a horizontal strip, unassociated field errors and an invisible upload overlay need focused checks.

**[Source + Judgment] Minor copy refinements:** replace `OWNER_EMAIL` with a plain owner-account eligibility explanation plus an appropriate operating-guide link (P:563–565); align Session's single-browser description with its all-session contents (P:1056–1058, 1461–1463); remove redundant “Connections / Connected providers / External login providers” introductions (P:803–805, 1432–1435). These improve specificity without inventing product claims.

Questions skipped: this agent was instructed to deliver an independent assessment without permission questions. Useful parent synthesis decisions: whether the 200px rail earns its space; whether sign-in availability should be stated alongside each registered method; what durable confirmation should remain after each task.

## Assessment quality check

| Axis | Self-score / 5 | Evidence and remaining improvement |
|---|---:|---|
| Accuracy | 4 | Findings cite current source; rendered focus, layout and tab lifecycles await parent evidence. |
| Completeness | 4 | Covers all ten heuristics and requested dimensions; interactive states are intentionally not exercised by A. |
| Clarity | 4 | Five ranked issues separate source facts from interpretation; parent can trim supporting detail in synthesis. |
| Actionability | 4 | Each issue includes a concrete direction and targeted checks; final responsive choice needs browser evidence. |
| Conciseness | 4 | Evidence is centralized with P/M shorthand; the parent can consolidate repeated confidence/recovery themes. |

Overall: 4.0/5. Highest-value improvement: reconcile these independent source judgments with the parent's browser evidence before assigning final visual severities. Would the user agree? Likely on scope and preservation of identity; rendered findings remain explicitly provisional.
