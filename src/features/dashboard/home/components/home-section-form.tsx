"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChatCircleTextIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  ImageIcon,
  PencilSimpleIcon,
  PlusIcon,
  SpinnerIcon,
  StackIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  actionCreateHomeSection,
  actionCreateTestimonial,
  actionDeleteHomeSection,
  actionDeleteTestimonial,
  actionReorderHomeSections,
  actionReorderTestimonials,
  actionUpdateHomeSection,
  actionUpdateTestimonial,
} from "@/features/dashboard/home/actions";
import {
  type HomeSectionActionInput,
  type HomeSectionActionValues,
  type HomeSectionTypeValue,
  homeSectionActionSchema,
  type TestimonialActionInput,
  type TestimonialActionValues,
  testimonialActionSchema,
} from "@/features/dashboard/home/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import {
  DashboardSortableList,
  verticalListSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { cn, formatDate } from "@/lib/utils";

export type DashboardHomeSection = {
  id: string;
  type: HomeSectionTypeValue;
  label: string;
  content: string | null;
  imageUrl: string | null;
  order: number;
  createdAt: string;
};

export type DashboardTestimonial = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  content: string;
  isVisible: boolean;
  order: number;
  createdAt: string;
};

type HomeContentManagerProps = {
  phases: DashboardHomeSection[];
  testimonials: DashboardTestimonial[];
  logos: DashboardHomeSection[];
};

function HomeStatCard({
  icon: Icon,
  iconClassName,
  label,
  value,
  description,
  className,
}: {
  icon: typeof StackIcon;
  iconClassName: string;
  label: string;
  value: number;
  description: string;
  className?: string;
}) {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          <Icon className="size-5" />
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

function applyFieldErrors<T extends Record<string, unknown>>(
  fieldErrors: Record<string, string[]> | undefined,
  setError: (field: keyof T, error: { message: string; type: string }) => void,
) {
  if (!fieldErrors) return;
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages[0]) {
      setError(field as keyof T, { message: messages[0], type: "server" });
    }
  }
}

const homeSectionEmptyDefaults: HomeSectionActionValues = {
  type: "PHASE",
  label: "",
  content: "",
  imageUrl: undefined,
  order: 0,
};

function getHomeSectionDefaults(
  type: HomeSectionTypeValue,
  section?: DashboardHomeSection,
): HomeSectionActionValues {
  if (!section) return { ...homeSectionEmptyDefaults, type };
  return {
    type: section.type,
    label: section.label,
    content: section.content ?? "",
    imageUrl: section.imageUrl ?? undefined,
    order: section.order,
  };
}

function getTypeLabel(type: HomeSectionTypeValue) {
  return type === "LOGO" ? "Logo" : "Phase";
}

