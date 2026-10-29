import { Children, createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  UmamiPanelClient,
  UmamiPanelSkeleton,
} from "@/features/dashboard/analytics/components/umami-panel";
import type { UmamiAnalytics } from "@/lib/umami";

const hooks = vi.hoisted(() => ({
  active: false,
  states: [] as unknown[],
  refs: [] as { current: unknown }[],
  stateIndex: 0,
  refIndex: 0,
}));
const action = vi.hoisted(() => vi.fn());
vi.mock("@/features/dashboard/analytics/actions", () => ({
  actionRefreshUmamiAnalytics: action,
}));
// The suite runs in Node. Keep state across direct component renders so refresh
// handlers can be exercised without adding a DOM implementation to the project.
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
  };
});

const range = {
  startAt: Date.parse("2026-09-29T12:00:00Z"),
  endAt: Date.parse("2026-10-29T12:00:00Z"),
};
const fetchedAt = "2026-10-29T12:00:02.000Z";

function available(): UmamiAnalytics {
  return {
    status: "available",
    pageviews: { value: 1234 },
    visitors: { value: 32 },
    visits: { value: 45 },
    bounceRate: { value: 20 },
    visitDuration: { value: 119.6 },
    topPages: [{ name: `/blog/${"long-path".repeat(15)}`, value: 321 }],
    referrers: [],
    browsers: [{ name: "Firefox", value: 42 }],
    locations: [],
    fetchedAt,
    range,
    details: {
      browsers: { status: "available", fetchedAt, range },
      referrers: { status: "empty", fetchedAt, range },
    },
  };
}

function findRefresh(node: ReactNode): (() => Promise<void>) | undefined {
  let handler: (() => Promise<void>) | undefined;
  Children.forEach(node, (child) => {
    if (
      !isValidElement<{ onClick?: () => Promise<void>; children?: ReactNode }>(
        child,
      )
    )
      return;
    handler ??= child.props.onClick ?? findRefresh(child.props.children);
  });
  return handler;
}

function render(initialAnalytics = available()) {
  hooks.stateIndex = 0;
  hooks.refIndex = 0;
  hooks.active = true;
  let tree: ReturnType<typeof UmamiPanelClient>;
  try {
    tree = UmamiPanelClient({
      initialAnalytics,
      shareUrl: "https://analytics.example.test/share",
    });
  } finally {
    hooks.active = false;
  }
  return { html: renderToStaticMarkup(tree), refresh: findRefresh(tree) };
}

beforeEach(() => {
  hooks.states = [];
  hooks.refs = [];
  action.mockReset();
});
afterEach(() => {
  hooks.active = false;
});

