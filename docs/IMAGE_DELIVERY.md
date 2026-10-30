# Image delivery

Keep uploaded source images in their original format and resolution. Cloudinary
stores the source; Next Image handles responsive variants for ordinary UI images.
Do not repeatedly transcode an already compressed source or upscale a small one.

- Optimized output: WebP. Static backgrounds may use pre-encoded AVIF.
- Quality: 75 for thumbnails; 85 for detail covers and screenshot carousel images.
  Both are allowlisted in `next.config.ts`; constants live in `src/lib/image-policy.ts`.
- Archive and detail `sizes` match their actual containers, grid gaps and padding.
  Set `sizes` from the rendered layout, not the source file width.
- Aim for enough source pixels for the displayed width multiplied by the target
  device pixel ratio. A 600 CSS-pixel cover on a DPR 2 screen needs about 1200 source
  pixels. Higher quality cannot restore detail missing from the source.
- Hero/auth AVIF backgrounds retain their existing `unoptimized` exception. Review
  their dimensions and file weight when replacing them: responsive resizing is bypassed.
- Gallery and screenshot lightboxes keep source URLs for zoom. Their previews use
  optimized delivery; zoom detail is ultimately limited by source resolution.
- Blur data URLs are temporary placeholders only. Do not use them as full-size images.
- Keep SVG for vector logos. Preserve alpha when converting transparent raster assets.

When checking sharpness, wait for the final image to load, then inspect its natural
dimensions, rendered size, DPR and network response. Compare 75/85 at the same
output dimensions before raising quality. Do not enable `unoptimized` globally.

References: [Next Image](https://nextjs.org/docs/app/api-reference/components/image),
[responsive images](https://web.dev/learn/images/responsive-images).
