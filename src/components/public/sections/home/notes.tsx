import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { MotionReveal } from "@/components/common/motion";
import { SectionHeading } from "@/components/common/section-heading";
import { NotesCollection } from "@/components/public/notes/notes-collection";
import { getWritingTag } from "@/lib/writing-filters";
import styles from "./home.module.css";
import type { HomeRecentPost } from "./recent-posts";

export async function NotesSection({
  posts,
  searchParams,
}: {
  posts: HomeRecentPost[];
  searchParams?: Promise<{ note?: string | string[] }>;
}) {
  if (!posts.length) return null;
  const selectedSlug = getWritingTag((await searchParams)?.note);
  return (
    <section
      id="notes"
      tabIndex={-1}
      className={styles.section}
      aria-labelledby="notes-title"
    >
      <MotionReveal>
        <div className={styles.sectionHeader}>
          <SectionHeading id="notes-title">Notes from building</SectionHeading>
          <Link href="/blog?tag=notes" className={styles.sectionLink}>
            All notes <ArrowUpRightIcon size={16} aria-hidden="true" />
          </Link>
        </div>
        <NotesCollection posts={posts} selectedSlug={selectedSlug} home />
      </MotionReveal>
    </section>
  );
}
