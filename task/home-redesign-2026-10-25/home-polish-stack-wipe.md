# Home copy, logo rotation and cover interactions

Implemented the approved follow-up on October 25, 2026 (Asia/Bangkok).

## Result

- Hero: “I’m Heinz. I build web apps.” and the approved direct introduction,
  retaining the user's current “full stack web developer” wording. The secondary
  anchor is “See my projects”. The former profile-bio override and unused owner
  query were removed so the approved Home text is not replaced by an old bio.
  Profile content remains editable and used elsewhere; no profile record changed.
- Headings: “Projects I’ve built”, “How I work”, “My usual stack”, “Writing”,
  “Notes from building”. The footer uses the requested “Got something in mind?
  Let’s talk.” Existing CMS phase descriptions remain unchanged.
- Home uses only its footer back-to-top link. Other public routes retain their
  floating control, verified on Projects.
- Project covers tilt up to 4°/1.02 scale; writing covers use 2.5°/1.01. The
  spring response follows the supplied tilted-card reference. The implementation
  keeps only cover tilt and restrained theme-colored glare; it does not include
  flip, tooltip, gyroscope, floating, or intro behavior. Text remains stationary,
  existing Next Image covers/fallbacks remain, and cards stay real Next links.
  Animation frames stop when settled/offscreen/hidden/unfocused, with static
  touch and live reduced-motion behavior.

## Technology row

One row with 6 slots at 1200px+, 4 at 768–1199px and 3 below 768px. Fewer data
items produce fewer logos; additional items rotate in groups about every five
seconds. The last group stays filled by sharing some items with the previous
group when the total is not divisible by capacity. Order is deterministic and
every configured item remains reachable.

The final user correction removed every visible previous/next and pause/play
button, as well as pagination text. The supplied logo-clouds animation is
preserved as a 920ms clip/blur/opacity wipe, staggered 110ms per slot. The old
logo changes to the next one at 40% of the wipe, when fully clipped. The first
view wipes once, including when all data already fits in one group. Autoplay
runs only when there are more groups and the section is visible and active;
hover/focus pauses it. Leaving the section or hiding/blurring the page stops
timers and clears an interrupted wipe to readable content.

The row supports horizontal touch swipe and arrow/Home/End keyboard navigation
without visible controls. Vertical touch scrolling remains available. Reduced
motion stops autoplay and removes wipe/blur; manual access remains available.
The focusable row has a visible outline and assistive navigation instructions.
Automatic changes are not announced by a live region; manual focused changes
announce the group count.

## Dashboard selection

Dashboard → Home → Tech / Client includes category and **Show in Home tech
stack**. Custom technology names can be used without changing the source allow
list. Client logos remain stored but excluded from this Home section; hidden
technologies remain editable without deletion. Images and ordering still use
the existing editor. The five bundled logo names can be saved without uploading
an image, while other entries require an image URL.

To work with the current database immediately, LOGO's existing optional content
field stores a versioned JSON document (`home-logo`, v1), with the previous plain
text retained as description. PHASE content remains plain text. Unconfigured
legacy logo rows keep the previous name-based defaults. Public props include
only display fields; configuration descriptions are not sent to the logo row.
No schema changes, migration, dependency additions, or application database
writes were performed. Existing authenticated actions and cache invalidation
remain in use. The UI exposes the new settings when the owner edits a logo.

## Validation

- `bun run build`: success; 36 routes generated with Cache Components/Partial
  Prefetching retained. TypeScript also passed independently.
- Biome checked all 24 changed source/test/config files. `git diff --check` passed
  with the existing README CRLF normalization notice.
- Focused Vitest run: 38/38 passed across technology configuration/pagination,
  public navigation, Home content SQL, and management actions. PGlite verifies
  custom technology visibility persists, phase content is preserved, and the
  public Home cache is invalidated. No real credentials or application database
  are used in these tests.
- Full Vitest run: 137/140 passed initially. A Projects import exceeded its
  15-second budget while build/browser checks were running; the route-shell suite
  passed 17/17 when rerun alone. Two seed tests still fail because the user's
  separate `scripts/seeds/owner.ts` edit sets “John Doe”, while those tests expect
  “Ahmad Haizul Amany”. Neither that edit nor the seed expectations was changed.
  Therefore the full suite is not reported as green.
- `tests/browser/home-interactions.js` passed on development and production:
  1440/1024/768/390/320px, 6/4/3 limits, one row, stable group height, access to
  all six currently configured logos, reference wipe keyframes and real logo
  replacement, no buttons, pause conditions, live reduced motion, cover tilt,
  stable text, client navigation, Home-only floating-control removal, real CDP
  touch swipe and vertical touch scrolling. Zero page errors.
- Group helper tests additionally cover totals 1/5/7/13/29 at all three capacities,
  empty data, backward wrap, and a changed page count.
- `tests/browser/home-redesign.js` passed on development and production across
  six sizes, light/dark, smooth/reduced scrolling, footer focus and scope, touch,
  image failure, server markup, Back navigation and missing-post HTTP 404.
- Inspected desktop/mobile hero, footer and tech-row captures in
  `.playwright-cli/`. The screenshot border around the tech row is its keyboard
  focus outline; it is not a persistent decorative frame.

Browser coverage is Chromium. Dashboard persistence is exercised through real
SQL fixtures and actions; no authenticated live dashboard save was performed.
The currently configured row has six logos, so desktop grouping above six is
covered by the helper tests rather than a live content mutation. No commit/push.

## Self-evaluation

| Axis | Score | Evidence and limit |
|---|---|---|
| Accuracy | 4/5 | Production/runtime and SQL fixtures pass; full-suite seed mismatch remains disclosed. |
| Completeness | 4/5 | All approved changes and the no-controls correction are implemented; live authenticated dashboard saving was not exercised. |
| Clarity | 4/5 | Design/content docs explain behavior and settings; versioned content storage requires its documented compatibility rule. |
| Actionability | 5/5 | Local changes are usable immediately without a schema migration or dependency install. |
| Conciseness | 4/5 | Tilt is a focused reference adaptation; wipe lifecycle requires a slot wrapper and a dedicated browser regression. |

Overall 4.2/5. Further useful coverage: Safari/physical touch devices and an
authenticated dashboard UI smoke in a disposable environment. These limits do
not change the verified local behavior above.
