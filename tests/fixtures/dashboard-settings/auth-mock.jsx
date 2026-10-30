import { useSyncExternalStore } from "react";

const listeners = new Set();
let version = 0;
const notify = () => {
  version++;
  for (const listener of listeners) listener();
};
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const stamp = "2026-10-30T00:00:00Z";
const state = {
  session: {
    user: { id: "owner", email: "owner@example.test", twoFactorEnabled: false },
  },
  keys: [
    {
      id: "key",
      name: "Example laptop with a long descriptive label",
      createdAt: new Date(stamp),
    },
  ],
  sessions: [
    {
      id: "current",
      isCurrent: true,
      userAgent: "Example desktop browser",
      ipAddress: "192.0.2.1",
      createdAt: stamp,
      updatedAt: stamp,
      expiresAt: "2026-11-01T12:00:00Z",
    },
    {
      id: "other",
      isCurrent: false,
      userAgent:
        "AnUnusuallyLongUnbrokenBrowserUserAgentStringToExerciseResponsiveWrappingAndEnsureThatTheIdentityRemainsReadable",
      ipAddress: "2001:db8:1234:5678:90ab:cdef:1234:5678",
      createdAt: stamp,
      updatedAt: stamp,
      expiresAt: "2026-11-01T12:00:00Z",
    },
  ],
  calls: [],
  fail: null,
  hold: null,
  authError: false,
  keyError: false,
  sessionError: false,
  throwSessions: false,
};
window.settingsFixture = state;
window.settingsNotify = notify;
const before = async (name, args) => {
  state.calls.push({ name, args });
  if (state.hold === name)
    await new Promise((resolve) => (state.release = resolve));
  if (state.fail === `${name}:throw`) throw Error("Fixture transport failure");
  return state.fail === name
    ? { data: null, error: { message: "Fixture operation cancelled" } }
    : null;
};
const refreshSession = async () =>
  state.authError
    ? { data: null, error: { message: "Fixture session unavailable" } }
    : { data: state.session, error: null };
const refreshKeys = async () =>
  state.keyError
    ? { data: null, error: { message: "Fixture keys unavailable" } }
    : { data: state.keys, error: null };
export const authClient = {
  useSession: () => {
    useSyncExternalStore(
      subscribe,
      () => version,
      () => 0,
    );
    return {
      data: state.authError ? null : state.session,
      error: state.authError
        ? { message: "Fixture session unavailable" }
        : null,
      isPending: false,
      isRefetching: false,
      refetch: refreshSession,
    };
  },
  useListPasskeys: () => {
    useSyncExternalStore(
      subscribe,
      () => version,
      () => 0,
    );
    return {
      data: state.keyError ? undefined : state.keys,
      error: state.keyError ? { message: "Fixture keys unavailable" } : null,
      isPending: false,
      refetch: refreshKeys,
    };
  },
  passkey: {
    addPasskey: async (args) => {
      const error = await before("addPasskey", args);
      if (error) return error;
      state.keys = [
        ...state.keys,
        { id: "new-key", name: args.name, createdAt: new Date(stamp) },
      ];
      notify();
      return { data: { id: "new-key" }, error: null };
    },
    updatePasskey: async (args) => {
      const error = await before("updatePasskey", args);
      if (error) return error;
      state.keys = state.keys.map((key) =>
        key.id === args.id ? { ...key, name: args.name } : key,
      );
      notify();
      return { data: { status: true }, error: null };
    },
    deletePasskey: async (args) => {
      const error = await before("deletePasskey", args);
      if (error) return error;
      state.keys = state.keys.filter((key) => key.id !== args.id);
      notify();
      return { data: { status: true }, error: null };
    },
  },
  twoFactor: {
    verifyBackupCode: async (args) =>
      (await before("verifyBackupCode", args)) ?? {
        data: { status: true },
        error: null,
      },
    enable: async (args) =>
      (await before("enable", args)) ?? {
        data: {
          method: "totp",
          totpURI:
            "otpauth://totp/Storylio:fixture?secret=JBSWY3DPEHPK3PXP&issuer=Storylio",
          backupCodes: ["fixture-code-1", "fixture-code-2"],
        },
        error: null,
      },
    verifyTotp: async (args) => {
      const error = await before("verifyTotp", args);
      if (error) return error;
      state.session = {
        user: { ...state.session.user, twoFactorEnabled: true },
      };
      state.sessions = state.sessions.filter((row) => row.isCurrent);
      notify();
      return { data: { status: true }, error: null };
    },
    generateBackupCodes: async (args) =>
      (await before("generateBackupCodes", args)) ?? {
        data: { backupCodes: ["replacement-code-1", "replacement-code-2"] },
        error: null,
      },
    disable: async (args) => {
      const error = await before("disable", args);
      if (error) return error;
      state.session = {
        user: { ...state.session.user, twoFactorEnabled: false },
      };
      notify();
      return { data: { status: true }, error: null };
    },
  },
  unlinkAccount: async (args) =>
    (await before("unlink", args)) ?? { data: { status: true }, error: null },
  linkSocial: async (args) =>
    (await before("link", args)) ?? {
      data: { url: "/fixture-github" },
      error: null,
    },
};

export const actionListDashboardSessions = async () => {
  await before("sessions");
  if (state.throwSessions) throw Error("Fixture session transport error");
  return state.sessionError
    ? { success: false, error: "Fixture sessions unavailable." }
    : { success: true, data: structuredClone(state.sessions) };
};
export const actionRevokeDashboardSession = async (id) => {
  await before("revoke", id);
  state.sessions = state.sessions.filter((row) => row.id !== id);
  return { success: true };
};
export const actionRevokeOtherDashboardSessions = async () => {
  const failure = await before("revokeOthers");
  if (failure) return { success: false, error: failure.error.message };
  state.sessions = state.sessions.filter((row) => row.isCurrent);
  return { success: true };
};
export const actionUpdateProfileSettings = async (values) => {
  const error = await before("profile", values);
  return error
    ? { success: false, error: error.error.message }
    : {
        success: true,
        data: { ...values, id: "owner", email: "owner@example.test" },
        message: "Profile settings updated.",
      };
};
export const actionChangeEmail = async (values) => {
  const error = await before("email", values);
  return error
    ? { success: false, error: error.error.message }
    : {
        success: true,
        message: "Check your current email to approve the change.",
      };
};
export const actionChangePassword = async (values) => {
  const error = await before("password", values);
  return error
    ? { success: false, error: error.error.message }
    : {
        success: true,
        message: "Password changed. Other sessions have been signed out.",
      };
};
