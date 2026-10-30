import page from "@/components/public/public-page.module.css";
import { IMAGE_QUALITY, PUBLIC_COVER_IMAGE_SIZES } from "@/lib/image-policy";
import { calculateReadingTime, formatDate } from "@/lib/utils";
import styles from "./article.module.css";
import { BlogCover } from "./blog-cover";
import type { BlogPostListItem } from "./types";
import { ViewCounter } from "./view-counter";
export function ArticleHeader({ post }: { post: BlogPostListItem }) {
  const publishedAt = post.publishedAt ?? post.createdAt;
  return (
    <div className={styles.overview}>
      <header className={styles.header}>
        <h1 id="page-title" className={page.title}>
          {post.title}
        </h1>
        {post.excerpt && <p className={page.lede}>{post.excerpt}</p>}
      </header>
      {post.coverImage && (
        <div className={styles.cover}>
          <BlogCover
            src={post.coverImage}
            alt={post.title}
            fetchPriority="high"
            loading="eager"
            className="aspect-video"
            sizes={PUBLIC_COVER_IMAGE_SIZES}
            quality={IMAGE_QUALITY.detail}
          />
        </div>
      )}
      <div className={styles.meta}>
        <div className={page.meta}>
          <time dateTime={publishedAt.toISOString()}>
            {formatDate(publishedAt)}
          </time>
          <span>{calculateReadingTime(post.content)} min read</span>
          <span>
            <ViewCounter slug={post.slug} initialViews={post.viewCount} />
          </span>
        </div>
        <ul className={page.tags} aria-label="Topics">
          {post.tags.map((tag) => (
            <li key={tag.id} className={page.tag}>
              {tag.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
