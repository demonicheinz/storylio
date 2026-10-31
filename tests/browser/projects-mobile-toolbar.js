// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function projectsMobileToolbar(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const results = [];
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const rect = (el) =>
    el.evaluate((element) => element.getBoundingClientRect().toJSON());
  try {
    for (const width of [767, 390, 320, 280, 275, 260, 240]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      const search = page
        .getByRole("textbox", { name: "Search projects", exact: true })
        .filter({ visible: true });
      await search.waitFor();
      const filter = page.getByRole("button", { name: "Filters", exact: true });
      const select = page.getByRole("button", { name: "Select", exact: true });
      const [input, f, s] = await Promise.all([
        rect(search),
        rect(filter),
        rect(select),
      ]);
      const twoRows = width <= 275;
      assert(
        f.width === 44 && f.height === 44 && s.width === 44 && s.height === 44,
        `Invalid touch targets at ${width}px`,
      );
      assert(Math.abs(f.top - s.top) < 1, `Filter/select split at ${width}px`);
      assert(
        twoRows ? f.top >= input.bottom : Math.abs(f.top - input.top) < 1,
        `Unexpected toolbar rows at ${width}px`,
      );
      assert(
        input.width >= 110,
        `Search too narrow at ${width}px: ${input.width}`,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Horizontal overflow at ${width}px`,
      );
      assert(
        (await search.locator("..").locator("kbd").count()) === 0,
        "Mobile shortcut hint remains",
      );
      await search.fill("Storylio");
      await page.getByRole("link", { name: "Storylio", exact: true }).waitFor();
      results.push({ width, searchWidth: input.width, rows: twoRows ? 2 : 1 });
      if ([320, 275].includes(width))
        await page.screenshot({
          path: `task/dashboard-projects-review/mobile-toolbar-${width}.png`,
        });
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(origin);
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("option", { name: "Draft", exact: true }).click();
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    const active = page.getByRole("button", {
      name: "Filters (1)",
      exact: true,
    });
    await active.waitFor();
    assert(
      (await rect(active)).width === 44,
      "Active filter count changes button width",
    );
    assert(
      // biome-ignore lint/performance/useDomNodeTextContent: Playwright Locator.innerText() reads the rendered label under test; this is not a DOM property access.
      (await active.innerText()).trim() === "1",
      "Active filter count is not visible",
    );
    await page.getByRole("button", { name: "Select", exact: true }).click();
    const exit = page.getByRole("button", {
      name: "Exit selection mode",
      exact: true,
    });
    assert(
      (await exit.getAttribute("aria-pressed")) === "true",
      "Selection state is not exposed",
    );
    await exit.click();
    await page.getByRole("button", { name: "Select", exact: true }).waitFor();
    return {
      passed: true,
      results,
      checks: [
        "search",
        "44px controls",
        "active-filter count",
        "selection toggle",
        "container-based wrapping",
      ],
    };
  } finally {
    await context.close();
  }
}
