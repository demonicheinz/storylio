import {
  ArrowRightIcon,
  ArticleIcon,
  CaretDownIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  FolderOpenIcon,
  ImageIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import styles from "@/features/dashboard/overview/overview.module.css";
import type {
  getDashboardOverview,
  RecentDashboardItem,
} from "@/features/dashboard/overview/queries";

function OverviewHeader() {
  return (
    <header className={styles.header}>
      <div>
        <h1>Overview</h1>
        <p>Pick up where you left off, or start something new.</p>
      </div>
      <div className={styles.actions}>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="lg" />}>
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            <span>New</span>
            <CaretDownIcon data-icon="inline-end" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Create</DropdownMenuLabel>
              <DropdownMenuItem render={<Link href="/dashboard/posts/new" />}>
                <ArticleIcon />
                Post
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/dashboard/projects/new" />}
              >
                <FolderOpenIcon />
                Project
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/gallery" />}>
                <ImageIcon />
                Gallery item
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function RecentActions({ item }: { item: RecentDashboardItem }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={styles.rowAction}
            aria-label={`Open actions for ${item.title}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{item.kind}</DropdownMenuLabel>
          <DropdownMenuItem render={<Link href={item.href} />}>
            <PencilSimpleIcon />
            Edit {item.kind.toLowerCase()}
          </DropdownMenuItem>
          {item.status === "Published" && (
            <DropdownMenuItem
              render={<Link href={item.publicHref} target="_blank" />}
            >
              <EyeIcon />
              View on site
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link
                href={
                  item.kind === "Project"
                    ? "/dashboard/projects"
                    : "/dashboard/posts"
                }
              />
            }
          >
            View all
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RecentItems({
  title,
  description,
  href,
  items,
  createHref,
  empty,
}: {
  title: string;
  description: string;
  href: string;
  items: RecentDashboardItem[];
  createHref: string;
  empty: string;
}) {
  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.panelHeader}>
        <SectionHeading title={title} description={description} />
        <Link
          href={href}
          className={styles.textLink}
          aria-label={`View all ${title.toLowerCase()}`}
        >
          View all
          <ArrowRightIcon aria-hidden="true" />
        </Link>
      </div>
      {items.length ? (
        <ul className={styles.recentList}>
          {items.map((item) => (
            <li key={item.id} className={styles.recentRow}>
              <div className={styles.thumbnail}>
                {item.image ? (
                  <Image
                    src={item.image}
                    fill
                    sizes="64px"
                    className={styles.thumbnailImage}
                    alt=""
                  />
                ) : item.kind === "Project" ? (
                  <FolderOpenIcon aria-hidden="true" />
                ) : (
                  <ArticleIcon aria-hidden="true" />
                )}
              </div>
              <div className={styles.itemBody}>
                <Link className={styles.itemTitle} href={item.href}>
                  {item.title}
                </Link>
                <div className={styles.itemMeta}>
                  <span>{item.kind}</span>
                  <time dateTime={item.updatedAt.toISOString()}>
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(item.updatedAt)}
                  </time>
                  <span>
                    {item.views.toLocaleString("en-US")}{" "}
                    {item.views === 1 ? "view" : "views"}
                  </span>
                </div>
              </div>
              <span className={styles.status} data-status={item.status}>
                <span aria-hidden="true" />
                {item.status}
              </span>
              <RecentActions item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p>{empty}</p>
          <Link href={createHref} className={styles.textLink}>
            {title === "Writing"
              ? "Write your first post"
              : "Add your first project"}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}

export function OverviewFallback() {
  return (
    <div className={styles.page}>
      <OverviewHeader />
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading dashboard overview"
        className={styles.loading}
      >
        <div className={styles.metrics}>
          {[0, 1, 2, 3].map((item) => (
            <div className={styles.metric} key={item}>
              <Skeleton className="w-20 h-4" />
              <Skeleton className="mt-3 w-12 h-7" />
              <Skeleton className="mt-3 w-24 h-3" />
            </div>
          ))}
        </div>
        <div className={styles.columns}>
          {["Writing", "Projects"].map((name) => (
            <section className={styles.panel} key={name}>
              <div className={styles.panelHeader}>
                <SectionHeading title={name} description="Recently updated" />
              </div>
              <div className={styles.recentList}>
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className={styles.loadingRow}>
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="mt-3 w-1/2 h-3" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className={styles.columns}>
          {[0, 1].map((item) => (
            <div key={item} className={styles.panel}>
              <div className={styles.panelHeader}>
                <Skeleton className="w-32 h-5" />
              </div>
              <div className="p-5">
                <Skeleton className="w-full h-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview({
  data,
}: {
  data: Awaited<ReturnType<typeof getDashboardOverview>>;
}) {
  const metrics = [
    {
      label: "Writing",
      value: data.posts.total,
      detail: `${data.posts.published} published · articles & notes`,
      href: "/dashboard/posts",
    },
    {
      label: "Projects",
      value: data.projects.total,
      detail: `${data.projects.published} published`,
      href: "/dashboard/projects",
    },
    {
      label: "Gallery",
      value: data.gallery.total,
      detail: `${data.gallery.visible} visible`,
      href: "/dashboard/gallery",
    },
    {
      label: "Content views",
      value: data.views,
      detail: "All time · articles, notes & projects",
      href: "/dashboard/analytics",
    },
  ];
  const workflow = [
    {
      label: "Draft writing",
      value: data.posts.drafts,
      detail: "Articles and notes saved for later",
      href: "/dashboard/posts?status=draft",
    },
    {
      label: "Draft projects",
      value: data.projects.drafts,
      detail: "Case studies still in progress",
      href: "/dashboard/projects?status=draft",
    },
    {
      label: "Hidden photos",
      value: data.gallery.hidden,
      detail: "Kept in your gallery, off the public site",
      href: "/dashboard/gallery?visibility=hidden",
    },
  ];
  return (
    <div className={styles.page}>
      <OverviewHeader />
      <dl className={styles.metrics}>
        {metrics.map((metric) => (
          <div className={styles.metric} key={metric.label}>
            <dt>
              <Link href={metric.href}>{metric.label}</Link>
            </dt>
            <dd>{metric.value.toLocaleString("en-US")}</dd>
            <dd className={styles.metricDetail}>{metric.detail}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.columns}>
        <RecentItems
          title="Writing"
          description="Recently updated articles and notes"
          href="/dashboard/posts"
          items={data.writing}
          createHref="/dashboard/posts/new"
          empty="Your articles and notes will appear here."
        />
        <RecentItems
          title="Projects"
          description="Recently updated case studies"
          href="/dashboard/projects"
          items={data.work}
          createHref="/dashboard/projects/new"
          empty="Your projects will appear here."
        />
      </div>
      <div className={styles.columns}>
        <section className={styles.panel} aria-label="Work in progress">
          <div className={styles.panelHeader}>
            <SectionHeading
              title="Work in progress"
              description="Private content, ready when you are"
            />
          </div>
          <ul className={styles.inventory}>
            {workflow.map((item) => (
              <li key={item.label}>
                <Link href={item.href}>
                  <div>
                    <span className={styles.inventoryLabel}>{item.label}</span>
                    <p>{item.detail}</p>
                  </div>
                  <span className={styles.inventoryCount}>{item.value}</span>
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.panel} aria-label="On your site">
          <div className={styles.panelHeader}>
            <SectionHeading
              title="On your site"
              description="Content available to visitors"
            />
            <Link href="/" target="_blank" className={styles.textLink}>
              Visit site
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>
          <ul className={styles.inventory}>
            <li>
              <Link href="/dashboard/projects?status=published&featured=featured">
                <div>
                  <span className={styles.inventoryLabel}>
                    Featured projects
                  </span>
                  <p>Published work selected for Home</p>
                </div>
                <span className={styles.inventoryCount}>
                  {data.projects.featured}
                </span>
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </li>
            <li>
              <Link href="/dashboard/gallery?visibility=visible">
                <div>
                  <span className={styles.inventoryLabel}>Visible photos</span>
                  <p>Available in your public gallery</p>
                </div>
                <span className={styles.inventoryCount}>
                  {data.gallery.visible}
                </span>
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
