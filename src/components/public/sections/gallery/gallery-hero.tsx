import styles from "@/components/public/public-page.module.css";
export function GalleryHero({
  totalItems,
  totalCategories,
}: {
  totalItems: number;
  totalCategories: number;
}) {
  return (
    <header className={styles.hero}>
      <h1 id="page-title" className={styles.title}>
        Things I’ve captured
      </h1>
      <p className={styles.lede}>
        Places, moments, and details from the work in between. A visual
        collection, one frame at a time.
      </p>
      <p className={styles.meta}>
        {totalItems} frames <span aria-hidden="true">/</span> {totalCategories}{" "}
        categories
      </p>
    </header>
  );
}
