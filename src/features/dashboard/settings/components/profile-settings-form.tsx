"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  FingerprintIcon,
  FloppyDiskIcon,
  GithubLogoIcon,
  KeyIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { authClient } from "@/lib/auth-client";

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

function ProfileSettingsForm({
  profile,
}: Pick<SettingsManagerProps, "profile">) {
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
            <p className="text-xs text-muted-foreground">
              Short bio is used on the Home Hero. About intro is managed from
              the dedicated About dashboard page.
            </p>
            {errors.bio?.message && (
              <p className="text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Profile photo</Label>
            <ImageUpload
              value={image}
              disabled={isPending}
              cropAspect={1}
              cropShape="round"
              cropLabel="Crop profile avatar"
              previewClassName="mx-auto max-w-52 rounded-full"
              priority={true}
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

          <Separator />

          <div className="flex flex-col gap-2">
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://heinz.id"
              aria-invalid={!!errors.websiteUrl}
              disabled={isPending}
              {...register("websiteUrl")}
            />
            {errors.websiteUrl?.message && (
              <p className="text-sm text-destructive">
                {errors.websiteUrl.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="publicEmail">Public contact email</Label>
            <Input
              id="publicEmail"
              type="email"
              placeholder="hello@heinz.id"
              aria-invalid={!!errors.publicEmail}
              disabled={isPending}
              {...register("publicEmail")}
            />
            <p className="text-xs text-muted-foreground">
              Public contact email is shown publicly if used by the site. This
              is separate from your login email.
            </p>
            {errors.publicEmail?.message && (
              <p className="text-sm text-destructive">
                {errors.publicEmail.message}
              </p>
            )}
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

      <form className="flex max-w-xl flex-col gap-4" onSubmit={onSubmit}>
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
    <div className="flex flex-col gap-4">
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
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        <ProfileSettingsForm profile={profile} />
      </TabsContent>

      <TabsContent value="account" className="mt-4 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Your login email is used for authentication. Changing it requires
              verification via the new address.
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
