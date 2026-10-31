async function assetSelectionKeyboard(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  try {
    for (const width of [1440, 320]) {
      for (const mode of ["Grid view", "List view"]) {
        await page.setViewportSize({ width: 1440, height: 950 });
        await page.goto(origin);
        const gallery =
          (await page.getByRole("heading", { level: 1 }).innerText()) ===
          "Gallery";
        await page.getByRole("button", { name: mode, exact: true }).click();
        await page.setViewportSize({ width, height: 950 });
        const preview = page
          .getByRole("button", {
            name: gallery ? /(^Preview |A quiet composition)/ : /^Preview /,
          })
          .filter({ visible: true })
          .first();

        assert(
          await preview.evaluate((element) => element.tabIndex === 0),
          "Normal preview is missing from Tab order",
        );
        await page
          .getByRole("button", {
            name: gallery ? "Select" : "Select media",
            exact: true,
          })
          .filter({ visible: true })
          .click();
        const checkbox = page
          .getByRole("checkbox", { name: /^Select / })
          .filter({ visible: true })
          .first();
        const container = await checkbox.evaluateHandle((element) => {
          let parent = element.parentElement;
          while (parent && !parent.querySelector('[aria-haspopup="menu"]'))
            parent = parent.parentElement;
          return parent;
        });
        const firstControl = await container.evaluate((element) => {
          const controls = [
            ...element.querySelectorAll('button, [role="checkbox"]'),
          ].filter((button) => button.tabIndex >= 0 && !button.disabled);
          return controls.map((button) => ({
            role: button.getAttribute("role"),
            menu: button.getAttribute("aria-haspopup"),
          }));
        });
        assert(
          firstControl.length >= 2 &&
            firstControl.every(
              (control) =>
                control.role === "checkbox" || control.menu === "menu",
            ),
          `Batch has extra card/title Tab stops: ${JSON.stringify(firstControl)}`,
        );
        await checkbox.focus();
        await page.keyboard.press("Space");
        assert(await checkbox.isChecked(), "Space did not select once");
        await page.keyboard.press("Tab");
        assert(
          await page.evaluate(
            () =>
              document.activeElement?.getAttribute("aria-haspopup") === "menu",
          ),
          "Tab did not move directly from checkbox to menu",
        );
        await page.keyboard.press("Enter");
        await page.getByRole("menu").waitFor();
        await page.keyboard.press("Escape");
        assert(await checkbox.isChecked(), "Opening menu toggled selection");
        await checkbox.focus();
        await page.keyboard.press("Space");
        assert(!(await checkbox.isChecked()), "Space did not unselect once");
        const pointer = page
          .getByRole("button", {
            name: gallery ? /^Toggle selection for / : /^Select /,
          })
          .filter({ visible: true })
          .first();
        if (await pointer.count()) {
          await pointer.click();
          assert(
            await checkbox.isChecked(),
            "Pointer selection stopped working",
          );
          await checkbox.uncheck();
        }
        await page
          .getByRole("button", {
            name: /^(Exit selection mode|Cancel|Clear selection)$/,
            exact: true,
          })
          .filter({ visible: true })
          .first()
          .click();
        assert(
          await preview.evaluate((element) => element.tabIndex === 0),
          "Preview Tab stop was not restored",
        );
      }
    }
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      widths: [1440, 320],
      views: ["grid", "list"],
      checks: [
        "ordinary preview Tab stop",
        "batch checkbox to menu",
        "Space and menu",
        "pointer selection",
        "restored Tab order",
      ],
    };
  } finally {
    await context.close();
  }
}
