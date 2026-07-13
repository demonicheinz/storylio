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
  DotsSixVerticalIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  FunnelSimpleIcon,
  GridFourIcon,
  ListBulletsIcon,
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
import { toast } from "sonner";
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
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { blurBeforeOpen } from "@/features/dashboard/shared/utils/overlay-focus";
import { ProjectStatus } from "@/generated/prisma";
import type { ActionResult } from "@/lib/action-result";
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

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
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
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs",
        published
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-amber-500/12 text-amber-300",
        compact && "px-2 py-0.5",
      )}
    >
      <span
        className={cn(
          "rounded-full size-1.5",
          published ? "bg-emerald-300" : "bg-amber-300",
        )}
      />
      {published ? "Published" : "Draft"}
    </span>
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
        "relative bg-muted/30 border border-border/60 rounded-2xl aspect-video overflow-hidden",
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
        <div className="flex justify-center items-center bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.28),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(10,10,20,0.96))] h-full text-muted-foreground">
          <BriefcaseIcon className="size-8" />
        </div>
      )}
    </div>
  );
}

function ProjectsStatCard({
  label,
  value,
  description,
  icon,
  iconClassName,
  className,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  iconClassName: string;
  className?: string;
}) {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn("font-heading font-bold text-xl", className)}>
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterDropdown<T extends string>({
  label,
  value,
  displayValue,
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="justify-between bg-input/35 px-3 rounded-2xl min-w-0 h-11"
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] text-muted-foreground leading-none">
              {label}
            </span>
            <span className="block mt-1 font-medium text-xs truncate">
              {displayValue}
            </span>
          </span>
          <CaretDownIcon className="ml-2 size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as T)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TechStackDropdown({
  techStacks,
  selectedTechStacks,
  onToggleTechStack,
  onClear,
}: {
  techStacks: string[];
  selectedTechStacks: string[];
  onToggleTechStack: (techStack: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="justify-between bg-input/35 px-3 rounded-2xl min-w-0 h-11"
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] text-muted-foreground leading-none">
              Tech stack
            </span>
            <span className="block mt-1 font-medium text-xs truncate">
              {selectedTechStacks.length === 0
                ? "All Tech"
                : `${selectedTechStacks.length} selected`}
            </span>
          </span>
          <CaretDownIcon className="ml-2 size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Filter by tech stack</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onClear}>All Tech</DropdownMenuItem>
        <DropdownMenuSeparator />
        {techStacks.length === 0 ? (
          <DropdownMenuItem disabled>No tech stack yet</DropdownMenuItem>
        ) : (
          techStacks.map((techStack) => (
            <DropdownMenuCheckboxItem
              key={techStack}
              checked={selectedTechStacks.includes(techStack)}
              onCheckedChange={() => onToggleTechStack(techStack)}
              onSelect={(event) => event.preventDefault()}
            >
              {techStack}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
    <div className="justify-self-end grid grid-cols-2 bg-background/35 p-1 border border-border/60 rounded-xl w-fit shrink-0">
      <Button
        type="button"
        size="icon"
        variant={viewMode === "list" ? "default" : "ghost"}
        className="rounded-lg size-8"
        onClick={() => onViewModeChange("list")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <ListBulletsIcon />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={viewMode === "grid" ? "default" : "ghost"}
        className="rounded-lg size-8"
        onClick={() => onViewModeChange("grid")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <GridFourIcon />
      </Button>
    </div>
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
          className="max-w-28 text-[11px] truncate"
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
}: {
  project: DashboardProject;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="bg-background/70 hover:bg-background backdrop-blur rounded-xl size-8 text-foreground"
          aria-label={`Open actions for ${project.title}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        {isPublished(project) && (
          <DropdownMenuItem asChild>
            <Link href={`/projects/${project.slug}`} target="_blank">
              <ArrowSquareOutIcon data-icon="inline-start" />
              Preview
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/projects/${project.id}/edit`}>
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ProjectDeleteButton
          projectId={project.id}
          title={project.title}
          trigger={
            <DropdownMenuItem
              variant="destructive"
              onSelect={(event) => event.preventDefault()}
            >
              <TrashIcon data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          }
        />
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
            "group bg-background/45 hover:shadow-[0_20px_70px_rgba(0,0,0,0.22)] border border-border/70 hover:border-brand-soft/40 rounded-2xl min-w-0 overflow-hidden transition-[border-color,transform,box-shadow] hover:-translate-y-0.5",
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
              className="top-3 right-3 absolute opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity"
              onClick={(event) => event.stopPropagation()}
            >
              <ProjectActions project={project} />
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
            <div
              className={cn(
                "left-3 absolute flex flex-wrap gap-1.5 transition-[top]",
                batchMode ? "top-11" : "top-3",
              )}
            >
              <ProjectStatusBadge project={project} compact />
              {project.isFeatured && (
                <Badge className="px-2 rounded-full h-5 text-[11px]">
                  featured
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col p-4 min-h-56">
            <h2 className="mt-2 font-heading font-semibold text-base wrap-break-word line-clamp-2 leading-snug">
              {project.title}
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
        "xl:items-center grid grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_minmax(360px,1fr)_130px_160px_160px_56px] bg-background/30 border border-border/70 rounded-2xl min-w-0 overflow-hidden",
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
      <div className="flex items-start gap-3 p-4 xl:p-3 xl:pr-4 min-w-0">
        <ProjectThumbnail
          project={project}
          className="hidden sm:block rounded-xl w-28 h-16 shrink-0"
          sizes="112px"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "xl:hidden rounded-full size-2 shrink-0",
                isPublished(project) ? "bg-emerald-300" : "bg-amber-300",
              )}
            />
            <h2 className="font-heading font-semibold xl:text-sm text-base wrap-break-word line-clamp-2 leading-snug">
              {project.title}
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
          {project.isFeatured && (
            <Badge className="px-2 rounded-full h-5 text-[11px]">
              featured
            </Badge>
          )}
        </div>
      </div>
      <div className="hidden xl:block p-3 text-muted-foreground text-sm">
        {formatDateTime(project.createdAt)}
      </div>
      <div className="hidden xl:block p-3 text-muted-foreground text-sm">
        {formatDateTime(project.updatedAt)}
      </div>
      <div className="hidden xl:flex justify-end p-3">
        <div onClick={(event) => event.stopPropagation()}>
          <ProjectActions project={project} />
        </div>
      </div>
      <div className="xl:hidden flex flex-wrap items-center gap-2 col-start-2 px-4 pb-4">
        <ProjectStatusBadge project={project} compact />
        {project.isFeatured && (
          <Badge className="px-2 rounded-full h-5 text-[11px]">featured</Badge>
        )}
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
            className="justify-center items-center p-0 border-border/50 border-r rounded-none w-full h-full min-h-24 text-muted-foreground touch-none cursor-grab active:cursor-grabbing disabled:cursor-not-allowed"
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

function ProjectsListHeader() {
  return (
    <div
      className={cn(
        "hidden xl:grid grid-cols-[44px_minmax(360px,1fr)_130px_160px_160px_56px]",
        dashboardStyles.listHeader,
      )}
    >
      <div />
      <div>Title</div>
      <div>Status</div>
      <div>Created at</div>
      <div>Updated at</div>
      <div className="text-right">Actions</div>
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
      const result = await actionReorderProjects(
        nextProjects.map((project, index) => ({
          id: project.id,
          order: index,
        })),
      );

      if (result.success) {
        toast.success(result.message ?? "Project order updated.");
        router.refresh();
        return;
      }

      onReorder(projects);
      toast.error(result.error);
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
        <ProjectsListHeader />
        <div className="flex flex-col gap-3 p-3 min-w-0">
          {projects.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              batchMode={batchMode}
              selected={selectedIds.has(project.id)}
              onToggleProject={onToggleProject}
              dragHandle={
                <div className="flex justify-center items-center border-border/50 border-r h-full min-h-24 text-muted-foreground">
                  <DotsSixVerticalIcon />
                </div>
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.listSurface}>
      <ProjectsListHeader />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 p-3 min-w-0">
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
        className="rounded-xl size-8"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        <CaretLeftIcon />
      </Button>
      {Array.from({ length: pageCount }).map((_, index) => {
        const pageNumber = index + 1;

        return (
          <Button
            key={pageNumber}
            type="button"
            size="icon"
            variant={pageNumber === page ? "default" : "outline"}
            className="rounded-xl size-8"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="rounded-xl size-8"
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
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-input/35 rounded-xl"
          >
            {value}
            <CaretDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-24">
          <DropdownMenuRadioGroup
            value={String(value)}
            onValueChange={(nextValue) => onValueChange(Number(nextValue))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem key={option} value={String(option)}>
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
  isPending,
  onPublish,
  onMoveToDraft,
  onDelete,
  onCancel,
}: {
  selectedCount: number;
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
          Drag ordering is paused while selecting projects.
        </p>
      </div>
      <div className="sm:flex sm:flex-wrap sm:justify-end gap-2 grid grid-cols-2">
        <Button
          type="button"
          size="sm"
          className="rounded-xl"
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
          className="bg-input/35 rounded-xl"
          disabled={isPending || selectedCount === 0}
          onClick={onMoveToDraft}
        >
          Move to draft
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="rounded-xl"
              disabled={isPending || selectedCount === 0}
            >
              <TrashIcon data-icon="inline-start" />
              Delete
            </Button>
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
          className="rounded-xl"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function ProjectsManager({ projects }: ProjectsManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [featured, setFeatured] = useState<FeaturedFilter>("all");
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
  const [draftStatus, setDraftStatus] = useState<StatusFilter>(status);
  const [draftFeatured, setDraftFeatured] = useState<FeaturedFilter>(featured);
  const [draftTechStacks, setDraftTechStacks] =
    useState<string[]>(selectedTechStacks);
  const [draftSort, setDraftSort] = useState<SortMode>(sortMode);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setItems(projects);
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
    setPage(1);
  }, [featured, itemsPerPage, query, selectedTechStacks, sortMode, status]);

  const toggleTechStack = (techStack: string) => {
    setSelectedTechStacks((currentTechStacks) =>
      currentTechStacks.includes(techStack)
        ? currentTechStacks.filter((item) => item !== techStack)
        : [...currentTechStacks, techStack],
    );
  };

  const toggleDraftTechStack = (techStack: string) => {
    setDraftTechStacks((currentTechStacks) =>
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
        toast.success(result.message ?? fallbackMessage);
        clearSelection();
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
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
    viewMode === "list" &&
    !batchMode &&
    sortMode === "order" &&
    status === "all" &&
    featured === "all" &&
    selectedTechStacks.length === 0 &&
    query.trim().length === 0 &&
    filteredProjects.length <= itemsPerPage;

  const handleReorder = (nextProjects: DashboardProject[]) => {
    setItems(nextProjects);
  };

  return (
    <div className={dashboardStyles.page}>
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-3xl">Projects</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
            Manage portfolio drafts, published case studies, media, and display
            order.
          </p>
        </div>
        <Button
          asChild
          size="icon"
          className="md:px-4 rounded-full md:rounded-3xl md:w-auto md:h-9 size-10 shrink-0"
        >
          <Link href="/dashboard/projects/new">
            <PlusIcon data-icon="inline-start" />
            <span className="sr-only md:not-sr-only">New Project</span>
          </Link>
        </Button>
      </div>

      <div className={dashboardStyles.statGrid}>
        <ProjectsStatCard
          label="Total Projects"
          value={stats.total}
          description="All time"
          icon={<BriefcaseIcon />}
          iconClassName="bg-sky-500/12 text-sky-300"
          className="text-sky-300"
        />
        <ProjectsStatCard
          label="Published"
          value={stats.published}
          description={`${stats.total ? Math.round((stats.published / stats.total) * 100) : 0}% of total`}
          icon={<EyeIcon />}
          iconClassName="bg-emerald-500/12 text-emerald-300"
          className="text-emerald-300"
        />
        <ProjectsStatCard
          label="Drafts"
          value={stats.drafts}
          description={`${stats.total ? Math.round((stats.drafts / stats.total) * 100) : 0}% of total`}
          icon={<PencilSimpleIcon />}
          iconClassName="bg-amber-500/12 text-amber-300"
          className="text-amber-300"
        />
        <ProjectsStatCard
          label="Featured"
          value={stats.featured}
          description="Home and projects priority"
          icon={<SparkleIcon />}
          iconClassName="bg-fuchsia-500/12 text-fuchsia-300"
          className="text-fuchsia-300"
        />
      </div>

      <Card className={dashboardStyles.toolbarCard}>
        <CardContent className={dashboardStyles.toolbarContent}>
          <div className="md:hidden gap-3 grid">
            <div className="flex gap-2 min-w-0">
              <div className="relative flex-1 min-w-0">
                <MagnifyingGlassIcon className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
                <Input
                  ref={mobileSearchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects..."
                  className="bg-input/45 pr-14 pl-9 rounded-2xl h-10"
                  aria-label="Search projects"
                />
                <Kbd className="top-1/2 right-2 absolute bg-background/60 border border-border/50 -translate-y-1/2">
                  ⌘ K
                </Kbd>
              </div>
              <Button
                type="button"
                variant="outline"
                className="bg-input/35 rounded-2xl h-10 shrink-0"
                onClick={(event) => blurBeforeOpen(event, openFilters)}
              >
                <FunnelSimpleIcon data-icon="inline-start" />
                Filters
              </Button>
              <Button
                type="button"
                variant={batchMode ? "secondary" : "outline"}
                className="bg-input/35 rounded-2xl h-10 shrink-0"
                onClick={toggleBatchMode}
              >
                {batchMode ? "Cancel" : "Select"}
              </Button>
            </div>
          </div>

          <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_140px_140px_140px_160px_auto] min-w-0">
            <div className="relative md:col-span-2 xl:col-span-1 min-w-0">
              <MagnifyingGlassIcon className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
              <Input
                ref={desktopSearchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects..."
                className="bg-input/45 pr-14 pl-9 rounded-2xl h-11"
                aria-label="Search projects"
              />
              <Kbd className="top-1/2 right-2 absolute bg-background/60 border border-border/50 -translate-y-1/2">
                ⌘ K
              </Kbd>
            </div>
            <FilterDropdown
              label="Status"
              value={status}
              displayValue={statusDisplay}
              options={statusOptions}
              onValueChange={setStatus}
            />
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
              onToggleTechStack={toggleTechStack}
              onClear={() => setSelectedTechStacks([])}
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
                className="bg-input/35 rounded-2xl h-11 shrink-0"
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
                  className="px-2.5 rounded-full h-7 text-xs"
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
                className="px-2.5 rounded-full h-7 text-xs"
                onClick={() => setSelectedTechStacks([])}
              >
                Clear
              </Button>
            </div>
          )}
          {!canReorder && viewMode === "list" && (
            <p className="mt-3 text-muted-foreground text-xs">
              {batchMode
                ? "Reordering is paused while selecting projects."
                : "Reordering is available only in list view with order sorting, no active filters, and all projects visible on one page."}
            </p>
          )}
        </CardContent>
      </Card>

      {batchMode && (
        <ProjectsBatchActionsBar
          selectedCount={selectedIds.size}
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
            <p className="font-medium">No projects found</p>
            <p className="mt-1 text-muted-foreground text-sm">
              Adjust the filters or create a new portfolio entry.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <PlusIcon data-icon="inline-start" />
              New Project
            </Link>
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
              projects={paginatedProjects}
              canReorder={canReorder}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onReorder={handleReorder}
              onToggleProject={toggleProjectSelection}
            />
          )}

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
        </>
      )}

      <Drawer
        open={filtersOpen}
        onOpenChange={handleFiltersOpenChange}
        direction="bottom"
      >
        <DrawerContent className="before:top-2 before:bottom-0 before:inset-x-0 p-0 before:rounded-t-4xl before:rounded-b-none">
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
            <div>
              <p className="mb-2 font-medium text-muted-foreground text-xs">
                Tech stack
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={draftTechStacks.length === 0 ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setDraftTechStacks([])}
                >
                  All Tech
                </Button>
                {techStacks.map((techStack) => (
                  <Button
                    key={techStack}
                    type="button"
                    size="sm"
                    variant={
                      draftTechStacks.includes(techStack)
                        ? "default"
                        : "outline"
                    }
                    className="rounded-xl"
                    onClick={() => toggleDraftTechStack(techStack)}
                  >
                    {techStack}
                  </Button>
                ))}
              </div>
            </div>
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
                className="rounded-2xl"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={applyFilters}
              >
                Apply filters
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
