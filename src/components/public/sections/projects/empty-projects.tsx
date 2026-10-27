import styles from "@/components/public/public-page.module.css";
export function EmptyProjects({
  selectedTechnologies,
}: {
  selectedTechnologies: string[];
}) {
  return (
    <section className={styles.empty}>
      <h2>No projects found</h2>
      <p>
        {selectedTechnologies.length
          ? `No published project uses ${selectedTechnologies.join(" + ")} together. Remove a technology or reset the stack above.`
          : "New projects will appear here when they’re ready to share."}
      </p>
    </section>
  );
}
