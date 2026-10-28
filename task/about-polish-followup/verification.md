# About alignment and heading underline experiment

2026-10-26. Local preview at port 3101. No staging, commit, push, or CMS writes.
The owner explicitly asked to leave the empty server-side What I Value data alone;
the section remains rendered and no content has been supplied or hidden.

## Changes

- Center avatar, location, and spoken languages within the sidebar at every size.
  Keep sticky tablet behavior and left-aligned TOC. Skeleton profile is centered.
- Add the existing Phosphor Translate icon at 16px in theme blue before spoken
  languages. It is decorative/aria-hidden. Use a centered dot between languages.
- Reduce language frame padding from 5px to 2px: overall height 48px with 44px
  link targets and unchanged type, Gooey interaction, prefetch and scroll behavior.
- Tighten mobile identity spacing. At 390px, introduction starts at y=560px,
  compared with approximately 630px in the critique. At 320px it starts at 612px
  because social links wrap naturally; no text truncation or horizontal overflow.
- First skill item has no extra top border/padding; heading-to-item gap is 24px,
  previously 49px. Separators remain only between skill items, like education.
- About H2s use a static 1px blue-to-transparent gradient 16px below the title.
  The owner's clarification supersedes the initial full-column interpretation:
  H2 width is fit-content, capped by the available width; the line follows the
  heading block and stays below wrapped text. No slash prefixes or H3 decorations.
  The extra border above What I Value is removed to avoid stacking separators.
  Global type sizes and other routes remain unchanged. This is a local visual
  experiment; DESIGN.md's stable plain-heading policy is not rewritten yet.

## Verification

- PASS lint: 360 files. `git diff --check` passes.
- PASS production build, TypeScript, and 36 generated routes.
- PASS About browser checks at 1440, 1024, 768, 390 and 320px: profile centers
  match the sidebar center within 0.02px; frames are 48px; link targets 44px;
  first-skill gap 24px with no stacked border/padding; native short-tablet sidebar,
  keyboard anchors, timeline alignment and both languages' TOC remain functional.
- PASS public typography cross-route suite: 35 route/width comparisons, shared
  Home scale, root font scaling, article copy action, and no horizontal overflow.
  About alone allows the scoped 1px gradient, whose width equals its H2 box.
- PASS language prefetch check: 49-61ms switches under injected 800ms RSC latency,
  zero navigation requests, preserved scroll. Translate icon does not change
  language routing logic. Actual icon measured 16px and aria-hidden=true.
- Heading geometry: How I Work width 258.4375px, gradient 258.438px, content column
  710.3125px at desktop. This confirms it follows the heading rather than column.
- Desktop/full mobile and final profile/heading/mobile-top captures inspected.
  No browser page errors in the regression suites. Chromium-only browser coverage.

Screenshots: [Desktop](desktop.png), [Mobile](mobile.png),
[Profile](profile.png), [Mobile opening](mobile-top.png).

Design gate PASS: existing fonts/colors/content preserved; requested gradient is
scoped and static; all controls work, mobile alignment is retained, native target
size is preserved, and no new claims or content are fabricated. User approval of
the visual result is still pending. Existing starfield experiment remains intact.

Self-review: accuracy 4/5 (DOM/build verified, Chromium only); completeness 4/5
(all chosen refinements and Translate request implemented, visual approval pending);
clarity 4/5 (heading-width clarification documented); actionability 4/5 (running
preview and screenshots, no commit); conciseness 4/5 (localized styles and existing
icon/component reuse). Average 4.0/5. Next useful step is owner review of underline
brightness and wrapped mobile heading appearance; no further polishing assumed.

## Language padding follow-up

The owner requested more breathing room after viewing the 48px version. The
About-only language preset now uses 4px frame padding, a 4px gap between choices,
and 16px horizontal text padding. This supersedes the 2px frame above: total
height is 52px with unchanged 44px interactive targets. The shared navbar preset
is unchanged. The About browser regression now expects the 52px language frame.
