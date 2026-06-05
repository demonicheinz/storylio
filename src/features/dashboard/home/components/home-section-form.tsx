"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  actionCreateHomeSection,
  actionDeleteHomeSection,
  actionReorderHomeSections,
  actionUpdateHomeSection,
} from "@/features/dashboard/home/actions";
import {
  type HomeSectionActionInput,
  type HomeSectionActionValues,
  type HomeSectionTypeValue,
  homeSectionActionSchema,
} from "@/features/dashboard/home/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import {
  DashboardSortableList,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@/features/dashboard/shared/components/sortable-list";

export type DashboardHomeSection = {
  id: string;
  type: HomeSectionTypeValue;
  label: string;
  content: string | null;
  imageUrl: string | null;
  order: number;
  createdAt: string;
};

type HomeContentManagerProps = {
  phases: DashboardHomeSection[];
  logos: DashboardHomeSection[];
};

type HomeSectionDialogProps = {
  section?: DashboardHomeSection;
  type: HomeSectionTypeValue;
  trigger: ReactNode;
};

const emptyDefaults: HomeSectionActionValues = {
  type: "PHASE",
  label: "",
  content: "",
  imageUrl: undefined,
  order: 0,
};

function getDefaults(
  type: HomeSectionTypeValue,
  section?: DashboardHomeSection,
): HomeSectionActionValues {
  if (!section) {
    return {
      ...emptyDefaults,
      type,
    };
  }

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

function HomeSectionDialog({ section, type, trigger }: HomeSectionDialogProps) {
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
    defaultValues: getDefaults(type, section),
  });

  const imageUrl = watch("imageUrl");
  const isEdit = Boolean(section);
  const typeLabel = getTypeLabel(type);

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages[0]) {
        setError(field as keyof HomeSectionActionValues, {
          message: messages[0],
          type: "server",
        });
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      reset(getDefaults(type, section));
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const payload = {
        ...values,
        type,
      };
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
        applyFieldErrors(result.fieldErrors);
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
}: {
  section: DashboardHomeSection;
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
        <Button type="button" size="sm" variant="destructive">
          <TrashIcon data-icon="inline-start" />
          Delete
        </Button>
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
        nextItems.map((item, index) => ({
          id: item.id,
          order: index,
        })),
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
      <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center">
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
      className={
        type === "LOGO" ? "grid gap-4 md:grid-cols-2" : "flex flex-col gap-3"
      }
      strategy={
        type === "LOGO" ? rectSortingStrategy : verticalListSortingStrategy
      }
      onReorder={handleReorder}
      renderItem={({ item, handle, isDragging }) => (
        <div
          className={[
            "grid overflow-hidden rounded-2xl border bg-background/40 transition-[border-color,box-shadow,opacity] md:grid-cols-[44px_minmax(0,1fr)_auto]",
            isDragging
              ? "border-brand-soft/60 shadow-[0_0_52px_rgba(139,92,246,0.18)]"
              : "hover:border-brand-soft/35",
          ].join(" ")}
        >
          {handle}
          <div className="min-w-0 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-lg font-semibold">
                {item.label}
              </h2>
              <Badge variant="outline">order {item.order}</Badge>
            </div>
            {type === "LOGO" ? (
              <div className="mt-4 flex h-20 w-40 items-center justify-center rounded-2xl border bg-muted/30 p-4">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.label}
                    width={140}
                    height={48}
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
            ) : (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {item.content || "No description yet."}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4 md:justify-end">
            <HomeSectionDialog
              section={item}
              type={type}
              trigger={
                <Button type="button" size="sm" variant="secondary">
                  <PencilSimpleIcon data-icon="inline-start" />
                  Edit
                </Button>
              }
            />
            <HomeSectionDeleteButton section={item} />
          </div>
        </div>
      )}
    />
  );
}

export function HomeContentManager({ logos, phases }: HomeContentManagerProps) {
  return (
    <Tabs defaultValue="phases">
      <TabsList>
        <TabsTrigger value="phases">My Approach / Phases</TabsTrigger>
        <TabsTrigger value="logos">Client or Tech Logos</TabsTrigger>
      </TabsList>

      <TabsContent value="phases" className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>My Approach</CardTitle>
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

      <TabsContent value="logos" className="mt-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle>Client or Tech Logos</CardTitle>
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
