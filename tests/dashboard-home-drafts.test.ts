import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearHeroDraft,
  clearHomeDraft,
  homeSectionDraftKey,
  readHeroDraft,
  readSectionDraft,
  saveHeroDraft,
  saveSectionDraft,
} from "@/features/dashboard/home/components/home-drafts";
import type { HomeSectionActionValues } from "@/features/dashboard/home/validations";

const base: HomeSectionActionValues = {
  type: "LOGO",
  label: "TypeScript",
  content: "",
  category: "TECHNOLOGY",
  showOnHome: true,
  imageUrl: undefined,
  order: 0,
};
const key = homeSectionDraftKey("LOGO", "typescript");

describe("Home session drafts", () => {
  let entries: Map<string, string>;
  let storage: {
    getItem: ReturnType<typeof vi.fn<(key: string) => string | null>>;
    setItem: ReturnType<typeof vi.fn<(key: string, value: string) => void>>;
    removeItem: ReturnType<typeof vi.fn<(key: string) => void>>;
  };

  beforeEach(() => {
    entries = new Map();
    storage = {
      getItem: vi.fn((key: string) => entries.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        entries.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        entries.delete(key);
      }),
    };
    vi.stubGlobal("sessionStorage", storage);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns no draft when storage is empty", () => {
    expect(readHeroDraft("Saved")).toBeUndefined();
    expect(readSectionDraft(key, base)).toBeUndefined();
  });

  it("restores an unsaved headline, including an intentionally empty headline", () => {
    saveHeroDraft("Saved", "Draft headline");
    expect(readHeroDraft("Saved")).toBe("Draft headline");
    saveHeroDraft("Saved", "");
    expect(readHeroDraft("Saved")).toBe("");
  });

  it("rejects and deletes a headline draft when the server headline changes", () => {
    saveHeroDraft("Saved", "Draft headline");
    expect(readHeroDraft("Updated elsewhere")).toBeUndefined();
    expect(entries.size).toBe(0);
  });

  it("restores unfinished section fields against the same saved base", () => {
    saveSectionDraft(key, base, {
      ...base,
      label: "",
      imageUrl: "unfinished-url",
      order: "2",
    });
    expect(readSectionDraft(key, base)).toMatchObject({
      label: "",
      imageUrl: "unfinished-url",
      order: "2",
    });
  });

  it("isolates drafts by entity, section type, and new-item forms", () => {
    saveSectionDraft(key, base, { ...base, label: "React" });
    expect(
      readSectionDraft(homeSectionDraftKey("LOGO", "other"), base),
    ).toBeUndefined();
    expect(
      readSectionDraft(homeSectionDraftKey("PHASE", "typescript"), {
        ...base,
        type: "PHASE",
      }),
    ).toBeUndefined();
    expect(readSectionDraft(homeSectionDraftKey("LOGO"), base)).toBeUndefined();
    expect(readSectionDraft(key, base)?.label).toBe("React");
  });

  it.each([
    { ...base, label: "Updated elsewhere" },
    { ...base, showOnHome: false },
    { ...base, order: 1 },
    { ...base, imageUrl: "https://example.com/new.png" },
  ])(
    "rejects and deletes a section draft when any saved base field changes: %j",
    (changed) => {
      saveSectionDraft(key, base, { ...base, label: "React" });
      expect(readSectionDraft(key, changed)).toBeUndefined();
      expect(entries.has(key)).toBe(false);
    },
  );

  it.each(["{", "null", "[]", "x".repeat(16_385)])(
    "rejects malformed or oversized stored JSON (case %#)",
    (raw) => {
      entries.set(key, raw);
      expect(readSectionDraft(key, base)).toBeUndefined();
      expect(entries.has(key)).toBe(false);
    },
  );

  it.each([
    { version: 2 },
    { extra: "unexpected envelope property" },
    { values: null },
    { values: { ...base, type: "PHASE" } },
    { values: { ...base, category: "UNKNOWN" } },
    { values: { ...base, label: 42 } },
    { values: { ...base, label: "x".repeat(1001) } },
    { values: { ...base, imageUrl: "x".repeat(2049) } },
    { values: { ...base, order: {} } },
    { values: { ...base, extra: "not a Home field" } },
  ])("rejects invalid stored envelope/value shapes: %j", (mutation) => {
    saveSectionDraft(key, base, { ...base, label: "React" });
    const envelope = JSON.parse(entries.get(key) ?? "null") as Record<
      string,
      unknown
    >;
    entries.set(key, JSON.stringify({ ...envelope, ...mutation }));
    expect(readSectionDraft(key, base)).toBeUndefined();
    expect(entries.has(key)).toBe(false);
  });

  it("rejects invalid stored headline values even with a matching base", () => {
    saveHeroDraft("Saved", "Draft");
    const [heroKey, raw] = [...entries][0];
    const envelope = JSON.parse(raw) as Record<string, unknown>;
    entries.set(
      heroKey,
      JSON.stringify({ ...envelope, values: "x".repeat(161) }),
    );
    expect(readHeroDraft("Saved")).toBeUndefined();
    expect(entries.has(heroKey)).toBe(false);
  });

  it("clears drafts through the clear APIs used after Save or confirmed discard", () => {
    saveHeroDraft("Saved", "Draft");
    saveSectionDraft(key, base, { ...base, label: "React" });
    clearHeroDraft();
    expect(readHeroDraft("Saved")).toBeUndefined();
    expect(readSectionDraft(key, base)?.label).toBe("React");
    clearHomeDraft(key);
    expect(readSectionDraft(key, base)).toBeUndefined();
    expect(entries.size).toBe(0);
  });

  it("removes the cached draft when edits return to the saved values", () => {
    saveHeroDraft("Saved", "Draft");
    saveHeroDraft("Saved", "Saved");
    saveSectionDraft(key, base, { ...base, label: "React" });
    saveSectionDraft(key, base, base);
    expect(entries.size).toBe(0);
  });

  it("does not persist arbitrary fields or overlong input", () => {
    saveHeroDraft("Saved", "x".repeat(161));
    saveSectionDraft(key, base, { ...base, extra: "unexpected" });
    expect(entries.size).toBe(0);
  });

  it("handles missing sessionStorage during rendering outside the browser", () => {
    vi.stubGlobal("sessionStorage", undefined);
    expect(readHeroDraft("Saved")).toBeUndefined();
    expect(readSectionDraft(key, base)).toBeUndefined();
    expect(() => {
      saveHeroDraft("Saved", "Draft");
      saveSectionDraft(key, base, { ...base, label: "React" });
      clearHeroDraft();
      clearHomeDraft(key);
    }).not.toThrow();
  });

  it("handles blocked reads, writes, and removals without blocking editing", () => {
    const blocked = () => {
      throw new Error("Storage access denied");
    };
    storage.getItem.mockImplementation(blocked);
    storage.setItem.mockImplementation(blocked);
    storage.removeItem.mockImplementation(blocked);
    expect(readHeroDraft("Saved")).toBeUndefined();
    expect(readSectionDraft(key, base)).toBeUndefined();
    expect(() => {
      saveHeroDraft("Saved", "Draft");
      saveSectionDraft(key, base, { ...base, label: "React" });
      clearHeroDraft();
      clearHomeDraft(key);
    }).not.toThrow();
  });
});
