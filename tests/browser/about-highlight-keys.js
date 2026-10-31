// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function aboutHighlightKeys(sessionPage) {
  const page = await sessionPage.context().newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    await page.goto(`${new URL(sessionPage.url()).origin}/?public-experience`);
    await page
      .getByRole("heading", { name: "Work Experience", exact: true })
      .waitFor();
    for (let index = 0; index < 3; index++) {
      if (
        (await page.locator("article li").count()) !== 3 ||
        (await page
          .locator("article li")
          .filter({ hasText: /^Highlight$/ })
          .count()) !== 2
      )
        throw new Error("Repeated achievements were omitted or duplicated");
      await page.getByRole("button", { name: "Switch language" }).click();
    }
    const keyErrors = errors.filter((message) => message.includes("same key"));
    if (keyErrors.length) throw new Error(keyErrors.join("\n"));
    return {
      passed: true,
      repeatedHighlights: 2,
      languageChanges: 3,
      duplicateKeyWarnings: keyErrors.length,
    };
  } finally {
    await page.close();
  }
}
