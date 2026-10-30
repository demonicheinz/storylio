import {
  Children,
  type ComponentProps,
  createElement,
  isValidElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OtpInput } from "@/components/common/otp-input";
import { TwoFactorSettings } from "@/features/dashboard/settings/components/two-factor-settings";

const hooks = vi.hoisted(() => ({
  active: false,
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  effects: [] as (() => unknown)[],
  cleanups: [] as (() => void)[],
  stateIndex: 0,
  refIndex: 0,
}));
const mocks = vi.hoisted(() => ({
  session: {
    data: { user: { twoFactorEnabled: false } } as unknown,
    error: null as unknown,
    isPending: false,
    isRefetching: false,
    refetch: vi.fn(),
  },
  enable: vi.fn(),
  verifyTotp: vi.fn(),
  disable: vi.fn(),
  generateBackupCodes: vi.fn(),
  guard: vi.fn(),
  flow: vi.fn(),
  changed: vi.fn(),
  confirm: vi.fn(),
}));
vi.mock("@/features/dashboard/shared/confirmation", () => ({
  confirmAction: async (message: string) => window.confirm(message),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: () => mocks.session, twoFactor: mocks },
}));
vi.mock("@/features/dashboard/shared/hooks/use-unsaved-changes-guard", () => ({
  useUnsavedChangesGuard: mocks.guard,
}));
// Use the repository's Node-only hook harness pattern to exercise async handlers.
vi.mock("react", async (original) => {
  const react = await original<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) => {
      if (!hooks.active) return react.useState(initial);
      const index = hooks.stateIndex++;
      if (!(index in hooks.states)) hooks.states[index] = initial;
      return [
        hooks.states[index],
        (next: unknown) => {
          hooks.states[index] =
            typeof next === "function" ? next(hooks.states[index]) : next;
        },
      ];
    },
    useRef: (initial: unknown) => {
      if (!hooks.active) return react.useRef(initial);
      const index = hooks.refIndex++;
      hooks.refs[index] ??= { current: initial };
      return hooks.refs[index];
    },
    useEffect: (effect: () => unknown) => {
      if (!hooks.active) return;
      hooks.effects.push(effect);
    },
  };
});

