import Link from "next/link";
import styles from "@/components/public/public-page.module.css";
export function EmptyProjects({ selectedTech }: { selectedTech?: string }) {
  return (
    <section className={styles.empty}>
      <h2>No projects found</h2>
      <p>
        {selectedTech
          ? `There are no published projects using ${selectedTech}. Try another stack or view all projects.`
          : "New projects will appear here when they’re ready to share."}
      </p>
      {selectedTech && (
        <Link href="/projects" className={styles.link}>
          View all projects
        </Link>
      )}
    </section>
  );
}
