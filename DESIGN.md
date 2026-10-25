---
version: 1
name: Storylio Planet
description: "Linear-inspired hierarchy adapted to Storylio: navy surfaces and blue accents sampled from the planet hero, with the existing Clash Display, Satoshi, and JetBrains Mono fonts."

palette:
  accent: "oklch(0.6249 0.1668 248.04)"
  accent-light: "oklch(0.7803 0.1169 233.01)"
  accent-dark: "oklch(0.5216 0.1282 243.85)"
  night: "oklch(0.1594 0.0622 259.15)"
  lunar-surface: "oklch(0.1904 0.043 247.77)"
  glow: "oklch(0.9822 0.0103 219.59)"

# The default documented canvas is dark; CSS :root provides the light theme.
colors:
  primary: "{palette.accent}"
  on-primary: "{palette.night}"
  primary-hover: "{palette.accent-light}"
  primary-focus: "{palette.accent-light}"
  link: "{palette.accent-light}"
  ink: "{palette.glow}"
  ink-muted: "oklch(0.72 0.025 247.77)"
  canvas: "{palette.night}"
  surface-1: "{palette.lunar-surface}"
  surface-2: "oklch(0.225 0.035 247.77)"
  surface-3: "oklch(0.26 0.032 247.77)"
  surface-4: "oklch(0.295 0.03 247.77)"
  hairline: "oklch(0.31 0.025 247.77)"
  hairline-strong: "oklch(0.55 0.04 247.77)"
  input-border: "oklch(0.5 0.035 247.77)"
  interaction: "oklch(0.28 0.045 247.77)"
  interaction-hover: "oklch(0.32 0.05 247.77)"
  semantic-success: "oklch(0.75 0.14 155)"
  semantic-warning: "oklch(0.82 0.14 80)"
  semantic-error: "oklch(0.72 0.16 25)"
  asset-ink-light: "#f2fbfe"
  asset-ink-dark: "#000b27"
  asset-accent: "#068ce6"
  orb-wash-light: "#67c6f1"
  orb-wash-dark: "#006c9b"

typography:
  display-xl:
    fontFamily: Clash Display
    fontSize: 80px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -2.4px
  display-lg:
    fontFamily: Clash Display
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1.4px
  display-md:
    fontFamily: Clash Display
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1px
  headline:
    fontFamily: Clash Display
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.6px
  card-title:
    fontFamily: Clash Display
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.4px
  body-lg:
    fontFamily: Satoshi
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body:
    fontFamily: Satoshi
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: Satoshi
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: Satoshi
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: Satoshi
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 24px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  content-card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  media-panel:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: 24px
  text-input:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 8px 12px
---

# Storylio design system

Storylio borrows Linear's restrained hierarchy, compact controls, and separation
through surfaces and hairline borders. Its identity comes from the planet in
`public/images/home-hero.avif`: deep navy, lunar blue surfaces, a clear blue rim,
and a pale cyan highlight. The portfolio's projects, writing, and photography
remain the content; Linear's product screenshots and pricing layouts are not
templates for these pages.

The hero image is the intended visual anchor. Its horizon supplies the strongest
light; surrounding interface surfaces stay quiet. Energy: 2/5, rhythm: 3/5,
motion: 1/5. Preserve the existing font identity and let the image carry the
atmosphere instead of repeating glow across cards and controls.

## Token ownership

`src/app/globals.css` is the runtime source for colors and radii. This document
records their roles and the component design direction. Font loading stays in
`src/lib/font.ts`. Typography, spacing, and component recipes above are guidance;
they do not generate CSS or replace existing component markup automatically.

The six `palette` samples map to fixed `--planet-*` variables. Semantic variables
map those samples to usable roles in `:root` (light) and `.dark` (dark). The app
currently applies `.dark` in `src/app/layout.tsx`; defining a light palette does
not add a theme switcher.

### Brand and interaction

| Role / CSS token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `--brand` | Accent | Accent | Original rim-light sample; brand graphics and decoration |
| `--brand-soft`, `--link` | Accent dark | Accent light | Readable inline emphasis, links, and highlighted words |
| `--brand-hover` | Accent dark | Accent light | Brand hover state |
| `--primary` | Accent dark | Accent | Filled primary controls |
| `--primary-hover` | `oklch(0.465 0.115 243.85)` | Accent light | Opaque filled-control hover |
| `--primary-foreground` | Glow | Night | Text and icons on primary fills |
| `--ring` | Accent dark | Accent light | Keyboard focus |
| `--glow` | Glow | Glow | Restrained hero/edge highlight, never body text on light |

