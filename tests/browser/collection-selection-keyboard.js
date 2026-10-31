// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function collectionSelectionKeyboard(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  try {
    for (const width of [1440, 320]) {
      for (const mode of ["List view", "Grid view"]) {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(origin);
        await page.getByLabel(mode, { exact: true }).click();
        await page.setViewportSize({ width, height: 900 });
        // biome-ignore lint/performance/useDomNodeTextContent: Playwright Locator.innerText() reads the rendered label under test; this is not a DOM property access.
        const title = await page.getByRole("heading", { level: 1 }).innerText();
        const noun = title === "Projects" ? "project" : "post";
        await page.getByRole("button", { name: "Select", exact: true }).click();
        const checkbox = page
          .getByRole("checkbox", { name: /^Select (?!visible )/ })
          .filter({ visible: true })
          .first();
        const hasFocusableAncestor = await checkbox.evaluate((element) => {
          for (
            let parent = element.parentElement;
            parent && parent !== document.body;
            parent = parent.parentElement
          ) {
            if (
              parent.tabIndex >= 0 ||
              parent.getAttribute("role") === "button"
            )
              return true;
          }
          return false;
        });
        assert(
          !hasFocusableAncestor,
          "Selection adds a focusable card wrapper",
        );
        await checkbox.focus();
        await page.keyboard.press("Space");
        await page.getByText(`1 ${noun} selected`, { exact: true }).waitFor();
        assert(await checkbox.isChecked(), "Space did not check exactly once");
        const menu = page
          .getByRole("button", { name: /^Open actions for / })
          .filter({ visible: true })
          .first();
        await menu.focus();
        await page.keyboard.press("Enter");
        await page.getByRole("menu").waitFor();
        await page.getByText(`1 ${noun} selected`, { exact: true }).waitFor();
        await page.keyboard.press("Escape");
        assert(
          await menu.evaluate((element) => document.activeElement === element),
          "Menu did not restore trigger focus",
        );
        await checkbox.focus();
        await page.keyboard.press("Space");
        await page.getByText(`0 ${noun}s selected`, { exact: true }).waitFor();
        assert(
          !(await checkbox.isChecked()),
          "Space did not uncheck exactly once",
        );
        assert(
          new URL(page.url()).pathname === "/",
          "Keyboard selection navigated away",
        );
      }
    }
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      widths: [1440, 320],
      views: ["list", "grid"],
      checks: [
        "no card tab stop",
        "Space selects once",
        "menu Enter/Escape",
        "focus return",
        "no navigation",
      ],
    };
  } finally {
    await context.close();
  }
}
