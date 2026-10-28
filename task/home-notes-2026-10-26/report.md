# Storylio notes seed and gravity-star recommendation

The requested Notes content was added to the **dev** database through the
interactive seeder's new option 8. The CLI reported **3 created, 0 skipped**.
No existing post, profile, testimonial or demo-content group was changed.

The three published notes describe decisions already made for Storylio:

1. Keeping the hero image sharp
2. A button that stays ready
3. Giving the stack one row

Copy is English to match the current public Home. It makes no invented claims
about outcomes, clients or personal experiences. Full copy and excerpts live in
`scripts/seeds/notes.ts`. Each post uses the exact `notes` tag and is editable
through the existing blog editor. New notes have no cover image or fabricated
view counts. Home displays their excerpts and links to their full articles.

The seed uses one transaction and creates missing slugs only. On subsequent
runs it preserves every existing title, content, tags, status, publication date
and view count, including drafts or an owner's removed tag. Menu indices are
validated against the available choices instead of a fixed seven-item regex.
The notes-only plan requires the existing owner and never seeds an account.

The running dev Home initially retained its cached empty Notes list. A browser
hard refresh refreshed the cached result; the three cards are now visible.
The CLI and operating guide now explain that direct seed writes do not invalidate
the running Next.js app's cache. A deployed app needs its normal revalidation
or a new build; no deployed environment was seeded in this task.

Validation:

- 13 tests passed across seed-menu parsing, Notes SQL/rollback/idempotence and
  Home category selection.
- TypeScript passed; Biome passed for the six touched source/test files.
- Browser verification found all three cards, separate from the writing list,
  and checked each detail response (HTTP 200), real link navigation and the
  `/blog?tag=notes` archive. Zero page errors.
- Inspected 1440px and 390px captures in `.playwright-cli/home-notes-*.png`.
- `git diff --check` passed with the existing README CRLF normalization notice.

## Gravity-star assessment (proposal only)

Reviewed `.docs/referensi/gravity-star.tsx.bak`. Defaults are 220 stars, connecting
lines enabled, gravity 1, speed 1, star radius 1.5 and glow 5.5. The implementation
already handles viewport/document visibility and reduced motion. It does not
currently pause on window blur, and its pointer well also responds to touch.
Its utility import points to an absent reference-specific SmoothUI path, which
would need adapting to the project if implemented.

Recommendation: a hero-local, sparse sky layer rather than a page-wide field.
Start with 40 desktop stars (24 after its narrow-screen multiplier), connecting
lines off, gravity off, speed around 0.15, starSize 0.6–0.8, glow around 2, low
twinkle and mostly cool tint. Fade it out before the planet/astronaut region;
do not add particles over the content cards or footer. The supplied hero already
contains stars, so test the combined density before increasing it. Avoid adding
another pointer effect around Venom. Any future integration should pause on blur,
remain static for reduced motion and avoid touch gravity during scrolling.

No gravity-star code or revised Home animation plan was implemented. The
previously rejected animation experiment remains in the working tree pending
the user's choice of the replacement plan. No commit/push was performed.

## Self-evaluation

| Axis | Score | Evidence / limit |
|---|---|---|
| Accuracy | 4/5 | Notes reflect implemented decisions and browser/SQL checks pass; no deployed-cache claim. |
| Completeness | 5/5 | Notes seeded and visible on dev; starfield recommendation is scoped and not prematurely applied. |
| Clarity | 4/5 | Menu and cache behavior documented; create-only skips are intentional even for edited drafts. |
| Actionability | 5/5 | Owner can inspect/edit posts immediately or rerun option 8 safely. |
| Conciseness | 4/5 | Reuses the current Post/Tag model and seed runner; dedicated tests cover preserving owner edits. |

Overall 4.4/5. Gravity-star visual fit remains a recommendation from the reference
code, not a rendered Home preview. Evaluate it alongside the revised headline
and section-group motion before choosing final intensity.
