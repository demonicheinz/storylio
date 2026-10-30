"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactElement,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { TechnologyLogo } from "@/components/common/technology-logo";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  actionCreateHomeSection,
  actionDeleteHomeSection,
  actionReorderHomeSections,
  actionSetHeroHeadline,
  actionUpdateHomeSection,
} from "@/features/dashboard/home/actions";
import {
  type HomeSectionActionInput,
  type HomeSectionActionValues,
  type HomeSectionTypeValue,
  homeSectionActionSchema,
} from "@/features/dashboard/home/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import { DashboardSortableList } from "@/features/dashboard/shared/components/sortable-list";
import { DEFAULT_HOME_HERO } from "@/lib/home-hero";
import {
  getHomeLogoSettings,
  hasLocalTechnologyLogo,
} from "@/lib/home-technologies";
import { cn, formatDate } from "@/lib/utils";
import styles from "./home.module.css";
import {
  clearHeroDraft,
  clearHomeDraft,
  homeSectionDraftKey,
  readHeroDraft,
  readSectionDraft,
  saveHeroDraft,
  saveSectionDraft,
} from "./home-drafts";

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
  headline: string;
  subheadline?: string;
  phases: DashboardHomeSection[];
  logos: DashboardHomeSection[];
};

const DraftContext = createContext<(id: string, dirty: boolean) => void>(
  () => {},
);

function useHomeDraft(dirty: boolean) {
  const id = useId();
  const report = useContext(DraftContext);
  useEffect(() => {
    report(id, dirty);
    return () => report(id, false);
  }, [dirty, id, report]);
}

function HeroHeadlineForm({
  headline,
  subheadline,
}: {
  headline: string;
  subheadline: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(headline);
  const [savedValue, setSavedValue] = useState(headline);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const dirty = value !== savedValue;
  useHomeDraft(dirty);
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = readHeroDraft(headline);
    if (draft !== undefined) setValue(draft);
  }, [headline]);
  useEffect(() => {
    if (error && !pending) textarea.current?.focus();
  }, [error, pending]);
  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = "auto";
    textarea.current.style.height = `${textarea.current.scrollHeight}px`;
  }, [value]);

  return (
    <section className={styles.panel} aria-labelledby="home-hero-title">
      <header className={styles.sectionHeader}>
        <div>
          <h2 id="home-hero-title">Hero</h2>
          <p>The headline opens the public Home page.</p>
        </div>
      </header>
      <form
        className={styles.formBody}
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setError(undefined);
          try {
            const result = await actionSetHeroHeadline({ headline: value });
            if (!result.success) {
              setError(result.fieldErrors?.headline?.[0] ?? result.error);
              textarea.current?.focus();
              return;
            }
            setValue(value.trim());
            setSavedValue(value.trim());
            clearHeroDraft();
            toast.add({
              title: result.message ?? "Headline saved.",
              type: "success",
            });
            router.refresh();
          } catch {
            setError(
              "Could not save the headline. Your draft is kept. Try again.",
            );
            textarea.current?.focus();
          } finally {
            setPending(false);
          }
        }}
      >
        <div className={styles.field}>
          <Label htmlFor="hero-headline">Headline</Label>
          <Textarea
            ref={textarea}
            id="hero-headline"
            rows={2}
            className={styles.headline}
            value={value}
            maxLength={160}
            disabled={pending}
            aria-invalid={!!error}
            aria-describedby="hero-headline-help hero-headline-count hero-headline-error"
            placeholder={DEFAULT_HOME_HERO.headline}
            onChange={(event) => {
              setValue(event.target.value);
              saveHeroDraft(savedValue, event.target.value);
              setError(undefined);
            }}
          />
          <p id="hero-headline-count" className={styles.caption}>
            {value.length}/160 characters
          </p>
          <p id="hero-headline-help" className={styles.help}>
            Leave empty to use the default: {DEFAULT_HOME_HERO.headline}
          </p>
          <p id="hero-headline-error" role="alert" className={styles.error}>
            {error}
          </p>
        </div>
        <div className={styles.field}>
          <p className="font-medium">Subheadline</p>
          <p>{subheadline.trim() || DEFAULT_HOME_HERO.subheadline}</p>
          <p className={styles.help}>
            Uses your profile bio.{" "}
            <Link href="/dashboard/settings" className={styles.link}>
              Edit bio in Settings
            </Link>
            .
          </p>
        </div>
        <div className={styles.formActions}>
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save headline"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || !dirty}
            onClick={() => {
              if (window.confirm("Discard the unsaved headline?")) {
                setValue(savedValue);
                clearHeroDraft();
                setError(undefined);
              }
            }}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </section>
  );
}

