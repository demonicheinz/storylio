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
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  actionPublishProject,
  actionSaveProjectDraft,
} from "@/features/dashboard/projects/actions";
import { ScreenshotsUpload } from "@/features/dashboard/projects/components/screenshots-upload";
import {
  type ProjectFormInput,
  type ProjectFormValues,
  projectFormSchema,
} from "@/features/dashboard/projects/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
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
        className="min-h-[420px] font-mono text-sm"
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
  content: string | null;
  coverImage: string | null;
  screenshots: string[];
  techStack: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  order: number;
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
  content: "",
  coverImage: undefined,
  screenshots: [],
  techStack: "",
  liveUrl: undefined,
  githubUrl: undefined,
  order: 0,
  status: "draft",
};

function getDefaults(project?: ProjectEditorProject): ProjectFormValues {
  if (!project) {
    return emptyDefaults;
  }

  return {
    title: project.title,
    slug: project.slug,
    description: project.description ?? "",
    content: project.content ?? "",
    coverImage: project.coverImage ?? undefined,
    screenshots: project.screenshots,
    techStack: project.techStack.join(", "),
    liveUrl: project.liveUrl ?? undefined,
    githubUrl: project.githubUrl ?? undefined,
    order: project.order,
    status: project.status,
  };
}

function getSubmitLabels(status: ProjectFormValues["status"]) {
  if (status === "published") {
    return {
      draft: "Move to Draft",
      draftPending: "Moving...",
      publish: "Update Published",
      publishPending: "Updating...",
    };
  }

  return {
    draft: "Save Draft",
    draftPending: "Saving...",
    publish: "Publish",
    publishPending: "Publishing...",
  };
}

