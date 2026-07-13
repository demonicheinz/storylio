"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleNotchIcon,
  EyeIcon,
  EyeSlashIcon,
  FingerprintIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInForm({
  githubEnabled = false,
}: {
  githubEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const getRedirectUrl = () => {
    return searchParams.get("callbackUrl") || "/dashboard";
  };

  useEffect(() => {
    const initConditionalUI = async () => {
      try {
        const { data, error } = await authClient.signIn.passkey({
          autoFill: true,
        });
        if (!error) {
          router.push(getRedirectUrl());
          router.refresh();
        }
      } catch {
        // AutoFill failed or was aborted, silently ignore
      }
    };
    initConditionalUI();
  }, [router, searchParams]);

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    const redirectTo = getRedirectUrl();

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: redirectTo,
    });

    if (error) {
      setError("Invalid email or password");
      setIsLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true);
    setError(null);
    const redirectTo = getRedirectUrl();

    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: redirectTo,
      });
    } catch (err: any) {
      setError(err.message || "GitHub sign-in failed");
      setIsGitHubLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setIsPasskeyLoading(true);
    setError(null);
    const redirectTo = getRedirectUrl();

    try {
      const { error } = await authClient.signIn.passkey();

      if (error) {
        setError(error.message || "Failed to sign in with passkey");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Passkey sign-in cancelled or failed");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const anyLoading = isLoading || isGitHubLoading || isPasskeyLoading;

  return (
    <Card className="bg-card border w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-heading text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
              disabled={anyLoading}
              autoComplete="username webauthn"
            />
            {errors.email && (
              <p className="text-destructive text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                {...register("password")}
                className={
                  errors.password ? "border-destructive pr-10" : "pr-10"
                }
                disabled={anyLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="top-1/2 right-3 absolute text-muted-foreground hover:text-foreground -translate-y-1/2"
                disabled={anyLoading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-sm">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={anyLoading}>
            {isLoading ? (
              <>
                <CircleNotchIcon className="mr-2 w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {githubEnabled && (
          <>
            <div className="flex items-center gap-3 my-4">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">or</span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={anyLoading}
              onClick={handleGitHubSignIn}
            >
              {isGitHubLoading ? (
                <CircleNotchIcon className="mr-2 w-4 h-4 animate-spin" />
              ) : (
                <GithubLogoIcon className="mr-2 w-4 h-4" weight="bold" />
              )}
              {isGitHubLoading ? "Redirecting..." : "Continue with GitHub"}
            </Button>
          </>
        )}

        <div className={githubEnabled ? "mt-3" : "mt-4 flex flex-col"}>
          {!githubEnabled && (
            <div className="flex items-center gap-3 my-4">
              <Separator className="flex-1" />
              <span className="text-muted-foreground text-xs">or</span>
              <Separator className="flex-1" />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={anyLoading}
            onClick={handlePasskeySignIn}
          >
            {isPasskeyLoading ? (
              <CircleNotchIcon className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <FingerprintIcon className="mr-2 w-4 h-4" />
            )}
            Sign in with Passkey
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
