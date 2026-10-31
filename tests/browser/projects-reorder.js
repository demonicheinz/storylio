// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function projectsReorder(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const first = "Nebula Commerce with a deliberately long project name";
  const drag = async (title, direction = "ArrowDown") => {
    const handle = page.getByRole("button", {
      name: `Drag ${title} to reorder`,
      exact: true,
    });
    await page.waitForFunction((title) => {
      const button = document.querySelector(
        `button[aria-label="Drag ${title} to reorder"]`,
      );
      return button && !button.disabled;
    }, title);
    await handle.focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(
      (title) =>
        document
          .querySelector(`button[aria-label="Drag ${title} to reorder"]`)
          ?.getAttribute("aria-pressed") === "true",
      title,
    );
    await page.keyboard.press(direction);
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.keyboard.press("Space");
  };
  const firstTitle = () => page.locator("h2:visible").first().textContent();
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    await page
      .getByRole("button", { name: `Drag ${first} to reorder`, exact: true })
      .waitFor();
    await page.evaluate(() => {
      window.failProjectReorder = true;
    });
    await drag(first);
    await page.waitForFunction(() =>
      window.projectCalls?.some((call) => call.name === "reorder"),
    );
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("h2")].find(
          (element) => element.getBoundingClientRect().height,
        )?.textContent ===
        "Nebula Commerce with a deliberately long project name",
    );
    if ((await firstTitle()) !== first)
      throw Error("Failed keyboard reorder did not restore previous order");
    const failed = await page.evaluate(
      () =>
        window.projectCalls.filter((call) => call.name === "reorder").at(-1)
          .args[0],
    );
    if (
      failed.length !== 85 ||
      failed[0].id !== "project-1" ||
      failed[1].id !== "project-0" ||
      failed.some((item, index) => item.order !== index)
    )
      throw Error("Reorder did not send the full canonical order");
    await page.evaluate(() => {
      window.failProjectReorder = false;
    });
    await drag(first);
    await page.waitForFunction(
      () =>
        window.projectCalls.filter((call) => call.name === "reorder").length ===
        2,
    );
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("h2")].find(
          (element) => element.getBoundingClientRect().height,
        )?.textContent === "Storylio",
    );
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .click();
    if (await page.getByRole("button", { name: /^Drag / }).count())
      throw Error("Sortable handles remained outside reorder mode");
    await page.getByRole("button", { name: "Select", exact: true }).click();
    if (await page.getByRole("link", { name: "Storylio", exact: true }).count())
      throw Error("Selection title still navigates");
    await page
      .getByRole("checkbox", { name: "Select Storylio", exact: true })
      .click();
    await page.getByText("1 project selected", { exact: true }).waitFor();
    if (errors.length) throw Error(errors.join("; "));
    return {
      passed: true,
      checks: [
        "keyboard reorder failure rollback",
        "canonical full-order payload",
        "keyboard reorder success",
        "passive list without handles",
        "selection without navigation",
      ],
    };
  } finally {
    await context.close();
  }
}
