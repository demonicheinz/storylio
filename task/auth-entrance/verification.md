# Auth entrance and independent Home navigation

Owner request: implement a short auth entrance and stop the hero from fading
the Home navbar. This is a local visual change, without commit or push.

- Add AuthEntrance as the existing main landmark. It wraps server-rendered
  children and adds no form loading gate or full-screen overlay.
- Earth and stars fade in together over 700ms without a delay, per the owner's
  latest follow-up. The star wrapper retains its 0.6 brightness. The entire form
  fades from 0.7 opacity and moves 6px over 300ms after an 80ms delay. No field
  staggering, scaling or blur. Filled form controls stay available.
- The Earth animation ends the intro, with a 900ms cleanup limit. Focus,
  pointer interaction, reduced motion, blur and document hiding finish it early.
  CSS focus-within also cancels it before hydration. Returning focus never resets
  the completed state; a new visit may have a new entrance.
- Remove home-nav-enter and its hero-dependent navbar selector. Existing navbar
  scroll visibility and Gooey interactions remain unchanged.
- Preserve the 48-star pool, Earth unoptimized asset, palette and auth repairs.

## Verification

The original browser pass at 1440px and 390px verified Earth 0.7s and grouped
form 0.3s. The latest follow-up synchronizes the star host with Earth's fade and
retains the outer layer's 0.6 opacity; lint and diff checks passed. Browser rerun
was unavailable because localhost:3000 refused the connection. The regression
assertions were updated but have not been rerun for that timing adjustment.
In the preceding browser pass, the completed form was opacity 1
with no transform or animation. Focus
completion and reduced motion passed. Blur/focus did not replay entrance.
Sixteen sampled Home frames during the active hero intro kept navbar opacity 1
and animation none. Keyboard navigation from that navbar to About passed.
Screenshots: signin-1440.png and signin-390.png. Authentication calls were mocked;
no login, email, migration, or content write occurred.

Targeted route/sign-in tests: 20 passed. TypeScript and lint passed. Production
build verifies the client boundary and CSS. Previous full auth tests were not
repeated for this animation-only change. Browser evidence uses Chromium, not
physical mobile hardware. Browser session closes after verification; the user's
development server stays running.

Self-review: accuracy 4/5 (browser frame measurements, one browser engine),
completeness 4/5 (requested behavior checked; no physical-device validation),
clarity 4/5 (one stateful wrapper and three short CSS animations), actionability
5/5 (local UI and repeatable browser check), conciseness 4/5 (evidence kept here).
