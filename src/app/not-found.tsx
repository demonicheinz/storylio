import Link from "next/link";
import styles from "@/components/public/public-page.module.css";
import { PublicState } from "@/components/public/public-state";
export default function NotFound() {
  return (
    <PublicState
      title="This page isn’t here."
      description="The address may be incorrect, or the page may have moved. You can return home or browse the published work."
      code="404"
    >
      <Link href="/" className={styles.link}>
        Back to home
      </Link>
      <Link href="/projects" className={styles.link}>
        Explore projects
      </Link>
    </PublicState>
  );
}
