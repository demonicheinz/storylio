"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowCounterClockwiseIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  FloppyDiskIcon,
  GearSixIcon,
  GithubLogoIcon,
  InstagramLogoIcon,
  KeyIcon,
  LinkSimpleIcon,
  LockKeyIcon,
  MonitorIcon,
  SpinnerIcon,
  UploadSimpleIcon,
  UserCircleIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { type ComponentType, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  actionChangeEmail,
  actionChangePassword,
  actionListDashboardSessions,
  actionRevokeOtherDashboardSessions,
  actionUpdateProfileSettings,
  type DashboardSessionItem,
} from "@/features/dashboard/settings/actions";
import {
  type AccountPasswordActionInput,
  accountPasswordActionSchema,
  type ChangeEmailActionInput,
  changeEmailActionSchema,
  type ProfileSettingsActionInput,
  type ProfileSettingsActionValues,
  profileSettingsActionSchema,
} from "@/features/dashboard/settings/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type LinkedAccount = {
  providerId: string;
  accountId: string;
  createdAt: Date;
};

type SettingsManagerProps = {
  profile: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    tagline: string | null;
    bio: string | null;
    github: string | null;
    instagram: string | null;
    twitter: string | null;
    websiteUrl: string | null;
    publicEmail: string | null;
  };
  linkedAccounts: LinkedAccount[];
};

const emptyProfileDefaults: ProfileSettingsActionValues = {
  name: "",
  image: undefined,
  tagline: "",
  bio: "",
  github: undefined,
  instagram: undefined,
  twitter: undefined,
  websiteUrl: undefined,
  publicEmail: undefined,
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
    websiteUrl: profile.websiteUrl ?? undefined,
    publicEmail: profile.publicEmail ?? undefined,
  };
}

function getInitials(name?: string | null) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "AH"
  );
}

function ProfileAvatarUpload({
  image,
  name,
  disabled,
  onChange,
}: {
  image?: string;
  name?: string | null;
  disabled?: boolean;
  onChange: (url?: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="relative">
        <Avatar className="size-30 border border-border/70 bg-background/60 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <AvatarImage src={image} alt={name || "Profile avatar"} />
          <AvatarFallback className="font-heading text-4xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute right-1 bottom-1 z-10 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-card">
          <UploadSimpleIcon className="size-5" />
        </span>
        <ImageUpload
          value={undefined}
          disabled={disabled}
          cropAspect={1}
          cropShape="round"
          cropLabel="Crop profile avatar"
          className="absolute inset-0 z-20 opacity-0"
          maxSizeBytes={2 * 1024 * 1024}
          maxSizeLabel="2MB"
          onChange={(url) => onChange(url)}
        />
      </div>
      <p className="max-w-48 text-xs leading-5 text-muted-foreground">
        JPG, PNG, WebP or GIF. Max size 2MB.
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function IconInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  );
}

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      label: "Weak",
      score: 0,
      className: "bg-muted",
      textClassName: "text-muted-foreground",
    };
  }

  if (score <= 2) {
    return {
      label: "Weak",
      score,
      className: "bg-destructive",
      textClassName: "text-destructive",
    };
  }

  if (score <= 4) {
    return {
      label: "Good",
      score,
      className: "bg-amber-400",
      textClassName: "text-amber-300",
    };
  }

  return {
    label: "Strong",
    score,
    className: "bg-emerald-400",
    textClassName: "text-emerald-300",
  };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted transition-colors",
              index < strength.score && strength.className,
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", strength.textClassName)}>
        {strength.label}
      </p>
    </div>
  );
}

