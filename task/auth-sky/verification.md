# Auth Earth sky and global dark palette

Owner scope: Earth and animated stars only on auth; semantic color tokens global.
Existing public stars remain as previously approved. No dashboard illustration,
new auth features, commit, push, external migration or real login in this task.

## Changes

- Promote the approved public background/surface/surface-2/border values to the
  global dark theme and remove the public-chrome color overrides. Surface-3 and
  surface-4 continue that navy elevation ramp; accent/input/card/sidebar/popover
  roles use these shared values. Keep fixed planet samples and light theme.
- Update DESIGN.md's semantic color ramp and runtime ownership documentation.
- Add AuthBackground only to sign-in, with a fixed decorative isolated layer,
  responsive Earth crop, a navy veil, separate sparse star layer, and native form
  scrolling. Controls remain above the scene and the layer ignores pointer input.
- Reuse GravityStars: 32-star pool, smaller mobile count, slow drift, no pointer
  attraction or links. Existing lifecycle stops it on blur/hidden/reduced motion.
- Convert the supplied .docs/referensi/boundary/earth.jpg using Sharp without
  resizing: 2728x1536 AVIF, 45,258 bytes versus 1,397,045-byte JPEG. Serve from
  public/images/auth-earth.avif via next/image. Use a URL rather than static AVIF
  import because this Turbopack version warns on imported AVIF metadata.
- Use a foreground-colored Home link so it remains readable over Earth's rim.
  Light fallback lowers the decorative layer opacity; no theme switch was added.

## Verification

- Browser: 1440x1000, 1024x900, 768x1024, 390x844, 320x740, 844x390. Images decode,
  canvas initializes, no overflow, background ignores pointers and button wins
  hit testing. Desktop/mobile captures inspected under this directory.
- Star lifecycle: normal animation, blur pause, focus resume and static reduced
  motion passed. Existing sign-in error/reveal/redirect/browser tests also passed.
- About, Projects, Writing, Gallery and Home contain no auth background. Computed
  root/public surface tokens match. Disposable card/sidebar consumers match the
  auth input surface. No authenticated dashboard session was opened; dashboard
  verification is limited to token consumers and existing layout source.
- TypeScript, lint (445 files), production build (36 routes) and 20 targeted
  sign-in/route-shell tests passed. The full 263-test run from the preceding auth
  repair was not repeated for this visual change. No auth server logic changed.
- Detector advisories: black in the two CSS masks is an intentional alpha-mask
  value, not a visible color outside the palette. No arbitrary colors were added.
- No runtime page errors in the browser checks. Screenshot files are review
  evidence, not a claim of physical-device or cross-engine validation.

The preceding auth rate-limit migration still needs application before rollout;
this work did not apply it. Prior dependency audit findings remain unchanged.

Self-review: accuracy 4/5 (computed/runtime evidence; dashboard not logged in),
completeness 4/5 (requested scope implemented; no physical-device verification),
clarity 4/5 (one global semantic palette, separate auth decoration), actionability
5/5 (local UI, assets and repeatable checks), conciseness 4/5 (detailed evidence
kept here). Next check: owner's visual review of Earth position and brightness.
