"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowSquareOutIcon,
  FloppyDiskIcon,
  InfoIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actionUpdateAboutContent } from "@/features/dashboard/about/actions";
import {
  type AboutContentActionInput,
  type AboutContentActionValues,
  aboutContentActionSchema,
} from "@/features/dashboard/about/validations";
import { dashboardStyles } from "@/features/dashboard/shared/styles";

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
        className="min-h-80 font-mono text-sm"
        value="Loading editor..."
      />
    ),
  },
);

export type DashboardAboutContent = {
  introEn: string | null;
  introId: string | null;
  howIWorkEn: string | null;
  howIWorkId: string | null;
  whatIValueEn: string | null;
  whatIValueId: string | null;
  defaultLanguage: string;
};

type Language = "en" | "id";

const languageLabels: Record<Language, string> = {
  en: "English",
  id: "Indonesia",
};

const introLimit = 500;
const mdxLimit = 1000;

function getDefaults(
  content?: DashboardAboutContent,
): AboutContentActionValues {
  return {
    introEn: content?.introEn ?? "",
    introId: content?.introId ?? "",
    howIWorkEn: content?.howIWorkEn ?? "",
    howIWorkId: content?.howIWorkId ?? "",
    whatIValueEn: content?.whatIValueEn ?? "",
    whatIValueId: content?.whatIValueId ?? "",
    defaultLanguage: content?.defaultLanguage === "id" ? "id" : "en",
  };
}

export function AboutContentForm({
  content,
}: {
  content?: DashboardAboutContent;
}) {
  const router = useRouter();
  const [activeLanguage, setActiveLanguage] = useState<Language>("en");
  const [isPending, startTransition] = useTransition();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    watch,
  } = useForm<AboutContentActionInput, unknown, AboutContentActionValues>({
    resolver: zodResolver(aboutContentActionSchema),
    defaultValues: getDefaults(content),
  });
  const watchedValues = watch();

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages[0]) {
        setError(field as keyof AboutContentActionValues, {
          message: messages[0],
          type: "server",
        });
      }
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await actionUpdateAboutContent(values);

      if (result.success) {
        toast.success(result.message ?? "About content updated.");
        router.refresh();
        return;
      }

      applyFieldErrors(result.fieldErrors);
      toast.error(result.error);
    });
  });

  const introName = activeLanguage === "en" ? "introEn" : "introId";
  const howIWorkName = activeLanguage === "en" ? "howIWorkEn" : "howIWorkId";
  const whatIValueName =
    activeLanguage === "en" ? "whatIValueEn" : "whatIValueId";
  const introLength = (watchedValues[introName] ?? "").length;
  const howIWorkLength = (watchedValues[howIWorkName] ?? "").length;
  const whatIValueLength = (watchedValues[whatIValueName] ?? "").length;

  return (
    <form className="flex flex-col gap-5 min-w-0" onSubmit={onSubmit}>
      <Card className="bg-card/55 py-4 border-border/70">
        <CardContent className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 px-4">
          <div className="flex gap-3 min-w-0">
            <div className="flex justify-center items-center bg-brand-soft/15 rounded-2xl size-9 text-brand-soft shrink-0">
              <InfoIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-heading font-semibold">
                Profile content lives in Settings
              </p>
              <p className="text-muted-foreground text-sm leading-5">
                Display name, tagline, avatar, short bio, and social links are
                managed from Profile Settings. This tab only controls the public
                About page narrative.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="rounded-2xl w-full sm:w-auto shrink-0"
          >
            <Link href="/dashboard/settings">
              Go to Profile Settings
              <ArrowSquareOutIcon data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className={dashboardStyles.surface}>
        <CardContent className="flex flex-col gap-6 p-5 sm:p-6">
          {!content && (
            <div className="bg-background/30 p-4 border border-border/70 border-dashed rounded-2xl">
              <p className="font-medium text-foreground">
                About content has not been created yet.
              </p>
              <p className="text-muted-foreground text-sm leading-6">
                The public About page currently uses its static fallback. Your
                first save will create the singleton CMS record.
              </p>
            </div>
          )}

          <div className="flex md:flex-row flex-col md:justify-between md:items-end gap-3">
            <div className="min-w-0">
              <Label>Editing language</Label>
              <div className="flex bg-background/40 mt-2 p-1 border border-border/50 rounded-full w-full sm:w-fit">
                {(["en", "id"] as const).map((language) => (
                  <Button
                    key={language}
                    type="button"
                    size="sm"
                    variant={activeLanguage === language ? "default" : "ghost"}
                    className="flex-1 sm:flex-none rounded-full"
                    disabled={isPending}
                    onClick={() => setActiveLanguage(language)}
                  >
                    {languageLabels[language]}
                  </Button>
                ))}
              </div>
            </div>

            <Controller
              control={control}
              name="defaultLanguage"
              render={({ field }) => (
                <div className="flex flex-col gap-2 md:w-64 min-w-0">
                  <Label>Default public language</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={isPending}>
                      <Button
                        type="button"
                        variant="outline"
                        className="justify-between bg-input/35 rounded-2xl w-full"
                      >
                        {languageLabels[field.value ?? "en"]}
                        <span className="text-muted-foreground">Change</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuRadioGroup
                        value={field.value ?? "en"}
                        onValueChange={field.onChange}
                      >
                        {(["en", "id"] as const).map((language) => (
                          <DropdownMenuRadioItem
                            key={language}
                            value={language}
                          >
                            {languageLabels[language]}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex justify-between items-center gap-3">
              <Label htmlFor={introName}>
                About Intro ({languageLabels[activeLanguage]})
              </Label>
              <span className="text-muted-foreground text-xs">
                {introLength}/{introLimit}
              </span>
            </div>
            <Textarea
              id={introName}
              className="max-w-full min-h-36 field-sizing-fixed scrollbar-none wrap-anywhere"
              disabled={isPending}
              wrap="soft"
              placeholder="Introduction shown only on the About page."
              aria-invalid={!!errors[introName]}
              {...register(introName)}
            />
            {errors[introName]?.message && (
              <p className="text-destructive text-sm">
                {errors[introName]?.message}
              </p>
            )}
          </div>

          <div className="gap-5 grid xl:grid-cols-2 min-w-0">
            <div className="flex flex-col gap-2 min-w-0">
              <Label>How I Work ({languageLabels[activeLanguage]})</Label>
              <Controller
                control={control}
                name={howIWorkName}
                render={({ field }) => (
                  <MdxEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors[howIWorkName]?.message}
                  />
                )}
              />
              <p className="text-muted-foreground text-xs text-right">
                {howIWorkLength}/{mdxLimit}
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <Label>What I Value ({languageLabels[activeLanguage]})</Label>
              <Controller
                control={control}
                name={whatIValueName}
                render={({ field }) => (
                  <MdxEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isPending}
                    error={errors[whatIValueName]?.message}
                  />
                )}
              />
              <p className="text-muted-foreground text-xs text-right">
                {whatIValueLength}/{mdxLimit}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          className="rounded-2xl w-full sm:w-fit"
          disabled={isPending}
        >
          {isPending ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <FloppyDiskIcon data-icon="inline-start" />
          )}
          {isPending ? "Saving..." : "Save Content"}
        </Button>
      </div>
    </form>
  );
}
