import { Children, createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PasskeySettings } from "@/features/dashboard/settings/components/passkey-settings";
import { SessionSettings } from "@/features/dashboard/settings/components/session-settings";

const mocks = vi.hoisted(() => ({
  listKeys: vi.fn(),
  refetchKeys: vi.fn(),
  add: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
  listSessions: vi.fn(),
  revoke: vi.fn(),
  revokeOthers: vi.fn(),
  toast: vi.fn(),
}));
const hooks = vi.hoisted(() => ({ current: null as HarnessState | null }));
type HarnessState = {
  values: unknown[];
  index: number;
  effects: { deps?: readonly unknown[]; cleanup?: () => void }[];
  queued: (() => void)[];
};

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useListPasskeys: mocks.listKeys,
    passkey: {
      listUserPasskeys: mocks.listKeys,
      addPasskey: mocks.add,
      updatePasskey: mocks.rename,
      deletePasskey: mocks.remove,
    },
  },
}));
vi.mock("@/features/dashboard/settings/actions", () => ({
  actionListDashboardSessions: mocks.listSessions,
  actionRevokeDashboardSession: mocks.revoke,
  actionRevokeOtherDashboardSessions: mocks.revokeOthers,
}));
vi.mock("@/components/ui/toast", () => ({ toast: { add: mocks.toast } }));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: NodeProps) =>
    createElement("button", props, children),
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props: NodeProps) => createElement("input", props),
}));
vi.mock("@/components/ui/label", () => ({
  Label: (props: NodeProps) => createElement("label", props),
}));
vi.mock("@/components/ui/dialog", () => {
  const Container = ({ children }: NodeProps) =>
    createElement("div", null, children);
  return {
    Dialog: Container,
    DialogContent: Container,
    DialogDescription: Container,
    DialogFooter: Container,
    DialogHeader: Container,
    DialogTitle: Container,
    DialogTrigger: Container,
  };
});
vi.mock("@/components/ui/alert-dialog", () => {
  const Container = ({ children }: NodeProps) =>
    createElement("div", null, children);
  return {
    AlertDialog: Container,
    AlertDialogContent: Container,
    AlertDialogHeader: Container,
    AlertDialogTitle: Container,
    AlertDialogDescription: Container,
    AlertDialogFooter: Container,
    AlertDialogCancel: Container,
    AlertDialogAction: Container,
  };
});
// Exercise real component handlers in the repository's Node test environment.
// Each mounted component gets its own state, refs, dependency effects and cleanup.
vi.mock("react", async (original) => {
  const react = await original<typeof import("react")>();
  return {
    ...react,
    useId: () => (hooks.current ? "passkey-test" : react.useId()),
    useState: (initial: unknown) => {
      const state = hooks.current;
      if (!state) return react.useState(initial);
      const i = state.index++;
      if (!(i in state.values))
        state.values[i] = typeof initial === "function" ? initial() : initial;
      return [
        state.values[i],
        (value: unknown) => {
          state.values[i] =
            typeof value === "function" ? value(state.values[i]) : value;
        },
      ];
    },
    useRef: (initial: unknown) => {
      const state = hooks.current;
      if (!state) return react.useRef(initial);
      const i = state.index++;
      state.values[i] ??= { current: initial };
      return state.values[i];
    },
    useEffect: (
      effect: () => (() => void) | undefined,
      deps?: readonly unknown[],
    ) => {
      const state = hooks.current;
      if (!state) return react.useEffect(effect, deps);
      const i = state.index++;
      const previous = state.effects[i];
      if (
        !previous ||
        !deps ||
        deps.some((value, n) => !Object.is(value, previous.deps?.[n]))
      ) {
        state.queued.push(() => {
          previous?.cleanup?.();
          state.effects[i] = { deps, cleanup: effect() };
        });
      }
    },
  };
});