describe("Umami traffic panel", () => {
  it("labels its source and range, wraps identities and carries rounded duration into minutes", () => {
    const { html } = render();
    expect(html).toContain("Refresh Umami");
    expect(html).toContain("Browsers</h3>");
    expect(html).toContain("Countries</h3>");
    expect(html).not.toMatch(/Environment|Location<|truncate/);
    expect(html).toContain("wrap-anywhere");
    expect(html).toContain("2m 00s");
    expect(html).not.toContain("1m 60s");
    expect(html).toContain("Rolling 30 days");
    expect(html).toContain("UTC");
    expect(html).toContain(`dateTime="${fetchedAt}"`);
    expect(html).toContain("min-h-11");
    expect(html).toContain("motion-reduce:animate-none");
  });

  it("renders old provider fixtures without inventing freshness", () => {
    const fixture = available();
    delete fixture.fetchedAt;
    delete fixture.range;
    delete fixture.details;
    const { html } = render(fixture);
    expect(html).toContain("Fetch time unavailable");
    expect(html).not.toContain("dateTime=");
    expect(html).toContain("1,234");
  });

  it("has setup guidance and no retry when Umami is not configured", () => {
    const { html, refresh } = render({
      ...available(),
      status: "not-configured",
    });
    expect(html).toContain("not configured");
    expect(html).toContain("server configuration");
    expect(html).not.toContain("Retry");
    expect(refresh).toBeUndefined();
  });

  it("distinguishes failed details from successfully empty lists", () => {
    const fixture = available();
    fixture.browsers = [];
    fixture.details = {
      browsers: { status: "error" },
      referrers: { status: "empty" },
    };
    const { html } = render(fixture);
    expect(html).toContain("Browsers could not be loaded");
    expect(html).toContain("No referrer metrics");
    expect(html).not.toContain("No browser metrics");
    expect(html).toContain('role="status"');
    expect(html).toContain("Retry");
  });

  it.each(["returned error", "transport throw"])(
    "retains last available data and timestamp after %s and allows recovery",
    async (failure) => {
      if (failure === "transport throw")
        action.mockRejectedValueOnce(new Error("transport details"));
      else
        action.mockResolvedValueOnce({
          ...available(),
          status: "error",
          topPages: [],
          pageviews: {},
        });
      await expect(render().refresh?.()).resolves.toBeUndefined();
      const failed = render();
      expect(failed.html).toContain("1,234");
      expect(failed.html).toContain(`dateTime="${fetchedAt}"`);
      expect(failed.html).toContain("stale");
      expect(failed.html).toContain("Retry");
      expect(failed.html).toContain('role="status"');
      expect(failed.html).not.toContain("transport details");

      const recoveredAt = "2026-10-29T13:00:00.000Z";
      action.mockResolvedValueOnce({
        ...available(),
        pageviews: { value: 5678 },
        fetchedAt: recoveredAt,
      });
      await failed.refresh?.();
      const recovered = render().html;
      expect(recovered).toContain("5,678");
      expect(recovered).toContain(`dateTime="${recoveredAt}"`);
      expect(recovered).not.toContain("may be stale");
      expect(recovered).toContain("Refresh Umami");
    },
  );

  it("preserves a failed detail's own successful timestamp and range on partial refresh", async () => {
    const next = available();
    next.browsers = [];
    next.fetchedAt = "2026-10-30T12:00:00.000Z";
    next.range = {
      startAt: range.startAt + 86400000,
      endAt: range.endAt + 86400000,
    };
    next.details = { browsers: { status: "error" } };
    action.mockResolvedValueOnce(next);
    await render().refresh?.();
    const { html } = render();
    expect(html).toContain("Firefox");
    expect(html).toContain("stale");
    expect(html).toContain(`dateTime="${fetchedAt}"`);
    expect(html).toContain(`dateTime="${next.fetchedAt}"`);
    expect(html).toContain("Sep 29");
    expect(html).toContain("Retry");
  });

  it("keeps prior data but removes retry if configuration disappears during refresh", async () => {
    action.mockResolvedValueOnce({ ...available(), status: "not-configured" });
    await render().refresh?.();
    const { html, refresh } = render();
    expect(html).toContain("1,234");
    expect(html).toContain("stale");
    expect(html).toContain("server configuration");
    expect(html).not.toContain("Retry");
    expect(refresh).toBeUndefined();
  });

  it("announces pending, prevents duplicate requests and re-enables retry after failure", async () => {
    let reject: ((reason: Error) => void) | undefined;
    action.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    const initial = render();
    const pending = initial.refresh?.();
    await initial.refresh?.();
    const { html } = render();
    expect(html).toContain("Refreshing Umami");
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(action).toHaveBeenCalledOnce();
    reject?.(new Error("offline"));
    await pending;
    const failed = render();
    expect(failed.html).not.toContain('disabled=""');
    expect(failed.html).toContain("Retry");
  });

  it("offers a working retry after an initial source failure", async () => {
    const initial = render({ ...available(), status: "error" });
    expect(initial.html).toContain("Retry");
    action.mockResolvedValueOnce(available());
    await initial.refresh?.();
    expect(render().html).toContain("1,234");
  });

  it("provides an accessible source-specific loading state", () => {
    const html = renderToStaticMarkup(createElement(UmamiPanelSkeleton));
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Umami");
  });
});
