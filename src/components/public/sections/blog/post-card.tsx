import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { TiltedCard } from "@/components/common/tilted-card";
import styles from "@/components/public/public-page.module.css";
import { calculateReadingTime, formatDate } from "@/lib/utils";
import { BlogCover } from "./blog-cover";
import type { BlogPostListItem } from "./types";
export function PostCard({
  post,
  featured = false,
}: {
  post: BlogPostListItem;
  featured?: boolean;
}) {
  const href = `/blog/${post.slug}`;
  return (
    <article
      className={`${styles.card} ${featured ? styles.feature : ""} ${featured && !post.coverImage ? styles.textFeature : ""}`}
      data-post-card
    >
      {post.coverImage && (
        <Link href={href} aria-label={post.title} className={styles.cardMedia}>
          <TiltedCard amplitude={2.5} scale={1.01}>
            <BlogCover
              src={post.coverImage}
              alt={post.title}
              appearance="home"
              className="aspect-video"
              loading={featured ? "eager" : "lazy"}
              sizes={
                featured
                  ? "(min-width:1024px) 720px, 96vw"
                  : "(min-width:1328px) 400px, (min-width:1200px) 31vw, (min-width:768px) 46vw, 94vw"
              }
            />
          </TiltedCard>
        </Link>
      )}
      <div className={styles.cardBody}>
        <div className={styles.meta}>
          <time dateTime={(post.publishedAt ?? post.createdAt).toISOString()}>
            {formatDate(post.publishedAt ?? post.createdAt)}
          </time>
          <span>{calculateReadingTime(post.content)} min read</span>
        </div>
        <Link href={href}>
          <h2 className={styles.cardTitle}>{post.title}</h2>
        </Link>
        {post.excerpt && <p className={styles.cardCopy}>{post.excerpt}</p>}
        <ul className={styles.tags} aria-label="Topics">
          {post.tags.map((tag) => (
            <li key={tag.id} className={styles.tag}>
              {tag.name}
            </li>
          ))}
        </ul>
        <Link href={href} className={`${styles.link} mt-auto`}>
          Read article <ArrowUpRightIcon size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
