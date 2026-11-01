# Public search metadata

The public site name is **Heinz**. Storylio remains the application name and can
remain in page titles. `src/lib/site.ts` supplies the shared site name and origin
for metadata, homepage WebSite JSON-LD, robots.txt and sitemap.xml.

Set `NEXT_PUBLIC_SITE_URL` to the preferred public origin (`https://heinz.id` for
production). It is a build-time value; changing it requires a new build. Vercel
preview deployment access/indexing controls remain separate from canonical URLs.

Each public route declares its own canonical. Blog and Projects preserve
normalized content filters and pagination, while omitting unrelated parameters.
Archive canonicals use the content reader's resolved pagination page, including
when a requested page exceeds the available results or the collection is empty.
Notes keep their expandable collection UI: legacy `/blog/<note>` links redirect
to that collection and are excluded from the sitemap.

Sitemap detail dates use stored `updatedAt` values. Static/collection entries
omit `lastmod` because there is no authoritative timestamp covering all their
content and presentation changes. Do not replace those omissions with build time.
The homepage Writing cards omit article dates; article pages retain their dates.
This reduces ambiguity about the homepage's date without inventing a new one.

Public route and section motion starts with visible content, preserving vertical
movement while avoiding an opacity-zero dependency on JavaScript. This does not
make every interactive feature work without JavaScript.
Local Chromium verification also found that Next.js streamed Suspense content
remains inside a hidden segment with JavaScript disabled. The motion change does
not remove that framework dependency. Inspect Google's rendered screenshot after
deployment rather than claiming complete no-JavaScript rendering support.

## Verification after deployment

1. Inspect the homepage's rendered HTML for a single canonical, `og:site_name`
   and a native `application/ld+json` WebSite script with the public origin.
2. Validate WebSite data with [Schema Markup Validator](https://validator.schema.org/).
   Google's Rich Results Test does not validate site names.
3. Check `/robots.txt` advertises `/sitemap.xml`, then submit that sitemap in
   Search Console. Check an article modified after publication uses its edit date.
4. Inspect representative homepage, archive page 2, article and project URLs in
   Search Console. Compare the declared canonical with Google's selected canonical
   and review the rendered screenshot. Request indexing for important changed URLs.

Google decides the displayed site name, date and canonical after recrawling.
These changes do not guarantee a particular search appearance or ranking.

## Image discovery

The sitemap associates visible Gallery photos, published article covers, project
archive thumbnails, project covers/screenshots, and the public About portrait
with their landing pages. Image URLs are absolute, deduplicated and restricted
to HTTP(S). Hidden Gallery items, draft/scheduled posts and draft projects are
excluded. Original CDN URLs are used rather than temporary optimizer variants.
Image URL query separators are XML-escaped for the installed Next.js serializer;
stored source URLs and signed query values are unchanged. A regression test runs
the installed serializer so a future framework escaping change is detectable.

The About portrait uses Next.js Image and renders an image in server HTML with
explicit dimensions, responsive sizes (96px on mobile, 144px otherwise) and
descriptive alt text. Local and HTTPS Cloudinary sources use the image optimizer;
other hosts retain direct delivery without expanding the optimizer allowlist.
All image hosts remain subject to CSP. It keeps the shared orb fallback for an absent/removed
portrait or a failed image request. Dashboard avatars keep their existing behavior.

Replace Cloudinary demo images through the CMS with actual photographs or work.
Write captions and alt text describing what each image really shows. Avoid
inventing a subject from a filename or filling decorative images with keywords.
The code does not replace existing CMS assets or rewrite their descriptions.

After deployment, inspect `/gallery` and `/about` in Search Console and verify
image URLs respond successfully. Submit the updated image-inclusive sitemap.
The `site:` image search is not a complete inventory of indexed images, and a
sitemap does not guarantee indexing or ranking.

References: [site names](https://developers.google.com/search/docs/appearance/site-names),
[byline dates](https://developers.google.com/search/docs/appearance/publication-dates),
[sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[Next.js JSON-LD](https://nextjs.org/docs/app/guides/json-ld).