function ProfileSettingsForm({
  profile,
}: Pick<SettingsManagerProps, "profile">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
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
  const displayName = watch("name");

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
        window.dispatchEvent(
          new CustomEvent("dashboard-user-updated", {
            detail: {
              name: result.data?.name ?? values.name,
              email: result.data?.email ?? profile.email,
              avatar: result.data?.image ?? values.image ?? "",
            },
          }),
        );
        router.refresh();
      } else {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error);
      }
    });
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit}>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your public profile information shown across Storylio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)]">
            <ProfileAvatarUpload
              image={image}
              name={displayName}
              disabled={isPending}
              onChange={(url) =>
                setValue("image", url, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />

            <div className="grid min-w-0 gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="Ahmad Haizul Amany"
                    aria-invalid={!!errors.name}
                    disabled={isPending}
                    {...register("name")}
                  />
                  <FieldError message={errors.name?.message} />
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
                  <FieldError message={errors.tagline?.message} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Short profile summary for public pages."
                  aria-invalid={!!errors.bio}
                  disabled={isPending}
                  className="min-h-32"
                  {...register("bio")}
                />
                <p className="text-xs text-muted-foreground">
                  This bio is used on the Home Hero and About dashboard page.
                </p>
                <FieldError message={errors.bio?.message} />
              </div>

              <FieldError message={errors.image?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>
            Add your social and professional links.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="github">GitHub</Label>
              <IconInput
                id="github"
                icon={GithubLogoIcon}
                type="url"
                placeholder="https://github.com/..."
                aria-invalid={!!errors.github}
                disabled={isPending}
                {...register("github")}
              />
              <FieldError message={errors.github?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="instagram">Instagram</Label>
              <IconInput
                id="instagram"
                icon={InstagramLogoIcon}
                type="url"
                placeholder="https://instagram.com/..."
                aria-invalid={!!errors.instagram}
                disabled={isPending}
                {...register("instagram")}
              />
              <FieldError message={errors.instagram?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="twitter">X/Twitter</Label>
              <IconInput
                id="twitter"
                icon={XLogoIcon}
                type="url"
                placeholder="https://x.com/..."
                aria-invalid={!!errors.twitter}
                disabled={isPending}
                {...register("twitter")}
              />
              <FieldError message={errors.twitter?.message} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <IconInput
                id="websiteUrl"
                icon={LinkSimpleIcon}
                type="url"
                placeholder="https://heinz.id"
                aria-invalid={!!errors.websiteUrl}
                disabled={isPending}
                {...register("websiteUrl")}
              />
              <FieldError message={errors.websiteUrl?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="publicEmail">Public Contact Email</Label>
              <IconInput
                id="publicEmail"
                icon={EnvelopeSimpleIcon}
                type="email"
                placeholder="hello@heinz.id"
                aria-invalid={!!errors.publicEmail}
                disabled={isPending}
                {...register("publicEmail")}
              />
              <p className="text-xs text-muted-foreground">
                This email will be visible publicly.
              </p>
              <FieldError message={errors.publicEmail?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <FloppyDiskIcon data-icon="inline-start" />
          )}
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => reset(getProfileDefaults(profile))}
        >
          <ArrowCounterClockwiseIcon data-icon="inline-start" />
          Reset
        </Button>
      </div>
    </form>
  );
}

function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ChangeEmailActionInput>({
    resolver: zodResolver(changeEmailActionSchema),
    defaultValues: { newEmail: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await actionChangeEmail(values);

      if (result.success) {
        toast.success(
          result.message ?? "Check your new email for confirmation.",
        );
        reset();
        router.refresh();
      } else {
        if (result.fieldErrors?.newEmail?.[0]) {
          setError("newEmail", {
            message: result.fieldErrors.newEmail[0],
            type: "server",
          });
        }
        toast.error(result.error);
      }
    });
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label className="text-muted-foreground">Current login email</Label>
        <p className="text-sm font-medium">{currentEmail}</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newEmail">New email address</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="new@example.com"
            aria-invalid={!!errors.newEmail}
            disabled={isPending}
            {...register("newEmail")}
          />
          <p className="text-xs text-muted-foreground">
            Changing your login email requires verification. A confirmation link
            will be sent to the new email address.
          </p>
          {errors.newEmail?.message && (
            <p className="text-sm text-destructive">
              {errors.newEmail.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-fit" disabled={isPending}>
          {isPending ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <EnvelopeSimpleIcon data-icon="inline-start" />
          )}
          {isPending ? "Sending..." : "Change Email"}
        </Button>
      </form>
    </div>
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
    watch,
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
  const currentPassword = watch("currentPassword");
  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");
  const isSameAsCurrent =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;
  const hasConfirmMismatch =
    confirmPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword !== newPassword;

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
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
          {isSameAsCurrent && (
            <p className="text-sm text-destructive">
              New password must be different from current password.
            </p>
          )}
          <PasswordStrengthMeter password={newPassword} />
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
          {hasConfirmMismatch && (
            <p className="text-sm text-destructive">Passwords do not match.</p>
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
    </div>
  );
}

function ConnectedProviders({
  linkedAccounts,
}: {
  linkedAccounts: LinkedAccount[];
}) {
  const [isPending, startTransition] = useTransition();
  const providers = linkedAccounts.filter((a) => a.providerId !== "credential");
  const hasGithub = providers.some((a) => a.providerId === "github");

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label className="text-base">Connected providers</Label>
        <p className="text-xs text-muted-foreground">
          External login providers linked to your account.
        </p>
      </div>

      {providers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No external providers connected.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {providers.map((account) => (
            <div
              key={`${account.providerId}-${account.accountId}`}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {account.providerId === "github" && (
                <GithubLogoIcon className="size-5" weight="duotone" />
              )}
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium capitalize">
                  {account.providerId}
                </span>
                <span className="text-xs text-muted-foreground">
                  Connected{" "}
                  {new Date(account.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    try {
                      await authClient.unlinkAccount({
                        providerId: account.providerId,
                      });
                      toast.success(
                        `${account.providerId} unlinked successfully. Please refresh the page.`,
                      );
                    } catch {
                      toast.error(`Failed to unlink ${account.providerId}.`);
                    }
                  });
                }}
              >
                Unlink
              </Button>
            </div>
          ))}
        </div>
      )}

      {!hasGithub && (
        <Button
          variant="outline"
          className="mt-2 w-fit"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                await authClient.linkSocial({
                  provider: "github",
                  callbackURL: "/dashboard/settings",
                });
              } catch {
                toast.error("Failed to initiate GitHub linking.");
              }
            });
          }}
        >
          {isPending ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <GithubLogoIcon data-icon="inline-start" />
          )}
          Link GitHub Account
        </Button>
      )}
    </div>
  );
}

