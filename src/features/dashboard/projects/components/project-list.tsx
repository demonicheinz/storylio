"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/toast";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { cn, formatDate } from "@/lib/utils";
import { actionReorderProjects } from "../actions";
import { isPublished } from "../presentation";
import type { DashboardProject } from "../types";
import {
  FeaturedProjectBadge,
  ProjectActions,
  ProjectStatusBadge,
  ProjectThumbnail,
  ProjectUpdatedAt,
  TechPills,
} from "./project-display";

// Header and rows share the same tracks; padding belongs to their cells.
const PROJECT_COLUMNS = "xl:grid-cols-[minmax(0,1fr)_130px_180px_68px]";
const PROJECT_COLUMNS_WITH_GUTTER =
  "xl:grid-cols-[44px_minmax(0,1fr)_130px_180px_68px]";

function ProjectListRow({
  project,
  dragHandle,
  isDragging = false,
  batchMode,
  selected,
  onToggleProject,
}: {
  project: DashboardProject;
  dragHandle?: ReactNode;
  isDragging?: boolean;
  batchMode?: boolean;
  selected?: boolean;
  onToggleProject?: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "xl:items-center grid min-w-0 overflow-hidden",
        batchMode || dragHandle
          ? "grid-cols-[44px_minmax(0,1fr)]"
          : "grid-cols-1",
        batchMode || dragHandle ? PROJECT_COLUMNS_WITH_GUTTER : PROJECT_COLUMNS,
        selected && "border-brand-soft/60 bg-brand/5",
        batchMode && "cursor-pointer",
        isDragging &&
          "relative z-10 border-brand-soft/60 bg-background/70 opacity-80",
      )}
      onClick={
        batchMode && onToggleProject
          ? () => onToggleProject(project.id)
          : undefined
      }
    >
      {(batchMode || dragHandle) && (
        <div className="row-span-2 xl:row-span-1">
          {batchMode ? (
            <div
              className="flex justify-center items-center border-border/50 border-r h-full min-h-24"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={selected}
                onCheckedChange={() => onToggleProject?.(project.id)}
                aria-label={`Select ${project.title}`}
              />
            </div>
          ) : (
            dragHandle
          )}
        </div>
      )}
      <div className="flex items-start gap-3 p-4 xl:p-3 xl:pr-4 min-w-0">
        <ProjectThumbnail
          project={project}
          className="hidden sm:block rounded-lg w-28 h-16 shrink-0"
          sizes="112px"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "xl:hidden rounded-full size-2 shrink-0",
                isPublished(project) ? "bg-success" : "bg-muted-foreground",
              )}
            />
            <h2 className="font-sans font-semibold xl:text-sm text-base wrap-break-word line-clamp-2 leading-snug">
              {batchMode ? (
                project.title
              ) : (
                <Link
                  href={`/dashboard/projects/${project.id}/edit`}
                  className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring hover:text-link"
                >
                  {project.title}
                </Link>
              )}
            </h2>
          </div>
          <p className="mt-1 text-muted-foreground text-xs truncate">
            /projects/{project.slug}
          </p>
          <div className="xl:hidden mt-2">
            <TechPills techStack={project.techStack} limit={2} />
          </div>
          <div className="hidden xl:block mt-2">
            <TechPills techStack={project.techStack} limit={4} />
          </div>
        </div>
        <div
          className="xl:hidden shrink-0"
          onClick={(event) => event.stopPropagation()}
        >
          <ProjectActions project={project} />
        </div>
      </div>
      <div className="hidden xl:flex items-center p-3">
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusBadge project={project} compact />
          {project.isFeatured && <FeaturedProjectBadge />}
        </div>
      </div>
      <div className="hidden xl:block p-3 text-muted-foreground text-sm">
        <ProjectUpdatedAt value={project.updatedAt} />
      </div>
      <div className="hidden xl:flex justify-center p-3">
        <div onClick={(event) => event.stopPropagation()}>
          <ProjectActions project={project} />
        </div>
      </div>
      <div
        className={cn(
          "xl:hidden flex flex-wrap items-center gap-2 px-4 pb-4",
          (batchMode || dragHandle) && "col-start-2",
        )}
      >
        <ProjectStatusBadge project={project} compact />
        {project.isFeatured && <FeaturedProjectBadge />}
        <span className="text-muted-foreground text-xs">
          Updated {formatDate(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function SortableProjectListRow({
  project,
  disabled,
  batchMode,
  selected,
  onToggleProject,
}: {
  project: DashboardProject;
  disabled: boolean;
  batchMode: boolean;
  selected: boolean;
  onToggleProject: (id: string) => void;
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

  return (
    <div ref={setNodeRef} style={style}>
      <ProjectListRow
        project={project}
        isDragging={isDragging}
        batchMode={batchMode}
        selected={selected}
        onToggleProject={onToggleProject}
        dragHandle={
          <Button
            ref={setActivatorNodeRef}
            type="button"
            variant="ghost"
            size="icon"
            className="justify-center items-center p-0 w-full h-full min-h-24 touch-none cursor-grab active:cursor-grabbing disabled:cursor-not-allowed"
            disabled={disabled}
            aria-label={`Drag ${project.title} to reorder`}
            {...attributes}
            {...listeners}
          >
            <DotsSixVerticalIcon />
          </Button>
        }
      />
    </div>
  );
}

function ProjectsListHeader({ hasGutter = false }: { hasGutter?: boolean }) {
  return (
    <div
      className={cn(
        "hidden xl:grid border-border border-b font-medium text-muted-foreground text-xs",
        hasGutter ? PROJECT_COLUMNS_WITH_GUTTER : PROJECT_COLUMNS,
      )}
      data-project-list-header
    >
      {hasGutter && <div />}
      <div className="py-3 pr-3 pl-34">Title</div>
      <div className="p-3">Status</div>
      <div className="p-3">Updated at</div>
      <div className="p-3 text-center">Actions</div>
    </div>
  );
}

export function ProjectsList({
  projects,
  canReorder,
  batchMode,
  selectedIds,
  onReorder,
  onToggleProject,
}: {
  projects: DashboardProject[];
  canReorder: boolean;
  batchMode: boolean;
  selectedIds: Set<string>;
  onReorder: (projects: DashboardProject[]) => void;
  onToggleProject: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const itemIds = useMemo(() => projects.map((item) => item.id), [projects]);

  const persistOrder = (nextProjects: DashboardProject[]) => {
    startTransition(async () => {
      try {
        const result = await actionReorderProjects(
          nextProjects.map((project, index) => ({
            id: project.id,
            order: index,
          })),
        );

        if (result.success) {
          toast.add({
            title: result.message ?? "Project order updated.",
            type: "success",
          });
          router.refresh();
          return;
        }

        onReorder(projects);
        toast.add({ title: result.error, type: "error" });
      } catch {
        onReorder(projects);
        toast.add({
          title: "Could not save order. Previous order restored.",
          type: "error",
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canReorder || isPending) return;
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = projects.findIndex((item) => item.id === active.id);
    const newIndex = projects.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextProjects = arrayMove(projects, oldIndex, newIndex).map(
      (project, index) => ({
        ...project,
        order: index,
      }),
    );

    onReorder(nextProjects);
    persistOrder(nextProjects);
  };

  if (!canReorder) {
    return (
      <div className={dashboardStyles.listSurface}>
        <ProjectsListHeader hasGutter={canReorder || batchMode} />
        <div className="flex flex-col divide-y divide-border min-w-0">
          {projects.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              batchMode={batchMode}
              selected={selectedIds.has(project.id)}
              onToggleProject={onToggleProject}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.listSurface}>
      <ProjectsListHeader hasGutter={canReorder || batchMode} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col divide-y divide-border min-w-0">
            {projects.map((project) => (
              <SortableProjectListRow
                key={project.id}
                project={project}
                disabled={isPending}
                batchMode={batchMode}
                selected={selectedIds.has(project.id)}
                onToggleProject={onToggleProject}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