type NodeProps = {
  children?: ReactNode;
  onClick?: () => unknown;
  disabled?: boolean;
  [key: string]: unknown;
};
function nodes(tree: ReactNode): React.ReactElement<NodeProps>[] {
  const result: React.ReactElement<NodeProps>[] = [];
  Children.forEach(tree, (node) => {
    if (isValidElement<NodeProps>(node))
      result.push(node, ...nodes(node.props.children));
  });
  return result;
}
function mount<P extends object>(Component: (props: P) => ReactNode, props: P) {
  const state: HarnessState = { values: [], index: 0, effects: [], queued: [] };
  let tree: ReactNode;
  const render = (next = props) => {
    props = next;
    state.index = 0;
    hooks.current = state;
    try {
      tree = Component(props);
    } finally {
      hooks.current = null;
    }
    for (const effect of state.queued.splice(0)) effect();
    return tree;
  };
  render();
  return {
    render,
    all: () => nodes(tree),
    button: (text: string) => {
      const node = nodes(tree).find(
        (node) => node.props.onClick && nodesText(node.props.children) === text,
      );
      if (!node) throw new Error(`Missing button: ${text}`);
      return node.props;
    },
    html: () => renderToStaticMarkup(createElement("div", null, tree)),
    unmount: () => {
      for (const effect of state.effects) effect?.cleanup?.();
    },
  };
}
function passkeyDialog(
  view: Pick<ReturnType<typeof mount>, "all">,
  name: "AddPasskeyDialog" | "EditPasskeyDialog",
) {
  const wrapper = view
    .all()
    .find((node) => typeof node.type === "function" && node.type.name === name);
  if (!wrapper || typeof wrapper.type !== "function")
    throw new Error(`Missing ${name}`);
  const inner = (
    wrapper.type as (props: NodeProps) => React.ReactElement<NodeProps>
  )(wrapper.props);
  const dialog = mount(
    inner.type as (props: NodeProps) => ReactNode,
    inner.props,
  );
  const open = () => {
    const root = dialog.all()[0];
    (root.props.onOpenChange as (value: boolean) => void)(true);
    dialog.render();
  };
  const submit = () => {
    const form = dialog.all().find((node) => node.type === "form");
    return (
      form?.props.onSubmit as (event: {
        preventDefault: () => void;
      }) => Promise<void>
    )({ preventDefault() {} });
  };
  const setName = (value: string) => {
    const input = dialog.all().find((node) => node.props.id === "passkey-test");
    (input?.props.onChange as (event: { target: { value: string } }) => void)({
      target: { value },
    });
    dialog.render();
  };
  const isOpen = () => dialog.all()[0].props.open;
  return { ...dialog, open, submit, setName, isOpen };
}
function nodesText(tree: ReactNode): string {
  return Children.toArray(tree)
    .map((node) =>
      isValidElement<NodeProps>(node)
        ? nodesText(node.props.children)
        : String(node),
    )
    .join("");
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function settle() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}
const key = {
  id: "key-1",
  name: "Work key",
  createdAt: "2026-10-01T00:00:00Z",
};
const session = (id: string, isCurrent = false) => ({
  id,
  isCurrent,
  userAgent: "Browser/" + "x".repeat(180),
  ipAddress: "2001:db8:0000:0000:0000:0000:0000:0001",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
  expiresAt: "2026-11-01T00:00:00Z",
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("window", { confirm: vi.fn(() => true) });
  mocks.listKeys.mockReturnValue({
    data: [key],
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: mocks.refetchKeys,
  });
  mocks.refetchKeys.mockResolvedValue(undefined);
  mocks.listSessions.mockResolvedValue({
    success: true,
    data: [session("current", true), session("other")],
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("settings security", () => {
  it("does not delete a passkey when its named confirmation is cancelled", async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const view = mount(PasskeySettings, { mfaEnabled: false });
    await settle();
    view.render();
    await view.button("Delete").onClick?.();
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('"Work key"'),
    );
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.refetchKeys).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(view.button("Delete").variant).toBe("destructive");
  });

  it("confirms the current count of other sessions and preserves the current session", async () => {
    mocks.revokeOthers.mockResolvedValue({ success: true });
    mocks.listSessions.mockResolvedValueOnce({
      success: true,
      data: [session("current", true), session("one"), session("two")],
    });
    const view = mount(SessionSettings, { onSummaryChange: vi.fn() });
    await settle();
    view.render();
    await view.button("Revoke Other Sessions").onClick?.();
    view.render();
    expect(window.confirm).not.toHaveBeenCalled();
    expect(view.html()).toContain("2 other sessions are");
    expect(view.html()).toContain("This browser will remain signed in");
    expect(mocks.revokeOthers).not.toHaveBeenCalled();
    expect(view.button("Revoke Other Sessions").variant).toBe("destructive");
    const dialog = view
      .all()
      .find(
        (node) =>
          node.props.open === true &&
          typeof node.props.onOpenChange === "function",
      );
    expect(dialog).toBeDefined();
    (dialog!.props.onOpenChange as (value: boolean) => void)(false);
    view.render();
    expect(mocks.revokeOthers).not.toHaveBeenCalled();
    await view.button("Revoke Other Sessions").onClick?.();
    view.render();
    await view.button("Revoke 2 sessions").onClick?.();
    view.render();
    expect(mocks.revokeOthers).toHaveBeenCalledOnce();
    expect(view.html()).toContain("Current session");
    expect(view.html()).not.toContain("Dashboard session");
  });
  it("keeps stored keys manageable under MFA and blocks new registrations", async () => {
    const view = mount(PasskeySettings, { mfaEnabled: true });
    await settle();
    view.render();
    expect(view.html()).toContain("cannot be used to sign in");
    expect(view.html()).toContain("Work key");
    expect(view.button("Delete").disabled).toBeFalsy();
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it("reports returned deletion errors without removing the key or claiming success", async () => {
    mocks.remove.mockResolvedValue({
      error: { message: "Key was not deleted." },
    });
    const view = mount(PasskeySettings, { mfaEnabled: false });
    await settle();
    view.render();
    await view.button("Delete").onClick?.();
    view.render();
    expect(view.html()).toContain("Key was not deleted.");
    expect(view.html()).toContain("Work key");
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("blocks adding when MFA is unknown while leaving rename and delete available", () => {
    const view = mount(PasskeySettings, {
      mfaEnabled: false,
      authUnavailable: true,
    });
    expect(view.html()).toContain("two-factor status is unknown");
    const add = passkeyDialog(view, "AddPasskeyDialog");
    add.open();
    expect(
      add.all().find((node) => node.props.type === "submit")?.props.disabled,
    ).toBe(true);
    expect(view.button("Delete").disabled).toBeFalsy();
    const rename = passkeyDialog(view, "EditPasskeyDialog");
    expect(
      rename.all().find((node) => node.props.type === "submit")?.props.disabled,
    ).toBe(false);
    expect(mocks.add).not.toHaveBeenCalled();
  });

  it.each([
    ["AddPasskeyDialog", "add"],
    ["EditPasskeyDialog", "rename"],
  ] as const)(
    "keeps %s open with its name after a returned error, then allows retry",
    async (component, operation) => {
      mocks[operation]
        .mockResolvedValueOnce({
          error: { message: "Please try this key again." },
        })
        .mockResolvedValueOnce({ error: null });
      const view = mount(PasskeySettings, { mfaEnabled: false });
      const dialog = passkeyDialog(view, component);
      dialog.open();
      dialog.setName("  Travel key  ");
      await dialog.submit();
      dialog.render();
      expect(dialog.isOpen()).toBe(true);
      expect(dialog.html()).toContain("Please try this key again.");
      expect(dialog.html()).toContain('value="  Travel key  "');
      expect(mocks.toast).not.toHaveBeenCalled();
      expect(mocks.refetchKeys).not.toHaveBeenCalled();
      await dialog.submit();
      dialog.render();
      expect(dialog.isOpen()).toBe(false);
      expect(mocks[operation]).toHaveBeenLastCalledWith(
        operation === "add"
          ? { name: "Travel key" }
          : { id: key.id, name: "Travel key" },
      );
      expect(mocks.refetchKeys).toHaveBeenCalledOnce();
      expect(mocks.toast).toHaveBeenCalledOnce();
    },
  );

  it.each(["AddPasskeyDialog", "EditPasskeyDialog"] as const)(
    "keeps %s open after transport failure and catches repeated submits",
    async (component) => {
      const operation =
        component === "AddPasskeyDialog" ? mocks.add : mocks.rename;
      const write = deferred<{ error: { message: string } }>();
      operation
        .mockReturnValueOnce(write.promise)
        .mockRejectedValueOnce(new Error("Disconnected"));
      const view = mount(PasskeySettings, { mfaEnabled: false });
      const dialog = passkeyDialog(view, component);
      dialog.open();
      dialog.setName("Phone");
      const first = dialog.submit();
      await dialog.submit();
      expect(operation).toHaveBeenCalledOnce();
      // Even Escape/backdrop dismissals must not hide an in-progress operation.
      (dialog.all()[0].props.onOpenChange as (value: boolean) => void)(false);
      dialog.render();
      expect(dialog.isOpen()).toBe(true);
      write.resolve({ error: { message: "Cancelled by browser" } });
      await first;
      dialog.render();
      expect(dialog.isOpen()).toBe(true);
      await dialog.submit();
      dialog.render();
      expect(dialog.html()).toContain("Disconnected");
      expect(dialog.isOpen()).toBe(true);
      expect(mocks.toast).not.toHaveBeenCalled();
    },
  );

  it("refreshes after successful deletion and keeps a refresh failure separate from the write", async () => {
    mocks.remove.mockResolvedValue({ error: null });
    mocks.refetchKeys.mockRejectedValueOnce(new Error("Refresh offline"));
    const view = mount(PasskeySettings, { mfaEnabled: true });
    await view.button("Delete").onClick?.();
    view.render();
    expect(mocks.remove).toHaveBeenCalledWith({ id: key.id });
    expect(mocks.refetchKeys).toHaveBeenCalledOnce();
    expect(mocks.toast).toHaveBeenCalledExactlyOnceWith({
      title: "Passkey deleted successfully.",
      type: "success",
    });
    expect(view.html()).toContain("Could not refresh passkeys");
    expect(view.html()).not.toContain("Failed to delete");
    await view.button("Retry").onClick?.();
    view.render();
    expect(mocks.refetchKeys).toHaveBeenCalledTimes(2);
    expect(view.html()).not.toContain("Could not refresh passkeys");
  });

  it("does not turn an add success into a failed form when the reactive list reports an error", async () => {
    mocks.add.mockResolvedValue({ error: null });
    mocks.refetchKeys.mockImplementationOnce(async () => {
      mocks.listKeys.mockReturnValue({
        data: [key],
        error: { message: "Refresh unavailable" },
        isPending: false,
        refetch: mocks.refetchKeys,
      });
    });
    const view = mount(PasskeySettings, { mfaEnabled: false });
    const dialog = passkeyDialog(view, "AddPasskeyDialog");
    dialog.open();
    await dialog.submit();
    dialog.render();
    view.render();
    expect(dialog.isOpen()).toBe(false);
    expect(view.html()).toContain("Refresh unavailable");
    expect(mocks.toast).toHaveBeenCalledOnce();
  });

  it("retries an unavailable passkey list without presenting a false empty state", async () => {
    mocks.listKeys.mockReturnValue({
      data: null,
      error: { message: "Passkeys unavailable" },
      isPending: false,
      refetch: mocks.refetchKeys,
    });
    const view = mount(PasskeySettings, { mfaEnabled: false });
    expect(view.html()).toContain("Passkeys unavailable");
    expect(view.html()).not.toContain("No passkeys registered");
    await view.button("Retry").onClick?.();
    expect(mocks.refetchKeys).toHaveBeenCalledOnce();
  });

  it("locks repeated deletion calls before React rerenders and unlocks after transport failure", async () => {
    const write = deferred<{ error: null }>();
    mocks.remove
      .mockReturnValueOnce(write.promise)
      .mockRejectedValueOnce(new Error("Offline"));
    const view = mount(PasskeySettings, { mfaEnabled: false });
    const deleteKey = view.button("Delete").onClick;
    const first = deleteKey?.();
    await deleteKey?.();
    expect(mocks.remove).toHaveBeenCalledOnce();
    write.resolve({ error: null });
    await first;
    await deleteKey?.();
    view.render();
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(view.html()).toContain("Offline");
    expect(mocks.toast).toHaveBeenCalledOnce();
  });

  it("distinguishes failed loading from an empty session list and supports retry", async () => {
    mocks.listSessions.mockRejectedValueOnce(new Error("Offline"));
    const summary = vi.fn();
    const view = mount(SessionSettings, { onSummaryChange: summary });
    await settle();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("Unknown");
    expect(view.html()).not.toContain("No active sessions");
    view.button("Retry").onClick?.();
    view.render();
    await settle();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("2");
  });

  it("preserves sessions with a stale warning after returned refresh errors and reloads on refreshKey", async () => {
    const summary = vi.fn();
    const view = mount(SessionSettings, {
      onSummaryChange: summary,
      refreshKey: 0,
    });
    await settle();
    view.render();
    mocks.listSessions.mockResolvedValueOnce({
      success: false,
      error: "Sessions unavailable",
    });
    view.render({ onSummaryChange: summary, refreshKey: 1 });
    await settle();
    view.render();
    expect(view.html()).toContain("Sessions unavailable");
    expect(view.html()).toContain("may be out of date");
    expect(view.html()).toContain("Current session");
    expect(summary).toHaveBeenLastCalledWith("Unknown");
    expect(mocks.listSessions).toHaveBeenCalledTimes(2);
  });

  it("shows zero only after an explicitly empty successful session response", async () => {
    mocks.listSessions
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true, data: [] });
    const summary = vi.fn();
    const view = mount(SessionSettings, { onSummaryChange: summary });
    await settle();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("Unknown");
    view.button("Retry").onClick?.();
    view.render();
    await settle();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("0");
    expect(view.html()).toContain("No active sessions");
  });

  it("uses native details and wraps long browser and IPv6 values", async () => {
    const view = mount(SessionSettings, { onSummaryChange: vi.fn() });
    await settle();
    view.render();
    const html = view.html();
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
    expect(html).toContain("IP address</dt>");
    expect(html).toContain("Created</dt>");
    expect(html).toContain("Expires</dt>");
    expect(html).toContain("wrap-anywhere");
    expect(html).not.toContain("truncate");
    expect(html).toContain(session("other").ipAddress);
    expect(
      view
        .all()
        .filter(
          (node) =>
            node.props.onClick &&
            nodesText(node.props.children) === "Revoke session",
        ),
    ).toHaveLength(1);
  });

  it("updates its own session list for per-session and bulk revocation", async () => {
    mocks.listSessions.mockResolvedValueOnce({
      success: true,
      data: [session("current", true), session("one"), session("two")],
    });
    mocks.revoke.mockResolvedValue({ success: true });
    mocks.revokeOthers.mockResolvedValue({ success: true });
    const summary = vi.fn();
    const view = mount(SessionSettings, { onSummaryChange: summary });
    await settle();
    view.render();
    await view.button("Revoke session").onClick?.();
    expect(window.confirm).not.toHaveBeenCalled();
    view.render();
    expect(mocks.revoke).toHaveBeenCalledWith("one");
    expect(summary).toHaveBeenLastCalledWith("2");
    expect(view.button("Revoke session").variant).toBe("ghost");
    expect(view.button("Revoke session").className).toContain(
      "text-destructive",
    );
    await view.button("Revoke Other Sessions").onClick?.();
    view.render();
    await view.button("Revoke 1 session").onClick?.();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("1");
    expect(view.html()).toContain("Current session");
    expect(view.button("Revoke Other Sessions").disabled).toBe(true);
    expect(mocks.listSessions).toHaveBeenCalledOnce();
  });

  it.each([false, true])(
    "preserves session data on %s transport/returned revocation errors",
    async (transport) => {
      if (transport) mocks.revoke.mockRejectedValueOnce(new Error("Offline"));
      else
        mocks.revoke.mockResolvedValueOnce({
          success: false,
          error: "Revocation rejected",
        });
      const summary = vi.fn();
      const view = mount(SessionSettings, { onSummaryChange: summary });
      await settle();
      view.render();
      await view.button("Revoke session").onClick?.();
      view.render();
      expect(summary).toHaveBeenLastCalledWith("2");
      expect(view.html()).toContain(
        transport ? "Could not revoke sessions" : "Revocation rejected",
      );
      expect(mocks.toast).not.toHaveBeenCalled();
      expect(view.button("Revoke session").disabled).toBe(false);
    },
  );

  it("ignores a load from an older refresh and any load completed after unmount", async () => {
    const old = deferred<{
      success: true;
      data: ReturnType<typeof session>[];
    }>();
    mocks.listSessions
      .mockReturnValueOnce(old.promise)
      .mockResolvedValueOnce({ success: true, data: [] });
    const summary = vi.fn();
    const props = { onSummaryChange: summary, refreshKey: 0 };
    const view = mount(SessionSettings, props);
    view.render({ ...props, refreshKey: 1 });
    await settle();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("0");
    old.resolve({ success: true, data: [session("late")] });
    await settle();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("0");
    const late = deferred<{
      success: true;
      data: ReturnType<typeof session>[];
    }>();
    mocks.listSessions.mockReturnValueOnce(late.promise);
    view.render({ ...props, refreshKey: 2 });
    view.render();
    view.unmount();
    const html = view.html();
    late.resolve({ success: true, data: [session("late")] });
    await settle();
    view.render();
    expect(view.html()).toBe(html);
  });

  it("does not let an in-flight refresh resurrect a successfully revoked session", async () => {
    const summary = vi.fn();
    const props = { onSummaryChange: summary, refreshKey: 0 };
    const view = mount(SessionSettings, props);
    await settle();
    view.render();
    const old = deferred<{
      success: true;
      data: ReturnType<typeof session>[];
    }>();
    mocks.listSessions.mockReturnValueOnce(old.promise);
    view.render({ ...props, refreshKey: 1 });
    mocks.revoke.mockResolvedValueOnce({ success: true });
    const revoke = view.button("Revoke session").onClick;
    const first = revoke?.();
    await revoke?.();
    await first;
    view.render();
    expect(mocks.revoke).toHaveBeenCalledOnce();
    expect(summary).toHaveBeenLastCalledWith("1");
    old.resolve({
      success: true,
      data: [session("current", true), session("other")],
    });
    await settle();
    view.render();
    expect(summary).toHaveBeenLastCalledWith("1");
  });
});
