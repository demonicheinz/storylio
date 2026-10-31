"use client";

import {
  ArrowSquareOutIcon,
  BriefcaseIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  SparkleIcon,
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
import { formatDateTime, isPublished } from "../presentation";
import type { DashboardProject } from "../types";
import { ProjectDeleteButton } from "./project-delete-button";

export function ProjectStatusBadge({
  project,
  compact = false,
}: {
  project: DashboardProject;
  compact?: boolean;
}) {
  const published = isPublished(project);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 bg-surface px-2 border border-border rounded-md h-6 font-medium text-xs",
        published ? "text-success" : "text-muted-foreground",
        compact && "px-2",
      )}
    >
      <span
        className={cn(
          "rounded-full size-1.5 shrink-0",
          published ? "bg-success" : "bg-muted-foreground",
        )}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export function FeaturedProjectBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 bg-surface px-2 border border-border rounded-md h-6 font-medium text-brand-soft text-xs">
      <SparkleIcon className="size-3" aria-hidden="true" />
      Featured
    </span>
  );
}

export function ProjectUpdatedAt({ value }: { value: Date }) {
  const date = new Date(value);
  return (
    <time
      dateTime={date.toISOString()}
      className="flex flex-col gap-1 whitespace-nowrap"
    >
      <span>
        {new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(date)}
      </span>
      <span className="text-xs">
        {new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }).format(date)}
      </span>
    </time>
  );
}

export function ProjectThumbnail({
  project,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw",
}: {
  project: DashboardProject;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const image = project.thumbnailImageUrl ?? project.coverImage;

  return (
    <div
      className={cn(
        "relative bg-muted/30 border border-border/60 rounded-xl aspect-video overflow-hidden",
        className,
      )}
    >
      {image && !failed ? (
        <Image
          src={image}
          alt={project.title}
          fill
          className="object-cover"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex justify-center items-center bg-muted h-full text-muted-foreground">
          <BriefcaseIcon className="size-8" />
        </div>
      )}
    </div>
  );
}

export function TechPills({
  techStack,
  limit = 4,
}: {
  techStack: string[];
  limit?: number;
}) {
  const visible = techStack.slice(0, limit);
  const remaining = techStack.length - visible.length;

  if (techStack.length === 0) {
    return <span className="text-muted-foreground text-xs">No tech stack</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 min-w-0">
      {visible.map((tech) => (
        <Badge
          key={tech}
          variant="outline"
          className="max-w-28 text-xs truncate"
        >
          {tech}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-muted-foreground text-xs">+{remaining} more</span>
      )}
    </div>
  );
}

export function ProjectActions({
  project,
  align = "end",
  overlay = false,
}: {
  project: DashboardProject;
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
            aria-label={`Open actions for ${project.title}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Project</DropdownMenuLabel>
          <DropdownMenuLabel>
            Created {formatDateTime(project.createdAt)}
          </DropdownMenuLabel>
          {isPublished(project) && (
            <DropdownMenuItem
              render={
                <Link href={`/projects/${project.slug}`} target="_blank" />
              }
            >
              <ArrowSquareOutIcon data-icon="inline-start" />
              View live
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            render={<Link href={`/dashboard/projects/${project.id}/edit`} />}
          >
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ProjectDeleteButton
            triggerNativeButton={false}
            projectId={project.id}
            title={project.title}
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