The sampled accent remains unchanged. Light-mode primary controls use its darker
variant for readable labels; their hover takes one further step darker. Dark-mode
buttons pair the sampled blue with navy labels. White labels on that blue lack
enough contrast for small text. Keep foreground and fill paired on hover too.

`--accent` is **shadcn's interaction background**, not the brand accent. It is a
low-chroma tint for selected menu items and subtle hover fills, paired with
`--accent-foreground`. `--accent-hover` is the next step of that tint. Do not use
`bg-accent` as a substitute for the primary CTA.

`--brand-soft` retains its existing name for compatibility. It adapts per theme
because existing components use it for text as well as decoration. Use `--link`
for new inline links; underline links in running text.

### Surfaces and text

| CSS token | Light | Dark |
| --- | --- | --- |
| `--background` | `oklch(0.985 0.003 247.77)` | Night |
| `--foreground` | `oklch(0.23 0.035 259.15)` | Glow |
| `--surface`, `--card`, `--sidebar` | `oklch(1 0 0)` | Lunar surface |
| `--surface-2` | `oklch(0.965 0.007 247.77)` | `oklch(0.225 0.035 247.77)` |
| `--surface-3`, dark `--popover` | `oklch(0.945 0.012 247.77)` | `oklch(0.26 0.032 247.77)` |
| `--surface-4` | `oklch(0.94 0.018 247.77)` | `oklch(0.295 0.03 247.77)` |
| `--muted-foreground` | `oklch(0.47 0.025 250)` | `oklch(0.72 0.025 247.77)` |
| `--border` | `oklch(0.89 0.014 247.77)` | `oklch(0.31 0.025 247.77)` |
| `--border-hover` | `oklch(0.64 0.035 247.77)` | `oklch(0.55 0.04 247.77)` |
| `--input` | `oklch(0.64 0.035 247.77)` | `oklch(0.5 0.035 247.77)` |

`--surface-hover`, `--secondary`, and `--muted` alias surface 2.
`--surface-border` and `--sidebar-border` alias the decorative border.
`--popover` is white in light mode and surface 3 in dark mode. Foreground tokens
for cards, popovers, secondary controls, and the sidebar follow `--foreground`.
Sidebar action, interaction, and focus tokens follow their main equivalents.

Use the surface ladder to express depth: canvas → content → hover → popover.
Borders distinguish regions without making every card glow. `--border` is a
quiet separator; use the stronger `--input` for a form-field boundary. Text stays
on opaque surfaces where possible. Opacity, image overlays, and composited fills
need their own contrast check.

### Status and charts

| Token | Light | Dark |
| --- | --- | --- |
| `--success` | `oklch(0.46 0.12 155)` | `oklch(0.75 0.14 155)` |
| `--warning` | `oklch(0.5 0.1 75)` | `oklch(0.82 0.14 80)` |
| `--destructive` | `oklch(0.52 0.2 25)` | `oklch(0.72 0.16 25)` |
| `--info` | Link | Link |

Status colors describe real outcomes, accompanied by text or icons. They are not
secondary marketing accents. Article callouts use these same semantic variables.
Filled destructive controls pair `--destructive` with
`--destructive-foreground` (white in light mode, night in dark mode).

`--chart-1` through `--chart-5` form a sequential blue scale. These are suitable
for ordered values, not five unrelated categories. Charts still need labels,
markers, or patterns; adjacent colors alone do not communicate a series.

## Typography and geometry

- **Clash Display** / `font-heading`: hero and section headings, weight 500–600.
- **Satoshi** / `font-sans`: paragraphs, navigation, labels, and controls.
- **JetBrains Mono** / `font-mono`: code, identifiers, and technical values.

All three remain locally hosted variable fonts. Do not load Linear's proprietary
fonts or substitute Inter/Geist. Display tracking stays between -0.02em and
-0.03em; body tracking stays neutral. The existing `.heading` helper uses Clash
Display at weight 600, 36px on mobile and 48px from the `md` breakpoint.
The larger front-matter display sizes are available design directions, not
global overrides of every heading.

Use a 4px spacing unit, 24px card interiors, 32–48px between related blocks, and
64–96px between sections. Content containers generally cap at 1280px; reading
columns stay near 65–75 characters. Let content determine the grid.

The runtime radius base is `--radius: 0.75rem` (12px). With the default 16px root
font size, Tailwind `rounded-xs/sm/md/lg/xl/2xl/3xl/4xl` resolve to
4/6/8/12/16/24/32/48px. Use 8px controls, 12px cards, and 16px media panels as
the target recipes. `rounded-full` is for avatars, small status indicators, and
segmented controls. Existing explicit pill classes remain until migrated.

