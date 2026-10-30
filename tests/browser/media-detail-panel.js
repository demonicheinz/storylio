async function mediaDetailPanel(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const results = [];
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const first =
    "long-descriptive-filename-for-an-interface-design-image-with-context.webp";
  try {
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      const trigger = page.getByRole("button", {
        name: `Preview ${first}`,
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const drawer = page.getByRole("dialog", {
        name: "Media details",
        exact: true,
      });
      await drawer.waitFor();
      await drawer.getByText("1200 × 800", { exact: true }).waitFor();
      await drawer.getByText("WEBP", { exact: true }).waitFor();
      const input = drawer.getByRole("textbox", {
        name: "Image URL",
        exact: true,
      });
      await input.focus();
      const selected = await input.evaluate(
        (element) =>
          element.readOnly &&
          element.selectionStart === 0 &&
          element.selectionEnd === element.value.length,
      );
      if (!selected) throw Error("Read-only URL is not selected on focus");
      const url = await input.inputValue();
      if (
        (await drawer
          .getByRole("link", { name: "View", exact: true })
          .getAttribute("href")) !== url
      )
        throw Error("View points to a different image");
      await drawer.getByText("Technical details", { exact: true }).click();
      await drawer.getByText("Asset ID: fixture/0", { exact: true }).waitFor();
      await page.evaluate(() => {
        navigator.clipboard.writeText = async (value) => {
          window.detailCopied = value;
        };
      });
      await drawer
        .getByRole("button", { name: "Copy URL", exact: true })
        .click();
      if ((await page.evaluate(() => window.detailCopied)) !== url)
        throw Error("Copy callback received a different URL");
      await drawer.getByRole("button", { name: "Rename", exact: true }).click();
      const rename = page.getByRole("dialog", {
        name: "Rename media",
        exact: true,
      });
      await rename
        .getByRole("textbox", { name: "File name", exact: true })
        .fill("Updated detail.webp");
      await rename
        .getByRole("button", { name: "Save name", exact: true })
        .click();
      await rename.waitFor({ state: "hidden" });
      await drawer
        .getByRole("heading", { name: "Updated detail.webp", exact: true })
        .waitFor();
      await page.screenshot({
        path: `task/code-standardization/media-detail-${width}.png`,
      });
      await page.keyboard.press("Escape");
      await drawer.waitFor({ state: "hidden" });
      const renamedTrigger = page.getByRole("button", {
        name: "Preview Updated detail.webp",
        exact: true,
      });
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("aria-label") ===
          "Preview Updated detail.webp",
      );
      if (!(await renamedTrigger.isVisible()))
        throw Error("Focus returned to a hidden preview trigger");
      results.push({ width, passed: true });
    }
    if (errors.length) throw Error(errors.join("; "));
    return results;
  } finally {
    await context.close();
  }
}