function HomeSectionDialog({
  section,
  type,
  trigger,
}: {
  section?: DashboardHomeSection;
  type: HomeSectionTypeValue;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<HomeSectionActionInput, unknown, HomeSectionActionValues>({
    resolver: zodResolver(homeSectionActionSchema),
    defaultValues: getHomeSectionDefaults(type, section),
  });

  const imageUrl = watch("imageUrl");
  const isEdit = Boolean(section);
  const typeLabel = getTypeLabel(type);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) reset(getHomeSectionDefaults(type, section));
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const payload = { ...values, type };
      const result =
        isEdit && section
          ? await actionUpdateHomeSection(section.id, payload)
          : await actionCreateHomeSection(payload);

      if (result.success) {
        toast.success(
          result.message ??
            (isEdit ? "Home section updated." : "Home section created."),
        );
        setOpen(false);
        router.refresh();
      } else {
        applyFieldErrors<HomeSectionActionValues>(result.fieldErrors, setError);
        toast.error(result.error);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? `Edit ${typeLabel}` : `Add ${typeLabel}`}
            </DialogTitle>
            <DialogDescription>
              {type === "LOGO"
                ? "Manage logo name, image, and display order."
                : "Manage phase title, description, and display order."}
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" value={type} {...register("type")} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${type}-label`}>
                {type === "LOGO" ? "Logo name" : "Phase title"}
              </Label>
              <Input
                id={`${type}-label`}
                placeholder={type === "LOGO" ? "Vercel" : "Phase 1"}
                aria-invalid={!!errors.label}
                disabled={isPending}
                {...register("label")}
              />
              {errors.label?.message && (
                <p className="text-sm text-destructive">
                  {errors.label.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`${type}-order`}>Display order</Label>
              <Input
                id={`${type}-order`}
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
          </div>

          {type === "PHASE" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                placeholder="Describe this phase."
                aria-invalid={!!errors.content}
                disabled={isPending}
                className="min-h-28"
                {...register("content")}
              />
              {errors.content?.message && (
                <p className="text-sm text-destructive">
                  {errors.content.message}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Logo image</Label>
                <ImageUpload
                  value={imageUrl}
                  disabled={isPending}
                  onChange={(url) =>
                    setValue("imageUrl", url, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  onRemove={() =>
                    setValue("imageUrl", undefined, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {errors.imageUrl?.message && (
                  <p className="text-sm text-destructive">
                    {errors.imageUrl.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor={`${type}-image-url`}>Logo image URL</Label>
                <Input
                  id={`${type}-image-url`}
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  aria-invalid={!!errors.imageUrl}
                  disabled={isPending}
                  {...register("imageUrl")}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a logo or paste an existing image URL.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <SpinnerIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : isEdit ? (
                <PencilSimpleIcon data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : `Add ${typeLabel}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HomeSectionDeleteButton({
  section,
  trigger,
}: {
  section: DashboardHomeSection;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actionDeleteHomeSection(section.id);
      if (result.success) {
        toast.success(result.message ?? "Home section deleted.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm" variant="destructive">
            <TrashIcon data-icon="inline-start" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete home content?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">{section.label}</span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function HomeSectionActions({
  section,
  type,
}: {
  section: DashboardHomeSection;
  type: HomeSectionTypeValue;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-xl bg-background/70 text-foreground backdrop-blur hover:bg-background"
          aria-label={`Open actions for ${section.label}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{getTypeLabel(type)}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <HomeSectionDialog
          section={section}
          type={type}
          trigger={
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => event.preventDefault()}
            >
              <PencilSimpleIcon data-icon="inline-start" />
              Edit
            </DropdownMenuItem>
          }
        />
        <HomeSectionDeleteButton
          section={section}
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

function HomeContentList({
  emptyLabel,
  emptyDescription,
  items,
  type,
}: {
  emptyLabel: string;
  emptyDescription: string;
  items: DashboardHomeSection[];
  type: HomeSectionTypeValue;
}) {
  const router = useRouter();
  const [isReordering, startReorderTransition] = useTransition();

  const handleReorder = (nextItems: DashboardHomeSection[]) => {
    startReorderTransition(async () => {
      const result = await actionReorderHomeSections(
        nextItems.map((item, index) => ({ id: item.id, order: index })),
      );
      if (result.success) {
        toast.success(result.message ?? "Home content order updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-background/30 p-6 text-center">
        {type === "LOGO" ? (
          <ImageIcon className="size-12 text-muted-foreground/50" />
        ) : (
          <StackIcon className="size-12 text-muted-foreground/50" />
        )}
        <div>
          <p className="font-medium">{emptyLabel}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
        <HomeSectionDialog
          type={type}
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              Add {getTypeLabel(type)}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DashboardSortableList
      items={items}
      disabled={isReordering}
      className={dashboardStyles.sortableRows}
      strategy={verticalListSortingStrategy}
      onReorder={handleReorder}
      renderItem={({ item, handle, isDragging }) => (
        <div
          className={cn(
            "grid min-w-0 grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_minmax(320px,1fr)_180px_56px] xl:items-center",
            dashboardStyles.listRow,
            isDragging
              ? "relative z-10 border-brand-soft/60 bg-background/70 opacity-80 shadow-[0_0_52px_rgba(139,92,246,0.18)]"
              : "hover:border-brand-soft/35",
          )}
        >
          <div className="row-span-2 flex self-stretch xl:row-span-1">
            {handle}
          </div>
          <div
            className={cn(
              "flex min-w-0 gap-3 p-4 xl:p-3 xl:pr-4",
              type === "LOGO" ? "items-center" : "items-start",
            )}
          >
            {type === "LOGO" && (
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.label}
                    width={96}
                    height={40}
                    className="max-h-10 w-auto object-contain"
                  />
                ) : (
                  <ImageIcon className="size-7 text-muted-foreground" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate font-heading text-lg font-semibold">
                  {item.label}
                </h2>
              </div>
              {type !== "LOGO" && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.content || "No description yet."}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 xl:hidden">
                <span className="text-xs text-muted-foreground">
                  Created {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
            <div className="shrink-0 xl:hidden">
              <HomeSectionActions section={item} type={type} />
            </div>
          </div>
          <div className="hidden items-center p-3 text-sm whitespace-nowrap text-muted-foreground xl:flex">
            Created {formatDate(item.createdAt)}
          </div>
          <div className="hidden justify-end p-3 xl:flex">
            <HomeSectionActions section={item} type={type} />
          </div>
        </div>
      )}
    />
  );
}

const testimonialEmptyDefaults: TestimonialActionValues = {
  name: "",
  role: "",
  company: "",
  avatar: undefined,
  content: "",
  isVisible: true,
  order: 0,
};

function getTestimonialDefaults(
  testimonial?: DashboardTestimonial,
): TestimonialActionValues {
  if (!testimonial) return testimonialEmptyDefaults;
  return {
    name: testimonial.name,
    role: testimonial.role ?? "",
    company: testimonial.company ?? "",
    avatar: testimonial.avatar ?? undefined,
    content: testimonial.content,
    isVisible: testimonial.isVisible,
    order: testimonial.order,
  };
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getTestimonialTitle(testimonial: DashboardTestimonial) {
  return [testimonial.role, testimonial.company].filter(Boolean).join(" at ");
}

function TestimonialDialog({
  testimonial,
  trigger,
}: {
  testimonial?: DashboardTestimonial;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<TestimonialActionInput, unknown, TestimonialActionValues>({
    resolver: zodResolver(testimonialActionSchema),
    defaultValues: getTestimonialDefaults(testimonial),
  });

  const avatar = watch("avatar");
  const isEdit = Boolean(testimonial);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) reset(getTestimonialDefaults(testimonial));
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result =
        isEdit && testimonial
          ? await actionUpdateTestimonial(testimonial.id, values)
          : await actionCreateTestimonial(values);

      if (result.success) {
        toast.success(
          result.message ??
            (isEdit ? "Testimonial updated." : "Testimonial created."),
        );
        setOpen(false);
        router.refresh();
      } else {
        applyFieldErrors<TestimonialActionValues>(result.fieldErrors, setError);
        toast.error(result.error);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
            <DialogDescription>
              Manage the quote, author details, public visibility, avatar, and
              display order.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Jane Cooper"
                aria-invalid={!!errors.name}
                disabled={isPending}
                {...register("name")}
              />
              {errors.name?.message && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="Founder"
                aria-invalid={!!errors.role}
                disabled={isPending}
                {...register("role")}
              />
              {errors.role?.message && (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Studio"
                aria-invalid={!!errors.company}
                disabled={isPending}
                {...register("company")}
              />
              {errors.company?.message && (
                <p className="text-sm text-destructive">
                  {errors.company.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">Quote</Label>
            <Textarea
              id="content"
              placeholder="Share the testimonial quote."
              aria-invalid={!!errors.content}
              disabled={isPending}
              className="min-h-32"
              {...register("content")}
            />
            {errors.content?.message && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/35 p-4">
            <div>
              <Label htmlFor="isVisible">Visible publicly</Label>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Hidden testimonials stay editable here but are not shown on the
                Home page.
              </p>
            </div>
            <Switch
              id="isVisible"
              checked={watch("isVisible")}
              disabled={isPending}
              onCheckedChange={(checked) =>
                setValue("isVisible", checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Avatar upload</Label>
            <ImageUpload
              value={avatar}
              disabled={isPending}
              cropAspect={1}
              cropShape="round"
              cropLabel="Crop testimonial avatar"
              previewClassName="mx-auto max-w-44 rounded-full"
              onChange={(url) =>
                setValue("avatar", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onRemove={() =>
                setValue("avatar", undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            {errors.avatar?.message && (
              <p className="text-sm text-destructive">
                {errors.avatar.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              placeholder="https://res.cloudinary.com/..."
              aria-invalid={!!errors.avatar}
              disabled={isPending}
              {...register("avatar")}
            />
            <p className="text-xs text-muted-foreground">
              You can upload an avatar or paste an existing image URL.
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <SpinnerIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : isEdit ? (
                <PencilSimpleIcon data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Add Testimonial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TestimonialDeleteButton({
  testimonial,
  trigger,
}: {
  testimonial: DashboardTestimonial;
  trigger?: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actionDeleteTestimonial(testimonial.id);
      if (result.success) {
        toast.success(result.message ?? "Testimonial deleted.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm" variant="destructive">
            <TrashIcon data-icon="inline-start" />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the quote from{" "}
            <span className="font-medium text-foreground">
              {testimonial.name}
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TestimonialActions({
  testimonial,
  align = "end",
}: {
  testimonial: DashboardTestimonial;
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
          aria-label={`Open actions for ${testimonial.name}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Testimonial</DropdownMenuLabel>
        <TestimonialDialog
          testimonial={testimonial}
          trigger={
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={(event) => event.preventDefault()}
            >
              <PencilSimpleIcon data-icon="inline-start" />
              Edit
            </DropdownMenuItem>
          }
        />
        <DropdownMenuSeparator />
        <TestimonialDeleteButton
          testimonial={testimonial}
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

function TestimonialList({
  testimonials,
}: {
  testimonials: DashboardTestimonial[];
}) {
  const router = useRouter();
  const [isReordering, startReorderTransition] = useTransition();

  const handleReorder = (nextTestimonials: DashboardTestimonial[]) => {
    startReorderTransition(async () => {
      const result = await actionReorderTestimonials(
        nextTestimonials.map((t, index) => ({ id: t.id, order: index })),
      );
      if (result.success) {
        toast.success(result.message ?? "Testimonial order updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (testimonials.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-background/25 text-center">
        <ChatCircleTextIcon className="size-12 text-muted-foreground/50" />
        <div>
          <p className="font-medium">No testimonials yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add client quotes to power the Home page social proof.
          </p>
        </div>
        <TestimonialDialog
          trigger={
            <Button>
              <PlusIcon data-icon="inline-start" />
              Add Testimonial
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <DashboardSortableList
      items={testimonials}
      disabled={isReordering}
      className={dashboardStyles.sortableRows}
      onReorder={handleReorder}
      renderItem={({ item: testimonial, handle, isDragging }) => {
        const title = getTestimonialTitle(testimonial);
        return (
          <div
            className={[
              [
                "grid min-w-0 grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_minmax(320px,1fr)_120px_180px_56px] xl:items-center",
                dashboardStyles.listRow,
              ].join(" "),
              isDragging
                ? "relative z-10 border-brand-soft/60 bg-background/70 opacity-80"
                : testimonial.isVisible
                  ? "hover:border-brand-soft/35"
                  : "border-dashed opacity-65 hover:border-brand-soft/35 hover:opacity-100",
            ].join(" ")}
          >
            <div className="row-span-2 flex self-stretch xl:row-span-1">
              {handle}
            </div>
            <div className="flex min-w-0 items-start gap-3 p-4 xl:p-3 xl:pr-4">
              <Avatar className="size-12 shrink-0">
                {testimonial.avatar && (
                  <AvatarImage
                    src={testimonial.avatar}
                    alt={testimonial.name}
                  />
                )}
                <AvatarFallback>
                  {getInitials(testimonial.name) || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="wrap-break-words line-clamp-2 font-heading text-base leading-snug font-semibold xl:text-sm">
                    {testimonial.name}
                  </h2>
                </div>
                {title && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {title}
                  </p>
                )}
                <p className="mt-2 line-clamp-2 text-sm leading-6 wrap-break-word text-muted-foreground">
                  {testimonial.content}
                </p>
              </div>
              <div className="shrink-0 xl:hidden">
                <TestimonialActions testimonial={testimonial} />
              </div>
            </div>
            <div className="hidden items-center p-3 xl:flex">
              <Badge variant={testimonial.isVisible ? "default" : "outline"}>
                {testimonial.isVisible ? "Visible" : "Hidden"}
              </Badge>
            </div>
            <div className="hidden items-center p-3 text-sm whitespace-nowrap text-muted-foreground xl:flex">
              Created {formatDate(testimonial.createdAt)}
            </div>
            <div className="hidden justify-end p-3 xl:flex">
              <TestimonialActions testimonial={testimonial} />
            </div>
            <div className="col-start-2 flex flex-wrap items-center gap-2 px-4 pb-4 xl:hidden">
              <Badge variant={testimonial.isVisible ? "default" : "outline"}>
                {testimonial.isVisible ? "Visible" : "Hidden"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Created {formatDate(testimonial.createdAt)}
              </span>
            </div>
          </div>
        );
      }}
    />
  );
}

export function HomeContentManager({
  logos,
  phases,
  testimonials,
}: HomeContentManagerProps) {
  const visibleTestimonials = testimonials.filter(
    (testimonial) => testimonial.isVisible,
  ).length;

  return (
    <Tabs defaultValue="approach" className="flex min-w-0 flex-col gap-5">
      <div className={dashboardStyles.statGrid}>
        <HomeStatCard
          icon={StackIcon}
          label="Approach"
          value={phases.length}
          description="Process phases"
          iconClassName="bg-sky-500/12 text-sky-300"
        />
        <HomeStatCard
          icon={ChatCircleTextIcon}
          label="Testimonials"
          value={testimonials.length}
          description="Client quotes"
          iconClassName="bg-emerald-500/12 text-emerald-300"
        />
        <HomeStatCard
          icon={EyeIcon}
          label="Visible"
          value={visibleTestimonials}
          description="Shown publicly"
          iconClassName="bg-violet-500/12 text-violet-300"
        />
        <HomeStatCard
          icon={ImageIcon}
          label="Tech / Client"
          value={logos.length}
          description="Logo items"
          iconClassName="bg-amber-500/12 text-amber-300"
        />
      </div>

      <TabsList className="grid h-auto min-h-12 w-full min-w-0 grid-cols-3 content-center rounded-2xl border border-border/60 bg-card/55 p-1.5 md:w-fit md:min-w-96">
        <TabsTrigger
          value="approach"
          className="min-h-9 min-w-0 rounded-xl px-2 py-2.5 text-xs leading-none sm:px-3 sm:text-sm"
        >
          Approach
        </TabsTrigger>
        <TabsTrigger
          value="testimonials"
          className="min-h-9 min-w-0 rounded-xl px-2 py-2.5 text-xs leading-none sm:px-3 sm:text-sm"
        >
          Testimonials
        </TabsTrigger>
        <TabsTrigger
          value="logos"
          className="min-h-9 min-w-0 rounded-xl px-2 py-2.5 text-xs leading-none sm:px-3 sm:text-sm"
        >
          Tech / Client
        </TabsTrigger>
      </TabsList>

      <TabsContent value="approach">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="font-semibold">My Approach</CardTitle>
                <CardDescription>
                  Manage the phase cards shown on the Home page.
                </CardDescription>
              </div>
              <HomeSectionDialog
                type="PHASE"
                trigger={
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Add Phase
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent>
            <HomeContentList
              type="PHASE"
              items={phases}
              emptyLabel="No phases yet"
              emptyDescription="Add process phases to explain how the work flows."
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="testimonials">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="font-semibold">Testimonials</CardTitle>
                <CardDescription>
                  {testimonials.length}{" "}
                  {testimonials.length === 1 ? "testimonial" : "testimonials"}{" "}
                  in the CMS. Hidden testimonials are not shown on the Home
                  page.
                </CardDescription>
              </div>
              <TestimonialDialog
                trigger={
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Add Testimonial
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent>
            <TestimonialList testimonials={testimonials} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="logos">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="font-semibold">
                  Tech / Client Logos
                </CardTitle>
                <CardDescription>
                  Manage logos shown near testimonials on the Home page.
                </CardDescription>
              </div>
              <HomeSectionDialog
                type="LOGO"
                trigger={
                  <Button>
                    <PlusIcon data-icon="inline-start" />
                    Add Logo
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent>
            <HomeContentList
              type="LOGO"
              items={logos}
              emptyLabel="No logos yet"
              emptyDescription="Add client or technology logos for the Home page."
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
