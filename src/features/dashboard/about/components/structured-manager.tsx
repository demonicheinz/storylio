"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
}: {
  kind: Kind;
  item?: Item;
  categoryId?: string;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const config = configs[kind];
  const fieldValue = (field: string) => {
    const value = item?.[field];
    return Array.isArray(value) ? value.join("\n") : String(value ?? "");
  };
  const isScrollableExperienceField = (field: string) =>
    kind === "experience" &&
    (field.startsWith("description") || field.startsWith("highlights"));
  const isScrollableDescriptionField = (field: string) =>
    (kind === "education" || kind === "category") &&
    field.startsWith("description");
  const getFieldClassName = (field: string) => {
    if (!config.multiline.includes(field as never)) {
      return "flex min-w-0 flex-col gap-2";
    }

    return isScrollableExperienceField(field)
      ? "flex min-w-0 flex-col gap-2"
      : "flex min-w-0 flex-col gap-2 sm:col-span-2";
  };
  const getTextareaClassName = (field: string) =>
    isScrollableExperienceField(field)
      ? "max-h-32 min-h-24 overflow-y-auto scrollbar-none field-sizing-fixed wrap-anywhere"
      : isScrollableDescriptionField(field)
        ? "max-h-36 min-h-24 overflow-y-auto scrollbar-none field-sizing-fixed wrap-anywhere"
        : "min-h-24 max-w-full field-sizing-fixed wrap-anywhere";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    ) as Record<string, unknown>;
    data.isVisible = data.isVisible === "on";
    data.isCurrent = data.isCurrent === "on";
    data.order = Number(data.order || 0);
    if (categoryId) data.categoryId = categoryId;
    startTransition(async () => {
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
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else toast.error(result.error);
    });
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-2xl">
          <form onSubmit={submit} className="flex min-w-0 flex-col gap-5">
            <DialogHeader>
              <DialogTitle>
                {item ? "Edit" : "Add"} {config.title}
              </DialogTitle>
              <DialogDescription>
                Optional bilingual fields fall back to the other language
                publicly.
              </DialogDescription>
            </DialogHeader>
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {config.fields.map((field) => (
                <div key={field} className={getFieldClassName(field)}>
                  <Label htmlFor={`${kind}-${field}`}>{labels[field]}</Label>
                  {config.multiline.includes(field as never) ? (
                    <Textarea
                      id={`${kind}-${field}`}
                      name={field}
                      defaultValue={fieldValue(field)}
                      wrap="soft"
                      className={getTextareaClassName(field)}
                    />
                  ) : (
                    <Input
                      id={`${kind}-${field}`}
                      name={field}
                      required={field === config.required}
                      defaultValue={fieldValue(field)}
                      className="min-w-0 truncate"
                    />
                  )}
                </div>
              ))}
            </div>
            {kind === "experience" && (
              <label className="flex items-center gap-3">
                <Switch
                  name="isCurrent"
                  defaultChecked={Boolean(item?.isCurrent)}
                />{" "}
                <span className="text-sm">Current role</span>
              </label>
            )}
            <label className="flex items-center gap-3">
              <Switch
                name="isVisible"
                defaultChecked={item?.isVisible ?? true}
              />{" "}
              <span className="text-sm">Visible publicly</span>
            </label>
            <input type="hidden" name="order" value={item?.order ?? 0} />
            <DialogFooter>
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

