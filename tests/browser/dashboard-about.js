// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function dashboardAbout(page) {
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  const intro = () =>
    page.getByRole("textbox", { name: "About Intro (English)", exact: true });
  await intro().fill("An unsaved English introduction");
  await page
    .getByRole("textbox", { name: "How I Work (English)", exact: true })
    .fill("An unsaved process description");
  await page.getByRole("tab", { name: "Experience", exact: true }).click();
  await page.getByRole("tab", { name: "Content", exact: true }).click();
  assert(
    (await intro().inputValue()) === "An unsaved English introduction",
    "Draft lost across outer tabs",
  );
  await page.getByRole("tab", { name: "Indonesia", exact: true }).click();
  await page
    .getByRole("textbox", { name: "About Intro (Indonesia)", exact: true })
    .fill("Perkenalan yang belum disimpan");
  await page.getByRole("tab", { name: "English", exact: true }).click();
  assert(
    (
      await page
        .getByRole("textbox", { name: "How I Work (English)", exact: true })
        .textContent()
    ).includes("unsaved process"),
    "Rich-text draft lost across languages",
  );
  await page.getByRole("button", { name: "Save Content", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "All changes saved" })
    .waitFor();
  assert(
    (await page.evaluate(() => window.aboutSaved)).introId ===
      "Perkenalan yang belum disimpan",
    "Save omitted the other language",
  );
  await intro().fill("Discard this intro");
  await page
    .getByRole("textbox", { name: "How I Work (English)", exact: true })
    .fill("Discard this rich-text edit");
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .last()
    .locator('[data-slot="alert-dialog-action"]')
    .click();
  await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
  assert(
    (await intro().inputValue()) === "An unsaved English introduction",
    "Discard did not restore saved content",
  );
  await page.waitForFunction(() =>
    document
      .querySelector("#howIWorkEn")
      ?.textContent.includes("unsaved process"),
  );
  await page.getByRole("tab", { name: "Skills", exact: true }).click();
  const frontend = page.getByRole("region", {
    name: "Frontend skills",
    exact: true,
  });
  await frontend
    .getByRole("button", { name: "Add skill", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Name *", exact: true })
    .fill("New skill");
  await dialog.getByRole("combobox", { name: "Category", exact: true }).click();
  await page.getByRole("option", { name: "Backend", exact: true }).click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .last()
    .locator('[data-slot="alert-dialog-cancel"]')
    .click();
  await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
  assert(
    await dialog.isVisible(),
    "Dirty dialog closed without retaining cancelled discard",
  );
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  const action = await page.evaluate(() => window.aboutLastAction);
  assert(
    action.name === "CreateSkill" && action.args[0].categoryId === "backend",
    "Selected category was ignored",
  );
  const handle = frontend.getByRole("button", {
    name: "Drag React to reorder",
    exact: true,
  });
  await page.evaluate(() => {
    window.failAboutReorder = true;
  });
  await handle.focus();
  await handle.press("Space");
  await page.waitForTimeout(120);
  await handle.press("ArrowDown");
  await page.waitForTimeout(120);
  await handle.press("Space");
  await page.waitForTimeout(120);
  await page.waitForFunction(
    () => window.aboutLastAction?.name === "ReorderSkills",
  );

  const labelOrder = await frontend
    .getByRole("button", { name: /^Drag .+ to reorder$/ })
    .allTextContents();
  assert(labelOrder.length === 2, "Missing named drag controls");
  assert(
    (await frontend
      .getByRole("button", { name: /^Drag .+ to reorder$/ })
      .first()
      .getAttribute("aria-label")) === "Drag React to reorder",
    "Failed reorder did not roll back",
  );
  const widths = [1440, 768, 360, 320];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const tab of ["Content", "Experience", "Education", "Skills"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${tab} overflows at ${width}px`,
      );
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `task/dashboard-about-review/about-${tab.toLowerCase()}-${width}.png`,
        fullPage: true,
      });
    }
  }
  return {
    passed: true,
    widths,
    checks: [
      "bilingual draft retention",
      "save/discard",
      "category selection",
      "dirty dialog cancellation",
      "keyboard reorder rollback",
      "responsive overflow",
    ],
  };
}
