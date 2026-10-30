"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowSquareOutIcon,
  FloppyDiskIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { actionUpdateAboutContent } from "@/features/dashboard/about/actions";
import {
  type AboutContentActionInput,
  type AboutContentActionValues,
  aboutContentActionSchema,
} from "@/features/dashboard/about/validations";
import { DashboardSelect } from "@/features/dashboard/shared/components/filter-controls";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { useAboutDraftGuard } from "./use-about-draft-guard";

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
        className="min-h-48 font-mono text-sm"
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

const introLimit = 1200;
const mdxLimit = 20_000;
const languageFields = {
  en: ["introEn", "howIWorkEn", "whatIValueEn"],
  id: ["introId", "howIWorkId", "whatIValueId"],
} as const;
const fieldLabels = {
  introEn: "Intro",
  introId: "Intro",
  howIWorkEn: "How I Work",
  howIWorkId: "How I Work",
  whatIValueEn: "What I Value",
  whatIValueId: "What I Value",
};

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
  const [saved, setSaved] = useState(false);
  const {
    control,
    clearErrors,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<AboutContentActionInput, unknown, AboutContentActionValues>({
    resolver: zodResolver(aboutContentActionSchema),
    defaultValues: getDefaults(content),
  });
  const watchedValues = watch();
  useAboutDraftGuard(isDirty);

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

  const onSubmit = handleSubmit(
    (values) => {
      startTransition(async () => {
        try {
          const result = await actionUpdateAboutContent(values);

          if (result.success) {
            toast.add({
              title: result.message ?? "About content updated.",
              type: "success",
            });
            reset(values);
            setSaved(true);
            router.refresh();
            return;
          }

          applyFieldErrors(result.fieldErrors);
          toast.add({ title: result.error, type: "error" });
        } catch {
          toast.add({
            title:
              "Could not save About. Your changes are still here; try again.",
            type: "error",
          });
        }
      });
    },
    (invalid) => {
      const language = (["en", "id"] as const).find((lang) =>
        languageFields[lang].some((field) => invalid[field]),
      );
      if (language) setActiveLanguage(language);
    },
  );

  const introName = activeLanguage === "en" ? "introEn" : "introId";
  const howIWorkName = activeLanguage === "en" ? "howIWorkEn" : "howIWorkId";
  const whatIValueName =
    activeLanguage === "en" ? "whatIValueEn" : "whatIValueId";
  const introLength = (watchedValues[introName] ?? "").length;
  const howIWorkLength = (watchedValues[howIWorkName] ?? "").length;
  const whatIValueLength = (watchedValues[whatIValueName] ?? "").length;

  return (
    <form className="flex flex-col gap-5 min-w-0" onSubmit={onSubmit}>
      <p className="text-muted-foreground text-sm leading-6">
        Edit your About narrative here. Name, avatar, bio, and social links live
        in{" "}
        <Link
          href="/dashboard/settings"
          className="text-link underline underline-offset-4"
        >
          Profile Settings <ArrowSquareOutIcon className="inline size-3" />
        </Link>
        .
      </p>

      <Card className={dashboardStyles.surface}>
        <CardContent className="flex flex-col gap-6 p-5 sm:p-6">
          {!content && (
            <div className="text-muted-foreground text-sm">
              <p className="font-medium text-foreground">
                About content has not been created yet.
              </p>
              <p className="text-muted-foreground text-sm leading-6">
                The public page uses its default content until you save your own
                narrative.
              </p>
            </div>
          )}

          <Tabs
            value={activeLanguage}
            onValueChange={(value) => setActiveLanguage(value as Language)}
            className="gap-6"
          >
            <div className="flex md:flex-row flex-col md:justify-between md:items-start gap-3">
              <div className="flex flex-col items-start gap-1.5 min-w-0">
                <span
                  id="about-editing-language"
                  className="text-muted-foreground text-xs"
                >
                  Editing language
                </span>
                <TabsList
                  aria-labelledby="about-editing-language"
                  className="[&>button]:px-2 [&>button]:min-h-11"
                >
                  {(["en", "id"] as const).map((language) => (
                    <TabsTrigger
                      key={language}
                      value={language}
                      disabled={isPending}
                    >
                      {languageLabels[language]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <Controller
                control={control}
                name="defaultLanguage"
                render={({ field }) => (
                  <fieldset disabled={isPending} className="md:w-64 min-w-0">
                    <DashboardSelect
                      label="Default public language"
                      triggerClassName="min-h-13!"
                      value={field.value ?? "en"}
                      options={[
                        { value: "en", label: "English" },
                        { value: "id", label: "Indonesia" },
                      ]}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    />
                    {errors.defaultLanguage?.message && (
                      <p role="alert" className="text-destructive text-sm">
                        {errors.defaultLanguage.message}
                      </p>
                    )}
                  </fieldset>
                )}
              />
            </div>

            <div
              className="gap-3 grid sm:grid-cols-2"
              aria-label="Translation completeness"
            >
              {(["en", "id"] as const).map((language) => {
                const fields = languageFields[language];
                const filled = fields.filter((field) =>
                  watchedValues[field]?.trim(),
                ).length;
                const invalid = fields.filter((field) => errors[field]);
                return (
                  <div key={language} className="text-sm">
                    <p className="font-medium">
                      {languageLabels[language]}: {filled}/3 fields filled
                    </p>

                    {invalid.length > 0 && (
                      <ul
                        className="mt-2 text-destructive text-sm"
                        aria-live="polite"
                      >
                        {invalid.map((field) => (
                          <li key={field}>
                            <button
                              type="button"
                              className="text-left underline underline-offset-4"
                              onClick={() => setActiveLanguage(language)}
                            >
                              {fieldLabels[field]} needs attention
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-muted-foreground text-xs">
              Fields are optional. An empty translation uses the other language
              when available. To paste a Markdown document, switch the editor to
              Source mode first.
            </p>
            <TabsContent
              key={activeLanguage}
              value={activeLanguage}
              className="flex flex-col gap-5"
            >
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
                  <span
                    id={`${howIWorkName}-label`}
                    className="font-medium text-sm leading-none"
                  >
                    How I Work ({languageLabels[activeLanguage]})
                  </span>
                  <Controller
                    control={control}
                    name={howIWorkName}
                    render={({ field }) => (
                      <MdxEditor
                        variant="compact"
                        id={field.name}
                        ariaLabelledBy={`${field.name}-label`}
                        ariaLabel={`${fieldLabels[field.name as keyof typeof fieldLabels]} (${languageLabels[activeLanguage]})`}
                        placeholder="Write this section..."
                        value={field.value ?? ""}
                        onChange={(markdown) => {
                          field.onChange(markdown);
                          clearErrors(field.name);
                        }}
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
                  <span
                    id={`${whatIValueName}-label`}
                    className="font-medium text-sm leading-none"
                  >
                    What I Value ({languageLabels[activeLanguage]})
                  </span>
                  <Controller
                    control={control}
                    name={whatIValueName}
                    render={({ field }) => (
                      <MdxEditor
                        variant="compact"
                        id={field.name}
                        ariaLabelledBy={`${field.name}-label`}
                        ariaLabel={`${fieldLabels[field.name as keyof typeof fieldLabels]} (${languageLabels[activeLanguage]})`}
                        placeholder="Write this section..."
                        value={field.value ?? ""}
                        onChange={(markdown) => {
                          field.onChange(markdown);
                          clearErrors(field.name);
                        }}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="bottom-0 z-10 sticky flex flex-wrap justify-between items-center gap-3 bg-background py-3 border-border border-t">
        <p role="status" className="text-muted-foreground text-xs">
          {isPending
            ? "Saving both languages..."
            : isDirty
              ? "Unsaved changes - saves both languages"
              : saved
                ? "All changes saved"
                : "Save applies to both languages"}
        </p>
        <div className="sm:flex gap-2 grid grid-cols-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isPending}
            onClick={async () => {
              if (await confirmAction("Discard unsaved About content?"))
                reset();
            }}
          >
            Discard changes
          </Button>
          <Button
            type="submit"
            className="sm:w-fit min-w-0"
            disabled={isPending || !isDirty}
          >
            {isPending ? (
              <SpinnerIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <FloppyDiskIcon data-icon="inline-start" />
            )}
            {isPending ? "Saving..." : "Save Content"}
          </Button>
        </div>
      </div>
    </form>
  );
}