type Props = {
  children?: ReactNode;
  id?: string;
  type?: string;
  onClick?: () => unknown;
  onChange?: (event: { target: { value: string; checked: boolean } }) => void;
  onSubmit?: (event: { preventDefault: () => void }) => unknown;
  onPaste?: (event: {
    preventDefault: () => void;
    clipboardData: { getData: (format: string) => string };
  }) => void;
  disabled?: boolean;
};
function nodes(tree: ReactNode): Props[] {
  const found: Props[] = [];
  Children.forEach(tree, (node) => {
    if (
      isValidElement<ComponentProps<typeof OtpInput>>(node) &&
      node.type === OtpInput
    ) {
      const input = OtpInput(node.props);
      found.push({
        id: node.props.id,
        disabled: node.props.disabled,
        onChange: (event) => input.props.onChange(event.target.value),
        onPaste: (event) => {
          event.preventDefault();
          input.props.onChange(
            input.props.pasteTransformer(event.clipboardData.getData("text")),
          );
        },
      });
      return;
    }
    if (!isValidElement<Props>(node)) return;
    found.push(node.props, ...nodes(node.props.children));
  });
  return found;
}
function render() {
  hooks.stateIndex = hooks.refIndex = 0;
  hooks.effects = [];
  hooks.active = true;
  let tree: ReturnType<typeof TwoFactorSettings>;
  try {
    tree = TwoFactorSettings({
      onFlowStateChange: mocks.flow,
      onSecurityChange: mocks.changed,
    });
  } finally {
    hooks.active = false;
  }
  for (const effect of hooks.effects) {
    const cleanup = effect();
    if (typeof cleanup === "function")
      hooks.cleanups.push(cleanup as () => void);
  }
  return { html: renderToStaticMarkup(tree), nodes: nodes(tree) };
}
function button(label: string) {
  const match = render().nodes.find(
    (node) => node.onClick && node.children === label,
  );
  expect(match, label).toBeDefined();
  return match!;
}
function fill(id: string, value: string) {
  if (id === "mfa-password" && !render().nodes.some((node) => node.id === id)) {
    button(
      mocks.session.data &&
        (mocks.session.data as { user: { twoFactorEnabled: boolean } }).user
          .twoFactorEnabled
        ? "Manage two-factor"
        : "Set up authenticator",
    ).onClick?.();
  }
  render()
    .nodes.find((node) => node.id === id)
    ?.onChange?.({ target: { value, checked: true } });
}
async function submit() {
  render()
    .nodes.find((node) => node.onSubmit)
    ?.onSubmit?.({ preventDefault: vi.fn() });
  await settle();
}
async function settle() {
  for (let i = 0; i < 12; i++) await Promise.resolve();
}
const setup = {
  data: {
    method: "totp",
    totpURI: "otpauth://totp/fixture?secret=FIXTURE",
    backupCodes: ["fixture-backup"],
  },
  error: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  hooks.states = [];
  hooks.refs = [];
  hooks.cleanups = [];
  Object.assign(mocks.session, {
    data: { user: { twoFactorEnabled: false } },
    error: null,
    isPending: false,
    isRefetching: false,
  });
  mocks.session.refetch.mockReset().mockResolvedValue(undefined);
  mocks.enable.mockReset().mockResolvedValue(setup);
  mocks.verifyTotp.mockReset().mockResolvedValue({ data: {}, error: null });
  mocks.disable.mockReset().mockResolvedValue({ data: {}, error: null });
  mocks.generateBackupCodes
    .mockReset()
    .mockResolvedValue({ data: { backupCodes: ["replacement"] }, error: null });
  mocks.confirm.mockReturnValue(true);
  vi.stubGlobal("window", { confirm: mocks.confirm });
});

afterEach(() => vi.unstubAllGlobals());

