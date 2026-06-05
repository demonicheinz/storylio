"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowSquareOutIcon,
  DotsSixVerticalIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectStatus } from "@/generated/prisma";
import { formatDate } from "@/lib/utils";
import { actionReorderProjects } from "../actions";
import { ProjectDeleteButton } from "./project-delete-button";

export type SortableProject = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  thumbnailImageUrl: string | null;
  isFeatured: boolean;
  status: ProjectStatus;
  techStack: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

type ProjectSortableListProps = {
  projects: SortableProject[];
};

export function ProjectSortableList({ projects }: ProjectSortableListProps) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const persistOrder = (nextItems: SortableProject[]) => {
    startTransition(async () => {
      const result = await actionReorderProjects(
        nextItems.map((item, index) => ({
          id: item.id,
          order: index,
        })),
      );

      if (result.success) {
        toast.success(result.message ?? "Project order updated.");
        router.refresh();
        return;
      }

      setItems(projects);
      toast.error(result.error);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextItems = arrayMove(items, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        order: index,
      }),
    );

    setItems(nextItems);
    persistOrder(nextItems);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {items.map((project) => (
            <SortableProjectRow
              key={project.id}
              project={project}
              disabled={isPending}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableProjectRow({
  project,
  disabled,
}: {
  project: SortableProject;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: project.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const isPublished = project.status === ProjectStatus.PUBLISHED;
  const cardImage = project.thumbnailImageUrl ?? project.coverImage;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "grid overflow-hidden rounded-2xl border bg-background/40 transition-[border-color,box-shadow,opacity] md:grid-cols-[48px_minmax(0,1fr)_auto]",
        isDragging
          ? "border-brand-soft/60 opacity-80 shadow-[0_0_52px_rgba(139,92,246,0.18)]"
          : "hover:border-brand-soft/35",
      ].join(" ")}
    >
      <Button
        ref={setActivatorNodeRef}
        type="button"
        variant="ghost"
        size="icon"
        className="h-full min-h-28 w-full cursor-grab items-center justify-center rounded-none border-r border-border/50 p-0 text-muted-foreground active:cursor-grabbing"
        disabled={disabled}
        aria-label={`Drag ${project.title} to reorder`}
        {...attributes}
        {...listeners}
      >
        <DotsSixVerticalIcon />
      </Button>

      <div className="grid min-w-0 gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border/50 bg-muted/35">
          {cardImage ? (
            <Image
              src={cardImage}
              alt={project.title}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="h-full bg-[radial-gradient(circle_at_25%_20%,rgba(139,92,246,0.28),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(10,10,20,0.96))]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-heading text-lg font-semibold">
              {project.title}
            </h2>
            {project.isFeatured && <Badge>featured</Badge>}
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "published" : "draft"}
            </Badge>
            <Badge variant="outline">order {project.order}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            /projects/{project.slug}
          </p>
          {project.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Updated {formatDate(project.updatedAt)}</span>
            <span>Created {formatDate(project.createdAt)}</span>
            {project.techStack.slice(0, 4).map((tech) => (
              <Badge key={tech} variant="outline" className="text-[11px]">
                {tech}
              </Badge>
            ))}
            {project.techStack.length > 4 && (
              <span>+{project.techStack.length - 4} more</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4 md:justify-end">
        <Button asChild size="sm" variant="outline">
          <Link href={`/projects/${project.slug}`} target="_blank">
            <ArrowSquareOutIcon data-icon="inline-start" />
            Preview
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={`/dashboard/projects/${project.id}/edit`}>
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </Link>
        </Button>
        <ProjectDeleteButton projectId={project.id} title={project.title} />
      </div>
    </div>
  );
}
