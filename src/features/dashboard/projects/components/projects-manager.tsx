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
import {
  ArrowSquareOutIcon,
  BriefcaseIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  DotsSixVerticalIcon,
  DotsThreeVerticalIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  SparkleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "@/components/ui/toast";
import toolbarStyles from "@/features/dashboard/shared/components/collection-toolbar.module.css";
import {
  DashboardMultiFilter,
  DashboardSelect,
  DashboardViewToggle,
} from "@/features/dashboard/shared/components/filter-controls";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { useDashboardFilter } from "@/features/dashboard/shared/hooks/use-dashboard-filter";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import type { ActionResult } from "@/lib/action-result";
import { getPageItems } from "@/lib/archive-pagination";
import { ProjectStatus } from "@/lib/db/enums";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn, formatDate } from "@/lib/utils";
import {
  actionDeleteProjects,
  actionMoveProjectsToDraft,
  actionPublishProjects,
  actionReorderProjects,
} from "../actions";
import { ProjectDeleteButton } from "./project-delete-button";

export type DashboardProject = {
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

type ProjectsManagerProps = {
  projects: DashboardProject[];
};

type ViewMode = "list" | "grid";
type StatusFilter = "all" | "published" | "draft";
type FeaturedFilter = "all" | "featured" | "standard";
type SortMode = "order" | "updated" | "created" | "title";

// Header and rows share the same tracks; padding belongs to their cells.
const PROJECT_COLUMNS = "xl:grid-cols-[minmax(0,1fr)_130px_180px_68px]";
const PROJECT_COLUMNS_WITH_GUTTER =
  "xl:grid-cols-[44px_minmax(0,1fr)_130px_180px_68px]";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const featuredOptions: Array<{ value: FeaturedFilter; label: string }> = [
  { value: "all", label: "All Projects" },
  { value: "featured", label: "Featured" },
  { value: "standard", label: "Standard" },
];

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "order", label: "Order (asc)" },
  { value: "updated", label: "Recently Updated" },
  { value: "created", label: "Newest Created" },
  { value: "title", label: "Title A-Z" },
];

function isPublished(project: DashboardProject) {
  return project.status === ProjectStatus.PUBLISHED;
}

function formatDateTime(value: Date | string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ProjectStatusBadge({
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

function FeaturedProjectBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 bg-surface px-2 border border-border rounded-md h-6 font-medium text-brand-soft text-xs">
      <SparkleIcon className="size-3" aria-hidden="true" />
      Featured
    </span>
  );
}

function ProjectUpdatedAt({ value }: { value: Date }) {
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

function ProjectThumbnail({
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

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: T;
  displayValue: string;
  options: Array<{ value: T; label: string }>;
  onValueChange: (value: T) => void;
}) {
  return (
    <DashboardSelect
      label={label}
      triggerClassName="min-h-11"
      value={value}
      options={options}
      onValueChange={onValueChange}
    />
  );
}

function TechStackDropdown({
  techStacks,
  selectedTechStacks,
  onValueChange,
}: {
  techStacks: string[];
  selectedTechStacks: string[];
  onValueChange: (values: string[]) => void;
}) {
  return (
    <div className="min-w-40">
      <DashboardMultiFilter
        label="Tech stack"
        labelPlacement="above"
        values={selectedTechStacks}
        options={techStacks}
        onValueChange={onValueChange}
        emptyLabel="All technologies"
      />
    </div>
  );
}

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <DashboardViewToggle value={viewMode} onValueChange={onViewModeChange} />
  );
}

