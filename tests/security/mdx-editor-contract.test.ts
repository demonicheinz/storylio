import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { getMdxSafetyError } from "@/lib/mdx-safety";

describe("editor Markdown contract", () => {
  it("accepts the smoke template including fenced braces, tables and admonitions", async () => {
    const source = await readFile(
      "tests/fixtures/mdx/markdown-smoke.md",
      "utf8",
    );
    expect(await getMdxSafetyError(source)).toBeNull();
  });
  it.each([
    "```js\nfunction sapa(nama) {\n return `Halo, ${nama}!`;\n}\n```",
    "```\n{example}\n<Contoh />\n```",
    "Kurung sebagai teks: \\{contoh\\}.",
  ])("accepts literal braces in supported Markdown %#", async (source) => {
    expect(await getMdxSafetyError(source)).toBeNull();
  });
  it.each([
    "import { Contoh } from './contoh'\n\n<Contoh />",
    "<mark>highlight</mark>",
    "{process.env.SECRET}",
  ])("keeps executable/HTML content rejected %#", async (source) => {
    expect(await getMdxSafetyError(source)).toMatch(/not allowed/);
  });
  it("reports an unfenced incomplete expression rather than silently accepting it", async () => {
    expect(await getMdxSafetyError("function sapa(nama) {")).toMatch(
      /closing brace/,
    );
  });
});
