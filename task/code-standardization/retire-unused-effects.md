# Retire unused visual effects

The user explicitly approved removing four legacy effects and dependencies that
have no remaining consumers. Source and test import searches found no application
usage of FloatingDots, CanvasRevealEffect, TextGenerateEffect or Spotlight. Their
only production reference was the effects/index.ts re-export barrel, itself unused.
CanvasReveal was the sole @react-three/fiber/three consumer. No CSS/CLI consumer
was assumed absent solely from JavaScript: the repository was also searched for
package/effect references, and the active GravityStars/Venom boundaries were read.

Delete the four modules and unused barrel. Remove the new audit fixture's dormant
FloatingDots branch so it tests only the actual active starfield. Bun remove with
scripts disabled removes @react-three/fiber, three and @types/three and generates
the lockfile. No runtime effect or page is replaced, and no user data is removed.
GravityStars, Venom and their native canvas/WebGL dependencies remain.

Frozen-lockfile install passed without changes. Lint/TypeScript passed. Audit
retains the documented low deepmerge advisory; no suppression or force-upgrade.
Full suite/build results are appended when complete. No real DB/seed/provider
operation was performed; PGlite tests use local synthetic databases.

Review: deleting dead APIs removes maintenance/dependency surface rather than
moving complexity. No existing caller needs migration. Archived task/reference
documents are historical and are not rewritten to pretend these modules never
existed. Self-evaluation: accuracy 4/5 (consumer searches and dependency diff),
completeness 4/5 (approved effects removed, broader cleanup remains), clarity 4/5
(retirement reason explicit), actionability 4/5 (Bun-generated lock verification),
conciseness 4/5 (deletion instead of maintaining unused abstractions).

Final results: full Vitest **104 files / 792 tests passed**, 382.05 seconds.
Production build passed (38/38 pages), and normal lint/TypeScript/whitespace checks
passed. The lockfile removed 18 package entries, including the three direct
dependencies. This is dependency/maintenance reduction; no active-page speedup is
claimed because the removed modules were already unreferenced by active pages.
