# Dashboard Home critique

Method: dual-agent (A: 01a18179-ab1f-7d70-819e-b01bfef8e98f · B:
01a18179-aec3-78d3-99e7-3e51441b760d), plus parent browser inspection.
Date: 2026-10-28. Mode: Operate. Assessment only, no application edits.

Target: src/features/dashboard/home/components/home-section-form.tsx;
route src/app/(dashboard)/dashboard/home/page.tsx.
Resolved critique slug: ard-home-components-home-section-form-tsx-cba9f546.

## Verdict

The navy/blue typography and shared control foundation fit Storylio. The page
structure reflects real content ownership, but item layouts still prioritize
desktop columns, date metadata and permanent drag handles over readable content.
The right next step is responsive workflow refinement rather than more effects,
smaller type, a table rewrite or horizontal scrolling.

## Heuristic score

Scores 0–4; all ten apply to this operational page. These are reviewer judgments,
not measured usability outcomes or a WCAG certification.

| Heuristic | Score | Main issue |
| --- | ---: | --- |
| System status | 3 | Save feedback exists; reorder recovery/status incomplete. |
| Match to task | 3 | Active Home sections clear; stored legacy/client concepts remain. |
| Control/freedom | 2 | Hero draft lost on tab switch; dialog dismissals unguarded. |
| Consistency | 3 | Shared components; logo fallback/radius drift. |
| Error prevention | 3 | Client/server validation and confirmed delete; draft protection gaps. |
| Recognition | 2 | Broken/clamped item text forces opening editor to understand content. |
| Efficiency | 2 | Keyboard/touch drag exists; permanent handles and weak reorder guidance. |
| Minimalism/hierarchy | 1 | Narrow text, nested frames, dates and legacy compete with tasks. |
| Error recovery | 2 | Structured errors exist; optimistic reorder lacks explicit rollback. |
| Guidance | 3 | Ownership/fallback help exists; persistence/order guidance incomplete. |
| Total | 24/40 | Functional foundation, substantial responsive/workflow gaps. |

## Strengths

- Project identity is already present; font and palette replacement unnecessary.
- Hero/Approach/Tech stack map to public content. Headline saves independently
  of profile bio. Related content links and legacy explanations are truthful.
- Labels, semantic controls, validation, delete confirmation, transactions,
  cache invalidation and keyboard DnD already exist.

## Priority findings and next design

### P1: narrow rows make primary content unreadable

Browser measured technology title space approximately 42px at viewport 360px,
and 8.5–11px at 320px. Next.js then occupied 100px height; TypeScript/PostgreSQL
occupied about 200px. The document had no horizontal overflow. An overflow-only
check cannot detect this failure.

Source: home-section-form.tsx:718 (44px handle grid); :735 (80px logo);
:749 (text); :1239 (legacy layout). CardContent consumes 24px per side, followed
by item padding, handle, image, two gaps and 44px menu. Target sizes are correct;
the layout must release width rather than shrink controls.

Use the available component width to select layout:

- Narrow: item header containing handle, a contained logo and action menu;
  full-width name/status below. Approach gets full-width description under its
  title/menu header. No permanent full-height left handle strip.
- Medium: thumbnail + text + menu when the panel has enough actual width.
- Wide: compact horizontal rows, fewer frames and secondary metadata.
- Mobile panel padding 16px, item padding 12–16px, metadata at least 12px,
  controls 44px. Created dates move into editor/details; names wrap naturally.
- Prefer one structural DOM layout with container-query reflow; do not duplicate
  all dialogs/inputs into separate mobile/desktop trees.

### P2: preview parity and radius consistency

Five valid built-in technologies have no imageUrl. Public TechStackSection
resolves their local assets; dashboard shows ImageIcon. This is a preview defect,
not evidence of missing data. Share logo resolution and error fallback. Preserve
object-contain, intrinsic proportions and unclipped actual artwork.

Browser confirmed wrapper radius 16px (rounded-xl), while shared controls are
8px and panels 12px. Use an 8px preview wrapper. Avatar circles are a separate
semantic role; do not square them. The GitHub source itself is circular.
Sources: home-section-form.tsx:735; public/sections/home/tech-stack.tsx:17–42;
home/validations.ts:99; lib/home-technologies.ts.

### P2: draft retention and dependable saving

Browser reproduced: type a temporary unsaved headline, switch Hero → Approach
→ Hero, and the value returns to the stored empty value. No Save was clicked.
Preserve draft state across tabs, and warn before actual destructive dismissal
or navigation. Dialog reopening resets defaults without a dirty/pending guard.

Use a short auto-growing textarea for the 160-character headline, a count, a
clear default/fallback explanation and Save/Discard that stack when necessary.
Show a compact read-only subheadline preview and retain its Settings ownership.
Do not introduce autosave without deciding its behavior explicitly.

On 320px, Edit Logo dialog measured height 812px in an 844px viewport, with Save
bottom 861px (scroll required). Legacy form extended further below the viewport.
Scrolling works, so these controls are not unreachable, but a stable footer is
clearer. Keep body scroll separate from Save/Cancel and handle dirty dismissal.
Associate inline errors with fields, focus the first invalid control and keep
inputs on action/network failure. Source home-section-form.tsx:324, :506, :841.

### P2: reorder does not communicate recovery reliably

