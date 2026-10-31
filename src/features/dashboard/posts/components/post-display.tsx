import {
  ArticleIcon,
  ClockIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { isPublished, isScheduled, postHref } from "../presentation";
import type { DashboardPost } from "../types";
import { PostDeleteButton } from "./post-delete-button";

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function StatusBadge({
  post,
  now,
  compact = false,
}: {
  post: DashboardPost;
  now: number;
  compact?: boolean;
}) {
  const published = isPublished(post, now);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 bg-surface px-2 border border-border rounded-md h-6 font-medium text-xs",
        published
          ? "text-success"
          : isScheduled(post, now)
            ? "text-brand-soft"
            : "text-muted-foreground",
        compact && "px-2",
      )}
    >
      {isScheduled(post, now) ? (
        <ClockIcon className="size-3" aria-hidden />
      ) : (
        <span
          className={cn(
            "rounded-full size-1.5 shrink-0",
            published ? "bg-success" : "bg-muted-foreground",
          )}
        />
      )}
      {isScheduled(post, now) ? "Scheduled" : published ? "Published" : "Draft"}
    </span>
  );
}

export function PostThumbnail({
  post,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw",
}: {
  post: DashboardPost;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative bg-muted/30 border border-border/60 rounded-xl aspect-video overflow-hidden",
        className,
      )}
    >
      {post.coverImage && !failed ? (
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          <ArticleIcon className="size-8" />
        </div>
      )}
    </div>
  );
}

export function PostActions({
  post,
  now,
  align = "end",
  overlay = false,
}: {
  post: DashboardPost;
  now: number;
  align?: "start" | "end";
  overlay?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant={overlay ? "secondary" : "ghost"}
            className={cn(
              "size-11",
              overlay &&
                "bg-popover/80 border-border shadow-sm hover:bg-surface-hover/90",
            )}
            aria-label={`Open actions for ${post.title}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Post</DropdownMenuLabel>
          <DropdownMenuLabel>
            Created {formatDateTime(post.createdAt)}
          </DropdownMenuLabel>
          {isPublished(post, now) && (
            <DropdownMenuItem
              render={<Link href={postHref(post)} target="_blank" />}
            >
              <EyeIcon data-icon="inline-start" />
              View live
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            render={<Link href={`/dashboard/posts/${post.id}/edit`} />}
          >
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <PostDeleteButton
            triggerNativeButton={false}
            postId={post.id}
            title={post.title}
            trigger={
              <DropdownMenuItem variant="destructive" closeOnClick={false}>
                <TrashIcon data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TagPills({
  tags,
  limit = 3,
}: {
  tags: Array<{ name: string }>;
  limit?: number;
}) {
  const visibleTags = tags.slice(0, limit);
  const remaining = tags.length - visibleTags.length;

  if (tags.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground text-xs">
        No tags
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 min-w-0">
      {visibleTags.map((tag) => (
        <Badge
          key={tag.name}
          variant="secondary"
          className="max-w-32 text-xs truncate"
        >
          {tag.name}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
