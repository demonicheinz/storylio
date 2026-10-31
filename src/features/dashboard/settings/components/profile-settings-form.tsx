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
  SpinnerIcon,
  UserCircleIcon,
  XLogoIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  type ComponentType,
  useCallback,
  useRef,
  useState,
  useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { ProfileAvatar } from "@/components/common/profile-avatar";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  actionChangeEmail,
  actionChangePassword,
  actionUpdateProfileSettings,
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
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { useUnsavedChangesGuard } from "@/features/dashboard/shared/hooks/use-unsaved-changes-guard";
import type { ActionResult } from "@/lib/action-result";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { PasskeySettings } from "./passkey-settings";
import { SessionSettings } from "./session-settings";
import styles from "./settings.module.css";
import { TwoFactorSettings } from "./two-factor-settings";
import { useSettingsRail } from "./use-settings-rail";

type LinkedAccount = {
  id: string;
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

function ProfileAvatarUpload({
  image,
  name,
  disabled,
  uploading,
  onChange,
  onUploadingChange,
}: {
  image?: string;
  name?: string | null;
  disabled?: boolean;
  uploading: boolean;
  onChange: (url?: string) => void;
  onUploadingChange: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.avatarEditor}>
      <ProfileAvatar src={image} name={name} size={96} />
      <div className={styles.avatarActions}>
        <Dialog
          open={open}
          onOpenChange={(value) => {
            if (!uploading) setOpen(value);
          }}
        >
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                disabled={disabled || uploading}
              />
            }
          >
            Change photo
          </DialogTrigger>
          <DialogContent showCloseButton={!uploading}>
            <DialogHeader>
              <DialogTitle>Change profile photo</DialogTitle>
              <DialogDescription>
                Choose an image up to 2MB. Crop it before upload, then save your
                profile to apply it.
              </DialogDescription>
            </DialogHeader>
            <ImageUpload
              disabled={disabled}
              cropAspect={1}
              cropShape="round"
              cropLabel="Crop profile avatar"
              maxSizeBytes={2 * 1024 * 1024}
              maxSizeLabel="2MB"
              onUploadingChange={onUploadingChange}
              onChange={(url) => {
                onChange(url);
                setOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
        {image && (
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || uploading}
            onClick={() => onChange(undefined)}
          >
            Remove photo
          </Button>
        )}
      </div>
      <p className={styles.avatarHelp} role="status">
        {uploading
          ? "Uploading photo… Save is available when the upload finishes."
          : "JPG, PNG, WebP or GIF. Without a photo, your profile uses Live Orb."}
      </p>
    </div>
  );
}

async function requestSettings<T>(
  request: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await request();
  } catch {
    return {
      success: false,
      error: "Could not complete the request. Try again.",
    };
  }
}

function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-destructive text-sm">
      {message}
    </p>
  );
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
      <Icon className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
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

  if (password.length < 8 || score <= 2) {
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
      className: "bg-warning",
      textClassName: "text-warning",
    };
  }

  return {
    label: "Strong",
    score,
    className: "bg-success",
    textClassName: "text-success",
  };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div
      className="gap-2 grid"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            className={cn(
              "flex-1 bg-muted rounded-full h-1.5 transition-colors",
              level <= strength.score && strength.className,
            )}
          />
        ))}
      </div>
      <p className={cn("font-medium text-xs", strength.textClassName)}>
        Password strength: {strength.label.toLowerCase()}
      </p>
    </div>
  );
}

