import { asc, eq, sql } from "drizzle-orm";
import { QueryBuilder } from "drizzle-orm/pg-core";
import { type postToTag, tag } from "./schema";

const queryBuilder = new QueryBuilder();

export function orderPostTagsByName(link: { tagId: typeof postToTag.tagId }) {
  return [
    asc(
      sql`(${queryBuilder.select({ name: tag.name }).from(tag).where(eq(tag.id, link.tagId))})`,
    ),
  ];
}

/** Keep the flat tag array exposed by content queries before the ORM migration. */
export function flattenPostTags<T extends { tags: { tag: object }[] }>(
  row: T,
): Omit<T, "tags"> & { tags: T["tags"][number]["tag"][] } {
  return { ...row, tags: row.tags.map((link) => link.tag) };
}

/** Match a literal substring rather than treating user input as LIKE wildcards. */
export function containsPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}
