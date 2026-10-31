import { describe, expect, it } from "vitest";
import { formatBytes } from "@/lib/format-bytes";

describe("file size presentation", () => {
  it.each([
    [0, "0 B"],
    [4, "4 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [1536, "1.5 KB"],
    [1024 * 1024, "1.0 MB"],
    [10 * 1024 * 1024, "10.0 MB"],
  ])("formats %i bytes as %s", (bytes, label) => {
    expect(formatBytes(bytes)).toBe(label);
  });
});
