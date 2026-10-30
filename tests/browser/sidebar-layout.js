async function sidebarLayout(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  await context.addInitScript(() =>
    localStorage.removeItem("storylio.sidebar"),
  );
  const page = await context.newPage();
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  const results = [];
  try {
    for (const width of [1440, 1024, 768]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(new URL(sessionPage.url()).origin);
      await page.locator('[data-slot="sidebar-inner"]').waitFor();
      const sidebar = page.locator('[data-slot="sidebar"]').first();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-slot="sidebar"]')
            ?.getAttribute("data-state") ===
          (innerWidth >= 1024 ? "expanded" : "collapsed"),
      );
      if ((await sidebar.getAttribute("data-state")) === "expanded")
        await page
          .getByRole("button", { name: "Toggle Sidebar", exact: true })
          .first()
          .click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-slot="sidebar-container"]')
            ?.getBoundingClientRect().width < 70,
      );
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 250)),
      );
      const geometry = await page.evaluate(() => {
        const rail = document
          .querySelector('[data-slot="sidebar-inner"]')
          .getBoundingClientRect();
        const center = rail.left + rail.width / 2;
        return {
          width: innerWidth,
          railWidth: rail.width,
          buttons: [
            ...document.querySelectorAll('[data-sidebar="menu-button"]'),
          ]
            .filter((el) => el.getBoundingClientRect().height)
            .map((el) => {
              const button = el.getBoundingClientRect();
              const child = el.firstElementChild.getBoundingClientRect();
              return {
                label: el.getAttribute("aria-label") ?? el.textContent,
                buttonWidth: button.width,
                buttonHeight: button.height,
                buttonOffset: Math.abs(button.left + button.width / 2 - center),
                iconOffset: Math.abs(child.left + child.width / 2 - center),
              };
            }),
        };
      });
      assert(geometry.buttons.length >= 11, "Missing actual sidebar controls");
      assert(
        geometry.buttons.every((b) => b.buttonOffset <= 1 && b.iconOffset <= 1),
        "Collapsed icons off center: " + JSON.stringify(geometry),
      );
      assert(
        geometry.buttons.every(
          (b) => b.buttonWidth >= 44 && b.buttonHeight >= 44,
        ),
        "Collapsed controls must have 44px targets",
      );
      results.push(geometry);
      await page.screenshot({
        path: `task/sidebar-alignment/sidebar-${width}.png`,
        caret: "initial",
      });
      await page
        .getByRole("button", { name: "Toggle Sidebar", exact: true })
        .first()
        .click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-slot="sidebar-container"]')
            ?.getBoundingClientRect().width > 250,
      );
      assert(
        await page
          .getByRole("link", { name: "About", exact: true })
          .isVisible(),
        "Expanded labels missing",
      );
    }
    return { passed: true, results };
  } finally {
    await context.close();
  }
}
