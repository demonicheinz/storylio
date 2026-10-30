# Shared control cursors and image delivery

- Shared Select trigger/items, checkbox, switch and submenu trigger use pointer.
  Disabled controls retain not-allowed/default as appropriate. Global button rules
  now exclude native, ARIA and Base UI disabled states; native selects are included.
  Select scroll arrows retain their scrolling affordance; text inputs and drag
  handles keep their existing cursors.
- Explicit WebP optimization, quality allowlist 75/85, shared image policy.
  Archive card sizes account for their gutters/grid/padding; full detail covers
  match the public container. Detail and preview covers plus depth screenshots
  use 85; thumbnail defaults remain 75. Original uploads and static AVIF
  background exceptions are preserved. See docs/IMAGE_DELIVERY.md.

Verification: 13 Chromium computed-cursor assertions and Select selection passed;
20 existing targeted tests and 2 real Next Image render tests passed. Tests verify
q=75/q=85 and responsive srcset generation. Lint, typecheck, production build with
dev Infisical, and git diff --check passed. No dependencies or database changes.
No visual quality comparison of real source photographs was performed. A higher
quality value cannot recover missing source resolution; this change establishes
appropriate delivery settings rather than guaranteeing all photos are sharp.

Self-review: correctness 4/5 (browser and URL contracts tested, source-image visual
quality not compared); completeness 4/5 (controls and public cover delivery covered,
full site runtime image inventory could be extended); clarity 4/5 (policy documented,
quality must still be chosen per context); actionability 4/5 (reproducible fixture and
tests, fixture server required); conciseness 4/5 (shared policy avoids repeated sizes,
existing fixture reused). Overall 4.0/5. Highest-value next check is comparing actual
cover photographs at DPR 2 using identical output dimensions.

Changes remain uncommitted. Fixture server/browser were closed after checks.
