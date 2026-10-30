async function dashboardGallery(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (value, message) => {
    if (!value) throw Error(message);
  };
  const fresh = async () => {
    await page.goto(origin);
    await page.getByRole("heading", { name: "Gallery", exact: true }).waitFor();
  };
  const select = async (name, option) => {
    await page
      .getByRole("combobox", { name, exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  const firstTitle =
    "A quiet composition with a deliberately long caption that should remain fully readable in the preview drawer";
  try {
    for (const width of [1440, 1024, 768, 390, 320, 275]) {
      await page.setViewportSize({ width, height: 900 });
      await fresh();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Document overflow ${width}`,
      );
      await page
        .getByRole("button", { name: "Next page", exact: true })
        .scrollIntoViewIfNeeded();
      const controls = await page
        .getByRole("button", { name: /Previous page|Next page|Items per page/ })
        .filter({ visible: true })
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return { left: r.left, right: r.right };
          }),
        );
      assert(
        controls.every((r) => r.left >= 0 && r.right <= width),
        `Pagination clipped ${width}`,
      );
      await page.evaluate(() => scrollTo(0, 0));
      if ([1440, 390, 320].includes(width))
        await page.screenshot({
          path: `task/dashboard-gallery-review/updated-gallery-${width}.png`,
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await fresh();
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await select("Visibility", "Hidden");
    await select("Sort by", "Date created");
    await page
      .getByRole("button", { name: "Sort descending", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Filters (2)", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Filters (2)", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reset filters", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Filters (2)", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Clear filters and search", exact: true })
      .click();
    await page.getByRole("button", { name: "Add image", exact: true }).click();
    const caption = page.getByRole("textbox", { name: /^Caption/ });
    await caption.fill("Keep this draft");

    await page.keyboard.press("Escape");
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-cancel"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    assert(
      (await caption.inputValue()) === "Keep this draft",
      "Dirty cancel lost draft",
    );

    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await page
      .getByRole("dialog", { name: "Add Gallery Item", exact: true })
      .waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await fresh();
    await page
      .getByRole("button", { name: "Select", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Deselect page", exact: true })
      .click();
    await page.getByText("0 items selected", { exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Deselect page", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .waitFor();
    await page
      .getByText("12 selected outside this page.", { exact: false })
      .waitFor();
    await page.getByText("Review selected images", { exact: true }).click();
    await page
      .getByRole("list", { name: "Selected images" })
      .getByText(firstTitle, { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("list", { name: "Images to delete" })
      .getByText(firstTitle, { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Cancel", exact: true })
      .filter({ visible: true })
      .last()
      .click();
    await page.evaluate(() => (window.galleryReject = "hide"));
    await page.getByRole("button", { name: "Hide", exact: true }).click();
    await page
      .getByText(
        "Could not complete this action. Your selection is retained; try again.",
        { exact: true },
      )
      .waitFor();
    await page.getByText("12 items selected", { exact: true }).waitFor();
    await fresh();
    await page
      .getByRole("button", { name: `Preview ${firstTitle}`, exact: true })
      .click();
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => {
        throw Error("Fixture clipboard denial");
      };
    });
    await page.getByRole("button", { name: "Copy URL", exact: true }).click();
    await page
      .getByText(
        "Could not copy the URL. Use View to open the image and copy its address.",
        { exact: true },
      )
      .waitFor();
    await page.getByRole("button", { name: "Edit Item", exact: true }).click();
    await page
      .getByRole("textbox", { name: /^Caption/ })
      .fill("Updated drawer caption");
    await page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Updated drawer caption", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Edit Item", exact: true }).click();
    assert(
      (await page.getByRole("textbox", { name: /^Caption/ }).inputValue()) ===
        "Updated drawer caption",
      "Editor retained stale data",
    );
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", {
        name: "Open actions for Updated drawer caption",
        exact: true,
      })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Delete item", exact: true })
      .click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Gallery item detail", exact: true })
      .waitFor({ state: "hidden" });
    assert(
      (await page
        .getByRole("heading", { name: "Updated drawer caption", exact: true })
        .count()) === 0,
      "Deleted drawer remained open",
    );
    await fresh();
    await page
      .getByRole("textbox", { name: "Search gallery items", exact: true })
      .filter({ visible: true })
      .fill("Image 020");
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    await page
      .getByRole("button", { name: "Drag Image 002 to reorder", exact: true })
      .waitFor();
    const beforeOrder = await page
      .getByRole("button", { name: /^Drag .* to reorder$/ })
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label")),
      );
    await page.evaluate(() => (window.galleryReject = "reorder"));
    const handle = page.getByRole("button", {
      name: "Drag Image 002 to reorder",
      exact: true,
    });
    await handle.focus();
    await page.keyboard.press("Space");
    await page
      .getByText("Image 002, position 2 of 125.", { exact: true })
      .waitFor();
    await page.keyboard.press("ArrowDown");
    await page
      .getByText("Image 002, position 3 of 125.", { exact: true })
      .waitFor();
    await page.keyboard.press("Space");
    await page
      .getByText(
        "Could not save the order. The previous order has been restored.",
        { exact: true },
      )
      .waitFor();
    const names = await page
      .getByRole("button", { name: /^Drag .* to reorder$/ })
      .allTextContents();
    assert(names.length === 125, "Reorder omitted full collection");
    const afterOrder = await page
      .getByRole("button", { name: /^Drag .* to reorder$/ })
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("aria-label")),
      );
    assert(
      JSON.stringify(beforeOrder) === JSON.stringify(afterOrder),
      "Failed reorder did not restore row order",
    );
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .click();
    assert(
      (await page
        .getByRole("textbox", { name: "Search gallery items", exact: true })
        .filter({ visible: true })
        .inputValue()) === "Image 020",
      "Reorder failed to restore search",
    );
    await fresh();
    await page
      .getByRole("button", { name: "Items per page", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("menuitemradio", { name: "48", exact: true }).click();
    await page
      .getByRole("button", { name: "Select", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page.getByText("100 items selected", { exact: true }).waitFor();
    await page
      .getByText("Select no more than 100 images at a time.", { exact: true })
      .waitFor();
    assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
    return {
      passed: true,
      widths: [1440, 1024, 768, 390, 320, 275],
      checks: [
        "pagination bounds",
        "staged mobile filters",
        "draft guard",
        "cross-page selection scope",
        "transport failure retention",
        "drawer reconciliation",
        "delete closes preview",
        "keyboard reorder rollback",
        "working view restoration",
      ],
    };
  } finally {
    await context.close();
  }
}