function PasskeySettings() {
  const { data: passkeys, isPending: isLoading } = authClient.useListPasskeys();
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SpinnerIcon className="animate-spin" />
          Loading passkeys...
        </div>
      ) : passkeys && passkeys.length > 0 ? (
        <div className="flex flex-col gap-2">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <KeyIcon className="size-5 text-muted-foreground" />
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-medium">
                  {passkey.name || "Unnamed Passkey"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Added on{" "}
                  {new Date(passkey.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <EditPasskeyDialog passkey={passkey} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isDeleting === passkey.id || isAdding}
                  onClick={async () => {
                    setIsDeleting(passkey.id);
                    try {
                      await authClient.passkey.deletePasskey({
                        id: passkey.id,
                      });
                      toast.success("Passkey deleted successfully.");
                    } catch {
                      toast.error("Failed to delete passkey.");
                    } finally {
                      setIsDeleting(null);
                    }
                  }}
                >
                  {isDeleting === passkey.id ? (
                    <SpinnerIcon className="animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No passkeys registered yet.
        </p>
      )}

      <AddPasskeyDialog isAdding={isAdding} setIsAdding={setIsAdding} />
    </div>
  );
}

function SessionSettings() {
  const [sessions, setSessions] = useState<DashboardSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, startRevokeTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    actionListDashboardSessions().then((result) => {
      if (!isMounted) {
        return;
      }

      if (result.success) {
        setSessions(result.data ?? []);
      } else {
        toast.error(result.error);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const revokeAllSessions = () => {
    startRevokeTransition(async () => {
      const result = await actionRevokeOtherDashboardSessions();

      if (result.success) {
        toast.success(result.message ?? "Other sessions revoked.");
        setSessions((current) =>
          current.filter((session) => session.isCurrent),
        );
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label className="text-base">Active sessions</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Review every active dashboard session tied to this account.
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={
            isLoading ||
            isRevoking ||
            sessions.filter((session) => !session.isCurrent).length === 0
          }
          onClick={revokeAllSessions}
        >
          {isRevoking ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <LockKeyIcon data-icon="inline-start" />
          )}
          Revoke Other Sessions
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SpinnerIcon className="animate-spin" />
          Loading sessions...
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/35 p-4"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <MonitorIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {session.isCurrent
                      ? "Current session"
                      : "Dashboard session"}
                  </p>
                  <Badge variant={session.isCurrent ? "default" : "secondary"}>
                    {session.isCurrent ? "Current" : "Active"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {session.userAgent || "Unknown browser"}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="block text-foreground/80">
                      Last active
                    </span>
                    {new Date(session.updatedAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  <div>
                    <span className="block text-foreground/80">Expires</span>
                    {new Date(session.expiresAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  <div>
                    <span className="block text-foreground/80">Created</span>
                    {new Date(session.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                  <div>
                    <span className="block text-foreground/80">IP address</span>
                    {session.ipAddress || "Unknown"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No active sessions are available.
        </p>
      )}
    </div>
  );
}

function AddPasskeyDialog({
  isAdding,
  setIsAdding,
}: {
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await authClient.passkey.addPasskey({
        name: name.trim() || `Passkey ${new Date().toLocaleDateString()}`,
      });
      toast.success("Passkey added successfully.");
      setOpen(false);
      setName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add passkey.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-2 w-fit" disabled={isAdding}>
          {isAdding ? (
            <SpinnerIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <KeyIcon data-icon="inline-start" className="size-4" />
          )}
          Add Passkey
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleAdd}>
          <DialogHeader>
            <DialogTitle>Add New Passkey</DialogTitle>
            <DialogDescription>
              Give this passkey a name to help you identify it later (e.g.
              "YubiKey").
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="passkeyName">Passkey Name</Label>
            <Input
              id="passkeyName"
              placeholder="e.g. YubiKey"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAdding}>
              {isAdding && <SpinnerIcon className="mr-2 animate-spin" />}
              Save Passkey
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPasskeyDialog({ passkey }: { passkey: any }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(passkey.name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsUpdating(true);
    try {
      await authClient.passkey.updatePasskey({
        id: passkey.id,
        name: name.trim(),
      });
      toast.success("Passkey renamed successfully.");
      setOpen(false);
    } catch {
      toast.error("Failed to rename passkey.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setName(passkey.name || "")}
        >
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleUpdate}>
          <DialogHeader>
            <DialogTitle>Rename Passkey</DialogTitle>
            <DialogDescription>
              Change the name of your passkey to easily identify it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="editPasskeyName">Passkey Name</Label>
            <Input
              id="editPasskeyName"
              placeholder="e.g. Work Laptop"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !name.trim()}>
              {isUpdating && <SpinnerIcon className="mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsManager({
  profile,
  linkedAccounts,
}: SettingsManagerProps) {
  return (
    <Tabs
      defaultValue="profile"
      orientation="vertical"
      className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start"
    >
      <TabsList className="grid w-full grid-cols-3 rounded-3xl border border-border/70 bg-card/45 p-2 shadow-[0_18px_80px_rgba(0,0,0,0.16)] lg:sticky lg:top-24 lg:flex lg:grid-cols-none">
        <TabsTrigger
          value="profile"
          className="h-9 items-center justify-center! rounded-2xl px-2 text-xs sm:text-sm lg:h-11 lg:justify-start! lg:px-3 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
        >
          <UserCircleIcon data-icon="inline-start" />
          Profile
        </TabsTrigger>
        <TabsTrigger
          value="account"
          className="h-9 justify-center! rounded-2xl px-2 text-xs sm:text-sm lg:h-11 lg:justify-start! lg:px-3 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
        >
          <GearSixIcon data-icon="inline-start" />
          Account
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="h-9 justify-center! rounded-2xl px-2 text-xs sm:text-sm lg:h-11 lg:justify-start! lg:px-3 data-active:bg-primary data-active:text-primary-foreground dark:data-active:bg-primary dark:data-active:text-primary-foreground"
        >
          <LockKeyIcon data-icon="inline-start" />
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-0 min-w-0">
        <ProfileSettingsForm profile={profile} />
      </TabsContent>

      <TabsContent value="account" className="mt-0 flex min-w-0 flex-col gap-5">
        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
              <CardDescription>
                Your login email is used for authentication. Changing it
                requires verification via the new address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChangeEmailForm currentEmail={profile.email} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change the dashboard password using the existing session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountSettingsForm />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              External login providers linked to your owner account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectedProviders linkedAccounts={linkedAccounts} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent
        value="security"
        className="mt-0 flex min-w-0 flex-col gap-5"
      >
        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>
              Review the active dashboard session for this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>
              Use biometric or security keys for faster, secure sign-ins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasskeySettings />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
