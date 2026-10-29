"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  CaretDownIcon,
  EyeIcon,
  FloppyDiskIcon,
  PaperPlaneTiltIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  actionAutosaveProject,
  actionPublishProject,
  actionSaveProjectDraft,
} from "@/features/dashboard/projects/actions";
import { ScreenshotsUpload } from "@/features/dashboard/projects/components/screenshots-upload";
import {
  type ProjectFormInput,
  type ProjectFormValues,
  projectFormSchema,
  type ScreenshotItemInput,
} from "@/features/dashboard/projects/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import { TagsInput } from "@/features/dashboard/shared/components/tag-input";
import { useUnsavedChangesGuard } from "@/features/dashboard/shared/hooks/use-unsaved-changes-guard";
import { createSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";

const MdxEditor = dynamic(
  () =>
    import("@/features/dashboard/shared/components/mdx-editor").then(
      (module) => module.DashboardMdxEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <Textarea
        readOnly
        className="min-h-105 font-mono text-sm"
        value="Loading editor..."
      />
    ),
  },
);

type ProjectEditorProject = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  contribution: string | null;
  content: string | null;
  coverImage: string | null;
  thumbnailImageUrl: string | null;
  ogImageUrl: string | null;
  structuredScreenshots: ScreenshotItemInput[];
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  order: number;
  isFeatured: boolean;
  isClosedSource: boolean;
  status: "draft" | "published";
};

type ProjectEditorProps =
  | {
      mode: "create";
      project?: never;
    }
  | {
      mode: "edit";
      project: ProjectEditorProject;
    };

const emptyDefaults: ProjectFormValues = {
  title: "",
  slug: "",
  description: "",
  contribution: "",
  content: "",
  coverImage: undefined,
  thumbnailImageUrl: undefined,
  ogImageUrl: undefined,
  structuredScreenshots: [],
  techStack: "",
  liveUrl: undefined,
  githubUrl: undefined,
  order: 0,
  isFeatured: false,
  isClosedSource: false,
  status: "draft",
};

type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

function getDefaults(project?: ProjectEditorProject): ProjectFormValues {
  if (!project) {
    return emptyDefaults;
  }

  return {
    title: project.title,
    slug: project.slug,
    description: project.description ?? "",
    contribution: project.contribution ?? "",
    content: project.content ?? "",
    coverImage: project.coverImage ?? undefined,
    thumbnailImageUrl: project.thumbnailImageUrl ?? undefined,
    ogImageUrl: project.ogImageUrl ?? undefined,
    structuredScreenshots: project.structuredScreenshots.map((s, i) => ({
      imageUrl: s.imageUrl,
      caption: s.caption ?? undefined,
      altText: s.altText ?? undefined,
      order: s.order ?? i,
      id: s.id,
      width: s.width,
      height: s.height,
      aspectRatio: s.aspectRatio,
      blurDataUrl: s.blurDataUrl,
    })),
    techStack: project.techStack.join(", "),
    liveUrl: project.liveUrl ?? undefined,
    githubUrl: project.githubUrl ?? undefined,
    order: project.order,
    isFeatured: project.isFeatured,
    isClosedSource: project.isClosedSource,
    status: project.status,
  };
}

function ProjectStatusBadge({
  status,
  compact = false,
}: {
  status: ProjectFormValues["status"];
  compact?: boolean;
}) {
  const isPublished = status === "published";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs",
        isPublished
          ? "bg-success/10 text-success"
          : "bg-muted text-muted-foreground",
        compact && "px-2 py-0.5",
      )}
    >
      <span
        className={cn(
          "rounded-full size-1.5",
          isPublished ? "bg-success" : "bg-muted-foreground",
        )}
      />
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

function AutosaveStatusPill({
  status,
  isDirty,
  isNew,
}: {
  status: AutosaveStatus;
  isDirty: boolean;
  isNew: boolean;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "text-muted-foreground text-sm",
        status === "failed" && "text-destructive",
      )}
    >
      {status === "saving"
        ? "Saving…"
        : status === "failed"
          ? "Save failed. Your changes are still here."
          : isDirty
            ? "Unsaved changes"
            : isNew && status !== "saved"
              ? "Not saved yet"
              : "All changes saved"}
    </span>
  );
}

