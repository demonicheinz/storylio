import styles from "@/components/public/public-page.module.css";
import projectStyles from "./projects.module.css";
export function ProjectsHero() {
  return (
    <header className={projectStyles.hero}>
      <h1 id="page-title" className={styles.title}>
        Projects I’ve built
      </h1>
      <p className={styles.lede}>
        Web apps, interfaces, and experiments, with the work and decisions
        behind each one.
      </p>
    </header>
  );
}
