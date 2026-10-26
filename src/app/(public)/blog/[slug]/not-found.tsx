import Link from "next/link";
import styles from "@/components/public/public-page.module.css";
import { PublicState } from "@/components/public/public-state";
export default function ArticleNotFound() {
  return (
    <PublicState
      title="This article isn’t available."
      description="It may have moved or is no longer published. Browse the writing archive for the posts currently available."
      code="404"
    >
      <Link href="/blog" className={styles.link}>
        Back to writing
      </Link>
      <Link href="/projects" className={styles.link}>
        Explore projects
      </Link>
    </PublicState>
  );
}
