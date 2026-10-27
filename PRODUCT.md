# Storylio

<!-- impeccable:product-schema 1 -->

## Platform

web

## Product purpose

A personal portfolio for Ahmad Haizul Amany (Heinz), with project case studies,
writing, photography, and a private CMS. Visitors can explore the work and
learn about its author. The owner manages published content through the dashboard.

## Capabilities and constraints

- Existing public routes: Home, About, Projects, Blog, and Gallery.
- Keep real CMS content, publication rules, client navigation, Cache Components,
  Partial Prefetching, and the HTTP 404 guard for missing detail pages.
- Home notes are personal reflections about work, as confirmed by the owner.
  They use published blog posts with the exact tag `notes`.
- Empty notes are hidden. Do not invent reflections, projects, quotes, or clients.
- Notes open a complete reading dialog on Home and the `?tag=notes` archive.
  Shared links use `/blog?tag=notes&note=<slug>`; there is no full-page CTA.
- Existing testimonial data stays in the CMS even though Home no longer uses it.
- The priority audience beyond portfolio visitors has not been specified.

## Brand commitments

Keep Storylio/Heinz identity, existing Clash Display, Satoshi and JetBrains Mono
fonts, the supplied planet hero, installed logo/favicon assets, GooeyNav, and
the approved upstream Venom CTA. Home is the first stage of a wider redesign.
The footer has a separate dark navy surface so its scroll reveal is visible.
