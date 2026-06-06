import { db } from "@/lib/db";
import {
  assertBackfillEnvironment,
  buildImageUpdate,
  type ImageFields,
  isComplete,
  parseBackfillOptions,
  resolveImageFields,
} from "./backfill-utils";

async function main() {
  assertBackfillEnvironment();
  const options = parseBackfillOptions(process.argv.slice(2));
  const [records, media] = await Promise.all([
    db.galleryItem.findMany({
      where: options.force
        ? undefined
        : {
            OR: [
              { width: null },
              { height: null },
              { aspectRatio: null },
              { blurDataUrl: null },
            ],
          },
      orderBy: { createdAt: "asc" },
      take: options.limit,
    }),
    db.media.findMany({
      select: {
        url: true,
        publicId: true,
        width: true,
        height: true,
        aspectRatio: true,
        blurDataUrl: true,
      },
    }),
  ]);
  const mediaByUrl = new Map(media.map((item) => [item.url, item]));
  const summary = {
    totalScanned: records.length,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  console.log(
    `Gallery backfill: ${records.length} record(s)${options.dryRun ? " (dry run)" : ""}`,
  );
  for (const [index, record] of records.entries()) {
    const label = `[${index + 1}/${records.length}] ${record.id}`;
    try {
      if (!options.force && isComplete(record)) {
        summary.skipped++;
        console.log(`${label} skipped: metadata complete`);
        continue;
      }
      const match = mediaByUrl.get(record.imageUrl);
      const resolved: Partial<ImageFields> = match ? { ...match } : {};
      if (
        options.force ||
        !resolved.width ||
        !resolved.height ||
        !resolved.aspectRatio ||
        !resolved.blurDataUrl
      ) {
        Object.assign(
          resolved,
          await resolveImageFields({
            url: record.imageUrl,
            publicId: match?.publicId,
            needsBlur:
              options.force || (!record.blurDataUrl && !resolved.blurDataUrl),
          }),
        );
      }
      const update = buildImageUpdate(record, resolved, options.force);
      if (Object.keys(update).length === 0) {
        summary.skipped++;
        console.log(`${label} skipped: no metadata resolved`);
        continue;
      }
      if (!options.dryRun)
        await db.galleryItem.update({ where: { id: record.id }, data: update });
      summary.updated++;
      console.log(
        `${label} ${options.dryRun ? "would update" : "updated"}: ${Object.keys(update).join(", ")}`,
      );
    } catch (error) {
      summary.failed++;
      console.error(
        `${label} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  console.log("Gallery summary:", summary);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
