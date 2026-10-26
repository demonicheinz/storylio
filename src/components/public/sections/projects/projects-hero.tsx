import styles from "@/components/public/public-page.module.css";
export function ProjectsHero({
  totalProjects,
  totalTech,
  selectedTech,
}: {
  totalProjects: number;
  totalTech: number;
  selectedTech?: string;
}) {
  return (
    <header className={styles.hero}>
      <h1 id="page-title" className={styles.title}>
        Projects I’ve built
      </h1>
      <p className={styles.lede}>
        Web apps, interfaces, and experiments. Open a project to see what I
        worked on and how it came together.
      </p>
      <p className={styles.meta}>
        {totalProjects} published projects <span aria-hidden="true">/</span>{" "}
        {totalTech} technologies{" "}
        {selectedTech && <span>Filtered by {selectedTech}</span>}
      </p>
    </header>
  );
}
