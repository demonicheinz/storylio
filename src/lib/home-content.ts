import {
  and,
  eq,
  inArray,
  isNull,
  lte,
  not,
  or,
  type SQLWrapper,
} from "drizzle-orm";
import { PostStatus } from "@/lib/db/enums";
import type { post } from "@/lib/db/schema";

export const HOME_NOTES_TAG = "notes";

/** Apply the category before LIMIT so a run of notes cannot crowd out writing. */
export function homePostWhere(
  table: Pick<typeof post, "id" | "status" | "publishedAt">,
  kind: "writing" | "notes",
  now: Date,
  noteIds: SQLWrapper,
) {
  const isNote = inArray(table.id, noteIds);
  return and(
    eq(table.status, PostStatus.PUBLISHED),
    or(isNull(table.publishedAt), lte(table.publishedAt, now)),
    kind === "notes" ? isNote : not(isNote),
  );
}
