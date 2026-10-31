"use client";

import {
  BriefcaseIcon,
  CheckSquareIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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
  DashboardSort,
  DashboardViewToggle,
} from "@/features/dashboard/shared/components/filter-controls";
import { DashboardPagination } from "@/features/dashboard/shared/components/pagination";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { useDashboardFilter } from "@/features/dashboard/shared/hooks/use-dashboard-filter";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import type { ActionResult } from "@/lib/action-result";
import { ProjectStatus } from "@/lib/db/enums";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  actionDeleteProjects,
  actionMoveProjectsToDraft,
  actionPublishProjects,
} from "../actions";
import {
  type ProjectFeaturedFilter as FeaturedFilter,
  filterProjects,
  type ProjectStatusFilter as StatusFilter,
} from "../filtering";
import { isPublished } from "../presentation";
import type {
  DashboardProject,
  ProjectSortDirection as SortDirection,
  ProjectSortField as SortMode,
} from "../types";
import {
  FeaturedProjectBadge,
  ProjectActions,
  ProjectStatusBadge,
  ProjectThumbnail,
  TechPills,
} from "./project-display";
import { ProjectsList } from "./project-list";
import { ProjectsBatchActionsBar } from "./projects-batch-actions";

type ProjectsManagerProps = {
  projects: DashboardProject[];
};

type ViewMode = "list" | "grid";
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
  { value: "order", label: "Display order" },
  { value: "updated", label: "Last updated" },
  { value: "created", label: "Date created" },
  { value: "title", label: "Title" },
];

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
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
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
    direction: SortDirection;
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
  const [draftSortDirection, setDraftSortDirection] =
    useState<SortDirection>(sortDirection);
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

  const filteredProjects = useMemo(
    () =>
      filterProjects(items, {
        query,
        status,
        featured,
        selectedTechStacks,
        sortMode,
        sortDirection,
      }),
    [
      featured,
      items,
      query,
      selectedTechStacks,
      sortMode,
      sortDirection,
      status,
    ],
  );

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
  }, [
    featured,
    itemsPerPage,
    query,
    selectedTechStacks,
    sortMode,
    sortDirection,
    status,
  ]);

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
    setDraftSortDirection(sortDirection);
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
    setSortDirection(draftSortDirection);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftStatus("all");
    setDraftFeatured("all");
    setDraftTechStacks([]);
    setDraftSort("order");
    setDraftSortDirection("asc");
    setStatus("all");
    setFeatured("all");
    setSelectedTechStacks([]);
    setSortMode("order");
    setSortDirection("asc");
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
    Number(sortMode !== "order" || sortDirection !== "asc");
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
  const canReorder =
    reorderMode &&
    viewMode === "list" &&
    !batchMode &&
    sortMode === "order" &&
    sortDirection === "asc" &&
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
        setSortDirection(previous.direction);
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
      direction: sortDirection,
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
            <Button
              type="button"
              variant="outline"
              onClick={toggleReorderMode}
              aria-pressed={reorderMode}
              disabled={items.length < 2}
            >
              {reorderMode ? "Done reordering" : "Reorder"}
            </Button>
            <Button
              role="link"
              render={<Link href="/dashboard/projects/new" />}
              nativeButton={false}
              className="md:px-4 md:w-auto shrink-0"
            >
              <PlusIcon data-icon="inline-start" />
              <span>New Project</span>
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

              <div className="hidden items-end gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(140px,1fr)_minmax(90px,0.6fr)_minmax(100px,0.7fr)_minmax(150px,1fr)_minmax(220px,1fr)_auto] min-w-0">
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
                <DashboardSort
                  value={sortMode}
                  options={sortOptions}
                  onValueChange={setSortMode}
                  direction={sortDirection}
                  onDirectionChange={setSortDirection}
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

        {!reorderMode && hasRefinements && (
          <div
            className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm"
            role="status"
          >
            <span>
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"} found
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
              <DashboardPagination
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
            <DashboardSort
              value={draftSort}
              options={sortOptions}
              onValueChange={setDraftSort}
              direction={draftSortDirection}
              onDirectionChange={setDraftSortDirection}
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
                  setDraftSortDirection("asc");
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
