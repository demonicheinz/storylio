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
  actionPublishPost,
  actionSavePostDraft,
} from "@/features/dashboard/posts/actions";
import {
  type PostFormInput,
  type PostFormValues,
  postFormSchema,
} from "@/features/dashboard/posts/validations";
import { DateTimePicker } from "@/features/dashboard/shared/components/date-time-picker";
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

type PostEditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  tags: string[];
};

type PostEditorProps =
  | {
      mode: "create";
      post?: never;
    }
  | {
      mode: "edit";
      post: PostEditorPost;
    };

const emptyDefaults: PostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  coverImage: undefined,
  tags: "",
  status: "draft",
  scheduledPublishDate: undefined,
  content: "",
};

type AutosaveStatus = "idle" | "saving" | "saved" | "failed";

function getDefaults(post?: PostEditorPost): PostFormValues {
  if (!post) {
    return emptyDefaults;
  }

  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    coverImage: post.coverImage ?? undefined,
    tags: post.tags.join(", "),
    status: post.status,
    scheduledPublishDate: post.publishedAt ?? undefined,
    content: post.content,
  };
}

function getSubmitLabels(status: PostFormValues["status"]) {
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

export function PostEditor({ mode, post }: PostEditorProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "draft" | "publish" | null
  >(null);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const manualSaveVersion = useRef(0);
  const autosaveInFlight = useRef(false);
  const defaults = useMemo(() => getDefaults(post), [post]);

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
  } = useForm<PostFormInput, unknown, PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: defaults,
  });

  const title = watch("title");
  const slug = watch("slug");
  const coverImage = watch("coverImage");
  const status = watch("status");
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
    if (!post?.id) {
      return;
    }

    const label = title.trim() || slug || post.slug;
    window.localStorage.setItem(
      `dashboard-breadcrumb:post:${post.id}`,
      JSON.stringify({
        href: `/dashboard/posts/${post.id}/edit`,
        label,
      }),
    );
    window.dispatchEvent(new Event("dashboard-breadcrumb-labels-changed"));
  }, [post?.id, post?.slug, slug, title]);

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages[0]) {
        setError(field as keyof PostFormValues, {
          message: messages[0],
          type: "server",
        });
      }
    }
  };

  const autosaveDraft = useCallback(async () => {
    if (
      mode !== "edit" ||
      !post?.id ||
      !isDirty ||
      pendingAction !== null ||
      autosaveInFlight.current
    ) {
      return;
    }

    const parsed = postFormSchema.safeParse({
      ...getValues(),
      status: "draft",
    });

    if (!parsed.success) {
      setAutosaveStatus("failed");
      return;
    }

    const versionAtStart = manualSaveVersion.current;
    autosaveInFlight.current = true;
    setAutosaveStatus("saving");

    const result = await actionSavePostDraft(parsed.data, post.id);

    autosaveInFlight.current = false;

    if (versionAtStart !== manualSaveVersion.current) {
      return;
    }

    if (result.success) {
      const nextValues = {
        ...parsed.data,
        status: result.data?.status ?? "draft",
      } satisfies PostFormValues;

      reset(nextValues);
      setAutosaveStatus("saved");
      router.refresh();
      return;
    }

    setAutosaveStatus("failed");
  }, [getValues, isDirty, mode, pendingAction, post?.id, reset, router]);

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    const interval = window.setInterval(() => {
      autosaveDraft();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [autosaveDraft, mode]);

  const submitWithStatus = (nextStatus: "draft" | "published") =>
    handleSubmit(async (values) => {
      manualSaveVersion.current += 1;
      setPendingAction(nextStatus === "published" ? "publish" : "draft");
      setAutosaveStatus("idle");

      const payload = {
        ...values,
        status: nextStatus,
      };

      const result =
        nextStatus === "published"
          ? await actionPublishPost(payload, post?.id)
          : await actionSavePostDraft(payload, post?.id);

      if (result.success) {
        const message =
          result.message ??
          (nextStatus === "published" ? "Post published." : "Draft saved.");

        toast.success(message);

        if (result.data) {
          setValue("status", result.data.status);

          if (mode === "create") {
            router.replace(`/dashboard/posts/${result.data.id}/edit`);
          } else {
            reset({
              ...values,
              status: result.data.status,
            });
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

    window.open(`/blog/${slug}`, "_blank", "noopener,noreferrer");
  };

  return (
    <form className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/dashboard/posts">
              <ArrowLeftIcon data-icon="inline-start" />
              Posts
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold">
              {mode === "create" ? "New Post" : "Edit Post"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              Write MDX content, manage metadata, and publish when it is ready.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && autosaveStatus !== "idle" && (
            <span
              className={cn(
                "rounded-full border border-border/50 bg-surface/60 px-3 py-1 text-xs text-muted-foreground",
                autosaveStatus === "saving" && "text-brand-soft",
                autosaveStatus === "failed" && "text-destructive",
              )}
            >
              {autosaveStatus === "saving"
                ? "Autosaving..."
                : autosaveStatus === "saved"
                  ? "Autosaved"
                  : "Autosave failed"}
            </span>
          )}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                MDX supports headings, links, lists, quotes, images, and code
                blocks.
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
                Public metadata for the blog listing and article header.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Designing durable interfaces"
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
                  placeholder="designing-durable-interfaces"
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
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="A short summary for cards and metadata."
                  aria-invalid={!!errors.excerpt}
                  disabled={isPending}
                  className="min-h-24"
                  {...register("excerpt")}
                />
                <p
                  className={cn(
                    "text-xs text-muted-foreground",
                    errors.excerpt && "text-destructive",
                  )}
                >
                  {errors.excerpt?.message ?? "Maximum 280 characters."}
                </p>
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
                Save as draft while editing, or publish to make it public.
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
                            field.onChange(value as PostFormValues["status"])
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="scheduledPublishDate">
                  Scheduled publish date
                </Label>
                <Controller
                  control={control}
                  name="scheduledPublishDate"
                  render={({ field }) => (
                    <DateTimePicker
                      id="scheduledPublishDate"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  )}
                />
                {errors.scheduledPublishDate?.message && (
                  <p className="text-sm text-destructive">
                    {errors.scheduledPublishDate.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover & Tags</CardTitle>
              <CardDescription>
                Reuse the Cloudinary upload flow from the Media Library.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label>Cover image</Label>
                <ImageUpload
                  value={coverImage}
                  disabled={isPending}
                  cropAspect={16 / 9}
                  cropLabel="Crop blog cover image"
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
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="nextjs, ui, craft"
                  disabled={isPending}
                  {...register("tags")}
                />
                <p className="text-xs text-muted-foreground">
                  Separate tags with commas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
