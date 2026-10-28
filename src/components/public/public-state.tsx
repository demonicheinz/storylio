import type { ReactNode } from "react";
import styles from "./public-page.module.css";

export function PublicState({
  title,
  description,
  code,
  children,
}: {
  title: string;
  description: string;
  code?: string;
  children: ReactNode;
}) {
  return (
    <main
      className={`${styles.page} ${styles.state}`}
      data-public-page="status"
    >
      <section className={styles.container}>
        <h1 id="page-title" className={styles.title}>
          {title}
        </h1>
        {code && <p className={styles.statusCode}>{code}</p>}
        <p className={styles.lede}>{description}</p>
        <div className={styles.cardActions}>{children}</div>
      </section>
    </main>
  );
}
