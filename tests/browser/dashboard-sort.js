// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function dashboardSort(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const results = [];
  const assert = (value, message) => {
    if (!value) throw Error(message);
  };
  const visible = (locator) => locator.filter({ visible: true });
  const select = async (option) => {
    await visible(
      page.getByRole("combobox", { name: "Sort by", exact: true }),
    ).click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  const first = async (cfg) =>
    cfg.link
      ? visible(
          page.locator(`a[href*="/dashboard/${cfg.link}/"][href$="/edit"]`),
        )
          .first()
          // biome-ignore lint/performance/useDomNodeTextContent: Playwright Locator.innerText() reads the rendered label under test; this is not a DOM property access.
          .innerText()
      : page
          .getByRole("button", { name: /^Preview / })
          .first()
          .getAttribute("aria-label");
  try {
    for (const cfg of [
      {
        name: "Projects",
        port: 3197,
        field: "Title",
        direction: "asc",
        link: "projects",
        reorder: true,
      },
      {
        name: "Posts",
        port: 3198,
        field: "Title",
        direction: "desc",
        link: "posts",
      },
      {
        name: "Gallery",
        port: 3199,
        field: "Display order",
        direction: "asc",
        reorder: true,
      },
      {
        name: "Media Library",
        port: 3201,
        field: "File name",
        direction: "desc",
      },
    ]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`http://127.0.0.1:${cfg.port}`);
      await page
        .getByRole("heading", { name: cfg.name, exact: true })
        .waitFor();
      const action =
        cfg.direction === "asc" ? "Sort descending" : "Sort ascending";
      const styles = await visible(
        page.getByRole("combobox", { name: "Sort by", exact: true }),
      ).evaluate((element) => {
        const direction =
          element.parentElement.parentElement.nextElementSibling;
        const control = getComputedStyle(element),
          button = getComputedStyle(direction);
        return {
          selectBorder: control.borderTopColor,
          buttonBorder: button.borderTopColor,
          selectBackground: control.backgroundColor,
          buttonBackground: button.backgroundColor,
          selectHeight: element.getBoundingClientRect().height,
          buttonHeight: direction.getBoundingClientRect().height,
        };
      });
      assert(
        styles.selectBorder === styles.buttonBorder &&
          styles.selectBackground === styles.buttonBackground &&
          styles.selectHeight === 44 &&
          styles.buttonHeight === 44,
        `${cfg.name}: sort control styles differ ${JSON.stringify(styles)}`,
      );
      await select(cfg.field);
      const before = await first(cfg);
      await visible(
        page.getByRole("button", { name: action, exact: true }),
      ).click();
      const after = await first(cfg);
      assert(
        before !== after,
        `${cfg.name}: sorting direction did not reverse results`,
      );
      if (cfg.reorder) {
        await page
          .getByRole("button", { name: "Reorder", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Done reordering", exact: true })
          .click();
        assert(
          (await first(cfg)) === after,
          `${cfg.name}: reorder lost direction or field`,
        );
      }
      await page.screenshot({
        path: `task/dashboard-sort-consistency/${cfg.port}-desktop.png`,
      });
      await page.setViewportSize({ width: 320, height: 900 });
      await page.goto(`http://127.0.0.1:${cfg.port}`);
      await page.getByRole("button", { name: "Filters", exact: true }).click();
      await visible(
        page.getByRole("button", { name: action, exact: true }),
      ).click();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Filters", exact: true }).click();
      await visible(
        page.getByRole("button", { name: action, exact: true }),
      ).waitFor();
      await visible(
        page.getByRole("button", { name: action, exact: true }),
      ).click();
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
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${cfg.name}: mobile overflow`,
      );
      await page.screenshot({
        path: `task/dashboard-sort-consistency/${cfg.port}-mobile.png`,
      });
      results.push({ name: cfg.name, styles });
    }
    return {
      passed: true,
      checks: [
        "matching input border/background",
        "44px controls",
        "ascending and descending results",
        "reorder restoration",
        "staged mobile apply/cancel/reset",
      ],
      results,
    };
  } finally {
    await context.close();
  }
}
