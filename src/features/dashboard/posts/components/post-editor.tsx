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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  actionAutosavePost,
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
import { TagsInput } from "@/features/dashboard/shared/components/tag-input";
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

function PostStatusBadge({
  status,
  compact = false,
}: {
  status: PostFormValues["status"];
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

function getTagArray(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function PostEditor({ mode, post }: PostEditorProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<
    "draft" | "publish" | null
  >(null);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [slugEdited, setSlugEdited] = useState(mode === "edit");
  const manualSavePending = useRef(false);
  const validationStatus = useRef<"draft" | "published" | null>(null);
  const autosaveInFlight = useRef<Promise<void> | null>(null);
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
    resolver: (values, context, options) =>
      zodResolver(postFormSchema)(
        { ...values, status: validationStatus.current ?? values.status },
        context,
        options,
      ),
    defaultValues: defaults,
  });

  const title = watch("title");
  const slug = watch("slug");
  const coverImage = watch("coverImage");
  const status = watch("status");
  const slugRegistration = register("slug");
  const isPending = pendingAction !== null;
  const primaryStatus =
    status === "published" || mode === "create" ? "published" : "draft";
  const primaryLabel =
    status === "published"
      ? "Save changes"
      : mode === "create"
        ? "Publish"
        : "Save draft";

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

  // Advance the saved baseline without replacing edits made during the request.
  const acceptSaved = useCallback(
    (snapshot: PostFormInput, savedStatus: "draft" | "published") => {
      const current = structuredClone(getValues());
      reset({ ...snapshot, status: savedStatus });
      reset({ ...current, status: savedStatus }, { keepDefaultValues: true });
    },
    [getValues, reset],
  );

  const autosave = useCallback(() => {
    if (
      mode !== "edit" ||
      !post?.id ||
      !isDirty ||
      manualSavePending.current ||
      autosaveInFlight.current
    )
      return;
    const snapshot = structuredClone(getValues());
    const parsed = postFormSchema.safeParse(snapshot);
    if (!parsed.success) {
      setAutosaveStatus("failed");
      return;
    }

    setAutosaveStatus("saving");
    const request = (async () => {
      try {
        const result = await actionAutosavePost(parsed.data, post.id);
        if (result.success && result.data) {
          acceptSaved(snapshot, result.data.status);
          setAutosaveStatus("saved");
        } else {
          setAutosaveStatus("failed");
        }
      } catch {
        setAutosaveStatus("failed");
      } finally {
        autosaveInFlight.current = null;
      }
    })();
    autosaveInFlight.current = request;
  }, [acceptSaved, getValues, isDirty, mode, post?.id]);

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
            ? await actionPublishPost(payload, post?.id)
            : await actionSavePostDraft(payload, post?.id);
        if (result.success && result.data) {
          acceptSaved(snapshot, result.data.status);
          setAutosaveStatus("saved");
          toast.add({
            title:
              status === "published" && nextStatus === "published"
                ? "Changes saved."
                : (result.message ?? "Saved."),
            type: "success",
          });
          if (mode === "create") {
            router.replace(`/dashboard/posts/${result.data.id}/edit`);
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
        "Move this post to draft? It will no longer be public. Your current edits will be saved.",
      )
    ) {
      void submitWithStatus("draft")();
    }
  };

  const handlePreview = () => {
    if (!slug) {
      toast.add({ title: "Add a slug before previewing.", type: "error" });
      return;
    }

    window.open(`/preview/posts/${slug}`, "_blank", "noopener,noreferrer");
  };

  return (
    <form
      className="flex flex-col gap-6 min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        void submitWithStatus(status)();
      }}
    >
      <div className="top-14 z-20 sticky flex xl:flex-row flex-col xl:justify-between xl:items-center gap-4 bg-background py-4 border-border border-b min-w-0">
        <div className="flex flex-col gap-2 min-w-0">
          <Button
            role="link"
            render={<Link href="/dashboard/posts" />}
            nativeButton={false}
            variant="ghost"
            className="w-fit"
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to Posts
          </Button>
          <div className="min-w-0">
            <h1 className="wrap-break-word">
              {mode === "create" ? "New Post" : "Edit Post"}
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground wrap-break-word">
              Write MDX content, manage metadata, and publish when it is ready.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3 sm:mr-2 w-full sm:w-auto">
            <PostStatusBadge status={status} />
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
            disabled={!slug || isPending}
          >
            <EyeIcon data-icon="inline-start" />
            Preview
          </Button>
          {status === "draft" && (
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={submitWithStatus(
                mode === "create" ? "draft" : "published",
              )}
            >
              {mode === "create" ? (
                <FloppyDiskIcon data-icon="inline-start" />
              ) : (
                <PaperPlaneTiltIcon data-icon="inline-start" />
              )}
              {mode === "create" ? "Save draft" : "Publish"}
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
      </div>

      <div className="gap-6 grid xl:grid-cols-[minmax(0,1fr)_360px] min-w-0">
        <div className="flex flex-col gap-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>
                MDX supports headings, links, lists, quotes, images, and code
                blocks.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
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
                <p className="mt-2 text-destructive text-sm">
                  {errors.content.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Public metadata for the blog listing and article header.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 min-w-0">
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
                  <p className="text-destructive text-sm">
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
                  <p className="text-destructive text-sm">
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
                    "text-muted-foreground text-sm",
                    errors.excerpt && "text-destructive",
                  )}
                >
                  {errors.excerpt?.message ?? "Maximum 280 characters."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardAction>
                <PostStatusBadge status={status} compact />
              </CardAction>
              <CardDescription>
                {status === "published"
                  ? "Saved edits update the published post directly."
                  : "Drafts stay private until you publish."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 min-w-0">
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
                  <p className="text-destructive text-sm">
                    {errors.scheduledPublishDate.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Cover & Tags</CardTitle>
              <CardDescription>
                Reuse the Cloudinary upload flow from the Media Library.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 min-w-0">
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
                  <p className="text-destructive text-sm">
                    {errors.coverImage.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <TagsInput
                      id="tags"
                      value={getTagArray(field.value ?? "")}
                      onChange={(nextTags) =>
                        field.onChange(nextTags.join(", "))
                      }
                      disabled={isPending}
                      placeholder="nextjs, ui, craft"
                    />
                  )}
                />
                <p className="text-muted-foreground text-sm">
                  Type comma + space to create a tag.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
