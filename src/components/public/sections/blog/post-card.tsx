import { FlowButton } from "@/components/common/flow-button";
import { TiltedCard } from "@/components/common/tilted-card";
import page from "@/components/public/public-page.module.css";
import { calculateReadingTime, formatDate } from "@/lib/utils";
import styles from "./blog.module.css";
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
    <article className={page.card} data-post-card data-tilt-target>
      <div className={page.cardMedia}>
        <TiltedCard amplitude={2.5} scale={1.01}>
          <BlogCover
            src={post.coverImage}
            alt={post.title}
            appearance="home"
            className="aspect-video"
            loading={featured ? "eager" : "lazy"}
            sizes="(min-width:1328px) 400px, (min-width:1200px) 31vw, (min-width:768px) 46vw, 94vw"
          />
        </TiltedCard>
      </div>
      <div className={page.cardBody}>
        <div className={page.meta}>
          <time dateTime={(post.publishedAt ?? post.createdAt).toISOString()}>
            {formatDate(post.publishedAt ?? post.createdAt)}
          </time>
          <span>{calculateReadingTime(post.content)} min read</span>
        </div>
        <h2 className={`${page.cardTitle} ${styles.title}`}>{post.title}</h2>
        <p
          className={`${page.cardCopy} ${styles.excerpt}`}
          aria-hidden={post.excerpt ? undefined : true}
        >
          {post.excerpt}
        </p>
        <ul className={`${page.tags} ${styles.topics}`} aria-label="Topics">
          {post.tags.slice(0, 3).map((tag) => (
            <li key={tag.id} className={page.tag}>
              {tag.name}
            </li>
          ))}
          {post.tags.length > 3 && (
            <li
              className={page.tag}
              aria-label={`${post.tags.length - 3} more topics`}
            >
              +{post.tags.length - 3}
            </li>
          )}
        </ul>
        <FlowButton href={href}>Read article</FlowButton>
      </div>
    </article>
  );
}
