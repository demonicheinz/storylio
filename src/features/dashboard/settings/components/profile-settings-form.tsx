"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeIcon,
  EyeSlashIcon,
  FloppyDiskIcon,
  KeyIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  actionChangePassword,
  actionUpdateProfileSettings,
} from "@/features/dashboard/settings/actions";
import {
  type AccountPasswordActionInput,
  accountPasswordActionSchema,
  type ProfileSettingsActionInput,
  type ProfileSettingsActionValues,
  profileSettingsActionSchema,
} from "@/features/dashboard/settings/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";

type SettingsManagerProps = {
  profile: {
    id: string;
    name: string | null;
    image: string | null;
    tagline: string | null;
    bio: string | null;
    github: string | null;
    instagram: string | null;
    twitter: string | null;
  };
};

const emptyProfileDefaults: ProfileSettingsActionValues = {
  name: "",
  image: undefined,
  tagline: "",
  bio: "",
  github: undefined,
  instagram: undefined,
  twitter: undefined,
};

function getProfileDefaults(
  profile: SettingsManagerProps["profile"],
): ProfileSettingsActionValues {
  return {
    name: profile.name ?? "",
    image: profile.image ?? undefined,
    tagline: profile.tagline ?? "",
    bio: profile.bio ?? "",
    github: profile.github ?? undefined,
    instagram: profile.instagram ?? undefined,
    twitter: profile.twitter ?? undefined,
  };
}

function ProfileSettingsForm({ profile }: SettingsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
    watch,
  } = useForm<ProfileSettingsActionInput, unknown, ProfileSettingsActionValues>(
    {
      resolver: zodResolver(profileSettingsActionSchema),
      defaultValues: profile
        ? getProfileDefaults(profile)
        : emptyProfileDefaults,
    },
  );

  const image = watch("image");

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages[0]) {
        setError(field as keyof ProfileSettingsActionValues, {
          message: messages[0],
          type: "server",
        });
      }
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await actionUpdateProfileSettings(values);

      if (result.success) {
        toast.success(result.message ?? "Profile settings updated.");
        router.refresh();
      } else {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update the owner profile used by database-backed public sections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex max-w-2xl flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              placeholder="Ahmad Haizul Amany"
              aria-invalid={!!errors.name}
              disabled={isPending}
              {...register("name")}
            />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              placeholder="Full Stack Developer"
              aria-invalid={!!errors.tagline}
              disabled={isPending}
              {...register("tagline")}
            />
            {errors.tagline?.message && (
              <p className="text-sm text-destructive">
                {errors.tagline.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea
              id="bio"
              placeholder="Short profile summary for public pages."
              aria-invalid={!!errors.bio}
              disabled={isPending}
              className="min-h-32"
              {...register("bio")}
            />
            {errors.bio?.message && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Profile photo</Label>
            <ImageUpload
              value={image}
              disabled={isPending}
              onChange={(url) =>
                setValue("image", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onRemove={() =>
                setValue("image", undefined, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            {errors.image?.message && (
              <p className="text-sm text-destructive">{errors.image.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/..."
                aria-invalid={!!errors.github}
                disabled={isPending}
                {...register("github")}
              />
              {errors.github?.message && (
                <p className="text-sm text-destructive">
                  {errors.github.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                type="url"
                placeholder="https://instagram.com/..."
                aria-invalid={!!errors.instagram}
                disabled={isPending}
                {...register("instagram")}
              />
              {errors.instagram?.message && (
                <p className="text-sm text-destructive">
                  {errors.instagram.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="twitter">X/Twitter</Label>
              <Input
                id="twitter"
                type="url"
                placeholder="https://x.com/..."
                aria-invalid={!!errors.twitter}
                disabled={isPending}
                {...register("twitter")}
              />
              {errors.twitter?.message && (
                <p className="text-sm text-destructive">
                  {errors.twitter.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-fit" disabled={isPending}>
            {isPending ? (
              <SpinnerIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <FloppyDiskIcon data-icon="inline-start" />
            )}
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AccountSettingsForm() {
  const [isPending, startTransition] = useTransition();
  const [visibleFields, setVisibleFields] = useState<
    Partial<Record<keyof AccountPasswordActionInput, boolean>>
  >({});
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<AccountPasswordActionInput>({
    resolver: zodResolver(accountPasswordActionSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const applyFieldErrors = (fieldErrors?: Record<string, string[]>) => {
    if (!fieldErrors) {
      return;
    }

    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages[0]) {
        setError(field as keyof AccountPasswordActionInput, {
          message: messages[0],
          type: "server",
        });
      }
    }
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await actionChangePassword(values);

      if (result.success) {
        toast.success(result.message ?? "Password changed.");
        reset();
      } else {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  const toggleVisibility = (field: keyof AccountPasswordActionInput) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const getPasswordType = (field: keyof AccountPasswordActionInput) =>
    visibleFields[field] ? "text" : "password";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Change the dashboard password using the existing BetterAuth session.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex max-w-xl flex-col gap-5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={getPasswordType("currentPassword")}
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword}
                disabled={isPending}
                className="pr-11"
                {...register("currentPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                onClick={() => toggleVisibility("currentPassword")}
                disabled={isPending}
                aria-label={
                  visibleFields.currentPassword
                    ? "Hide current password"
                    : "Show current password"
                }
              >
                {visibleFields.currentPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </div>
            {errors.currentPassword?.message && (
              <p className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={getPasswordType("newPassword")}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                disabled={isPending}
                className="pr-11"
                {...register("newPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                onClick={() => toggleVisibility("newPassword")}
                disabled={isPending}
                aria-label={
                  visibleFields.newPassword
                    ? "Hide new password"
                    : "Show new password"
                }
              >
                {visibleFields.newPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </div>
            {errors.newPassword?.message && (
              <p className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={getPasswordType("confirmPassword")}
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                disabled={isPending}
                className="pr-11"
                {...register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
                onClick={() => toggleVisibility("confirmPassword")}
                disabled={isPending}
                aria-label={
                  visibleFields.confirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {visibleFields.confirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
              </Button>
            </div>
            {errors.confirmPassword?.message && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-fit" disabled={isPending}>
            {isPending ? (
              <SpinnerIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <KeyIcon data-icon="inline-start" />
            )}
            {isPending ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function SettingsManager({ profile }: SettingsManagerProps) {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        <ProfileSettingsForm profile={profile} />
      </TabsContent>

      <TabsContent value="account" className="mt-4">
        <AccountSettingsForm />
      </TabsContent>
    </Tabs>
  );
}