describe("MFA settings", () => {
  it("discloses password confirmation only after an explicit action", () => {
    expect(render().html).toContain("Not enabled");
    expect(render().nodes.some((node) => node.id === "mfa-password")).toBe(
      false,
    );
    button("Set up authenticator").onClick?.();
    expect(render().html).toContain("Confirm your password");
    fill("mfa-password", "fixture-password");
    button("Cancel").onClick?.();
    expect(render().html).not.toContain("fixture-password");
    expect(mocks.enable).not.toHaveBeenCalled();
  });
  it("awaits clipboard success and provides a manual-key fallback on rejection", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    let copied!: () => void;
    const writeText = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          copied = resolve;
        }),
    );
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    button("Copy setup key").onClick?.();
    expect(writeText).toHaveBeenCalledExactlyOnceWith("FIXTURE");
    expect(render().html).not.toContain("Setup key copied");
    copied();
    await settle();
    expect(render().html).toContain("Setup key copied");
    writeText.mockRejectedValue(new Error("clipboard blocked"));
    button("Copy setup key").onClick?.();
    await settle();
    expect(render().html).toContain("Select and copy the setup key manually");
    expect(render().html).toContain("FIXTURE");
    expect(render().html).not.toContain("clipboard blocked");
    expect(mocks.verifyTotp).not.toHaveBeenCalled();
  });
  it("normalizes pasted OTP text and submits only a complete six-digit code", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    fill("mfa-code", "12a 34");
    await submit();
    expect(mocks.verifyTotp).not.toHaveBeenCalled();
    expect(render().html).toContain("Enter the six-digit code");
    const preventDefault = vi.fn();
    render()
      .nodes.find((node) => node.id === "mfa-code")
      ?.onPaste?.({
        preventDefault,
        clipboardData: { getData: () => "12 34 56" },
      });
    expect(preventDefault).toHaveBeenCalledOnce();
    await submit();
    expect(mocks.verifyTotp).toHaveBeenCalledExactlyOnceWith({
      code: "123456",
      trustDevice: false,
    });
    expect(render().html).toContain("Save your backup codes");
    expect(render().html).not.toContain("FIXTURE");
  });
  it("keeps backup codes private until verification and reports saved state synchronously", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    expect(render().html).not.toContain("fixture-backup");
    fill("mfa-code", "123456");
    await submit();
    const checkbox = render().nodes.find((node) => node.type === "checkbox")!;
    checkbox.onChange?.({ target: { checked: true, value: "" } });
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: false,
    });
    checkbox.onChange?.({ target: { checked: false, value: "" } });
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: true,
      pending: false,
    });
    expect(button("Done").disabled).toBe(true);
  });
  it("keeps the pending guard active after disable commits until refresh finishes", async () => {
    mocks.session.data = { user: { twoFactorEnabled: true } };
    let finish!: () => void;
    mocks.session.refetch.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    fill("mfa-password", "fixture-password");
    const disable = button("Disable two-factor");
    mocks.flow.mockClear();
    disable.onClick?.();
    await settle();
    expect(mocks.changed).toHaveBeenCalledExactlyOnceWith(false);
    expect(mocks.flow.mock.calls.every(([state]) => state.pending)).toBe(true);
    finish();
    await settle();
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: false,
    });
  });
  it("ignores setup responses that arrive after unmount", async () => {
    let finish!: (value: typeof setup) => void;
    mocks.enable.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fill("mfa-password", "fixture-password");
    await submit();
    for (const cleanup of hooks.cleanups) cleanup();
    const stateAtUnmount = [...hooks.states];
    mocks.flow.mockClear();
    finish(setup);
    await settle();
    expect(hooks.states).toEqual(stateAtUnmount);
    expect(hooks.states).not.toContain(setup.data.totpURI);
    expect(mocks.changed).not.toHaveBeenCalled();
    expect(mocks.flow).not.toHaveBeenCalled();
    expect(mocks.session.refetch).not.toHaveBeenCalled();
    hooks.states = [];
    hooks.refs = [];
    expect(render().html).not.toContain("fixture-password");
    expect(render().html).not.toContain("FIXTURE");
  });
  it("falls back to manual copying when clipboard support is unavailable", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    vi.stubGlobal("navigator", {});
    button("Copy setup key").onClick?.();
    await settle();
    expect(render().html).toContain("Select and copy the setup key manually");
    expect(render().html).toContain("FIXTURE");
  });
  it("supports standalone rendering without callbacks", () => {
    const html = renderToStaticMarkup(createElement(TwoFactorSettings));
    expect(html).toContain("Set up authenticator");
  });
  it("explains sign-in and session consequences before setup", () => {
    expect(render().html).toContain("GitHub and passkey sign-in");
    button("Set up authenticator").onClick?.();
    expect(render().html).toContain("Other sessions");
  });
  it.each(["error", "missing"])(
    "does not claim MFA is disabled when session is %s",
    (mode) => {
      if (mode === "error") mocks.session.error = { message: "offline" };
      else mocks.session.data = null;
      const { html } = render();
      expect(html).toContain('role="alert"');
      expect(html).toContain("Retry");
      expect(html).not.toContain("Set up authenticator");
    },
  );
  it("guards pending setup before a URI exists and blocks duplicate submits", async () => {
    let resolve!: (value: typeof setup) => void;
    mocks.enable.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    fill("mfa-password", "fixture-password");
    const start = render().nodes.find((node) => node.onSubmit)!;
    mocks.flow.mockClear();
    start.onSubmit?.({ preventDefault: vi.fn() });
    // No rerender or microtask: the parent must block the very next tab click.
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: true,
    });
    await submit();
    await submit();
    expect(mocks.enable).toHaveBeenCalledTimes(1);
    render();
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: true,
    });
    expect(mocks.guard.mock.lastCall?.[0]).toBe(true);
    resolve(setup);
    await settle();
    render();
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: true,
      pending: false,
    });
  });
  it("preserves committed enable and codes after refresh fails, notifying first", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    mocks.session.refetch.mockImplementation(async () => {
      expect(mocks.changed).toHaveBeenCalledWith(true);
      throw new Error("offline");
    });
    fill("mfa-code", "123456");
    await submit();
    const { html } = render();
    expect(html).toContain("Two-factor authentication is enabled");
    expect(html).toContain("fixture-backup");
    expect(html).toContain("refresh");
    expect(html).not.toContain("Code not accepted");
    expect(button("Done").disabled).toBe(true);
    render()
      .nodes.find((node) => node.type === "checkbox")
      ?.onChange?.({ target: { checked: true, value: "" } });
    button("Done").onClick?.();
    const done = render();
    expect(done.html).not.toContain("fixture-backup");
    expect(done.html).toContain("Manage two-factor");
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: false,
    });
  });
  it("retries auth-hook errors, locking Retry and reporting pending synchronously", async () => {
    mocks.session.error = { message: "offline" };
    let finish!: () => void;
    mocks.session.refetch.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    button("Retry").onClick?.();
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: true,
    });
    const pendingRetry = render().nodes.find(
      (node) => node.children === "Retrying…",
    );
    expect(pendingRetry?.disabled).toBe(true);
    pendingRetry?.onClick?.();
    expect(mocks.session.refetch).toHaveBeenCalledTimes(1);
    mocks.session.error = null;
    finish();
    await settle();
    expect(render().html).toContain("Set up authenticator");
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: false,
    });
  });
  it("shows Retry disabled when an auth-hook error is still refetching", () => {
    mocks.session.error = { message: "offline" };
    mocks.session.isRefetching = true;
    expect(button("Retry").disabled).toBe(true);
  });
  it("preserves successful enable when refresh reports an auth-hook error", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    mocks.session.refetch.mockImplementation(async () => {
      mocks.session.error = { message: "offline" };
      mocks.session.data = null;
    });
    fill("mfa-code", "123456");
    await submit();
    expect(render().html).toContain("Two-factor authentication is enabled");
    expect(render().html).toContain("Your security change was saved");
    expect(render().html).toContain("fixture-backup");
    expect(mocks.changed).toHaveBeenCalledTimes(1);
  });
  it("warns before cancelling unsaved setup, clears secrets and never calls disable", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    fill("mfa-code", "123456");
    mocks.confirm.mockReturnValue(false);
    await button("Cancel setup").onClick?.();
    expect(render().html).toContain("Scan this QR code");
    mocks.confirm.mockReturnValue(true);
    await button("Cancel setup").onClick?.();
    const { html, nodes } = render();
    expect(html).not.toContain("FIXTURE");
    expect(html).not.toContain("fixture-backup");
    expect(html).not.toContain("123456");
    expect(nodes.find((node) => node.id === "mfa-password")).toBeUndefined();
    expect(html).toContain("remain in effect");
    expect(mocks.disable).not.toHaveBeenCalled();
    expect(mocks.guard.mock.lastCall?.[0]).toBe(false);
    expect(
      mocks.guard.mock.calls.every(
        (call) => !String(call[1]).includes("FIXTURE"),
      ),
    ).toBe(true);
  });
  it.each(["disable", "regenerate"])(
    "confirms consequences before %s and honours cancellation",
    async (action) => {
      mocks.session.data = { user: { twoFactorEnabled: true } };
      fill("mfa-password", "fixture-password");
      mocks.confirm.mockReturnValue(false);
      button(
        action === "disable" ? "Disable two-factor" : "Regenerate backup codes",
      ).onClick?.();
      expect(mocks.confirm).toHaveBeenCalledWith(
        expect.stringContaining(
          action === "disable"
            ? "no longer protect"
            : "stop working immediately",
        ),
      );
      expect(mocks.disable).not.toHaveBeenCalled();
      expect(mocks.generateBackupCodes).not.toHaveBeenCalled();
      expect(mocks.changed).not.toHaveBeenCalled();
    },
  );
  it("commits disable and clears its password even if refresh fails", async () => {
    mocks.session.data = { user: { twoFactorEnabled: true } };
    mocks.session.refetch.mockRejectedValue(new Error("offline"));
    fill("mfa-password", "fixture-password");
    button("Disable two-factor").onClick?.();
    await settle();
    const { html, nodes } = render();
    expect(html).toContain("Two-factor authentication is disabled");
    expect(html).toContain("Your security change was saved");
    expect(html).toContain("Set up authenticator");
    expect(nodes.find((node) => node.id === "mfa-password")).toBeUndefined();
    expect(mocks.changed).toHaveBeenCalledExactlyOnceWith(false);
  });
  it("keeps regenerated codes dirty until explicit saved acknowledgement", async () => {
    mocks.session.data = { user: { twoFactorEnabled: true } };
    fill("mfa-password", "fixture-password");
    button("Regenerate backup codes").onClick?.();
    await settle();
    expect(render().html).toContain("replacement");
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: true,
      pending: false,
    });
    expect(button("Done").disabled).toBe(true);
    expect(mocks.changed).not.toHaveBeenCalled();
    render()
      .nodes.find((node) => node.type === "checkbox")
      ?.onChange?.({ target: { checked: true, value: "" } });
    render();
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: false,
    });
    button("Done").onClick?.();
    expect(render().html).not.toContain("replacement");
  });
  it.each(["returned", "transport"])(
    "recovers from %s setup failures without committing",
    async (mode) => {
      if (mode === "returned")
        mocks.enable.mockResolvedValue({
          data: null,
          error: { message: "Unable to start setup." },
        });
      else mocks.enable.mockRejectedValue(new Error("Unable to start setup."));
      fill("mfa-password", "fixture-password");
      await submit();
      expect(render().html).toContain("Unable to start setup.");
      expect(mocks.flow).toHaveBeenLastCalledWith({
        dirty: false,
        pending: false,
      });
      expect(mocks.changed).not.toHaveBeenCalled();
      mocks.enable.mockResolvedValue(setup);
      await submit();
      expect(render().html).toContain("Scan this QR code");
    },
  );
  it("retains setup after rejected verification and allows retry", async () => {
    fill("mfa-password", "fixture-password");
    await submit();
    mocks.verifyTotp.mockResolvedValue({ error: { message: "invalid" } });
    fill("mfa-code", "123456");
    await submit();
    expect(render().html).toContain("Code not accepted");
    expect(render().html).toContain("Scan this QR code");
    expect(mocks.changed).not.toHaveBeenCalled();
    mocks.verifyTotp.mockResolvedValue({ data: {}, error: null });
    await submit();
    expect(render().html).toContain("fixture-backup");
  });
  it.each([
    ["disable", "returned"],
    ["disable", "transport"],
    ["regenerate", "returned"],
    ["regenerate", "transport"],
  ])("keeps enabled status after %s %s failure", async (action, mode) => {
    mocks.session.data = { user: { twoFactorEnabled: true } };
    const request =
      action === "disable" ? mocks.disable : mocks.generateBackupCodes;
    if (mode === "returned")
      request.mockResolvedValue({
        data: null,
        error: { message: "Request failed. Try again." },
      });
    else request.mockRejectedValue(new Error("Request failed. Try again."));
    fill("mfa-password", "fixture-password");
    button(
      action === "disable" ? "Disable two-factor" : "Regenerate backup codes",
    ).onClick?.();
    await settle();
    expect(render().html).toContain("Request failed. Try again.");
    expect(render().html).toContain("Enabled");
    expect(mocks.changed).not.toHaveBeenCalled();
    expect(mocks.flow).toHaveBeenLastCalledWith({
      dirty: false,
      pending: false,
    });
    expect(mocks.session.refetch).not.toHaveBeenCalled();
  });
});
