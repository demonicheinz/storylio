import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const socialProviders =
  process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {};

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),

  // Blokir semua pembuatan user baru via auth flow.
  // Seed via Prisma langsung tidak melewati hook ini, jadi owner tetap bisa di-seed.
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
    },
    account: {
      create: {
        before: async (account) => {
          if (
            account.providerId === "github" &&
            process.env.OWNER_GITHUB_ID &&
            account.accountId !== process.env.OWNER_GITHUB_ID
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
      sendChangeEmailConfirmation: async ({ user, newEmail, url, token }) => {
        await sendEmail({
          to: newEmail,
          subject: "Confirm your new email — Storylio",
          html: `
            <h2>Confirm your email change</h2>
            <p>Hi ${user.name ?? "there"},</p>
            <p>You requested to change your Storylio login email to this address.</p>
            <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Confirm Email Change</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p style="color:#888;font-size:12px;">This link expires in 1 hour.</p>
          `,
        });
      },
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email — Storylio",
        html: `
          <h2>Verify your email</h2>
          <p>Hi ${user.name ?? "there"},</p>
          <p>Click the button below to verify your email address.</p>
          <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Verify Email</a></p>
          <p>If you didn't create a Storylio account, you can safely ignore this email.</p>
          <p style="color:#888;font-size:12px;">This link expires in 1 hour.</p>
        `,
      });
    },
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["github"],
      allowDifferentEmails: true,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [passkey()],
});
