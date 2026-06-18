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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { blurBeforeOpen } from "@/features/dashboard/shared/utils/overlay-focus";
import { ProjectStatus } from "@/generated/prisma";
import { cn, formatDate } from "@/lib/utils";
import { actionReorderProjects } from "../actions";
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
  { value: "order", label: "Order asc" },
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        published
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-amber-500/12 text-amber-300",
        compact && "px-2 py-0.5",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
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
        "relative aspect-video overflow-hidden rounded-2xl border border-border/60 bg-muted/30",
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
        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.28),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.9),rgba(10,10,20,0.96))] text-muted-foreground">
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
    <Card className="min-w-0 border-border/70 bg-card/55 py-4 shadow-sm">
      <CardContent className="flex items-center gap-3 px-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            iconClassName,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn("font-heading text-xl font-bold", className)}>
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
          className="h-11 min-w-0 justify-between rounded-2xl bg-input/35 px-3"
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] leading-none text-muted-foreground">
              {label}
            </span>
            <span className="mt-1 block truncate text-xs font-medium">
              {displayValue}
            </span>
          </span>
          <CaretDownIcon className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
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
          className="h-11 min-w-0 justify-between rounded-2xl bg-input/35 px-3"
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] leading-none text-muted-foreground">
              Tech stack
            </span>
            <span className="mt-1 block truncate text-xs font-medium">
              {selectedTechStacks.length === 0
                ? "All Tech"
                : `${selectedTechStacks.length} selected`}
            </span>
          </span>
          <CaretDownIcon className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
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
    <div className="grid shrink-0 grid-cols-2 rounded-xl border border-border/60 bg-background/35 p-1">
      <Button
        type="button"
        size="icon"
        variant={viewMode === "list" ? "default" : "ghost"}
        className="size-8 rounded-lg"
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
        className="size-8 rounded-lg"
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
    return <span className="text-xs text-muted-foreground">No tech stack</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {visible.map((tech) => (
        <Badge
          key={tech}
          variant="outline"
          className="max-w-28 truncate text-[11px]"
        >
          {tech}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining} more</span>
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
          className="size-8 rounded-xl bg-background/70 text-foreground backdrop-blur hover:bg-background"
          aria-label={`Open actions for ${project.title}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Project</DropdownMenuLabel>
        {isPublished(project) && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/projects/${project.slug}`} target="_blank">
              <ArrowSquareOutIcon data-icon="inline-start" />
              Preview
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer">
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
              className="cursor-pointer"
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

function ProjectsGrid({ projects }: { projects: DashboardProject[] }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {projects.map((project) => (
        <article
          key={project.id}
          className="group min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-background/45 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand-soft/40 hover:shadow-[0_20px_70px_rgba(0,0,0,0.22)]"
        >
          <div className="relative">
            <ProjectThumbnail
              project={project}
              className="rounded-none border-0"
              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            />
            <div className="absolute top-3 right-3">
              <ProjectActions project={project} />
            </div>
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <ProjectStatusBadge project={project} compact />
              {project.isFeatured && (
                <Badge className="h-5 rounded-full px-2 text-[11px]">
                  featured
                </Badge>
              )}
            </div>
          </div>
          <div className="flex min-h-56 flex-col p-4">
            <h2 className="mt-2 line-clamp-2 font-heading text-base leading-snug font-semibold wrap-break-word">
              {project.title}
            </h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              /projects/{project.slug}
            </p>
            <div className="mt-3">
              <TechPills techStack={project.techStack} limit={3} />
            </div>
            {project.description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground wrap-break-word">
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
}: {
  project: DashboardProject;
  dragHandle?: ReactNode;
  isDragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border/70 bg-background/30 xl:grid-cols-[44px_minmax(360px,1fr)_130px_160px_160px_56px] xl:items-center",
        isDragging &&
          "relative z-10 border-brand-soft/60 bg-background/70 opacity-80",
      )}
    >
      <div className="row-span-2 xl:row-span-1">{dragHandle}</div>
      <div className="flex min-w-0 items-start gap-3 p-4 xl:p-3 xl:pr-4">
        <ProjectThumbnail
          project={project}
          className="hidden h-16 w-28 shrink-0 rounded-xl sm:block"
          sizes="112px"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full xl:hidden",
                isPublished(project) ? "bg-emerald-300" : "bg-amber-300",
              )}
            />
            <h2 className="line-clamp-2 font-heading text-base leading-snug font-semibold wrap-break-word xl:text-sm">
              {project.title}
            </h2>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            /projects/{project.slug}
          </p>
          <div className="mt-2">
            <TechPills techStack={project.techStack} limit={4} />
          </div>
        </div>
        <div className="shrink-0 xl:hidden">
          <ProjectActions project={project} />
        </div>
      </div>
      <div className="hidden items-center p-3 xl:flex">
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusBadge project={project} compact />
          {project.isFeatured && (
            <Badge className="h-5 rounded-full px-2 text-[11px]">
              featured
            </Badge>
          )}
        </div>
      </div>
      <div className="hidden p-3 text-sm text-muted-foreground xl:block">
        {formatDateTime(project.createdAt)}
      </div>
      <div className="hidden p-3 text-sm text-muted-foreground xl:block">
        {formatDateTime(project.updatedAt)}
      </div>
      <div className="hidden justify-end p-3 xl:flex">
        <ProjectActions project={project} />
      </div>
      <div className="col-start-2 flex flex-wrap items-center gap-2 px-4 pb-4 xl:hidden">
        <ProjectStatusBadge project={project} compact />
        {project.isFeatured && (
          <Badge className="h-5 rounded-full px-2 text-[11px]">featured</Badge>
        )}
        <span className="text-xs text-muted-foreground">
          Updated {formatDate(project.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function SortableProjectListRow({
  project,
  disabled,
}: {
  project: DashboardProject;
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

  return (
    <div ref={setNodeRef} style={style}>
      <ProjectListRow
        project={project}
        isDragging={isDragging}
        dragHandle={
          <Button
            ref={setActivatorNodeRef}
            type="button"
            variant="ghost"
            size="icon"
            className="h-full min-h-24 w-full cursor-grab touch-none items-center justify-center rounded-none border-r border-border/50 p-0 text-muted-foreground active:cursor-grabbing disabled:cursor-not-allowed"
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

function ProjectsList({
  projects,
  canReorder,
  onReorder,
}: {
  projects: DashboardProject[];
  canReorder: boolean;
  onReorder: (projects: DashboardProject[]) => void;
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
      <div className="flex min-w-0 flex-col gap-3">
        {projects.map((project) => (
          <ProjectListRow
            key={project.id}
            project={project}
            dragHandle={
              <div className="flex h-full min-h-24 items-center justify-center border-r border-border/50 text-muted-foreground">
                <DotsSixVerticalIcon />
              </div>
            }
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex min-w-0 flex-col gap-3">
          {projects.map((project) => (
            <SortableProjectListRow
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

export function ProjectsManager({ projects }: ProjectsManagerProps) {
  const [items, setItems] = useState(projects);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [featured, setFeatured] = useState<FeaturedFilter>("all");
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("order");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
    sortMode === "order" &&
    status === "all" &&
    featured === "all" &&
    selectedTechStacks.length === 0 &&
    query.trim().length === 0;

  const handleReorder = (nextProjects: DashboardProject[]) => {
    setItems(nextProjects);
  };

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold">Projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage portfolio drafts, published case studies, media, and display
            order.
          </p>
        </div>
        <Button
          asChild
          size="icon"
          className="size-10 shrink-0 rounded-full md:h-9 md:w-auto md:rounded-3xl md:px-4"
        >
          <Link href="/dashboard/projects/new">
            <PlusIcon data-icon="inline-start" />
            <span className="sr-only md:not-sr-only">New Project</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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

      <Card className="min-w-0 overflow-hidden border-border/70 bg-card/55 py-0">
        <CardContent className="min-w-0 p-3 sm:p-4">
          <div className="grid gap-3 md:hidden">
            <div className="flex min-w-0 gap-2">
              <div className="relative min-w-0 flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={mobileSearchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects..."
                  className="h-10 rounded-2xl bg-input/45 pr-14 pl-9"
                  aria-label="Search projects"
                />
                <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border border-border/50 bg-background/60">
                  ⌘ K
                </Kbd>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-2xl bg-input/35"
                onClick={(event) => blurBeforeOpen(event, openFilters)}
              >
                <FunnelSimpleIcon data-icon="inline-start" />
                Filters
              </Button>
            </div>
          </div>

          <div className="hidden min-w-0 gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_150px_150px_170px_auto]">
            <div className="relative min-w-0 md:col-span-2 xl:col-span-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={desktopSearchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects..."
                className="h-11 rounded-2xl bg-input/45 pr-14 pl-9"
                aria-label="Search projects"
              />
              <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border border-border/50 bg-background/60">
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
            <div className="md:justify-self-start xl:justify-self-auto">
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
          </div>
          {selectedTechStacks.length > 0 && (
            <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
              <span className="text-xs text-muted-foreground">
                Active tech:
              </span>
              {selectedTechStacks.map((techStack) => (
                <Button
                  key={techStack}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 rounded-full px-2.5 text-xs"
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
                className="h-7 rounded-full px-2.5 text-xs"
                onClick={() => setSelectedTechStacks([])}
              >
                Clear
              </Button>
            </div>
          )}
          {!canReorder && viewMode === "list" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Reordering is available only in list view with order sorting and
              no active filters.
            </p>
          )}
        </CardContent>
      </Card>

      {filteredProjects.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center">
          <BriefcaseIcon className="size-12 text-muted-foreground/50" />
          <div>
            <p className="font-medium">No projects found</p>
            <p className="mt-1 text-sm text-muted-foreground">
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
      ) : viewMode === "grid" ? (
        <>
          <div className="hidden md:block">
            <ProjectsGrid projects={filteredProjects} />
          </div>
          <div className="md:hidden">
            <ProjectsList
              projects={filteredProjects}
              canReorder={false}
              onReorder={handleReorder}
            />
          </div>
        </>
      ) : (
        <ProjectsList
          projects={filteredProjects}
          canReorder={canReorder}
          onReorder={handleReorder}
        />
      )}

      <Drawer
        open={filtersOpen}
        onOpenChange={handleFiltersOpenChange}
        direction="bottom"
      >
        <DrawerContent className="p-0 before:inset-x-0 before:top-2 before:bottom-0 before:rounded-t-4xl before:rounded-b-none">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>
              Refine projects by status, featured state, tech stack, and order.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-4 px-4 pb-2">
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
              <p className="mb-2 text-xs font-medium text-muted-foreground">
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
                  ?.label ?? "Order asc"
              }
              options={sortOptions}
              onValueChange={setDraftSort}
            />
          </div>
          <DrawerFooter>
            <div className="grid grid-cols-2 gap-2">
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
