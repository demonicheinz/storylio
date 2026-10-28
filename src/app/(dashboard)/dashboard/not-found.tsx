import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import styles from "@/components/common/error-state.module.css";

export default function DashboardNotFound() {
  return (
    <section className={styles.page} aria-labelledby="missing-cms-title">
      <div className={styles.content}>
        <h1 id="missing-cms-title">CMS item not found</h1>
        <p>
          The requested item may have been deleted, or the dashboard link is no
          longer valid.
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primary}>
            <ArrowLeftIcon size={18} aria-hidden="true" />
            Dashboard overview
          </Link>
        </div>
      </div>
    </section>
  );
}