function getHomeSectionDefaults(
  type: HomeSectionTypeValue,
  section?: DashboardHomeSection,
): HomeSectionActionValues {
  const settings = section ? getHomeLogoSettings(section) : undefined;
  return {
    type,
    label: section?.label ?? "",
    content:
      type === "LOGO"
        ? (settings?.description ?? "")
        : (section?.content ?? ""),
    category: settings?.category ?? "TECHNOLOGY",
    showOnHome: settings?.showOnHome ?? true,
    imageUrl: section?.imageUrl ?? undefined,
    order: section?.order ?? 0,
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
  open: controlledOpen,
  onOpenChange,
  returnFocus,
}: {
  section?: DashboardHomeSection;
  type: HomeSectionTypeValue;
  trigger?: ReactElement;
  triggerNativeButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  returnFocus?: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const id = useId();
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [imageMethod, setImageMethod] = useState("upload");
  const [failure, setFailure] = useState<string>();
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
    setFocus,
    setValue,
    watch,
  } = useForm<HomeSectionActionInput, unknown, HomeSectionActionValues>({
    resolver: zodResolver(homeSectionActionSchema),
    defaultValues: getHomeSectionDefaults(type, section),
  });
  const imageUrl = watch("imageUrl");
  const label = watch("label");
  const category = watch("category");
  const showOnHome = watch("showOnHome");
  const builtin = hasLocalTechnologyLogo(label);
  const draftKey = homeSectionDraftKey(type, section?.id);
  const draftBase = useRef(getHomeSectionDefaults(type, section));
  useHomeDraft(open && isDirty);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      const defaults = getHomeSectionDefaults(type, section);
      draftBase.current = defaults;
      const draft = readSectionDraft(draftKey, defaults);
      reset(defaults);
      if (draft) reset(draft, { keepDefaultValues: true });
      setFailure(undefined);
      setImageMethod("upload");
    }
    wasOpen.current = open;
  }, [draftKey, open, reset, section, type]);
  useEffect(() => {
    if (!open) return;
    const subscription = watch((values) =>
      saveSectionDraft(draftKey, draftBase.current, values),
    );
    return () => subscription.unsubscribe();
  }, [draftKey, open, watch]);
  useEffect(() => {
    if (!open || pending) return;
    const first = Object.keys(errors)[0] as
      | keyof HomeSectionActionInput
      | undefined;
    if (!first) return;
    // Error details must be expanded and disabled fields re-enabled before focus.
    const frame = requestAnimationFrame(() => setFocus(first));
    return () => cancelAnimationFrame(frame);
  }, [errors, open, pending, setFocus]);

  const changeOpen = (next: boolean) => {
    if (pendingRef.current) return;
    if (
      !next &&
      isDirty &&
      !window.confirm("Discard unsaved changes to this Home section?")
    )
      return;
    if (!next) clearHomeDraft(draftKey);
    setOpen(next);
  };
  const save = handleSubmit(async (values) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setFailure(undefined);
    try {
      const payload = { ...values, type };
      const result = section
        ? await actionUpdateHomeSection(section.id, payload)
        : await actionCreateHomeSection(payload);
      if (!result.success) {
        const fields = Object.entries(result.fieldErrors ?? {});
        for (const [field, messages] of fields)
          if (messages[0])
            setError(field as keyof HomeSectionActionInput, {
              type: "server",
              message: messages[0],
            });
        if (fields[0]) setFocus(fields[0][0] as keyof HomeSectionActionInput);
        setFailure(result.error);
        return;
      }
      reset(values);
      clearHomeDraft(draftKey);
      setOpen(false);
      toast.add({
        title: result.message ?? "Home section saved.",
        type: "success",
      });
      router.refresh();
    } catch {
      setFailure("Could not save this section. Your input is kept. Try again.");
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  });
  const fieldError = (field: keyof HomeSectionActionInput) => (
    <p id={`${id}-${field}-error`} role="alert" className={styles.error}>
      {errors[field]?.message}
    </p>
  );

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {trigger && (
        <DialogTrigger nativeButton={triggerNativeButton} render={trigger} />
      )}
      <DialogContent
        className={styles.dialog}
        showCloseButton={!pending}
        finalFocus={returnFocus}
      >
        <form onSubmit={save} noValidate className={styles.dialogForm}>
          <DialogHeader className={styles.dialogHeader}>
            <DialogTitle>
              {section ? "Edit" : "Add"} {getTypeLabel(type)}
            </DialogTitle>
            <DialogDescription>
              {type === "LOGO"
                ? "Choose a logo and where it appears."
                : "Describe a phase of your approach."}
            </DialogDescription>
          </DialogHeader>
          <div className={styles.dialogBody}>
            <input type="hidden" {...register("type")} />
            <div className={styles.field}>
              <Label htmlFor={`${id}-label`}>
                {type === "LOGO" ? "Logo name" : "Phase title"}
              </Label>
              <Input
                id={`${id}-label`}
                autoComplete="off"
                disabled={pending}
                aria-invalid={!!errors.label}
                aria-describedby={`${id}-label-error`}
                {...register("label")}
              />
              {fieldError("label")}
            </div>
            {type === "PHASE" ? (
              <div className={styles.field}>
                <Label htmlFor={`${id}-content`}>Description</Label>
                <Textarea
                  id={`${id}-content`}
                  className="min-h-28"
                  disabled={pending}
                  aria-invalid={!!errors.content}
                  aria-describedby={`${id}-content-error`}
                  {...register("content")}
                />
                {fieldError("content")}
              </div>
            ) : (
              <>
                <div className={styles.field}>
                  <Label htmlFor={`${id}-category`}>Logo category</Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select
                        items={[
                          { value: "TECHNOLOGY", label: "Technology" },
                          { value: "CLIENT", label: "Client" },
                        ]}
                        value={field.value ?? "TECHNOLOGY"}
                        disabled={pending}
                        onValueChange={(next) => {
                          if (next === null) return;
                          field.onChange(next);
                          if (next === "CLIENT")
                            setValue("showOnHome", false, {
                              shouldDirty: true,
                            });
                        }}
                      >
                        <SelectTrigger
                          id={`${id}-category`}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className="w-full"
                          aria-invalid={!!errors.category}
                          aria-describedby={`${id}-category-error`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          align="start"
                        >
                          <SelectGroup>
                            <SelectItem value="TECHNOLOGY">
                              Technology
                            </SelectItem>
                            <SelectItem value="CLIENT">Client</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {fieldError("category")}
                </div>
                <div className={styles.visibility}>
                  <Label htmlFor={`${id}-show-home`}>
                    Show in Home tech stack
                  </Label>
                  <Switch
                    id={`${id}-show-home`}
                    checked={Boolean(showOnHome)}
                    disabled={pending || category === "CLIENT"}
                    aria-describedby={`${id}-showOnHome-error`}
                    onCheckedChange={(checked) =>
                      setValue("showOnHome", checked, { shouldDirty: true })
                    }
                  />
                </div>
                {fieldError("showOnHome")}
                <div className={styles.logoSource}>
                  <span className={styles.logoPreview} data-home-logo-preview>
                    <TechnologyLogo
                      label={label}
                      imageUrl={imageUrl}
                      size={40}
                    />
                  </span>
                  <p className={styles.help}>
                    {imageUrl
                      ? "Custom image selected. A failed image falls back to a built-in logo when available."
                      : builtin
                        ? "Using the built-in logo."
                        : "Choose an image below."}
                  </p>
                </div>
                <details
                  open={!builtin || !!errors.imageUrl}
                  className={styles.replacement}
                >
                  <summary>Choose or replace image</summary>
                  <fieldset disabled={pending} className={styles.field}>
                    <legend className="sr-only">Choose one logo image</legend>
                    <div className={styles.imageMethods}>
                      <label>
                        <input
                          type="radio"
                          name={`${id}-image-method`}
                          value="upload"
                          checked={imageMethod === "upload"}
                          onChange={() => setImageMethod("upload")}
                        />{" "}
                        Upload
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`${id}-image-method`}
                          value="url"
                          checked={imageMethod === "url"}
                          onChange={() => setImageMethod("url")}
                        />{" "}
                        Paste URL
                      </label>
                    </div>
                    {imageMethod === "upload" && (
                      <ImageUpload
                        value={imageUrl || undefined}
                        disabled={pending}
                        previewClassName="aspect-auto h-24"
                        previewImageClassName="object-contain"
                        onChange={(url) =>
                          setValue("imageUrl", url, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        onRemove={() =>
                          setValue("imageUrl", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      />
                    )}
                    <div className={styles.field}>
                      <Label htmlFor={`${id}-imageUrl`}>
                        {imageMethod === "url"
                          ? "Logo image URL"
                          : "Selected image URL"}
                      </Label>
                      <Input
                        id={`${id}-imageUrl`}
                        type="url"
                        disabled={pending}
                        readOnly={imageMethod !== "url"}
                        aria-invalid={!!errors.imageUrl}
                        aria-describedby={`${id}-imageUrl-error`}
                        {...register("imageUrl")}
                      />
                      {fieldError("imageUrl")}
                    </div>
                  </fieldset>
                </details>
              </>
            )}
            <details open={!!errors.order} className={styles.replacement}>
              <summary>Display order and details</summary>
              <div className={styles.field}>
                <Label htmlFor={`${id}-order`}>Display order</Label>
                <Input
                  id={`${id}-order`}
                  type="number"
                  min={0}
                  disabled={pending}
                  aria-invalid={!!errors.order}
                  aria-describedby={`${id}-order-error`}
                  {...register("order")}
                />
                {fieldError("order")}
                {section && (
                  <p className={styles.caption}>
                    Created {formatDate(section.createdAt)}
                  </p>
                )}
              </div>
            </details>
            <p role="alert" className={styles.error}>
              {failure}
            </p>
          </div>
          <DialogFooter className={styles.dialogFooter}>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => changeOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function HomeSectionDeleteButton({
  section,
  open,
  onOpenChange,
  returnFocus,
}: {
  section: DashboardHomeSection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [error, setError] = useState<string>();
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pendingRef.current) {
          onOpenChange(next);
          setError(undefined);
        }
      }}
    >
      <AlertDialogContent finalFocus={returnFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {section.label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the section from Home. This cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p role="alert" className={styles.error}>
          {error}
        </p>
        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              if (!pendingRef.current) onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={async () => {
              if (pendingRef.current) return;
              pendingRef.current = true;
              setPending(true);
              setError(undefined);
              try {
                const result = await actionDeleteHomeSection(section.id);
                if (!result.success) {
                  setError(result.error);
                  return;
                }
                onOpenChange(false);
                toast.add({
                  title: result.message ?? "Home section deleted.",
                  type: "success",
                });
                router.refresh();
              } catch {
                setError("Could not delete this section. Try again.");
              } finally {
                pendingRef.current = false;
                setPending(false);
              }
            }}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const actionButton = useRef<HTMLButtonElement>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              ref={actionButton}
              type="button"
              variant="ghost"
              size="icon"
              className={styles.actionButton}
              aria-label={`Open actions for ${section.label}`}
            />
          }
        >
          <DotsThreeVerticalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <PencilSimpleIcon data-icon="inline-start" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <TrashIcon data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <HomeSectionDialog
        section={section}
        type={type}
        open={editOpen}
        onOpenChange={setEditOpen}
        returnFocus={actionButton}
      />
      <HomeSectionDeleteButton
        section={section}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        returnFocus={actionButton}
      />
    </>
  );
}

function HomeLogoStatus({ logo }: { logo: DashboardHomeSection }) {
  const { category, showOnHome } = getHomeLogoSettings(logo);
  return (
    <p className={styles.caption}>
      {category === "TECHNOLOGY"
        ? `Technology · ${showOnHome ? "Shown on Home" : "Hidden from Home"}`
        : "Client · Saved in dashboard"}
    </p>
  );
}

function HomeContentList({
  items,
  type,
}: {
  items: DashboardHomeSection[];
  type: HomeSectionTypeValue;
}) {
  const router = useRouter();
  const [ordered, setOrdered] = useState(items);
  const [reorder, setReorder] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [failure, setFailure] = useState<string>();
  const [retryItems, setRetryItems] = useState<DashboardHomeSection[]>();
  const saving = useRef(false);
  useEffect(() => {
    setOrdered(items);
  }, [items]);

  const saveOrder = async (
    nextItems: DashboardHomeSection[],
  ): Promise<boolean> => {
    if (saving.current) return false;
    saving.current = true;
    setStatus("saving");
    setFailure(undefined);
    setRetryItems(nextItems);
    try {
      const result = await actionReorderHomeSections(
        nextItems.map((item, order) => ({ id: item.id, order })),
      );
      if (!result.success) {
        setFailure(result.error);
        setStatus("error");
        return false;
      }
      setOrdered(nextItems);
      setStatus("saved");
      setRetryItems(undefined);
      router.refresh();
      return true;
    } catch {
      setFailure("Could not save the order. The previous order is restored.");
      setStatus("error");
      return false;
    } finally {
      saving.current = false;
    }
  };
  const move = (index: number, offset: number) => {
    const next = [...ordered];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    void saveOrder(next);
  };
  return (
    <>
      <div className={styles.listToolbar}>
        <p className={styles.help}>
          {items.length}{" "}
          {type === "LOGO"
            ? items.length === 1
              ? "logo"
              : "logos"
            : items.length === 1
              ? "phase"
              : "phases"}
        </p>
        <div className={styles.toolbarActions}>
          {items.length > 1 && (
            <Button
              type="button"
              variant="outline"
              disabled={status === "saving"}
              aria-pressed={reorder}
              onClick={() => setReorder(!reorder)}
            >
              {reorder ? "Done reordering" : "Reorder"}
            </Button>
          )}
          <HomeSectionDialog
            type={type}
            trigger={
              <Button type="button">
                <PlusIcon data-icon="inline-start" />
                Add {getTypeLabel(type)}
              </Button>
            }
          />
        </div>
      </div>
      {reorder && (
        <p className={styles.help}>
          Drag a named handle, use Space then arrow keys, or choose Move
          up/down. Each move saves automatically.
        </p>
      )}
      <div role="status" aria-live="polite" className={styles.saveStatus}>
        {status === "saving"
          ? "Saving order…"
          : status === "saved"
            ? "Order saved."
            : ""}
      </div>
      {status === "error" && (
        <div className={styles.retry}>
          <p role="alert" className={styles.error}>
            {failure}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (retryItems) void saveOrder(retryItems);
            }}
          >
            Retry order save
          </Button>
        </div>
      )}
      {!items.length ? (
        <div className={styles.empty}>
          <p className="font-medium">
            {type === "LOGO" ? "No logos yet" : "No phases yet"}
          </p>
          <p className={styles.help}>
            {type === "LOGO"
              ? "Add technologies for the public stack. Client logos are stored separately."
              : "Add phases to explain how your work flows."}
          </p>
        </div>
      ) : (
        <DashboardSortableList
          items={ordered}
          disabled={!reorder || status === "saving"}
          getItemLabel={(item) => item.label}
          handleVariant="button"
          className={styles.rows}
          onReorder={saveOrder}
          renderItem={({ item, index, handle, isDragging }) => (
            <div
              className={cn(styles.row, isDragging && styles.dragging)}
              data-kind={type}
              data-reorder={reorder}
            >
              {reorder && <div className={styles.handle}>{handle}</div>}
              {type === "LOGO" && (
                <span className={styles.logoPreview} data-home-logo-preview>
                  <TechnologyLogo
                    label={item.label}
                    imageUrl={item.imageUrl}
                    size={40}
                  />
                </span>
              )}
              <div className={styles.rowText}>
                <h3>{item.label}</h3>
                {type === "LOGO" ? (
                  <HomeLogoStatus logo={item} />
                ) : (
                  <p className={styles.description}>
                    {item.content || "No description yet."}
                  </p>
                )}
              </div>
              {!reorder && (
                <div className={styles.rowMenu}>
                  <HomeSectionActions section={item} type={type} />
                </div>
              )}
              {reorder && (
                <div className={styles.moveControls}>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={index === 0 || status === "saving"}
                    aria-label={`Move ${item.label} up`}
                    onClick={() => move(index, -1)}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      index === ordered.length - 1 || status === "saving"
                    }
                    aria-label={`Move ${item.label} down`}
                    onClick={() => move(index, 1)}
                  >
                    Move down
                  </Button>
                </div>
              )}
            </div>
          )}
        />
      )}
    </>
  );
}

