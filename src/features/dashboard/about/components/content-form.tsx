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

  const onSubmit = handleSubmit(
    (values) => {
      startTransition(async () => {
        const result = await actionUpdateAboutContent(values);

        if (result.success) {
          toast.add({
            title: result.message ?? "About content updated.",
            type: "success",
          });
          router.refresh();
          return;
        }

        applyFieldErrors(result.fieldErrors);
        toast.add({ title: result.error, type: "error" });
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
      <Card>
        <CardContent className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 px-4">
          <div className="flex gap-3 min-w-0">
            <div className="flex justify-center items-center size-9 text-muted-foreground shrink-0">
              <InfoIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">Profile content lives in Settings</p>
              <p className="text-muted-foreground text-sm leading-5">
                Display name, tagline, avatar, short bio, and social links are
                managed from Profile Settings. This tab only controls the public
                About page narrative.
              </p>
            </div>
          </div>
          <Button
            role="link"
            render={<Link href="/dashboard/settings" />}
            nativeButton={false}
            variant="outline"
            className="w-full sm:w-auto shrink-0"
          >
            Go to Profile Settings
            <ArrowSquareOutIcon data-icon="inline-end" />
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

          <Tabs
            value={activeLanguage}
            onValueChange={(value) => setActiveLanguage(value as Language)}
            className="gap-6"
          >
            <div className="flex md:flex-row flex-col md:justify-between md:items-end gap-3">
              <div className="min-w-0">
                <Label>Editing language</Label>
                <TabsList aria-label="Editing language">
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
                    <p className="text-muted-foreground text-xs">
                      Empty fields are optional; public language fallback still
                      applies.
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
                              {fieldLabels[field]}: {errors[field]?.message}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-fit" disabled={isPending}>
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