function TechPills({
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

function ProjectActions({
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

function ProjectsGrid({
  projects,
  batchMode,
  selectedIds,
  onToggleProject,
}: {
  projects: DashboardProject[];
  batchMode: boolean;
  selectedIds: Set<string>;
  onToggleProject: (id: string) => void;
}) {
  return (
    <div className={dashboardStyles.gridCards}>
      {projects.map((project) => (
        <article
          key={project.id}
          className={cn(
            "group flex flex-col bg-card border border-border hover:border-border-hover rounded-lg min-w-0 overflow-hidden transition-colors",
            selectedIds.has(project.id) && "border-brand-soft/60 bg-brand/5",
            batchMode && "cursor-pointer",
          )}
          onClick={batchMode ? () => onToggleProject(project.id) : undefined}
        >
          <div className="relative">
            <ProjectThumbnail
              project={project}
              className="border-0 rounded-none"
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
            <div
              className="top-3 right-3 absolute"
              onClick={(event) => event.stopPropagation()}
            >
              <ProjectActions project={project} overlay />
            </div>
            {batchMode && (
              <div
                className="top-3 left-3 z-10 absolute"
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  checked={selectedIds.has(project.id)}
                  onCheckedChange={() => onToggleProject(project.id)}
                  aria-label={`Select ${project.title}`}
                />
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1 p-4">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <ProjectStatusBadge project={project} compact />
              {project.isFeatured && <FeaturedProjectBadge />}
            </div>
            <h2 className="font-sans font-semibold text-base wrap-break-word line-clamp-2 leading-snug">
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
            <p className="mt-1 text-muted-foreground text-xs truncate">
              /projects/{project.slug}
            </p>
            <div className="mt-3">
              <TechPills techStack={project.techStack} limit={3} />
            </div>
            {project.description && (
              <p className="mt-2 text-muted-foreground text-sm wrap-break-word line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

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

function ProjectsList({
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

function ProjectsPagination({
  firstIndex,
  lastIndex,
  total,
  page,
  pageCount,
  itemsPerPage,
  itemsPerPageOptions,
  onPageChange,
  onItemsPerPageChange,
}: {
  firstIndex: number;
  lastIndex: number;
  total: number;
  page: number;
  pageCount: number;
  itemsPerPage: number;
  itemsPerPageOptions: readonly number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
}) {
  const pageControls = (
    <div className="flex justify-center items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        <CaretLeftIcon />
      </Button>
      <span className="md:hidden px-2 text-sm" aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <div className="hidden md:flex items-center gap-1">
        {getPageItems(page, pageCount).map((value, index) =>
          value === "ellipsis" ? (
            <span key={`gap-${index}`} className="px-1" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={value}
              type="button"
              size="icon"
              variant={value === page ? "default" : "outline"}
              onClick={() => onPageChange(value)}
              aria-label={`Page ${value}`}
              aria-current={value === page ? "page" : undefined}
            >
              {value}
            </Button>
          ),
        )}
      </div>
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        aria-label="Next page"
      >
        <CaretRightIcon />
      </Button>
    </div>
  );

  return (
    <div className="md:items-center gap-3 grid md:grid-cols-[1fr_auto_1fr] mt-4 text-muted-foreground text-sm">
      <div className="md:contents flex justify-between items-center">
        <p className="md:hidden">
          {firstIndex}-{lastIndex} of {total}
        </p>
        <p className="hidden md:block">
          Showing {firstIndex} to {lastIndex} of {total}{" "}
          {total === 1 ? "item" : "items"}
        </p>
        <div className="md:hidden">
          <ItemsPerPageDropdown
            value={itemsPerPage}
            options={itemsPerPageOptions}
            onValueChange={onItemsPerPageChange}
          />
        </div>
      </div>
      <div className="md:col-start-2">{pageControls}</div>
      <div className="hidden md:flex justify-end">
        <ItemsPerPageDropdown
          value={itemsPerPage}
          options={itemsPerPageOptions}
          onValueChange={onItemsPerPageChange}
          showLabel
        />
      </div>
    </div>
  );
}

function ItemsPerPageDropdown({
  value,
  options,
  onValueChange,
  showLabel = false,
}: {
  value: number;
  options: readonly number[];
  onValueChange: (value: number) => void;
  showLabel?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-muted-foreground text-sm">Items per page</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Items per page"
            />
          }
        >
          {value}
          <CaretDownIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-24">
          <DropdownMenuRadioGroup
            value={String(value)}
            onValueChange={(nextValue) => onValueChange(Number(nextValue))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option}
                value={String(option)}
                closeOnClick={true}
              >
                {option}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ProjectsBatchActionsBar({
  selectedCount,
  selectedTitles,
  outsideViewCount,
  onSelectPage,
  pageSelected,
  isPending,
  onPublish,
  onMoveToDraft,
  onDelete,
  onCancel,
}: {
  selectedCount: number;
  selectedTitles: string[];
  outsideViewCount: number;
  onSelectPage: () => void;
  pageSelected: boolean;
  isPending: boolean;
  onPublish: () => void;
  onMoveToDraft: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 bg-card/55 shadow-sm p-3 border border-border/70 rounded-2xl">
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm">
          {selectedCount} {selectedCount === 1 ? "project" : "projects"}{" "}
          selected
        </p>
        <p className="text-muted-foreground text-xs">
          {outsideViewCount > 0
            ? `${outsideViewCount} selected outside this page. `
            : ""}
          Selection includes all chosen pages and filters.
        </p>
      </div>
      <div className="sm:flex sm:flex-wrap sm:justify-end gap-2 grid grid-cols-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={onSelectPage}
        >
          {pageSelected ? "Deselect page" : "Select page"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending || selectedCount === 0}
          onClick={onPublish}
        >
          <CheckCircleIcon data-icon="inline-start" />
          Publish
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || selectedCount === 0}
          onClick={onMoveToDraft}
        >
          Move to draft
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending || selectedCount === 0}
              />
            }
          >
            <TrashIcon data-icon="inline-start" />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected projects?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedCount}{" "}
                {selectedCount === 1 ? "project" : "projects"}. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
              {selectedTitles.map((title, index) => (
                <li key={`${index}-${title}`} className="wrap-anywhere">
                  {title}
                </li>
              ))}
            </ul>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={onDelete}
              >
                {isPending ? "Deleting..." : "Delete selected"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel selection
        </Button>
      </div>
    </div>
  );
}

export function ProjectsManager({ projects }: ProjectsManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useDashboardFilter<StatusFilter>(
    "status",
    ["all", "published", "draft"],
    "all",
  );
  const [featured, setFeatured] = useDashboardFilter<FeaturedFilter>(
    "featured",
    ["all", "featured", "standard"],
    "all",
  );
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("order");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    getDefaultItemsPerPage("list"),
  );
  const [page, setPage] = useState(1);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchPending, startBatchTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const previousView = useRef<{
    query: string;
    status: StatusFilter;
    featured: FeaturedFilter;
    tech: string[];
    sort: SortMode;
    view: ViewMode;
    page: number;
    size: number;
  } | null>(null);
  const restorePage = useRef<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>(status);
  const [draftFeatured, setDraftFeatured] = useState<FeaturedFilter>(featured);
  const [draftTechStacks, setDraftTechStacks] =
    useState<string[]>(selectedTechStacks);
  const [draftSort, setDraftSort] = useState<SortMode>(sortMode);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(projects);
    const available = new Set(projects.map((project) => project.id));
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => available.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [projects]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const syncMobileView = () => {
      if (!mediaQuery.matches) {
        return;
      }

      setViewMode("list");
      setItemsPerPage(getDefaultItemsPerPage("list"));
    };

    syncMobileView();
    mediaQuery.addEventListener("change", syncMobileView);

    return () => mediaQuery.removeEventListener("change", syncMobileView);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.ctrlKey || event.metaKey)
      ) {
        return;
      }

      event.preventDefault();

      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
      const input = isMobileViewport
        ? mobileSearchInputRef.current
        : desktopSearchInputRef.current;

      input?.focus();
      input?.select();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const stats = useMemo(() => {
    const published = items.filter(isPublished).length;
    const featuredCount = items.filter((project) => project.isFeatured).length;

    return {
      total: items.length,
      published,
      drafts: items.length - published,
      featured: featuredCount,
    };
  }, [items]);

  const techStacks = useMemo(
    () =>
      Array.from(new Set(items.flatMap((project) => project.techStack))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [items],
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...items]
      .filter((project) => {
        if (status === "published" && !isPublished(project)) {
          return false;
        }

        if (status === "draft" && isPublished(project)) {
          return false;
        }

        if (featured === "featured" && !project.isFeatured) {
          return false;
        }

        if (featured === "standard" && project.isFeatured) {
          return false;
        }

        if (
          selectedTechStacks.length > 0 &&
          !project.techStack.some((techStack) =>
            selectedTechStacks.includes(techStack),
          )
        ) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchable = [
          project.title,
          project.slug,
          project.description ?? "",
          ...project.techStack,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortMode === "updated") {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }

        if (sortMode === "created") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }

        if (sortMode === "title") {
          return a.title.localeCompare(b.title);
        }

        return a.order - b.order;
      });
  }, [featured, items, query, selectedTechStacks, sortMode, status]);

  const {
    items: paginatedProjects,
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  } = paginateItems(filteredProjects, page, itemsPerPage);
  const itemsPerPageOptions = getItemsPerPageOptions(viewMode);

  useEffect(() => {
    setPage(restorePage.current ?? 1);
    restorePage.current = null;
  }, [featured, itemsPerPage, query, selectedTechStacks, sortMode, status]);

  const toggleTechStack = (techStack: string) => {
    setSelectedTechStacks((currentTechStacks) =>
      currentTechStacks.includes(techStack)
        ? currentTechStacks.filter((item) => item !== techStack)
        : [...currentTechStacks, techStack],
    );
  };

  const openFilters = () => {
    setDraftStatus(status);
    setDraftFeatured(featured);
    setDraftTechStacks(selectedTechStacks);
    setDraftSort(sortMode);
    setFiltersOpen(true);
  };

  const handleFiltersOpenChange = (open: boolean) => {
    if (open) {
      openFilters();
      return;
    }

    setFiltersOpen(false);
  };

  const applyFilters = () => {
    setStatus(draftStatus);
    setFeatured(draftFeatured);
    setSelectedTechStacks(draftTechStacks);
    setSortMode(draftSort);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftStatus("all");
    setDraftFeatured("all");
    setDraftTechStacks([]);
    setDraftSort("order");
    setStatus("all");
    setFeatured("all");
    setSelectedTechStacks([]);
    setSortMode("order");
  };

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    setItemsPerPage(getDefaultItemsPerPage(nextViewMode));
  };

  const toggleBatchMode = () => {
    setBatchMode((current) => {
      if (current) {
        setSelectedIds(new Set());
      }

      return !current;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  };

  const runBatchAction = (
    action: (projectIds: string[]) => Promise<ActionResult<{ count: number }>>,
    fallbackMessage: string,
  ) => {
    const projectIds = Array.from(selectedIds);

    if (projectIds.length === 0) {
      return;
    }

    startBatchTransition(async () => {
      const result = await action(projectIds);

      if (result.success) {
        toast.add({
          title: result.message ?? fallbackMessage,
          type: "success",
        });
        clearSelection();
        router.refresh();
        return;
      }

      toast.add({ title: result.error, type: "error" });
    });
  };

  const activeFilterCount =
    Number(status !== "all") +
    Number(featured !== "all") +
    selectedTechStacks.length +
    Number(sortMode !== "order");
  const hasRefinements = activeFilterCount > 0 || query.trim().length > 0;
  const selectedProjects = items.filter((item) => selectedIds.has(item.id));
  const outsideViewCount = selectedProjects.filter(
    (item) => !paginatedProjects.some((visible) => visible.id === item.id),
  ).length;
  const pageSelected =
    paginatedProjects.length > 0 &&
    paginatedProjects.every((item) => selectedIds.has(item.id));
  const selectPage = () =>
    setSelectedIds((previous) => {
      const next = new Set(previous);
      for (const item of paginatedProjects) {
        if (pageSelected) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
  const clearFilters = () => {
    resetFilters();
    setQuery("");
  };
  const statusDisplay =
    statusOptions.find((option) => option.value === status)?.label ??
    "All Status";
  const featuredDisplay =
    featuredOptions.find((option) => option.value === featured)?.label ??
    "All Projects";
  const sortDisplay =
    sortOptions.find((option) => option.value === sortMode)?.label ??
    "Order asc";
  const canReorder =
    reorderMode &&
    viewMode === "list" &&
    !batchMode &&
    sortMode === "order" &&
    status === "all" &&
    featured === "all" &&
    selectedTechStacks.length === 0 &&
    query.trim().length === 0 &&
    filteredProjects.length === items.length;

  const toggleReorderMode = () => {
    if (reorderMode) {
      const previous = previousView.current;
      if (previous) {
        restorePage.current = previous.page;
        setQuery(previous.query);
        setStatus(previous.status);
        setFeatured(previous.featured);
        setSelectedTechStacks(previous.tech);
        setSortMode(previous.sort);
        setViewMode(previous.view);
        setItemsPerPage(previous.size);
        setPage(previous.page);
      }
      setReorderMode(false);
      return;
    }
    previousView.current = {
      query,
      status,
      featured,
      tech: selectedTechStacks,
      sort: sortMode,
      view: viewMode,
      page: currentPage,
      size: itemsPerPage,
    };
    resetFilters();
    setQuery("");
    clearSelection();
    setPage(1);
    setViewMode("list");
    setReorderMode(true);
  };

  const handleReorder = (nextProjects: DashboardProject[]) => {
    setItems(nextProjects);
  };

  return (
    <Drawer
      open={filtersOpen}
      onOpenChange={handleFiltersOpenChange}
      swipeDirection="down"
      showSwipeHandle
    >
      <div className={dashboardStyles.page}>
        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-3xl">Projects</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
              Manage portfolio drafts, published case studies, media, and
              display order.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {" "}
            <Button
              role="link"
              render={<Link href="/dashboard/projects/new" />}
              nativeButton={false}
              className="md:px-4 md:w-auto shrink-0"
            >
              <PlusIcon data-icon="inline-start" />
              <span>New Project</span>
            </Button>{" "}
            <Button
              type="button"
              variant="outline"
              onClick={toggleReorderMode}
              aria-pressed={reorderMode}
              disabled={items.length < 2}
            >
              {reorderMode ? "Done reordering" : "Reorder"}
            </Button>
          </div>
        </div>

        <DashboardSummary
          items={[
            { label: "Projects", value: stats.total },
            { label: "Published", value: stats.published },
            { label: "Drafts", value: stats.drafts },
            {
              label: "Marked featured",
              value: stats.featured,
              description: "Includes drafts",
            },
          ]}
        />

        {reorderMode && (
          <p className="text-muted-foreground text-sm" role="status">
            Reordering all projects. Changes save after each move; Done restores
            your previous filters and view.
          </p>
        )}

        {!reorderMode && (
          <Card className={dashboardStyles.toolbarCard}>
            <CardContent
              className={cn(
                dashboardStyles.toolbarContent,
                "[&_input]:min-h-11 [&_button]:min-h-11",
              )}
            >
              <div className={cn("md:hidden", toolbarStyles.mobileToolbar)}>
                <div className={toolbarStyles.mobileRow}>
                  <div className={toolbarStyles.mobileSearch}>
                    <MagnifyingGlassIcon
                      className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      ref={mobileSearchInputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search..."
                      className="pr-3 pl-9"
                      aria-label="Search projects"
                    />
                  </div>
                  <DrawerTrigger
                    render={
                      <Button
                        ref={filtersTriggerRef}
                        type="button"
                        variant="outline"
                        size="icon"
                        className="relative p-0 size-11"
                        aria-label={
                          activeFilterCount > 0
                            ? `Filters (${activeFilterCount})`
                            : "Filters"
                        }
                        title={
                          activeFilterCount > 0
                            ? `Filters (${activeFilterCount})`
                            : "Filters"
                        }
                      />
                    }
                  >
                    <FunnelSimpleIcon aria-hidden="true" />
                    {activeFilterCount > 0 && (
                      <span
                        className="-top-1 -right-1 absolute flex justify-center items-center bg-primary px-1 rounded-full min-w-4 h-4 font-semibold text-[10px] text-primary-foreground pointer-events-none"
                        aria-hidden="true"
                      >
                        {activeFilterCount > 99 ? "99+" : activeFilterCount}
                      </span>
                    )}
                  </DrawerTrigger>
                  <Button
                    type="button"
                    size="icon"
                    variant={batchMode ? "secondary" : "outline"}
                    className="p-0 size-11"
                    aria-label={batchMode ? "Exit selection mode" : "Select"}
                    title={
                      batchMode ? "Exit selection mode" : "Select projects"
                    }
                    aria-pressed={batchMode}
                    onClick={toggleBatchMode}
                  >
                    <CheckSquareIcon aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="hidden items-end gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(140px,1fr)_minmax(90px,0.6fr)_minmax(100px,0.7fr)_minmax(150px,1fr)_minmax(125px,0.8fr)_auto] min-w-0">
                <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-1 min-w-0">
                  <span className="text-muted-foreground text-xs">Search</span>
                  <div className="relative min-w-0">
                    <MagnifyingGlassIcon className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
                    <Input
                      ref={desktopSearchInputRef}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search projects..."
                      className="pr-14 pl-9"
                      aria-label="Search projects"
                    />
                    <Kbd className="top-1/2 right-2 absolute -translate-y-1/2">
                      ⌘ K
                    </Kbd>
                  </div>
                </div>
                <div className="min-w-0">
                  <FilterDropdown
                    label="Status"
                    value={status}
                    displayValue={statusDisplay}
                    options={statusOptions}
                    onValueChange={setStatus}
                  />
                </div>

                <FilterDropdown
                  label="Featured"
                  value={featured}
                  displayValue={featuredDisplay}
                  options={featuredOptions}
                  onValueChange={setFeatured}
                />
                <TechStackDropdown
                  techStacks={techStacks}
                  selectedTechStacks={selectedTechStacks}
                  onValueChange={setSelectedTechStacks}
                />
                <FilterDropdown
                  label="Sort by"
                  value={sortMode}
                  displayValue={sortDisplay}
                  options={sortOptions}
                  onValueChange={setSortMode}
                />
                <div className="flex justify-self-end md:justify-self-start xl:justify-self-auto items-center gap-2 w-fit">
                  <ViewToggle
                    viewMode={viewMode}
                    onViewModeChange={handleViewModeChange}
                  />
                  <Button
                    type="button"
                    variant={batchMode ? "secondary" : "outline"}
                    className="shrink-0"
                    onClick={toggleBatchMode}
                  >
                    {batchMode ? "Cancel" : "Select"}
                  </Button>
                </div>
              </div>
              {selectedTechStacks.length > 0 && (
                <div className="hidden md:flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-muted-foreground text-xs">
                    Active tech:
                  </span>
                  {selectedTechStacks.map((techStack) => (
                    <Button
                      key={techStack}
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="px-2.5"
                      onClick={() => toggleTechStack(techStack)}
                    >
                      {techStack}
                      <span className="ml-1 text-muted-foreground">×</span>
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="px-2.5"
                    onClick={() => setSelectedTechStacks([])}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!reorderMode && (
          <div
            className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm"
            role="status"
          >
            <span>
              {filteredProjects.length} of {items.length} projects
            </span>
            {hasRefinements && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="px-0"
                onClick={clearFilters}
              >
                Clear filters and search
              </Button>
            )}
          </div>
        )}
        {batchMode && (
          <ProjectsBatchActionsBar
            selectedCount={selectedIds.size}
            selectedTitles={selectedProjects.map((item) => item.title)}
            outsideViewCount={outsideViewCount}
            onSelectPage={selectPage}
            pageSelected={pageSelected}
            isPending={isBatchPending}
            onPublish={() =>
              runBatchAction(
                actionPublishProjects,
                "Selected projects published.",
              )
            }
            onMoveToDraft={() =>
              runBatchAction(
                actionMoveProjectsToDraft,
                "Selected projects moved to draft.",
              )
            }
            onDelete={() =>
              runBatchAction(actionDeleteProjects, "Selected projects deleted.")
            }
            onCancel={clearSelection}
          />
        )}

        {filteredProjects.length === 0 ? (
          <div className={dashboardStyles.emptyState}>
            <BriefcaseIcon className="size-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">
                {items.length
                  ? "No projects match these filters"
                  : "No projects yet"}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {items.length
                  ? "Clear filters or try another search."
                  : "Add your first portfolio project."}
              </p>
            </div>
            {items.length > 0 && (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters and search
              </Button>
            )}
            <Button
              role="link"
              render={<Link href="/dashboard/projects/new" />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              New Project
            </Button>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <>
                <div className="hidden md:block">
                  <ProjectsGrid
                    projects={paginatedProjects}
                    batchMode={batchMode}
                    selectedIds={selectedIds}
                    onToggleProject={toggleProjectSelection}
                  />
                </div>
                <div className="md:hidden">
                  <ProjectsList
                    projects={paginatedProjects}
                    canReorder={false}
                    batchMode={batchMode}
                    selectedIds={selectedIds}
                    onReorder={handleReorder}
                    onToggleProject={toggleProjectSelection}
                  />
                </div>
              </>
            ) : (
              <ProjectsList
                projects={reorderMode ? filteredProjects : paginatedProjects}
                canReorder={canReorder}
                batchMode={batchMode}
                selectedIds={selectedIds}
                onReorder={handleReorder}
                onToggleProject={toggleProjectSelection}
              />
            )}

            {!reorderMode && (
              <ProjectsPagination
                firstIndex={firstIndex}
                lastIndex={lastIndex}
                total={filteredProjects.length}
                page={currentPage}
                pageCount={pageCount}
                itemsPerPage={itemsPerPage}
                itemsPerPageOptions={itemsPerPageOptions}
                onPageChange={setPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </>
        )}

        <DrawerContent
          finalFocus={filtersTriggerRef}
          className="before:top-2 before:bottom-0 before:inset-x-0 p-0"
        >
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>
              Refine projects by status, featured state, tech stack, and order.
            </DrawerDescription>
          </DrawerHeader>
          <div className="gap-4 grid px-4 pb-2 max-h-[52vh] overflow-y-auto scrollbar-none">
            <FilterDropdown
              label="Status"
              value={draftStatus}
              displayValue={
                statusOptions.find((option) => option.value === draftStatus)
                  ?.label ?? "All Status"
              }
              options={statusOptions}
              onValueChange={setDraftStatus}
            />
            <FilterDropdown
              label="Featured"
              value={draftFeatured}
              displayValue={
                featuredOptions.find((option) => option.value === draftFeatured)
                  ?.label ?? "All Projects"
              }
              options={featuredOptions}
              onValueChange={setDraftFeatured}
            />
            <TechStackDropdown
              techStacks={techStacks}
              selectedTechStacks={draftTechStacks}
              onValueChange={setDraftTechStacks}
            />
            <FilterDropdown
              label="Sort by"
              value={draftSort}
              displayValue={
                sortOptions.find((option) => option.value === draftSort)
                  ?.label ?? "Order (asc)"
              }
              options={sortOptions}
              onValueChange={setDraftSort}
            />
          </div>
          <DrawerFooter>
            <div className="gap-2 grid grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftStatus("all");
                  setDraftFeatured("all");
                  setDraftTechStacks([]);
                  setDraftSort("order");
                }}
              >
                Reset filters
              </Button>
              <Button type="button" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </div>
    </Drawer>
  );
}
