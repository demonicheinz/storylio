import styles from "@/components/public/public-page.module.css";
import gallery from "./gallery.module.css";

export function GalleryHero() {
  return (
    <header className={gallery.hero}>
      <h1 id="page-title" className={styles.title}>
        Things I’ve captured
      </h1>
      <p className={styles.lede}>
        Places, moments, and details from the work in between.
      </p>
    </header>
  );
}
