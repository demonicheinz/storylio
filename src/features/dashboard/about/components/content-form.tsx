"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FloppyDiskIcon, SpinnerIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { actionUpdateAboutContent } from "@/features/dashboard/about/actions";
import {
  type AboutContentActionInput,
  type AboutContentActionValues,
  aboutContentActionSchema,
} from "@/features/dashboard/about/validations";

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
  const [isPending, startTransition] = useTransition();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<AboutContentActionInput, unknown, AboutContentActionValues>({
    resolver: zodResolver(aboutContentActionSchema),
    defaultValues: getDefaults(content),
  });

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

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile and Home Hero</CardTitle>
          <CardDescription>
            Display name, tagline, short bio, avatar, and social links remain in
            the Profile tab. Short bio is used on the Home Hero. About intro is
            used only on the About page.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About Content</CardTitle>
          <CardDescription>
            Manage the bilingual introduction and the two About-specific MDX
            sections. Empty fields fall back to the other language or static
            content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!content && (
            <div className="mb-6 rounded-lg border border-dashed border-border/60 bg-background/30 p-4">
              <p className="font-medium text-foreground">
                About content has not been created yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The public About page currently uses its static fallback. Your
                first save will create the singleton CMS record.
              </p>
            </div>
          )}
          <form className="flex flex-col gap-6" onSubmit={onSubmit}>
            <Controller
              control={control}
              name="defaultLanguage"
              render={({ field }) => (
                <div className="flex flex-col gap-2">
                  <Label>Default public language</Label>
                  <div className="flex w-fit rounded-full border border-border/50 bg-background/40 p-1">
                    {(["en", "id"] as const).map((language) => (
                      <Button
                        key={language}
                        type="button"
                        size="sm"
                        variant={field.value === language ? "default" : "ghost"}
                        className="rounded-full"
                        disabled={isPending}
                        onClick={() => field.onChange(language)}
                      >
                        {languageLabels[language]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            />

            <Tabs defaultValue="en">
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="id">Indonesia</TabsTrigger>
              </TabsList>

              {(["en", "id"] as const).map((language) => {
                const introName = language === "en" ? "introEn" : "introId";
                const howIWorkName =
                  language === "en" ? "howIWorkEn" : "howIWorkId";
                const whatIValueName =
                  language === "en" ? "whatIValueEn" : "whatIValueId";

                return (
                  <TabsContent
                    key={language}
                    value={language}
                    className="mt-5 flex flex-col gap-6"
                  >
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={introName}>
                        About intro ({languageLabels[language]})
                      </Label>
                      <Textarea
                        id={introName}
                        className="min-h-36"
                        disabled={isPending}
                        placeholder="Introduction shown only on the About page."
                        aria-invalid={!!errors[introName]}
                        {...register(introName)}
                      />
                      {errors[introName]?.message && (
                        <p className="text-sm text-destructive">
                          {errors[introName]?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>How I Work ({languageLabels[language]})</Label>
                      <p className="text-sm text-muted-foreground">
                        About-specific MDX section, managed separately from What
                        I Value.
                      </p>
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
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label>What I Value ({languageLabels[language]})</Label>
                      <p className="text-sm text-muted-foreground">
                        About-specific MDX section, managed separately from How
                        I Work.
                      </p>
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
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>

            <Button type="submit" className="w-fit" disabled={isPending}>
              {isPending ? (
                <SpinnerIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <FloppyDiskIcon data-icon="inline-start" />
              )}
              {isPending ? "Saving..." : "Save About Content"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
