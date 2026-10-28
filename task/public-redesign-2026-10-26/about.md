# About

Replaced the floating far-left navigation and glass cards with a 1280px two-column
layout: sticky profile/navigation and a reading column. Mobile stacks the profile
above the story. Social links and language choices have 44px targets; experience,
education and skills use separated rows without purple glow. CMS text, EN/ID
selection, full language prefetch and existing section IDs remain unchanged.

Verification: TypeScript and formatting passed. Chromium checked widths 1440,
768, 390 and 320 with one H1/footer, no horizontal overflow, and footer keyboard
return/focus. EN→ID updates the query, active indicator and localized headings.
Desktop/mobile screenshots were inspected. A reduced-motion capture exposed an
existing SSR reveal opacity issue; a shared data marker and preference CSS now
ensure reveal content is visible immediately under reduced motion.
