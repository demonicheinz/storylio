import styles from "@/components/public/public-page.module.css";
export function BlogHero({
  totalPosts,
  totalTags,
  selectedTag,
}: {
  totalPosts: number;
  totalTags: number;
  selectedTag?: string;
}) {
  return (
    <header className={styles.hero}>
      <h1 id="page-title" className={styles.title}>
        Notes from building
      </h1>
      <p className={styles.lede}>
        Things I’ve learned, decisions I’ve made, and details I want to remember
        while building for the web.
      </p>
      <p className={styles.meta}>
        {totalPosts} published posts <span aria-hidden="true">/</span>{" "}
        {totalTags} topics{" "}
        {selectedTag && <span>Filed under {selectedTag}</span>}
      </p>
    </header>
  );
}
