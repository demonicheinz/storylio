async function dashboardMedia(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const fresh = async () => {
    await page.goto(origin);
    await page
      .getByRole("heading", { name: "Media Library", exact: true })
      .waitFor();
  };
  const first =
    "long-descriptive-filename-for-an-interface-design-image-with-context.webp";
  const menu = async (name) =>
    page
      .getByRole("button", { name: `Open actions for ${name}`, exact: true })
      .filter({ visible: true })
      .click();
  try {
    for (const width of [1440, 1024, 768, 390, 320, 275]) {
      await page.setViewportSize({ width, height: 900 });
      await fresh();
      assert(
        (await page
          .getByRole("heading", { name: "Upload images", exact: true })
          .count()) === 0,
        "Queue visible before Upload or drag",
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Media overflow ${width}`,
      );
      const bounds = await page
        .getByRole("button", { name: /Previous page|Next page|Items per page/ })
        .filter({ visible: true })
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return { left: r.left, right: r.right };
          }),
        );
      assert(
        bounds.every((r) => r.left >= 0 && r.right <= width),
        `Media pagination clipped ${width}`,
      );
      if ([1440, 390, 320].includes(width))
        await page.screenshot({
          path: `task/dashboard-media-review/updated-grid-${width}.png`,
        });
    }
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Sort by", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("option", { name: "Format", exact: true }).click();
    await page
      .getByRole("button", { name: "Sort ascending", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Filters (1)", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Filters (1)", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reset filters", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Filters (1)", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Clear filters and search", exact: true })
      .first()
      .click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await fresh();
    await page
      .getByRole("combobox", { name: "Sort by", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("option", { name: "Format", exact: true }).click();
    await page
      .getByRole("button", { name: "Sort ascending", exact: true })
      .filter({ visible: true })
      .click();
    const firstExtension = await page
      .locator("[data-media-extension]")
      .first()
      .innerText();
    assert(firstExtension === ".jpg", "Format ascending order is incorrect");
    await page
      .getByRole("button", { name: "Sort descending", exact: true })
      .filter({ visible: true })
      .click();
    assert(
      (await page.locator("[data-media-extension]").first().innerText()) ===
        ".webp",
      "Format descending order is incorrect",
    );
    await page
      .getByRole("button", { name: "Clear filters and search", exact: true })
      .first()
      .click();
    await page.getByLabel("List view", { exact: true }).click();
    await page.locator("[data-media-list-thumbnail]").first().waitFor();
    const geometry = await page.evaluate(() => {
      const header = document.querySelector("[data-media-list-header]");
      const image = document.querySelector("[data-media-list-thumbnail]");
      return {
        header: getComputedStyle(header).gridTemplateColumns,
        row: getComputedStyle(image.parentElement.parentElement)
          .gridTemplateColumns,
        width: image.getBoundingClientRect().width,
        height: image.getBoundingClientRect().height,
      };
    });
    assert(
      geometry.header === geometry.row &&
        geometry.width === 112 &&
        geometry.height === 64,
      "Media list header/thumbnail mismatch",
    );
    assert(
      (await page
        .locator("[data-media-list-header]")
        .getByText("Type", { exact: true })
        .count()) === 0,
      "Type column remains after simplification",
    );
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const extension = await page
        .locator("[data-media-extension]")
        .first()
        .evaluate((element) => ({
          left: element.getBoundingClientRect().left,
          right: element.getBoundingClientRect().right,
          text: element.textContent,
        }));
      assert(
        extension.left >= 0 &&
          extension.right <= width &&
          extension.text === ".webp",
        `File extension clipped ${width}`,
      );
      await page.screenshot({
        path: `task/dashboard-media-review/updated-list-${width}.png`,
      });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({
      path: "task/dashboard-media-review/updated-list-1440.png",
    });
    await fresh();
    await menu(first);
    await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
    const input = page.getByRole("textbox", { name: "File name", exact: true });
    await input.fill("Keep this draft.webp");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.keyboard.press("Escape");
    assert(
      (await input.inputValue()) === "Keep this draft.webp",
      "Rename discarded a protected draft",
    );
    await page.evaluate(() => (window.mediaReject = "rename"));
    await page.getByRole("button", { name: "Save name", exact: true }).click();
    await page
      .getByText(
        "Could not rename this image. Your input is kept; try again.",
        { exact: true },
      )
      .waitFor();
    await page.evaluate(() => (window.mediaReject = undefined));
    await input.fill("Renamed image.webp");
    await page.getByRole("button", { name: "Save name", exact: true }).click();
    await page
      .getByRole("heading", { name: "Renamed image.webp", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Preview Renamed image.webp", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Media details", exact: true })
      .waitFor();
    await page.evaluate(
      () =>
        (navigator.clipboard.writeText = async () => {
          throw Error("Fixture clipboard denial");
        }),
    );
    await page
      .getByRole("button", { name: "Copy URL", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByText(
        "Could not copy the URL. Select Image URL in the details to copy it manually.",
        { exact: true },
      )
      .waitFor();
    await page
      .getByRole("textbox", { name: "Image URL", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Download", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByText("Fixture request failed. Try again.", { exact: true })
      .waitFor();
    assert(
      new URL(page.url()).pathname === "/",
      "Download failure left the library",
    );
    await page
      .getByRole("button", { name: "Delete", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Delete image", exact: true })
      .click();
    await page
      .getByText("Media is still in use by 1 post cover.", { exact: true })
      .waitFor();
    assert(
      await page.getByRole("alertdialog").isVisible(),
      "Failed delete dismissed its dialog",
    );
    await page
      .getByRole("button", { name: "Cancel", exact: true })
      .filter({ visible: true })
      .click();
    await page.keyboard.press("Escape");
    await fresh();
    await page
      .getByRole("button", { name: "Select media", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Deselect page", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await page
      .getByText("12 selected outside this page.", { exact: false })
      .waitFor();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Review deletion", exact: true })
      .click();
    await page
      .getByRole("list", { name: "Images to delete", exact: true })
      .getByText("image-001.png", { exact: true })
      .waitFor();
    await page
      .getByRole("list", { name: "Protected images", exact: true })
      .getByText(first, { exact: false })
      .waitFor();
    await page.evaluate(() => (window.mediaFailedIds = ["media-1"]));
    await page
      .getByRole("button", { name: "Delete 16 images", exact: true })
      .click();
    await page.getByText(/15 images deleted\. Could not delete/).waitFor();
    await page.getByText("9 selected", { exact: true }).waitFor();
    await page.evaluate(() => (window.mediaFailedIds = []));
    await page
      .getByRole("button", { name: "Delete 1 image", exact: true })
      .click();
    await page.getByRole("alertdialog").waitFor({ state: "hidden" });
    await page.getByText("8 selected", { exact: true }).waitFor();
    assert(errors.length === 0, `Media runtime errors: ${errors.join("; ")}`);
    return {
      passed: true,
      widths: [1440, 1024, 768, 390, 320, 275],
      checks: [
        "collapsed uploads",
        "filter staging",
        "bounded pagination",
        "list alignment",
        "rename guard/retry",
        "clipboard recovery",
        "download recovery",
        "blocked delete retention",
        "cross-page selection",
        "partial deletion reconciliation",
      ],
    };
  } finally {
    await context.close();
  }
}
