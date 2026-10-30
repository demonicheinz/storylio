import { describe, expect, it, vi } from "vitest";
import { main } from "../../scripts/seeds";
import { collectSeedPlan, parseSeedSelection } from "../../scripts/seeds/menu";

const prompt = (answers: string[]) => {
  const write = vi.fn();
  const ask = vi.fn(async () => {
    const answer = answers.shift();
    if (answer === undefined) throw new Error("Unexpected prompt");
    return answer;
  });
  return { ask, write, environment: "dev" };
};

describe("Seed terminal menu", () => {
  it("selects explicit groups without duplicates and supports cancel/all", () => {
    expect(parseSeedSelection("1,3,1")).toEqual(["owner", "about"]);
    expect(parseSeedSelection("all")).toHaveLength(7);
    expect(parseSeedSelection("7")).toEqual(["notes"]);
    expect(parseSeedSelection("0")).toEqual([]);
    for (const answer of ["8", "9", "1,0", "2x", "--all", "1,,2"])
      expect(() => parseSeedSelection(answer)).toThrow();
  });
  it("cancels without collecting or applying a plan", async () => {
    expect(await collectSeedPlan(prompt(["0"]))).toBeNull();
    expect(await collectSeedPlan(prompt(["2", "n"]))).toBeNull();
  });
  it("requests owner profile fields and explicit permission to update an existing profile", async () => {
    const input = prompt([
      "1,2",
      "My name",
      "Web developer",
      "My headline",
      "My introduction",
      "hello@example.test",
      "https://example.test",
      "",
      "",
      "",
      "y",
      "y",
    ]);
    expect(await collectSeedPlan(input)).toEqual({
      parts: ["owner", "home"],
      updateProfile: true,
      profile: {
        name: "My name",
        tagline: "Web developer",
        headline: "My headline",
        subheadline: "My introduction",
        publicEmail: "hello@example.test",
        websiteUrl: "https://example.test",
      },
    });
    expect(input.write.mock.calls.flat().join("\n")).not.toMatch(
      /OWNER_PASSWORD=/,
    );
  });
  it("re-prompts invalid selections and URLs without losing valid fields", async () => {
    const input = prompt([
      "9",
      "1",
      "Owner",
      "",
      "",
      "",
      "",
      "not-url",
      "https://example.test",
      "",
      "",
      "",
      "n",
      "y",
    ]);
    const plan = await collectSeedPlan(input);
    expect(plan).toMatchObject({
      updateProfile: false,
      profile: { name: "Owner", websiteUrl: "https://example.test" },
    });
    expect(input.write).toHaveBeenCalledWith("Use a valid URL");
  });
  it("shows overwrite scope and makes dry run impossible to apply", async () => {
    const input = prompt(["4,5"]);
    expect(await collectSeedPlan({ ...input, dryRun: true })).toBeNull();
    const messages = input.write.mock.calls.flat().join("\n");
    expect(messages).toContain("view counts");
    expect(messages).toContain("no database connection");
    expect(input.ask).toHaveBeenCalledTimes(1);
  });
  it("supports help and rejects noninteractive execution without loading the DB", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await main(["--help"]);
      await expect(main(["--environment=dev"])).rejects.toThrow(
        "interactive terminal",
      );
      await expect(main(["--environment=dev", "--yes"])).rejects.toThrow(
        "Unsupported",
      );
    } finally {
      log.mockRestore();
    }
  });
});