Shared SortableList immediately changes local order. Failed action only toasts;
there is no explicit rollback. Network promise rejection is not caught by most
Home transitions. Source-only finding; not forced against live CMS data.

Provide explicit Reorder mode with readable named handles, Saving/Saved status,
rollback and Retry, plus Move up/down alternatives. Keep current keyboard sensor.
All handles currently say Drag to reorder; announcements use IDs. Make labels
and announcements identify the item. Home's lists currently submit each full
type collection, so the Gallery subset bug is not asserted here.
Sources: shared/components/sortable-list.tsx:89–118, :173–190;
home-section-form.tsx:664, :1188; home/actions.ts:548.

### P2: control accessibility and repeated form furniture

Browser/DOM confirms upload activation is a DIV with no role/tabIndex, and its
file input display is none. Keyboard Enter/Space handlers alone do not make it
reachable by Tab. Removal icon has no accessible name (source inspected; no
image uploaded to verify it live). Use an actual labeled button and named remove
action. Existing URL input is an alternative, not a fix for upload reachability.

In built-in-logo cases, show the actual preview/source and collapse optional
image replacement. Upload and paste URL are two ways of choosing one image;
avoid displaying a huge empty drop zone as if the built-in asset were missing.
Move raw numeric order into secondary controls. Group required name/category/
visibility first. Do not decrease font size to fit.
Sources: shared/components/image-upload.tsx:329, :376, :310;
home-section-form.tsx:373, :464, :488, :993.

## Legacy removal recommendation following user steering

Recommend retiring Testimonials from the active feature and eventually the
database because public Home already uses Notes and no longer renders quotes.
This supersedes the earlier proposal to keep four equally prominent tabs.
Final active sections should be Hero, Approach and Tech stack, with a consistent
three-way tab group (44px targets; short labels), rather than a 2×2 group with
one empty cell. Omit global legacy counts and decorative summary metrics.

Removal must cover more than the tab:

- Home query/props/forms/actions/validation and testimonial seed/menu options.
- Analytics count/inventory and Media usage checks that query testimonial.avatar.
- Current Drizzle schema plus a new forward DROP migration/snapshot/journal.
- Tests, README, PRODUCT and cache ownership documentation. Historical baseline,
  archived Prisma SQL and previously committed migrations remain historical.
- Remove unused quote-display components only after checking importers. The
  clients module includes types used by TechStack and cannot be deleted blindly.

The Testimonial schema has no declared foreign key to other current tables.
Avatar references are URL-based and Media checks include them. Dropping the table
must not delete Cloudinary assets automatically. Existing screenshots show demo
names, but actual stored data must not be assumed disposable from appearance.
Prepare a reviewable removal/migration first; external DB application and data
deletion need scoped authorization. No data, table or UI was removed by this review.

## Page composition recommendation

1. Home title and a quiet Preview Home link.
2. Three active section tabs; selected counts can sit in their own section.
3. One restrained editor/list panel, no card inside every decorative frame.
4. Desktop: compact rows. Mobile: readable grouped items, not mini tables.
5. Related Projects/Writing/Notes links in a compact discoverable group rather
   than only below a long logo list. Keep ownership explicit.

The task path should be select section → understand content → edit → know it
saved. Use established navy/blue/Clash/Satoshi and 12px panel / 8px control radii;
no new stars, glow, tilt, entrance or palette replacement is warranted.

## Verification targets for later implementation

Check 320/360/390/768/1024/1440, short landscape, keyboard and browser zoom.
Assert actual readable title width and line counts, not only no document overflow.
Cover uploaded and local logos, missing/failed images, long labels/descriptions,
zero/one/many rows, pending/rejected saves, tab-switch draft retention, dialog
discard, focus restoration and reorder rollback. Virtual keyboard and real screen
reader behavior were not tested in this assessment.

## Run notes

- A source/screenshots complete before B findings were read; independent agents.
- B ran detector once over five target/imported markup files: exit0, [] findings.
  No claim that clean static detection proves responsive/accessibility quality.
- Parent inspected all four tabs and Phase/Logo/Testimonial dialogs in a new
  authenticated Brave Dev tab at localhost:3000/dashboard/home. Explicit sizes
  320, 360, 768, 1440; no new server. Read-only DOM measurement, no overlay
  injection because browser evaluate is read-only. No detector live server.
- Menu actions 44×44px mobile measured; logo radius16px, narrow title dimensions
  and upload semantics measured. No live upload, save, reorder or deletion.
- Temporary headline text only existed in the review tab and was lost in the
  demonstrated tab switch. Browser tab closed and viewport override reset.
  User tab/server retained. Both agents closed. No build/tests run for review.
- Ignore file absent; navigation guide absent. No DESIGN drift repair. Report
  persisted under task/ per AGENTS policy rather than .impeccable/critique.
  No trend imported. Questions skipped: current request asks assessment/advice;
  migration/removal implementation is not approved by this report itself.

## Self-evaluation

Accuracy4/5: concrete source/browser measurements, async failure recovery not
forced on real records. Completeness4/5: all tabs/dialogs and legacy dependencies;
short-landscape/virtual keyboard/screen-reader checks remain implementation QA.
Clarity4/5: priorities and final three-section direction; large evidence archive.
Actionability4/5: scoped removal and responsive acceptance points; no patch in
this assessment-only task. Conciseness4/5: detailed evidence here, decisions in chat.
