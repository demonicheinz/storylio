import { MotionReveal } from "@/components/common/motion";
import styles from "./home.module.css";
export type HomePhase = {
  id: string;
  label: string;
  content: string | null;
  order: number;
};
const fallbackPhases: HomePhase[] = [
  {
    id: "discover",
    label: "Discover",
    content:
      "Clarify the goal, constraints, and user path before a line of production code is written.",
    order: 1,
  },
  {
    id: "build",
    label: "Build",
    content:
      "Shape a fast, accessible interface with a maintainable full-stack foundation.",
    order: 2,
  },
  {
    id: "polish",
    label: "Polish",
    content:
      "Refine motion, edge cases, content, and release details until the experience feels intentional.",
    order: 3,
  },
];
export function ApproachSection({ phases }: { phases: HomePhase[] }) {
  const visiblePhases = phases.length > 0 ? phases : fallbackPhases;
  return (
    <section className={styles.section} aria-labelledby="approach-title">
      <MotionReveal>
        <div className={styles.approach}>
          <div>
            <h2 id="approach-title" className={styles.sectionTitle}>
              How I work
            </h2>
            <p className={styles.intro}>
              A look at the process behind each project.
            </p>
          </div>
          <ol className={styles.phases}>
            {visiblePhases.map((phase, index) => (
              <li key={phase.id} className={styles.phase}>
                <span className={styles.phaseNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={styles.cardTitle}>{phase.label}</h3>
                  {phase.content && (
                    <p className={styles.phaseDescription}>{phase.content}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </MotionReveal>
    </section>
  );
}
