import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { authEmail } from "@/lib/auth-email";
import { getAuthAllowedHosts, isAllowedGitHubAccount } from "@/lib/auth-policy";
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
    protocol: process.env.NODE_ENV === "development" ? "auto" : "https",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
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
  },

  // Blokir semua pembuatan user baru via auth flow.
  // Seed database langsung tidak melewati hook ini, jadi owner tetap bisa di-seed.
  databaseHooks: {
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
    autoSignInAfterVerification: true,
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
    },
  },
  plugins: [passkey()],
});
