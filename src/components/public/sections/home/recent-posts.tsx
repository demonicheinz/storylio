import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { MotionReveal } from "@/components/common/motion";
import { SectionHeading } from "@/components/common/section-heading";
import { TiltedCard } from "@/components/common/tilted-card";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { calculateReadingTime } from "@/lib/utils";
import styles from "./home.module.css";

export type HomeRecentPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  tags: { id: string; name: string }[];
};
export function RecentPostsSection({ posts }: { posts: HomeRecentPost[] }) {
  return (
    <section className={styles.section} aria-labelledby="writing-title">
      <MotionReveal>
        <div className={styles.sectionHeader}>
          <SectionHeading id="writing-title">Writing</SectionHeading>
          <Link href="/blog" className={styles.sectionLink}>
            All writing <ArrowUpRightIcon size={16} aria-hidden="true" />
          </Link>
        </div>
        {posts.length > 0 ? (
          <div className={styles.cards} data-home-grid="writing">
            {posts.map((post) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className={`group/post ${styles.card}`}
              >
                <TiltedCard amplitude={2.5} scale={1.01}>
                  <BlogCover
                    src={post.coverImage}
                    alt={post.title}
                    appearance="home"
                    className="aspect-video"
                    sizes="(min-width: 1328px) 394px, (min-width: 1200px) calc((100vw - 112px) / 3), (min-width: 768px) calc((100vw - 72px) / 2), calc(100vw - 50px)"
                  />
                </TiltedCard>
                <div className={styles.cardBody}>
                  <div className={styles.metadata}>
                    <span>{calculateReadingTime(post.content)} min read</span>
                  </div>
                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  {post.excerpt && (
                    <p className={styles.summary}>{post.excerpt}</p>
                  )}
                  <span className={styles.cardAction}>
                    Read article{" "}
                    <ArrowUpRightIcon size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            No articles published yet. Check back soon.
          </p>
        )}
      </MotionReveal>
    </section>
  );
}