function getTechStackArray(techStack: string) {
  return techStack
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function ProjectEditor({ mode, project }: ProjectEditorProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "draft" | "publish" | null
  >(null);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const manualSavePending = useRef(false);
  const validationStatus = useRef<"draft" | "published" | null>(null);
  const autosaveInFlight = useRef<Promise<void> | null>(null);
  const defaults = useMemo(() => getDefaults(project), [project]);

  const {
    control,
    formState: { errors, isDirty },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: (values, context, options) =>
      zodResolver(projectFormSchema)(
        { ...values, status: validationStatus.current ?? values.status },
        context,
        options,
      ),
    defaultValues: defaults,
  });

  useUnsavedChangesGuard(isDirty, "this project");
  const [savedSlug, setSavedSlug] = useState(project?.slug ?? "");
  const title = watch("title");
  const slug = watch("slug");
  const coverImage = watch("coverImage");
  const thumbnailImageUrl = watch("thumbnailImageUrl");
  const ogImageUrl = watch("ogImageUrl");
  const status = watch("status");
  const structuredScreenshots = watch("structuredScreenshots") ?? [];
  const slugRegistration = register("slug");
  const isPending = pendingAction !== null;
  const primaryStatus = status === "published" ? "published" : "draft";
  const primaryLabel = status === "published" ? "Save changes" : "Save draft";

  useEffect(() => {
    if (!slugEdited) {
      setValue("slug", createSlug(title), {
        shouldDirty: title.trim().length > 0,
        shouldValidate: title.trim().length > 0,
      });
    }
  }, [setValue, slugEdited, title]);

  useEffect(() => {
    if (!project?.id) {
      return;
    }

    const label = title.trim() || slug || project.slug;
    window.localStorage.setItem(
      `dashboard-breadcrumb:project:${project.id}`,
      JSON.stringify({
        href: `/dashboard/projects/${project.id}/edit`,
        label,
      }),
    );
    window.dispatchEvent(new Event("dashboard-breadcrumb-labels-changed"));
  }, [project?.id, project?.slug, slug, title]);

  const applyFieldErrors = useCallback(
    (fieldErrors?: Record<string, string[]>) => {
      if (!fieldErrors) {
        return;
      }

      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (messages[0]) {
          setError(field as keyof ProjectFormValues, {
            message: messages[0],
            type: "server",
          });
        }
      }
    },
    [setError],
  );

  // Advance the saved baseline without replacing edits made during the request.
  const acceptSaved = useCallback(
    (snapshot: ProjectFormInput, savedStatus: "draft" | "published") => {
      const current = structuredClone(getValues());
      reset({ ...snapshot, status: savedStatus });
      reset({ ...current, status: savedStatus }, { keepDefaultValues: true });
    },
    [getValues, reset],
  );

  const autosave = useCallback(() => {
    if (
      mode !== "edit" ||
      !project?.id ||
      !isDirty ||
      manualSavePending.current ||
      autosaveInFlight.current
    )
      return;
    const snapshot = structuredClone(getValues());
    const parsed = projectFormSchema.safeParse(snapshot);
    if (!parsed.success) {
      setAutosaveStatus("failed");
      for (const issue of parsed.error.issues)
        setError(issue.path[0] as keyof ProjectFormValues, {
          message: issue.message,
          type: "validation",
        });
      return;
    }

    setAutosaveStatus("saving");
    const request = (async () => {
      try {
        const result = await actionAutosaveProject(parsed.data, project.id);
        if (result.success && result.data) {
          acceptSaved(snapshot, result.data.status);
          setSavedSlug(result.data.slug);
          setAutosaveStatus("saved");
        } else {
          setAutosaveStatus("failed");
          if (!result.success) applyFieldErrors(result.fieldErrors);
        }
      } catch {
        setAutosaveStatus("failed");
      } finally {
        autosaveInFlight.current = null;
      }
    })();
    autosaveInFlight.current = request;
  }, [
    acceptSaved,
    applyFieldErrors,
    getValues,
    isDirty,
    mode,
    project?.id,
    setError,
  ]);

  useEffect(() => {
    if (mode !== "edit") return;
    const interval = window.setInterval(autosave, 30_000);
    return () => window.clearInterval(interval);
  }, [autosave, mode]);

  const submitWithStatus = (nextStatus: "draft" | "published") => async () => {
    // Lock synchronously: React state alone cannot prevent two clicks or a timer race.
    if (manualSavePending.current) return;
    manualSavePending.current = true;
    setPendingAction(nextStatus === "published" ? "publish" : "draft");
    try {
      // Capture and validate the latest values only after the older write finishes.
      await autosaveInFlight.current;
      validationStatus.current = nextStatus;
      await handleSubmit(async (values) => {
        const snapshot = structuredClone(getValues());
        const payload = { ...values, status: nextStatus };
        const result =
          nextStatus === "published"
            ? await actionPublishProject(payload, project?.id)
            : await actionSaveProjectDraft(payload, project?.id);
        if (result.success && result.data) {
          acceptSaved(snapshot, result.data.status);
          setSavedSlug(result.data.slug);
          setAutosaveStatus("saved");
          toast.add({
            title:
              status === "published" && nextStatus === "published"
                ? "Changes saved."
                : (result.message ?? "Saved."),
            type: "success",
          });
          if (mode === "create") {
            router.replace(`/dashboard/projects/${result.data.id}/edit`);
          } else {
            router.refresh();
          }
        } else if (!result.success) {
          setAutosaveStatus("failed");
          applyFieldErrors(result.fieldErrors);
          toast.add({ title: result.error, type: "error" });
        }
      })();
    } catch {
      setAutosaveStatus("failed");
      toast.add({
        title: "Could not save. Your changes are still here; try again.",
        type: "error",
      });
    } finally {
      validationStatus.current = null;
      manualSavePending.current = false;
      setPendingAction(null);
    }
  };

  const moveToDraft = () => {
    if (
      window.confirm(
        "Move this project to draft? It will no longer be public. Your current edits will be saved.",
      )
    ) {
      void submitWithStatus("draft")();
    }
  };

  const handlePreview = () => {
    if (!savedSlug) {
      toast.add({ title: "Save this draft before previewing.", type: "error" });
      return;
    }

    window.open(
      `/preview/projects/${savedSlug}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <form
      className="flex flex-col gap-6 min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        void submitWithStatus(status)();
      }}
    >
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex flex-col gap-2">
          <Button
            role="link"
            render={<Link href="/dashboard/projects" />}
            nativeButton={false}
            variant="ghost"
            className="w-fit"
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Projects
          </Button>
          <div className="min-w-0">
            <h1 className="wrap-break-word">
              {mode === "create" ? "New Project" : "Edit Project"}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground wrap-break-word">
              Shape portfolio case studies, visuals, links, and publish state.
            </p>
          </div>
        </div>
      </div>
      <div
        className="top-14 z-20 sticky flex flex-wrap items-center gap-2 bg-background py-3 border-border border-y min-w-0"
        aria-label="Project save actions"
      >
        <div className="flex flex-wrap items-center gap-3 sm:mr-2 w-full sm:w-auto">
          <ProjectStatusBadge status={status} />
          <AutosaveStatusPill
            status={isPending ? "saving" : autosaveStatus}
            isDirty={isDirty}
            isNew={mode === "create"}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handlePreview}
          disabled={!savedSlug || isPending}
          aria-label="Preview saved version"
        >
          <EyeIcon data-icon="inline-start" />
          Preview saved
        </Button>
        {status === "draft" && (
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={submitWithStatus("published")}
          >
            <PaperPlaneTiltIcon data-icon="inline-start" />
            Publish
          </Button>
        )}
        <Button
          type="button"
          onClick={submitWithStatus(primaryStatus)}
          disabled={isPending}
        >
          {isPending ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <FloppyDiskIcon data-icon="inline-start" />
          )}
          {isPending ? "Saving…" : primaryLabel}
        </Button>
        {status === "published" && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Publishing options"
                />
              }
              disabled={isPending}
            >
              <CaretDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={moveToDraft}>
                Move to draft…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className="text-muted-foreground text-xs" role="note">
        {status === "published"
          ? "Edits autosave every 30 seconds directly to the live project."
          : mode === "create"
            ? "Save your first draft to enable preview. Drafts stay private."
            : "Draft changes autosave every 30 seconds."}{" "}
        Preview shows the last saved version.
      </p>

      <div className="items-start gap-6 grid xl:grid-cols-[minmax(0,1fr)_320px] min-w-0">
        <section className="min-w-0" aria-label="Project identity">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Public metadata for project cards and the detail header.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-5 grid sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  aria-describedby={errors.title ? "title-help" : undefined}
                  placeholder="Storylio CMS"
                  aria-invalid={!!errors.title}
                  disabled={isPending}
                  {...register("title")}
                />
                {errors.title?.message && (
                  <p
                    id="title-help"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  aria-describedby={errors.slug ? "slug-help" : undefined}
                  placeholder="storylio-cms"
                  aria-invalid={!!errors.slug}
                  disabled={isPending}
                  name={slugRegistration.name}
                  onBlur={slugRegistration.onBlur}
                  ref={slugRegistration.ref}
                  value={slug}
                  onChange={(event) => {
                    setSlugEdited(true);
                    slugRegistration.onChange(event);
                  }}
                />
                {errors.slug?.message && (
                  <p
                    id="slug-help"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Short description</Label>
                <Textarea
                  id="description"
                  aria-describedby="description-help"
                  placeholder="A concise summary for project cards."
                  aria-invalid={!!errors.description}
                  disabled={isPending}
                  className="min-h-24"
                  {...register("description")}
                />
                <p
                  id="description-help"
                  className={cn(
                    "text-muted-foreground text-sm",
                    errors.description && "text-destructive",
                  )}
                >
                  {errors.description?.message ?? "Maximum 320 characters."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="contribution">Contribution</Label>
                <Input
                  id="contribution"
                  aria-describedby="contribution-help"
                  placeholder="Design & full-stack development"
                  aria-invalid={!!errors.contribution}
                  disabled={isPending}
                  {...register("contribution")}
                />
                <p
                  id="contribution-help"
                  className={cn(
                    "text-muted-foreground text-sm",
                    errors.contribution && "text-destructive",
                  )}
                >
                  {errors.contribution?.message ??
                    "Your contribution to this project. Maximum 160 characters."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="order">Display order</Label>
                <Input
                  id="order"
                  aria-describedby={errors.order ? "order-help" : undefined}
                  type="number"
                  min={0}
                  aria-invalid={!!errors.order}
                  disabled={isPending}
                  {...register("order")}
                />
                {errors.order?.message && (
                  <p
                    id="order-help"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.order.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
        <aside className="min-w-0" aria-label="Publication">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardAction>
                <ProjectStatusBadge status={status} compact />
              </CardAction>
              <CardDescription>
                {status === "published"
                  ? "Saved edits update the published project directly."
                  : "Drafts stay private until you publish."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 min-w-0">
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <div className="flex justify-between items-start gap-4 py-2">
                    <div>
                      <Label htmlFor="isFeatured">Featured project</Label>
                      <p className="mt-1 text-muted-foreground text-sm leading-5">
                        Featured projects are prioritized on Home and Projects
                        pages.
                      </p>
                    </div>
                    <Switch
                      id="isFeatured"
                      checked={field.value}
                      disabled={isPending}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </aside>
        <section className="xl:col-span-2 min-w-0" aria-label="Case study">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Case Study</CardTitle>
              <CardDescription>
                Long-form MDX content for the public project detail page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <MdxEditor
                    ariaLabel="Project case study"
                    placeholder="Write the project case study..."
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.content?.message}
                  />
                )}
              />
            </CardContent>
          </Card>
        </section>
        <section className="xl:col-span-2 min-w-0" aria-label="Project media">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Choose a cover, add screenshots, and optionally override card
                and social-sharing images.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-5 grid sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-sm">Cover image</h3>
                <ImageUpload
                  value={coverImage}
                  disabled={isPending}
                  cropAspect={16 / 9}
                  cropLabel="Crop project cover image"
                  onChange={(url) =>
                    setValue("coverImage", url, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  onRemove={() =>
                    setValue("coverImage", undefined, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {errors.coverImage?.message && (
                  <p className="text-destructive text-sm">
                    {errors.coverImage.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-sm">Screenshots</h3>
                <Controller
                  control={control}
                  name="structuredScreenshots"
                  render={({ field }) => (
                    <ScreenshotsUpload
                      value={field.value}
                      disabled={isPending}
                      onChange={(items) => field.onChange(items)}
                    />
                  )}
                />
                <p className="text-muted-foreground text-sm">
                  {structuredScreenshots.length}{" "}
                  {structuredScreenshots.length === 1
                    ? "screenshot"
                    : "screenshots"}{" "}
                  attached.
                </p>
                {errors.structuredScreenshots?.message && (
                  <p className="text-destructive text-sm">
                    {errors.structuredScreenshots.message}
                  </p>
                )}
              </div>
              <details
                className="sm:col-span-2 pt-4 border-border border-t"
                open={
                  errors.thumbnailImageUrl || errors.ogImageUrl
                    ? true
                    : undefined
                }
              >
                <summary className="py-2 focus-visible:outline-2 focus-visible:outline-ring font-medium text-sm cursor-pointer">
                  Card image and social sharing (optional)
                </summary>
                <div className="gap-5 grid sm:grid-cols-2 mt-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">
                      Thumbnail / card image
                    </h3>
                    <ImageUpload
                      value={thumbnailImageUrl}
                      disabled={isPending}
                      cropAspect={16 / 9}
                      cropLabel="Crop project card image"
                      onChange={(url) =>
                        setValue("thumbnailImageUrl", url, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      onRemove={() =>
                        setValue("thumbnailImageUrl", undefined, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <p className="text-muted-foreground text-sm">
                      Optional. Project cards use this first, then fall back to
                      the cover image.
                    </p>
                    {errors.thumbnailImageUrl?.message && (
                      <p className="text-destructive text-sm">
                        {errors.thumbnailImageUrl.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-medium text-sm">OG image</h3>
                    <ImageUpload
                      value={ogImageUrl}
                      disabled={isPending}
                      cropAspect={1200 / 630}
                      cropLabel="Crop project OG image"
                      onChange={(url) =>
                        setValue("ogImageUrl", url, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      onRemove={() =>
                        setValue("ogImageUrl", undefined, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    <p className="text-muted-foreground text-sm">
                      Used when this project is shared on social platforms.
                      Recommended ratio: 1200×630.
                    </p>
                    {errors.ogImageUrl?.message && (
                      <p className="text-destructive text-sm">
                        {errors.ogImageUrl.message}
                      </p>
                    )}
                  </div>
                </div>
              </details>
            </CardContent>
          </Card>
        </section>
        <section
          className="xl:col-span-2 min-w-0"
          aria-label="Links and technologies"
        >
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Links & Stack</CardTitle>
              <CardDescription>
                External URLs and comma-separated technologies.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-5 grid sm:grid-cols-2">
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="techStack">Tech stack</Label>
                <Controller
                  control={control}
                  name="techStack"
                  render={({ field }) => (
                    <TagsInput
                      id="techStack"
                      value={getTechStackArray(field.value ?? "")}
                      onChange={(nextTechStack) =>
                        field.onChange(nextTechStack.join(", "))
                      }
                      disabled={isPending}
                      placeholder="nextjs, prisma, cloudinary"
                    />
                  )}
                />
                <p className="text-muted-foreground text-sm">
                  Type comma + space to create a tech stack tag.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="liveUrl">Live URL</Label>
                <Input
                  id="liveUrl"
                  aria-describedby={errors.liveUrl ? "liveUrl-help" : undefined}
                  type="url"
                  placeholder="https://heinz.id"
                  aria-invalid={!!errors.liveUrl}
                  disabled={isPending}
                  {...register("liveUrl")}
                />
                {errors.liveUrl?.message && (
                  <p
                    id="liveUrl-help"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.liveUrl.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  aria-describedby={
                    errors.githubUrl ? "githubUrl-help" : undefined
                  }
                  type="url"
                  placeholder="https://github.com/username/repo"
                  aria-invalid={!!errors.githubUrl}
                  disabled={isPending}
                  {...register("githubUrl")}
                />
                {errors.githubUrl?.message && (
                  <p
                    id="githubUrl-help"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.githubUrl.message}
                  </p>
                )}
              </div>

              <Controller
                control={control}
                name="isClosedSource"
                render={({ field }) => (
                  <div className="flex justify-between items-start gap-4 sm:col-span-2 py-2">
                    <div>
                      <Label htmlFor="isClosedSource">Closed source</Label>
                      <p className="mt-1 text-muted-foreground text-sm leading-5">
                        Hide GitHub button even if repository URL is empty or
                        unavailable.
                      </p>
                    </div>
                    <Switch
                      id="isClosedSource"
                      checked={field.value}
                      disabled={isPending}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </form>
  );
}
