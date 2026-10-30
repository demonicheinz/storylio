"use client";

import {
  ArrowSquareOutIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  actionCreateEducation,
  actionCreateSkill,
  actionCreateSkillCategory,
  actionCreateWorkExperience,
  actionDeleteEducation,
  actionDeleteSkill,
  actionDeleteSkillCategory,
  actionDeleteWorkExperience,
  actionReorderEducationItems,
  actionReorderSkillCategories,
  actionReorderSkills,
  actionReorderWorkExperiences,
  actionUpdateEducation,
  actionUpdateSkill,
  actionUpdateSkillCategory,
  actionUpdateWorkExperience,
} from "@/features/dashboard/about/structured-actions";
import {
  educationSchema,
  skillCategorySchema,
  skillSchema,
  workExperienceSchema,
} from "@/features/dashboard/about/validations";
import { DashboardSelect } from "@/features/dashboard/shared/components/filter-controls";
import { DashboardSortableList } from "@/features/dashboard/shared/components/sortable-list";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { cn } from "@/lib/utils";
import { useAboutDraftGuard } from "./use-about-draft-guard";

export type AboutStructuredData = {
  experiences: Array<
    Record<string, unknown> & {
      id: string;
      title: string;
      order: number;
      isVisible: boolean;
    }
  >;
  education: Array<
    Record<string, unknown> & {
      id: string;
      institution: string;
      order: number;
      isVisible: boolean;
    }
  >;
  categories: Array<
    Record<string, unknown> & {
      id: string;
      name: string;
      order: number;
      isVisible: boolean;
      skills: Array<
        Record<string, unknown> & {
          id: string;
          name: string;
          order: number;
          isVisible: boolean;
        }
      >;
    }
  >;
};

type Kind = "experience" | "education" | "category" | "skill";
type Item = Record<string, unknown> & {
  id: string;
  order: number;
  isVisible: boolean;
};
type Section = "experience" | "education" | "skills";
type SkillItem = Item & {
  categoryId: string;
  categoryName: string;
};

const configs = {
  experience: {
    title: "Work experience",
    required: "title",
    fields: [
      "title",
      "company",
      "location",
      "type",
      "startDate",
      "endDate",
      "descriptionEn",
      "descriptionId",
      "highlightsEn",
      "highlightsId",
    ],
    multiline: [
      "descriptionEn",
      "descriptionId",
      "highlightsEn",
      "highlightsId",
    ],
  },
  education: {
    title: "Education",
    required: "institution",
    fields: [
      "institution",
      "degree",
      "field",
      "location",
      "startYear",
      "endYear",
      "descriptionEn",
      "descriptionId",
    ],
    multiline: ["descriptionEn", "descriptionId"],
  },
  category: {
    title: "Skill category",
    required: "name",
    fields: ["name", "descriptionEn", "descriptionId"],
    multiline: ["descriptionEn", "descriptionId"],
  },
  skill: {
    title: "Skill",
    required: "name",
    fields: ["name", "level", "icon"],
    multiline: [],
  },
} as const;

const labels: Record<string, string> = {
  title: "Title",
  company: "Company",
  location: "Location",
  type: "Type",
  startDate: "Start date",
  endDate: "End date",
  descriptionEn: "Description (English)",
  descriptionId: "Description (Indonesia)",
  highlightsEn: "Highlights (English, one per line)",
  highlightsId: "Highlights (Indonesia, one per line)",
  institution: "Institution",
  degree: "Degree",
  field: "Field",
  startYear: "Start year",
  endYear: "End year",
  name: "Name",
  level: "Level",
  icon: "Icon key",
};

