# Home content

## Hero headline and subheadline

The Home component and prepared server action use `headline` and `subheadline`.
The existing profile `bio` remains the storage for subheadline; its current text
is read on Home again. No bio content is discarded or renamed in the database.
The singleton HomeSection `id=home-hero`, type `HERO`, stores the headline in its
label. Empty/missing content uses the defaults in `src/lib/home-hero.ts`.
The Settings bio editor remains as-is until the dashboard follow-up. A dedicated
authenticated `actionUpdateHomeHero` validates and saves both fields atomically
and invalidates profile/Home caches. No new dashboard controls are added yet.

Run the reviewed `0001_home_hero` migration in the intended environment before
saving a custom headline. It adds only the HERO enum value, with no data rewrite.
Home reads remain compatible before that migration because the headline lookup
uses the singleton ID, rather than a parameter cast to the new enum value.
The Venom CTA is now the single “Selected projects” anchor; it respects reduced
motion and preserves repeated hash navigation and Back history.

## Notes from building

Create a post through the existing dashboard editor. Add the tag `notes`
(exact lowercase spelling), write a title and excerpt, and publish it when ready.
The excerpt is the body of the note card; the title opens the complete article.
The usual publication status/date rules apply.

Home shows up to three notes and up to three other articles. Category filtering
happens in SQL before the limit, so the lists do not duplicate each other and
neither list starves the other. The notes archive is `/blog?tag=notes`.
When there are no published notes, Home hides the section.

No existing posts were retagged and no testimonial data was deleted.

For initial Storylio notes, run `bun run db:seed` and choose **8: Storylio work
notes**. This adds three published, notes-tagged posts grounded in the image,
Venom and tech-stack decisions made for this site. The seed creates missing
slugs only; existing titles, content, drafts, tags, publication dates and views
are never overwritten. The notes remain editable through the usual post editor.
The CLI does not invalidate the running app's Next.js cache. Hard-refresh local
dev after seeding; a deployed app needs its normal revalidation or a fresh build.

## My usual stack

Use Dashboard → Home → Tech / Client. Add/edit a logo, select **Technology**,
and enable **Show in Home tech stack**. The name, image and display order remain
editable. Any technology name can be used without editing code. Client logos
remain saved in the dashboard and do not appear in the tech stack. Disable the
Home switch to hide an item without deleting it.

Existing unconfigured records retain their previous visibility through the
legacy normalized-name defaults. A duplicate visible name is shown only once,
in CMS order. The settings reuse LOGO's existing content field as a versioned
JSON document (`kind: home-logo`, `version: 1`), preserving its previous text as
description. PHASE content stays plain text. No schema migration is required.

Custom CMS images take priority. Next.js, React, TypeScript, Node.js and
PostgreSQL have bundled Simple Icons SVGs. Other supported names use a code
symbol if their saved image fails. Names remain visible if an image fails.
The five bundled technologies can be saved without uploading a logo.

One row shows at most 6 desktop, 4 tablet and 3 mobile logos. Logos wipe every
five seconds indefinitely, including when every item fits in one group. Extra
groups rotate and return to the first group after the last. The reference's
920ms staggered wipe remains. There are
no visible navigation buttons. Hover/focus pauses rotation; swipe or focus the
row and use arrow keys (Home/End also work) to change views. Reduced motion
keeps the view still and supports the same manual navigation. The last view
stays filled by including some logos from the previous view when necessary.

## Content quality

The developer environment currently includes demo project/article images.
The redesign preserves those images and content; they were not replaced with
fabricated production case studies.
