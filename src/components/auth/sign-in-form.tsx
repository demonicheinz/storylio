"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleNotchIcon,
  EyeIcon,
  EyeSlashIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
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
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const getRedirectUrl = () => {
    const callbackUrl = searchParams.get("callbackUrl");
    return callbackUrl?.startsWith("/dashboard") ? callbackUrl : "/dashboard";
  };

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
      setError("Email atau password salah");
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

    await authClient.signIn.social({
      provider: "github",
      callbackURL: redirectTo,
    });
  };

  const anyLoading = isLoading || isGitHubLoading;

  return (
    <Card className="w-full max-w-md border bg-card">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-heading text-2xl">Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
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
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={anyLoading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={anyLoading}>
            {isLoading ? (
              <>
                <CircleNotchIcon className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {githubEnabled && (
          <>
            <div className="my-4 flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
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
                <CircleNotchIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GithubLogoIcon className="mr-2 h-4 w-4" weight="bold" />
              )}
              {isGitHubLoading ? "Redirecting..." : "Continue with GitHub"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