export function ProjectEditor({ mode, project }: ProjectEditorProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "draft" | "publish" | null
  >(null);
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const defaults = useMemo(() => getDefaults(project), [project]);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: defaults,
  });

  const title = watch("title");
  const slug = watch("slug");
  const coverImage = watch("coverImage");
  const status = watch("status");
  const screenshots = watch("screenshots") ?? [];
  const slugRegistration = register("slug");
  const isPending = pendingAction !== null;
  const submitLabels = getSubmitLabels(status);

  useEffect(() => {
    if (!slugEdited) {
      setValue("slug", createSlug(title), {
        shouldDirty: true,
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

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
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
  };

  const submitWithStatus = (nextStatus: "draft" | "published") =>
    handleSubmit(async (values) => {
      setPendingAction(nextStatus === "published" ? "publish" : "draft");

      const payload = {
        ...values,
        status: nextStatus,
      };

      const result =
        nextStatus === "published"
          ? await actionPublishProject(payload, project?.id)
          : await actionSaveProjectDraft(payload, project?.id);

      if (result.success) {
        const message =
          result.message ??
          (nextStatus === "published" ? "Project published." : "Draft saved.");

        toast.success(message);

        if (result.data) {
          setValue("status", result.data.status);

          if (mode === "create") {
            router.replace(`/dashboard/projects/${result.data.id}/edit`);
          } else {
            router.refresh();
          }
        }
      } else {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error);
      }

      setPendingAction(null);
    });

  const handlePreview = () => {
    if (!slug) {
      toast.error("Add a slug before previewing.");
      return;
    }

    window.open(`/projects/${slug}`, "_blank", "noopener,noreferrer");
  };

  return (
    <form className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/dashboard/projects">
              <ArrowLeftIcon data-icon="inline-start" />
              Projects
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold">
              {mode === "create" ? "New Project" : "Edit Project"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Shape portfolio case studies, visuals, links, and publish state.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {status}
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={!slug || isPending}
          >
            <EyeIcon data-icon="inline-start" />
            Preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={submitWithStatus("draft")}
            disabled={isPending}
          >
            {pendingAction === "draft" ? (
              <SpinnerIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <FloppyDiskIcon data-icon="inline-start" />
            )}
            {pendingAction === "draft"
              ? submitLabels.draftPending
              : submitLabels.draft}
          </Button>
          <Button
            type="button"
            onClick={submitWithStatus("published")}
            disabled={isPending}
          >
            {pendingAction === "publish" ? (
              <SpinnerIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <PaperPlaneTiltIcon data-icon="inline-start" />
            )}
            {pendingAction === "publish"
              ? submitLabels.publishPending
              : submitLabels.publish}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <Card>
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
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors.content?.message}
                  />
                )}
              />
              {errors.content?.message && (
                <p className="mt-2 text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Public metadata for project cards and the detail header.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Storylio CMS"
                  aria-invalid={!!errors.title}
                  disabled={isPending}
                  {...register("title")}
                />
                {errors.title?.message && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
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
                  <p className="text-sm text-destructive">
                    {errors.slug.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Short description</Label>
                <Textarea
                  id="description"
                  placeholder="A concise summary for project cards."
                  aria-invalid={!!errors.description}
                  disabled={isPending}
                  className="min-h-24"
                  {...register("description")}
                />
                <p
                  className={cn(
                    "text-xs text-muted-foreground",
                    errors.description && "text-destructive",
                  )}
                >
                  {errors.description?.message ?? "Maximum 320 characters."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="order">Display order</Label>
                <Input
                  id="order"
                  type="number"
                  min={0}
                  aria-invalid={!!errors.order}
                  disabled={isPending}
                  {...register("order")}
                />
                {errors.order?.message && (
                  <p className="text-sm text-destructive">
                    {errors.order.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardAction>
                <Badge variant={status === "published" ? "default" : "outline"}>
                  {status}
                </Badge>
              </CardAction>
              <CardDescription>
                Keep projects as drafts until they are ready for the portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={isPending}>
                        <Button
                          id="status"
                          type="button"
                          variant="outline"
                          className="h-9 w-full justify-between rounded-3xl bg-input/50 px-3 font-normal"
                        >
                          <span>
                            {field.value === "published"
                              ? "Published"
                              : "Draft"}
                          </span>
                          <CaretDownIcon data-icon="inline-end" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuRadioGroup
                          value={field.value}
                          onValueChange={(value) =>
                            field.onChange(value as ProjectFormValues["status"])
                          }
                        >
                          <DropdownMenuRadioItem value="draft">
                            Draft
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="published">
                            Published
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links & Stack</CardTitle>
              <CardDescription>
                External URLs and comma-separated technologies.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="techStack">Tech stack</Label>
                <Input
                  id="techStack"
                  placeholder="Next.js, Prisma, Cloudinary"
                  disabled={isPending}
                  {...register("techStack")}
                />
                <p className="text-xs text-muted-foreground">
                  Separate technologies with commas.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="liveUrl">Live URL</Label>
                <Input
                  id="liveUrl"
                  type="url"
                  placeholder="https://heinz.id"
                  aria-invalid={!!errors.liveUrl}
                  disabled={isPending}
                  {...register("liveUrl")}
                />
                {errors.liveUrl?.message && (
                  <p className="text-sm text-destructive">
                    {errors.liveUrl.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/username/repo"
                  aria-invalid={!!errors.githubUrl}
                  disabled={isPending}
                  {...register("githubUrl")}
                />
                {errors.githubUrl?.message && (
                  <p className="text-sm text-destructive">
                    {errors.githubUrl.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Cover image and screenshots upload through Cloudinary.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>Cover image</Label>
                <ImageUpload
                  value={coverImage}
                  disabled={isPending}
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
                  <p className="text-sm text-destructive">
                    {errors.coverImage.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label>Screenshots</Label>
                <Controller
                  control={control}
                  name="screenshots"
                  render={({ field }) => (
                    <ScreenshotsUpload
                      value={field.value}
                      disabled={isPending}
                      onChange={(urls) => field.onChange(urls)}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {screenshots.length}{" "}
                  {screenshots.length === 1 ? "screenshot" : "screenshots"}{" "}
                  attached.
                </p>
                {errors.screenshots?.message && (
                  <p className="text-sm text-destructive">
                    {errors.screenshots.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
