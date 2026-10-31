// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function contentNavigation(sessionPage) {
  const page = await sessionPage.context().newPage();
  page.on("dialog", (dialog) => dialog.accept());
  const results = [];
  try {
    for (const kind of ["posts", "projects"]) {
      await page.goto(`http://127.0.0.1:3205/?kind=${kind}`);
      const title = page.getByRole("textbox", { name: "Title", exact: true });
      await title.fill("Retained draft");
      await page
        .getByRole("button", { name: "Collection", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Back to draft", exact: true })
        .click();
      if ((await title.inputValue()) !== "Retained draft")
        throw new Error(`${kind}: draft lost on history restore`);
      await page
        .getByRole("button", { name: "Collection", exact: true })
        .click();
      await page.getByRole("button", { name: "New item", exact: true }).click();
      if ((await title.inputValue()) !== "")
        throw new Error(
          `${kind}: fresh navigation retained the previous draft`,
        );
      await title.fill("Saved draft");
      await page.evaluate(() => {
        window.fixture.fail = true;
      });
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      await page
        .getByText("Save failed. Your changes are still here.", { exact: true })
        .waitFor();
      if ((await title.inputValue()) !== "Saved draft")
        throw new Error(`${kind}: failed save discarded changes`);
      await page.evaluate(() => {
        window.fixture.fail = false;
      });
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .click();
      await page.waitForFunction(() =>
        window.fixture.destination?.includes("/created/edit"),
      );
      await page.getByRole("button", { name: "New item", exact: true }).click();
      if ((await title.inputValue()) !== "")
        throw new Error(`${kind}: create after save retained values`);
      results.push(
        `${kind}: fresh create, history restore, failed save, and create after save passed`,
      );
    }
    return results;
  } finally {
    await page.close();
  }
}
