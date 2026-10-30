import { describe, expect, it } from "vitest";
import { getPostPublicationState } from "@/features/dashboard/posts/publication-state";

describe("post display state", () => {
  it("distinguishes private, scheduled and due records", () => {
    const now = Date.parse("2026-10-29T10:00:00Z"),
      date = "2026-10-29T11:00:00Z";
    expect(getPostPublicationState("DRAFT", date, now)).toBe("draft");
    expect(getPostPublicationState("published", date, now)).toBe("scheduled");
    expect(getPostPublicationState("PUBLISHED", date, now + 3600000)).toBe(
      "published",
    );
    expect(getPostPublicationState("PUBLISHED", null, now)).toBe("published");
  });
});
