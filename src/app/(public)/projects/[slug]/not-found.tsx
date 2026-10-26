import Link from "next/link";
import styles from "@/components/public/public-page.module.css";
import { PublicState } from "@/components/public/public-state";
export default function ProjectNotFound() {
  return (
    <PublicState
      title="This project isn’t available."
      description="It may have moved or is no longer published. Browse the archive for the work currently available."
      code="404"
    >
      <Link href="/projects" className={styles.link}>
        Back to projects
      </Link>
    </PublicState>
  );
}
