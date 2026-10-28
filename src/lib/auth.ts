import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { twoFactor } from "better-auth/plugins/two-factor";
import { and, eq, ne } from "drizzle-orm";
import { after } from "next/server";
import { authEmail } from "@/lib/auth-email";
import {
  getAuthAllowedHosts,
  getAuthProtocol,
  isAllowedGitHubAccount,
} from "@/lib/auth-policy";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { isOwnerEmail } from "@/lib/owner-guard";

const productionAuthUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

const socialProviders =
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET &&
  process.env.OWNER_GITHUB_ID
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          mapProfileToUser: (profile: { id: number | string }) => {
            if (
              !isAllowedGitHubAccount(
                String(profile.id),
                process.env.OWNER_GITHUB_ID,
              )
            ) {
              throw new APIError("FORBIDDEN", {
                message: "This GitHub account is not authorized.",
              });
            }
            return {};
          },
        },
      }
    : {};

export const auth = betterAuth({
  baseURL: {
    allowedHosts: getAuthAllowedHosts(productionAuthUrl, process.env),
    fallback: productionAuthUrl,
    protocol: getAuthProtocol(productionAuthUrl, process.env),
  },
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: true }),
  advanced: {
    backgroundTasks: {
      handler: (promise) =>
        after(
          promise.catch(() => {
            console.error("An authentication background task failed.");
          }),
        ),
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/change-email" &&
        (typeof ctx.body?.newEmail !== "string" ||
          !isOwnerEmail(ctx.body.newEmail))
      ) {
        throw new APIError("FORBIDDEN", {
          message: "This email is not authorized for dashboard access.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/two-factor/verify-totp" &&
        ctx.context.session?.user.twoFactorEnabled === false
      ) {
        const current = ctx.context.newSession;
        if (current?.user.twoFactorEnabled) {
          await db
            .delete(schema.session)
            .where(
              and(
                eq(schema.session.userId, current.user.id),
                ne(schema.session.token, current.session.token),
              ),
            );
        }
      }
    }),
  },

  // Blokir semua pembuatan user baru via auth flow.
  // Seed database langsung tidak melewati hook ini, jadi owner tetap bisa di-seed.
  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => {
          if (
            ctx &&
            (ctx.path?.startsWith("/callback/") ||
              ctx.path === "/sign-in/social" ||
              ctx.path === "/passkey/verify-authentication")
          ) {
            const owner = await db.query.user.findFirst({
              columns: { twoFactorEnabled: true },
              where: eq(schema.user.id, session.userId),
            });
            if (owner?.twoFactorEnabled)
              throw new APIError("FORBIDDEN", {
                code: "MFA_PASSWORD_REQUIRED",
                message:
                  "Use your password and authenticator or backup code when two-factor authentication is enabled.",
              });
          }
        },
      },
    },
    user: {
      create: {
        before: async () => {
          throw new APIError("FORBIDDEN", {
            message:
              "Web registration is fully disabled. Use CLI to seed owner.",
          });
        },
      },
      update: {
        before: async (data) => {
          if (data.email && !isOwnerEmail(data.email)) {
            throw new APIError("FORBIDDEN", {
              message: "This email is not authorized for dashboard access.",
            });
          }
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          if (
            account.providerId === "github" &&
            !isAllowedGitHubAccount(
              account.accountId,
              process.env.OWNER_GITHUB_ID,
            )
          ) {
            throw new APIError("FORBIDDEN", {
              message: "This GitHub account is not authorized.",
            });
          }
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      if (!isOwnerEmail(user.email)) return;
      await sendEmail(
        authEmail({
          to: user.email,
          name: user.name,
          url,
          passwordReset: true,
        }),
      );
    },
  },
  socialProviders,
  user: {
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        if (!isOwnerEmail(newEmail))
          throw new APIError("FORBIDDEN", {
            message: "This email is not authorized for dashboard access.",
          });
        await sendEmail(
          authEmail({ to: user.email, name: user.name, newEmail, url }),
        );
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (!isOwnerEmail(user.email))
        throw new APIError("FORBIDDEN", {
          message: "This email is not authorized for dashboard access.",
        });
      await sendEmail(authEmail({ to: user.email, name: user.name, url }));
    },
    sendOnSignUp: false,
    autoSignInAfterVerification: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
      // Different GitHub emails are allowed only for the explicitly pinned owner.
      allowDifferentEmails: Boolean(process.env.OWNER_GITHUB_ID),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/social": { window: 60, max: 10 },
      "/passkey/generate-authenticate-options": { window: 60, max: 20 },
      "/passkey/verify-authentication": { window: 60, max: 10 },
      "/change-email": { window: 60, max: 3 },
      "/change-password": { window: 60, max: 5 },
      "/send-verification-email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/reset-password": { window: 60, max: 5 },
      "/two-factor/*": { window: 60, max: 10 },
    },
  },
  plugins: [
    passkey(),
    twoFactor({
      issuer: "Storylio",
      trustDeviceMaxAge: 0,
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 10,
        durationSeconds: 900,
      },
      twoFactorCookieMaxAge: 600,
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: "encrypted",
      },
    }),
  ],
});
