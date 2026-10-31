"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  CaretDownIcon,
  ClockIcon,
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
import { getPostPublicationState } from "@/features/dashboard/posts/publication-state";
import { reconcilePostSave } from "@/features/dashboard/posts/reconcile-save";
import {
  type PostFormInput,
  type PostFormValues,
  postFormSchema,
} from "@/features/dashboard/posts/validations";
import { DateTimePicker } from "@/features/dashboard/shared/components/date-time-picker";
import { DashboardSelect } from "@/features/dashboard/shared/components/filter-controls";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import { TagsInput } from "@/features/dashboard/shared/components/tag-input";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { useUnsavedChangesGuard } from "@/features/dashboard/shared/hooks/use-unsaved-changes-guard";
import { createSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { usePublicationClock } from "./use-publication-clock";

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
  publicationIntent: "keep",
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
    publicationIntent: "keep",
    content: post.content,
  };
}

function PostStatusBadge({
  status,
  compact = false,
  publishedAt,
  now,
}: {
  status: PostFormValues["status"];
  publishedAt?: string | null;
  now: number;
  compact?: boolean;
}) {
  const state = getPostPublicationState(status, publishedAt, now);
  const isPublished = state === "published";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 bg-surface px-2 border border-border rounded-md h-6 font-medium text-xs",
        isPublished
          ? "text-success"
          : state === "scheduled"
            ? "text-brand-soft"
            : "text-muted-foreground",
        compact && "px-2",
      )}
    >
      {state === "scheduled" ? (
        <ClockIcon className="size-3" aria-hidden />
      ) : (
        <span
          className={cn(
            "rounded-full size-1.5",
            isPublished ? "bg-success" : "bg-muted-foreground",
          )}
        />
      )}
      {state === "scheduled"
        ? "Scheduled"
        : isPublished
          ? "Published"
          : "Draft"}
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
    formState: { errors, isDirty, dirtyFields },
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

  useUnsavedChangesGuard(isDirty, "this post");
  const [savedSlug, setSavedSlug] = useState(post?.slug ?? "");
  const [savedPublication, setSavedPublication] = useState<string | null>(
    post?.publishedAt ?? null,
  );
  const schedule = watch("scheduledPublishDate");
  const publicationIntent = watch("publicationIntent") ?? "keep";
  const tagsValue = watch("tags") ?? "";
  const now = usePublicationClock([savedPublication, schedule]);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const note = getTagArray(tagsValue).includes("notes");
  const title = watch("title");
  const slug = watch("slug");
  const coverImage = watch("coverImage");
  const status = watch("status");
  const slugRegistration = register("slug");
  const isPending = pendingAction !== null;
  const primaryStatus = status === "published" ? "published" : "draft";
  const primaryLabel =
    status === "published"
      ? publicationIntent === "now"
        ? "Publish now"
        : publicationIntent === "schedule"
          ? "Save schedule"
          : "Save changes"
      : "Save draft";
  const futureSchedule = Boolean(
    schedule && new Date(schedule).getTime() > now,
  );
  const persistedState = getPostPublicationState(status, savedPublication, now);
  useEffect(() => {
    if (!post?.id || post.status !== "draft") return;
    try {
      const raw = sessionStorage.getItem(`storylio:post-schedule:${post.id}`);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (
        typeof draft.date === "string" &&
        !Number.isNaN(Date.parse(draft.date))
      ) {
        setValue("scheduledPublishDate", draft.date, { shouldDirty: true });
        setValue("publicationIntent", "schedule", { shouldDirty: true });
      }
    } catch {}
  }, [post?.id, post?.status, setValue]);

  useEffect(() => {
    if (!slugEdited) {
      setValue("slug", createSlug(title), {
        shouldDirty: title.trim().length > 0,
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

  const applyFieldErrors = useCallback(
    (fieldErrors?: Record<string, string[]>) => {
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
    },
    [setError],
  );

  // Advance the saved baseline without replacing edits made during the request.
  const acceptSaved = useCallback(
    (
      snapshot: PostFormInput,
      savedStatus: "draft" | "published",
      publishedAt: string | null,
      automatic = false,
    ) => {
      const reconciled = reconcilePostSave(
        snapshot,
        getValues(),
        savedStatus,
        publishedAt,
        automatic,
      );
      reset(reconciled.baseline);
      reset(reconciled.values, { keepDefaultValues: true });
      setSavedPublication(publishedAt);
    },
    [getValues, reset],
  );

  const contentDirty = Object.keys(dirtyFields).some(
    (field) =>
      field !== "scheduledPublishDate" &&
      field !== "publicationIntent" &&
      field !== "status",
  );
  const autosave = useCallback(() => {
    if (
      mode !== "edit" ||
      !post?.id ||
      !isDirty ||
      !contentDirty ||
      manualSavePending.current ||
      autosaveInFlight.current
    )
      return;
    const snapshot = structuredClone(getValues());
    const parsed = postFormSchema.safeParse(snapshot);
    if (!parsed.success) {
      setAutosaveStatus("failed");
      for (const issue of parsed.error.issues)
        setError(issue.path[0] as keyof PostFormValues, {
          type: "validation",
          message: issue.message,
        });
      return;
    }

    setAutosaveStatus("saving");
    const request = (async () => {
      try {
        const result = await actionAutosavePost(parsed.data, post.id);
        if (result.success && result.data) {
          acceptSaved(
            snapshot,
            result.data.status,
            result.data.publishedAt,
            true,
          );
          setSavedSlug(result.data.slug);
          setAutosaveStatus("saved");
        } else {
          if (!result.success) applyFieldErrors(result.fieldErrors);
          setAutosaveStatus("failed");
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
    contentDirty,
    getValues,
    isDirty,
    mode,
    post?.id,
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
            ? await actionPublishPost(payload, post?.id)
            : await actionSavePostDraft(payload, post?.id);
        if (result.success && result.data) {
          acceptSaved(snapshot, result.data.status, result.data.publishedAt);
          setSavedSlug(result.data.slug);
          try {
            const key = `storylio:post-schedule:${result.data.id}`;
            if (
              result.data.status === "draft" &&
              snapshot.status === "draft" &&
              snapshot.publicationIntent === "schedule" &&
              snapshot.scheduledPublishDate
            )
              sessionStorage.setItem(
                key,
                JSON.stringify({ date: snapshot.scheduledPublishDate }),
              );
            else sessionStorage.removeItem(key);
          } catch {}
          setAutosaveStatus("saved");
          toast.add({
            title: result.message ?? "Saved.",
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

  const moveToDraft = async () => {
    if (
      await confirmAction(
        "Move this post to draft? It will no longer be public. Your current edits will be saved.",
        {
          title: "Move post to draft?",
          confirmLabel: "Move to draft",
          cancelLabel: "Cancel",
        },
      )
    ) {
      void submitWithStatus("draft")();
    }
  };

  const handlePreview = () => {
    if (!savedSlug) {
      toast.add({ title: "Save the draft before previewing.", type: "error" });
      return;
    }

    window.open(`/preview/posts/${savedSlug}`, "_blank", "noopener,noreferrer");
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
      </div>
      <fieldset
        className="top-14 z-20 sticky flex flex-wrap items-center gap-2 bg-background py-3 border-border border-y min-w-0"
        aria-label="Post save actions"
      >
        <div className="flex flex-wrap items-center gap-3 sm:mr-2 w-full sm:w-auto">
          <PostStatusBadge
            status={status}
            publishedAt={savedPublication}
            now={now}
          />
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
            {futureSchedule ? "Schedule" : "Publish"}
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
      </fieldset>
      <p className="text-muted-foreground text-xs" role="note">
        {mode === "create"
          ? "Save your first draft to enable preview."
          : "Content changes autosave every 30 seconds."}{" "}
        {persistedState === "published"
          ? "Content edits update the live post."
          : persistedState === "scheduled"
            ? "This post is scheduled and stays private until its publication time."
            : "Drafts stay private."}{" "}
        Preview shows the saved version. Schedule changes require an explicit
        Schedule or Save schedule action.
      </p>
      {publicationIntent !== "keep" && (
        <p className="text-brand-soft text-sm" role="status">
          {publicationIntent === "now"
            ? "Pending: publish immediately. Save to confirm."
            : schedule
              ? `Pending schedule: ${new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "long", timeZone: zone }).format(new Date(schedule))}. This is not saved by autosave or Save draft.`
              : "Choose a publication date."}
        </p>
      )}

      <div className="items-start gap-6 grid xl:grid-cols-[minmax(0,1fr)_320px] min-w-0">
        <section className="min-w-0" aria-label="Post identity">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Public metadata for the blog listing and article header.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-5 grid sm:grid-cols-2 min-w-0">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  aria-describedby={errors.title ? "title-help" : undefined}
                  placeholder="Designing durable interfaces"
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
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  aria-describedby="excerpt-help"
                  placeholder="A short summary for cards and metadata."
                  aria-invalid={!!errors.excerpt}
                  disabled={isPending}
                  className="min-h-24"
                  {...register("excerpt")}
                />
                <p
                  id="excerpt-help"
                  className={cn(
                    "text-muted-foreground text-sm",
                    errors.excerpt && "text-destructive",
                  )}
                >
                  {errors.excerpt?.message ?? "Maximum 280 characters."}
                </p>
              </div>
              <div className="sm:col-span-2">
                <DashboardSelect
                  label="Content type"
                  value={note ? "note" : "article"}
                  options={[
                    { value: "article", label: "Article" },
                    { value: "note", label: "Note" },
                  ]}
                  disabled={isPending}
                  onValueChange={(kind) => {
                    const tags = getTagArray(tagsValue).filter(
                      (tag) => tag !== "notes",
                    );
                    if (kind === "note") tags.push("notes");
                    setValue("tags", tags.join(", "), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <p className="mt-2 text-muted-foreground text-xs">
                  {note
                    ? "Notes use the notes tag and open in a reading dialog on Home and Notes. A cover is optional."
                    : "Articles open on their own reading page."}
                </p>
              </div>
              <div className="sm:col-span-2">
                {" "}
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
              </div>{" "}
            </CardContent>
          </Card>
        </section>
        <aside className="min-w-0" aria-label="Publication">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
              <CardAction>
                <PostStatusBadge
                  status={status}
                  publishedAt={savedPublication}
                  now={now}
                  compact
                />
              </CardAction>
              <CardDescription>
                {status === "published"
                  ? persistedState === "scheduled"
                    ? "Scheduled posts remain private until their publication time."
                    : "Saved edits update the live post directly."
                  : "Drafts stay private until you publish."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 min-w-0">
              <div className="flex flex-col gap-2">
                <Label htmlFor="scheduledPublishDate">
                  Publication date and time
                </Label>
                <Controller
                  control={control}
                  name="scheduledPublishDate"
                  render={({ field }) => (
                    <DateTimePicker
                      id="scheduledPublishDate"
                      aria-describedby={
                        errors.scheduledPublishDate
                          ? "scheduledPublishDate-help"
                          : undefined
                      }
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue(
                          "publicationIntent",
                          value ? "schedule" : "now",
                          { shouldDirty: true },
                        );
                      }}
                      disabled={isPending}
                    />
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  Saving a draft does not activate a schedule. Publish/Schedule
                  commits it.
                </p>
                {errors.scheduledPublishDate?.message && (
                  <p
                    id="scheduledPublishDate-help"
                    role="alert"
                    className="text-destructive text-sm"
                  >
                    {errors.scheduledPublishDate.message}
                  </p>
                )}
              </div>
              {persistedState === "scheduled" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setValue("scheduledPublishDate", undefined, {
                      shouldDirty: true,
                    });
                    setValue("publicationIntent", "now", { shouldDirty: true });
                  }}
                >
                  Use current time (publish now)
                </Button>
              )}{" "}
            </CardContent>
          </Card>
        </aside>
        <section className="xl:col-span-2 min-w-0" aria-label="Writing">
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
                    ariaLabel="Post content"
                    placeholder={
                      note ? "Write this note..." : "Write the article..."
                    }
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
        <section className="xl:col-span-2 min-w-0" aria-label="Post cover">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Cover image</CardTitle>
              <CardDescription>
                Optional cover for the article. Notes are read in a text-focused
                dialog.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 min-w-0">
              <div className="flex flex-col gap-2">
                <h3 className="font-medium text-sm">Cover image (optional)</h3>
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
            </CardContent>
          </Card>
        </section>
      </div>
    </form>
  );
}