function ProfileSettingsForm({
  profile,
}: Pick<SettingsManagerProps, "profile">) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const uploadRef = useRef(false);
  const saveRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    formState: { errors, isDirty },
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

  useUnsavedChangesGuard(isDirty || uploading, "profile settings");
  const uploadingChanged = useCallback((value: boolean) => {
    uploadRef.current = value;
    setUploading(value);
  }, []);
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
    if (uploadRef.current || saveRef.current) return;
    saveRef.current = true;
    setSubmitError(null);
    startTransition(async () => {
      const result = await requestSettings(() =>
        actionUpdateProfileSettings(values),
      );
      saveRef.current = false;

      if (result.success) {
        toast.add({
          title: result.message ?? "Profile settings updated.",
          type: "success",
        });
        window.dispatchEvent(
          new CustomEvent("dashboard-user-updated", {
            detail: {
              name: result.data?.name ?? values.name,
              email: result.data?.email ?? profile.email,
              avatar: result.data?.image ?? values.image ?? "",
            },
          }),
        );
        reset({
          ...values,
          image: values.image ?? "",
          github: values.github ?? "",
          instagram: values.instagram ?? "",
          twitter: values.twitter ?? "",
          websiteUrl: values.websiteUrl ?? "",
          publicEmail: values.publicEmail ?? "",
        });
        setSaved(true);
        router.refresh();
      } else {
        setSubmitError(result.error);
        applyFieldErrors(result.fieldErrors);
        toast.add({ title: result.error, type: "error" });
      }
    });
  });

  return (
    <form className={styles.profileForm} onSubmit={onSubmit}>
      <section
        className={styles.groupRow}
        aria-labelledby="profile-photo-heading"
      >
        <div className={styles.groupIntro}>
          <h2 id="profile-photo-heading">Profile photo</h2>
          <p>Your public avatar across Storylio.</p>
        </div>
        <div className={styles.groupFields}>
          <ProfileAvatarUpload
            uploading={uploading}
            onUploadingChange={uploadingChanged}
            image={image}
            name={displayName}
            disabled={isPending || uploading}
            onChange={(url) =>
              setValue("image", url, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
          <FieldError id="image-error" message={errors.image?.message} />
        </div>
      </section>
      <section
        className={styles.groupRow}
        aria-labelledby="profile-identity-heading"
      >
        <div className={styles.groupIntro}>
          <h2 id="profile-identity-heading">Public profile</h2>
          <p>The name and role shown with your work.</p>
        </div>
        <div className={styles.groupFields}>
          <div className={styles.identityFields}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                Display name{" "}
                <span className="text-muted-foreground">(required)</span>
              </Label>
              <Input
                id="name"
                maxLength={120}
                placeholder="Ahmad Haizul Amany"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                disabled={isPending || uploading}
                {...register("name")}
              />
              <FieldError id="name-error" message={errors.name?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                maxLength={160}
                placeholder="Full Stack Developer"
                aria-invalid={!!errors.tagline}
                aria-describedby={errors.tagline ? "tagline-error" : undefined}
                disabled={isPending || uploading}
                {...register("tagline")}
              />
              <FieldError
                id="tagline-error"
                message={errors.tagline?.message}
              />
            </div>
          </div>
        </div>
      </section>
      <section
        className={styles.groupRow}
        aria-labelledby="profile-bio-heading"
      >
        <div className={styles.groupIntro}>
          <h2 id="profile-bio-heading">Bio</h2>
          <p>The introduction below your Home headline.</p>
        </div>
        <div className={styles.groupFields}>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-3">
              <Label htmlFor="bio">Bio / hero subheadline</Label>
              <span className="tabular-nums text-muted-foreground text-xs">
                {(watch("bio") ?? "").length}/500
              </span>
            </div>
            <Textarea
              id="bio"
              maxLength={500}
              placeholder="Short profile summary for public pages."
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? "bio-help bio-error" : "bio-help"}
              disabled={isPending || uploading}
              className="min-h-32"
              {...register("bio")}
            />
            <p id="bio-help" className="text-muted-foreground text-xs">
              This bio supplies the Home hero subheadline and public profile.
            </p>
            <FieldError id="bio-error" message={errors.bio?.message} />
          </div>
        </div>
      </section>
      <section
        className={styles.groupRow}
        aria-labelledby="profile-social-heading"
      >
        <div className={styles.groupIntro}>
          <h2 id="profile-social-heading">Social profiles</h2>
          <p>Help visitors find you elsewhere.</p>
        </div>
        <div className={styles.groupFields}>
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col gap-2">
              <Label htmlFor="github">GitHub</Label>
              <IconInput
                id="github"
                icon={GithubLogoIcon}
                type="url"
                placeholder="https://github.com/..."
                aria-invalid={!!errors.github}
                aria-describedby={errors.github ? "github-error" : undefined}
                disabled={isPending || uploading}
                {...register("github")}
              />
              <FieldError id="github-error" message={errors.github?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="instagram">Instagram</Label>
              <IconInput
                id="instagram"
                icon={InstagramLogoIcon}
                type="url"
                placeholder="https://instagram.com/..."
                aria-invalid={!!errors.instagram}
                aria-describedby={
                  errors.instagram ? "instagram-error" : undefined
                }
                disabled={isPending || uploading}
                {...register("instagram")}
              />
              <FieldError
                id="instagram-error"
                message={errors.instagram?.message}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="twitter">X/Twitter</Label>
              <IconInput
                id="twitter"
                icon={XLogoIcon}
                type="url"
                placeholder="https://x.com/..."
                aria-invalid={!!errors.twitter}
                aria-describedby={errors.twitter ? "twitter-error" : undefined}
                disabled={isPending || uploading}
                {...register("twitter")}
              />
              <FieldError
                id="twitter-error"
                message={errors.twitter?.message}
              />
            </div>
          </div>
        </div>
      </section>
      <section
        className={styles.groupRow}
        aria-labelledby="profile-contact-heading"
      >
        <div className={styles.groupIntro}>
          <h2 id="profile-contact-heading">Contact</h2>
          <p>Your website and public contact address.</p>
        </div>
        <div className={styles.groupFields}>
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-col gap-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <IconInput
                id="websiteUrl"
                icon={LinkSimpleIcon}
                type="url"
                placeholder="https://heinz.id"
                aria-invalid={!!errors.websiteUrl}
                aria-describedby={
                  errors.websiteUrl ? "websiteUrl-error" : undefined
                }
                disabled={isPending || uploading}
                {...register("websiteUrl")}
              />
              <FieldError
                id="websiteUrl-error"
                message={errors.websiteUrl?.message}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="publicEmail">Public Contact Email</Label>
              <IconInput
                id="publicEmail"
                icon={EnvelopeSimpleIcon}
                type="email"
                placeholder="hello@heinz.id"
                aria-invalid={!!errors.publicEmail}
                aria-describedby={
                  errors.publicEmail ? "publicEmail-error" : undefined
                }
                disabled={isPending || uploading}
                {...register("publicEmail")}
              />
              <p className="text-muted-foreground text-xs">
                This email will be visible publicly.
              </p>
              <FieldError
                id="publicEmail-error"
                message={errors.publicEmail?.message}
              />
            </div>
          </div>
        </div>
      </section>

      {submitError && (
        <p role="alert" className="text-destructive text-sm">
          {submitError}
        </p>
      )}
      <div className={styles.saveBar}>
        <p role="status" className="mr-auto text-muted-foreground text-sm">
          {uploading
            ? "Uploading photo…"
            : isDirty
              ? "Unsaved profile changes"
              : saved
                ? "Profile saved"
                : "No unsaved profile changes"}
        </p>
        <div className={styles.saveActions}>
          <Button type="submit" disabled={isPending || uploading || !isDirty}>
            {isPending ? (
              <SpinnerIcon
                data-icon="inline-start"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <FloppyDiskIcon data-icon="inline-start" />
            )}
            {isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || uploading || !isDirty}
            onClick={() => {
              reset();
              setSubmitError(null);
              setSaved(false);
            }}
          >
            <ArrowCounterClockwiseIcon data-icon="inline-start" />
            Discard changes
          </Button>
        </div>
      </div>
    </form>
  );
}

function ChangeEmailForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
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
    setFeedback(null);
    startTransition(async () => {
      const result = await requestSettings(() => actionChangeEmail(values));

      if (result.success) {
        setFeedback({ error: false, text: result.message ?? "Changes saved." });
        toast.add({
          title:
            result.message ?? "Check your current email to approve the change.",
          type: "success",
        });
        reset();
        router.refresh();
      } else {
        setFeedback({ error: true, text: result.error });
        if (result.fieldErrors?.newEmail?.[0]) {
          setError("newEmail", {
            message: result.fieldErrors.newEmail[0],
            type: "server",
          });
        }
        toast.add({ title: result.error, type: "error" });
      }
    });
  });

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {feedback && (
          <p
            role={feedback.error ? "alert" : "status"}
            className={feedback.error ? "text-destructive text-sm" : "text-sm"}
          >
            {feedback.text}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="newEmail">New email address</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="new@example.com"
            aria-invalid={!!errors.newEmail}
            aria-describedby={errors.newEmail ? "newEmail-error" : undefined}
            disabled={isPending}
            {...register("newEmail")}
          />
          <p className="text-muted-foreground text-xs">
            Approve the change from your current email, then verify the new
            address. Both addresses must be authorized for this owner account.
          </p>
          {errors.newEmail?.message && (
            <p id="newEmail-error" className="text-destructive text-sm">
              {errors.newEmail.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-fit" disabled={isPending}>
          {isPending ? (
            <SpinnerIcon
              data-icon="inline-start"
              className="animate-spin motion-reduce:animate-none"
            />
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
  const [feedback, setFeedback] = useState<{
    error: boolean;
    text: string;
  } | null>(null);
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
    setFeedback(null);
    startTransition(async () => {
      const result = await requestSettings(() => actionChangePassword(values));

      if (result.success) {
        setFeedback({ error: false, text: result.message ?? "Changes saved." });
        toast.add({
          title: result.message ?? "Password changed.",
          type: "success",
        });
        reset();
      } else {
        setFeedback({ error: true, text: result.error });
        applyFieldErrors(result.fieldErrors);
        toast.add({ title: result.error, type: "error" });
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
        {feedback && (
          <p
            role={feedback.error ? "alert" : "status"}
            className={feedback.error ? "text-destructive text-sm" : "text-sm"}
          >
            {feedback.text}
          </p>
        )}
        <p className="text-muted-foreground text-sm leading-6">
          Changing your password signs out other sessions. This browser stays
          signed in.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={getPasswordType("currentPassword")}
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              aria-describedby={
                errors.currentPassword ? "currentPassword-error" : undefined
              }
              disabled={isPending}
              className="pr-11"
              {...register("currentPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="top-1/2 right-1 absolute -translate-y-1/2"
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
            <p id="currentPassword-error" className="text-destructive text-sm">
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
              aria-describedby={
                errors.newPassword ? "newPassword-error" : undefined
              }
              disabled={isPending}
              className="pr-11"
              {...register("newPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="top-1/2 right-1 absolute -translate-y-1/2"
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
            <p id="newPassword-error" className="text-destructive text-sm">
              {errors.newPassword.message}
            </p>
          )}
          {isSameAsCurrent && (
            <p className="text-destructive text-sm">
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
              aria-describedby={
                errors.confirmPassword ? "confirmPassword-error" : undefined
              }
              disabled={isPending}
              className="pr-11"
              {...register("confirmPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="top-1/2 right-1 absolute -translate-y-1/2"
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
            <p id="confirmPassword-error" className="text-destructive text-sm">
              {errors.confirmPassword.message}
            </p>
          )}
          {hasConfirmMismatch && (
            <p className="text-destructive text-sm">Passwords do not match.</p>
          )}
        </div>

        <Button type="submit" className="w-fit" disabled={isPending}>
          {isPending ? (
            <SpinnerIcon
              data-icon="inline-start"
              className="animate-spin motion-reduce:animate-none"
            />
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
  onUnlinked,
  mfaEnabled,
  authUnavailable,
}: {
  linkedAccounts: LinkedAccount[];
  onUnlinked: (id: string) => void;
  mfaEnabled: boolean;
  authUnavailable: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const providers = linkedAccounts.filter((a) => a.providerId !== "credential");
  const hasGithub = providers.some((a) => a.providerId === "github");

  return (
    <div className="flex flex-col gap-3">
      {authUnavailable ? (
        <p role="status" className="text-muted-foreground text-sm">
          Sign-in method availability is being checked. Try again when account
          security is available.
        </p>
      ) : (
        mfaEnabled && (
          <p className="text-muted-foreground text-sm">
            GitHub sign-in is unavailable while two-factor authentication is
            enabled. Stored connections can still be managed.
          </p>
        )
      )}
      {connectionError && (
        <p role="alert" className="text-destructive text-sm">
          {connectionError}
        </p>
      )}

      {providers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No external providers connected.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {providers.map((account) => (
            <div
              key={`${account.providerId}-${account.accountId}`}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              {account.providerId === "github" && (
                <GithubLogoIcon className="size-5" weight="duotone" />
              )}
              <div className="flex flex-col flex-1">
                <span className="font-medium text-sm capitalize">
                  {account.providerId}
                </span>
                <span className="text-muted-foreground text-xs">
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
                disabled={isPending}
                onClick={() => {
                  setConnectionError(null);
                  startTransition(async () => {
                    try {
                      const { error } = await authClient.unlinkAccount({
                        accountId: account.id,
                      });
                      if (error) throw new Error(error.message);
                      onUnlinked(account.id);
                      toast.add({
                        title: `${account.providerId} unlinked successfully.`,
                        type: "success",
                      });
                    } catch {
                      setConnectionError(
                        "Could not unlink the account. Try again.",
                      );
                      toast.add({
                        title: `Failed to unlink ${account.providerId}.`,
                        type: "error",
                      });
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

      {!hasGithub && !mfaEnabled && !authUnavailable && (
        <Button
          variant="outline"
          className="mt-2 w-fit"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              try {
                const result = await authClient.linkSocial({
                  provider: "github",
                  callbackURL: "/dashboard/settings",
                });
                if (result.error)
                  throw new Error("Could not start GitHub linking.");
              } catch {
                setConnectionError(
                  "Could not start GitHub linking. Try again.",
                );
                toast.add({
                  title: "Failed to initiate GitHub linking.",
                  type: "error",
                });
              }
            });
          }}
        >
          {isPending ? (
            <SpinnerIcon
              data-icon="inline-start"
              className="animate-spin motion-reduce:animate-none"
            />
          ) : (
            <GithubLogoIcon data-icon="inline-start" />
          )}
          Link GitHub Account
        </Button>
      )}
    </div>
  );
}

function SecuritySummary({
  sessions,
  mfaOverride,
}: {
  sessions: string;
  mfaOverride: boolean | null;
}) {
  const { data: session, isPending, error } = authClient.useSession();
  const {
    data: passkeys,
    isPending: loadingPasskeys,
    error: passkeyError,
  } = authClient.useListPasskeys();
  return (
    <DashboardSummary
      items={[
        {
          label: "Two-factor authentication",
          value:
            mfaOverride !== null
              ? mfaOverride
                ? "Enabled"
                : "Not enabled"
              : isPending
                ? "Loading…"
                : error || !session
                  ? "Unavailable"
                  : session.user.twoFactorEnabled
                    ? "Enabled"
                    : "Not enabled",
        },
        {
          label: "Passkeys",
          value: loadingPasskeys
            ? "Loading…"
            : passkeyError || !passkeys
              ? "Unavailable"
              : passkeys.length,
        },
        { label: "Active sessions", value: sessions },
      ]}
    />
  );
}

export function SettingsManager({
  profile,
  linkedAccounts,
}: SettingsManagerProps) {
  const [sessionSummary, setSessionSummary] = useState("Loading…");
  // Account panels unmount; successful removals must outlive stale server props.
  const [unlinkedAccountIds, setUnlinkedAccountIds] = useState<string[]>([]);
  const onAccountUnlinked = useCallback((id: string) => {
    setUnlinkedAccountIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }, []);
  const { frame, rail } = useSettingsRail();
  const [tab, setTab] = useState("profile");
  const [securityVersion, setSecurityVersion] = useState(0);
  const [mfaOverride, setMfaOverride] = useState<boolean | null>(null);
  const securityFlow = useRef({ dirty: false, pending: false });
  const {
    data: securitySession,
    isPending: securityLoading,
    error: securityError,
  } = authClient.useSession();
  const onFlowStateChange = useCallback(
    (state: { dirty: boolean; pending: boolean }) => {
      securityFlow.current = state;
    },
    [],
  );
  const onSecurityChange = useCallback((enabled: boolean) => {
    setMfaOverride(enabled);
    setSecurityVersion((value) => value + 1);
  }, []);
  const changeTab = async (next: unknown) => {
    if (typeof next !== "string" || next === tab) return;
    if (tab === "security" && securityFlow.current.pending) {
      toast.add({
        title: "Wait for the security request to finish.",
        type: "error",
      });
      return;
    }
    if (
      tab === "security" &&
      securityFlow.current.dirty &&
      !(await confirmAction(
        "Leave Security? Incomplete setup or unsaved backup codes will be cleared from this view. This does not undo changes already made to your account.",
        {
          title: "Leave Security?",
          confirmLabel: "Leave Security",
          cancelLabel: "Cancel",
        },
      ))
    )
      return;
    if (securityFlow.current.pending) return;
    securityFlow.current = { dirty: false, pending: false };
    setTab(next);
  };
  return (
    <div ref={frame} className={styles.settingsFrame}>
      <Tabs
        value={tab}
        orientation={rail ? "vertical" : "horizontal"}
        onValueChange={changeTab}
        className={cn("gap-6 min-w-0", styles.settings)}
      >
        <TabsList
          aria-label="Settings section"
          className={styles.settingsNav}
          data-lenis-prevent="true"
        >
          <TabsTrigger value="profile" className="px-3 min-h-11">
            <UserCircleIcon data-icon="inline-start" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="px-3 min-h-11">
            <GearSixIcon data-icon="inline-start" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="px-3 min-h-11">
            <LockKeyIcon data-icon="inline-start" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" keepMounted className={styles.panel}>
          <ProfileSettingsForm profile={profile} />
        </TabsContent>

        <TabsContent
          value="account"
          className={cn(styles.panel, "flex flex-col gap-5")}
        >
          <div className="gap-5 grid min-w-0">
            <Card className={styles.accountRow}>
              <CardHeader>
                <CardTitle>
                  <h2>Sign-in email</h2>
                </CardTitle>
                <CardDescription>
                  Your login email is used for authentication. Changing it
                  requires approval from your current address, then verification
                  of the new address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={styles.activeEmail}>
                  <EnvelopeSimpleIcon
                    className="size-5 text-muted-foreground shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-muted-foreground text-xs">
                      Current sign-in email
                    </p>
                    <p className="mt-1 font-medium text-sm wrap-anywhere">
                      {profile.email}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Used to access your dashboard. Separate from your public
                      contact email.
                    </p>
                  </div>
                </div>
                <details className={styles.accountDisclosure}>
                  <summary>Change email</summary>
                  <div className="pt-5">
                    <ChangeEmailForm />
                  </div>
                </details>
              </CardContent>
            </Card>

            <Card className={styles.accountRow}>
              <CardHeader>
                <CardTitle>
                  <h2>Password</h2>
                </CardTitle>
                <CardDescription>
                  Change the dashboard password using the existing session.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <details className={styles.accountDisclosure}>
                  <summary>Change password</summary>
                  <div className="pt-5">
                    <AccountSettingsForm />
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>

          <Card className={styles.accountRow}>
            <CardHeader>
              <CardTitle>
                <h2>Connected accounts</h2>
              </CardTitle>
              <CardDescription>
                External login providers linked to your owner account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectedProviders
                linkedAccounts={linkedAccounts.filter(
                  (account) => !unlinkedAccountIds.includes(account.id),
                )}
                onUnlinked={onAccountUnlinked}
                mfaEnabled={
                  mfaOverride ?? securitySession?.user.twoFactorEnabled === true
                }
                authUnavailable={
                  mfaOverride === null &&
                  (securityLoading || !!securityError || !securitySession)
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="security"
          className={cn(styles.panel, "flex flex-col gap-5")}
        >
          <SecuritySummary
            sessions={sessionSummary}
            mfaOverride={mfaOverride}
          />
          <div className={styles.securityGrid}>
            <TwoFactorSettings
              onFlowStateChange={onFlowStateChange}
              onSecurityChange={onSecurityChange}
            />
            <PasskeySettings
              mfaEnabled={
                mfaOverride ?? securitySession?.user.twoFactorEnabled === true
              }
              authUnavailable={
                mfaOverride === null &&
                (securityLoading || !!securityError || !securitySession)
              }
            />
            <SessionSettings
              onSummaryChange={setSessionSummary}
              refreshKey={securityVersion}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