function EditDialog({
  kind,
  item,
  categoryId,
  trigger,
  categories = [],
}: {
  kind: Kind;
  item?: Item;
  categoryId?: string;
  trigger: ReactNode;
  categories?: AboutStructuredData["categories"];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string>();
  const [currentValues, setCurrentValues] = useState<Record<string, unknown>>(
    item ?? {},
  );
  const [dirty, setDirty] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryId ?? "");
  useAboutDraftGuard(open && dirty);
  const close = (next: boolean, details?: { cancel: () => void }) => {
    if (pending) {
      details?.cancel();
      return;
    }
    if (!next && dirty) {
      details?.cancel();
      void confirmAction("Discard unsaved changes to this item?").then(
        (approved) => {
          if (approved) setOpen(false);
        },
      );
      return;
    }
    setOpen(next);
  };
  const config = configs[kind];
  const fieldValue = (field: string) => {
    const value = item?.[field];
    return Array.isArray(value) ? value.join("\n") : String(value ?? "");
  };
  const isExperienceNarrativeField = (field: string) =>
    kind === "experience" &&
    (field.startsWith("description") || field.startsWith("highlights"));
  const getFieldClassName = (field: string) => {
    if (!config.multiline.includes(field as never)) {
      return "flex min-w-0 flex-col gap-2";
    }
    return isExperienceNarrativeField(field)
      ? "flex min-w-0 flex-col gap-2"
      : "flex min-w-0 flex-col gap-2 sm:col-span-2";
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, unknown>;
    data.isVisible = data.isVisible === "on";
    data.isCurrent = data.isCurrent === "on";
    data.order = Number(data.order || 0);
    if (kind === "skill") data.categoryId = selectedCategory;
    setFieldErrors({});
    setFormError(undefined);
    const schema =
      kind === "experience"
        ? workExperienceSchema
        : kind === "education"
          ? educationSchema
          : kind === "category"
            ? skillCategorySchema
            : skillSchema;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setFieldErrors(
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
      setFormError("Please fix the highlighted fields.");
      return;
    }
    const start = String(data.startDate ?? data.startYear ?? "");
    const end = String(data.endDate ?? data.endYear ?? "");
    if (
      !data.isCurrent &&
      /^(\d{4}|\d{4}-\d{2})$/.test(start) &&
      start.length === end.length &&
      start > end
    ) {
      setFieldErrors({
        [kind === "experience" ? "endDate" : "endYear"]: [
          "End must be on or after the start.",
        ],
      });
      return;
    }
    startTransition(async () => {
      try {
        const result =
          kind === "experience"
            ? item
              ? await actionUpdateWorkExperience(item.id, data as never)
              : await actionCreateWorkExperience(data as never)
            : kind === "education"
              ? item
                ? await actionUpdateEducation(item.id, data as never)
                : await actionCreateEducation(data as never)
              : kind === "category"
                ? item
                  ? await actionUpdateSkillCategory(item.id, data as never)
                  : await actionCreateSkillCategory(data as never)
                : item
                  ? await actionUpdateSkill(item.id, data as never)
                  : await actionCreateSkill(data as never);
        if (result.success) {
          toast.add({ title: result.message, type: "success" });
          setDirty(false);
          setOpen(false);
          router.refresh();
        } else {
          setFieldErrors(result.fieldErrors ?? {});
          setFormError(result.error);
        }
      } catch {
        setFormError(
          "Could not save this item. Your changes are still here; try again.",
        );
      }
    });
  };
  return (
    <>
      <div
        className="contents"
        onClick={() => {
          setFieldErrors({});
          setFormError(undefined);
          setCurrentValues(item ?? {});
          setSelectedCategory(categoryId ?? "");
          setDirty(false);
          setOpen(true);
        }}
      >
        {trigger}
      </div>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-2xl max-h-[calc(100dvh-2rem)] overflow-hidden">
          <form
            noValidate
            onSubmit={submit}
            onChange={(event) => {
              setDirty(true);
              setCurrentValues(
                Object.fromEntries(new FormData(event.currentTarget).entries()),
              );
            }}
            className="flex flex-col gap-0 min-w-0 min-h-0 max-h-[inherit]"
          >
            <DialogHeader className="px-4 sm:px-6 pt-5 sm:pt-6 pr-14 sm:pr-14 pb-4 sm:pb-5 shrink-0">
              <DialogTitle>
                {item ? "Edit" : "Add"} {config.title}
              </DialogTitle>
              <DialogDescription>
                Optional bilingual fields fall back to the other language
                publicly.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5 px-4 sm:px-6 pb-5 sm:pb-6 min-h-0 overflow-y-auto overscroll-contain">
              {kind !== "skill" && (
                <div
                  className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground text-xs"
                  aria-live="polite"
                >
                  {(["En", "Id"] as const).map((language) => {
                    const fields = config.fields.filter((field) =>
                      field.endsWith(language),
                    );
                    const filled = fields.filter((field) => {
                      const value = currentValues[field];
                      return Array.isArray(value)
                        ? value.some((entry) => String(entry).trim())
                        : String(value ?? "").trim();
                    }).length;
                    const errorCount = fields.filter(
                      (field) => fieldErrors[field]?.length,
                    ).length;
                    return (
                      <p key={language}>
                        {language === "En" ? "English" : "Indonesia"}: {filled}/
                        {fields.length} optional fields filled
                        {errorCount > 0 ? ` · ${errorCount} errors` : ""}
                      </p>
                    );
                  })}
                </div>
              )}
              {formError && (
                <p role="alert" className="text-destructive text-sm">
                  {formError}
                </p>
              )}
              {kind === "skill" && (
                <div className="flex flex-col gap-2">
                  <DashboardSelect
                    label="Category"
                    value={selectedCategory}
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                    disabled={pending}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setDirty(true);
                    }}
                  />
                  {fieldErrors.categoryId?.[0] && (
                    <p role="alert" className="text-destructive text-sm">
                      {fieldErrors.categoryId[0]}
                    </p>
                  )}
                </div>
              )}
              <div className="gap-4 grid sm:grid-cols-2 min-w-0">
                {config.fields.map((field) => (
                  <div key={field} className={getFieldClassName(field)}>
                    <Label htmlFor={`${kind}-${field}`}>
                      {labels[field]}
                      {field === config.required ? " *" : ""}
                    </Label>
                    {config.multiline.includes(field as never) ? (
                      <Textarea
                        id={`${kind}-${field}`}
                        name={field}
                        defaultValue={fieldValue(field)}
                        wrap="soft"
                        className="max-w-full min-h-28 field-sizing-content wrap-anywhere"
                        disabled={pending}
                        aria-invalid={!!fieldErrors[field]?.length}
                        aria-describedby={`${kind}-${field}-error`}
                      />
                    ) : (
                      <Input
                        id={`${kind}-${field}`}
                        name={field}
                        required={field === config.required}
                        defaultValue={fieldValue(field)}
                        className="min-w-0 truncate"
                        disabled={pending}
                        type={
                          (field === "startDate" || field === "endDate") &&
                          (!fieldValue(field) ||
                            /^\d{4}-\d{2}$/.test(fieldValue(field)))
                            ? "month"
                            : "text"
                        }
                        placeholder={
                          field.endsWith("Date")
                            ? "YYYY-MM"
                            : field.endsWith("Year")
                              ? "YYYY"
                              : undefined
                        }
                        inputMode={
                          field.endsWith("Year") ? "numeric" : undefined
                        }
                        aria-invalid={!!fieldErrors[field]?.length}
                        aria-describedby={`${kind}-${field}-help ${kind}-${field}-error`}
                      />
                    )}
                    {field === "endDate" && (
                      <label className="flex items-center gap-3">
                        <Switch
                          name="isCurrent"
                          defaultChecked={Boolean(item?.isCurrent)}
                          disabled={pending}
                        />{" "}
                        <span className="text-sm">Current role</span>
                      </label>
                    )}
                    {(field.endsWith("Date") || field.endsWith("Year")) && (
                      <p
                        id={`${kind}-${field}-help`}
                        className="text-muted-foreground text-xs"
                      >
                        {field.endsWith("Date")
                          ? "Month and year, if known. Existing date text is preserved."
                          : "Year, if known. Existing year text is preserved."}{" "}
                        Leave blank when unknown.
                      </p>
                    )}
                    {fieldErrors[field]?.[0] && (
                      <p
                        id={`${kind}-${field}-error`}
                        role="alert"
                        className="text-destructive text-sm"
                      >
                        {fieldErrors[field][0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-3">
                <Switch
                  name="isVisible"
                  defaultChecked={item?.isVisible ?? true}
                  disabled={pending}
                />{" "}
                <span className="text-sm">Visible publicly</span>
              </label>
              <input type="hidden" name="order" value={item?.order ?? 0} />
            </div>
            <DialogFooter className="flex-row flex-wrap sm:[&>button]:flex-initial [&>button]:flex-[1_1_100px] px-4 sm:px-6 py-4 border-border border-t [&>button]:min-h-11 shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => close(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return <Badge variant="secondary">{isVisible ? "Visible" : "Hidden"}</Badge>;
}

function SkillLevel({ value }: { value: string }) {
  return (
    <span className="text-muted-foreground text-sm truncate">{value}</span>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action: ReactNode;
}) {
  return (
    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
      <div className="min-w-0">
        <h2 className="font-semibold text-lg">{title}</h2>
        <p className="text-muted-foreground text-sm leading-6">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function ManagedList({
  kind,
  items,
  categoryId,
  children,
  categories = [],
}: {
  kind: Kind;
  items: Item[];
  categoryId?: string;
  children?: (item: Item) => ReactNode;
  categories?: AboutStructuredData["categories"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<Item | null>(null);
  const titleKey =
    kind === "experience"
      ? "title"
      : kind === "education"
        ? "institution"
        : "name";
  const reorderAction =
    kind === "experience"
      ? actionReorderWorkExperiences
      : kind === "education"
        ? actionReorderEducationItems
        : actionReorderSkillCategories;
  const deleteAction =
    kind === "experience"
      ? actionDeleteWorkExperience
      : kind === "education"
        ? actionDeleteEducation
        : kind === "category"
          ? actionDeleteSkillCategory
          : actionDeleteSkill;
  const reorder = async (next: Item[]) => {
    try {
      const input = next.map((item, order) => ({ id: item.id, order }));
      const result =
        kind === "skill"
          ? await actionReorderSkills(input, categoryId ?? "")
          : await reorderAction(input);
      toast.add({
        title: result.success ? result.message : result.error,
        type: result.success ? "success" : "error",
      });
      if (result.success) router.refresh();
      return result.success;
    } catch {
      toast.add({
        title: "Could not save the order. Try again.",
        type: "error",
      });
      return false;
    }
  };
  const title = (item: Item) => String(item[titleKey] ?? "Untitled");
  const subtitle = (item: Item) =>
    kind === "experience"
      ? [item.company, item.type, item.location].filter(Boolean).join(" · ")
      : kind === "education"
        ? [item.degree, item.field, item.location].filter(Boolean).join(" · ")
        : kind === "skill"
          ? String((item as SkillItem).categoryName ?? "")
          : String(item.descriptionEn || item.descriptionId || "");
  const period = (item: Item) =>
    kind === "experience"
      ? [item.startDate, item.isCurrent ? "Present" : item.endDate]
          .filter(Boolean)
          .join(" - ")
      : kind === "education"
        ? [item.startYear, item.endYear].filter(Boolean).join(" - ")
        : "";
  const secondary = (item: Item) =>
    kind === "category"
      ? `${((item.skills as unknown[]) ?? []).length} ${((item.skills as unknown[]) ?? []).length === 1 ? "skill" : "skills"}`
      : period(item);
  const level = (item: Item) => String(item.level ?? "Not set");
  const titleColumnLabel =
    kind === "skill" ? "Skill" : kind === "category" ? "Category" : "Title";
  const secondaryColumnLabel =
    kind === "skill" ? "Category" : kind === "category" ? "Skills" : "Period";
  const metaColumnLabel = kind === "skill" ? "Level" : "Visibility";
  return (
    <div className={dashboardStyles.listSurface}>
      <div
        className={cn(
          "hidden lg:grid px-4",
          dashboardStyles.listHeader,
          kind === "skill"
            ? "grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(8rem,0.8fr)_7rem]"
            : "grid-cols-[44px_minmax(0,1.4fr)_minmax(8rem,0.8fr)_7rem_7rem]",
        )}
      >
        <span />
        <span>{titleColumnLabel}</span>
        <span>{secondaryColumnLabel}</span>
        <span>{metaColumnLabel}</span>
        <span className="text-right">Actions</span>
      </div>
      {items.length === 0 && (
        <div className="bg-background/30 m-4 px-4 py-5 border border-border/70 border-dashed rounded-2xl text-muted-foreground text-sm">
          No entries yet. Add one when you are ready to include it on About.
        </div>
      )}
      <DashboardSortableList
        items={items}
        disabled={pending}
        className="flex flex-col gap-3 p-3"
        onReorder={reorder}
        getItemLabel={title}
        handleVariant="button"
        renderItem={({ item, handle }) => (
          <div
            className={cn(
              "items-center grid min-w-0",
              dashboardStyles.listRow,
              "hover:border-brand-soft/35",
              kind === "skill"
                ? "grid-cols-[44px_minmax(0,1fr)_44px] lg:grid-cols-[44px_minmax(0,1.5fr)_minmax(0,1fr)_minmax(8rem,0.8fr)_7rem]"
                : "grid-cols-[44px_minmax(0,1fr)_44px] lg:grid-cols-[44px_minmax(0,1.4fr)_minmax(8rem,0.8fr)_7rem_7rem]",
            )}
          >
            <div className="flex justify-center self-start py-3">{handle}</div>
            <div className="py-4 lg:py-3 pr-2 lg:pr-4 min-w-0">
              <p className="font-semibold text-sm wrap-anywhere">
                {title(item)}
              </p>
              {subtitle(item) && (
                <p className="text-muted-foreground text-xs wrap-anywhere">
                  {subtitle(item)}
                </p>
              )}
              {kind !== "skill" && secondary(item) && (
                <p className="lg:hidden mt-1 text-muted-foreground text-xs">
                  {secondary(item)}
                </p>
              )}
              <div className="lg:hidden flex flex-wrap items-center gap-2 mt-2">
                <VisibilityBadge
                  isVisible={item.isVisible && item.categoryVisible !== false}
                />
                {kind === "skill" && <SkillLevel value={level(item)} />}
              </div>
              {children?.(item)}
            </div>
            <div className="hidden lg:block text-muted-foreground text-sm truncate">
              {kind === "skill"
                ? (item as SkillItem).categoryName
                : secondary(item)}
            </div>
            <div className="hidden lg:block">
              {kind === "skill" ? (
                <div className="flex flex-wrap gap-2">
                  <SkillLevel value={level(item)} />
                  <VisibilityBadge
                    isVisible={item.isVisible && item.categoryVisible !== false}
                  />
                </div>
              ) : (
                <VisibilityBadge isVisible={item.isVisible} />
              )}
            </div>
            <div className="flex justify-end items-center self-start lg:self-center gap-2 py-3 lg:pr-4">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Open actions for ${title(item)}`}
                    />
                  }
                >
                  <DotsThreeVerticalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{configs[kind].title}</DropdownMenuLabel>
                    <EditDialog
                      kind={kind}
                      categories={categories}
                      item={item}
                      categoryId={(item as SkillItem).categoryId ?? categoryId}
                      trigger={
                        <DropdownMenuItem closeOnClick={false}>
                          <PencilSimpleIcon data-icon="inline-start" />
                          Edit
                        </DropdownMenuItem>
                      }
                    />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      closeOnClick={false}
                      onClick={() => {
                        setDeleting(item);
                      }}
                    >
                      <TrashIcon data-icon="inline-start" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      />
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleting ? title(deleting) : "item"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {kind === "category"
                ? `This also deletes ${((deleting?.skills as unknown[]) ?? []).length} skills in this category. `
                : ""}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() =>
                deleting &&
                startTransition(async () => {
                  const result = await deleteAction(deleting.id);
                  result.success
                    ? (toast.add({ title: result.message, type: "success" }),
                      router.refresh())
                    : toast.add({ title: result.error, type: "error" });
                  setDeleting(null);
                })
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function AboutStructuredManager({
  data,
  section,
}: {
  data: AboutStructuredData;
  section: Section;
}) {
  if (section === "experience") {
    return (
      <div className={dashboardStyles.page}>
        <SectionHeader
          title="Experience"
          subtitle="Manage public work experience entries and their display order."
          action={
            <EditDialog
              kind="experience"
              trigger={
                <Button className="w-full sm:w-auto">
                  <PlusIcon data-icon="inline-start" />
                  Add experience
                </Button>
              }
            />
          }
        />
        <ManagedList kind="experience" items={data.experiences} />
        <Button
          role="link"
          render={<Link href="/about#work-experience" target="_blank" />}
          nativeButton={false}
          variant="link"
          className="px-0 w-fit"
        >
          View on public page
          <ArrowSquareOutIcon data-icon="inline-end" />
        </Button>
      </div>
    );
  }
  if (section === "education") {
    return (
      <div className={dashboardStyles.page}>
        <SectionHeader
          title="Education"
          subtitle="Manage public education history entries and their display order."
          action={
            <EditDialog
              kind="education"
              trigger={
                <Button className="w-full sm:w-auto">
                  <PlusIcon data-icon="inline-start" />
                  Add education
                </Button>
              }
            />
          }
        />
        <ManagedList kind="education" items={data.education} />
        <Button
          role="link"
          render={<Link href="/about#education-history" target="_blank" />}
          nativeButton={false}
          variant="link"
          className="px-0 w-fit"
        >
          View on public page
          <ArrowSquareOutIcon data-icon="inline-end" />
        </Button>
      </div>
    );
  }
  return (
    <div className={dashboardStyles.page}>
      <SectionHeader
        title="Skills"
        subtitle="Manage skill entries, categories, levels, and their public display order."
        action={
          <div className="flex sm:flex-row flex-col gap-2">
            <EditDialog
              kind="category"
              trigger={
                <Button variant="outline" className="w-full sm:w-auto">
                  <PlusIcon data-icon="inline-start" />
                  Add category
                </Button>
              }
            />
          </div>
        }
      />
      <div className="flex flex-col gap-3 min-w-0">
        <div className="min-w-0">
          <h3 className="font-semibold text-base">Categories</h3>
          <p className="text-muted-foreground text-sm">
            Organize skill groups, descriptions, and category order.
          </p>
        </div>
        <ManagedList kind="category" items={data.categories} />
      </div>
      {data.categories.map((category) => (
        <section
          key={category.id}
          className="flex flex-col gap-3 min-w-0"
          aria-label={`${category.name} skills`}
        >
          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-base wrap-anywhere">
                {category.name}
              </h3>
              <p className="text-muted-foreground text-sm">
                {category.skills.length}{" "}
                {category.skills.length === 1 ? "skill" : "skills"} ·{" "}
                {category.isVisible
                  ? "Reorder within this category"
                  : "Category hidden publicly"}
              </p>
            </div>
            <EditDialog
              kind="skill"
              categoryId={category.id}
              categories={data.categories}
              trigger={
                <Button className="w-full sm:w-auto">
                  <PlusIcon data-icon="inline-start" />
                  Add skill
                </Button>
              }
            />
          </div>
          <ManagedList
            kind="skill"
            categoryId={category.id}
            categories={data.categories}
            items={category.skills.map((entry) => ({
              ...entry,
              categoryId: category.id,
              categoryName: category.name,
              categoryVisible: category.isVisible,
            }))}
          />
        </section>
      ))}
      <Button
        role="link"
        render={<Link href="/about#technical-skills" target="_blank" />}
        nativeButton={false}
        variant="link"
        className="px-0 w-fit"
      >
        View on public page
        <ArrowSquareOutIcon data-icon="inline-end" />
      </Button>
    </div>
  );
}
