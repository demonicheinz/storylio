import Link from "next/link";
import styles from "@/components/public/public-page.module.css";
export function EmptyPosts({ selectedTag }: { selectedTag?: string }) {
  const notes = selectedTag === "notes";
  return (
    <section className={styles.empty}>
      <h2>{notes ? "No notes yet" : "No articles found"}</h2>
      <p>
        {notes
          ? "Short reflections will appear here when they’re ready to share."
          : selectedTag
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
