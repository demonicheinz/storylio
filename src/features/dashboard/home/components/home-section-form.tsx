"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChatCircleTextIcon,
  DotsThreeVerticalIcon,
  ImageIcon,
  PencilSimpleIcon,
  PlusIcon,
  SpinnerIcon,
  StackIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { ProfileAvatar } from "@/components/common/profile-avatar";
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
  DropdownMenuGroup,
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
import { toast } from "@/components/ui/toast";
import {
  actionCreateHomeSection,
  actionCreateTestimonial,
  actionDeleteHomeSection,
  actionDeleteTestimonial,
  actionReorderHomeSections,
  actionReorderTestimonials,
  actionSetHeroHeadline,
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
import { DashboardSelect } from "@/features/dashboard/shared/components/filter-controls";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import {
  DashboardSortableList,
  verticalListSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { DEFAULT_HOME_HERO } from "@/lib/home-hero";
import { getHomeLogoSettings } from "@/lib/home-technologies";
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
  headline: string;
  phases: DashboardHomeSection[];
  testimonials: DashboardTestimonial[];
  logos: DashboardHomeSection[];
};

function HomeLogoStatus({ logo }: { logo: DashboardHomeSection }) {
  const { category, showOnHome } = getHomeLogoSettings(logo);
  return (
    <p className="mt-1 text-muted-foreground text-xs">
      {category === "TECHNOLOGY" ? "Technology" : "Client"}
      {category === "TECHNOLOGY"
        ? showOnHome
          ? " · Shown on Home"
          : " · Hidden from Home"
        : " · Saved in dashboard"}
    </p>
  );
}

function HeroHeadlineForm({ headline }: { headline: string }) {
  const router = useRouter();
  const [value, setValue] = useState(headline);
  const [savedValue, setSavedValue] = useState(headline);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const dirty = value !== savedValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Hero</h2>
        </CardTitle>
        <CardDescription>
          The headline opens the public Home page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(undefined);
            startTransition(async () => {
              try {
                const result = await actionSetHeroHeadline({ headline: value });
                if (!result.success) {
                  setError(result.fieldErrors?.headline?.[0] ?? result.error);
                  return;
                }
                setSavedValue(value.trim());
                setValue(value.trim());
                toast.add({
                  title: result.message ?? "Headline saved.",
                  type: "success",
                });
                router.refresh();
              } catch {
                setError("Could not save the headline. Try again.");
              }
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="hero-headline">Headline</Label>
            <Input
              id="hero-headline"
              value={value}
              maxLength={160}
              disabled={pending}
              aria-invalid={!!error}
              aria-describedby="hero-headline-help hero-headline-error"
              placeholder={DEFAULT_HOME_HERO.headline}
              onChange={(event) => {
                setValue(event.target.value);
                setError(undefined);
              }}
            />
            <p
              id="hero-headline-help"
              className="text-muted-foreground text-xs"
            >
              Up to 160 characters. Leave empty to use the existing default:{" "}
              {DEFAULT_HOME_HERO.headline}
            </p>
            <p
              id="hero-headline-error"
              role="alert"
              className="text-destructive text-sm"
            >
              {error}
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            The subheadline uses your profile bio.{" "}
            <Link
              href="/dashboard/settings"
              className="text-primary underline underline-offset-4"
            >
              Edit bio in Settings
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Saving..." : "Save headline"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending || !dirty}
              onClick={() => {
                setValue(savedValue);
                setError(undefined);
              }}
            >
              Discard changes
            </Button>
          </div>
        </form>
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
  category: "TECHNOLOGY",
  showOnHome: true,
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
  const settings = getHomeLogoSettings(section);
  return {
    type: section.type,
    label: section.label,
    content:
      section.type === "LOGO" ? settings.description : (section.content ?? ""),
    category: settings.category,
    showOnHome: settings.showOnHome,
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
  triggerNativeButton = true,
}: {
  section?: DashboardHomeSection;
  type: HomeSectionTypeValue;
  trigger: ReactElement;
  triggerNativeButton?: boolean;
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
  const category = watch("category");
  const showOnHome = watch("showOnHome");
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
        toast.add({
          title:
            result.message ??
            (isEdit ? "Home section updated." : "Home section created."),
          type: "success",
        });
        setOpen(false);
        router.refresh();
      } else {
        applyFieldErrors<HomeSectionActionValues>(result.fieldErrors, setError);
        toast.add({ title: result.error, type: "error" });
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger nativeButton={triggerNativeButton} render={trigger} />
      <DialogContent className="sm:max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
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

          <div className="gap-4 grid sm:grid-cols-2">
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
                <p className="text-destructive text-sm">
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
                <p className="text-destructive text-sm">
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
                <p className="text-destructive text-sm">
                  {errors.content.message}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <DashboardSelect<"TECHNOLOGY" | "CLIENT">
                label="Logo category"
                value={category ?? "TECHNOLOGY"}
                options={[
                  { value: "TECHNOLOGY", label: "Technology" },
                  { value: "CLIENT", label: "Client" },
                ]}
                disabled={isPending}
                onValueChange={(value) => {
                  setValue("category", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  if (value === "CLIENT")
                    setValue("showOnHome", false, { shouldDirty: true });
                }}
              />
              {errors.category?.message && (
                <p className="text-destructive text-sm">
                  {errors.category.message}
                </p>
              )}
              <div className="flex justify-between items-center gap-4 py-3">
                <Label htmlFor={`${type}-show-home`}>
                  Show in Home tech stack
                </Label>
                <Switch
                  id={`${type}-show-home`}
                  checked={Boolean(showOnHome)}
                  disabled={isPending || category === "CLIENT"}
                  onCheckedChange={(checked) =>
                    setValue("showOnHome", checked, { shouldDirty: true })
                  }
                />
              </div>
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
                  <p className="text-destructive text-sm">
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
                <p className="text-muted-foreground text-xs">
                  Upload a logo or paste an image URL. Next.js, React,
                  TypeScript, Node.js and PostgreSQL can use their built-in
                  logos.
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
  triggerNativeButton = true,
}: {
  section: DashboardHomeSection;
  trigger?: ReactElement;
  triggerNativeButton?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actionDeleteHomeSection(section.id);
      if (result.success) {
        toast.add({
          title: result.message ?? "Home section deleted.",
          type: "success",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        nativeButton={triggerNativeButton}
        render={
          trigger ?? (
            <Button type="button" size="sm" variant="destructive">
              <TrashIcon data-icon="inline-start" />
              Delete
            </Button>
          )
        }
      />
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
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-foreground"
            aria-label={`Open actions for ${section.label}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{getTypeLabel(type)}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <HomeSectionDialog
            triggerNativeButton={false}
            section={section}
            type={type}
            trigger={
              <DropdownMenuItem closeOnClick={false}>
                <PencilSimpleIcon data-icon="inline-start" />
                Edit
              </DropdownMenuItem>
            }
          />
          <HomeSectionDeleteButton
            triggerNativeButton={false}
            section={section}
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
        toast.add({
          title: result.message ?? "Home content order updated.",
          type: "success",
        });
        router.refresh();
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    });
  };

  if (items.length === 0) {
    return (
      <div className={dashboardStyles.emptyState}>
        {type === "LOGO" ? (
          <ImageIcon className="size-12 text-muted-foreground/50" />
        ) : (
          <StackIcon className="size-12 text-muted-foreground/50" />
        )}
        <div>
          <p className="font-medium">{emptyLabel}</p>
          <p className="mt-1 text-muted-foreground text-sm">
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
            "xl:items-center grid grid-cols-[44px_minmax(0,1fr)] xl:grid-cols-[44px_minmax(320px,1fr)_180px_56px] min-w-0",
            dashboardStyles.listRow,
            isDragging
              ? "relative z-10 bg-muted opacity-80"
              : "hover:border-brand-soft/35",
          )}
        >
          <div className="flex self-stretch row-span-2 xl:row-span-1">
            {handle}
          </div>
          <div
            className={cn(
              "flex gap-3 p-4 xl:p-3 xl:pr-4 min-w-0",
              type === "LOGO" ? "items-center" : "items-start",
            )}
          >
            {type === "LOGO" && (
              <div className="flex justify-center items-center bg-muted/30 p-2 border border-border/50 rounded-xl w-20 h-14 overflow-hidden shrink-0">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.label}
                    width={96}
                    height={40}
                    className="w-auto max-h-10 object-contain"
                  />
                ) : (
                  <ImageIcon className="size-7 text-muted-foreground" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-sm wrap-anywhere">
                  {item.label}
                </h3>
              </div>
              {type === "LOGO" && <HomeLogoStatus logo={item} />}
              {type !== "LOGO" && (
                <p className="mt-1 text-muted-foreground text-sm line-clamp-2">
                  {item.content || "No description yet."}
                </p>
              )}
              <div className="xl:hidden flex flex-wrap items-center gap-2 mt-3">
                <span className="text-muted-foreground text-xs">
                  Created {formatDate(item.createdAt)}
                </span>
              </div>
            </div>
            <div className="xl:hidden shrink-0">
              <HomeSectionActions section={item} type={type} />
            </div>
          </div>
          <div className="hidden xl:flex items-center p-3 text-muted-foreground text-sm whitespace-nowrap">
            Created {formatDate(item.createdAt)}
          </div>
          <div className="hidden xl:flex justify-end p-3">
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

function getTestimonialTitle(testimonial: DashboardTestimonial) {
  return [testimonial.role, testimonial.company].filter(Boolean).join(" at ");
}

function TestimonialDialog({
  testimonial,
  trigger,
  triggerNativeButton = true,
}: {
  testimonial?: DashboardTestimonial;
  trigger: ReactElement;
  triggerNativeButton?: boolean;
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
        toast.add({
          title:
            result.message ??
            (isEdit ? "Testimonial updated." : "Testimonial created."),
          type: "success",
        });
        setOpen(false);
        router.refresh();
      } else {
        applyFieldErrors<TestimonialActionValues>(result.fieldErrors, setError);
        toast.add({ title: result.error, type: "error" });
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger nativeButton={triggerNativeButton} render={trigger} />
      <DialogContent className="sm:max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
            <DialogDescription>
              Manage the legacy quote, author details, stored visibility flag,
              avatar, and display order.
            </DialogDescription>
          </DialogHeader>

          <div className="gap-4 grid sm:grid-cols-2">
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
                <p className="text-destructive text-sm">
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
                <p className="text-destructive text-sm">
                  {errors.order.message}
                </p>
              )}
            </div>
          </div>

          <div className="gap-4 grid sm:grid-cols-2">
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
                <p className="text-destructive text-sm">
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
                <p className="text-destructive text-sm">
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
              <p className="text-destructive text-sm">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center gap-4 py-4">
            <div>
              <Label htmlFor="isVisible">Legacy visibility flag</Label>
              <p className="mt-1 text-muted-foreground text-xs leading-5">
                Stored for compatibility. Testimonials are not used on the
                public Home page, regardless of this flag.
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
              <p className="text-destructive text-sm">
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
            <p className="text-muted-foreground text-xs">
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
  triggerNativeButton = true,
}: {
  testimonial: DashboardTestimonial;
  trigger?: ReactElement;
  triggerNativeButton?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await actionDeleteTestimonial(testimonial.id);
      if (result.success) {
        toast.add({
          title: result.message ?? "Testimonial deleted.",
          type: "success",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        nativeButton={triggerNativeButton}
        render={
          trigger ?? (
            <Button type="button" size="sm" variant="destructive">
              <TrashIcon data-icon="inline-start" />
              Delete
            </Button>
          )
        }
      />
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
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-foreground"
            aria-label={`Open actions for ${testimonial.name}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Testimonial</DropdownMenuLabel>
          <TestimonialDialog
            triggerNativeButton={false}
            testimonial={testimonial}
            trigger={
              <DropdownMenuItem closeOnClick={false}>
                <PencilSimpleIcon data-icon="inline-start" />
                Edit
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <TestimonialDeleteButton
            triggerNativeButton={false}
            testimonial={testimonial}
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
        toast.add({
          title: result.message ?? "Testimonial order updated.",
          type: "success",
        });
        router.refresh();
      } else {
        toast.add({ title: result.error, type: "error" });
      }
    });
  };

  if (testimonials.length === 0) {
    return (
      <div className={dashboardStyles.emptyState}>
        <ChatCircleTextIcon className="size-12 text-muted-foreground/50" />
        <div>
          <p className="font-medium">No testimonials yet</p>
          <p className="mt-1 text-muted-foreground text-sm">
            Store legacy quotes here. Testimonials are not used on public Home.
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
              isDragging ? "relative z-10 bg-muted opacity-80" : "",
            ].join(" ")}
          >
            <div className="flex self-stretch row-span-2 xl:row-span-1">
              {handle}
            </div>
            <div className="flex items-start gap-3 p-4 xl:p-3 xl:pr-4 min-w-0">
              <ProfileAvatar
                src={testimonial.avatar}
                name={testimonial.name}
                size={48}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-semibold text-sm wrap-break-words line-clamp-2 leading-snug">
                    {testimonial.name}
                  </h3>
                </div>
                {title && (
                  <p className="mt-1 text-muted-foreground text-sm truncate">
                    {title}
                  </p>
                )}
                <p className="mt-2 text-muted-foreground text-sm wrap-break-word line-clamp-2 leading-6">
                  {testimonial.content}
                </p>
              </div>
              <div className="xl:hidden shrink-0">
                <TestimonialActions testimonial={testimonial} />
              </div>
            </div>
            <div className="hidden xl:flex items-center p-3">
              <Badge variant="secondary">
                {testimonial.isVisible ? "Legacy flag: on" : "Legacy flag: off"}
              </Badge>
            </div>
            <div className="hidden xl:flex items-center p-3 text-muted-foreground text-sm whitespace-nowrap">
              Created {formatDate(testimonial.createdAt)}
            </div>
            <div className="hidden xl:flex justify-end p-3">
              <TestimonialActions testimonial={testimonial} />
            </div>
            <div className="xl:hidden flex flex-wrap items-center gap-2 col-start-2 px-4 pb-4">
              <Badge variant="secondary">
                {testimonial.isVisible ? "Legacy flag: on" : "Legacy flag: off"}
              </Badge>
              <span className="text-muted-foreground text-xs">
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
  headline,
  logos,
  phases,
  testimonials,
}: HomeContentManagerProps) {
  return (
    <Tabs defaultValue="hero" className="flex flex-col gap-5 min-w-0">
      <DashboardSummary
        items={[
          { label: "Approach phases", value: phases.length },
          { label: "Stored logos", value: logos.length },
          {
            label: "Legacy testimonials",
            value: testimonials.length,
            description: "Not used on public Home",
          },
        ]}
      />
      <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-fit h-auto">
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="approach" className="text-xs sm:text-sm">
          Approach
        </TabsTrigger>
        <TabsTrigger value="logos" className="text-xs sm:text-sm">
          Tech stack
        </TabsTrigger>
        <TabsTrigger value="testimonials" className="text-xs sm:text-sm">
          Legacy quotes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="hero">
        <HeroHeadlineForm headline={headline} />
      </TabsContent>

      <TabsContent value="approach">
        <Card>
          <CardHeader>
            <div className="flex md:flex-row flex-col md:justify-between md:items-start gap-4">
              <div>
                <CardTitle>
                  <h2>Approach</h2>
                </CardTitle>
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
            <div className="flex md:flex-row flex-col md:justify-between md:items-start gap-4">
              <div>
                <CardTitle>
                  <h2>Testimonials (legacy)</h2>
                </CardTitle>
                <CardDescription>
                  {testimonials.length}{" "}
                  {testimonials.length === 1 ? "testimonial" : "testimonials"}{" "}
                  stored in the CMS. These records are not used on the public
                  Home page.
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
            <div className="flex md:flex-row flex-col md:justify-between md:items-start gap-4">
              <div>
                <CardTitle>
                  <h2>Tech stack</h2>
                </CardTitle>
                <CardDescription>
                  Choose technologies for the Home stack and keep client logos
                  separate.
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
              emptyDescription="Add technologies for the public stack. Client logos remain stored separately."
            />
          </CardContent>
        </Card>
      </TabsContent>
      <nav
        aria-label="Other Home content"
        className="pt-4 border-t text-muted-foreground text-sm"
      >
        <p>Other Home sections use published content from these editors:</p>
        <div className="flex flex-wrap gap-4 mt-2">
          <Link
            className="text-primary underline underline-offset-4"
            href="/dashboard/projects"
          >
            Projects
          </Link>
          <Link
            className="text-primary underline underline-offset-4"
            href="/dashboard/posts"
          >
            Writing and Notes
          </Link>
        </div>
        <p className="mt-2 text-xs">Notes are posts with the notes tag.</p>
      </nav>
    </Tabs>
  );
}