export function HomeContentManager({
  headline,
  subheadline = "",
  phases,
  logos,
}: HomeContentManagerProps) {
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});
  const reportDraft = useCallback(
    (id: string, dirty: boolean) =>
      setDrafts((current) => {
        if (Boolean(current[id]) === dirty) return current;
        const next = { ...current };
        if (dirty) next[id] = true;
        else delete next[id];
        return next;
      }),
    [],
  );
  const dirty = Object.values(drafts).some(Boolean);
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const next = new URL(anchor.href, window.location.href);
      if (
        !["http:", "https:"].includes(next.protocol) ||
        (next.origin === window.location.origin &&
          next.pathname === window.location.pathname &&
          next.search === window.location.search)
      )
        return;
      if (!window.confirm("Leave Home and discard unsaved changes?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty]);
  return (
    <DraftContext.Provider value={reportDraft}>
      <Tabs defaultValue="hero" className={styles.home}>
        <TabsList className={styles.tabs}>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="approach">Approach</TabsTrigger>
          <TabsTrigger value="logos">Tech stack</TabsTrigger>
        </TabsList>
        <nav aria-label="Other Home content" className={styles.related}>
          <span>Also on Home:</span>
          <Link href="/dashboard/projects">Projects</Link>
          <Link href="/dashboard/posts">Writing and Notes</Link>
        </nav>
        <TabsContent value="hero" keepMounted className={styles.tabPanel}>
          <HeroHeadlineForm headline={headline} subheadline={subheadline} />
        </TabsContent>
        <TabsContent value="approach" keepMounted className={styles.tabPanel}>
          <section
            className={styles.panel}
            aria-labelledby="home-approach-title"
          >
            <header className={styles.sectionHeader}>
              <div>
                <h2 id="home-approach-title">Approach</h2>
                <p>Manage the phases shown on Home, in reading order.</p>
              </div>
            </header>
            <HomeContentList type="PHASE" items={phases} />
          </section>
        </TabsContent>
        <TabsContent value="logos" keepMounted className={styles.tabPanel}>
          <section className={styles.panel} aria-labelledby="home-stack-title">
            <header className={styles.sectionHeader}>
              <div>
                <h2 id="home-stack-title">Tech stack</h2>
                <p>
                  Choose technologies for Home. Client logos remain
                  dashboard-only.
                </p>
              </div>
            </header>
            <HomeContentList type="LOGO" items={logos} />
          </section>
        </TabsContent>
      </Tabs>
    </DraftContext.Provider>
  );
}