function ManagedList({
  kind,
  items,
  categoryId,
  children,
  compact = false,
}: {
  kind: Kind;
  items: Item[];
  categoryId?: string;
  children?: (item: Item) => ReactNode;
  compact?: boolean;
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
        : kind === "category"
          ? actionReorderSkillCategories
          : actionReorderSkills;
  const deleteAction =
    kind === "experience"
      ? actionDeleteWorkExperience
      : kind === "education"
        ? actionDeleteEducation
        : kind === "category"
          ? actionDeleteSkillCategory
          : actionDeleteSkill;
  const move = (index: number, delta: number) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    startTransition(async () => {
      const result = await reorderAction(
        next.map((item, order) => ({ id: item.id, order })),
      );
      result.success
        ? (toast.success(result.message), router.refresh())
        : toast.error(result.error);
    });
  };
  const preview = (item: Item) => {
    if (kind === "experience") {
      const meta = [
        item.company,
        item.type,
        item.location,
        [item.startDate, item.isCurrent ? "Present" : item.endDate]
          .filter(Boolean)
          .join(" - "),
      ]
        .filter(Boolean)
        .join(" · ");
      const description = String(
        item.descriptionEn || item.descriptionId || "",
      );
      return { meta, description };
    }
    if (kind === "education") {
      const meta = [
        item.degree,
        item.field,
        item.location,
        [item.startYear, item.endYear].filter(Boolean).join(" - "),
      ]
        .filter(Boolean)
        .join(" · ");
      const description = String(
        item.descriptionEn || item.descriptionId || "",
      );
      return { meta, description };
    }
    if (kind === "skill") {
      return {
        meta: [item.level, item.icon].filter(Boolean).join(" · "),
        description: "",
      };
    }
    return { meta: "", description: "" };
  };
  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed bg-background/20 px-4 py-5 text-sm text-muted-foreground">
          No CMS items yet. Public About continues using static fallback
          content.
        </div>
      )}
      {items.map((item, index) => (
        <Card key={item.id} className="rounded-xl">
          <CardContent
            className={
              compact
                ? "flex items-center gap-2 px-2.5 py-2 sm:px-3"
                : "flex items-center gap-3 px-3 py-3 sm:px-4"
            }
          >
            <div className="flex shrink-0 flex-col gap-0.5">
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={pending || index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={pending || index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDownIcon />
              </Button>
            </div>
            <div className="min-w-0 flex-1 py-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="max-w-full min-w-0 truncate font-medium">
                  {String(item[titleKey])}
                </p>
                <Badge
                  variant={item.isVisible ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {item.isVisible ? "Visible" : "Hidden"}
                </Badge>
              </div>
              {preview(item).meta && (
                <p className="mt-1 line-clamp-1 scrollbar-none text-xs leading-5 wrap-break-word text-muted-foreground">
                  {preview(item).meta}
                </p>
              )}
              {preview(item).description && (
                <p className="mt-1 line-clamp-2 scrollbar-none text-sm leading-6 wrap-break-word text-muted-foreground">
                  {preview(item).description}
                </p>
              )}
              {children?.(item)}
            </div>
            <EditDialog
              kind={kind}
              item={item}
              categoryId={categoryId}
              trigger={
                <Button size="icon-sm" variant="ghost">
                  <PencilSimpleIcon />
                </Button>
              }
            />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setDeleting(item)}
            >
              <TrashIcon />
            </Button>
          </CardContent>
        </Card>
      ))}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleting &&
                startTransition(async () => {
                  const result = await deleteAction(deleting.id);
                  result.success
                    ? (toast.success(result.message), router.refresh())
                    : toast.error(result.error);
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
}: {
  data: AboutStructuredData;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/40 px-5 py-5 sm:px-6">
        <CardTitle>Structured About Sections</CardTitle>
        <CardDescription>
          Manage the fixed Work Experience, Education History, and Technical
          Skills sections.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-6 sm:px-6">
        <Tabs defaultValue="experience">
          <TabsList className="mb-6">
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>
          <TabsContent value="experience">
            <div className="mb-5">
              <EditDialog
                kind="experience"
                trigger={
                  <Button>
                    <PlusIcon /> Add experience
                  </Button>
                }
              />
            </div>
            <ManagedList kind="experience" items={data.experiences} />
          </TabsContent>
          <TabsContent value="education">
            <div className="mb-5">
              <EditDialog
                kind="education"
                trigger={
                  <Button>
                    <PlusIcon /> Add education
                  </Button>
                }
              />
            </div>
            <ManagedList kind="education" items={data.education} />
          </TabsContent>
          <TabsContent value="skills">
            <div className="mb-5">
              <EditDialog
                kind="category"
                trigger={
                  <Button>
                    <PlusIcon /> Add category
                  </Button>
                }
              />
            </div>
            <ManagedList kind="category" items={data.categories}>
              {(category) => (
                <div className="mt-3 min-w-0 overflow-hidden rounded-lg border border-border/40 bg-background/20 p-3 sm:p-4">
                  <div className="mb-3">
                    <EditDialog
                      kind="skill"
                      categoryId={category.id}
                      trigger={
                        <Button size="sm" variant="outline">
                          <PlusIcon /> Add skill
                        </Button>
                      }
                    />
                  </div>
                  <ManagedList
                    kind="skill"
                    categoryId={category.id}
                    items={(category.skills as Item[]) ?? []}
                    compact
                  />
                </div>
              )}
            </ManagedList>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
