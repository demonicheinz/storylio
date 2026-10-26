# Hero image and Home color refinement

The original 2560×1441 AVIF is served directly with preload and no second
image encode. A navy scrim dims the sky more than the planet rim, and a longer
bottom fade joins the image to the content. There is no image blur.

Home's dark tokens now live on the public shell while it contains
`[data-home-page]`, so navigation, cards, and footer inherit the same navy hue.
The footer remains a lighter surface-2 for the curtain reveal. Its previous
undefined `--planet-night--surface-2` reference was corrected. Global tokens,
other routes, typography, and animation logic were not changed in this pass.

## Verification

- PASS: Biome checks for all five changed source files; TypeScript noEmit;
  git diff whitespace check.
- PASS: Chromium at 1440×1000 and 390×844 in both themes: direct AVIF URL,
  naturalWidth 2560, no srcset, no filter, no horizontal overflow.
- PASS: computed navigation and Home surface tokens match in both themes;
  footer background is opaque. Projects retains its original surface token.
- PASS: existing Venom browser suite: animated scene, navigation/back,
  keyboard/reduced motion, offscreen/context-loss cleanup, no-WebGL, touch.
  No page errors were reported.
- Visual review: desktop hero/footer, mobile hero, light mobile footer, and
  the settled animated CTA. Initial captures caught the existing CTA entrance
  animation; settled captures were taken afterwards. Diagnostic captures are
  in `.tmp/home-colors/` (ignored).

The development browser reports a CSS chunk preload warning for the new CSS
module. No production build was run for this scoped styling change. Browser
coverage is Chromium only; this is not a full accessibility audit. Source
resolution and mobile cropping still limit detail on dense displays.

## Self-review

Accuracy 4/5: browser confirms source and inherited colors; production preload
behavior remains unverified. Completeness 4/5: requested Home changes covered;
other pages intentionally keep their existing palettes. Clarity 4/5: semantic
surface roles documented; visual preference still belongs to the user.
Actionability 4/5: changes run locally and can be adjusted through six palette
tokens; no cross-browser preview. Conciseness 4/5: checks scoped to the change,
with one extra visual pass needed after capturing the entrance animation.
Overall 4/5. Next useful check: inspect the CSS preload warning during the next
production build; judge the palette on the user's actual display.
