# Project detail critique — 2026-10-27

Method: dual-agent, isolated Assessment A (Peirce,
01a17aec-10be-7401-9e5f-2b756717c43c) and Assessment B (Maxwell,
01a17aec-1232-7203-b93f-41f9b56d21a5). A finished before the parent read detector
findings. Source target: src/app/(public)/projects/[slug]/page.tsx. Live example:
/projects/storylio on the existing production preview at port 3102.

Mode: Experience followed by Read. Preserve fonts, tokens, approved shared
navigation/footer and truthful CMS content. Demo media, links, and technical
descriptions are excluded from the layout verdict.

Design specificity: the established space identity is coherent; the case-study
composition is less specific to the work. Prioritize seeing the artifact and
reading its decisions, rather than adding decorative surfaces or motion.

| Nielsen heuristic | Score | Evidence |
| --- | --- | --- |
| System status | 3 | Active desktop TOC and current project are clear. |
| Real-world match | 3 | Role, date, and reading time are understandable. |
| User control | 3 | Back link and lightbox Escape/focus return work. |
| Consistency | 3 | Existing tokens; small-screen heading breaks need polish. |
| Error prevention | n/a | No data-entry or mutation task evaluated. |
| Recognition | 2 | No visible TOC below 1200px. |
| Efficiency | 2 | Small-screen readers cannot skip to a section. |
| Aesthetics | 3 | Coherent palette; intro and reading measure need work. |
| Error recovery | n/a | Failure states were not exercised in this review. |
| Help/documentation | n/a | No separate operational help is needed. |
| Total | 19/28 | Seven applicable heuristics. |

Strengths: desktop identity/hierarchy, no page overflow in six viewport checks,
44px main links, working desktop anchors, and keyboard-operable lightbox.
Anchors update the hash, focus the heading, and land around 112px below the top.
Lightbox locks body scroll, supports arrows/Escape, and returns focus. Reduced
motion test reported no active Web Animations and native scroll behavior.

## Priorities

1. P1 — Mobile intro delays the artifact. Cover starts at y=702 on 390x844 and
   y=730 on 320x740. Move the mobile cover after title/description; keep the role
   compact, place secondary date/read-time and full stack below the cover. Keep
   Live site as primary action and Source as secondary. Aim for a meaningful
   preview in the first viewport, not a rigid fold target for every title length.
   Suggested work: impeccable layout.
2. P2 — Reading measure is too wide. Actual paragraphs are 16px inside an 18px
   wrapper with a 74ch limit; measured width 909.75px, first line 125 characters
   at 1440px and 103 at 768px. Bound prose by the actual text scale toward 65–75
   characters, verify with real content, and let code/media use wider space.
   Preserve approved type roles. Suggested work: impeccable typeset.
3. P2 — TOC disappears below 1200px. Add an in-flow expandable table of contents
   before the reading body on tablet/mobile. Reuse headings, anchor helper and
   active-state behavior; avoid a new floating control. Suggested work: adapt.
4. P2 — At 320px Implementation Detail breaks as Implementati / on Detail.
   Improve language-aware heading wrapping within the detail scope. Do not fix
   this by changing all public heading sizes. Suggested work: typeset.
5. P2 — Heading copy-link buttons are 32x32px, below this project's 44px target.
   Enlarge the hit area without enlarging the icon. Suggested work: harden.

Minor observations: make Live site visually primary using the existing restrained
button family, leave Source secondary. Next-only adjacent navigation leaves an
empty desktop cell; a single full-width next-work link could improve the ending.
Keep screenshot aspect ratios honest and consider a more opaque lightbox
backdrop: underlying text remains visible at 320px. Caption text appears three
times in carousel DOM; this alone does not establish three visually duplicated
captions, so no duplicate-caption bug is claimed.

Cognitive load is moderate: mobile hierarchy and small-screen structural
navigation need work. Five technology tags are noninteractive metadata, not
five competing actions; the approved five-item global navigation is out of scope.
Emotional sequence: restrained intro, delayed visual payoff on mobile, strong
cover moment, slower desktop reading, useful next-project exit.

Persona concerns: mobile visitors see almost no artifact at 320px before
scrolling; scanning reviewers lack quick Outcome access on tablet/mobile;
keyboard users can navigate successfully, while touch copy-link targets are small.

Questions for the next step:

- Mobile intro: cover after title/description with facts below, or compact the
  current metadata-first composition? Recommendation: move the cover earlier.
- Scope: all five issues, or layout/reading/TOC first? Recommendation: all five
  as a focused refinement without changing CMS demo content.

CLI detector returned [] (zero static findings). This does not certify usability:
the measured composition/reading/target issues come from browser evidence.
Screenshots and raw evidence live under a/ and b/ in this task directory.
Review only: no application changes, CMS writes, commits, or push.

Self-evaluation: accuracy 4 (real measurements, scoped to Storylio demo),
completeness 4 (responsive/keyboard/lightbox verified, failure states not tested),
clarity 5 (priorities name behavior and concrete changes), actionability 5
(bounded refinement path), conciseness 4 (heuristic detail archived here).
Average 4.4/5. Future verification should include another authored case study
and long headings before implementation is accepted; the current score is not
a site-wide accessibility certification.