## Components, hero, and states

Primary controls use `bg-primary text-primary-foreground` and the paired hover
token `hover:bg-primary-hover`. Secondary controls use the quiet secondary fill;
menu selection uses `bg-accent text-accent-foreground`. Prefer theme-aware tokens
over raw blue, purple, white, or black utilities.

A shared utilities-layer rule maps existing default shadcn buttons and linked
badges to `--primary-hover`. This keeps their hover fill opaque even where the
component still declares `hover:bg-primary/80`, which reduces label contrast.
New component variants should use the explicit semantic hover utility directly.

Cards use `bg-card text-card-foreground` with a 1px decorative border. Dropdowns
use `bg-popover text-popover-foreground`. Inputs use surface fill, `border-input`,
`text-foreground`, and `placeholder:text-muted-foreground`. Focus must remain
visible with a ring/outline and offset; check the composited result if the ring
uses opacity. Errors include a readable message, not only a red border.

Use `home-hero.avif` as a hero-local image when implementing the hero. Keep the
planet horizon and astronaut visible where the crop permits. Put text over a
quiet region of sky and add a local navy scrim when needed for legibility. Fade
the image into `--background`; do not apply the image or its glow to the whole
site. Light layouts can host an explicitly dark hero with its own foreground.

At small widths, stack content, reduce display type toward 36–40px, and preserve
reading order. Touch controls should provide at least 44px targets. Preserve
loading, empty, disabled, validation, and keyboard states during migration.
New motion should respect reduced-motion preferences.

## Adoption status

### Public navigation

The floating public navbar uses `GooeyNav` inside the existing scroll-visibility
wrapper. Its frame follows the surface, border, foreground, and muted-text
tokens. Dark mode pairs a pale `#f2fbfe` pill with navy `#000b27` ink; light mode
reverses that pairing. Blue `#068ce6` is reserved for transition particles.

This is one deliberate interactive motion accent: 7 particles, a 400ms travel
time with 100ms variance, 24px spread, 0.3 gooeyness, and 0.2 wobble. It does not
loop while idle. Route state follows the URL, including detail and preview
routes. Links use Next.js client navigation with global Partial Prefetching.
Public navbar links also prepare their cached URL-specific content; uncached
request-time data stays streamed behind a route-local boundary. Mobile shows
the five icons with accessible link names; desktop includes
labels. Link targets are at least 44px high and wide.

Reduced-motion preferences switch to a static pill immediately, including
changes made while the page is open. Unavailable/lost WebGL uses the same static
fallback; the renderer can recover after context restoration. Keyboard focus
keeps the floating wrapper visible and has a visible outline.

### Logos and avatars

Logo artwork stays in `src/assets/logo/` as SVG files. `Logo` selects the dark
or light artwork using the theme classes and keeps dimensions and alternative
text consistent. The asset hex colors above are the fixed export colors used by
the SVGs and the WebGL shader, which accepts hex input. The optional orb wash
uses a blue ramp; the default orb remains monochrome.

`ProfileAvatar` displays a supplied image when it loads, and uses `LiveOrb` for
missing or failed images. Old URLs for the removed bundled portrait are treated
as empty without making a request. The orb is static CSS by default: no canvas,
WebGL context, theme observer, or animation loop. The large About profile opts
into animation; reduced motion and unavailable WebGL retain a still fallback.
Static automatic-theme orbs use foreground/background tokens directly, including
the server-rendered frame.

`public/images/` contains only `home-hero.avif`. Existing favicon files are
managed separately in `src/app/` and `public/metadata/`.

This update establishes tokens, shared heading styling, radii, selection/caret
colors, quiet scrollbars, and semantic article callouts. It does not install the
hero image into the page or migrate component markup.

Remaining component work is explicit:

- Replace fixed purple RGBA gradients/shadows in featured project/post panels,
  cards, article progress, and the About experience timeline with semantic tokens.
- Replace fixed neutral/white/blue text where it needs to adapt to light mode.
- Replace legacy primary hover utility declarations with `hover:bg-primary-hover`
  as components are edited; the shared rule already covers default shadcn buttons
  and linked badges.
- Adopt the control/card radius recipes where explicit `rounded-3xl`,
  `rounded-4xl`, or arbitrary radii currently override the intended shape.
- Verify actual page crops, text over the hero, popovers, focus opacity, charts,
  and editor styling when those components are migrated. Token previews alone
  do not establish accessibility for the entire application.
