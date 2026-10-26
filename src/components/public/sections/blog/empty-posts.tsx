import Link from "next/link";
import styles from "@/components/public/public-page.module.css";
export function EmptyPosts({ selectedTag }: { selectedTag?: string }) {
  return (
    <section className={styles.empty}>
      <h2>No posts here yet</h2>
      <p>
        {selectedTag
          ? `There are no published posts tagged ${selectedTag}. Try another topic or view all writing.`
          : "New writing will appear here when it’s ready to share."}
      </p>
      {selectedTag && (
        <Link href="/blog" className={styles.link}>
          View all writing
        </Link>
      )}
    </section>
  );
}
