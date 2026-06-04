"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatCircleTextIcon,
  PencilSimpleIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from "@phosphor-icons/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import {
  actionCreateTestimonial,
  actionDeleteTestimonial,
  actionReorderTestimonials,
  actionUpdateTestimonial,
} from "@/features/dashboard/testimonials/actions";
import {
  type TestimonialActionInput,
  type TestimonialActionValues,
  testimonialActionSchema,
} from "@/features/dashboard/testimonials/validations";

export type DashboardTestimonial = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  avatar: string | null;
  content: string;
  order: number;
  createdAt: string;
};

type TestimonialsManagerProps = {
  testimonials: DashboardTestimonial[];
};

type TestimonialDialogProps = {
  testimonial?: DashboardTestimonial;
  trigger: ReactNode;
};

const emptyDefaults: TestimonialActionValues = {
  name: "",
  role: "",
  company: "",
  avatar: undefined,
  content: "",
  order: 0,
};

function getDefaults(
  testimonial?: DashboardTestimonial,
): TestimonialActionValues {
  if (!testimonial) {
    return emptyDefaults;
  }

  return {
    name: testimonial.name,
    role: testimonial.role ?? "",
    company: testimonial.company ?? "",
    avatar: testimonial.avatar ?? undefined,
    content: testimonial.content,
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

function getTitle(testimonial: DashboardTestimonial) {
  return [testimonial.role, testimonial.company].filter(Boolean).join(" at ");
}

function TestimonialDialog({ testimonial, trigger }: TestimonialDialogProps) {
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
    defaultValues: getDefaults(testimonial),
  });

  const avatar = watch("avatar");
  const isEdit = Boolean(testimonial);

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages[0]) {
        setError(field as keyof TestimonialActionValues, {
          message: messages[0],
          type: "server",
        });
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      reset(getDefaults(testimonial));
    }
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
              {isEdit ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
            <DialogDescription>
              Manage the quote, author details, avatar, and display order.
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

          <div className="flex flex-col gap-2">
            <Label>Avatar upload</Label>
            <ImageUpload
              value={avatar}
              disabled={isPending}
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
}: {
  testimonial: DashboardTestimonial;
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
        <Button type="button" size="sm" variant="destructive">
          <TrashIcon data-icon="inline-start" />
          Delete
        </Button>
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

function TestimonialReorderButton({
  direction,
  disabled,
  updates,
}: {
  direction: "up" | "down";
  disabled?: boolean;
  updates: Array<{ id: string; order: number }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = direction === "up" ? ArrowUpIcon : ArrowDownIcon;

  const handleClick = () => {
    startTransition(async () => {
      const result = await actionReorderTestimonials(updates);

      if (result.success) {
        toast.success(result.message ?? "Testimonial order updated.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="size-8"
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-label={
        direction === "up" ? "Move testimonial up" : "Move testimonial down"
      }
    >
      <Icon />
    </Button>
  );
}

export function TestimonialsManager({
  testimonials,
}: TestimonialsManagerProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Testimonials</CardTitle>
            <CardDescription>
              {testimonials.length}{" "}
              {testimonials.length === 1 ? "testimonial" : "testimonials"} for
              the Home page.
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
        {testimonials.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center">
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
        ) : (
          <div className="flex flex-col gap-3">
            {testimonials.map((testimonial, index) => {
              const previousTestimonial = testimonials[index - 1];
              const nextTestimonial = testimonials[index + 1];
              const title = getTitle(testimonial);

              return (
                <div
                  key={testimonial.id}
                  className="grid gap-4 rounded-2xl border bg-background/40 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="flex min-w-0 gap-4">
                    <Avatar className="size-12">
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
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-heading text-lg font-semibold">
                          {testimonial.name}
                        </h2>
                        <Badge variant="outline">
                          order {testimonial.order}
                        </Badge>
                      </div>
                      {title && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {title}
                        </p>
                      )}
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {testimonial.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <div className="flex items-center gap-1">
                      <TestimonialReorderButton
                        direction="up"
                        disabled={!previousTestimonial}
                        updates={
                          previousTestimonial
                            ? [
                                {
                                  id: testimonial.id,
                                  order: previousTestimonial.order,
                                },
                                {
                                  id: previousTestimonial.id,
                                  order: testimonial.order,
                                },
                              ]
                            : []
                        }
                      />
                      <TestimonialReorderButton
                        direction="down"
                        disabled={!nextTestimonial}
                        updates={
                          nextTestimonial
                            ? [
                                {
                                  id: testimonial.id,
                                  order: nextTestimonial.order,
                                },
                                {
                                  id: nextTestimonial.id,
                                  order: testimonial.order,
                                },
                              ]
                            : []
                        }
                      />
                    </div>
                    <TestimonialDialog
                      testimonial={testimonial}
                      trigger={
                        <Button type="button" size="sm" variant="secondary">
                          <PencilSimpleIcon data-icon="inline-start" />
                          Edit
                        </Button>
                      }
                    />
                    <TestimonialDeleteButton testimonial={testimonial} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
