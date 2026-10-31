// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function collectionLayout(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const assert = (value, message) => {
    if (!value) throw Error(message);
  };
  const results = [];
  try {
    for (const route of [
      {
        port: 3197,
        title: "Projects",
        search: "Search projects",
        query: "Storylio",
        noun: "project",
      },
      {
        port: 3198,
        title: "Posts",
        search: "Search posts",
        query: "Post 10",
        noun: "post",
      },
      {
        port: 3199,
        title: "Gallery",
        search: "Search gallery items",
        query: "Image 002",
        noun: "image",
      },
    ]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`http://127.0.0.1:${route.port}`);
      await page
        .getByRole("heading", { name: route.title, exact: true })
        .waitFor();
      const statuses = await page.locator('[role="status"]').allTextContents();
      assert(
        !statuses.some((value) =>
          /\d+ of \d+ (projects|posts|images)/.test(value),
        ),
        `${route.title}: duplicate default count`,
      );
      await page
        .getByRole("textbox", { name: route.search, exact: true })
        .filter({ visible: true })
        .fill(route.query);
      await page.getByText(`1 ${route.noun} found`, { exact: true }).waitFor();
      await page
        .getByRole("button", { name: "Clear filters and search", exact: true })
        .filter({ visible: true })
        .first()
        .click();
      assert(
        (await page
          .getByText(`1 ${route.noun} found`, { exact: true })
          .count()) === 0,
        `${route.title}: result context remains after reset`,
      );
      results.push(route.title);
    }
    await page.getByLabel("List view", { exact: true }).click();
    const list = page.locator("[data-gallery-list-header]");
    await list.waitFor();
    assert(
      !(await list.getByText("Position", { exact: true }).count()),
      "Position appears outside reorder",
    );
    const geometry = await page.evaluate(() => {
      const header = document.querySelector("[data-gallery-list-header]");
      const image = document.querySelector("[data-gallery-list-thumbnail]");
      const row = image.parentElement.parentElement;
      const r = image.getBoundingClientRect();
      return {
        headerColumns: getComputedStyle(header).gridTemplateColumns,
        rowColumns: getComputedStyle(row).gridTemplateColumns,
        width: r.width,
        height: r.height,
        titleLeft:
          image.nextElementSibling?.getBoundingClientRect().left ??
          image.parentElement.children[1].getBoundingClientRect().left,
        headerTitleLeft:
          header.firstElementChild.getBoundingClientRect().left +
          parseFloat(getComputedStyle(header.firstElementChild).paddingLeft),
      };
    });
    assert(
      geometry.headerColumns === geometry.rowColumns,
      "Gallery header and row tracks differ",
    );
    assert(
      geometry.width === 112 && geometry.height === 64,
      "Gallery list thumbnail size differs",
    );
    assert(
      Math.abs(geometry.titleLeft - geometry.headerTitleLeft) < 1,
      "Gallery image heading is not aligned with title",
    );
    const actions = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")];
      return ["Reorder", "Add image"].map((text) =>
        buttons
          .find((button) => button.textContent.trim() === text)
          ?.getBoundingClientRect()
          .toJSON(),
      );
    });
    assert(
      actions[0].left < actions[1].left &&
        Math.abs(actions[0].top - actions[1].top) < 1,
      "Reorder is not beside Add image",
    );
    await page.screenshot({
      path: "task/dashboard-gallery-review/list-desktop.png",
    });
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    await list.getByText("Position", { exact: true }).waitFor();
    assert(
      await page
        .getByRole("button", { name: "Add image", exact: true })
        .isDisabled(),
      "Add image remains active during reorder",
    );
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .click();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Gallery list overflow ${width}`,
      );
      await page.screenshot({
        path: `task/dashboard-gallery-review/list-${width}.png`,
      });
    }
    return { passed: true, resultCounts: results, galleryHeader: geometry };
  } finally {
    await context.close();
  }
}
