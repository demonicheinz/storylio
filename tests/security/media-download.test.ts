import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/media/[id]/download/route";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findFirst: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/db", () => ({
  db: { query: { media: { findFirst: mocks.findFirst } } },
}));

const providerUrl =
  "https://fake-key:fake-secret@media.example.test/image?signature=fake-signature";
const fetchMock = vi.fn<typeof fetch>();
const asset = { url: providerUrl, filename: "photo", format: "png" };

function download() {
  return GET(
    new NextRequest("https://storylio.test/api/media/fixture/download", {
      headers: { cookie: "session=fake-session" },
    }),
    { params: Promise.resolve({ id: "fixture" }) },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("OWNER_EMAIL", "owner@example.test");
  vi.stubGlobal("fetch", fetchMock);
  mocks.getSession.mockResolvedValue({ user: { email: "owner@example.test" } });
  mocks.findFirst.mockResolvedValue({ ...asset });
  fetchMock.mockResolvedValue(
    new Response("image-bytes", {
      headers: { "Content-Type": "image/png", "Content-Length": "11" },
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("private media downloads", () => {
  it.each([
    ["東京の写真 🌅", "PNG", "東京の写真 🌅.png"],
    ["café.png", "png", "café.png"],
    ["portrait.JPEG", "jpeg", "portrait.JPEG"],
    ['owner\'s "photo" (100%)!*', "webp", 'owner\'s "photo" (100%)!*.webp'],
    ["   ", "png", "media.png"],
    ["photo", "", "photo"],
  ])(
    "encodes the original filename %j with an ASCII fallback",
    async (filename, format, expected) => {
      mocks.findFirst.mockResolvedValue({ ...asset, filename, format });

      const response = await download();

      expect(response.status).toBe(200);
      const disposition = response.headers.get("content-disposition") ?? "";
      expect(disposition).toMatch(
        /^attachment; filename="[a-zA-Z0-9._ -]+"; filename\*=UTF-8''[A-Za-z0-9!#$&+.^_`|~%()-]+$/,
      );
      const encoded = disposition.split("filename*=UTF-8''")[1];
      expect(decodeURIComponent(encoded)).toBe(expected);
      expect(encoded).not.toMatch(/['()*]/);
      if (format) {
        expect(disposition.split('"')[1].toLowerCase()).toMatch(
          new RegExp(`\\.${format.toLowerCase()}$`),
        );
      }
      expect(await response.text()).toBe("image-bytes");
    },
  );

  it.each([null, {}, { user: { email: "outsider@example.test" } }])(
    "authorizes before looking up or fetching media: %j",
    async (session) => {
      mocks.getSession.mockResolvedValue(session);
      const response = await download();
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("does not fetch a missing asset", async () => {
    mocks.findFirst.mockResolvedValue(undefined);
    const response = await download();
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects every C0/C1 control character before fetching, including CRLF injection", async () => {
    const controls = [
      ...Array.from({ length: 32 }, (_, i) => String.fromCharCode(i)),
      ...Array.from({ length: 33 }, (_, i) => String.fromCharCode(127 + i)),
      "\r\nX-Injected: true",
    ];
    for (const control of controls) {
      for (const field of ["filename", "format"] as const) {
        mocks.findFirst.mockResolvedValue({
          ...asset,
          [field]: `${control}${asset[field]}`,
        });
        const response = await download();
        expect(response.status).toBe(422);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(response.headers.has("x-injected")).toBe(false);
        expect(await response.json()).toEqual({
          error: expect.stringMatching(/rename/i),
        });
      }
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { filename: "broken\ud800", format: "png" },
    { filename: "photo", format: 'png"; filename="injected' },
  ])("rejects malformed metadata before fetching: %j", async (metadata) => {
    mocks.findFirst.mockResolvedValue({ ...asset, ...metadata });
    const response = await download();
    expect(response.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns a rejected upstream fetch into actionable JSON without credentials", async () => {
    vi.useFakeTimers();
    fetchMock.mockRejectedValue(new Error(`Provider failed: ${providerUrl}`));
    const response = await download();
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const payload = await response.json();
    expect(payload).toEqual({
      error: expect.stringMatching(/try again/i),
    });
    expect(JSON.stringify(payload)).not.toMatch(/fake-|media\.example\.test/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    new Response("fake-secret provider diagnostic", { status: 403 }),
    new Response(null, { status: 200 }),
  ])(
    "handles an unusable upstream response without exposing its body",
    async (upstream) => {
      fetchMock.mockResolvedValue(upstream);
      const response = await download();
      expect(response.status).toBe(502);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      const payload = await response.json();
      expect(payload).toEqual({
        error: expect.stringMatching(/try again/i),
      });
      expect(JSON.stringify(payload)).not.toMatch(/fake-|provider diagnostic/);
    },
  );

  it("aborts an upstream header timeout and returns a retry message", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url, options) => {
      return new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () => {
          reject(new DOMException("fake-secret timeout", "AbortError"));
        });
      });
    });
    const pending = download();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const signal = fetchMock.mock.calls[0][1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    await vi.advanceTimersByTimeAsync(30_000);
    const response = await pending;
    expect(signal?.aborted).toBe(true);
    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const payload = await response.json();
    expect(payload).toEqual({
      error: expect.stringMatching(/timed out.*try again/i),
    });
    expect(JSON.stringify(payload)).not.toMatch(/fake-|media\.example\.test/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps streaming after the header deadline and forwards type and length", async () => {
    vi.useFakeTimers();
    let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body = new ReadableStream<Uint8Array>({
      start(streamController) {
        controller = streamController;
      },
    });
    fetchMock.mockImplementation(async (_url, options) => {
      options?.signal?.addEventListener("abort", () => {
        controller?.error(new Error("Download was aborted"));
      });
      return new Response(body, {
        headers: { "Content-Type": "image/webp", "Content-Length": "11" },
      });
    });
    const response = await download();
    expect(response.body).toBe(body);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("content-length")).toBe("11");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(fetchMock).toHaveBeenCalledWith(providerUrl, {
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
    controller?.enqueue(new TextEncoder().encode("image-bytes"));
    controller?.close();
    expect(await response.text()).toBe("image-bytes");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("uses a binary content type when the provider omits metadata", async () => {
    fetchMock.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
    const response = await download();
    expect(response.headers.get("content-type")).toBe(
      "application/octet-stream",
    );
    expect(response.headers.has("content-length")).toBe(false);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });
});
