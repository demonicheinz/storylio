# Blueprint, concept D

24 October 2026. Follow-up to the user's preference for Frame. This is an additional interactive concept, with A–C retained for comparison.

Design read: an Experience surface for visitors browsing Heinz's visual work and experiments, using the supplied landing's technical framing. ENERGY 2 / RHYTHM 2 / MOTION 2. The user's explicit `//` labels, blue accent, black background and existing fonts are the design authority for this variant.

Open `/design-preview/blueprint` on the local app. The production preview uses `http://localhost:3102`; the same route is available on the usual dev server. The chooser now includes all four concepts.

## Decisions and references

| Decision | Reason |
| --- | --- |
| Maximum 1440px frame, 64px outer gutters | Preserve the reference's wide canvas and measured side rails without stretching text indefinitely. |
| Section boundaries and crosshairs | Make the work, process, writing and personal introduction share the same alignment, as explicitly requested. |
| Blue `#78b9ff` with black and off-white | Replace the reference's lime accent while keeping text and primary actions legible. |
| Existing Clash Display, Satoshi and JetBrains Mono | Retain Storylio's typography; mono labels echo the requested `//` reference treatment. |
| Three work columns | Retain the preferred Frame proportions and keep each project visible at the same scale. |
| Hero cover fan | Bring the reference's artwork composition into the first screen, using the already sourced and labelled template covers. |
| Rotating title and one-time cover entrance | Refer to code, design and motion without adding unrelated background effects; title rotation can be paused. |
| Split process, journal rows, large wordmark | Vary the section rhythm while retaining the structural rails. |
| About as primary CTA | Preserve the user's requested destination; archive links point to the existing Projects and Blog routes. |

The adapted source is `.docs/referensi/landing`, particularly `container`, `hero`, `features`, `heading` and `foote`. Cover provenance remains in README.md. This concept adds no package, copied customer claim, statistic, testimonial or private data. Reference images and sample briefs remain visibly labelled.

## Implementation

- `src/components/concepts/blueprint-page.tsx` contains the new concept and its interactions.
- `blueprint-page.css` scopes the blue visual treatment. Shared comparison controls accommodate four variants, including narrow screens.
- `landing-data.ts` registers D; the existing dynamic preview route generates it with A–C.
- Work cards select an inline brief; process tabs support keyboard navigation; example journal rows expand; title pause/resume works; anchors have real section targets.
- Reduced-motion CSS keeps the cover stack static and hides the title control. The control remains in the server and client markup, preventing hydration differences. The reduced-motion hook stops the title timer.
- Existing Home, dashboard, CMS data and authentication behavior are outside this addition.

## Verification

The first browser pass found a reduced-motion hydration mismatch: the server included the pause button while the client omitted it. The development error identified that exact element. The fix keeps markup stable and uses a media query for visibility. The same pass also informed the tablet comparison-bar layout and preserved the top frame crosshairs.

Final verification is recorded in `evidence/blueprint-result.json` and the `blueprint-*` captures:

- Production build and TypeScript passed: 41/41 routes. Lint passed for 300 files; `git diff --check` passed.
- Browser checks passed at 1920, 1440, 1024, 768, 390 and 320px. No document overflow; visible hero images loaded. Navbar measured 48px at all six sizes.
- All four anchor destinations, three work selections, three process phases, two journal disclosures, title pause/resume and return-to-top passed. Existing archive/About destinations were verified in the rendered links.
- Four-way comparison and narrow-screen A–C route checks passed. Reduced-motion rendering, static cover stack and keyboard tabs passed without page errors.
- The six checked text/background palette pairs range from 6.27:1 to 12.73:1; these checks do not certify text embedded in the supplied screenshots.
- Final desktop/mobile captures were inspected inline. Review disposition: **ship**, scoped to the local comparison concept. Review was not independent; see `BLUEPRINT-REVIEW.md`.

The temporary browser harness explicitly resets reduced motion before its normal-motion checks. Its initial anchor assertion was also corrected to wait for Next.js navigation rather than sampling the URL immediately after a click. These harness corrections did not weaken the tested behavior.

## Antislop delivery gate

- Hard gate PASS for this preview: six viewport checks, working section targets and controls, keyboard tabs, declared sample content, existing sourced artwork, checked text palette and no invented client/statistical proof. There is no new data-entry or async-submit flow requiring additional form states.
- Purpose gate PASS: blue, lines, `//` labels, cover composition, geometry and motion each have the written reasons above, grounded in the user's supplied reference. No glow or synthetic logo wall was added.
- Liveliness PASS: ENERGY 2 / RHYTHM 2 / MOTION 2, one hero focal point, deliberate blue accents, structural spacing, and differing work/process/journal layouts are visible in the captures.
- Craft locks PASS within prototype scope: consistent image/panel corners, compact real actions, preserved fonts, responsive columns, sample/reference labels, stable SSR markup and no added dependency.

## Self-evaluation

| Axis | Score | Evidence and practical limit |
| --- | --- | --- |
| Accuracy | 4/5 | Production build and browser checks pass; this is not a full application accessibility or performance audit. |
| Completeness | 4/5 | Requested fourth concept, blue accent, frame, labels and motion are present; final portfolio copy/covers remain intentionally illustrative. |
| Clarity | 4/5 | Preview/sample labels and four-way links distinguish concepts; mobile comparison shortens visual labels to letters while keeping full accessible names. |
| Actionability | 4/5 | Local preview is running and opened in Brave Dev; publishing or replacing Home is a later selection. |
| Conciseness | 4/5 | New visual rules are isolated in two files; the variant intentionally repeats some layout patterns for comparison. |

Average: 4.0/5. Next improvements depend on the user's comparison: choose the final sections, replace sample covers with owned work, then verify the merged Home as its own change. Would the user agree: the requested reference cues are directly visible, but aesthetic selection remains theirs.
