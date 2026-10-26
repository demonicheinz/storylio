import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { MotionReveal } from "@/components/common/motion";
import { SectionHeading } from "@/components/common/section-heading";
import { formatDate } from "@/lib/utils";
import styles from "./home.module.css";
import type { HomeRecentPost } from "./recent-posts";

export function NotesSection({ posts }: { posts: HomeRecentPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="notes-title">
      <MotionReveal>
        <div className={styles.sectionHeader}>
          <SectionHeading id="notes-title">Notes from building</SectionHeading>
          <Link href="/blog?tag=notes" className={styles.sectionLink}>
            All notes <ArrowUpRightIcon size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.notes} data-home-grid="notes">
          {posts.map((post) => (
            <article key={post.id} className={styles.note}>
              <h3 className={styles.cardTitle}>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              {post.excerpt && <p>{post.excerpt}</p>}
              <div className={styles.metadata}>
                <time
                  dateTime={(post.publishedAt ?? post.createdAt).toISOString()}
                >
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </time>
              </div>
            </article>
          ))}
        </div>
      </MotionReveal>
    </section>
  );
}
