import page from "@/components/public/public-page.module.css";
import styles from "./blog.module.css";
export function BlogHero({
  selectedTag,
}: {
  totalPosts: number;
  totalTags: number;
  selectedTag?: string;
}) {
  const notes = selectedTag === "notes";
  return (
    <header className={styles.hero}>
      <h1 id="page-title" className={page.title}>
        {notes ? "Notes from building" : "Writing"}
      </h1>
      <p className={page.lede}>
        {notes
          ? "Short reflections on the work, decisions, and things I want to remember."
          : "Things I’ve learned, decisions I’ve made, and details I want to remember while building for the web."}
      </p>
    </header>
  );
}
